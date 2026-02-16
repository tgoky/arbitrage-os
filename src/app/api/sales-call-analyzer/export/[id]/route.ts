// app/api/sales-call-analyzer/export/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr'; //   Import for method 2
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '../../../../../services/salesCallAnalyzer.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('  Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('  User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('  Authentication error:', error);
    return { user: null, error };
  }
}


// Optional: Copy the error response function if you want consistent 401 handling
function createAuthErrorResponse() {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Authentication required for export. Please clear your browser cookies and sign in again.',
      code: 'AUTH_REQUIRED'
    },
    { status: 401 }
  );

  // Clear potentially corrupted cookies if needed
  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token'
  ];

  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/',
    });
  });

  return response;
}


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    //   USE THE ROBUST AUTHENTICATION FUNCTION HERE
   const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      console.error('  Auth failed in sales call export:', authError);
      // Use the robust error response
      return createAuthErrorResponse();
      // Or the simple one if you prefer: return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('  Export user authenticated successfully:', user.id); // Add log

    //   ADD RATE LIMITING for exports - 20 per hour
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

    console.log(`🔍 Starting export for analysis ${analysisId} in format ${format} for user ${user.id}`); // Add log

    const analyzerService = new SalesCallAnalyzerService();
    const exportContent = await analyzerService.exportCallAnalysis(user.id, analysisId, format);

    //   LOG USAGE for export
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

    console.log(`  Export completed successfully for ${filename}`); // Add log

    return new NextResponse(exportContent, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Export Error:', error);
    // It might be helpful to distinguish between server errors and not-found/errors
    // For now, keep the generic 500
    return NextResponse.json(
      { error: 'Failed to export call analysis' },
      { status: 500 }
    );
  }
}