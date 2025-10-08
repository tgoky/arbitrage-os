import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ColdEmailService } from '@/services/coldEmail.service';
import { logUsage } from '@/lib/usage';
import { rateLimit } from '@/lib/rateLimit';
import { ColdEmailOptimizationType } from '@/types/coldEmail';

// ✅ SIMPLIFIED: Authentication function from work-items
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('❌ Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('✅ User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { user: null, error };
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Cold Email Optimize API Route called');
    
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in optimize:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated successfully:', user.id);

    // Add rate limiting - 30 optimizations per minute
    const rateLimitResult = await rateLimit(user.id, 30, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many optimization requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const { emailContent, optimizationType } = await req.json();
    
    if (!emailContent || !optimizationType) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email content and optimization type are required' 
        },
        { status: 400 }
      );
    }

    // Validate optimization type
    const validTypes: ColdEmailOptimizationType[] = ['personalization', 'value', 'urgency', 'social-proof', 'clarity', 'cta'];
    if (!validTypes.includes(optimizationType)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid optimization type' 
        },
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
      timestamp: new Date(),
      metadata: {
        optimizationType,
        originalLength: emailContent.length,
        optimizedLength: optimizedEmail.content.length
      }
    });

    return NextResponse.json({
      success: true,
      data: optimizedEmail.content,
      meta: {
        tokensUsed: optimizedEmail.tokensUsed,
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });
  } catch (error) {
    console.error('💥 Email Optimization Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to optimize email',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}