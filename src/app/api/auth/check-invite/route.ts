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

    // Check if user exists or has an invite
    const [invite, existingUser] = await Promise.all([
      prisma.userInvite.findUnique({
        where: { email: trimmedEmail }
      }),
      prisma.user.findUnique({
        where: { email: trimmedEmail }
      })
    ]);

    // Allow login if user already exists (regardless of status or last_login)
    if (existingUser) {
      return NextResponse.json({ hasValidInvite: true });
    }

    // If no existing user, they must have a valid invite
    if (invite) {
      // Check if expired
      if (invite.expires_at && new Date() > invite.expires_at) {
        return NextResponse.json({ 
          hasValidInvite: false,
          error: 'Your invite has expired. Contact team@growaiagency.io for a new invitation.'
        });
      }

      // Valid invite (sent or accepted - both are fine)
      if (invite.status === 'sent' || invite.status === 'accepted') {
        return NextResponse.json({ hasValidInvite: true });
      }
    }

    // No valid invite or user found
    return NextResponse.json({ 
      hasValidInvite: false,
      error: "You don't have access to this platform. Contact team@growaiagency.io to request access."
    });

  } catch (error: any) {
    console.error('Check invite error:', error);
    return NextResponse.json({ 
      hasValidInvite: false,
      error: 'Failed to verify invitation status'
    }, { status: 500 });
  }
}