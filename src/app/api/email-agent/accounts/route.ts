// app/api/email-agent/accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { EmailConnectionService } from '@/services/emailConnection.service';

// GET: Fetch all connected email accounts
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

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const emailService = new EmailConnectionService();
    const accounts = await emailService.getWorkspaceEmailAccounts(workspaceId);

    return NextResponse.json({
      success: true,
      accounts
    });

  } catch (error: any) {
    console.error('Fetch email accounts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email accounts' },
      { status: 500 }
    );
  }
}