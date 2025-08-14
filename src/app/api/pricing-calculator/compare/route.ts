// app/api/pricing-calculator/compare/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PricingCalculatorService } from '@/services/pricingCalculator.service';
import { z } from 'zod';

const compareSchema = z.object({
  scenarios: z.array(z.object({
    annualSavings: z.number(),
    hoursPerWeek: z.number(),
    roiMultiple: z.number(),
    experienceLevel: z.enum(['beginner', 'intermediate', 'expert', 'premium']).optional(),
    deliveryRisk: z.enum(['low', 'medium', 'high']).optional(),
    scenarioName: z.string().optional()
  })).min(2).max(5)
});

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const body = await req.json();
    const validation = compareSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
      { error: 'Invalid scenarios', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Add userId to each scenario
    const scenarios = validation.data.scenarios.map(scenario => ({
      ...scenario,
      userId: user.id
    }));

    const pricingService = new PricingCalculatorService();
    const comparison = await pricingService.comparePricingScenarios(user.id, scenarios);

    return NextResponse.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Scenario Comparison Error:', error);
    return NextResponse.json(
      { error: 'Failed to compare scenarios' },
      { status: 500 }
    );
  }
}

