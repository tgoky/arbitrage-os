
// app/api/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  if (error) {
    // Handle various error cases
    let redirectPath = '/login';
    
    switch (error) {
      case 'access_denied':
        redirectPath = '/login?error=access_denied&message=Email verification cancelled';
        break;
      case 'invalid_request':
        redirectPath = '/login?error=invalid_link&message=Invalid verification link';
        break;
      default:
        redirectPath = `/login?error=verification_failed&message=${encodeURIComponent(error_description || 'Email verification failed')}`;
    }

    return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Code exchange error:', error);
        return NextResponse.redirect(
          new URL(`/login?error=verification_failed&message=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }

      if (data.user) {
        // Check if this is email verification (user was not previously confirmed)
        const isEmailVerification = !data.user.email_confirmed_at;
        
        if (isEmailVerification || data.user.email_confirmed_at) {
          // Successful email verification
          return NextResponse.redirect(
            new URL('/login?verified=true&message=Email verified successfully. You can now log in.', requestUrl.origin)
          );
        } else {
          // Regular login flow
          return NextResponse.redirect(new URL('/', requestUrl.origin));
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        new URL('/login?error=verification_failed&message=Authentication failed', requestUrl.origin)
      );
    }
  }

  // No code or error - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
