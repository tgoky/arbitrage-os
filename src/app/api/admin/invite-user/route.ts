// app/api/admin/invite-user/route.ts
//
// Admin-only endpoint: creates a UserInvite record and sends the invite email
// via Supabase Admin generateLink + Resend.
//
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/utils/supabase/server';
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
    // ── Auth check: caller must be an admin ───────────────────────────────────
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const callerDb = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!callerDb || callerDb.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // ── Check for existing user ───────────────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists.' },
        { status: 409 }
      );
    }

    // ── Upsert invite record ──────────────────────────────────────────────────
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.userInvite.upsert({
      where: { email: trimmedEmail },
      update: {
        status: 'sent',
        sent_at: new Date(),
        expires_at: expiresAt,
      },
      create: {
        email: trimmedEmail,
        status: 'sent',
        sent_at: new Date(),
        expires_at: expiresAt,
      },
    });

    // ── Generate magic link ───────────────────────────────────────────────────
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: trimmedEmail,
      options: {
        redirectTo: `${APP_URL}/api/auth/callback?next=/&invite_id=${invite.id}`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('generateLink error:', linkError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate invite link.' },
        { status: 500 }
      );
    }

    // ── Send via Resend ───────────────────────────────────────────────────────
    const resend = getResendClient();
    const magicLink = linkData.properties.action_link;

    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: trimmedEmail,
      subject: "You're invited to ArbitrageOS",
      html: inviteEmailHtml({ magicLink, email: trimmedEmail, inviteId: invite.id }),
      text: inviteEmailText({ magicLink, email: trimmedEmail, inviteId: invite.id }),
    });

    if (sendError) {
      console.error('Resend send error:', sendError);
      return NextResponse.json(
        { success: false, error: 'Failed to send invite email.' },
        { status: 500 }
      );
    }

    console.log(`Invite sent via Resend to: ${trimmedEmail}`);

    return NextResponse.json({ success: true, inviteId: invite.id });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('invite-user error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
