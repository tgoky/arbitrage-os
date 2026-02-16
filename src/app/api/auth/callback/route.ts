import { createSupabaseServerClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  console.log('🔗 Auth callback triggered');
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const inviteId = searchParams.get('invite_id')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('Callback params:', { 
    code: !!code, 
    token: !!token,
    type, 
    inviteId, 
    next, 
    error 
  });

  // Handle error cases
  if (error) {
    console.error('  Auth callback error:', { error, errorDescription })
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, origin)
    )
  }

  // If we have a code or token, exchange it for a session
  const authCode = code || token
  
  if (authCode) {
    try {
      console.log('🔄 Exchanging code for session...');
      const supabase = await createSupabaseServerClient()
      
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)
      
      if (exchangeError) {
        console.error('  Code exchange error:', exchangeError)
        
        if (exchangeError.message.includes('expired') || exchangeError.message.includes('invalid')) {
          return NextResponse.redirect(
            new URL(`/invite-expired?error=link_expired&invite_id=${inviteId || ''}`, origin)
          )
        }
        
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, origin)
        )
      }

      if (!session) {
        console.error('  No session created');
        return NextResponse.redirect(
          new URL('/login?error=Failed to create session', origin)
        )
      }

      console.log('  Session created successfully for user:', session.user.id);

      // Ensure user exists in database
      try {
        await prisma.user.upsert({
          where: { id: session.user.id },
          update: {
            status: 'active',
            last_login: new Date(),
            email: session.user.email!,
          },
          create: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || null,
            status: 'active',
            last_login: new Date()
          }
        });
        console.log('  User record ensured in database');
      } catch (userError) {
        console.error('  Error ensuring user exists:', userError);
      }

      // Handle invite acceptance
      if (inviteId) {
        try {
          const invite = await prisma.userInvite.findUnique({
            where: { id: inviteId }
          });

          if (invite) {
            if (invite.expires_at && new Date() > invite.expires_at) {
              console.log('  Invite expired');
              return NextResponse.redirect(
                new URL(`/invite-expired?error=invite_expired&invite_id=${inviteId}`, origin)
              );
            }

            await prisma.userInvite.update({
              where: { id: inviteId },
              data: {
                status: 'accepted',
                accepted_at: new Date()
              }
            });

            await prisma.user.update({
              where: { id: session.user.id },
              data: {
                invite_sent_at: invite.sent_at
              }
            });

            console.log('  Invite accepted');
          }
        } catch (inviteError) {
          console.error('  Error processing invite:', inviteError);
        }
      }

      console.log(' Redirecting to:', next);
      return NextResponse.redirect(new URL(next, origin))
      
    } catch (error: any) {
      console.error('  Auth confirmation error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message || 'Server error')}`, origin)
      )
    }
  }

  // If no code/token but we have an inviteId, this might be a direct invite link
  // Redirect to login page which will handle the fragment-based auth
  if (inviteId) {
    console.log('📨 No auth code, but inviteId present - redirecting to login');
    return NextResponse.redirect(new URL(`/login?invite_id=${inviteId}`, origin));
  }

  console.error('  No authentication code provided');
  return NextResponse.redirect(
    new URL('/login?error=Missing authentication code', origin)
  );
}