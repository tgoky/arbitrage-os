// app/api/email-agent/campaigns/route.ts - UPDATED WITH GMAIL HALLUCINATION FIX
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

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
    const { 
      workspaceId, 
      leadIds, 
      emailAccountId, 
      campaignName, 
      emailTemplate, 
      scheduleType,
      isManualEntry,
      manualLeadData,
      ...otherData 
    } = body;

    console.log('📝 Campaign creation request:', {
      workspaceId,
      leadCount: leadIds?.length || 0,
      emailAccountId,
      campaignName,
      scheduleType,
      isManualEntry
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

    let validLeads: any[] = [];
    const leadGenerationMap: { [leadId: string]: string } = {};

    // ✅ HANDLE MANUAL ENTRY WITH PROPER UUIDs AND SMART COMPANY EXTRACTION
    if (isManualEntry && manualLeadData) {
      console.log('📝 Processing manual lead entry with UUIDs...');
      
      // Parse manual lead data
      const manualLines = manualLeadData.split(/[\n,]+/).map((line: string) => line.trim()).filter(Boolean);
      
      manualLines.forEach((line: string, index: number) => {
        const parts = line.split('|').map((p: string) => p.trim());
        const email = parts[0];
        
        if (email && email.includes('@')) {
          const name = parts[1] || email.split('@')[0];
          const providedCompany = parts[2];  // ✅ User-provided company name
          
          const [firstName, ...lastNameParts] = name.split(' ');
          const lastName = lastNameParts.join(' ') || '';
          
          // ✅ SMART COMPANY EXTRACTION (avoids "gmail" problem)
          const emailDomain = email.split('@')[1]?.split('.')[0] || '';
          const isGenericDomain = ['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'protonmail'].includes(emailDomain.toLowerCase());
          
          // Priority: 1) User provided, 2) Domain if not generic, 3) Placeholder
          let companyName = providedCompany;
          if (!companyName) {
            if (isGenericDomain) {
              companyName = 'their company';  // ✅ Generic placeholder instead of "gmail"
            } else {
              companyName = emailDomain.charAt(0).toUpperCase() + emailDomain.slice(1);
            }
          }
          
          // ✅ Generate proper UUID for manual leads
          const leadUUID = randomUUID();
          
          validLeads.push({
            id: leadUUID,
            name: name,
            email: email,
            first_name: firstName,
            last_name: lastName,
            company: companyName,  // ✅ FIXED: No more "gmail" as company
            title: 'Contact',
            job_title: 'Contact',
            industry: 'Unknown',
            location: 'Unknown',
            score: 50,
            isManualEntry: true,
            manualEntryIndex: index,
            originalEmail: email
          });
          
          leadGenerationMap[leadUUID] = 'manual_entry';
        }
      });
      
      console.log(`✅ Processed ${validLeads.length} manual leads with proper UUIDs and company names`);
      
    } else {
      // ✅ HANDLE LEAD GENERATION IMPORT
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
                first_name: lead.name.split(' ')[0],
                last_name: lead.name.split(' ').slice(1).join(' '),
                job_title: lead.title,
                generationId: deliverable.id,
                generationTitle: deliverable.title,
                isManualEntry: false
              });
              leadGenerationMap[lead.id] = deliverable.id;
            });
          }
        } catch (error) {
          console.error(`Failed to parse deliverable ${deliverable.id}`);
        }
      });
      
      console.log(`✅ Validated ${validLeads.length} leads from deliverables`);
    }

    if (validLeads.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: isManualEntry 
          ? 'No valid email addresses found in manual entry' 
          : 'No valid leads found from your lead generation campaigns' 
      }, { status: 400 });
    }

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
      leads: validLeads,
      leadGenerationMap,
      isManualEntry
    };

    console.log('🎯 Creating campaign with config:', {
      name: campaignConfig.name,
      leadCount: campaignConfig.leads.length,
      scheduleType: campaignConfig.scheduleType,
      hasAutoReply: campaignConfig.autoReply,
      hasAutoFollowup: campaignConfig.autoFollowup,
      isManualEntry: campaignConfig.isManualEntry,
      sampleLeadIds: validLeads.slice(0, 2).map(l => l.id)
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
          [...new Set(Object.values(metadata.leadGenerationMap))] : [],
        isManualEntry: metadata?.isManualEntry || false
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