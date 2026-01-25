// app/api/auth/set-password/route.ts
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    // Verify the user is authenticated
    const supabase = await createSupabaseServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Verify the email matches the session user
    if (session.user.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: 'Email mismatch'
      }, { status: 403 });
    }

    // Update user record to mark password as set
    const trimmedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });

    if (!user) {
      // Create user if doesn't exist (edge case)
      await prisma.user.create({
        data: {
          id: session.user.id,
          email: trimmedEmail,
          name: session.user.user_metadata?.full_name || null,
          status: 'active',
          has_password: true,
          last_login: new Date()
        }
      });
    } else {
      // Update existing user
      await prisma.user.update({
        where: { email: trimmedEmail },
        data: {
          has_password: true,
          status: 'active',
          last_login: new Date()
        }
      });
    }

    console.log('✅ User password status updated for:', trimmedEmail);

    return NextResponse.json({
      success: true,
      message: 'Password set successfully'
    });

  } catch (error: any) {
    console.error('❌ Set password error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to set password'
    }, { status: 500 });
  }
}
