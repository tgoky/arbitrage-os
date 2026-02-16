// app/api/agent-crews/executions/[executionId]/stream/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// COPY THE SAME AUTHENTICATION FUNCTION FROM NICHE RESEARCHER
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
      console.error(' Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log(' User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error(' Authentication error:', error);
    return { user: null, error };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // TODO: Connect to Redis pub/sub or WebSocket for real-time updates
      // For now, simulate with interval
      const interval = setInterval(() => {
        const update = {
          type: 'ping',
          timestamp: new Date().toISOString()
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
        );
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
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