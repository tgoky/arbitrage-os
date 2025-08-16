// app/api/growth-plans/[id]/export/route.ts - WITH RATE LIMITING
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ExportGrowthPlanResponse, GrowthPlanServiceResponse } from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

async function getAuthenticatedUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const planId = params.id;

    // ✅ STRICT RATE LIMITING: Exports are resource-intensive
    const rateLimitResult = await rateLimit(
      `growth_plan_export:${userId}`,
      10, // 10 exports per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Export rate limit exceeded. You can export 10 plans per hour.',
          data: {
            remaining: rateLimitResult.remaining,
            resetTime: new Date(rateLimitResult.reset).toISOString()
          }
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'markdown') as 'pdf' | 'word' | 'markdown';

    const content = await growthPlanService.exportGrowthPlan(userId, planId, format);
    
    // Get plan details for filename
    const plan = await growthPlanService.getGrowthPlan(userId, planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Growth plan not found' },
        { status: 404 }
      );
    }

    const clientCompany = plan.metadata.clientCompany || 'GrowthPlan';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${clientCompany}_GrowthPlan_${timestamp}.${format === 'markdown' ? 'md' : format}`;
    
    const mimeTypes = {
      markdown: 'text/markdown',
      pdf: 'application/pdf',
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    // ✅ LOG USAGE: Track exports
    await logUsage({
      userId,
      feature: 'growth_plan_export',
      tokens: 0, // No AI tokens for export
      timestamp: new Date(),
      metadata: {
        planId,
        format,
        filename,
        contentLength: content.length
      }
    });

    const response: GrowthPlanServiceResponse<ExportGrowthPlanResponse> = {
      success: true,
      data: {
        content,
        filename,
        mimeType: mimeTypes[format]
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error exporting growth plan:', error);
    
    if (error instanceof Error && error.message === 'Growth plan not found') {
      return NextResponse.json(
        { success: false, error: 'Growth plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export growth plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
