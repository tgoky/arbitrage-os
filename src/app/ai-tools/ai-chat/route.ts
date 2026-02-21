// app/api/ai-chat/route.ts
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { AIChatService } from '@/services/aiChat.service';
import type { DeliverableContext } from '@/services/aiChat.service';

// ─── Auth Helper ───
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

// ─── JSON error response helper ───
function jsonError(error: string, status: number) {
  return new Response(
    JSON.stringify({ success: false, error }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

// ─── POST: Stream AI chat response ───
export async function POST(request: NextRequest) {
  try {
    // 1. AUTH
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return jsonError('Authentication required.', 401);
    }

    // 2. RATE LIMIT
    const rateLimitResult = await rateLimit(`ai_chat:${user.id}`, 100, 3600);
    if (!rateLimitResult.success) {
      return jsonError('Rate limit exceeded. Please try again later.', 429);
    }

    // 3. PARSE BODY
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid JSON in request body', 400);
    }

    const { messages, workspaceId, deliverableId } = body;

    // 4. VALIDATE
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonError('Messages array is required', 400);
    }

    if (!workspaceId) {
      return jsonError('Workspace ID is required', 400);
    }

    // 5. VERIFY WORKSPACE OWNERSHIP
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, user_id: user.id },
    });

    if (!workspace) {
      return jsonError('Workspace not found or access denied', 403);
    }

    // 6. LOAD DELIVERABLE CONTEXT (if provided)
    let deliverableContext: DeliverableContext | null = null;

    if (deliverableId) {
      const deliverable = await prisma.deliverable.findFirst({
        where: { id: deliverableId, user_id: user.id, workspace_id: workspaceId },
      });

      if (deliverable) {
        let content = '';
        try {
          const parsed = JSON.parse(deliverable.content);
          content = parsed.gammaPrompt || JSON.stringify(parsed, null, 2);
        } catch {
          content = deliverable.content;
        }

        deliverableContext = {
          id: deliverable.id,
          title: deliverable.title,
          type: deliverable.type,
          content,
        };
      }
    }

    // 7. DELEGATE TO SERVICE
    const service = new AIChatService();
    const stream = await service.streamChat({
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      deliverable: deliverableContext,
    });

    // 8. RETURN SSE STREAM
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return jsonError('Failed to process your request. Please try again.', 500);
  }
}