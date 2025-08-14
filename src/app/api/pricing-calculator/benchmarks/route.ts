// app/api/pricing-calculator/benchmarks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
    const industry = searchParams.get('industry');
    const serviceType = searchParams.get('serviceType');

    const benchmarks = getPricingBenchmarks(industry, serviceType);

    return NextResponse.json({
      success: true,
      data: benchmarks
    });

  } catch (error) {
    console.error('Benchmarks Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks' },
      { status: 500 }
    );
  }
}

function getPricingBenchmarks(industry?: string | null, serviceType?: string | null) {
  const benchmarkData = {
    industries: {
      'Technology': {
        averageROIMultiple: 5.2,
        hourlyRates: { junior: 75, mid: 150, senior: 250, expert: 400 },
        preferredPricing: ['Monthly retainer', 'Project-based'],
        seasonality: ['Q4 budget planning', 'Q1 new initiatives']
      },
      'Healthcare': {
        averageROIMultiple: 6.8,
        hourlyRates: { junior: 85, mid: 175, senior: 300, expert: 500 },
        preferredPricing: ['Success-based', 'Monthly retainer'],
        seasonality: ['Regulatory changes', 'Budget cycles']
      },
      'Finance': {
        averageROIMultiple: 7.5,
        hourlyRates: { junior: 100, mid: 200, senior: 350, expert: 600 },
        preferredPricing: ['Project-based', 'Success-based'],
        seasonality: ['Quarter-end', 'Compliance deadlines']
      },
      'Manufacturing': {
        averageROIMultiple: 4.8,
        hourlyRates: { junior: 70, mid: 140, senior: 220, expert: 350 },
        preferredPricing: ['Monthly retainer', 'Hourly'],
        seasonality: ['Production cycles', 'Annual planning']
      },
      'Retail': {
        averageROIMultiple: 4.2,
        hourlyRates: { junior: 65, mid: 125, senior: 200, expert: 300 },
        preferredPricing: ['Project-based', 'Success-based'],
        seasonality: ['Holiday seasons', 'Inventory cycles']
      }
    },
    serviceTypes: {
      'AI Consulting': {
        typical_roi: '4-8x',
        billing_model: 'Value-based',
        project_duration: '3-12 months',
        success_rate: '78%'
      },
      'Process Automation': {
        typical_roi: '5-12x',
        billing_model: 'Success-based',
        project_duration: '2-6 months',
        success_rate: '85%'
      },
      'Data Analytics': {
        typical_roi: '3-6x',
        billing_model: 'Monthly retainer',
        project_duration: '6-18 months',
        success_rate: '82%'
      },
      'Digital Transformation': {
        typical_roi: '6-15x',
        billing_model: 'Hybrid',
        project_duration: '6-24 months',
        success_rate: '72%'
      }
    },
    generalTrends: {
      value_based_pricing_adoption: '68%',
      average_project_success_rate: '79%',
      client_satisfaction_rate: '84%',
      repeat_business_rate: '71%'
    }
  };

  let result: any = {
    general: benchmarkData.generalTrends,
    industries: Object.keys(benchmarkData.industries),
    serviceTypes: Object.keys(benchmarkData.serviceTypes)
  };

  if (industry && industry in benchmarkData.industries) {
    result.industrySpecific = benchmarkData.industries[industry as keyof typeof benchmarkData.industries];
  }

  if (serviceType && serviceType in benchmarkData.serviceTypes) {
    result.serviceSpecific = benchmarkData.serviceTypes[serviceType as keyof typeof benchmarkData.serviceTypes];
  }

  return result;
}