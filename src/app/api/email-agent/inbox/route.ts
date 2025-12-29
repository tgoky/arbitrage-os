// app/api/email-agent/inbox/route.ts - WITH ROBUST AUTH
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

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

// GET /api/email-agent/inbox - Fetch inbound emails
export async function GET(req: NextRequest) {
  console.log('🚀 Email Agent Inbox API called');
  
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
    const emailAccountId = searchParams.get('emailAccountId');
    const unprocessedOnly = searchParams.get('unprocessedOnly') === 'true';

    if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required' 
      }, { status: 400 });
    }

    console.log(`📥 Fetching inbox for workspace: ${workspaceId}`);

    // Build query filters
    const whereClause: any = {
      workspace_id: workspaceId
    };

    if (emailAccountId) {
      whereClause.email_account_id = emailAccountId;
    }

    if (unprocessedOnly) {
      whereClause.processed = false;
    }

    // Fetch inbound emails
    const inboundEmails = await prisma.inboundEmail.findMany({
      where: whereClause,
      orderBy: { received_at: 'desc' },
      take: 100,  // Limit to most recent 100
      select: {
        id: true,
        from: true,
        to: true,
        subject: true,
        body: true,
        received_at: true,
        processed: true,
        sentiment: true,
        ai_summary: true,
        requires_action: true,
        email_account_id: true,
        created_at: true
      }
    });

    console.log(`✅ Found ${inboundEmails.length} inbound emails`);

    return NextResponse.json({
      success: true,
      data: {
        emails: inboundEmails,
        total: inboundEmails.length,
        unprocessed: inboundEmails.filter(e => !e.processed).length,
        requiresAction: inboundEmails.filter(e => e.requires_action).length
      }
    });

  } catch (error: any) {
    console.error('💥 Fetch inbox error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch inbox' 
      },
      { status: 500 }
    );
  }
}

// POST /api/email-agent/inbox/process - Manually trigger inbound email processing
export async function POST(req: NextRequest) {
  console.log('🚀 Email Agent Process Inbox API called');
  
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
    const { workspaceId, emailAccountId } = body;

    if (!workspaceId || !emailAccountId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID and Email Account ID required' 
      }, { status: 400 });
    }

    console.log(`📥 Processing inbox for email account: ${emailAccountId}`);

    const { EmailCampaignAgent } = await import('@/services/emailCampaignAgent.service');
    const agent = new EmailCampaignAgent();
    
    const result = await agent.processInboundEmails(emailAccountId, workspaceId);

    console.log(`✅ Processed ${result.processed} inbound emails`);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('💥 Process inbox error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to process inbox' 
      },
      { status: 500 }
    );
  }
}