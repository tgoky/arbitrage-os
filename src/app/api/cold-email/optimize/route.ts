import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ColdEmailService } from '@/services/coldEmail.service';
import { logUsage } from '@/lib/usage';
import { rateLimit } from '@/lib/rateLimit';
import { ColdEmailOptimizationType } from '@/types/coldEmail';

// ✅ Use the SAME robust authentication function as main route
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Try with route handler client
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        console.log('✅ Auth Method 1 (route handler) succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Trying token auth with token:', token.substring(0, 20) + '...');
        
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: () => undefined,
            },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          console.log('✅ Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Token auth error:', tokenError);
      }
    }
    
    // Method 3: Try with cookie validation
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;
              
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded);
                  return cookie.value;
                } catch (e) {
                  console.warn(`Invalid cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
              console.warn(`Error reading cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Auth Method 3 (SSR cookies) succeeded for user:', user.id);
    } else {
      console.log('⚠️ SSR cookie auth failed:', error?.message);
    }
    
    return { user, error };
    
  } catch (error) {
    console.error('💥 All authentication methods failed:', error);
    return { user: null, error };
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Cold Email Optimize API Route called');
    
    // ✅ Use robust authentication (same as main route)
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in optimize:', authError);
      
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

    console.log('✅ User authenticated successfully:', user.id);

    // ✅ Add rate limiting - 30 optimizations per minute
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
        error: 'Failed to optimize email' 
      },
      { status: 500 }
    );
  }
}