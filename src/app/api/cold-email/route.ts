// app/api/cold-email/route.ts - UPDATED to use service-level storage
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ColdEmailService } from '@/services/coldEmail.service';
import { validateColdEmailInput } from '../../validators/coldEmail.validator';
import { rateLimit } from '../../../lib/rateLimit';
import { logUsage } from '@/lib/usage';

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting - 20 emails per minute
    const rateLimitResult = await rateLimit(user.id, 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateColdEmailInput(body);
        
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    // Ensure validation.data exists (TypeScript guard)
    if (!validation.data) {
      return NextResponse.json(
        { error: 'Invalid input data' },
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
          description: 'Default workspace for cold emails'
        }
      });
    }

    // ✅ SERVICE HANDLES BOTH GENERATION AND STORAGE
    const coldEmailService = new ColdEmailService();
    const emailInput = {
      ...validation.data,
      userId: user.id,
      // Ensure required fields have defaults
      emailLength: validation.data.emailLength || 'medium',
      quality: validation.data.quality || 'balanced',
      creativity: validation.data.creativity || 'moderate',
      variations: validation.data.variations || 1,
      generateFollowUps: validation.data.generateFollowUps || false,
      followUpCount: validation.data.followUpCount || 3,
      saveAsTemplate: validation.data.saveAsTemplate || false
    };

    // Generate and save emails via service
    const result = await coldEmailService.generateAndSaveEmails(
      emailInput,
      user.id,
      workspace.id
    );

    // ✅ LOG USAGE for analytics/billing
    await logUsage({
      userId: user.id,
      feature: 'cold_email',
      tokens: result.tokensUsed,
      timestamp: new Date(),
      metadata: {
        deliverableId: result.deliverableId, // ✅ Reference the actual deliverable
        method: validation.data.method,
        emailCount: result.emails.length,
        targetCompany: validation.data.targetCompany,
        targetIndustry: validation.data.targetIndustry
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        generationId: result.deliverableId, // ✅ Return deliverable ID
        emails: result.emails
      },
      meta: {
        tokensUsed: result.tokensUsed,
        generationTime: result.generationTime,
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('Cold Email API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate emails. Please try again.' },
      { status: 500 }
    );
  }
}

// ✅ ADD GET ENDPOINT for fetching user's email generations
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

    // Rate limiting for list fetches
    const rateLimitResult = await rateLimit(user.id, 100, 60);
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
    const coldEmailService = new ColdEmailService();
    const generations = await coldEmailService.getUserEmailGenerations(
      user.id,
      workspaceId || undefined
    );

    // ✅ LOG USAGE for list access
    await logUsage({
      userId: user.id,
      feature: 'cold_email_list',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        workspaceId,
        resultCount: generations.length,
        action: 'list'
      }
    });

    return NextResponse.json({
      success: true,
      data: generations,
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('Email Generations Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email generations' },
      { status: 500 }
    );
  }
}