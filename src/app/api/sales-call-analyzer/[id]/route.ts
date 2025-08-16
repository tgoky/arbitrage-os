// app/api/sales-call-analyzer/[id]/route.ts - FIXED WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '@/services/salesCallAnalyzer.service';
import { validateSalesCallInput } from '../../../validators/salesCallAnalyzer.validator';
import { rateLimit } from '@/lib/rateLimit'; // ✅ Add rate limiting
import { logUsage } from '@/lib/usage'; // ✅ Add usage logging

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for individual analysis fetches - 100 per hour
    const rateLimitResult = await rateLimit(
      `sales_call_get:${user.id}`,
      100, // 100 individual fetches per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded for analysis fetching.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const analysisId = params.id;
    const analyzerService = new SalesCallAnalyzerService();
    const analysis = await analyzerService.getCallAnalysis(user.id, analysisId);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Call analysis not found' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for analysis access
    await logUsage({
      userId: user.id,
      feature: 'sales_call_analyzer_view',
      tokens: 0, // No AI tokens for viewing
      timestamp: new Date(),
      metadata: {
        analysisId,
        action: 'view'
      }
    });

    return NextResponse.json({
      success: true,
      data: analysis,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Analysis Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call analysis' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for updates - 30 per hour
    const rateLimitResult = await rateLimit(
      `sales_call_update:${user.id}`,
      30, // 30 updates per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Update rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const analysisId = params.id;
    const body = await req.json();

    const validation = validateSalesCallInput(body, true); // partial validation
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const analyzerService = new SalesCallAnalyzerService();
    const updatedAnalysis = await analyzerService.updateCallAnalysis(user.id, analysisId, validation.data);

    // ✅ LOG USAGE for update
    await logUsage({
      userId: user.id,
      feature: 'sales_call_analyzer_update',
      tokens: 0, // No AI tokens for update
      timestamp: new Date(),
      metadata: {
        analysisId,
        action: 'update',
        updatedFields: Object.keys(validation.data)
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedAnalysis,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Analysis Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update call analysis' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for deletions - 20 per hour
    const rateLimitResult = await rateLimit(
      `sales_call_delete:${user.id}`,
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

    const analysisId = params.id;
    
    // ✅ Delete from deliverable table (consistent pattern)
    const { prisma } = await import('@/lib/prisma');
    
    const result = await prisma.deliverable.deleteMany({
      where: {
        id: analysisId,
        user_id: user.id,
        type: 'sales_call_analyzer' // ✅ Consistent type pattern
      }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Call analysis not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for deletion
    await logUsage({
      userId: user.id,
      feature: 'sales_call_analyzer_delete',
      tokens: 0, // No AI tokens for deletion
      timestamp: new Date(),
      metadata: {
        analysisId,
        action: 'delete'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Call analysis deleted successfully',
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Analysis Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete call analysis' },
      { status: 500 }
    );
  }
}
