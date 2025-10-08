import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// ✅ SIMPLIFIED: Authentication function from work-items
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

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  console.log('🔄 Profile GET API called');
  
  try {
    // Use simplified authentication (no req needed)
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Profile auth failed:', authError);
      return NextResponse.json(
        { 
          success: false,
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

    // Create user if not found (for new users)
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

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('💥 Profile fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
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
    // Use simplified authentication (no req needed)
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Profile update auth failed:', authError);
      return NextResponse.json(
        { 
          success: false,
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