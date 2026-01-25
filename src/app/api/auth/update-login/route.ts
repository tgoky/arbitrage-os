// app/api/auth/update-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/utils/supabase/server';

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
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Update last login
    await prisma.user.update({
      where: { email: trimmedEmail },
      data: { last_login: new Date() }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update login error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update login'
    }, { status: 500 });
  }
}
