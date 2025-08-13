// app/api/ad-writer/optimize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AdWriterService } from '@/services/adWriter.service';
import { AdOptimizationType } from '@/types/coldEmail';

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

    const { adCopy, optimizationType } = await req.json();
    
    if (!adCopy || !optimizationType) {
      return NextResponse.json(
        { error: 'Ad copy and optimization type are required' },
        { status: 400 }
      );
    }

    // Validate optimization type
    const validTypes: AdOptimizationType[] = ['emotional', 'urgency', 'benefits', 'social-proof', 'simplify'];
    if (!validTypes.includes(optimizationType)) {
      return NextResponse.json(
        { error: 'Invalid optimization type' },
        { status: 400 }
      );
    }
        
    const adWriterService = new AdWriterService();
    const optimizedAd = await adWriterService.optimizeAd(adCopy, optimizationType as AdOptimizationType);

    return NextResponse.json({
      success: true,
      data: optimizedAd.content,
      meta: {
        tokensUsed: optimizedAd.tokensUsed
      }
    });
  } catch (error) {
    console.error('Ad Optimization Error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize ad' },
      { status: 500 }
    );
  }
}