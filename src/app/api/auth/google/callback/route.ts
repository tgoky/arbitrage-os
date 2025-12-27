// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // workspaceId
    const error = searchParams.get('error');

    if (error) {
      // User denied access
      return NextResponse.redirect(
        new URL(`/dashboard/${state}?error=access_denied`, req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=invalid_callback`, req.url)
      );
    }

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
      return NextResponse.redirect(
        new URL(`/dashboard?error=unauthorized`, req.url)
      );
    }

    // Connect Gmail
    const { EmailConnectionService } = await import('@/services/emailConnection.service');
    const emailService = new EmailConnectionService();
    await emailService.connectGmail(user.id, state, code);

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      new URL(`/dashboard/${state}/email-agent?connected=true`, req.url)
    );

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=connection_failed`, req.url)
    );
  }
}