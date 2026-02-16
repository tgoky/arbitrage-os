// app/api/email-agent/accounts/[id]/route.ts - GMAIL DISCONNECT
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { EmailConnectionService } from '@/services/emailConnection.service';

//   ROBUST AUTHENTICATION
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
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
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('  Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('  User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('  Authentication error:', error);
    return { user: null, error };
  }
}

// DELETE: Disconnect Gmail account
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(' Email Agent Disconnect Account API called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('  Auth failed:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    console.log(`🗑️ Disconnecting email account: ${params.id}`);

    //   Use EmailConnectionService.disconnectEmailAccount (matches your existing code)
    const emailService = new EmailConnectionService();
    await emailService.disconnectEmailAccount(params.id);

    console.log(`  Gmail account disconnected: ${params.id}`);

    return NextResponse.json({
      success: true,
      message: 'Gmail account disconnected successfully'
    });

  } catch (error: any) {
    console.error('  Disconnect email account error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to disconnect email account' 
      },
      { status: 500 }
    );
  }
}