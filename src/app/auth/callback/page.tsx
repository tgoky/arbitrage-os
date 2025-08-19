// app/auth/callback/page.tsx
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: { code?: string; error?: string; error_description?: string }
}) {
  const { code, error, error_description } = searchParams

  if (error) {
    console.error('Auth callback error:', error, error_description)
    redirect(`/login?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const supabase = createSupabaseServerClient()
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        redirect(`/login?error=${encodeURIComponent('Failed to verify email. Please try again.')}`)
      }
      
      if (data.user) {
        console.log('✅ Email verified successfully for:', data.user.email)
        redirect('/?verified=true')
      }
    } catch (error: any) {
      console.error('Callback processing error:', error)
      redirect(`/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`)
    }
  }

  redirect('/login?error=Invalid+callback')
}