// app/api/proposal-generator/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const rateLimitResult = await rateLimit(`proposal_gen_view:${user.id}`, 200, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { id } = await params;
    const { prisma } = await import('@/lib/prisma');

    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        user_id: user.id,
        type: 'gamma_proposal',
      },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!deliverable) {
      return NextResponse.json(
        { success: false, error: 'Gamma proposal not found' },
        { status: 404 }
      );
    }

    let content;
    try {
      content = typeof deliverable.content === 'string'
        ? JSON.parse(deliverable.content)
        : deliverable.content;
    } catch {
      content = deliverable.content;
    }

    const metadata = (deliverable.metadata as Record<string, any>) || {};

    try {
      await logUsage({
        userId: user.id,
        feature: 'gamma_proposal_view',
        tokens: 0,
        timestamp: new Date(),
        metadata: { proposalId: id },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        id: deliverable.id,
        title: deliverable.title,
        gammaPrompt: content?.gammaPrompt || '',
        inputSnapshot: content?.inputSnapshot || null,
        clientName: metadata.clientName || '',
        companyName: metadata.companyName || '',
        solutionCount: metadata.solutionCount || 0,
        tone: metadata.tone || '',
        tokensUsed: metadata.tokensUsed || 0,
        processingTime: metadata.processingTime || 0,
        analysisId: metadata.analysisId || null,
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        workspace: deliverable.workspace,
      },
    });
  } catch (error) {
    console.error('Error fetching gamma proposal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gamma proposal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const rateLimitResult = await rateLimit(`proposal_gen_delete:${user.id}`, 50, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { id } = await params;
    const { prisma } = await import('@/lib/prisma');

    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        user_id: user.id,
        type: 'gamma_proposal',
      },
    });

    if (!deliverable) {
      return NextResponse.json(
        { success: false, error: 'Gamma proposal not found' },
        { status: 404 }
      );
    }

    await prisma.deliverable.delete({ where: { id } });

    try {
      await logUsage({
        userId: user.id,
        feature: 'gamma_proposal_delete',
        tokens: 0,
        timestamp: new Date(),
        metadata: { proposalId: id },
      });
    } catch {}

    return NextResponse.json({ success: true, deleted: true, id });
  } catch (error) {
    console.error('Error deleting gamma proposal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete gamma proposal' },
      { status: 500 }
    );
  }
}