// app/api/pricing-calculator/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PricingCalculatorService } from '@/services/pricingCalculator.service';
import { validatePricingCalculatorInput } from '../../validators/pricingCalculator.validator';
import { rateLimit } from '@lib/rateLimit';
import { logUsage } from '@/lib/usage';

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

    // Rate limiting - 20 calculations per hour
    const rateLimitResult = await rateLimit(user.id, 20, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many calculations. Please try again later.',
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

    // Get user's workspace
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

    // Generate pricing package
    const pricingService = new PricingCalculatorService();
    const calculatorInput = { ...validation.data, userId: user.id };
    const generatedPackage = await pricingService.generatePricingPackage(calculatorInput);

    // Save to database
    const calculationId = await pricingService.savePricingCalculation(
      user.id, 
      workspace.id, 
      generatedPackage, 
      calculatorInput
    );

    // Log usage for analytics/billing
    await logUsage({
      userId: user.id,
      feature: 'pricing_calculator',
      tokens: generatedPackage.tokensUsed,
      timestamp: new Date(),
      metadata: {
        clientName: validation.data.clientName,
        annualSavings: validation.data.annualSavings,
        recommendedRetainer: generatedPackage.calculations.recommendedRetainer,
        roiPercentage: generatedPackage.calculations.roiPercentage,
        calculationId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        calculationId,
        package: generatedPackage
      },
      meta: {
        tokensUsed: generatedPackage.tokensUsed,
        generationTime: generatedPackage.generationTime,
        remaining: rateLimitResult.limit - rateLimitResult.count
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

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    const pricingService = new PricingCalculatorService();
    const calculations = await pricingService.getUserPricingCalculations(user.id, workspaceId || undefined);

    return NextResponse.json({
      success: true,
      data: calculations
    });

  } catch (error) {
    console.error('Calculations Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing calculations' },
      { status: 500 }
    );
  }
}
