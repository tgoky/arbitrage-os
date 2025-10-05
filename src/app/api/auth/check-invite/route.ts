// app/api/auth/check-invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        hasValidInvite: false,
        error: 'Email is required' 
      }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user has a valid invite or is already an active user
    const [invite, existingUser] = await Promise.all([
      prisma.userInvite.findUnique({
        where: { email: trimmedEmail }
      }),
      prisma.user.findUnique({
        where: { email: trimmedEmail }
      })
    ]);

    // Allow if user already exists and is active
    if (existingUser && existingUser.status === 'active') {
      return NextResponse.json({ hasValidInvite: true });
    }

    // Allow if user has a pending invite that hasn't expired
    if (invite) {
      // Check if already accepted
      if (invite.status === 'accepted') {
        return NextResponse.json({ 
          hasValidInvite: false,
          error: 'Your invite has already been used. Please contact support if you need help accessing your account.'
        });
      }

      // Check if expired
      if (invite.expires_at && new Date() > invite.expires_at) {
        return NextResponse.json({ 
          hasValidInvite: false,
          error: 'Your invite has expired. Please contact your administrator for a new invitation.'
        });
      }

      // Valid pending invite
      if (invite.status === 'sent') {
        return NextResponse.json({ hasValidInvite: true });
      }
    }

    // No valid invite found
    return NextResponse.json({ 
      hasValidInvite: false,
      error: 'You don\'t have access to this platform. Contact team@growaiagency.io to request access.'
    });

  } catch (error: any) {
    console.error('Check invite error:', error);
    return NextResponse.json({ 
      hasValidInvite: false,
      error: 'Failed to verify invitation status'
    }, { status: 500 });
  }
}