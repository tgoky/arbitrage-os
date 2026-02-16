// app/api/auth/google/callback/route.ts - FIXED REDIRECTS
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  console.log(' Google OAuth Callback received');
  
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // workspaceId
    const error = searchParams.get('error');

    console.log('📊 OAuth params:', {
      hasCode: !!code,
      hasState: !!state,
      error: error || 'none'
    });

    //   User denied access
    if (error) {
      console.log('  OAuth error from Google:', error);
      const redirectUrl = state 
        ? `/email-agent?error=access_denied&workspaceId=${state}`
        : `/dashboard?error=access_denied`;
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    //   Missing required params
    if (!code) {
      console.log('  Missing OAuth code');
      const redirectUrl = state
        ? `/email-agent?error=invalid_callback&workspaceId=${state}`
        : `/dashboard?error=invalid_callback`;
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    if (!state) {
      console.log('  Missing workspace ID (state)');
      return NextResponse.redirect(
        new URL(`/dashboard?error=invalid_callback`, req.url)
      );
    }

    console.log(`  OAuth code received for workspace: ${state}`);

    //   Verify user authentication
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
      console.error('  User authentication failed:', authError);
      return NextResponse.redirect(
        new URL(`/email-agent?error=unauthorized&workspaceId=${state}`, req.url)
      );
    }

    console.log(`  User authenticated: ${user.id}`);

    //   Connect Gmail account
    console.log('🔐 Connecting Gmail account...');
    
    const { EmailConnectionService } = await import('@/services/emailConnection.service');
    const emailService = new EmailConnectionService();
    
    const result = await emailService.connectGmail(user.id, state, code);
    
    console.log(`  Gmail connected successfully: ${result.account.email}`);

    //  Redirect back to email-agent with success (direct route, not nested in dashboard)
    return NextResponse.redirect(
      new URL(`/email-agent?connected=true&workspaceId=${state}`, req.url)
    );

  } catch (error: any) {
    console.error('  OAuth callback error:', error);
    console.error('Error stack:', error.stack);
    
    //  FIX: Include workspace ID in error redirect if available
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state');
    
    const redirectUrl = state
      ? `/email-agent?error=connection_failed&workspaceId=${state}`
      : `/dashboard?error=connection_failed`;
    
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }
}