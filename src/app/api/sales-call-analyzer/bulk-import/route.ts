// app/api/sales-call-analyzer/bulk-import/route.ts (FIXED VERSION)
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '@/services/salesCallAnalyzer.service';
import { validateSalesCallInput } from '../../../validators/salesCallAnalyzer.validator'
import { RateLimiters } from '@/lib/rateLimit'; // Fixed import
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

    const body = await req.json();
    const { calls } = body; // Array of SalesCallInput objects

    if (!Array.isArray(calls) || calls.length === 0) {
      return NextResponse.json(
        { error: 'No calls provided for bulk import' },
        { status: 400 }
      );
    }

    if (calls.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 calls allowed per bulk import' },
        { status: 400 }
      );
    }

    // Rate limiting for bulk import - Use the specific bulk import limiter
    const rateLimitResult = await RateLimiters.bulkImport(user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Bulk import rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.reset,
          remaining: rateLimitResult.remaining
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      );
    }

    const analyzerService = new SalesCallAnalyzerService();
    const results = [];
    const errors = [];

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
          description: 'Default workspace for call analyses'
        }
      });
    }

    // Process each call
    for (let i = 0; i < calls.length; i++) {
      try {
        const callInput = calls[i];
        
        // Validate input
        const validation = validateSalesCallInput(callInput);
        if (!validation.success) {
          errors.push({
            index: i,
            title: callInput.title || `Call ${i + 1}`,
            error: 'Validation failed',
            details: validation.errors
          });
          continue;
        }

        // Analyze the call
        const analysisPackage = await analyzerService.analyzeCall({
          ...validation.data,
          userId: user.id
        });

        // Save to database
        const analysisId = await analyzerService.saveCallAnalysis(
          user.id,
          workspace.id,
          analysisPackage,
          { ...validation.data, userId: user.id }
        );

        results.push({
          index: i,
          analysisId,
          title: callInput.title,
          overallScore: analysisPackage.callResults.analysis.overallScore,
          sentiment: analysisPackage.callResults.analysis.sentiment
        });

        // Log usage
        await logUsage({
          userId: user.id,
          feature: 'sales_call_analyzer_bulk',
          tokens: analysisPackage.tokensUsed,
          timestamp: new Date(),
          metadata: {
            callType: validation.data.callType,
            companyName: validation.data.companyName,
            analysisId,
            bulkImport: true
          }
        });

      } catch (error) {
        console.error(`Error processing call ${i}:`, error);
        errors.push({
          index: i,
          title: calls[i].title || `Call ${i + 1}`,
          error: error instanceof Error ? error.message : 'Processing failed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        failed: errors.length,
        total: calls.length,
        results,
        errors
      },
      meta: {
        rateLimit: {
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
          limit: rateLimitResult.limit
        }
      }
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString()
      }
    });

  } catch (error) {
    console.error('Bulk Import Error:', error);
    return NextResponse.json(
      { error: 'Bulk import failed. Please try again.' },
      { status: 500 }
    );
  }
}