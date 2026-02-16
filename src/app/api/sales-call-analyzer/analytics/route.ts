// app/api/sales-call-analyzer/analytics/route.ts - FIXED WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '@/services/salesCallAnalyzer.service';
import { rateLimit } from '@/lib/rateLimit'; //   Add rate limiting
import { logUsage } from '@/lib/usage'; //   Add usage logging

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

    //   ADD RATE LIMITING for analytics - 50 per hour
    const rateLimitResult = await rateLimit(
      `sales_call_analytics:${user.id}`,
      50, // 50 analytics fetches per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Analytics rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'quarter' || 'month';

    const analyzerService = new SalesCallAnalyzerService();
    const analytics = await analyzerService.getCallAnalyticsSummary(user.id, workspaceId || undefined, timeframe);

    //   LOG USAGE for analytics access
    await logUsage({
      userId: user.id,
      feature: 'sales_call_analytics',
      tokens: 0, // No AI tokens for analytics
      timestamp: new Date(),
      metadata: {
        workspaceId,
        timeframe,
        action: 'view_analytics'
      }
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
