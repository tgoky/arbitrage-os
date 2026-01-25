// app/api/auth/check-password-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({
        hasPassword: false,
        userExists: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists and has password set
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { has_password: true }
    });

    if (!user) {
      // User doesn't exist in our DB yet (new invite user)
      return NextResponse.json({
        hasPassword: false,
        userExists: false
      });
    }

    return NextResponse.json({
      hasPassword: user.has_password ?? false, // Handle null/undefined as false
      userExists: true
    });

  } catch (error: any) {
    console.error('Check password status error:', error);
    return NextResponse.json({
      hasPassword: false,
      userExists: false,
      error: 'Failed to check password status'
    }, { status: 500 });
  }
}
