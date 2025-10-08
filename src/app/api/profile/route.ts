import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Use the same robust authentication function from your ad-writer
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = await cookies(); // ✅ FIXED: Added await
    
    // Method 1: Authorization header (most reliable for API calls)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: { get: () => undefined },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          console.log('✅ Auth via Bearer token:', user.id);
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('Token auth failed:', tokenError);
      }
    }
    
    // Method 2: SSR cookies (FIXED cookie handling)
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              try {
                const cookie = cookieStore.get(name);
                if (!cookie?.value) return undefined;
                
                // FIXED: Proper base64 cookie handling
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded); // Validate it's valid JSON
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
                    return undefined; // Skip corrupted cookies
                  }
                }
                
                return cookie.value;
              } catch (error) {
                console.warn(`Error reading cookie ${name}:`, error);
                return undefined;
              }
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        console.log('✅ Auth via SSR cookies:', user.id);
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client (fallback)
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        console.log('✅ Auth via Route handler:', user.id);
        return { user, error: null };
      }
    } catch (routeError) {
      console.warn('Route handler auth failed:', routeError);
    }
    
    console.error('❌ All authentication methods failed');
    return { user: null, error: new Error('All authentication methods failed') };
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { user: null, error };
  }
}

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  console.log('🔄 Profile GET API called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Profile auth failed:', authError);
      return NextResponse.json(
        { 
          success: false, // ✅ FIXED: Added success field
          error: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    console.log('✅ Profile auth successful, fetching user:', user.id);

    // Get user profile from database
    let userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        created_at: true,
        updated_at: true
      }
    });

    // ✅ FIXED: Create user if not found (for new users)
    if (!userProfile) {
      console.log('📝 User not found in DB, creating profile:', user.id);
      
      userProfile = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || null,
          avatar: user.user_metadata?.avatar || null,
          status: 'active',
          last_login: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          created_at: true,
          updated_at: true
        }
      });
      
      console.log('✅ User profile created:', userProfile.id);
    } else {
      // Update last_login for existing users
      await prisma.user.update({
        where: { id: user.id },
        data: { last_login: new Date() }
      });
    }

    console.log('✅ Profile fetched successfully');

    // ✅ FIXED: Return with success wrapper and data field
    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('💥 Profile fetch error:', error);
    return NextResponse.json(
      { 
        success: false, // ✅ FIXED: Added success field
        error: 'Failed to fetch profile',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile
export async function PATCH(req: NextRequest) {
  console.log('🔄 Profile PATCH API called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Profile update auth failed:', authError);
      return NextResponse.json(
        { 
          success: false, // ✅ FIXED: Added success field
          error: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    console.log('✅ Profile update auth successful:', user.id);

    const body = await req.json();
    const { name, avatar } = body;

    console.log('📝 Updating profile with:', { name, avatar: !!avatar });

    // Validate input
    if (typeof name !== 'string' && name !== undefined) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Name must be a string' 
        },
        { status: 400 }
      );
    }

    if (typeof avatar !== 'string' && avatar !== undefined && avatar !== null) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Avatar must be a string or null' 
        },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(avatar !== undefined && { avatar }),
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        created_at: true,
        updated_at: true
      }
    });

    console.log('✅ Profile updated successfully');

    // ✅ FIXED: Return with success wrapper and data field
    return NextResponse.json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('💥 Profile update error:', error);
    
    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update profile',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}