// app/api/proposal-creator/[proposalId]/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProposalCreatorService } from '../../../../../services/proposalCreator.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ApiResponseOptional } from '../../../../../types/proposalCreator';

const RATE_LIMITS = {
  PROPOSAL_EXPORT: {
    limit: 50,
    window: 3600 // 1 hour
  }
};

// Authentication function
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    try {
      const supabase = createRouteHandlerClient({ 
        cookies: () => cookieStore 
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        return { user, error: null };
      }
    } catch (helperError) {
      console.warn('Route handler client failed:', helperError);
    }
    
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
      } catch (tokenError) {
        console.warn('Token auth error:', tokenError);
      }
    }
    
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
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
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

// GET method for exporting proposals
// Fix: Update the export response handling to properly handle different return types

export async function GET(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  console.log('🚀 Export Proposal API Route called for ID:', params.proposalId);
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        } as ApiResponseOptional<never>,
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(
      `proposal_export:${user.id}`, 
      RATE_LIMITS.PROPOSAL_EXPORT.limit, 
      RATE_LIMITS.PROPOSAL_EXPORT.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many export requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        } as ApiResponseOptional<never>,
        { status: 429 }
      );
    }

    // Get format from query params
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'html';

    if (!['json', 'html', 'pdf'].includes(format)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid export format. Supported formats: json, html, pdf'
        } as ApiResponseOptional<never>,
        { status: 400 }
      );
    }

    console.log(`📤 Exporting proposal ${params.proposalId} as ${format.toUpperCase()}`);
    
    try {
      const proposalService = new ProposalCreatorService();
      const exportResult = await proposalService.exportProposal(user.id, params.proposalId, format as 'json' | 'html' | 'pdf');

      if (!exportResult) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Proposal not found or export failed.'
          } as ApiResponseOptional<never>,
          { status: 404 }
        );
      }
      
      console.log('✅ Proposal exported successfully');

      // Usage logging
      try {
        await logUsage({
          userId: user.id,
          feature: 'proposal_export',
          tokens: 0,
          timestamp: new Date(),
          metadata: {
            proposalId: params.proposalId,
            format: format
          }
        });
      } catch (logError) {
        console.error('⚠️ Export usage logging failed (non-critical):', logError);
      }

      if (format === 'html' || format === 'pdf') {
        // Return file download for HTML/PDF
        const headers = new Headers();
        headers.set('Content-Type', format === 'html' ? 'text/html' : 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        
        // Fix: Ensure content is a string for HTML/PDF responses
        const content = typeof exportResult.content === 'string' 
          ? exportResult.content 
          : JSON.stringify(exportResult.content);
        
        return new NextResponse(content, {
          status: 200,
          headers
        });
      } else {
        // Return JSON response for JSON format
        return NextResponse.json({
          success: true,
          data: exportResult,
          meta: {
            remaining: rateLimitResult.remaining,
            format: format,
            filename: exportResult.filename
          }
        });
      }

    } catch (exportError) {
      console.error('💥 Error exporting proposal:', exportError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to export proposal. Please try again.'
        } as ApiResponseOptional<never>,
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Unexpected Export Proposal Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to export proposal. Please try again.'
      } as ApiResponseOptional<never>,
      { status: 500 }
    );
  }
}