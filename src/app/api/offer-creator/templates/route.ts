// app/api/offer-creator/templates/route.ts - UPDATED TO MATCH NEW STRUCTURE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ApiResponse } from '@/types/offerCreator';

const RATE_LIMITS = {
  TEMPLATES: {
    limit: 100,
    window: 3600 // 1 hour
  }
};

// ✅ Signature offer templates data - comprehensive collection
const SIGNATURE_OFFER_TEMPLATES = {
  'B2B SaaS': {
    starter: {
      name: 'SaaS Setup & Optimization Starter',
      for: 'Small to medium SaaS companies looking to improve their operational efficiency',
      promise: 'Streamline your SaaS operations and increase user engagement by 25% in 60 days',
      scope: [
        'Initial SaaS audit and optimization assessment',
        'User onboarding flow optimization',
        'Basic analytics and reporting setup',
        'Monthly performance review and recommendations'
      ],
      pricing: '$2,500/month',
      timeline: '30-60 days for initial improvements',
      guarantee: 'Satisfaction guarantee: Full refund if no measurable improvement in 60 days',
      differentiators: [
        'SaaS-specific optimization expertise',
        'Proven user engagement frameworks',
        'Data-driven optimization approach'
      ]
    },
    core: {
      name: 'SaaS Growth Acceleration Program',
      for: 'Growing SaaS companies ready to scale their operations and user base',
      promise: 'Transform your SaaS into a growth engine with 40% improved retention and 30% faster user acquisition',
      scope: [
        'Comprehensive SaaS growth strategy development',
        'Advanced user onboarding and retention optimization',
        'Custom analytics dashboard and KPI tracking',
        'Weekly strategy sessions and optimization',
        'Team training on growth best practices'
      ],
      pricing: '$5,500/month',
      timeline: '90-120 days for full transformation',
      guarantee: 'Results guarantee: We work until you achieve 25% improvement in key metrics',
      differentiators: [
        'Proven SaaS growth methodologies',
        'Advanced analytics and insights',
        'Dedicated growth strategy support'
      ]
    },
    premium: {
      name: 'SaaS Market Leadership Partnership',
      for: 'Established SaaS companies seeking market leadership and competitive advantage',
      promise: 'Achieve industry-leading metrics with white-glove SaaS optimization and strategic guidance',
      scope: [
        'Enterprise-level SaaS optimization strategy',
        'Daily strategic advisory and support',
        'Custom growth technology implementation',
        'Executive coaching and leadership development',
        'Advanced predictive analytics and modeling',
        'Priority access to cutting-edge SaaS innovations'
      ],
      pricing: '$12,000/month',
      timeline: '6-12 months for market leadership position',
      guarantee: 'Partnership guarantee: We become your extended team until you dominate your market',
      differentiators: [
        'C-level SaaS advisory experience',
        'Proprietary growth technologies',
        'Market leadership positioning expertise'
      ]
    }
  },
  'E-commerce': {
    starter: {
      name: 'E-commerce Conversion Booster',
      for: 'Small to medium online stores looking to increase sales and reduce cart abandonment',
      promise: 'Increase your online store conversion rate by 20% and reduce cart abandonment in 45 days',
      scope: [
        'Conversion rate audit and optimization',
        'Cart abandonment reduction strategies',
        'Basic email marketing automation setup',
        'Monthly performance analysis and recommendations'
      ],
      pricing: '$1,800/month',
      timeline: '30-45 days for measurable results',
      guarantee: 'Performance guarantee: 15% conversion improvement or money back',
      differentiators: [
        'E-commerce conversion expertise',
        'Proven cart optimization techniques',
        'Mobile-first optimization approach'
      ]
    },
    core: {
      name: 'E-commerce Revenue Maximizer',
      for: 'Growing online retailers ready to scale revenue and customer lifetime value',
      promise: 'Transform your e-commerce store into a revenue powerhouse with 35% sales growth and improved customer retention',
      scope: [
        'Complete e-commerce revenue optimization',
        'Advanced customer segmentation and personalization',
        'Multi-channel marketing automation',
        'Weekly optimization sessions and A/B testing',
        'Customer retention and loyalty program development'
      ],
      pricing: '$4,200/month',
      timeline: '60-90 days for full revenue transformation',
      guarantee: 'Revenue guarantee: 25% revenue increase or we continue working for free',
      differentiators: [
        'Multi-channel e-commerce expertise',
        'Advanced personalization strategies',
        'Customer lifetime value optimization'
      ]
    },
    premium: {
      name: 'E-commerce Market Domination Suite',
      for: 'High-growth e-commerce brands seeking market leadership and omnichannel excellence',
      promise: 'Achieve e-commerce market dominance with industry-leading conversion rates and customer experience',
      scope: [
        'Enterprise e-commerce strategy and implementation',
        'Omnichannel experience optimization',
        'AI-powered personalization and automation',
        'Daily strategic support and optimization',
        'Advanced analytics and predictive modeling',
        'Priority access to emerging e-commerce technologies'
      ],
      pricing: '$9,500/month',
      timeline: '4-8 months for market leadership',
      guarantee: 'Domination guarantee: We work until you lead your market category',
      differentiators: [
        'Enterprise e-commerce expertise',
        'AI-powered optimization technologies',
        'Omnichannel experience mastery'
      ]
    }
  },
  'Healthcare': {
    starter: {
      name: 'Healthcare Practice Optimization Starter',
      for: 'Small to medium healthcare practices looking to improve patient experience and operational efficiency',
      promise: 'Improve patient satisfaction by 30% and reduce administrative overhead in 60 days',
      scope: [
        'Patient experience and workflow audit',
        'Basic appointment scheduling optimization',
        'Compliance and documentation improvement',
        'Monthly performance review and recommendations'
      ],
      pricing: '$3,200/month',
      timeline: '45-60 days for initial improvements',
      guarantee: 'Satisfaction guarantee: Improved patient scores or full refund',
      differentiators: [
        'Healthcare compliance expertise',
        'Patient experience optimization',
        'HIPAA-compliant solutions'
      ]
    },
    core: {
      name: 'Healthcare Excellence Transformation',
      for: 'Growing healthcare organizations ready to enhance patient outcomes and operational excellence',
      promise: 'Transform your healthcare practice with 40% improved patient outcomes and streamlined operations',
      scope: [
        'Comprehensive healthcare practice optimization',
        'Patient outcome tracking and improvement',
        'Staff training and workflow optimization',
        'Technology integration and automation',
        'Compliance and quality assurance programs'
      ],
      pricing: '$6,800/month',
      timeline: '90-120 days for complete transformation',
      guarantee: 'Outcome guarantee: Measurable patient outcome improvements or continued service',
      differentiators: [
        'Clinical outcome expertise',
        'Healthcare technology integration',
        'Regulatory compliance mastery'
      ]
    },
    premium: {
      name: 'Healthcare Leadership Excellence Partnership',
      for: 'Large healthcare systems seeking industry-leading patient outcomes and operational excellence',
      promise: 'Achieve healthcare industry leadership with exceptional patient outcomes and operational efficiency',
      scope: [
        'Enterprise healthcare strategy and implementation',
        'Advanced patient outcome optimization',
        'Leadership development and change management',
        'Technology innovation and digital transformation',
        'Quality metrics and accreditation support',
        'Research and best practice development'
      ],
      pricing: '$15,000/month',
      timeline: '6-12 months for industry leadership',
      guarantee: 'Excellence guarantee: Industry-leading metrics or continued partnership',
      differentiators: [
        'Healthcare system transformation expertise',
        'Clinical leadership development',
        'Innovation and research capabilities'
      ]
    }
  },
  'Marketing Agencies': {
    starter: {
      name: 'Agency Growth Foundation',
      for: 'Small to medium marketing agencies looking to improve client results and streamline operations',
      promise: 'Increase client campaign performance by 25% and improve agency efficiency in 45 days',
      scope: [
        'Client campaign audit and optimization',
        'Agency workflow and process improvement',
        'Basic reporting and analytics setup',
        'Monthly performance review and strategy updates'
      ],
      pricing: '$2,200/month',
      timeline: '30-45 days for measurable improvements',
      guarantee: 'Performance guarantee: Improved client results or money back',
      differentiators: [
        'Agency-specific optimization expertise',
        'Proven campaign improvement frameworks',
        'Client retention strategies'
      ]
    },
    core: {
      name: 'Agency Scale & Performance System',
      for: 'Growing marketing agencies ready to scale operations and deliver exceptional client results',
      promise: 'Transform your agency into a high-performance operation with 40% better client results and improved profitability',
      scope: [
        'Complete agency optimization and scaling strategy',
        'Advanced client campaign management',
        'Team productivity and skill development',
        'Client acquisition and retention optimization',
        'Profitability and pricing strategy enhancement'
      ],
      pricing: '$5,800/month',
      timeline: '75-90 days for full transformation',
      guarantee: 'Scale guarantee: 30% improvement in key metrics or continued service',
      differentiators: [
        'Agency scaling expertise',
        'Client success optimization',
        'Profitability enhancement strategies'
      ]
    },
    premium: {
      name: 'Agency Market Leadership Program',
      for: 'Established marketing agencies seeking market leadership and premium positioning',
      promise: 'Achieve agency market leadership with industry-leading client results and premium positioning',
      scope: [
        'Market leadership strategy and positioning',
        'Premium service development and delivery',
        'Thought leadership and brand building',
        'Advanced client success and retention',
        'Industry innovation and best practice development',
        'Strategic partnership and acquisition support'
      ],
      pricing: '$11,500/month',
      timeline: '6-10 months for market leadership',
      guarantee: 'Leadership guarantee: Market recognition and premium positioning',
      differentiators: [
        'Market leadership expertise',
        'Premium positioning strategies',
        'Industry innovation capabilities'
      ]
    }
  },
  'Real Estate': {
    starter: {
      name: 'Real Estate Success Starter',
      for: 'Individual agents and small teams looking to increase listings and close more deals',
      promise: 'Increase your listing pipeline by 30% and close rate by 20% in 60 days',
      scope: [
        'Lead generation strategy and implementation',
        'Listing presentation optimization',
        'Basic CRM and follow-up automation',
        'Monthly performance analysis and coaching'
      ],
      pricing: '$1,500/month',
      timeline: '45-60 days for measurable results',
      guarantee: 'Results guarantee: Increased listings and closings or money back',
      differentiators: [
        'Local market expertise',
        'Proven lead generation strategies',
        'Closing optimization techniques'
      ]
    },
    core: {
      name: 'Real Estate Growth Accelerator',
      for: 'Growing real estate professionals and teams ready to dominate their local market',
      promise: 'Transform your real estate business with 50% more transactions and premium market positioning',
      scope: [
        'Complete real estate business optimization',
        'Advanced lead generation and nurturing',
        'Market positioning and brand development',
        'Team training and performance optimization',
        'Technology integration and automation'
      ],
      pricing: '$3,800/month',
      timeline: '75-90 days for market transformation',
      guarantee: 'Growth guarantee: 35% transaction increase or continued service',
      differentiators: [
        'Market domination strategies',
        'Brand positioning expertise',
        'Team performance optimization'
      ]
    },
    premium: {
      name: 'Real Estate Market Leadership Suite',
      for: 'Top-performing agents and teams seeking market leadership and luxury positioning',
      promise: 'Achieve real estate market leadership with luxury positioning and industry recognition',
      scope: [
        'Market leadership strategy and execution',
        'Luxury market positioning and branding',
        'High-net-worth client acquisition',
        'Thought leadership and industry recognition',
        'Advanced market analytics and insights',
        'Strategic partnership development'
      ],
      pricing: '$7,500/month',
      timeline: '6-9 months for market leadership',
      guarantee: 'Leadership guarantee: Market recognition and luxury positioning',
      differentiators: [
        'Luxury market expertise',
        'High-net-worth client strategies',
        'Market leadership positioning'
      ]
    }
  }
};

const INDUSTRIES = Object.keys(SIGNATURE_OFFER_TEMPLATES);
const OFFER_TIERS = ['starter', 'core', 'premium'];

// ✅ Enhanced authentication function (matches other routes)
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
        console.log('✅ Auth Method 1 (route handler) succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Trying token auth for templates...');
        
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
          console.log('✅ Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Token auth error:', tokenError);
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
              
              // Validate base64 cookies
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded); // Validate JSON
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
    
    if (!error && user) {
      console.log('✅ Auth Method 3 (SSR cookies) succeeded for user:', user.id);
    } else {
      console.log('⚠️ SSR cookie auth failed:', error?.message);
    }
    
    return { user, error };
    
  } catch (error) {
    console.error('💥 All authentication methods failed:', error);
    return { user: null, error };
  }
}

function filterTemplatesByIndustry(industry: string) {
  const industryTemplates = SIGNATURE_OFFER_TEMPLATES[industry as keyof typeof SIGNATURE_OFFER_TEMPLATES];
  if (!industryTemplates) return [];
  
  return Object.entries(industryTemplates).map(([tier, template]) => ({
    industry,
    tier,
    ...template,
    id: `${industry.toLowerCase().replace(/\s/g, '-')}-${tier}`
  }));
}

function filterTemplatesByTier(tier: string) {
  const templates: any[] = [];
  
  Object.entries(SIGNATURE_OFFER_TEMPLATES).forEach(([industry, industryTemplates]) => {
    const template = industryTemplates[tier as keyof typeof industryTemplates];
    if (template) {
      templates.push({
        industry,
        tier,
        ...template,
        id: `${industry.toLowerCase().replace(/\s/g, '-')}-${tier}`
      });
    }
  });
  
  return templates;
}

function getAllTemplates() {
  const templates: any[] = [];
  
  Object.entries(SIGNATURE_OFFER_TEMPLATES).forEach(([industry, industryTemplates]) => {
    Object.entries(industryTemplates).forEach(([tier, template]) => {
      templates.push({
        industry,
        tier,
        ...template,
        id: `${industry.toLowerCase().replace(/\s/g, '-')}-${tier}`
      });
    });
  });
  
  return templates;
}

// GET method for retrieving signature offer templates
export async function GET(req: NextRequest) {
  try {
    console.log('🚀 Signature Offer Templates API called');

    // ✅ Enhanced authentication
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      console.error('❌ Auth failed in templates:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        } as ApiResponse<never>,
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

    console.log('✅ User authenticated successfully:', user.id);

    // Rate limiting for templates
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `signature_offer_templates:${user.id}`,
      RATE_LIMITS.TEMPLATES.limit,
      RATE_LIMITS.TEMPLATES.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Templates rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.reset
        } as ApiResponse<never>,
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    const { searchParams } = new URL(req.url);
    const industry = searchParams.get('industry');
    const tier = searchParams.get('tier');
    const includeMetadata = searchParams.get('metadata') !== 'false';

    console.log('📋 Fetching signature offer templates for:', { industry, tier });

    let templates: any[] = [];

    // Filter templates based on query parameters
    if (industry && tier) {
      // Get specific template
      const template = filterTemplatesByIndustry(industry).find(t => t.tier === tier);
      templates = template ? [template] : [];
    } else if (industry) {
      // Get all templates for industry
      templates = filterTemplatesByIndustry(industry);
    } else if (tier) {
      // Get all templates for tier
      templates = filterTemplatesByTier(tier);
    } else {
      // Get all templates
      templates = getAllTemplates();
    }

    // Add metadata if requested
    if (includeMetadata) {
      templates = templates.map(template => ({
        ...template,
        metadata: {
          estimatedROI: '200-400%',
          implementationComplexity: template.tier === 'starter' ? 'Low' : 
                                   template.tier === 'core' ? 'Medium' : 'High',
          idealClientSize: template.tier === 'starter' ? 'Small-Medium' : 
                          template.tier === 'core' ? 'Medium-Large' : 'Enterprise',
          averageTimeToResults: template.tier === 'starter' ? '30-60 days' : 
                               template.tier === 'core' ? '60-90 days' : '90-180 days'
        }
      }));
    }

    // ✅ Log usage for templates with enhanced metadata
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offer_templates',
        tokens: 0, // No AI tokens used
        timestamp: new Date(),
        metadata: {
          industry,
          tier,
          includeMetadata,
          resultCount: templates.length,
          filterType: industry && tier ? 'specific' : industry ? 'industry' : tier ? 'tier' : 'all'
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Signature offer templates fetch completed successfully');
    return NextResponse.json({
      success: true,
      data: {
        templates,
        industries: INDUSTRIES,
        tiers: OFFER_TIERS,
        total: templates.length,
        summary: {
          totalTemplates: getAllTemplates().length,
          industriesCovered: INDUSTRIES.length,
          tiersAvailable: OFFER_TIERS.length,
          filterApplied: {
            industry: !!industry,
            tier: !!tier
          }
        }
      },
      meta: {
        remaining: rateLimitResult.remaining,
        metadataIncluded: includeMetadata,
        filterType: industry && tier ? 'specific' : industry ? 'industry' : tier ? 'tier' : 'all'
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('💥 Unexpected Signature Offer Templates Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch signature offer templates. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}