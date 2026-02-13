// app/api/auth/send-magic-link/route.ts
//
// Server-side magic link generation via Supabase Admin API + delivery via Resend.
//
// Flow:
//   1. Validate email & check invite / existing user (same gate as before)
//   2. Use supabaseAdmin.auth.admin.generateLink() to create the magic link
//      (Supabase generates the token but does NOT send any email)
//   3. Send the link via Resend with our branded template
//
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { getResendClient, FROM_EMAIL, APP_URL } from '@/lib/resend';
import { magicLinkEmailHtml, magicLinkEmailText } from '../../../../lib/email-template';

// Admin client — server-side only, used to generate links without sending email.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // ── Gate: existing user OR valid invite ──────────────────────────────────
    const [existingUser, invite] = await Promise.all([
      prisma.user.findUnique({ where: { email: trimmedEmail } }),
      prisma.userInvite.findUnique({ where: { email: trimmedEmail } }),
    ]);

    if (!existingUser) {
      if (!invite) {
        return NextResponse.json({
          success: false,
          error: "You don't have access to this platform. Contact team@growaiagency.io to request access.",
        }, { status: 403 });
      }

      if (invite.expires_at && new Date() > invite.expires_at) {
        return NextResponse.json({
          success: false,
          error: 'Your invite has expired. Contact team@growaiagency.io for a new invitation.',
        }, { status: 403 });
      }

      if (invite.status !== 'sent' && invite.status !== 'accepted') {
        return NextResponse.json({
          success: false,
          error: "You don't have access to this platform. Contact team@growaiagency.io to request access.",
        }, { status: 403 });
      }
    }

    if (existingUser?.status === 'suspended') {
      return NextResponse.json({
        success: false,
        error: 'Your account has been suspended. Contact support for assistance.',
      }, { status: 403 });
    }

    // ── Generate magic link via Supabase Admin (no email sent by Supabase) ───
    //
    // generateLink returns { properties.action_link } which is a URL like:
    //   https://<project>.supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=...
    //
    // When the user clicks this link, Supabase verifies the token and redirects
    // to the redirectTo URL with a `code` query param, which our existing
    // /api/auth/callback route exchanges for a session.
    const redirectTo = invite && !existingUser
      ? `${APP_URL}/api/auth/callback?next=/&invite_id=${invite.id}`
      : `${APP_URL}/api/auth/callback?next=/home`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: trimmedEmail,
      options: { redirectTo },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Supabase generateLink error:', linkError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate magic link. Please try again.' },
        { status: 500 }
      );
    }

    const magicLink = linkData.properties.action_link;

    // ── Send via Resend ───────────────────────────────────────────────────────
    const resend = getResendClient();

    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: trimmedEmail,
      subject: 'Sign in to ArbitrageOS',
      html: magicLinkEmailHtml({ magicLink, email: trimmedEmail }),
      text: magicLinkEmailText({ magicLink, email: trimmedEmail }),
    });

    if (sendError) {
      console.error('Resend send error:', sendError);
      return NextResponse.json(
        { success: false, error: 'Failed to send magic link email. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`Magic link sent via Resend to: ${trimmedEmail}`);

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('send-magic-link error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}