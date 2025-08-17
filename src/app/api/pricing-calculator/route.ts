// app/api/pricing-calculator/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';  // Import at top
import { PricingCalculatorService } from '@/services/pricingCalculator.service';
import { validatePricingCalculatorInput } from '../../validators/pricingCalculator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

const RATE_LIMITS = {
  CALCULATION: {
    limit: 10, // 10 calculations per hour (expensive AI operation)
    window: 3600
  },
  LIST: {
    limit: 100, // 100 list requests per hour
    window: 3600
  }
};

// Robust authentication function
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Try with route handler client
    try {
      const supabase = createRouteHandlerClient({ 
        cookies: () => cookieStore 
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        return { user, error: null };
      }
      
      console.log('Route handler auth failed:', error);
    } catch (helperError) {
      console.warn('Route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: () => undefined,
            },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          return { user, error: null };
        }
        
        console.log('Token auth failed:', error);
      } catch (tokenError) {
        console.warn('Token auth error:', tokenError);
      }
    }
    
    // Method 3: Try with cookie validation
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;
              
              // Validate base64 cookies
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded); // Validate JSON
                  return cookie.value;
                } catch (e) {
                  console.warn(`Invalid cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
              console.warn(`Error reading cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    return { user, error };
    
  } catch (error) {
    console.error('All authentication methods failed:', error);
    return { user: null, error };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Use robust authentication
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('Auth failed in pricing calculator:', authError);
      
      // Clear corrupted cookies in response
      const response = NextResponse.json(
        { 
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

    // ✅ RATE LIMITING for pricing calculations
    const rateLimitResult = await rateLimit(
      `pricing_calculation:${user.id}`, 
      RATE_LIMITS.CALCULATION.limit, 
      RATE_LIMITS.CALCULATION.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Calculation rate limit exceeded. You can generate 10 pricing calculations per hour.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validatePricingCalculatorInput(body);
        
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    if (!validation.data) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // ✅ GET USER'S WORKSPACE with error handling
    let workspace;
    try {
      workspace = await prisma.workspace.findFirst({
        where: { user_id: user.id }
      });

      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: {
            user_id: user.id,
            name: 'Default Workspace',
            slug: 'default',
            description: 'Default workspace for pricing calculations'
          }
        });
      }
    } catch (dbError) {
      console.error('Database error getting/creating workspace:', dbError);
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    // ✅ SERVICE HANDLES BOTH GENERATION AND STORAGE with error handling
    let generatedPackage;
    let deliverableId;
    
    try {
      const pricingService = new PricingCalculatorService();
      const calculatorInput = { ...validation.data, userId: user.id };
      
      // Generate the package
      generatedPackage = await pricingService.generatePricingPackage(calculatorInput);
      
      // Save it via service (not API)
      deliverableId = await pricingService.savePricingCalculation(
        user.id,
        workspace.id,
        generatedPackage,
        calculatorInput
      );
    } catch (serviceError) {
      console.error('Service error:', serviceError);
      return NextResponse.json(
        { error: 'Failed to generate pricing package. Please try again.' },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE for analytics/billing with error handling
    try {
      await logUsage({
        userId: user.id,
        feature: 'pricing_calculator',
        tokens: generatedPackage.tokensUsed,
        timestamp: new Date(),
        metadata: {
          deliverableId,
          clientName: validation.data.clientName,
          annualSavings: validation.data.annualSavings,
          recommendedRetainer: generatedPackage.calculations?.recommendedRetainer,
          roiPercentage: generatedPackage.calculations?.roiPercentage,
          hoursPerWeek: validation.data.hoursPerWeek,
          experienceLevel: validation.data.experienceLevel
        }
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Usage logging failed:', logError);
    }

    return NextResponse.json({
      success: true,
      data: {
        calculationId: deliverableId,
        package: generatedPackage
      },
      meta: {
        tokensUsed: generatedPackage.tokensUsed,
        generationTime: generatedPackage.generationTime,
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Pricing Calculation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate pricing calculation. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Use robust authentication
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('Auth failed in pricing calculator GET:', authError);
      
      const response = NextResponse.json(
        { 
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

    // ✅ RATE LIMITING for listing
    const rateLimitResult = await rateLimit(
      `pricing_list:${user.id}`,
      RATE_LIMITS.LIST.limit,
      RATE_LIMITS.LIST.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'List rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    // ✅ USE SERVICE METHOD with error handling
    let calculations;
    try {
      const pricingService = new PricingCalculatorService();
      calculations = await pricingService.getUserPricingCalculations(
        user.id,
        workspaceId || undefined
      );
    } catch (serviceError) {
      console.error('Service error fetching calculations:', serviceError);
      return NextResponse.json(
        { error: 'Failed to fetch pricing calculations. Please try again.' },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE for listing with error handling
    try {
      await logUsage({
        userId: user.id,
        feature: 'pricing_list',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          workspaceId,
          resultCount: calculations.length
        }
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Usage logging failed:', logError);
    }

    return NextResponse.json({
      success: true,
      data: calculations,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Calculations Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing calculations' },
      { status: 500 }
    );
  }
}