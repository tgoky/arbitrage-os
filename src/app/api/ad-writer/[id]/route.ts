// app/api/ad-writer/[id]/route.ts - SIMPLIFIED AUTH VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AdWriterService } from '@/services/adWriter.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
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

// GET: Fetch specific ad generation by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Ad Writer Detail GET API Route called for ID:', params.id);
  
  try {
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in ad writer detail GET:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Rate limiting for detail fetches
    const rateLimitResult = await rateLimit(user.id, 200, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Detail fetch rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Get optional workspaceId from query params
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    
    console.log('🔍 Fetching ad generation:', {
      generationId: params.id,
      userId: user.id,
      workspaceId
    });

    // Validate workspace access if workspaceId provided
    if (workspaceId) {
      const hasAccess = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          user_id: user.id
        }
      });
      if (!hasAccess) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Workspace not found or access denied',
            code: 'WORKSPACE_ACCESS_DENIED'
          },
          { status: 403 }
        );
      }
    }

    // Fetch the specific ad generation from database
    const generation = await prisma.deliverable.findFirst({
      where: {
        id: params.id,
        user_id: user.id,
        type: 'ad_writer',
        ...(workspaceId && { workspace_id: workspaceId })
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!generation) {
      console.log('❌ Ad generation not found:', params.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Ad generation not found or you do not have permission to view it.',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    console.log('✅ Ad generation found:', {
      id: generation.id,
      title: generation.title,
      type: generation.type
    });

    // Parse the ad data (it's stored as JSON string in content)
    let adData;
    try {
      adData = typeof generation.content === 'string' 
        ? JSON.parse(generation.content) 
        : generation.content;
    } catch (parseError) {
      console.error('❌ Failed to parse ad data:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid ad data format.',
          code: 'DATA_PARSE_ERROR'
        },
        { status: 500 }
      );
    }

    // Safely parse metadata as any to access properties
    const metadata = generation.metadata as any;

    // Format response data
    const responseData = {
      id: generation.id,
      title: generation.title,
      ads: adData.ads || [],
      inputData: metadata?.originalInput || metadata,
      createdAt: generation.created_at,
      updatedAt: generation.updated_at,
      workspaceId: generation.workspace?.id,
      status: 'completed', // Assuming completed if we can fetch it
      metadata: {
        businessName: metadata?.businessName || 'Unknown Business',
        offerName: metadata?.offerName || 'Unknown Offer',
        platforms: metadata?.platforms || [],
        adCount: adData.ads?.length || 0,
        adType: metadata?.adType || 'unknown',
        tone: metadata?.tone || 'unknown',
        adLength: metadata?.adLength || 'medium',
        tokensUsed: metadata?.tokensUsed || 0,
        generationTime: metadata?.generationTime || 0
      }
    };

    // Log usage for detail access
    await logUsage({
      userId: user.id,
      feature: 'ad_writer_detail',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        generationId: params.id,
        workspaceId,
        action: 'view_detail'
      }
    });

    console.log('✅ Returning ad generation detail');
    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count,
        workspaceId: workspaceId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Ad Generation Detail Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch ad generation details',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete specific ad generation by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Ad Writer Detail DELETE API Route called for ID:', params.id);
  
  try {
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in ad writer detail DELETE:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Rate limiting for delete operations
    const rateLimitResult = await rateLimit(user.id, 50, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Delete rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Get optional workspaceId from query params
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    // Validate workspace access if workspaceId provided
    if (workspaceId) {
      const hasAccess = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          user_id: user.id
        }
      });
      if (!hasAccess) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Workspace not found or access denied',
            code: 'WORKSPACE_ACCESS_DENIED'
          },
          { status: 403 }
        );
      }
    }

    console.log('🗑️ Deleting ad generation:', params.id);

    // Delete the ad generation from database
    const result = await prisma.deliverable.deleteMany({
      where: {
        id: params.id,
        user_id: user.id,
        type: 'ad_writer',
        ...(workspaceId && { workspace_id: workspaceId })
      }
    });

    if (result.count === 0) {
      console.log('❌ Ad generation not found or already deleted:', params.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Ad generation not found or you do not have permission to delete it.',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Log usage for delete operation
    await logUsage({
      userId: user.id,
      feature: 'ad_writer_delete',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        generationId: params.id,
        workspaceId,
        action: 'delete'
      }
    });

    console.log('✅ Ad generation deleted successfully:', params.id);
    return NextResponse.json({
      success: true,
      data: { 
        deleted: true,
        id: params.id
      },
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count,
        workspaceId: workspaceId
      }
    });

  } catch (error) {
    console.error('💥 Ad Generation Delete Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete ad generation',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// PUT: Update/regenerate specific ad generation (optional)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Ad Writer Detail PUT API Route called for ID:', params.id);
  
  try {
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Rate limiting for update operations
    const rateLimitResult = await rateLimit(user.id, 30, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Update rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Get optional workspaceId from query params
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    // Validate workspace access if workspaceId provided
    if (workspaceId) {
      const hasAccess = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          user_id: user.id
        }
      });
      if (!hasAccess) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Workspace not found or access denied',
            code: 'WORKSPACE_ACCESS_DENIED'
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { action, ...updateData } = body;

    // Fetch existing generation first (needed for both regenerate and update)
    const existingGeneration = await prisma.deliverable.findFirst({
      where: {
        id: params.id,
        user_id: user.id,
        type: 'ad_writer',
        ...(workspaceId && { workspace_id: workspaceId })
      }
    });

    if (!existingGeneration) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Original generation not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    if (action === 'regenerate') {
      // Regenerate ads with new parameters
      const adWriterService = new AdWriterService();
      
      const metadata = existingGeneration.metadata as any;
      const originalInput = metadata?.originalInput || updateData;

      // Generate new ads
      const newAdsResult = await adWriterService.generateAds({
        ...originalInput,
        ...updateData
      });

      // Update the existing record
      const updatedGeneration = await prisma.deliverable.update({
        where: { id: params.id },
        data: {
          content: JSON.stringify(newAdsResult),
          metadata: {
            ...metadata,
            ...updateData,
            tokensUsed: newAdsResult.tokensUsed,
            generationTime: newAdsResult.generationTime,
            regeneratedAt: new Date().toISOString()
          },
          updated_at: new Date()
        }
      });

      // Log usage for regeneration
      await logUsage({
        userId: user.id,
        feature: 'ad_writer_regenerate',
        tokens: newAdsResult.tokensUsed,
        timestamp: new Date(),
        metadata: {
          generationId: params.id,
          workspaceId,
          action: 'regenerate'
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updatedGeneration.id,
          ads: newAdsResult.ads
        },
        meta: {
          tokensUsed: newAdsResult.tokensUsed,
          generationTime: newAdsResult.generationTime,
          remaining: rateLimitResult.remaining,
          workspaceId
        }
      });
    }

    // Simple metadata update
    const updatedGeneration = await prisma.deliverable.update({
      where: {
        id: params.id,
        user_id: user.id,
        type: 'ad_writer'
      },
      data: {
        title: updateData.title || undefined,
        metadata: {
          ...(existingGeneration.metadata as any),
          ...updateData
        },
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: { updated: true, id: updatedGeneration.id },
      meta: {
        workspaceId
      }
    });

  } catch (error) {
    console.error('💥 Ad Generation Update Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update ad generation',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}