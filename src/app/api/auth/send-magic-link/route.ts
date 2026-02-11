// app/api/auth/send-magic-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { EmailService } from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists or has a valid invite
    const [invite, existingUser] = await Promise.all([
      prisma.userInvite.findUnique({
        where: { email: trimmedEmail }
      }),
      prisma.user.findUnique({
        where: { email: trimmedEmail }
      })
    ]);

    // User must either exist or have a valid invite
    if (!existingUser && !invite) {
      return NextResponse.json({
        success: false,
        error: "You don't have access to this platform. Contact team@growaiagency.io to request access."
      }, { status: 403 });
    }

    // If they only have an invite, validate it
    if (!existingUser && invite) {
      if (invite.expires_at && new Date() > invite.expires_at) {
        return NextResponse.json({
          success: false,
          error: 'Your invite has expired. Contact team@growaiagency.io for a new invitation.'
        }, { status: 403 });
      }

      if (invite.status !== 'sent' && invite.status !== 'accepted') {
        return NextResponse.json({
          success: false,
          error: "You don't have access to this platform. Contact team@growaiagency.io to request access."
        }, { status: 403 });
      }
    }

    // Generate magic link using Supabase Admin API (does NOT send email)
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    const redirectTo = invite && !existingUser
      ? `${appUrl}/api/auth/callback?next=/&invite_id=${invite.id}`
      : `${appUrl}/api/auth/callback?next=/`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: trimmedEmail,
      options: {
        redirectTo,
      },
    });

    if (linkError) {
      console.error('Supabase generateLink error:', linkError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate sign-in link. Please try again.' },
        { status: 500 }
      );
    }

    // The generated link properties contain the hashed_token and verification URL
    // We need to construct the proper magic link from the returned data
    const magicLink = linkData.properties.action_link;

    if (!magicLink) {
      console.error('No action_link returned from generateLink');
      return NextResponse.json(
        { success: false, error: 'Failed to generate sign-in link. Please try again.' },
        { status: 500 }
      );
    }

    // Send email via Resend with branded template
    if (invite && !existingUser) {
      // New user with invite - send invite-style email
      await EmailService.sendInviteEmail(
        trimmedEmail,
        magicLink,
        invite.invited_by
      );
    } else {
      // Existing user - send regular magic link email
      await EmailService.sendMagicLinkEmail(trimmedEmail, magicLink);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Send magic link error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
