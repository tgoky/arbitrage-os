// app/api/email-agent/accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { EmailConnectionService } from '@/services/emailConnection.service';

// DELETE: Disconnect email account
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const emailService = new EmailConnectionService();
    await emailService.disconnectEmailAccount(params.id);

    return NextResponse.json({
      success: true,
      message: 'Email account disconnected successfully'
    });

  } catch (error: any) {
    console.error('Disconnect email account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect email account' },
      { status: 500 }
    );
  }
}