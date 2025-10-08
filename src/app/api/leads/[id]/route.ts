// app/api/leads/[id]/route.ts - COMPLETE FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

interface Interaction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  content: string;
  date: string;
  userId: string;
  userName: string;
}

// Same robust authentication as other routes
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


// Helper function to find a lead in all generations
async function findLeadInGenerations(userId: string, leadId: string) {
  const generations = await prisma.deliverable.findMany({
    where: {
      user_id: userId,
      type: 'lead-generation'
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  for (const generation of generations) {
    try {
      const parsedContent = JSON.parse(generation.content);
      const leads = parsedContent.leads || [];
      
      const leadIndex = leads.findIndex((lead: any) => 
        lead.id === leadId || 
        lead.apolloId === leadId ||
        `${generation.id}_lead_${leads.indexOf(lead)}` === leadId
      );
      
      if (leadIndex !== -1) {
        const lead = leads[leadIndex];
        
        return {
          lead: {
            ...lead,
            id: lead.id || `${generation.id}_lead_${leadIndex}`,
            generationId: generation.id,
            generationTitle: generation.title,
            notes: lead.notes || '',
            status: lead.status || 'new',
            lastContacted: lead.lastContacted || null,
            createdAt: generation.created_at,
            updatedAt: generation.updated_at
          },
          generation: {
            id: generation.id,
            title: generation.title,
            workspace: generation.workspace
          }
        };
      }
    } catch (parseError) {
      console.warn('Error parsing generation content:', generation.id, parseError);
      continue;
    }
  }
  
  return null;
}

// GET /api/leads/[id] - Get specific lead details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Lead Detail API called for ID:', params.id);
  
  try {
  const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    const result = await findLeadInGenerations(user.id, params.id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Get interactions from metadata
    const generations = await prisma.deliverable.findFirst({
      where: {
        id: result.generation.id,
        user_id: user.id,
        type: 'lead-generation'
      }
    });

    const interactions: Interaction[] = [];
    if (generations?.metadata) {
      const metadata = generations.metadata as any;
      const allInteractions = metadata.interactions || {};
      const leadInteractions = allInteractions[params.id] || [];
      interactions.push(...leadInteractions);
    }

    console.log('✅ Found lead:', result.lead.name);

    return NextResponse.json({
      success: true,
      data: {
        lead: result.lead,
        interactions: interactions,
        generation: result.generation
      }
    });

  } catch (error) {
    console.error('💥 Lead Detail API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lead details' },
      { status: 500 }
    );
  }
}

// PATCH /api/leads/[id] - Update lead
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Lead Update API called for ID:', params.id);
  
  try {
   const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('📝 Update data:', body);

    const result = await findLeadInGenerations(user.id, params.id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const generation = await prisma.deliverable.findFirst({
      where: {
        id: result.generation.id,
        user_id: user.id,
        type: 'lead-generation'
      }
    });

    if (!generation) {
      return NextResponse.json(
        { success: false, error: 'Generation not found' },
        { status: 404 }
      );
    }

    const parsedContent = JSON.parse(generation.content);
    const leads = parsedContent.leads || [];
    
    const leadIndex = leads.findIndex((lead: any) => 
      lead.id === params.id || 
      lead.apolloId === params.id ||
      `${generation.id}_lead_${leads.indexOf(lead)}` === params.id
    );

    if (leadIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Lead not found in generation' },
        { status: 404 }
      );
    }

    leads[leadIndex] = {
      ...leads[leadIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };

    const updatedContent = {
      ...parsedContent,
      leads
    };

    await prisma.deliverable.update({
      where: { id: generation.id },
      data: {
        content: JSON.stringify(updatedContent),
        updated_at: new Date()
      }
    });

    console.log('✅ Lead updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully'
    });

  } catch (error) {
    console.error('💥 Lead Update Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
