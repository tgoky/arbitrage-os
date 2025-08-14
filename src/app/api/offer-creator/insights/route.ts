// app/api/offer-creator/insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getIndustrySpecificTips, generateCopywritingVariations } from '@/utils/offerCreator.utils';

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
    const text = searchParams.get('text');
    const type = searchParams.get('type') as 'headline' | 'cta' | 'urgency';

    let data: any = {};

    // Get industry-specific tips
    if (industry) {
      data.industryTips = getIndustrySpecificTips(industry);
    }

    // Generate copywriting variations
    if (text && type) {
      data.variations = generateCopywritingVariations(text, type);
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Insights Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}