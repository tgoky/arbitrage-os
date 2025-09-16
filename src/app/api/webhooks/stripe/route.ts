// app/api/webhooks/stripe/route.ts - COMPLETE WITH EMAIL NOTIFICATIONS
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { CreditsService } from '@/services/credits.service';
import { EmailService } from '@/services/email.service';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to get user details
async function getUserDetails(userId: string) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: user, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error || !user) {
      console.error('Failed to get user details:', error);
      return null;
    }
    
    return user.user;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}

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

    // Handle the checkout session completed event
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
      const amountPaid = (session.amount_total || 0) / 100; // Convert from cents

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

        // Send purchase confirmation email
        try {
          const user = await getUserDetails(userId);
          
          if (user && user.email) {
            await EmailService.sendPurchaseConfirmationEmail(
              user.email,
              user.user_metadata?.full_name || user.email.split('@')[0],
              packageName || 'Credit Package',
              credits,
              amountPaid,
              session.id
            );
            
            console.log('✅ Purchase confirmation email sent to:', user.email);
          } else {
            console.warn('⚠️ Could not send confirmation email - user details not found');
          }
        } catch (emailError) {
          console.error('❌ Failed to send confirmation email:', emailError);
          // Don't fail the webhook for email errors
        }

      } catch (error) {
        console.error('❌ Failed to add credits:', error);
        
        // Send admin alert for manual intervention
        try {
          await EmailService.sendAdminAlert(
            session.id,
            userId,
            packageName || 'Unknown Package',
            credits,
            error instanceof Error ? error.message : 'Unknown error'
          );
          
          console.log('✅ Admin alert sent for failed credit addition');
        } catch (alertError) {
          console.error('❌ Failed to send admin alert:', alertError);
        }
        
        // Log this for manual intervention
        console.error('🚨 MANUAL INTERVENTION REQUIRED:', {
          sessionId: session.id,
          userId,
          packageId,
          credits,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Still return 200 so Stripe doesn't retry
        // But you should have monitoring for these errors
        return NextResponse.json(
          { 
            error: 'Failed to add credits - logged for manual intervention',
            sessionId: session.id 
          },
          { status: 200 }
        );
      }
    }

    // Handle payment failed events
    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('❌ Payment failed or expired:', {
        sessionId: session.id,
        clientReferenceId: session.client_reference_id
      });

      // Send failure notification to user
      try {
        const userId = session.client_reference_id || session.metadata?.userId;
        const packageName = session.metadata?.package_name;
        
        if (userId) {
          const user = await getUserDetails(userId);
          
          if (user && user.email) {
            const reason = event.type === 'checkout.session.expired' 
              ? 'Payment session expired' 
              : 'Payment failed';
              
            await EmailService.sendPaymentFailureNotification(
              user.email,
              user.user_metadata?.full_name || user.email.split('@')[0],
              packageName || 'Credit Package',
              reason,
              session.id
            );
            
            console.log('✅ Payment failure notification sent to:', user.email);
          }
        }
      } catch (emailError) {
        console.error('❌ Failed to send failure notification:', emailError);
      }
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