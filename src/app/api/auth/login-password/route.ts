// app/api/auth/login-password/route.ts
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Check if user exists and has password set
    const dbUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { has_password: true, status: true }
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "You don't have access to this platform. Contact team@growaiagency.io to request access." },
        { status: 403 }
      )
    }

    if (dbUser.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: 'Your account has been suspended. Contact support for assistance.' },
        { status: 403 }
      )
    }

    if (!dbUser.has_password) {
      return NextResponse.json(
        { success: false, error: 'Password login is not enabled for this account. Please use the magic link to sign in first, then set up a password.' },
        { status: 400 }
      )
    }

    // Attempt to sign in with password
    const supabase = await createSupabaseServerClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: password
    })

    if (signInError) {
      console.error('Password login error:', signInError)

      // Generic error message for security
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Update last_login timestamp
    try {
      await prisma.user.update({
        where: { email: trimmedEmail },
        data: { last_login: new Date() }
      })
    } catch (dbError) {
      console.error('Error updating last_login:', dbError)
      // Don't fail the request if this fails
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      redirectTo: '/home'
    })

  } catch (error: any) {
    console.error('Password login error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if user has password set (for login page to show password option)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Check if user exists and has password
    const dbUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { has_password: true }
    })

    return NextResponse.json({
      success: true,
      hasPassword: dbUser?.has_password ?? false,
      userExists: !!dbUser
    })

  } catch (error: any) {
    console.error('Check password status error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check password status' },
      { status: 500 }
    )
  }
}
