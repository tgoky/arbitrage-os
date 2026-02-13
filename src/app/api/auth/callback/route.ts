import { createSupabaseServerClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  console.log('🔗 Auth callback triggered');
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')  // Magic links might use 'token'
  const type = searchParams.get('type')    // Should be 'magiclink'
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

  if (error) {
    console.error('❌ Auth callback error:', { error, errorDescription })
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, origin)
    )
  }

  // Handle both code and token (magic link might use token)
  const authCode = code || token
  
  if (authCode) {
    try {
      console.log('🔄 Exchanging code for session...');
      const supabase = await createSupabaseServerClient()
      
      // Exchange the code for a session
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)
      
      if (exchangeError) {
        console.error('❌ Code exchange error:', exchangeError)
        
        // If expired or invalid
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
        console.error('❌ No session created');
        return NextResponse.redirect(
          new URL('/login?error=Failed to create session', origin)
        )
      }

      console.log('✅ Session created successfully for user:', session.user.id);

      // ALWAYS ensure user exists in database on every login
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
        console.log('✅ User record ensured in database');
      } catch (userError) {
        console.error('❌ Error ensuring user exists:', userError);
      }

      // Handle invite acceptance if invite_id is present
      if (inviteId) {
        try {
          const invite = await prisma.userInvite.findUnique({
            where: { id: inviteId }
          });

          if (invite) {
            // Check if expired (7 days)
            if (invite.expires_at && new Date() > invite.expires_at) {
              console.log('❌ Invite expired (7 days passed)');
              return NextResponse.redirect(
                new URL(`/invite-expired?error=invite_expired&invite_id=${inviteId}`, origin)
              );
            }

            // Mark invite as accepted
            await prisma.userInvite.update({
              where: { id: inviteId },
              data: {
                status: 'accepted',
                accepted_at: new Date()
              }
            });

            // Update user with invite info
            await prisma.user.update({
              where: { id: session.user.id },
              data: {
                invite_sent_at: invite.sent_at
              }
            });

            console.log('✅ Invite accepted and user updated with invite info');
          }
        } catch (inviteError) {
          console.error('❌ Error processing invite:', inviteError);
        }
      }

      console.log('🚀 Redirecting to:', next);
      return NextResponse.redirect(new URL(next, origin))
      
    } catch (error: any) {
      console.error('❌ Auth confirmation error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message || 'Server error')}`, origin)
      )
    }
  }

  console.error('❌ No authentication code provided');
  return NextResponse.redirect(
    new URL('/login?error=Missing authentication code', origin)
  )
}