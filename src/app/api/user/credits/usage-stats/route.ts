// app/api/user/usage-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CreditsService } from '@/services/credits.service';
import { rateLimit } from '@/lib/rateLimit';

// Authentication function
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


export async function GET(req: NextRequest) {
  console.log('User Usage Stats API called');
  
  try {
   const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(user.id, 30, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get('timeframe') || 'month') as 'week' | 'month' | 'all';

    // Validate timeframe
    if (!['week', 'month', 'all'].includes(timeframe)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid timeframe. Must be week, month, or all.',
        code: 'INVALID_TIMEFRAME'
      }, { status: 400 });
    }

    const creditsService = new CreditsService();
    const stats = await creditsService.getUserUsageStats(user.id, timeframe);
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Usage Stats API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch usage statistics',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
