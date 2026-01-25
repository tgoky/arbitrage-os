// app/api/auth/callback/route.ts
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {

  console.log('🔗 Auth callback triggered');

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const inviteId = searchParams.get('invite_id')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('Callback params:', { code: !!code, inviteId, next, error });

  // Handle error cases
  if (error) {
    console.error('❌ Auth callback error:', { error, errorDescription })
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, origin)
    )
  }

  // Handle successful authentication
  if (code) {
    try {
      console.log('🔄 Exchanging code for session...');
      const supabase = await createSupabaseServerClient()

      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('❌ Code exchange error:', exchangeError)

        // If expired, redirect to resend page with invite_id
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

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { email: session.user.email! }
            });

            if (existingUser) {
              // Update existing user
              await prisma.user.update({
                where: { email: session.user.email! },
                data: {
                  status: 'active',
                  last_login: new Date()
                }
              });
            } else {
              // Create new user - they can set password later when they log out and log back in
              await prisma.user.create({
                data: {
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata?.full_name || null,
                  status: 'active',
                  has_password: false,
                  last_login: new Date(),
                  invite_sent_at: invite.sent_at
                }
              });
            }

            console.log('✅ Invite accepted and user created/updated');
          }
        } catch (inviteError) {
          console.error('❌ Error processing invite:', inviteError);
          // Don't block login if invite processing fails
        }
      } else {
        // No invite_id - update last login for existing users
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: session.user.email! }
          });

          if (existingUser) {
            // Update last login
            await prisma.user.update({
              where: { email: session.user.email! },
              data: { last_login: new Date() }
            });
          }
        } catch (userError) {
          console.error('❌ Error checking user:', userError);
        }
      }

      // Redirect directly to the app - users can set password later if they want
      console.log('🚀 Redirecting to:', next);
      return NextResponse.redirect(new URL(next, origin))

    } catch (error: any) {
      console.error('❌ Auth confirmation error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message || 'Server error')}`, origin)
      )
    }
  }

  // No code parameter - redirect to error
  console.error('❌ No authentication code provided');
  return NextResponse.redirect(
    new URL('/login?error=Missing authentication code', origin)
  )
}