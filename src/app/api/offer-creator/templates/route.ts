// app/api/offer-creator/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  OFFER_TEMPLATES, 
  filterTemplatesByIndustry, 
  filterTemplatesByType,
  INDUSTRIES,
  OFFER_TYPES 
} from '@/utils/offerCreator.utils';

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
    const offerType = searchParams.get('offerType');

    let templates = OFFER_TEMPLATES;
    
    // Filter by industry using utility function
    if (industry) {
      templates = filterTemplatesByIndustry(industry);
    }
    
    // Filter by offer type using utility function
    if (offerType) {
      templates = filterTemplatesByType(offerType);
    }

    return NextResponse.json({
      success: true,
      data: {
        templates,
        industries: INDUSTRIES,
        offerTypes: OFFER_TYPES,
        total: templates.length
      }
    });

  } catch (error) {
    console.error('Templates Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
