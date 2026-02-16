// app/api/credits/estimate/route.ts
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



export async function POST(req: NextRequest) {
  console.log('Credit Estimation API called');
  
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

    // Rate limiting - 100 estimates per minute
    const rateLimitResult = await rateLimit(user.id, 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many estimation requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { leadCount } = body;

    if (!leadCount || typeof leadCount !== 'number' || leadCount < 1 || leadCount > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Invalid lead count. Must be a number between 1 and 1000.',
        code: 'INVALID_LEAD_COUNT'
      }, { status: 400 });
    }

    const creditsService = new CreditsService();
    const affordabilityCheck = await creditsService.canAffordLeadGeneration(user.id, leadCount);
    
    return NextResponse.json({
      success: true,
      data: {
        canAfford: affordabilityCheck.canAfford,
        costInfo: affordabilityCheck.costInfo,
        userCredits: affordabilityCheck.userCredits,
        reason: affordabilityCheck.reason
      }
    });

  } catch (error) {
    console.error('Credit Estimation API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to estimate cost',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}