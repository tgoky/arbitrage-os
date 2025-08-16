// app/api/pricing-calculator/[id]/route.ts - WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PricingCalculatorService } from '@/services/pricingCalculator.service';
import { validatePricingCalculatorInput } from '../../../validators/pricingCalculator.validator';
import { rateLimit } from '@/lib/rateLimit'; // ✅ Add rate limiting
import { logUsage } from '@/lib/usage'; // ✅ Add usage logging

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for individual fetches
    const rateLimitResult = await rateLimit(
      `pricing_get:${user.id}`,
      RATE_LIMITS.GET.limit,
      RATE_LIMITS.GET.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Fetch rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const calculationId = params.id;

    // ✅ FETCH FROM DELIVERABLES
    const { prisma } = await import('@/lib/prisma');
    const calculation = await prisma.deliverable.findFirst({
      where: {
        id: calculationId,
        user_id: user.id,
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
      return NextResponse.json(
        { error: 'Pricing calculation not found' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for individual view
    await logUsage({
      userId: user.id,
      feature: 'pricing_view',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        calculationId,
        clientName: (calculation.metadata as any)?.clientName,
        action: 'view'
      }
    });

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
    console.error('Calculation Fetch Error:', error);
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
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for updates
    const rateLimitResult = await rateLimit(
      `pricing_update:${user.id}`,
      RATE_LIMITS.UPDATE.limit,
      RATE_LIMITS.UPDATE.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Update rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const calculationId = params.id;
    const body = await req.json();

    // Validate partial input for updates
    const validation = validatePricingCalculatorInput(body, true); // partial validation
    
    if (!validation.success) {
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
        user_id: user.id,
        type: 'pricing_calculation'
      }
    });

    if (!existingCalculation) {
      return NextResponse.json(
        { error: 'Pricing calculation not found' },
        { status: 404 }
      );
    }

    // Regenerate with updated data
    const pricingService = new PricingCalculatorService();
    const updatedInput = { ...validation.data, userId: user.id };
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
    await logUsage({
      userId: user.id,
      feature: 'pricing_update',
      tokens: updatedPackage.tokensUsed,
      timestamp: new Date(),
      metadata: {
        calculationId,
        updatedFields: Object.keys(validation.data || {}),
        clientName: validation.data?.clientName
      }
    });

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
    console.error('Calculation Update Error:', error);
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
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for deletions
    const rateLimitResult = await rateLimit(
      `pricing_delete:${user.id}`,
      RATE_LIMITS.DELETE.limit,
      RATE_LIMITS.DELETE.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Delete rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const calculationId = params.id;
    const { prisma } = await import('@/lib/prisma');
    
    const result = await prisma.deliverable.deleteMany({
      where: {
        id: calculationId,
        user_id: user.id,
        type: 'pricing_calculation'
      }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Pricing calculation not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for deletion
    await logUsage({
      userId: user.id,
      feature: 'pricing_delete',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        calculationId,
        action: 'delete'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pricing calculation deleted successfully',
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Calculation Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete pricing calculation' },
      { status: 500 }
    );
  }
}
