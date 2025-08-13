// app/api/cold-email/optimize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ColdEmailService } from '@/services/coldEmail.service';
import { logUsage } from '@/lib/usage';

import { ColdEmailOptimizationType } from '@/types/coldEmail';

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

    const { emailContent, optimizationType } = await req.json();
        
    if (!emailContent || !optimizationType) {
      return NextResponse.json(
        { error: 'Email content and optimization type are required' },
        { status: 400 }
      );
    }

    // Validate optimization type
    const validTypes: ColdEmailOptimizationType[] = ['personalization', 'value', 'urgency', 'social-proof', 'clarity', 'cta'];
    if (!validTypes.includes(optimizationType)) {
      return NextResponse.json(
        { error: 'Invalid optimization type' },
        { status: 400 }
      );
    }

    const coldEmailService = new ColdEmailService();
    const optimizedEmail = await coldEmailService.optimizeEmail(
      emailContent, 
      optimizationType as ColdEmailOptimizationType
    );

    // Log usage to your database
    await logUsage({
      userId: user.id,
      feature: 'cold_email_optimize',
      tokens: optimizedEmail.tokensUsed,
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: optimizedEmail.content,
      meta: {
        tokensUsed: optimizedEmail.tokensUsed
      }
    });
  } catch (error) {
    console.error('Email Optimization Error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize email' },
      { status: 500 }
    );
  }
}