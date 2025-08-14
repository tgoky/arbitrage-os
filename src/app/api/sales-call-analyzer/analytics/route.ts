// app/api/sales-call-analyzer/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '@/services/salesCallAnalyzer.service';

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

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'quarter' || 'month';

    const analyzerService = new SalesCallAnalyzerService();
    const analytics = await analyzerService.getCallAnalyticsSummary(user.id, workspaceId || undefined, timeframe);

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}