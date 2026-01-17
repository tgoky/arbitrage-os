// app/api/agent-crews/executions/[executionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

// ✅ COPY THE SAME AUTHENTICATION FUNCTION FROM NICHE RESEARCHER
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

export async function GET(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');

  try {
    const execution = await prisma.deliverable.findFirst({
      where: {
        id: params.executionId,
        workspace_id: workspaceId!,
        type: 'agent_execution'
      }
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    const content = JSON.parse(execution.content);

    // ✅ SAFELY ACCESS METADATA.STATUS WITH PROPER TYPE GUARD
    let statusValue = 'completed'; // Default fallback
    
    if (execution.metadata && typeof execution.metadata === 'object' && execution.metadata !== null) {
      const metadataObj = execution.metadata as Record<string, any>;
      statusValue = metadataObj.status || 'completed';
    } else if (typeof execution.metadata === 'string') {
      try {
        const parsedMetadata = JSON.parse(execution.metadata);
        statusValue = parsedMetadata.status || 'completed';
      } catch {
        statusValue = 'completed';
      }
    }

    return NextResponse.json({
      success: true,
      execution: {
        id: execution.id,
        crewName: execution.title,
        status: statusValue,
        startTime: execution.created_at,
        endTime: execution.updated_at,
        steps: content.steps || [],
        agents: content.agents || [],
        tasks: content.tasks || [],
        result: content.result,
        error: content.error
      }
    });
  } catch (error: any) {
    console.error('Failed to get execution:', error);
    return NextResponse.json(
      { error: 'Failed to get execution' },
      { status: 500 }
    );
  }
}