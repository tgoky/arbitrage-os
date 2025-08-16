// app/api/pricing-calculator/compare/route.ts - WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PricingCalculatorService } from '@/services/pricingCalculator.service';
import { rateLimit } from '@/lib/rateLimit'; // ✅ Add rate limiting
import { logUsage } from '@/lib/usage'; // ✅ Add usage logging
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

const RATE_LIMITS = {
  COMPARE: {
    limit: 15, // 15 comparisons per hour
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for scenario comparisons
    const rateLimitResult = await rateLimit(
      `pricing_compare:${user.id}`,
      RATE_LIMITS.COMPARE.limit,
      RATE_LIMITS.COMPARE.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Comparison rate limit exceeded. You can compare 15 scenarios per hour.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
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

    // ✅ LOG USAGE for scenario comparison - Fixed property access
    await logUsage({
      userId: user.id,
      feature: 'pricing_compare',
      tokens: comparison.tokensUsed || 0,
      timestamp: new Date(),
      metadata: {
        scenarioCount: scenarios.length,
        avgAnnualSavings: scenarios.reduce((acc, s) => acc + s.annualSavings, 0) / scenarios.length,
        avgHoursPerWeek: scenarios.reduce((acc, s) => acc + s.hoursPerWeek, 0) / scenarios.length,
        experienceLevels: scenarios.map(s => s.experienceLevel).filter(Boolean),
        bestScenarioIndex: comparison.comparison?.bestScenario || 0,
        recommendationsCount: comparison.comparison?.recommendations?.length || 0
      }
    });

    return NextResponse.json({
      success: true,
      data: comparison,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Scenario Comparison Error:', error);
    return NextResponse.json(
      { error: 'Failed to compare scenarios' },
      { status: 500 }
    );
  }
}
