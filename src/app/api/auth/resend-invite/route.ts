// app/api/auth/resend-invite/route.ts
//
// Re-sends an invite email using Supabase Admin generateLink + Resend.
// Drop-in replacement for the old signInWithOtp-based version.
//
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { getResendClient, FROM_EMAIL, APP_URL } from '@/lib/resend';
import { inviteEmailHtml, inviteEmailText } from '@/lib/email-templates';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { inviteId } = await request.json();

    if (!inviteId) {
      return NextResponse.json(
        { success: false, error: 'Invite ID required' },
        { status: 400 }
      );
    }

    const invite = await prisma.userInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return NextResponse.json(
        { success: false, error: 'Invalid invite' },
        { status: 404 }
      );
    }

    if (invite.status === 'accepted') {
      return NextResponse.json(
        { success: false, error: 'This invite has already been used' },
        { status: 400 }
      );
    }

    if (invite.expires_at && new Date() > invite.expires_at) {
      return NextResponse.json({
        success: false,
        error: 'This invite has expired (7 days). Please contact your admin for a new invitation.',
      }, { status: 400 });
    }

    // ── Generate magic link via Supabase Admin ────────────────────────────────
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: invite.email,
      options: {
        redirectTo: `${APP_URL}/api/auth/callback?next=/&invite_id=${invite.id}`,
      },
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
      to: invite.email,
      subject: "You're invited to ArbitrageOS",
      html: inviteEmailHtml({ magicLink, email: invite.email, inviteId: invite.id }),
      text: inviteEmailText({ magicLink, email: invite.email, inviteId: invite.id }),
    });

    if (sendError) {
      console.error('Resend send error:', sendError);
      return NextResponse.json(
        { success: false, error: 'Failed to send invite email. Please try again.' },
        { status: 500 }
      );
    }

    // Update sent_at timestamp
    await prisma.userInvite.update({
      where: { id: inviteId },
      data: { sent_at: new Date() },
    });

    console.log(`Invite email re-sent via Resend to: ${invite.email}`);

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('Resend invite error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
