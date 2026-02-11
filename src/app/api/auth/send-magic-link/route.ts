// app/api/auth/send-magic-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
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
      prisma.userInvite.findUnique({ where: { email: trimmedEmail } }),
      prisma.user.findUnique({ where: { email: trimmedEmail } })
    ]);

    if (!existingUser && !invite) {
      return NextResponse.json({
        success: false,
        error: "You don't have access to this platform. Contact team@growaiagency.io to request access."
      }, { status: 403 });
    }

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

    // Generate magic link via Supabase service role (generates URL only, does NOT send any email)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    const redirectTo = invite && !existingUser
      ? `${appUrl}/api/auth/callback?next=/&invite_id=${invite.id}`
      : `${appUrl}/api/auth/callback?next=/`;

    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: trimmedEmail,
      options: { redirectTo },
    });

    if (linkError || !data?.properties?.action_link) {
      console.error('generateLink error:', linkError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate sign-in link.' },
        { status: 500 }
      );
    }

    // Send branded email via Resend (not Supabase)
    if (invite && !existingUser) {
      await EmailService.sendInviteEmail(trimmedEmail, data.properties.action_link, invite.invited_by);
    } else {
      await EmailService.sendMagicLinkEmail(trimmedEmail, data.properties.action_link);
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
