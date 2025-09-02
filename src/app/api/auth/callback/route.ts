// app/api/auth/callback/route.ts
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔗 Auth callback triggered');
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/' // Default to workspace home page
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('Callback params:', { code: !!code, next, error });

  // Handle error cases
  if (error) {
    console.error('❌ Auth callback error:', { error, errorDescription })
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, origin)
    )
  }

  // Handle successful authentication
  if (code) {
    try {
      console.log('🔄 Exchanging code for session...');
      const supabase = await createSupabaseServerClient()
      
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('❌ Code exchange error:', exchangeError)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, origin)
        )
      }

      if (!session) {
        console.error('❌ No session created');
        return NextResponse.redirect(
          new URL('/login?error=Failed to create session', origin)
        )
      }

      console.log('✅ Session created successfully for user:', session.user.id);
      console.log('🚀 Redirecting to:', next);

      // Successful authentication - redirect to the workspace page or dashboard
      return NextResponse.redirect(new URL(next, origin))
      
    } catch (error: any) {
      console.error('❌ Auth confirmation error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message || 'Server error')}`, origin)
      )
    }
  }

  // No code parameter - redirect to error
  console.error('❌ No authentication code provided');
  return NextResponse.redirect(
    new URL('/login?error=Missing authentication code', origin)
  )
}