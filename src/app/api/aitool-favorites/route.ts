import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Robust auth function (copied from your favorites API)
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




export async function GET(request: NextRequest) {
  try {
   const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.aIToolFavorite.findMany({
      where: { user_id: user.id },
      select: { tool_id: true }
    });

    return NextResponse.json({
      favorites: favorites.map((f: { tool_id: string }) => f.tool_id)
    });
  } catch (error) {
    console.error('Error fetching AI tool favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
  const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toolId, action } = await request.json();

    if (!toolId) {
      return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
    }

    if (action === 'add') {
      try {
        const favorite = await prisma.aIToolFavorite.create({
          data: {
            user_id: user.id,
            tool_id: toolId
          }
        });
        return NextResponse.json({ success: true, favorite });
      } catch (error: any) {
        if (error.code === 'P2002') {
          return NextResponse.json({ error: 'Already favorited' }, { status: 409 });
        }
        throw error;
      }
    } else if (action === 'remove') {
      await prisma.aIToolFavorite.deleteMany({
        where: {
          user_id: user.id,
          tool_id: toolId
        }
      });
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "remove"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error updating AI tool favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
 const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');

    if (!toolId) {
      return NextResponse.json({ error: 'toolId required' }, { status: 400 });
    }

    await prisma.aIToolFavorite.deleteMany({
      where: {
        user_id: user.id,
        tool_id: toolId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing AI tool favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}