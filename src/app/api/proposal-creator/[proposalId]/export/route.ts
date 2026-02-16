// app/api/proposal-creator/[proposalId]/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProposalCreatorService } from '../../../../../services/proposalCreator.service';

// Robust authentication function (matches other routes)
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




export async function GET(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  console.log(' Export API Route called for ID:', params.proposalId);

  try {
      const { user, error: authError } = await getAuthenticatedUser();
      

    if (authError || !user) {
      console.error('  Auth failed:', authError);
      
      const response = NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );

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

    console.log('  User authenticated:', user.id);

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'html';

    if (!['json', 'html', 'pdf'].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid format. Supported formats: json, html, pdf'
        },
        { status: 400 }
      );
    }

    console.log(`📤 Exporting proposal ${params.proposalId} as ${format}`);

    try {
      const proposalService = new ProposalCreatorService();
      const exportResult = await proposalService.exportProposal(
        user.id,
        params.proposalId,
        format as 'json' | 'html' | 'pdf'
      );

      if (!exportResult) {
        throw new Error('Export returned null result');
      }

      // Calculate content length safely
      let contentLength: number;
      if (typeof exportResult.content === 'string') {
        contentLength = exportResult.content.length;
      } else {
        contentLength = 0; // For now, since we only have string formats
      }

      console.log('  Export completed:', {
        format: exportResult.format,
        filename: exportResult.filename,
        contentLength,
        mimeType: exportResult.mimeType
      });

      // HTML format - return as rendered HTML
      if (exportResult.format === 'html') {
        return new NextResponse(exportResult.content as string, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `inline; filename="${exportResult.filename}"`,
          },
        });
      }

      // JSON format
      if (exportResult.format === 'json') {
        return NextResponse.json({
          success: true,
          data: exportResult.content,
          meta: {
            filename: exportResult.filename,
            format: exportResult.format
          }
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported export format'
        },
        { status: 400 }
      );

    } catch (exportError) {
      console.error('  Export error:', exportError);

      return NextResponse.json(
        {
          success: false,
          error: exportError instanceof Error
            ? exportError.message
            : 'Export failed. Please try again.',
          debug: process.env.NODE_ENV === 'development'
            ? {
                errorType: exportError instanceof Error
                  ? exportError.constructor.name
                  : 'Unknown',
                errorMessage: exportError instanceof Error
                  ? exportError.message
                  : 'Unknown'
              }
            : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('  Unexpected Export Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export proposal. Please try again.',
        debug: process.env.NODE_ENV === 'development'
          ? {
              errorType: error instanceof Error ? error.constructor.name : 'Unknown',
              errorMessage: error instanceof Error ? error.message : 'Unknown'
            }
          : undefined
      },
      { status: 500 }
    );
  }
}