// app/api/niche-research/[id]/route.ts - WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NicheResearcherService } from '@/services/nicheResearcher.service';
import { rateLimit } from '@/lib/rateLimit'; // ✅ Add rate limiting
import { logUsage } from '@/lib/usage'; // ✅ Add usage logging

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for individual report fetches - 50 per hour
    const rateLimitResult = await rateLimit(
      `niche_research_get:${user.id}`,
      50, // 50 individual fetches per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded for report fetching.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const reportId = params.id;
    const nicheService = new NicheResearcherService();
    const report = await nicheService.getNicheReport(user.id, reportId);

    if (!report) {
      return NextResponse.json(
        { error: 'Niche research report not found' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for report access
    await logUsage({
      userId: user.id,
      feature: 'niche_research_view',
      tokens: 0, // No AI tokens for viewing
      timestamp: new Date(),
      metadata: {
        reportId,
        action: 'view'
      }
    });

    return NextResponse.json({
      success: true,
      data: report,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Niche Report Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch niche research report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for deletions - 20 per hour
    const rateLimitResult = await rateLimit(
      `niche_research_delete:${user.id}`,
      20, // 20 deletions per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Delete rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const reportId = params.id;
    const { prisma } = await import('@/lib/prisma');
    
    const result = await prisma.deliverable.deleteMany({
      where: {
        id: reportId,
        user_id: user.id,
        type: 'niche_research'
      }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Niche research report not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for deletion
    await logUsage({
      userId: user.id,
      feature: 'niche_research_delete',
      tokens: 0, // No AI tokens for deletion
      timestamp: new Date(),
      metadata: {
        reportId,
        action: 'delete'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Niche research report deleted successfully',
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Niche Report Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete niche research report' },
      { status: 500 }
    );
  }
}
