// app/api/sales-call-analyzer/route.ts - FIXED: SERVICE LEVEL STORAGE ONLY
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '@/services/salesCallAnalyzer.service';
import { validateSalesCallInput } from '../../validators/salesCallAnalyzer.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting for call analysis
    const rateLimitResult = await rateLimit(`call_analysis:${user.id}`, 20, 3600); // 20 per hour
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many analysis requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateSalesCallInput(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    // ✅ GET USER'S WORKSPACE (consistent pattern)
    const { prisma } = await import('@/lib/prisma');
    let workspace = await prisma.workspace.findFirst({
      where: { user_id: user.id }
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          user_id: user.id,
          name: 'Default Workspace',
          slug: 'default',
          description: 'Default workspace for call analyses'
        }
      });
    }

    // ✅ SERVICE HANDLES BOTH ANALYSIS AND STORAGE
    const analyzerService = new SalesCallAnalyzerService();
    const analysisInput = { ...validation.data, userId: user.id };
    
    // Analyze the call
    const analysisPackage = await analyzerService.analyzeCall(analysisInput);
    
    // Save via service (not API)
    const deliverableId = await analyzerService.saveCallAnalysis(
      user.id,
      workspace.id,
      analysisPackage,
      analysisInput
    );

    // ✅ LOG USAGE for billing/analytics
    await logUsage({
      userId: user.id,
      feature: 'sales_call_analyzer',
      tokens: analysisPackage.tokensUsed,
      timestamp: new Date(),
      metadata: {
        deliverableId, // ✅ Reference the actual deliverable
        callType: validation.data.callType,
        companyName: validation.data.companyName,
        analysisId: deliverableId, // ✅ Use service-generated ID
        overallScore: analysisPackage.callResults.analysis.overallScore,
        sentiment: analysisPackage.callResults.analysis.sentiment
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        analysisId: deliverableId, // ✅ Return service-generated ID
        analysis: analysisPackage
      },
      meta: {
        tokensUsed: analysisPackage.tokensUsed,
        processingTime: analysisPackage.processingTime,
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Call Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze call. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ RATE LIMITING for list fetches
    const rateLimitResult = await rateLimit(
      `sales_call_list:${user.id}`,
      100, // 100 list fetches per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'List fetch rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    // ✅ USE SERVICE METHOD (consistent with architecture)
    const analyzerService = new SalesCallAnalyzerService();
    const analyses = await analyzerService.getUserCallAnalyses(
      user.id,
      workspaceId || undefined
    );

    // ✅ LOG USAGE for list access
    await logUsage({
      userId: user.id,
      feature: 'sales_call_analyzer_list',
      tokens: 0, // No AI tokens for listing
      timestamp: new Date(),
      metadata: {
        workspaceId,
        resultCount: analyses.length,
        action: 'list'
      }
    });

    return NextResponse.json({
      success: true,
      data: analyses,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Analyses Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call analyses' },
      { status: 500 }
    );
  }
}