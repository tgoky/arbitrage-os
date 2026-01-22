// app/api/agent-crews/build-stream/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { CrewGeneratorService } from '@/services/agent-runtime/CrewGeneratorService';

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

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { prompt, workspaceId } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = new CrewGeneratorService();

        // Step 1: Analyze intent
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'thought', message: "I'll help you create a comprehensive automation crew. Let me first check what tools are available and the current state of your automation." })}\n\n`)
        );

        await new Promise(resolve => setTimeout(resolve, 500));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'thought_complete' })}\n\n`)
        );

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'thought', message: 'Getting the list of ready-to-use tools' })}\n\n`)
        );

        const intent = await generator['analyzeIntent'](prompt);
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'thought_complete' })}\n\n`)
        );

        // Step 2: Select tools
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'thought', message: 'Getting the state of the automation' })}\n\n`)
        );

        const tools = await generator['selectRelevantTools'](intent, workspaceId);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'thought_complete' })}\n\n`)
        );

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'tools_selected', 
            tools: tools.map(t => t.id) 
          })}\n\n`)
        );

        // Step 3: Generate crew with streaming thoughts
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'thought', 
            message: "Now I'll create a comprehensive automation crew. I'll need to design agents that can handle different aspects of the workflow you mentioned." 
          })}\n\n`)
        );

        await new Promise(resolve => setTimeout(resolve, 1000));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'thought_complete' })}\n\n`)
        );

        const crew = await generator.generateCrewFromPrompt({
          userPrompt: prompt,
          workspaceId,
          userId: user.id
        });

        // Stream agent creation
        for (const agent of crew.agents) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'agent_created', 
              agent 
            })}\n\n`)
          );
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Stream task creation
        for (const task of crew.tasks) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'task_created', 
              task 
            })}\n\n`)
          );
          await new Promise(resolve => setTimeout(resolve, 600));
        }

        // Save crew
        const crewId = await generator.saveGeneratedCrew(crew, workspaceId, user.id);

        // Complete
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'crew_complete', 
            crew: { ...crew, id: crewId }
          })}\n\n`)
        );

        controller.close();

      } catch (error: any) {
        console.error('Streaming build error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: error.message 
          })}\n\n`)
        );
        controller.close();
      }
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