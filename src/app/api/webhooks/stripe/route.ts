// app/api/webhooks/stripe/route.ts - SIMPLIFIED (Stripe handles receipts)
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { CreditsService } from '@/services/credits.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  console.log('🎣 Stripe webhook received');
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log('✅ Webhook event type:', event.type);

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('💳 Processing successful payment:', {
        sessionId: session.id,
        customerId: session.customer,
        clientReferenceId: session.client_reference_id,
        metadata: session.metadata
      });

      // Extract information from the session
      const userId = session.client_reference_id || session.metadata?.userId;
      const packageId = session.metadata?.packageId;
      const credits = parseInt(session.metadata?.credits || '0');
      const packageName = session.metadata?.package_name;

      if (!userId || !packageId || !credits) {
        console.error('❌ Missing required data in webhook:', {
          userId,
          packageId,
          credits
        });
        return NextResponse.json(
          { error: 'Missing required data in session metadata' },
          { status: 400 }
        );
      }

      try {
        // Add credits to the user's account
        const creditsService = new CreditsService();
        
        await creditsService.addCredits(
          userId,
          credits,
          'purchase',
          undefined, // workspaceId - optional for purchases
          session.id, // Use session ID as reference
          `Stripe purchase: ${packageName} (${credits} credits)`
        );

        console.log('✅ Credits added successfully:', {
          userId,
          credits,
          packageName,
          sessionId: session.id
        });

        // Note: Stripe automatically sends receipt email to customer_email
        // No need to send custom emails here

      } catch (error) {
        console.error('❌ Failed to add credits:', error);
        
        // Log for manual intervention
        console.error('🚨 MANUAL INTERVENTION REQUIRED:', {
          sessionId: session.id,
          userId,
          packageId,
          credits,
          customerEmail: session.customer_email,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });

        // TODO: Set up monitoring/alerting for these errors
        // Options:
        // 1. Send to error tracking service (Sentry, LogRocket)
        // 2. Send Slack notification
        // 3. Create database record to monitor
        // 4. Check Stripe Dashboard for failed webhooks

        // Still return 200 so Stripe doesn't retry
        return NextResponse.json(
          { 
            error: 'Failed to add credits - logged for manual intervention',
            sessionId: session.id 
          },
          { status: 200 }
        );
      }
    }

    // Handle payment failures (optional - Stripe also handles these notifications)
    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('❌ Payment failed or expired:', {
        sessionId: session.id,
        clientReferenceId: session.client_reference_id,
        customerEmail: session.customer_email
      });

      // Stripe already notifies customers about failed payments
      // Just log for your records
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('💥 Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}