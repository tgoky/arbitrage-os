// app/api/user/credits/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CreditsService } from '@/services/credits.service';

// Robust authentication (same as other routes)
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
      console.error('  Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('  User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('  Authentication error:', error);
    return { user: null, error };
  }
}

export async function GET(req: NextRequest) {
  console.log('📋 Credits History API called');
  
  try {
    // Use robust authentication
   const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('  Auth failed in credits history:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token'
      ];
      
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path: '/',
        });
      });
      
      return response;
    }

    console.log('  User authenticated successfully:', user.id);

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'all' || 'month';
    const limit = parseInt(searchParams.get('limit') || '50');

    const creditsService = new CreditsService();

    // Get transaction history
    const transactions = await creditsService.getCreditHistory(user.id, limit);

    // Get usage statistics for the timeframe
    const usageStats = await creditsService.getUserUsageStats(user.id, timeframe);

    console.log('  Credits history loaded:', {
      transactionCount: transactions.length,
      timeframe,
      usageStats
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        stats: usageStats,
        timeframe
      },
      meta: {
        total: transactions.length,
        timeframe
      }
    });

  } catch (error) {
    console.error('  Credits History API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch credits history',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}