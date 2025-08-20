// app/api/cold-email/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ColdEmailService } from '@/services/coldEmail.service';
import { logUsage } from '@/lib/usage'; // ✅ Add usage logging
import { rateLimit } from '@/lib/rateLimit'; // ✅ Add rate limiting
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(10).max(5000).optional(),
  category: z.enum(['outreach', 'follow_up', 'introduction', 'meeting', 'demo']).optional(),
  tags: z.array(z.string()).optional(),
  variables: z.array(z.string()).optional(),
  isPublic: z.boolean().optional()
});

// GET - Fetch specific template
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

    // ✅ Add rate limiting - 50 individual template fetches per minute
    const rateLimitResult = await rateLimit(user.id, 50, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const templateId = params.id;
    const coldEmailService = new ColdEmailService();
    
    // Get all user templates and find the specific one
    const templates = await coldEmailService.getUserTemplates(user.id, { includePublic: true });
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // ✅ Log template fetch usage
    await logUsage({
      userId: user.id,
      feature: 'template_fetch_single',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        templateId
      }
    });

    return NextResponse.json({
      success: true,
      data: template,
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('Template Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT - Update specific template
export async function PUT(
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

    // ✅ Add rate limiting - 20 template updates per minute
    const rateLimitResult = await rateLimit(user.id, 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many template update requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const templateId = params.id;

    // Validate request body
    const body = await req.json();
    const validation = templateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const coldEmailService = new ColdEmailService();
    const template = await coldEmailService.updateTemplate(user.id, templateId, validation.data);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ Log template update usage
    await logUsage({
      userId: user.id,
      feature: 'template_update',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        templateId,
        updatedFields: Object.keys(validation.data)
      }
    });

    return NextResponse.json({
      success: true,
      data: template,
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('Template Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific template
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

    // ✅ Add rate limiting - 10 template deletions per minute
    const rateLimitResult = await rateLimit(user.id, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many template deletion requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const templateId = params.id;
    const coldEmailService = new ColdEmailService();
    const deleted = await coldEmailService.deleteTemplate(user.id, templateId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ Log template deletion usage
    await logUsage({
      userId: user.id,
      feature: 'template_delete',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        templateId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('Template Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}