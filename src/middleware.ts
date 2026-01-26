// middleware.ts - UPDATED FOR NEXT.JS 15
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
  
  // Use environment variables directly in middleware
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables in middleware');
    return response;
  }
  
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = req.nextUrl.pathname;

  console.log('🔒 Middleware check:', { pathname, hasUser: !!user });

  // Public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/register',
    '/signup',
    '/api/auth/callback',
    '/api/auth/check-invite',
    '/api/auth/login-password',
    '/api/auth/resend-verification',
    '/api/auth/google/callback',
    '/invite-expired',
  ];

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  const isApiRoute = pathname.startsWith('/api/');
  const isStaticFile = pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/);

  // Allow public paths and static files without authentication
  if (isPublicPath || isStaticFile) {
    console.log('✅ Public path or static file, allowing access');
    return response;
  }

  // For API routes (except public ones), return 401 if not authenticated
  // Don't redirect API calls - just return error response
  if (isApiRoute) {
    if (!user) {
      console.log('❌ API route without auth, returning 401');
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }
    console.log('✅ API route with valid auth');
    return response;
  }

  // For page routes, redirect to login if not authenticated
  if (!user) {
    console.log('🔀 No user session, redirecting to login');
    const redirectUrl = new URL('/login', req.url);
    
    // Preserve the original path for redirect after login
    if (pathname !== '/') {
      redirectUrl.searchParams.set('redirectTo', pathname);
    }
    
    return NextResponse.redirect(redirectUrl);
  }

  // User is authenticated, allow access
  console.log('✅ Authenticated, allowing access');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};