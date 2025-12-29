// app/api/email-agent/leads/route.ts
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

// GET /api/email-agent/leads - Fetch leads from deliverables
export async function GET(req: NextRequest) {
  console.log('🚀 Email Agent Leads API called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required',
        code: 'WORKSPACE_ID_REQUIRED'
      }, { status: 400 });
    }

    console.log('📊 Fetching lead deliverables for workspace:', workspaceId);

    // ✅ Fetch from deliverables (SAME AS LEAD GEN)
    const deliverables = await prisma.deliverable.findMany({
      where: {
        workspace_id: workspaceId,
        user_id: user.id,
        type: 'lead-generation'
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        metadata: true,
        created_at: true,
        updated_at: true
      }
    });

    console.log(`📊 Found ${deliverables.length} lead generation deliverables`);

    // ✅ Extract all leads from all deliverables (SAME AS LEAD GEN)
    const allLeads: any[] = [];
    
    deliverables.forEach(deliverable => {
      try {
        const parsedContent = JSON.parse(deliverable.content);
        
        if (parsedContent.leads && Array.isArray(parsedContent.leads)) {
          const leadsWithContext = parsedContent.leads.map((lead: any) => ({
            // Original lead data from Apollo
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            title: lead.title,
            company: lead.company,
            industry: lead.industry,
            companySize: lead.companySize,
            location: lead.location,
            linkedinUrl: lead.linkedinUrl,
            website: lead.website,
            score: lead.score,
            apolloId: lead.apolloId,
            metadata: lead.metadata,
            
            // Add generation context
            first_name: lead.name.split(' ')[0],
            last_name: lead.name.split(' ').slice(1).join(' '),
            job_title: lead.title,
            
            // Track which generation this came from
            generationId: deliverable.id,
            generationTitle: deliverable.title,
            
            // Email campaign status (for tracking)
            emailCampaignStatus: lead.emailCampaignStatus || 'not_sent',
            lastContacted: lead.lastContacted || null,
            lastEmailSent: lead.lastEmailSent || null,
            emailsSent: lead.emailsSent || 0,
            emailsOpened: lead.emailsOpened || 0,
            emailsReplied: lead.emailsReplied || 0,
            
            // Timestamps
            createdAt: deliverable.created_at,
            updatedAt: deliverable.updated_at
          }));
          
          allLeads.push(...leadsWithContext);
        }
      } catch (parseError) {
        console.error(`Failed to parse deliverable ${deliverable.id}:`, parseError);
      }
    });

    console.log(`✅ Extracted ${allLeads.length} total leads from deliverables`);

    // Group leads by generation for UI display
    const leadsByGeneration = deliverables.map(deliverable => {
      try {
        const parsedContent = JSON.parse(deliverable.content);
        const leads = parsedContent.leads || [];
        
        return {
          generationId: deliverable.id,
          generationTitle: deliverable.title,
          leadCount: leads.length,
          createdAt: deliverable.created_at,
          metadata: deliverable.metadata,
          leads: leads.map((lead: any) => ({
            ...lead,
            generationId: deliverable.id,
            generationTitle: deliverable.title
          }))
        };
      } catch (error) {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        leads: allLeads,
        totalLeads: allLeads.length,
        totalGenerations: deliverables.length,
        leadsByGeneration
      }
    });

  } catch (error: any) {
    console.error('💥 Email Agent Leads API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch leads',
        debug: error instanceof Error ? error.message : 'Unknown error',
        code: 'FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}