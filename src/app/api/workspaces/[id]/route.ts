// app/api/workspaces/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// PATCH /api/workspaces/[id] - Update workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    const updateData: any = {};
    
    if (name) {
      updateData.name = name.trim();
      // Generate new slug if name is updated
      updateData.slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') || 'workspace';
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    
    if (color) {
      updateData.color = color;
    }

    const workspace = await prisma.workspace.update({
      where: {
        id: params.id,
        user_id: user.id // Ensure user owns the workspace
      },
      data: updateData
    });

    return NextResponse.json(workspace);
  } catch (error: any) {
    console.error('Error updating workspace:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Workspace not found or you do not have permission to update it' },
        { status: 404 }
      );
    } else if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A workspace with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Delete workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.workspace.delete({
      where: {
        id: params.id,
        user_id: user.id // Ensure user owns the workspace
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting workspace:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Workspace not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}