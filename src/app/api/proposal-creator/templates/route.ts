// app/api/proposal-creator/templates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { 
  ApiResponseOptional,
  ProposalType,
  IndustryType,
  ProposalInput
} from '../../../../types/proposalCreator';

const RATE_LIMITS = {
  TEMPLATES: {
    limit: 200,
    window: 3600 // 1 hour
  }
};


type TemplateData = {
  id: string;
  name: string;
  description: string;
  proposalType: ProposalType;
  industry: IndustryType;
  template: Partial<ProposalInput>;
};

type IndustryTemplates = {
  [K in IndustryType]?: TemplateData;
};

type ProposalTemplatesType = {
  [K in ProposalType]?: IndustryTemplates;
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

// Template data
const PROPOSAL_TEMPLATES: ProposalTemplatesType = {
  'service-agreement': {
    technology: {
      id: 'tech-service-agreement',
      name: 'Technology Service Agreement',
      description: 'Template for ongoing technology services and support',
      proposalType: 'service-agreement' as ProposalType,
      industry: 'technology' as IndustryType,
      template: {
        proposalType: 'service-agreement' as ProposalType,
        client: {
          legalName: '',
          stateOfIncorporation: 'Delaware',
          entityType: 'corporation' as const,
          address: '',
          signatoryName: '',
          signatoryTitle: 'CTO',
          industry: 'technology' as IndustryType,
          companySize: 'medium' as const,
          decisionMaker: ''
        },
        project: {
          description: 'Comprehensive technology services including system architecture, development, and ongoing support to enhance operational efficiency and scalability.',
          objectives: [
            'Implement scalable technology solutions',
            'Ensure system reliability and 99.9% uptime',
            'Provide ongoing technical support and maintenance',
            'Optimize performance and security protocols'
          ],
          deliverables: [
            {
              name: 'System Architecture Design',
              description: 'Comprehensive technical architecture documentation and implementation plan',
              format: 'Technical Document + Implementation Guide',
              quantity: 1,
              acceptanceCriteria: ['Approved by technical team', 'Meets scalability requirements', 'Security audit passed']
            }
          ],
          timeline: '12 months ongoing service agreement',
          milestones: [
            {
              name: 'Initial System Assessment',
              description: 'Complete technical audit and architecture review',
              dueDate: '30 days from contract start',
              deliverables: ['System Architecture Design'],
              acceptanceCriteria: ['Technical audit completed', 'Architecture approved by stakeholders']
            }
          ],
          exclusions: [
            'Hardware procurement and installation',
            'Third-party software licensing costs',
            'On-site training beyond agreed scope'
          ],
          assumptions: [
            'Client provides necessary system access and credentials',
            'Existing infrastructure meets minimum requirements'
          ],
          dependencies: [
            'Client IT team cooperation and availability',
            'Access to existing system documentation'
          ]
        },
        pricing: {
          model: 'retainer' as const,
          totalAmount: 120000,
          currency: 'USD',
          breakdown: [
            {
              item: 'Monthly Retainer Fee',
              description: 'Ongoing technical services and support',
              quantity: 12,
              rate: 10000,
              amount: 120000,
              category: 'labor' as const
            }
          ],
          paymentSchedule: [
            {
              description: 'Monthly Retainer Payment',
              amount: 10000,
              dueDate: '1st of each month',
              conditions: ['Service agreement in effect'],
              status: 'pending' as const
            }
          ],
          expensePolicy: 'Pre-approved expenses reimbursed at cost with receipts',
          lateFeePercentage: 1.5,
          discounts: []
        },
        terms: {
          proposalValidityDays: 30,
          contractLength: 'annual' as const,
          terminationNotice: 30,
          intellectualProperty: 'work-for-hire' as const,
          confidentiality: true,
          liabilityLimit: 120000,
          warranty: 'Service Provider warrants professional performance and industry-standard practices',
          governingLaw: 'Delaware',
          disputeResolution: 'arbitration' as const,
          forceMarjeure: true,
          amendments: 'Amendments require written agreement from both parties'
        }
      }
    },
    consulting: {
      id: 'consulting-service-agreement',
      name: 'Business Consulting Service Agreement',
      description: 'Template for ongoing business consulting and advisory services',
      proposalType: 'service-agreement' as ProposalType,
      industry: 'consulting' as IndustryType,
      template: {
        proposalType: 'service-agreement' as ProposalType,
        client: {
          legalName: '',
          stateOfIncorporation: 'Delaware',
          entityType: 'corporation' as const,
          address: '',
          signatoryName: '',
          signatoryTitle: 'CEO',
          industry: 'consulting' as IndustryType,
          companySize: 'medium' as const,
          decisionMaker: ''
        },
        project: {
          description: 'Strategic business consulting services to optimize operations, develop growth strategies, and implement process improvements.',
          objectives: [
            'Optimize business operations and efficiency',
            'Develop strategic roadmap for growth',
            'Implement process improvements across departments'
          ],
          deliverables: [
            {
              name: 'Business Analysis Report',
              description: 'Comprehensive analysis of current operations with improvement recommendations',
              format: 'Professional Report + Executive Summary',
              quantity: 1,
              acceptanceCriteria: ['Includes actionable recommendations', 'Stakeholder approved']
            }
          ],
          timeline: '12 months',
          milestones: [],
          exclusions: [
            'Implementation of recommended changes',
            'Additional third-party consulting services'
          ],
          assumptions: [],
          dependencies: []
        },
        pricing: {
          model: 'hourly-rate' as const,
          totalAmount: 180000,
          currency: 'USD',
          breakdown: [],
          paymentSchedule: [],
          expensePolicy: '',
          lateFeePercentage: 1.5,
          discounts: []
        },
        terms: {
          proposalValidityDays: 30,
          contractLength: 'annual' as const,
          terminationNotice: 30,
          intellectualProperty: 'shared' as const,
          confidentiality: true,
          liabilityLimit: 180000,
          warranty: '',
          governingLaw: 'Delaware',
          disputeResolution: 'arbitration' as const,
          forceMarjeure: true,
          amendments: ''
        }
      }
    }
  },
  'project-proposal': {
    technology: {
      id: 'tech-project-proposal',
      name: 'Software Development Project Proposal',
      description: 'Template for custom software development projects',
      proposalType: 'project-proposal' as ProposalType,
      industry: 'technology' as IndustryType,
      template: {
        proposalType: 'project-proposal' as ProposalType,
        client: {
          legalName: '',
          stateOfIncorporation: 'Delaware',
          entityType: 'corporation' as const,
          address: '',
          signatoryName: '',
          signatoryTitle: 'CTO',
          industry: 'technology' as IndustryType,
          companySize: 'medium' as const,
          decisionMaker: ''
        },
        project: {
          description: 'Custom software development project to build a scalable web application with modern architecture and user-centric design.',
          objectives: [
            'Deliver fully functional web application',
            'Ensure scalable and maintainable codebase',
            'Implement comprehensive testing and documentation'
          ],
          deliverables: [
            {
              name: 'MVP Application',
              description: 'Minimum viable product with core functionality',
              format: 'Web Application + Source Code',
              quantity: 1,
              acceptanceCriteria: ['All core features functional', 'User acceptance testing passed']
            }
          ],
          timeline: '16 weeks from project kickoff',
          milestones: [],
          exclusions: [
            'Third-party integrations not specified',
            'Mobile application development'
          ],
          assumptions: [],
          dependencies: []
        },
        pricing: {
          model: 'milestone-based' as const,
          totalAmount: 85000,
          currency: 'USD',
          breakdown: [],
          paymentSchedule: [],
          expensePolicy: '',
          lateFeePercentage: 1.5,
          discounts: []
        },
        terms: {
          proposalValidityDays: 30,
          contractLength: 'one-time' as const,
          terminationNotice: 30,
          intellectualProperty: 'client-owns' as const,
          confidentiality: true,
          liabilityLimit: 85000,
          warranty: '',
          governingLaw: 'Delaware',
          disputeResolution: 'arbitration' as const,
          forceMarjeure: true,
          amendments: ''
        }
      }
    }
  },
  'retainer-agreement': {
    marketing: {
      id: 'marketing-retainer',
      name: 'Marketing Retainer Agreement',
      description: 'Template for ongoing marketing services retainer',
      proposalType: 'retainer-agreement' as ProposalType,
      industry: 'marketing' as IndustryType,
      template: {
        proposalType: 'retainer-agreement' as ProposalType,
        client: {
          legalName: '',
          stateOfIncorporation: 'Delaware',
          entityType: 'corporation' as const,
          address: '',
          signatoryName: '',
          signatoryTitle: 'Marketing Director',
          industry: 'marketing' as IndustryType,
          companySize: 'medium' as const,
          decisionMaker: ''
        },
        project: {
          description: 'Ongoing marketing services including strategy development, content creation, campaign management, and performance optimization.',
          objectives: [
            'Maintain consistent brand presence across channels',
            'Generate steady stream of qualified leads'
          ],
          deliverables: [],
          timeline: '12 months',
          milestones: [],
          exclusions: [],
          assumptions: [],
          dependencies: []
        },
        pricing: {
          model: 'retainer' as const,
          totalAmount: 72000,
          currency: 'USD',
          breakdown: [],
          paymentSchedule: [],
          expensePolicy: '',
          lateFeePercentage: 1.5,
          discounts: []
        },
        terms: {
          proposalValidityDays: 30,
          contractLength: 'annual' as const,
          terminationNotice: 30,
          intellectualProperty: 'shared' as const,
          confidentiality: true,
          liabilityLimit: 72000,
          warranty: '',
          governingLaw: 'Delaware',
          disputeResolution: 'arbitration' as const,
          forceMarjeure: true,
          amendments: ''
        }
      }
    }
  },
  'consulting-proposal': {
    consulting: {
      id: 'strategy-consulting-proposal',
      name: 'Strategic Consulting Proposal',
      description: 'Template for strategic business consulting engagements',
      proposalType: 'consulting-proposal' as ProposalType,
      industry: 'consulting' as IndustryType,
      template: {
        proposalType: 'consulting-proposal' as ProposalType,
        client: {
          legalName: '',
          stateOfIncorporation: 'Delaware',
          entityType: 'corporation' as const,
          address: '',
          signatoryName: '',
          signatoryTitle: 'CEO',
          industry: 'consulting' as IndustryType,
          companySize: 'medium' as const,
          decisionMaker: ''
        },
        project: {
          description: 'Strategic consulting engagement to analyze market positioning, identify growth opportunities, and develop implementation roadmap.',
          objectives: [
            'Conduct comprehensive market and competitive analysis',
            'Identify strategic growth opportunities'
          ],
          deliverables: [],
          timeline: '6 months',
          milestones: [],
          exclusions: [],
          assumptions: [],
          dependencies: []
        },
        pricing: {
          model: 'value-based' as const,
          totalAmount: 150000,
          currency: 'USD',
          breakdown: [],
          paymentSchedule: [],
          expensePolicy: '',
          lateFeePercentage: 1.5,
          discounts: []
        },
        terms: {
          proposalValidityDays: 30,
          contractLength: '6-months' as const,
          terminationNotice: 30,
          intellectualProperty: 'work-for-hire' as const,
          confidentiality: true,
          liabilityLimit: 150000,
          warranty: '',
          governingLaw: 'Delaware',
          disputeResolution: 'arbitration' as const,
          forceMarjeure: true,
          amendments: ''
        }
      }
    }
  },
  // Add the missing 'custom-proposal' type
  'custom-proposal': {
    other: {
      id: 'custom-proposal-template',
      name: 'Custom Proposal Template',
      description: 'Flexible template for custom proposal requirements',
      proposalType: 'custom-proposal' as ProposalType,
      industry: 'other' as IndustryType,
      template: {
        proposalType: 'custom-proposal' as ProposalType,
        client: {
          legalName: '',
          stateOfIncorporation: 'Delaware',
          entityType: 'corporation' as const,
          address: '',
          signatoryName: '',
          signatoryTitle: 'Executive',
          industry: 'other' as IndustryType,
          companySize: 'medium' as const,
          decisionMaker: ''
        },
        project: {
          description: 'Custom project description to be defined based on specific requirements.',
          objectives: [],
          deliverables: [],
          timeline: 'To be determined',
          milestones: [],
          exclusions: [],
          assumptions: [],
          dependencies: []
        },
        pricing: {
          model: 'fixed-price' as const,
          totalAmount: 50000,
          currency: 'USD',
          breakdown: [],
          paymentSchedule: [],
          expensePolicy: '',
          lateFeePercentage: 1.5,
          discounts: []
        },
        terms: {
          proposalValidityDays: 30,
          contractLength: 'one-time' as const,
          terminationNotice: 30,
          intellectualProperty: 'work-for-hire' as const,
          confidentiality: true,
          liabilityLimit: 50000,
          warranty: '',
          governingLaw: 'Delaware',
          disputeResolution: 'arbitration' as const,
          forceMarjeure: true,
          amendments: ''
        }
      }
    }
  }
};

// GET method for retrieving templates
export async function GET(req: NextRequest) {
  console.log('🚀 Proposal Templates API Route called');
  
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
      `proposal_templates:${user.id}`, 
      RATE_LIMITS.TEMPLATES.limit, 
      RATE_LIMITS.TEMPLATES.window
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
    const proposalType = searchParams.get('proposalType') as ProposalType | null;
    const industry = searchParams.get('industry') as IndustryType | null;

    console.log(`📋 Fetching templates - Type: ${proposalType || 'all'}, Industry: ${industry || 'all'}`);
    
    let templates: TemplateData[] = [];

    if (proposalType && industry) {
      // Get specific template with type safety
      const typeTemplates = PROPOSAL_TEMPLATES[proposalType];
      if (typeTemplates && typeTemplates[industry]) {
        templates = [typeTemplates[industry]];
      }
    } else if (proposalType) {
      // Get all templates for proposal type
      const typeTemplates = PROPOSAL_TEMPLATES[proposalType];
      if (typeTemplates) {
        templates = Object.values(typeTemplates).filter((template): template is TemplateData => !!template);
      }
    } else if (industry) {
      // Get all templates for industry
      Object.values(PROPOSAL_TEMPLATES).forEach(typeTemplates => {
        if (typeTemplates && typeTemplates[industry]) {
          templates.push(typeTemplates[industry]);
        }
      });
    } else {
      // Get all templates
      Object.values(PROPOSAL_TEMPLATES).forEach(typeTemplates => {
        if (typeTemplates) {
          const typeTemplateValues = Object.values(typeTemplates).filter((template): template is TemplateData => !!template);
          templates.push(...typeTemplateValues);
        }
      });
    }

    console.log('✅ Retrieved', templates.length, 'templates');

    // Usage logging
    try {
      await logUsage({
        userId: user.id,
        feature: 'proposal_templates',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          proposalType,
          industry,
          resultCount: templates.length
        }
      });
    } catch (logError) {
      console.error('⚠️ Templates usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      data: templates,
      meta: {
        count: templates.length,
        remaining: rateLimitResult.remaining,
        filters: {
          proposalType,
          industry
        },
        availableTypes: Object.keys(PROPOSAL_TEMPLATES),
        availableIndustries: [...new Set(
          Object.values(PROPOSAL_TEMPLATES)
            .flatMap(typeTemplates => typeTemplates ? Object.keys(typeTemplates) : [])
        )]
      }
    });

  } catch (error) {
    console.error('💥 Unexpected Templates Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch templates. Please try again.'
      } as ApiResponseOptional<never>,
      { status: 500 }
    );
  }
}