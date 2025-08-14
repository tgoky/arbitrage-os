// app/api/offer-creator/benchmarks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { INDUSTRY_BENCHMARKS, getIndustryBenchmark } from '@/utils/offerCreator.utils';

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

    if (industry) {
      // Return specific industry benchmark
      const benchmark = getIndustryBenchmark(industry);
      return NextResponse.json({
        success: true,
        data: {
          industry,
          benchmark
        }
      });
    }

    // Return all industry benchmarks
    return NextResponse.json({
      success: true,
      data: {
        benchmarks: INDUSTRY_BENCHMARKS,
        industries: Object.keys(INDUSTRY_BENCHMARKS)
      }
    });

  } catch (error) {
    console.error('Benchmarks Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks' },
      { status: 500 }
    );
  }
}
