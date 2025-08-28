// app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Robust auth function
async function getAuthenticatedUser(request?: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Try with authorization header if request is provided
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: {
                get: () => undefined,
              },
            }
          );
          
          const { data: { user }, error } = await supabase.auth.getUser(token);
          
          if (!error && user) {
            return { user, error: null };
          }
        } catch (tokenError) {
          console.warn('Token auth error:', tokenError);
        }
      }
    }
    
    // Method 2: Try with SSR cookies
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;
              
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded);
                  return cookie.value;
                } catch (e) {
                  return undefined;
                }
              }
              
              if (cookie.value.startsWith('{') || cookie.value.startsWith('[')) {
                try {
                  JSON.parse(cookie.value);
                  return cookie.value;
                } catch (e) {
                  return undefined;
                }
              }
              
              return cookie.value;
            } catch (error) {
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      return { user, error: null };
    }
    
    // Method 3: Fallback to route handler client
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        return { user, error: null };
      }
    } catch (helperError) {
      console.warn('Route handler client failed:', helperError);
    }
    
    return { user: null, error: error || new Error('All auth methods failed') };
    
  } catch (error) {
    console.error('All authentication methods failed:', error);
    return { user: null, error };
  }
}

export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.userFavorite.findMany({
      where: { user_id: user.id },
      select: { prompt_id: true }
    });

    return NextResponse.json({
      favorites: favorites.map((f: { prompt_id: number }) => f.prompt_id)
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { promptId } = await request.json();

    const favorite = await prisma.userFavorite.create({
      data: {
        user_id: user.id,
        prompt_id: parseInt(promptId)
      }
    });

    return NextResponse.json({ success: true, favorite });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already favorited' }, { status: 409 });
    }
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');

    if (!promptId) {
      return NextResponse.json({ error: 'promptId required' }, { status: 400 });
    }

    await prisma.userFavorite.deleteMany({
      where: {
        user_id: user.id,
        prompt_id: parseInt(promptId)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}