// app/api/niche-research/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NicheResearcherService } from '@/services/nicheResearcher.service';
import { validateNicheResearchInput } from '../../validators/nicheResearcher.validator';
import { rateLimit } from '@/lib/rateLimit'; // Fixed import - changed from ratelimit to rateLimit
import { logUsage } from '@/lib/usage';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting - 3 reports per day
    const rateLimitResult = await rateLimit(`niche_research:${user.id}`, 3, 86400);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Daily limit reached. Please try again tomorrow.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateNicheResearchInput(body);
        
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    if (!validation.data) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Get user's workspace
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
          description: 'Default workspace for niche research'
        }
      });
    }

    // Generate niche research report
    const nicheService = new NicheResearcherService();
    const researchInput = { ...validation.data, userId: user.id };
    const generatedReport = await nicheService.generateNicheReport(researchInput);

    // Save to database
    const reportId = await nicheService.saveNicheReport(
      user.id, 
      workspace.id, 
      generatedReport, 
      researchInput
    );

    // Log usage for analytics/billing
    await logUsage({
      userId: user.id,
      feature: 'niche_research',
      tokens: generatedReport.tokensUsed,
      timestamp: new Date(),
      metadata: {
        skills: validation.data.skills,
        timeCommitment: validation.data.time,
        budget: validation.data.budget,
        nicheCount: generatedReport.recommendedNiches?.length || 0,
        reportId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId,
        report: generatedReport
      },
      meta: {
        tokensUsed: generatedReport.tokensUsed,
        generationTime: generatedReport.generationTime,
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Niche Research Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate niche research report. Please try again.' },
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

    // ✅ ADD RATE LIMITING for listing reports - 100 per hour
    const rateLimitResult = await rateLimit(
      `niche_research_list:${user.id}`,
      100, // 100 list requests per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'List rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    const nicheService = new NicheResearcherService();
    const reports = await nicheService.getUserNicheReports(user.id, workspaceId || undefined);

    // ✅ LOG USAGE for listing reports
    await logUsage({
      userId: user.id,
      feature: 'niche_research_list',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        workspaceId,
        reportCount: reports.length
      }
    });

    return NextResponse.json({
      success: true,
      data: reports,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Niche Reports Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch niche research reports' },
      { status: 500 }
    );
  }
}