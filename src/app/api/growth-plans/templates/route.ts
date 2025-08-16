// app/api/growth-plans/templates/route.ts - COMPLETE WITH IMPORTS
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { GrowthPlanInput, GrowthPlanServiceResponse } from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

async function getAuthenticatedUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ✅ TEMPLATE CREATION RATE LIMITING
    const rateLimitResult = await rateLimit(
      `growth_plan_template_create:${userId}`,
      20, // 20 templates per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Template creation rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, description, template } = body;

    if (!name || !template) {
      return NextResponse.json(
        { success: false, error: 'Name and template data are required' },
        { status: 400 }
      );
    }

    const templateId = await growthPlanService.createGrowthPlanTemplate(
      userId,
      name,
      description || '',
      template
    );

    // ✅ LOG USAGE
    await logUsage({
      userId,
      feature: 'growth_plan_template_creation',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        templateId,
        templateName: name
      }
    });

    return NextResponse.json({
      success: true,
      data: { templateId },
      message: 'Template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ✅ TEMPLATE READ RATE LIMITING
    const rateLimitResult = await rateLimit(
      `growth_plan_template_read:${userId}`,
      100, // 100 template reads per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    const templates = await growthPlanService.getGrowthPlanTemplates(userId);

    // ✅ LOG USAGE
    await logUsage({
      userId,
      feature: 'growth_plan_template_read',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        templatesCount: templates.length
      }
    });

    return NextResponse.json({
      success: true,
      data: { templates }
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}