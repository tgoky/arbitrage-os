// app/api/auth/set-password/route.ts
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Validate password
    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to set a password' },
        { status: 401 }
      )
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      console.error('Error setting password:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message || 'Failed to set password' },
        { status: 500 }
      )
    }

    // Update has_password flag in database
    // Normalize email to lowercase to match how we store it
    const normalizedEmail = user.email!.trim().toLowerCase();
    try {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { has_password: true }
      })
    } catch (dbError) {
      console.error('Error updating has_password flag:', dbError)
      // Don't fail the request if this fails - password is already set
    }

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now login with email and password.'
    })

  } catch (error: any) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set password' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if current user has a password set
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check has_password in database - normalize email
    const normalizedEmail = user.email!.trim().toLowerCase();
    const dbUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { has_password: true }
    })

    return NextResponse.json({
      success: true,
      hasPassword: dbUser?.has_password ?? false
    })

  } catch (error: any) {
    console.error('Check password status error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check password status' },
      { status: 500 }
    )
  }
}
