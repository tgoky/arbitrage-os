// app/api/agent-tools/custom/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

//   COPY THE SAME AUTHENTICATION FUNCTION FROM NICHE RESEARCHER
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
      console.error('  Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('  User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('  Authentication error:', error);
    return { user: null, error };
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');

  try {
    const customTools = await prisma.deliverable.findMany({
      where: {
        workspace_id: workspaceId!,
        type: 'custom_tool'
      }
    });

    const tools = customTools.map(ct => {
      const content = JSON.parse(ct.content);
      return {
        id: ct.id,
        ...content,
        category: 'custom',
        isCustom: true
      };
    });

    return NextResponse.json({
      success: true,
      tools
    });
  } catch (error) {
    console.error('Failed to get custom tools:', error);
    return NextResponse.json(
      { error: 'Failed to get custom tools' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();
  const { workspaceId, name, description, icon, authentication, endpoint, provider } = body;

  try {
    const customTool = await prisma.deliverable.create({
      data: {
        title: name,
        content: JSON.stringify({
          name,
          description,
          icon,
          authentication: authentication || 'none',
          endpoint,
          provider
        }),
        type: 'custom_tool',
        workspace_id: workspaceId,
        user_id: user.id
      }
    });

    return NextResponse.json({
      success: true,
      tool: {
        id: customTool.id,
        ...JSON.parse(customTool.content)
      }
    });
  } catch (error) {
    console.error('Failed to create custom tool:', error);
    return NextResponse.json(
      { error: 'Failed to create custom tool' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const toolId = searchParams.get('toolId');
  const workspaceId = searchParams.get('workspaceId');

  try {
    await prisma.deliverable.delete({
      where: {
        id: toolId!,
        workspace_id: workspaceId!,
        user_id: user.id,
        type: 'custom_tool'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete custom tool:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom tool' },
      { status: 500 }
    );
  }
}