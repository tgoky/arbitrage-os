// app/api/ai-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { AIChatService } from '@/services/aiChat.service';
import { prisma } from '@/lib/prisma';

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
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
    if (error || !user) return { user: null, error: error || new Error('No user found') };
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const rateLimitResult = await rateLimit(`ai_chat:${user.id}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { messages, workspaceId, deliverableId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Load deliverable content if an ID is provided
    let deliverableContext = null;
    if (deliverableId && workspaceId) {
      try {
        const deliverable = await prisma.deliverable.findFirst({
          where: {
            id: deliverableId,
            user_id: user.id,
            workspace_id: workspaceId,
          },
        });

        if (deliverable) {
          let content = deliverable.content;
          try {
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;
            content = parsed?.gammaPrompt || JSON.stringify(parsed);
          } catch {
            // use raw content
          }

          deliverableContext = {
            id: deliverable.id,
            title: deliverable.title,
            type: deliverable.type,
            content: typeof content === 'string' ? content : JSON.stringify(content),
          };
        }
      } catch (err) {
        console.error('Failed to load deliverable for AI chat:', err);
      }
    }

    const service = new AIChatService();
    const stream = await service.streamChat({
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      deliverable: deliverableContext,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}