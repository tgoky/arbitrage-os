// app/api/auth/resend-invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const { inviteId } = await request.json();

    if (!inviteId) {
      return NextResponse.json(
        { success: false, error: 'Invite ID required' },
        { status: 400 }
      );
    }

    const invite = await prisma.userInvite.findUnique({ where: { id: inviteId } });

    if (!invite) {
      return NextResponse.json({ success: false, error: 'Invalid invite' }, { status: 404 });
    }

    if (invite.status === 'accepted') {
      return NextResponse.json({ success: false, error: 'This invite has already been used' }, { status: 400 });
    }

    if (invite.expires_at && new Date() > invite.expires_at) {
      return NextResponse.json({
        success: false,
        error: 'This invite has expired (7 days). Please contact your admin for a new invitation.'
      }, { status: 400 });
    }

    // Generate magic link via Supabase service role (generates URL only, does NOT send any email)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: invite.email,
      options: { redirectTo: `${appUrl}/api/auth/callback?next=/&invite_id=${invite.id}` },
    });

    if (linkError || !data?.properties?.action_link) {
      console.error('generateLink error:', linkError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate magic link.' },
        { status: 500 }
      );
    }

    // Send branded email via Resend (not Supabase)
    await EmailService.sendMagicLinkEmail(invite.email, data.properties.action_link);

    await prisma.userInvite.update({
      where: { id: inviteId },
      data: { sent_at: new Date() }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Resend invite error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
