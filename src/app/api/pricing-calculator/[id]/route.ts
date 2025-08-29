// app/api/pricing-calculator/[id]/route.ts - WITH RATE LIMITING, USAGE & ROBUST AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PricingCalculatorService } from '@/services/pricingCalculator.service';
import { validatePricingCalculatorInput } from '../../../validators/pricingCalculator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

const RATE_LIMITS = {
  GET: {
    limit: 100,
    window: 3600 // 1 hour
  },
  UPDATE: {
    limit: 20,
    window: 3600 // 1 hour
  },
  DELETE: {
    limit: 20,
    window: 3600 // 1 hour
  }
};

// ✅ ROBUST AUTHENTICATION (same as growth plan route)
// Use this IMPROVED 3-method approach in ALL routes
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header (most reliable for API calls)
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
    
    // Method 2: SSR cookies (FIXED cookie handling)
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
                
                // FIXED: Proper base64 cookie handling
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded); // Validate it's valid JSON
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
                    return undefined; // Skip corrupted cookies
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
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client (fallback)
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
    
    return { user: null, error: new Error('All authentication methods failed') };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error };
  }
}


function createAuthErrorResponse() {
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Pricing Calculator GET [id] API Route called for ID:', params.id);
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in pricing calculator GET [id]:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Pricing Calculator GET [id] user authenticated successfully:', user.id);
    const userId = user.id;
    const calculationId = params.id;

    // ✅ ADD RATE LIMITING for individual fetches
    const rateLimitResult = await rateLimit(
      `pricing_get:${userId}`,
      RATE_LIMITS.GET.limit,
      RATE_LIMITS.GET.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Pricing calculator read rate limit exceeded for user:', userId);
      return NextResponse.json(
        { 
          error: 'Fetch rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // ✅ FETCH FROM DELIVERABLES
    const { prisma } = await import('@/lib/prisma');
    const calculation = await prisma.deliverable.findFirst({
      where: {
        id: calculationId,
        user_id: userId,
        type: 'pricing_calculation'
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!calculation) {
      console.log('❌ Pricing calculation not found:', calculationId);
      return NextResponse.json(
        { error: 'Pricing calculation not found' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for individual view
    try {
      await logUsage({
        userId: userId,
        feature: 'pricing_view',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          calculationId,
          clientName: (calculation.metadata as any)?.clientName,
          action: 'view'
        }
      });
      console.log('✅ Pricing calculator view usage logged');
    } catch (logError) {
      console.error('⚠️ Pricing calculator view usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: calculation.id,
        title: calculation.title,
        calculation: JSON.parse(calculation.content),
        metadata: calculation.metadata,
        createdAt: calculation.created_at,
        updatedAt: calculation.updated_at,
        workspace: calculation.workspace
      },
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Pricing Calculator GET [id] API Error:', error);
    console.error('Pricing calculator GET [id] error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Failed to fetch pricing calculation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Pricing Calculator PUT [id] API Route called for ID:', params.id);
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in pricing calculator PUT [id]:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Pricing Calculator PUT [id] user authenticated successfully:', user.id);
    const userId = user.id;
    const calculationId = params.id;

    // ✅ ADD RATE LIMITING for updates
    const rateLimitResult = await rateLimit(
      `pricing_update:${userId}`,
      RATE_LIMITS.UPDATE.limit,
      RATE_LIMITS.UPDATE.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Pricing calculator update rate limit exceeded for user:', userId);
      return NextResponse.json(
        { 
          error: 'Update rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    console.log('📥 Parsing pricing calculator update request body...');
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse pricing calculator update request body:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }

    // Validate partial input for updates
    const validation = validatePricingCalculatorInput(body, true);
    
    if (!validation.success) {
      console.error('❌ Pricing calculator update validation failed:', validation.errors);
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    // ✅ UPDATE DELIVERABLE
    const { prisma } = await import('@/lib/prisma');
    const existingCalculation = await prisma.deliverable.findFirst({
      where: {
        id: calculationId,
        user_id: userId,
        type: 'pricing_calculation'
      }
    });

    if (!existingCalculation) {
      console.log('❌ Pricing calculation not found:', calculationId);
      return NextResponse.json(
        { error: 'Pricing calculation not found' },
        { status: 404 }
      );
    }

    // Regenerate with updated data
    const pricingService = new PricingCalculatorService();
    const updatedInput = { ...validation.data, userId: userId };
    const updatedPackage = await pricingService.generatePricingPackage(updatedInput);

    const updatedCalculation = await prisma.deliverable.update({
      where: { id: calculationId },
      data: {
        title: `Pricing Strategy - ${validation.data?.clientName || 'Updated'}`,
        content: JSON.stringify(updatedPackage),
        metadata: {
          ...(existingCalculation.metadata as any),
          ...validation.data,
          recommendedRetainer: updatedPackage.calculations?.recommendedRetainer,
          roiPercentage: updatedPackage.calculations?.roiPercentage,
          tokensUsed: updatedPackage.tokensUsed,
          lastUpdated: new Date().toISOString()
        },
        updated_at: new Date()
      }
    });

    // ✅ LOG USAGE for update
    try {
      await logUsage({
        userId: userId,
        feature: 'pricing_update',
        tokens: updatedPackage.tokensUsed,
        timestamp: new Date(),
        metadata: {
          calculationId,
          updatedFields: Object.keys(validation.data || {}),
          clientName: validation.data?.clientName
        }
      });
      console.log('✅ Pricing calculator update usage logged');
    } catch (logError) {
      console.error('⚠️ Pricing calculator update usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCalculation.id,
        calculation: updatedPackage,
        metadata: updatedCalculation.metadata
      },
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Pricing Calculator PUT [id] API Error:', error);
    console.error('Pricing calculator PUT [id] error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Failed to update pricing calculation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Pricing Calculator DELETE [id] API Route called for ID:', params.id);
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in pricing calculator DELETE [id]:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Pricing Calculator DELETE [id] user authenticated successfully:', user.id);
    const userId = user.id;
    const calculationId = params.id;

    // ✅ ADD RATE LIMITING for deletions
    const rateLimitResult = await rateLimit(
      `pricing_delete:${userId}`,
      RATE_LIMITS.DELETE.limit,
      RATE_LIMITS.DELETE.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Pricing calculator delete rate limit exceeded for user:', userId);
      return NextResponse.json(
        { 
          error: 'Delete rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { prisma } = await import('@/lib/prisma');
    
    const result = await prisma.deliverable.deleteMany({
      where: {
        id: calculationId,
        user_id: userId,
        type: 'pricing_calculation'
      }
    });

    if (result.count === 0) {
      console.log('❌ Pricing calculation not found or access denied:', calculationId);
      return NextResponse.json(
        { error: 'Pricing calculation not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for deletion
    try {
      await logUsage({
        userId: userId,
        feature: 'pricing_delete',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          calculationId,
          action: 'delete'
        }
      });
      console.log('✅ Pricing calculator deletion usage logged');
    } catch (logError) {
      console.error('⚠️ Pricing calculator deletion usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing calculation deleted successfully',
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Pricing Calculator DELETE [id] API Error:', error);
    console.error('Pricing calculator DELETE [id] error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Failed to delete pricing calculation' },
      { status: 500 }
    );
  }
}