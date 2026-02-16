// app/api/credits/verify-payment/route.ts - WITH ROBUST AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { CreditsService } from '@/services/credits.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Robust authentication (same as cold email route)
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('  Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('  User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('  Authentication error:', error);
    return { user: null, error };
  }
}



export async function POST(req: NextRequest) {
  console.log('🔍 Payment verification API called');
  
  try {
    // Use robust authentication
  const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('  Auth failed in payment verification:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token'
      ];
      
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path: '/',
        });
      });
      
      return response;
    }

    console.log('  User authenticated successfully:', user.id);

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying session:', sessionId);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product']
    });

    console.log('📋 Session details:', {
      id: session.id,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      clientReferenceId: session.client_reference_id
    });

    // Verify this session belongs to the authenticated user
    if (session.client_reference_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Session does not belong to authenticated user' },
        { status: 403 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment not completed',
          paymentStatus: session.payment_status 
        },
        { status: 400 }
      );
    }

    // Extract package information
    const packageId = session.metadata?.packageId;
    const credits = parseInt(session.metadata?.credits || '0');
    const packageName = session.metadata?.package_name;

    if (!packageId || !credits) {
      return NextResponse.json(
        { success: false, error: 'Invalid session metadata' },
        { status: 400 }
      );
    }

    // Get updated user credits to return current balance
    const creditsService = new CreditsService();
    const userCredits = await creditsService.getUserCredits(user.id);

    // Return verified payment details
    const verificationResult = {
      verified: true,
      session: {
        id: session.id,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_email,
        created: session.created
      },
      purchase: {
        packageId,
        packageName,
        credits,
        timestamp: new Date(session.created * 1000).toISOString()
      },
      userCredits: {
        currentBalance: userCredits.credits,
        freeLeadsRemaining: userCredits.freeLeadsAvailable,
        totalPurchased: userCredits.totalPurchased
      }
    };

    console.log('  Payment verification successful:', verificationResult);

    return NextResponse.json({
      success: true,
      data: verificationResult
    });

  } catch (error) {
    console.error('  Payment verification error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Stripe verification failed',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Payment verification failed',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}