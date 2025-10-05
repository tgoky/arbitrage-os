// app/api/auth/callback/route.ts
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// app/api/auth/callback/route.ts
export async function GET(request: NextRequest) {
  console.log('🔗 Auth callback triggered');
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const inviteId = searchParams.get('invite_id')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('❌ Auth callback error:', { error, errorDescription })
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, origin)
    )
  }

  if (code) {
    try {
      console.log('🔄 Exchanging code for session...');
      const supabase = await createSupabaseServerClient()
      
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('❌ Code exchange error:', exchangeError)
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

      // ✅ CRITICAL: ALWAYS create/update user in database
      try {
        const userData = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || 
                session.user.user_metadata?.name || 
                null,
          avatar: session.user.user_metadata?.avatar_url || null,
          status: 'active' as const,
          last_login: new Date()
        };

        await prisma.user.upsert({
          where: { id: session.user.id },
          update: {
            status: 'active',
            last_login: new Date()
          },
          create: userData
        });

        console.log('✅ User record created/updated in database');

        // Handle invite acceptance if present
        if (inviteId) {
          const invite = await prisma.userInvite.findUnique({
            where: { id: inviteId }
          });

          if (invite && invite.status === 'sent') {
            await prisma.userInvite.update({
              where: { id: inviteId },
              data: { 
                status: 'accepted',
                accepted_at: new Date()
              }
            });
            console.log('✅ Invite marked as accepted');
          }
        }

      } catch (dbError: any) {
        console.error('❌ Failed to create user record:', dbError);
        console.error('Error code:', dbError.code);
        console.error('Error message:', dbError.message);
        
        // This is critical - don't let them proceed without a user record
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent('Failed to create user account. Please try again.')}`, origin)
        )
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