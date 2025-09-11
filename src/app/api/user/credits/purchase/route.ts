// app/api/credits/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CreditsService } from '@/services/credits.service';
import { rateLimit } from '@/lib/rateLimit';

// Authentication function
async function getAuthenticatedUser(request?: NextRequest) {
  try {
    const cookieStore = cookies();
    
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: { get: () => undefined },
            }
          );
          
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (!error && user) {
            return { user, error: null };
          }
        } catch (tokenError) {
          console.warn('Token auth failed:', tokenError);
        }
      }
    }
    
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              try {
                const cookie = cookieStore.get(name);
                if (!cookie?.value) return undefined;
                
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded);
                    return cookie.value;
                  } catch (e) {
                    return undefined;
                  }
                }
                
                return cookie.value;
              } catch (error) {
                return undefined;
              }
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR auth failed:', ssrError);
    }
    
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (routeError) {
      console.warn('Route handler auth failed:', routeError);
    }
    
    return { user: null, error: new Error('Authentication failed') };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error };
  }
}

export async function POST(req: NextRequest) {
  console.log('Credit Purchase API called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    // Rate limiting for purchases - 5 per hour
    const rateLimitResult = await rateLimit(user.id, 5, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many purchase attempts. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { packageId, paymentIntentId, workspaceId } = body;

    if (!packageId) {
      return NextResponse.json({
        success: false,
        error: 'Package ID is required',
        code: 'MISSING_PACKAGE_ID'
      }, { status: 400 });
    }

    // Get package details
    const packages = CreditsService.getCreditPackages();
    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    
    if (!selectedPackage) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid package selected',
        code: 'INVALID_PACKAGE'
      }, { status: 400 });
    }

    // TODO: Verify payment with Stripe here
    // For now, we'll simulate successful payment verification
    console.log('Processing payment for package:', selectedPackage.name);
    
    // In production, you would:
    // 1. Verify the payment intent with Stripe
    // 2. Check payment status
    // 3. Only add credits if payment is confirmed
    
    // Simulate payment verification
    if (!paymentIntentId) {
      return NextResponse.json({
        success: false,
        error: 'Payment verification failed - no payment intent ID',
        code: 'PAYMENT_VERIFICATION_FAILED'
      }, { status: 400 });
    }

    // Add credits to user account
    const creditsService = new CreditsService();
    const result = await creditsService.addCredits(
      user.id,
      selectedPackage.credits,
      'purchase',
      workspaceId,
      paymentIntentId,
      `${selectedPackage.name} package purchase`
    );

    console.log('Credits added successfully:', {
      userId: user.id,
      creditsAdded: selectedPackage.credits,
      newBalance: result.credits
    });

    return NextResponse.json({
      success: true,
      data: {
        creditsAdded: selectedPackage.credits,
        packageName: selectedPackage.name,
        transactionId: paymentIntentId,
        newBalance: result.credits,
        totalPurchased: result.total_purchased
      }
    });

  } catch (error) {
    console.error('Credit Purchase API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process credit purchase',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}