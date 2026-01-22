// app/api/agent-crews/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { CrewExecutionService } from '@/services/agent-runtime/CrewExecutionService';

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
      return { user: null, error: error || new Error('No user found') };
    }
    
    return { user, error: null };
    
  } catch (error) {
    return { user: null, error };
  }
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { workspaceId, crew, inputs = {} } = await req.json();

    if (!workspaceId || !crew) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate crew has agents and tasks
    if (!crew.agents || crew.agents.length === 0) {
      return NextResponse.json(
        { error: 'Crew must have at least one agent' },
        { status: 400 }
      );
    }

    if (!crew.tasks || crew.tasks.length === 0) {
      return NextResponse.json(
        { error: 'Crew must have at least one task' },
        { status: 400 }
      );
    }

    const executionService = new CrewExecutionService();

    // Start execution (non-blocking)
    const result = await executionService.executeCrew(
      crew,
      workspaceId,
      user.id,
      inputs
    );

    return NextResponse.json({
      success: true,
      executionId: result.executionId,
      status: result.status
    });

  } catch (error: any) {
    console.error('Execution failed:', error);
    return NextResponse.json(
      { error: error.message || 'Execution failed' },
      { status: 500 }
    );
  }
}

// Streaming execution endpoint
export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const executionId = searchParams.get('executionId');
  const workspaceId = searchParams.get('workspaceId');

  if (!executionId || !workspaceId) {
    return new Response('Missing parameters', { status: 400 });
  }

  // Return SSE stream for execution updates
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', executionId })}\n\n`)
      );

      // Poll for updates (in production, use Redis pub/sub or WebSockets)
      const pollInterval = setInterval(async () => {
        try {
          const { prisma } = await import('@/lib/prisma');
          
          const execution = await prisma.deliverable.findFirst({
            where: {
              type: 'crew_execution',
              metadata: {
                path: ['executionId'],
                equals: executionId
              }
            }
          });

          if (execution) {
            const content = JSON.parse(execution.content);
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'update',
                status: content.status,
                steps: content.steps?.slice(-5) || [],
                taskResults: content.taskResults
              })}\n\n`)
            );

            // If execution is complete, close the stream
            if (content.status === 'completed' || content.status === 'failed') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'complete',
                  result: content
                })}\n\n`)
              );
              
              clearInterval(pollInterval);
              controller.close();
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);

      // Cleanup on abort
      req.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}