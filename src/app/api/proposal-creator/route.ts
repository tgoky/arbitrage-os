// app/api/proposal-creator/route.ts - FINAL VERSION with intelligent placeholders

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProposalCreatorService } from '../../../services/proposalCreator.service';
import { 
  validateProposalInput, 
  validateProposalBusinessRules 
} from '../../validators/proposalCreator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { 
  ProposalInput, 
  ProposalPackage, 
  ApiResponse, 
  ApiResponseOptional,
  SavedProposal
} from '../../../types/proposalCreator'; 
import { createNotification } from '@/lib/notificationHelper';

const RATE_LIMITS = {
  PROPOSAL_GENERATION: {
    limit: 30,
    window: 3600 // 1 hour
  },
  PROPOSAL_LIST: {
    limit: 100,
    window: 3600 // 1 hour
  }
};

// Authentication function
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

// Workspace validation function
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

// Intelligent placeholders application function
// Updated applyIntelligentPlaceholders function
function applyIntelligentPlaceholders(body: any, workspaceData?: any): ProposalInput {
  return {
    proposalType: body.proposalType || 'service-agreement',
    client: {
      legalName: body.client?.legalName || '', // Required from user - service will validate
      stateOfIncorporation: body.client?.stateOfIncorporation || 'Delaware', // Provide default
      entityType: body.client?.entityType || 'corporation',
      address: body.client?.address || '[CLIENT_ADDRESS]', // Service will replace with fallback
      signatoryName: body.client?.signatoryName || '[CLIENT_SIGNATORY]', // Service will replace
      signatoryTitle: body.client?.signatoryTitle || '[CLIENT_TITLE]', // Service will replace
      industry: body.client?.industry || 'other',
      companySize: body.client?.companySize || 'medium',
      decisionMaker: body.client?.decisionMaker || '[CLIENT_DECISION_MAKER]' // Service will replace
    },
    serviceProvider: {
      name: body.serviceProvider?.name || workspaceData?.name || '[SERVICE_PROVIDER]',
      legalName: body.serviceProvider?.legalName || (workspaceData?.name ? `${workspaceData.name} LLC` : '[SERVICE_PROVIDER_LEGAL]'),
      address: body.serviceProvider?.address || '[SERVICE_PROVIDER_ADDRESS]',
      signatoryName: body.serviceProvider?.signatoryName || '[SERVICE_PROVIDER_SIGNATORY]',
      signatoryTitle: body.serviceProvider?.signatoryTitle || '[SERVICE_PROVIDER_TITLE]',
      businessStructure: body.serviceProvider?.businessStructure || 'LLC',
      credentials: body.serviceProvider?.credentials || [],
      specializations: body.serviceProvider?.specializations || []
    },
    project: {
      description: body.project?.description || '', // Required from user - service will validate
      objectives: body.project?.objectives || [],
      deliverables: body.project?.deliverables || [],
      timeline: body.project?.timeline || '[PROJECT_TIMELINE]', // Service will replace
      milestones: body.project?.milestones || [],
      exclusions: body.project?.exclusions || [],
      assumptions: body.project?.assumptions || [],
      dependencies: body.project?.dependencies || []
    },
    pricing: {
      model: body.pricing?.model || 'fixed-price',
      totalAmount: body.pricing?.totalAmount || 0, // Required from user - service will validate
      currency: body.pricing?.currency || 'USD',
      breakdown: body.pricing?.breakdown || [],
      paymentSchedule: body.pricing?.paymentSchedule || [],
      expensePolicy: body.pricing?.expensePolicy || '[EXPENSE_POLICY]', // Service will replace
      lateFeePercentage: body.pricing?.lateFeePercentage || 1.5,
      discounts: body.pricing?.discounts || []
    },
    terms: {
      proposalValidityDays: body.terms?.proposalValidityDays || 30,
      contractLength: body.terms?.contractLength || 'one-time',
      terminationNotice: body.terms?.terminationNotice || 30,
      intellectualProperty: body.terms?.intellectualProperty || 'work-for-hire',
      confidentiality: body.terms?.confidentiality !== false,
      liabilityLimit: body.terms?.liabilityLimit || 0,
      warranty: body.terms?.warranty || '[WARRANTY_TERMS]', // Service will replace
      governingLaw: body.terms?.governingLaw || '[GOVERNING_LAW]', // Service will replace
      disputeResolution: body.terms?.disputeResolution || 'arbitration',
      forceMarjeure: body.terms?.forceMarjeure !== false,
      amendments: body.terms?.amendments || '[AMENDMENTS_CLAUSE]' // Service will replace
    },
    customizations: body.customizations || {
      includeExecutiveSummary: true,
      includeCaseStudies: false,
      includeTeamBios: false,
      includeTestimonials: false,
      includeRiskAssessment: false,
      includeTimeline: true,
      includeNextSteps: true,
      customSections: [],
      branding: {
        useCompanyColors: true,
        includeLogo: true,
        customHeader: '',
        customFooter: '',
        fontStyle: 'professional' as const
      }
    },
    workspaceId: body.workspaceId,
    userId: body.userId
  };
}


// POST method for generating proposals
export async function POST(req: NextRequest) {
  console.log('🚀 Proposal Creator API Route called');
  
  try {
    // Authentication
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        } as ApiResponseOptional<never>,
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

    console.log('✅ User authenticated successfully:', user.id);

    // Get workspace ID and body
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId') || body.workspaceId;

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
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `proposal_generation:${user.id}`,
      RATE_LIMITS.PROPOSAL_GENERATION.limit,
      RATE_LIMITS.PROPOSAL_GENERATION.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Too many generation requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        } as ApiResponseOptional<never>,
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    // Debug logging
    console.log('🔍 RECEIVED BODY STRUCTURE:');
    console.log('- proposalType:', body.proposalType);
    console.log('- client keys:', body.client ? Object.keys(body.client) : 'missing');
    console.log('- serviceProvider keys:', body.serviceProvider ? Object.keys(body.serviceProvider) : 'missing');
    console.log('- project keys:', body.project ? Object.keys(body.project) : 'missing');
    console.log('- pricing keys:', body.pricing ? Object.keys(body.pricing) : 'missing');

    // Check ESSENTIAL fields only - these are the only blocking requirements
    const essentialErrors: string[] = [];
    
    if (!body.client?.legalName || body.client.legalName.length < 2) {
      essentialErrors.push('Client legal name is required (minimum 2 characters)');
    }
    
    if (!body.project?.description || body.project.description.length < 20) {
      essentialErrors.push('Project description is required (minimum 20 characters)');
    }
    
    if (!body.pricing?.totalAmount || body.pricing.totalAmount < 100) {
      essentialErrors.push('Total amount must be at least $100');
    }

    if (essentialErrors.length > 0) {
      console.log('❌ Essential validation failed:', essentialErrors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Please complete the required fields: ' + essentialErrors.join(', '),
          details: essentialErrors.map(error => ({ message: error, critical: true }))
        } as ApiResponseOptional<never>,
        { status: 400 }
      );
    }

    console.log('✅ Essential validation passed');

    // Get workspace data for smart defaults
    let workspaceData: any = null;
    try {
      const { prisma } = await import('@/lib/prisma');
      workspaceData = await prisma.workspace.findFirst({
        where: { id: workspaceId, user_id: user.id }
      });
    } catch (error) {
      console.warn('Could not fetch workspace data for defaults:', error);
    }

    // Apply intelligent placeholders to create complete input
    const inputWithPlaceholders = applyIntelligentPlaceholders(body, workspaceData);
    inputWithPlaceholders.userId = user.id;
    inputWithPlaceholders.workspaceId = workspaceId;

    console.log('🔧 Applied intelligent placeholders');

    // Validate the complete input with relaxed validator
    console.log('🔍 Starting relaxed validation...');
    const validation = validateProposalInput(inputWithPlaceholders);
    
    if (!validation.success) {
      console.error('❌ RELAXED VALIDATION STILL FAILED:');
      console.error('Validation errors:', JSON.stringify(validation.errors, null, 2));
      
      // This should rarely happen with relaxed validation, but handle gracefully
      const criticalErrors = validation.errors.filter((error: any) => {
        const path = error.path?.join('.') || '';
        return ['client.legalName', 'project.description', 'pricing.totalAmount'].some(critical => 
          path.includes(critical)
        );
      });

      if (criticalErrors.length > 0) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Critical validation failed. Please check the required fields.',
            details: criticalErrors
          } as ApiResponseOptional<never>,
          { status: 400 }
        );
      }
      
      // If only non-critical errors, proceed with warnings
      console.warn('⚠️ Non-critical validation issues, proceeding...');
    }

    const validatedData = validation.success ? validation.data : inputWithPlaceholders;
    console.log('✅ Input validation completed');

    // Business rules validation (advisory only)
    console.log('🔍 Checking business rules (advisory)...');
    let businessValidation;
    try {
      businessValidation = validateProposalBusinessRules(validatedData);
    } catch (businessError) {
      console.warn('⚠️ Business validation error (non-critical):', businessError);
      businessValidation = {
        isValid: true,
        warnings: [],
        suggestions: [],
        riskFactors: []
      };
    }

    // Generate proposal
    console.log('🤖 Starting proposal generation...');
    let generatedProposal: ProposalPackage;
    try {
      console.log('🔧 Initializing ProposalCreatorService...');
      const proposalService = new ProposalCreatorService();
      
      console.log('⚡ Calling generateProposal method...');
      generatedProposal = await proposalService.generateProposal(validatedData);
      
      console.log('✅ Proposal generation completed successfully');
      
      // Debug the structure
      console.log('📊 Generated proposal structure:');
      console.log('- Proposal keys:', Object.keys(generatedProposal.proposal));
      console.log('- Analysis keys:', Object.keys(generatedProposal.analysis || {}));
      console.log('- Win probability:', generatedProposal.analysis?.winProbability?.score);
      console.log('- Risk level:', generatedProposal.analysis?.riskLevel);
      console.log('- Tokens used:', generatedProposal.tokensUsed);
      console.log('- Generation time:', generatedProposal.generationTime + 'ms');
      
      // Basic structure validation
      if (!generatedProposal.proposal?.projectOverview ||
          !generatedProposal.proposal?.scopeOfWork ||
          !generatedProposal.proposal?.pricing ||
          !generatedProposal.proposal?.contractTemplates?.serviceAgreement) {
        console.error('❌ Generated proposal missing required sections');
        throw new Error('Generated proposal structure is incomplete');
      }
      
    } catch (serviceError) {
      console.error('💥 Service error during generation:', serviceError);
      console.error('Service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate proposal. The AI service may be temporarily unavailable. Please try again.',
          debug: {
            errorType: serviceError instanceof Error ? serviceError.constructor.name : 'Unknown',
            errorMessage: serviceError instanceof Error ? serviceError.message : 'Unknown service error',
            inputSummary: {
              proposalType: validatedData.proposalType,
              clientName: validatedData.client.legalName,
              industry: validatedData.client.industry,
              totalAmount: validatedData.pricing.totalAmount,
              usedPlaceholders: true
            }
          }
        } as ApiResponseOptional<never>,
        { status: 500 }
      );
    }

    // Auto-save the proposal
    console.log('💾 Auto-saving proposal...');
    let proposalId: string;
    let saveSuccess = false;
    
    try {
      const proposalService = new ProposalCreatorService();
      proposalId = await proposalService.saveProposal(user.id, workspaceId, generatedProposal, validatedData);
      saveSuccess = true;
      console.log('✅ Proposal AUTO-SAVED with ID:', proposalId);
    } catch (saveError) {
      console.error('💥 Error auto-saving proposal:', saveError);
      
      if (saveError instanceof Error) {
        console.error('💥 Save error details:', {
          message: saveError.message,
          stack: saveError.stack,
          name: saveError.name
        });
      }
      
      proposalId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      saveSuccess = false;
      console.warn('⚠️ Using temporary ID - proposal not saved to database');
    }


    // After successful proposal generation and saving
// After successful proposal generation and saving
try {
  // Fetch workspace to get the slug
  const { prisma } = await import('@/lib/prisma');
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { slug: true }
  });

  if (!workspace) {
    console.warn('Workspace not found for notification:', workspaceId);
  } else {
    await createNotification({
      userId: user.id,
      workspaceId: workspaceId,
      workspaceSlug: workspace.slug,
      type: 'proposal',
      itemId: proposalId,
      metadata: {
        proposalType: validatedData.proposalType,
        clientName: validatedData.client.legalName,
        clientIndustry: validatedData.client.industry,
        totalValue: validatedData.pricing.totalAmount,
        winProbability: generatedProposal.analysis?.winProbability?.score,
        saved: saveSuccess
      }
    });
    
    console.log('✅ Notification created for proposal generation:', proposalId);
  }
} catch (notifError) {
  console.error('Failed to create notification:', notifError);
  // Don't fail the entire request if notification fails
}
    
    

    // Usage logging
    console.log('📊 Logging usage...');
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
          proposalType: validatedData.proposalType,
          clientName: validatedData.client.legalName,
          industry: validatedData.client.industry,
          totalAmount: validatedData.pricing.totalAmount,
          pricingModel: validatedData.pricing.model,
          contractLength: validatedData.terms.contractLength,
          winProbability: generatedProposal.analysis?.winProbability?.score,
          riskLevel: generatedProposal.analysis?.riskLevel,
          generationTime: generatedProposal.generationTime,
          businessWarnings: businessValidation?.warnings?.length || 0,
          businessSuggestions: businessValidation?.suggestions?.length || 0,
          appliedPlaceholders: true,
          relaxedValidation: true
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Proposal generation completed successfully');
    console.log(`📊 Final status: Generated=${true}, Saved=${saveSuccess}, ProposalID=${proposalId}`);
    
    // Success response
    return NextResponse.json({
      success: true,
      data: generatedProposal,
      meta: {
        proposalId,
        saved: saveSuccess,
        autoSaved: saveSuccess,
        tokensUsed: generatedProposal.tokensUsed,
        generationTime: generatedProposal.generationTime,
        remaining: rateLimitResult.remaining,
        businessValidation: {
          warnings: businessValidation?.warnings || [],
          suggestions: (businessValidation?.suggestions || []).slice(0, 5)
        },
        proposalQuality: {
          winProbability: generatedProposal.analysis?.winProbability?.score,
          riskLevel: generatedProposal.analysis?.riskLevel,
          pricingCompetitiveness: generatedProposal.analysis?.pricingAnalysis?.competitiveness,
          strengthsCount: generatedProposal.analysis?.strengthsWeaknesses?.strengths?.length || 0,
          weaknessesCount: generatedProposal.analysis?.strengthsWeaknesses?.weaknesses?.length || 0
        },
        relaxedValidation: true,
        appliedPlaceholders: true,
        version: '1.1'
      }
    } as ApiResponse<ProposalPackage>);

  } catch (error) {
    console.error('💥 Unexpected Proposal Creator API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        debug: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      } as ApiResponseOptional<never>,
      { status: 500 }
    );
  }
}

// GET method for listing proposals (unchanged)
export async function GET(req: NextRequest) {
  console.log('🚀 Proposals List API Route called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in proposals list:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        } as ApiResponseOptional<never>,
        { status: 401 }
      );
      
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', { expires: new Date(0), path: '/' });
      });
      
      return response;
    }

    console.log('✅ User authenticated successfully:', user.id);

    // Rate limiting
    const rateLimitResult = await rateLimit(
      `proposals_list:${user.id}`, 
      RATE_LIMITS.PROPOSAL_LIST.limit, 
      RATE_LIMITS.PROPOSAL_LIST.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        } as ApiResponseOptional<never>,
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const proposalType = searchParams.get('proposalType');
    const clientIndustry = searchParams.get('clientIndustry');

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
    
    let proposals: SavedProposal[];
    try {
      const proposalService = new ProposalCreatorService();
      proposals = await proposalService.getUserProposals(user.id, workspaceId || undefined);

      // Apply filters
      if (proposalType) {
        proposals = proposals.filter(proposal => proposal.proposalType === proposalType);
      }

      if (clientIndustry) {
        proposals = proposals.filter(proposal => {
          return proposal.metadata?.industry === clientIndustry;
        });
      }
      
      console.log('✅ Retrieved', proposals.length, 'proposals');
      
    } catch (fetchError) {
      console.error('💥 Error fetching proposals:', fetchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch proposals. Please try again.'
        } as ApiResponseOptional<never>,
        { status: 500 }
      );
    }

    // Usage logging
    try {
      await logUsage({
        userId: user.id,
        feature: 'proposals_list',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          workspaceId,
          proposalType,
          clientIndustry,
          resultCount: proposals.length
        }
      });
    } catch (logError) {
      console.error('⚠️ List usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      data: proposals,
      meta: {
        count: proposals.length,
        remaining: rateLimitResult.remaining,
        filters: {
          workspaceId,
          proposalType,
          clientIndustry
        }
      }
    } as ApiResponse<SavedProposal[]>);

  } catch (error) {
    console.error('💥 Unexpected Proposals Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch proposals. Please try again.'
      } as ApiResponseOptional<never>,
      { status: 500 }
    );
  }
}