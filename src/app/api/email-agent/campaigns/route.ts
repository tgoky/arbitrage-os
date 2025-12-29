// app/api/email-agent/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Same authentication pattern as Lead Gen
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

// POST: Create new email campaign
export async function POST(req: NextRequest) {
  console.log('🚀 Email Campaign Create API called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, leadIds, emailAccountId, campaignName, emailTemplate, scheduleType, ...otherData } = body;

    console.log('📝 Campaign creation request:', {
      workspaceId,
      leadCount: leadIds?.length || 0,
      emailAccountId,
      campaignName,
      scheduleType
    });

    if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required' 
      }, { status: 400 });
    }

    if (!leadIds || leadIds.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'At least one lead must be selected' 
      }, { status: 400 });
    }

    if (!emailAccountId) {
      return NextResponse.json({ 
        success: false,
        error: 'Email account must be connected' 
      }, { status: 400 });
    }

    // ✅ Validate leads exist in deliverables (SAME AS LEAD GEN PATTERN)
    console.log('🔍 Validating leads from deliverables...');
    
    const deliverables = await prisma.deliverable.findMany({
      where: {
        workspace_id: workspaceId,
        user_id: user.id,
        type: 'lead-generation'
      },
      select: {
        id: true,
        title: true,
        content: true
      }
    });

    console.log(`📊 Found ${deliverables.length} lead generation deliverables`);

    // Extract and validate lead IDs
    const validLeads: any[] = [];
    const leadGenerationMap: { [leadId: string]: string } = {}; // Track which generation each lead came from
    
    deliverables.forEach(deliverable => {
      try {
        const parsedContent = JSON.parse(deliverable.content);
        if (parsedContent.leads && Array.isArray(parsedContent.leads)) {
          const matchingLeads = parsedContent.leads.filter((lead: any) => 
            leadIds.includes(lead.id)
          );
          
          matchingLeads.forEach((lead: any) => {
            validLeads.push({
              ...lead,
              generationId: deliverable.id,
              generationTitle: deliverable.title
            });
            leadGenerationMap[lead.id] = deliverable.id;
          });
        }
      } catch (error) {
        console.error(`Failed to parse deliverable ${deliverable.id}`);
      }
    });

    if (validLeads.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No valid leads found from your lead generation campaigns' 
      }, { status: 400 });
    }

    console.log(`✅ Validated ${validLeads.length} leads from deliverables`);

    // ✅ Create campaign with validated leads stored in metadata
    const { EmailCampaignAgent } = await import('@/services/emailCampaignAgent.service');
    const agent = new EmailCampaignAgent();
    
    const campaignConfig = {
      name: campaignName,
      emailAccountId,
      emailTemplate: emailTemplate || {
        subject: 'Reaching out',
        body: 'Hi {{firstName}},\n\nI hope this email finds you well...'
      },
      scheduleType: scheduleType || 'immediate',
      autoReply: otherData.autoReply || false,
      autoFollowup: otherData.autoFollowup || false,
      followupInterval: otherData.followupInterval || 3,
      maxFollowups: otherData.maxFollowups || 3,
      leads: validLeads, // ✅ Pass full lead objects with generation context
      leadGenerationMap // ✅ Track source generation for each lead
    };

    console.log('🎯 Creating campaign with config:', {
      name: campaignConfig.name,
      leadCount: campaignConfig.leads.length,
      scheduleType: campaignConfig.scheduleType,
      hasAutoReply: campaignConfig.autoReply,
      hasAutoFollowup: campaignConfig.autoFollowup
    });

    const result = await agent.createCampaign(user.id, workspaceId, campaignConfig);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('💥 Create campaign error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create campaign' 
      },
      { status: 500 }
    );
  }
}

// GET: Fetch all campaigns
export async function GET(req: NextRequest) {
  console.log('🚀 Email Campaigns List API called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
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

    const campaigns = await prisma.emailCampaign.findMany({
      where: {
        workspace_id: workspaceId,
        user_id: user.id
      },
      include: {
        emailAccount: {
          select: {
            email: true,
            provider: true
          }
        },
        sentEmails: {
          select: {
            id: true,
            status: true,
            opened_at: true,
            clicked_at: true,
            replied_at: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Enrich campaigns with lead generation context
    const enrichedCampaigns = campaigns.map(campaign => {
      const metadata = campaign.metadata as any;
      const leads = metadata?.leads || [];
      
      return {
        ...campaign,
        leadCount: leads.length,
        sentCount: campaign.sentEmails.length,
        openedCount: campaign.sentEmails.filter((e: any) => e.opened_at).length,
        clickedCount: campaign.sentEmails.filter((e: any) => e.clicked_at).length,
        repliedCount: campaign.sentEmails.filter((e: any) => e.replied_at).length,
        leadGenerations: metadata?.leadGenerationMap ? 
          [...new Set(Object.values(metadata.leadGenerationMap))] : []
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedCampaigns
    });

  } catch (error: any) {
    console.error('💥 Fetch campaigns error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch campaigns' 
      },
      { status: 500 }
    );
  }
}