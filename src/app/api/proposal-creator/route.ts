// app/api/proposal-creator/route.ts - COMPLETE SIMPLIFIED VERSION WITH ROBUST AUTH

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProposalCreatorService } from '../../../services/proposalCreator.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ProposalInput, ProposalPackage, ApiResponse, ApiResponseOptional, SavedProposal } from '../../../types/proposalCreator';

const RATE_LIMITS = {
  PROPOSAL_GENERATION: { limit: 30, window: 3600 },
  PROPOSAL_LIST: { limit: 100, window: 3600 }
};

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
      console.error('❌ Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('✅ User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { user: null, error };
  }
}


async function validateWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        user_id: userId
      }
    });
    return !!workspace;
  } catch (error) {
    console.error('Error validating workspace access:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  console.log('🚀 Proposal Creator API called');
  
  try {
    // Robust authentication
       const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('Auth failed in proposal creator:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies
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

    // Get body and workspace
    const body = await req.json();
    const workspaceId = body.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required. Please ensure you are accessing this from within a workspace.',
        code: 'WORKSPACE_ID_REQUIRED'
      }, { status: 400 });
    }

    // Validate workspace access
    const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace not found or access denied.',
        code: 'WORKSPACE_ACCESS_DENIED'
      }, { status: 403 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(
      `proposal_generation:${user.id}`,
      RATE_LIMITS.PROPOSAL_GENERATION.limit,
      RATE_LIMITS.PROPOSAL_GENERATION.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        success: false,
        error: 'Generation rate limit exceeded. You can generate 30 proposals per hour.',
        retryAfter: rateLimitResult.reset
      }, { status: 429 });
    }

    // Validate essential fields
    const errors: string[] = [];
    
    if (!body.clientInfo?.legalName || body.clientInfo.legalName.length < 2) {
      errors.push('Client legal name is required (minimum 2 characters)');
    }
    if (!body.projectScope?.description || body.projectScope.description.length < 20) {
      errors.push('Project description is required (minimum 20 characters)');
    }

    // if (!body.pricing?.totalAmount || body.pricing.totalAmount < 100) {
    //   errors.push('Total amount must be at least $100');
    // }

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false,
        error: errors.join(', '),
        details: errors
      }, { status: 400 });
    }

    // Create input object matching frontend structure
    const input: ProposalInput = {
      serviceProvider: {
        name: body.serviceProvider?.name,
        address: body.serviceProvider?.address,
        signatoryName: body.serviceProvider?.signatoryName,
        signatoryTitle: body.serviceProvider?.signatoryTitle
      },
      clientInfo: {
        legalName: body.clientInfo.legalName,
        stateOfIncorporation: body.clientInfo.stateOfIncorporation,
        entityType: body.clientInfo.entityType,
        address: body.clientInfo.address,
        signatoryName: body.clientInfo.signatoryName,
        signatoryTitle: body.clientInfo.signatoryTitle
      },
      projectScope: {
        description: body.projectScope.description,
        scopeOfServices: body.projectScope.scopeOfServices,
        timeline: body.projectScope.timeline,
        fees: body.projectScope.fees,
        serviceProviderResponsibilities: body.projectScope.serviceProviderResponsibilities,
        clientResponsibilities: body.projectScope.clientResponsibilities,
        acceptanceCriteria: body.projectScope.acceptanceCriteria,
        additionalTerms: body.projectScope.additionalTerms
      },
      // pricing: {
      //   totalAmount: body.pricing.totalAmount
      // },
      effectiveDate: body.effectiveDate,
      workspaceId: workspaceId,
      userId: user.id
    };

    // Generate proposal
    console.log('🤖 Starting proposal generation...');
    const proposalService = new ProposalCreatorService();
    const generatedProposal = await proposalService.generateProposal(input);

    // Auto-save
    let proposalId: string;
    let saveSuccess = false;
    
    try {
      proposalId = await proposalService.saveProposal(user.id, workspaceId, generatedProposal, input);
      saveSuccess = true;
      console.log('✅ Proposal saved with ID:', proposalId);
    } catch (saveError) {
      console.error('⚠️ Error saving:', saveError);
      proposalId = `temp_${Date.now()}`;
    }

    // Log usage
    try {
      await logUsage({
        userId: user.id,
        feature: 'proposal_generation',
        tokens: generatedProposal.tokensUsed || 0,
        timestamp: new Date(),
        metadata: {
          proposalId,
          workspaceId,
          saved: saveSuccess,
          clientName: input.clientInfo.legalName,
          generationTime: generatedProposal.generationTime,
          // totalAmount: input.pricing.totalAmount
        }
      });
      console.log('✅ Usage logged');
    } catch (logError) {
      console.error('⚠️ Usage logging failed:', logError);
    }

    console.log('🎉 Proposal generation completed');
    
    // Success response
    return NextResponse.json({
      success: true,
      data: generatedProposal,
      meta: {
        proposalId,
        saved: saveSuccess,
        tokensUsed: generatedProposal.tokensUsed,
        generationTime: generatedProposal.generationTime,
        remaining: rateLimitResult.remaining,
        version: '2.0'
      }
    } as ApiResponse<ProposalPackage>);

  } catch (error) {
    console.error('💥 API Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'An unexpected error occurred',
      debug: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    } as ApiResponseOptional<never>, { status: 500 });
  }
}

// GET method for listing proposals
export async function GET(req: NextRequest) {
  console.log('🚀 Proposals List API called');
  
  try {
    // Robust authentication
     const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('Auth failed in proposal list:', authError);
      
      const response = NextResponse.json({ 
        success: false,
        error: 'Authentication required. Please clear your browser cookies and sign in again.',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
      
      // Clear potentially corrupted cookies
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

    // Rate limiting
    const rateLimitResult = await rateLimit(
      `proposals_list:${user.id}`, 
      RATE_LIMITS.PROPOSAL_LIST.limit, 
      RATE_LIMITS.PROPOSAL_LIST.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        success: false,
        error: 'List rate limit exceeded.',
        retryAfter: rateLimitResult.reset 
      }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    // Validate workspace access if provided
    if (workspaceId) {
      const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
      if (!hasAccess) {
        return NextResponse.json({ 
          success: false,
          error: 'Workspace access denied.',
          code: 'WORKSPACE_ACCESS_DENIED'
        }, { status: 403 });
      }
    }

    console.log('📋 Fetching proposals for user:', user.id);
    
    const proposalService = new ProposalCreatorService();
    const proposals = await proposalService.getUserProposals(user.id, workspaceId || undefined);
    
    console.log('✅ Retrieved', proposals.length, 'proposals');

    // Log usage
    try {
      await logUsage({
        userId: user.id,
        feature: 'proposals_list',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          workspaceId,
          resultCount: proposals.length
        }
      });
    } catch (logError) {
      console.error('⚠️ List usage logging failed:', logError);
    }

    return NextResponse.json({
      success: true,
      data: proposals,
      meta: {
        count: proposals.length,
        remaining: rateLimitResult.remaining,
        filters: { workspaceId }
      }
    } as ApiResponse<SavedProposal[]>);

  } catch (error) {
    console.error('💥 List API Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch contracts'
    } as ApiResponseOptional<never>, { status: 500 });
  }
}