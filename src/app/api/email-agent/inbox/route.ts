// app/api/email-agent/inbox/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');
    const inboundEmails = await prisma.inboundEmail.findMany({
      where: {
        workspace_id: workspaceId,
        ...(unreadOnly && { processed: false })
      },
      orderBy: { received_at: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      emails: inboundEmails
    });

  } catch (error: any) {
    console.error('Fetch inbox error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}