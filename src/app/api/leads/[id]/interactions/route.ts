// app/api/leads/[id]/interactions/route.ts - SEPARATE FILE

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
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: { get: () => undefined },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('Token auth failed:', tokenError);
      }
    }
    
    // Method 2: SSR cookies
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              try {
                const cookie = cookieStore.get(name);
                if (!cookie?.value) return undefined;
                
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded);
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
                    return undefined;
                  }
                }
                
                return cookie.value;
              } catch (error) {
                console.warn(`Error reading cookie ${name}:`, error);
                return undefined;
              }
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (routeError) {
      console.warn('Route handler auth failed:', routeError);
    }
    
    return { user: null, error: new Error('All authentication methods failed') };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error };
  }
}

// Helper function to find a lead in all generations
async function findLeadInGenerations(userId: string, leadId: string) {
  const generations = await prisma.deliverable.findMany({
    where: {
      user_id: userId,
      type: 'lead_generation'
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

// POST /api/leads/[id]/interactions - Add interaction
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Add Interaction API called for lead ID:', params.id);
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('📝 Interaction data:', body);

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
        type: 'lead_generation'
      }
    });

    if (!generation) {
      return NextResponse.json(
        { success: false, error: 'Generation not found' },
        { status: 404 }
      );
    }

    const interaction: Interaction = {
      id: `interaction_${Date.now()}`,
      type: body.type || 'note',
      content: body.content,
      date: new Date().toISOString(),
      userId: user.id,
      userName: user.email?.split('@')[0] || 'User'
    };

    const metadata = generation.metadata as any || {};
    const interactions = metadata.interactions || {};
    const leadInteractions: Interaction[] = interactions[params.id] || [];

    leadInteractions.push(interaction);
    interactions[params.id] = leadInteractions;

    const updatedMetadata = {
      ...metadata,
      interactions
    };

    await prisma.deliverable.update({
      where: { id: generation.id },
      data: {
        metadata: updatedMetadata,
        updated_at: new Date()
      }
    });

    console.log('✅ Interaction added successfully');

    return NextResponse.json({
      success: true,
      message: 'Interaction added successfully',
      data: { interaction }
    });

  } catch (error) {
    console.error('💥 Add Interaction Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add interaction' },
      { status: 500 }
    );
  }
}