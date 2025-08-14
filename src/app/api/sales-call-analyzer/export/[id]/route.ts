// app/api/sales-call-analyzer/export/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '@/services/salesCallAnalyzer.service';

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

    const analysisId = params.id;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') as 'summary' | 'detailed' | 'presentation' | 'follow-up' || 'summary';

    const analyzerService = new SalesCallAnalyzerService();
    const exportContent = await analyzerService.exportCallAnalysis(user.id, analysisId, format);

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