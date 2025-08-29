import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../route'; // Reuse auth function
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  
  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
  }

  try {
    const deliverables = await prisma.deliverable.findMany({
      where: {
        user_id: user.id,
        workspace_id: workspaceId,
        type: 'ad_writer'
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        metadata: true,
        created_at: true
      }
    });

    return NextResponse.json({
      success: true,
      data: deliverables.map(d => ({
        id: d.id,
        title: d.title,
        createdAt: d.created_at,
        metadata: d.metadata,
        content: JSON.parse(d.content as string)
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}