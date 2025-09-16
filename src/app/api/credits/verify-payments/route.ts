// app/api/credits/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { CreditsService } from '@/services/credits.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(req: NextRequest) {
  console.log('🔍 Payment verification API called');
  
  try {
    // Authenticate user
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

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

    console.log('✅ Payment verification successful:', verificationResult);

    return NextResponse.json({
      success: true,
      data: verificationResult
    });

  } catch (error) {
    console.error('💥 Payment verification error:', error);
    
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