// app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    // Resend confirmation email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });

    if (error) {
      console.error('Resend verification error:', error);
      return NextResponse.json(
        { error: 'Failed to resend verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent successfully' 
    });

  } catch (error) {
    console.error('Resend verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
