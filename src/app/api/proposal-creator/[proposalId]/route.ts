// app/api/proposal-creator/[proposalId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProposalCreatorService } from '../../../../services/proposalCreator.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ApiResponseOptional } from '../../../../types/proposalCreator';

const RATE_LIMITS = {
  PROPOSAL_GET: {
    limit: 100,
    window: 3600 // 1 hour
  },
  PROPOSAL_DELETE: {
    limit: 50,
    window: 3600 // 1 hour
  }
};

// Authentication function
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




// GET method for fetching a specific proposal
export async function GET(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  console.log('🚀 Get Proposal API Route called for ID:', params.proposalId);
  
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(
      `proposal_get:${user.id}`, 
      RATE_LIMITS.PROPOSAL_GET.limit, 
      RATE_LIMITS.PROPOSAL_GET.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    console.log(`📋 Fetching proposal ${params.proposalId} for user ${user.id}`);
    
    try {
      const proposalService = new ProposalCreatorService();
      const proposal = await proposalService.getProposal(user.id, params.proposalId);

      if (!proposal) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Proposal not found.'
          },
          { status: 404 }
        );
      }
      
      console.log('✅ Proposal found');

      // Usage logging
      try {
        await logUsage({
          userId: user.id,
          feature: 'proposal_view',
          tokens: 0,
          timestamp: new Date(),
          metadata: {
            proposalId: params.proposalId
          }
        });
      } catch (logError) {
        console.error('⚠️ Usage logging failed (non-critical):', logError);
      }

      // Format response to match what the detail page expects
    // Format response to match what the detail page expects
// Format response to match what the detail page expects
const metadata = proposal.metadata as any; // Type assertion

return NextResponse.json({
  success: true,
  data: {
    id: proposal.id,
    title: proposal.title,
    proposalData: proposal.proposalData,  // ← CHANGED FROM proposal.proposal
    proposalType: metadata?.proposalType || 'service-agreement',
    clientName: metadata?.clientName || 'Unknown Client',
    status: 'draft',
    totalValue: metadata?.totalValue || 0,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
    metadata: {
      industry: metadata?.clientIndustry || 'other',
      projectSize: 'medium',
      complexity: 'moderate',
      winProbability: metadata?.winProbability || 50,
      version: metadata?.version || '1.0'
    },
    workspace: proposal.workspace
  },
  meta: {
    remaining: rateLimitResult.remaining
  }
});

    } catch (serviceError) {
      console.error('💥 Error fetching proposal:', serviceError);
      
      return NextResponse.json(
        { 
          success: false,
          error: serviceError instanceof Error ? serviceError.message : 'Failed to fetch proposal. Please try again.'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Unexpected Get Proposal Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch proposal. Please try again.'
      },
      { status: 500 }
    );
  }
}

// DELETE method for deleting a specific proposal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  console.log('🚀 Delete Proposal API Route called for ID:', params.proposalId);
  
  try {
       const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(
      `proposal_delete:${user.id}`, 
      RATE_LIMITS.PROPOSAL_DELETE.limit, 
      RATE_LIMITS.PROPOSAL_DELETE.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many delete requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    console.log(`🗑️ Deleting proposal ${params.proposalId} for user ${user.id}`);
    
    try {
      const proposalService = new ProposalCreatorService();
      const deleted = await proposalService.deleteProposal(user.id, params.proposalId);

      if (!deleted) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Proposal not found or already deleted.'
          },
          { status: 404 }
        );
      }
      
      console.log('✅ Proposal deleted successfully');

      // Usage logging
      try {
        await logUsage({
          userId: user.id,
          feature: 'proposal_delete',
          tokens: 0,
          timestamp: new Date(),
          metadata: {
            proposalId: params.proposalId
          }
        });
      } catch (logError) {
        console.error('⚠️ Usage logging failed (non-critical):', logError);
      }

      return NextResponse.json({
        success: true,
        data: { deleted: true },
        meta: {
          remaining: rateLimitResult.remaining
        }
      });

    } catch (deleteError) {
      console.error('💥 Error deleting proposal:', deleteError);
      
      return NextResponse.json(
        { 
          success: false,
          error: deleteError instanceof Error ? deleteError.message : 'Failed to delete proposal. Please try again.'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Unexpected Delete Proposal Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete proposal. Please try again.'
      },
      { status: 500 }
    );
  }
}