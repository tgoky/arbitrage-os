// app/api/pricing-calculator/route.ts - FIXED: SERVICE LEVEL STORAGE ONLY
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    // ✅ GET USER'S WORKSPACE (consistent pattern)
    const { prisma } = await import('@/lib/prisma');
    let workspace = await prisma.workspace.findFirst({
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

    // ✅ SERVICE HANDLES BOTH GENERATION AND STORAGE
    const pricingService = new PricingCalculatorService();
    const calculatorInput = { ...validation.data, userId: user.id };
    
    // Generate the package
    const generatedPackage = await pricingService.generatePricingPackage(calculatorInput);
    
    // Save it via service (not API)
    const deliverableId = await pricingService.savePricingCalculation(
      user.id,
      workspace.id,
      generatedPackage,
      calculatorInput
    );

    // ✅ LOG USAGE for analytics/billing
    await logUsage({
      userId: user.id,
      feature: 'pricing_calculator',
      tokens: generatedPackage.tokensUsed,
      timestamp: new Date(),
      metadata: {
        deliverableId, // ✅ Reference the actual deliverable
        clientName: validation.data.clientName,
        annualSavings: validation.data.annualSavings,
        recommendedRetainer: generatedPackage.calculations?.recommendedRetainer,
        roiPercentage: generatedPackage.calculations?.roiPercentage,
        hoursPerWeek: validation.data.hoursPerWeek,
        experienceLevel: validation.data.experienceLevel
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        calculationId: deliverableId, // ✅ Return service-generated ID
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

    // ✅ USE SERVICE METHOD (consistent with architecture)
    const pricingService = new PricingCalculatorService();
    const calculations = await pricingService.getUserPricingCalculations(
      user.id,
      workspaceId || undefined
    );

    // ✅ LOG USAGE for listing
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