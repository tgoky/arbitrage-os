// app/api/offer-creator/benchmarks/route.ts - UPDATED TO MATCH NEW STRUCTURE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ApiResponse } from '@/types/offerCreator';

const RATE_LIMITS = {
  BENCHMARKS: {
    limit: 100,
    window: 3600 // 1 hour
  }
};

// ✅ Industry benchmarks data - moved from utils to route since it's specific
const SIGNATURE_OFFER_BENCHMARKS = {
  'B2B SaaS': {
    conversionRate: { min: 2.5, max: 6.0, average: 3.8, description: 'Proposal to client conversion rate' },
    proposalRate: { min: 20, max: 35, average: 27, description: 'Inquiry to proposal rate' },
    avgDealSize: { min: 30000, max: 100000, average: 55000, description: 'Average contract value' },
    timeToClose: { min: 45, max: 120, average: 75, description: 'Days from proposal to close' },
    characteristics: [
      'ROI-focused messaging works best',
      'Integration capabilities are key differentiators',
      'Annual contracts preferred over monthly',
      'Strong onboarding process critical for retention'
    ],
    commonPainPoints: [
      'Complex implementation processes',
      'Integration challenges',
      'User adoption difficulties',
      'Scaling operational overhead'
    ],
    winningPositioning: [
      'Proven ROI with specific metrics',
      'Seamless integration capabilities',
      'Comprehensive support and training',
      'Scalable solution architecture'
    ]
  },
  'E-commerce': {
    conversionRate: { min: 1.5, max: 4.0, average: 2.8, description: 'Proposal to client conversion rate' },
    proposalRate: { min: 25, max: 45, average: 35, description: 'Inquiry to proposal rate' },
    avgDealSize: { min: 5000, max: 25000, average: 15000, description: 'Average contract value' },
    timeToClose: { min: 15, max: 45, average: 30, description: 'Days from proposal to close' },
    characteristics: [
      'Quick decision-making cycles',
      'Revenue impact focus',
      'Seasonal considerations important',
      'Mobile-first approach essential'
    ],
    commonPainPoints: [
      'Cart abandonment issues',
      'Customer acquisition costs',
      'Inventory management',
      'Payment processing complexity'
    ],
    winningPositioning: [
      'Immediate revenue impact',
      'Conversion rate optimization',
      'Mobile commerce expertise',
      'Multi-channel integration'
    ]
  },
  'Healthcare': {
    conversionRate: { min: 3.0, max: 7.0, average: 4.5, description: 'Proposal to client conversion rate' },
    proposalRate: { min: 18, max: 32, average: 25, description: 'Inquiry to proposal rate' },
    avgDealSize: { min: 50000, max: 150000, average: 85000, description: 'Average contract value' },
    timeToClose: { min: 60, max: 180, average: 120, description: 'Days from proposal to close' },
    characteristics: [
      'Compliance and safety paramount',
      'Longer evaluation cycles',
      'Multiple stakeholder approval',
      'Risk-averse decision making'
    ],
    commonPainPoints: [
      'Regulatory compliance complexity',
      'Patient data security concerns',
      'Workflow integration challenges',
      'Staff training and adoption'
    ],
    winningPositioning: [
      'Compliance and safety focus',
      'Proven patient outcomes',
      'Seamless workflow integration',
      'Comprehensive training and support'
    ]
  },
  'Finance': {
    conversionRate: { min: 2.8, max: 6.5, average: 4.2, description: 'Proposal to client conversion rate' },
    proposalRate: { min: 15, max: 30, average: 22, description: 'Inquiry to proposal rate' },
    avgDealSize: { min: 75000, max: 200000, average: 125000, description: 'Average contract value' },
    timeToClose: { min: 90, max: 240, average: 150, description: 'Days from proposal to close' },
    characteristics: [
      'Security and compliance critical',
      'Risk management focus',
      'Detailed ROI analysis required',
      'Conservative decision making'
    ],
    commonPainPoints: [
      'Regulatory compliance burden',
      'Data security requirements',
      'Legacy system integration',
      'Risk management complexity'
    ],
    winningPositioning: [
      'Security and compliance expertise',
      'Risk reduction focus',
      'Proven regulatory knowledge',
      'Enterprise-grade reliability'
    ]
  },
  'Marketing Agencies': {
    conversionRate: { min: 4.0, max: 8.0, average: 6.0, description: 'Proposal to client conversion rate' },
    proposalRate: { min: 30, max: 50, average: 40, description: 'Inquiry to proposal rate' },
    avgDealSize: { min: 15000, max: 40000, average: 28000, description: 'Average contract value' },
    timeToClose: { min: 30, max: 75, average: 50, description: 'Days from proposal to close' },
    characteristics: [
      'Results-driven expectations',
      'Performance-based pricing common',
      'Creative and strategic balance',
      'Quick turnaround expectations'
    ],
    commonPainPoints: [
      'Proving marketing ROI',
      'Campaign performance tracking',
      'Client expectation management',
      'Resource allocation challenges'
    ],
    winningPositioning: [
      'Proven campaign results',
      'Data-driven approach',
      'Industry-specific expertise',
      'Performance guarantees'
    ]
  },
  'Real Estate': {
    conversionRate: { min: 3.5, max: 7.5, average: 5.2, description: 'Proposal to client conversion rate' },
    proposalRate: { min: 25, max: 40, average: 32, description: 'Inquiry to proposal rate' },
    avgDealSize: { min: 20000, max: 60000, average: 35000, description: 'Average contract value' },
    timeToClose: { min: 45, max: 120, average: 75, description: 'Days from proposal to close' },
    characteristics: [
      'Local market expertise crucial',
      'Relationship-based sales',
      'Market timing sensitive',
      'Referral-driven growth'
    ],
    commonPainPoints: [
      'Market volatility impact',
      'Lead generation consistency',
      'Transaction complexity',
      'Regulatory compliance'
    ],
    winningPositioning: [
      'Local market expertise',
      'Proven transaction history',
      'Technology-enabled processes',
      'Full-service capabilities'
    ]
  },
  'Manufacturing': {
    conversionRate: { min: 2.2, max: 5.5, average: 3.5, description: 'Proposal to client conversion rate' },
    proposalRate: { min: 18, max: 35, average: 26, description: 'Inquiry to proposal rate' },
    avgDealSize: { min: 40000, max: 200000, average: 95000, description: 'Average contract value' },
    timeToClose: { min: 60, max: 180, average: 110, description: 'Days from proposal to close' },
    characteristics: [
      'Quality and reliability focus',
      'Long-term partnership approach',
      'Technical expertise required',
      'Cost efficiency paramount'
    ],
    commonPainPoints: [
      'Production efficiency optimization',
      'Quality control challenges',
      'Supply chain management',
      'Equipment maintenance costs'
    ],
    winningPositioning: [
      'Quality and reliability track record',
      'Cost reduction expertise',
      'Technical innovation capabilities',
      'Long-term partnership approach'
    ]
  },
  'General': {
    conversionRate: { min: 2.0, max: 5.0, average: 3.2, description: 'Proposal to client conversion rate' },
    proposalRate: { min: 20, max: 40, average: 30, description: 'Inquiry to proposal rate' },
    avgDealSize: { min: 20000, max: 60000, average: 40000, description: 'Average contract value' },
    timeToClose: { min: 30, max: 90, average: 60, description: 'Days from proposal to close' },
    characteristics: [
      'Value proposition clarity important',
      'Professional credibility essential',
      'Competitive differentiation needed',
      'Strong communication skills required'
    ],
    commonPainPoints: [
      'Proving ROI and value',
      'Competitive differentiation',
      'Building trust and credibility',
      'Managing client expectations'
    ],
    winningPositioning: [
      'Clear value proposition',
      'Proven results and testimonials',
      'Professional expertise',
      'Excellent communication'
    ]
  }
};

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
        console.log('🔍 Trying token auth for benchmarks...');
        
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

function getSignatureOfferBenchmark(industry: string) {
  return SIGNATURE_OFFER_BENCHMARKS[industry as keyof typeof SIGNATURE_OFFER_BENCHMARKS] || 
         SIGNATURE_OFFER_BENCHMARKS['General'];
}

// GET method for retrieving signature offer benchmarks
export async function GET(req: NextRequest) {
  try {
    console.log('🚀 Signature Offer Benchmarks API called');

    // ✅ Enhanced authentication
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      console.error('❌ Auth failed in benchmarks:', authError);
      
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

    // Rate limiting for benchmarks
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `signature_offer_benchmarks:${user.id}`,
      RATE_LIMITS.BENCHMARKS.limit,
      RATE_LIMITS.BENCHMARKS.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Benchmarks rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.reset
        } as ApiResponse<never>,
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    const { searchParams } = new URL(req.url);
    const industry = searchParams.get('industry');
    const includeInsights = searchParams.get('insights') !== 'false';

    console.log('📊 Fetching signature offer benchmarks for industry:', industry || 'all');
    console.log('🔍 Include insights:', includeInsights);

    let responseData: any;
    if (industry) {
      // Return specific industry benchmark
      const benchmark = getSignatureOfferBenchmark(industry);
      
      responseData = {
        industry,
        benchmark,
        industrySpecific: true,
        comparison: {
          vsGeneral: {
            conversionRate: benchmark.conversionRate.average - SIGNATURE_OFFER_BENCHMARKS['General'].conversionRate.average,
            avgDealSize: benchmark.avgDealSize.average - SIGNATURE_OFFER_BENCHMARKS['General'].avgDealSize.average,
            timeToClose: benchmark.timeToClose.average - SIGNATURE_OFFER_BENCHMARKS['General'].timeToClose.average
          }
        }
      };

      // Add insights if requested
      if (includeInsights) {
        responseData.insights = {
          keyStrengths: benchmark.winningPositioning,
          commonChallenges: benchmark.commonPainPoints,
          industryCharacteristics: benchmark.characteristics,
          recommendations: [
            `Target ${benchmark.conversionRate.average}% conversion rate for ${industry}`,
            `Average deal size should be around $${benchmark.avgDealSize.average.toLocaleString()}`,
            `Plan for ${benchmark.timeToClose.average} day sales cycles`,
            'Focus on industry-specific pain points for better positioning'
          ]
        };
      }
    } else {
      // Return all industry benchmarks
      const industries = Object.keys(SIGNATURE_OFFER_BENCHMARKS);
      responseData = {
        benchmarks: includeInsights ? SIGNATURE_OFFER_BENCHMARKS : 
          Object.fromEntries(
            Object.entries(SIGNATURE_OFFER_BENCHMARKS).map(([key, value]) => [
              key, 
              {
                conversionRate: value.conversionRate,
                proposalRate: value.proposalRate,
                avgDealSize: value.avgDealSize,
                timeToClose: value.timeToClose
              }
            ])
          ),
        industries,
        summary: {
          totalIndustries: industries.length,
          avgConversionRate: industries.reduce((sum, ind) => 
            sum + getSignatureOfferBenchmark(ind).conversionRate.average, 0) / industries.length,
          avgDealSize: industries.reduce((sum, ind) => 
            sum + getSignatureOfferBenchmark(ind).avgDealSize.average, 0) / industries.length,
          topPerformingIndustries: industries
            .sort((a, b) => getSignatureOfferBenchmark(b).conversionRate.average - 
                           getSignatureOfferBenchmark(a).conversionRate.average)
            .slice(0, 3)
        }
      };
    }

    // ✅ Log usage for benchmarks with enhanced metadata
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offer_benchmarks',
        tokens: 0, // No AI tokens used
        timestamp: new Date(),
        metadata: {
          industry,
          requestType: industry ? 'specific' : 'all',
          includeInsights,
          industriesRequested: industry ? 1 : Object.keys(SIGNATURE_OFFER_BENCHMARKS).length
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Signature offer benchmarks fetch completed successfully');
    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        remaining: rateLimitResult.remaining,
        industrySpecific: !!industry,
        insightsIncluded: includeInsights,
        lastUpdated: '2024-01-01' // You could make this dynamic
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('💥 Unexpected Signature Offer Benchmarks Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch signature offer benchmarks. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}