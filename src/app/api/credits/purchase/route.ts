// app/api/credits/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { CreditsService } from '@/services/credits.service';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(req: NextRequest) {
  console.log('💳 Credit Purchase API called');
  
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
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: 'Package ID required' },
        { status: 400 }
      );
    }

    // Get the credit package
    const creditPackage = CreditsService.getPackageById(packageId);
    
    if (!creditPackage) {
      return NextResponse.json(
        { success: false, error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    console.log('📦 Creating checkout session for package:', creditPackage.name);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: creditPackage.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment, not subscription
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/cancelled`,
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        packageId: packageId,
        credits: creditPackage.credits.toString(),
        package_name: creditPackage.name
      }
    });

    console.log('✅ Checkout session created:', session.id);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        packageDetails: {
          name: creditPackage.name,
          credits: creditPackage.credits,
          price: creditPackage.price
        }
      }
    });

  } catch (error) {
    console.error('💥 Credit Purchase API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create purchase session',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}