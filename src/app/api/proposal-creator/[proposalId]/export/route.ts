// app/api/proposal-creator/[proposalId]/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProposalCreatorService } from '../../../../../services/proposalCreator.service';

// Robust authentication function (matches other routes)
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();

    // Method 1: Try with route handler client
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });

      const { data: { user }, error } = await supabase.auth.getUser();

      if (!error && user) {
        return { user, error: null };
      }
      
      console.log('Route handler auth failed:', error);
    } catch (helperError) {
      console.warn('Route handler client failed:', helperError);
    }

    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);

        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: () => undefined,
            },
          }
        );

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
          return { user, error: null };
        }
        
        console.log('Token auth failed:', error);
      } catch (tokenError) {
        console.warn('Token auth error:', tokenError);
      }
    }

    // Method 3: Try with cookie validation
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;

              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded);
                  return cookie.value;
                } catch (e) {
                  console.warn(`Invalid cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
              console.warn(`Error reading cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );

    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    return { user, error };

  } catch (error) {
    console.error('All authentication methods failed:', error);
    return { user: null, error };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  console.log('🚀 Export API Route called for ID:', params.proposalId);

  try {
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      
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

    console.log('✅ User authenticated:', user.id);

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

      console.log('✅ Export completed:', {
        format: exportResult.format,
        filename: exportResult.filename,
        contentLength: typeof exportResult.content === 'string'
          ? exportResult.content.length
          : exportResult.content.byteLength,
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

      // // PDF format (if re-enabled)
      // if (exportResult.format === 'pdf') {
      //   return new NextResponse(exportResult.content as Buffer, {
      //     status: 200,
      //     headers: {
      //       'Content-Type': 'application/pdf',
      //       'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
      //     },
      //   });
      // }

      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported export format'
        },
        { status: 400 }
      );

    } catch (exportError) {
      console.error('💥 Export error:', exportError);

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
    console.error('💥 Unexpected Export Error:', error);

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