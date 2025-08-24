// app/api/sales-call-analyzer/export/[id]/route.ts - FIXED WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '../../../../../services/salesCallAnalyzer.service';
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

    // ✅ ADD RATE LIMITING for exports - 20 per hour
    const rateLimitResult = await rateLimit(
      `sales_call_export:${user.id}`,
      20, // 20 exports per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Export rate limit exceeded. You can export 20 analyses per hour.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const analysisId = params.id;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') as 'summary' | 'detailed' | 'presentation' | 'follow-up' || 'summary';

    const analyzerService = new SalesCallAnalyzerService();
    const exportContent = await analyzerService.exportCallAnalysis(user.id, analysisId, format);

    // ✅ LOG USAGE for export
    await logUsage({
      userId: user.id,
      feature: 'sales_call_export',
      tokens: 0, // No AI tokens for export
      timestamp: new Date(),
      metadata: {
        analysisId,
        format,
        exportType: 'sales_call_analysis'
      }
    });

    const filename = `call-analysis-${format}-${analysisId}.md`;
    
    return new NextResponse(exportContent, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to export call analysis' },
      { status: 500 }
    );
  }
}
