// app/api/email-agent/accounts/route.ts - GMAIL OAUTH ONLY
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { EmailConnectionService } from '@/services/emailConnection.service';

// ✅ ROBUST AUTHENTICATION (same pattern as n8n and lead gen)
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
      console.error('❌ Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('✅ User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { user: null, error };
  }
}

// GET /api/email-agent/accounts - List connected Gmail accounts
export async function GET(req: NextRequest) {
  console.log('🚀 Email Agent Accounts API called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required' 
      }, { status: 400 });
    }

    console.log(`📧 Fetching email accounts for workspace: ${workspaceId}`);

    // ✅ Use EmailConnectionService (matches your existing code)
    const emailService = new EmailConnectionService();
    const accounts = await emailService.getWorkspaceEmailAccounts(workspaceId);

    console.log(`✅ Found ${accounts.length} email accounts`);

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        total: accounts.length,
        enabled: accounts.filter(a => a.enabled).length
      }
    });

  } catch (error: any) {
    console.error('💥 Fetch accounts error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch email accounts' 
      },
      { status: 500 }
    );
  }
}

// POST /api/email-agent/accounts - Connect Gmail via OAuth (callback handler)
export async function POST(req: NextRequest) {
  console.log('🚀 Email Agent Connect Gmail API called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, authCode } = body;

    if (!workspaceId || !authCode) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID and OAuth authorization code are required' 
      }, { status: 400 });
    }

    console.log(`📧 Connecting Gmail account for workspace: ${workspaceId}`);

    // ✅ Use EmailConnectionService.connectGmail (matches your existing code)
    const emailService = new EmailConnectionService();
    const result = await emailService.connectGmail(user.id, workspaceId, authCode);

    console.log(`✅ Gmail account connected: ${result.account.email}`);

    return NextResponse.json({
      success: true,
      data: result.account,
      message: 'Gmail account connected successfully'
    });

  } catch (error: any) {
    console.error('💥 Connect Gmail error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to connect Gmail account' 
      },
      { status: 500 }
    );
  }
}