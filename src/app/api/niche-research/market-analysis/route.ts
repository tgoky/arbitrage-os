// app/api/niche-research/market-analysis/route.ts - UPDATED FOR NEW STRUCTURE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OpenRouterClient } from '@/lib/openrouter';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { z } from 'zod';

// ✅ IMPROVED AUTH FUNCTION
// Use this IMPROVED 3-method approach in ALL routes
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header (most reliable for API calls)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: { get: () => undefined },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('Token auth failed:', tokenError);
      }
    }
    
    // Method 2: SSR cookies (FIXED cookie handling)
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              try {
                const cookie = cookieStore.get(name);
                if (!cookie?.value) return undefined;
                
                // FIXED: Proper base64 cookie handling
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded); // Validate it's valid JSON
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
                    return undefined; // Skip corrupted cookies
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
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client (fallback)
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (routeError) {
      console.warn('Route handler auth failed:', routeError);
    }
    
    return { user: null, error: new Error('All authentication methods failed') };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error };
  }
}
// ✅ UPDATED SCHEMA TO MATCH NEW NICHE RESEARCH STRUCTURE
const marketAnalysisSchema = z.object({
  // Core analysis fields
  niche: z.string().min(3).max(200),
  analysisType: z.enum(['competitive', 'opportunity', 'validation', 'trends']).default('opportunity'),
  
  // New niche research structure fields
  primaryObjective: z.enum(['cashflow', 'equity-exit', 'lifestyle', 'audience-build', 'saas', 'agency', 'ecomm']).optional(),
  riskAppetite: z.enum(['low', 'medium', 'high']).optional(),
  marketType: z.enum(['b2b-saas', 'b2c-consumer', 'professional-services', 'local-business', 'info-education']).optional(),
  customerSize: z.enum(['startups', 'smb', 'enterprise', 'consumers', 'government']).optional(),
  
  // Resources & constraints
  budget: z.enum(['<10k', '10k-50k', '50k-250k', '250k+']),
  geographicFocus: z.enum(['local', 'regional', 'us-only', 'global']).optional(),
  timeCommitment: z.enum(['5-10', '10-20', '20-30', '30+']).optional(),
  teamSize: z.enum(['solo', 'small-team', 'established-team']).optional(),
  
  // Skills and preferences
  skills: z.array(z.string()).min(1).max(15),
  industries: z.array(z.string()).max(10).optional(),
  excludedIndustries: z.array(z.string()).max(10).optional(),
  
  // Analysis depth
  includeCompetitors: z.boolean().default(true),
  includeTrends: z.boolean().default(true),
  includeValidation: z.boolean().default(false)
});

export async function POST(req: NextRequest) {
  console.log('🚀 Market Analysis API called');
  
  try {
    // ✅ AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    // ✅ RATE LIMITING for market analysis - 20 per hour
    const rateLimitResult = await rateLimit(
      `niche_market_analysis:${user.id}`,
      20,
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Market analysis rate limit exceeded. You can perform 20 analyses per hour.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // ✅ VALIDATE INPUT
    const body = await req.json();
    console.log('🔍 Market analysis input:', body);
    
    const validation = marketAnalysisSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('❌ Market analysis validation failed:', validation.error.issues);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;
    console.log('✅ Market analysis validation passed');

    // ✅ PERFORM MARKET ANALYSIS WITH AI
    const openRouter = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    
    const analysisPrompt = buildMarketAnalysisPrompt(validatedData);

    const response = await openRouter.complete({
      model: 'openai/gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert market research analyst specializing in niche business opportunities. 
          
          Provide detailed, data-driven market insights that are:
          - Actionable and specific
          - Based on real market conditions
          - Tailored to the user's resources and constraints
          - Focused on practical next steps
          
          Always respond with valid JSON in the exact format requested.`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    // ✅ PARSE AI RESPONSE
    let analysis;
    try {
      console.log('🔍 Parsing AI response...');
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
        console.log('✅ AI response parsed successfully');
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response, using fallback:', parseError);
      analysis = generateFallbackAnalysis(validatedData);
    }

    // ✅ LOG USAGE
    try {
      await logUsage({
        userId: user.id,
        feature: 'niche_market_analysis',
        tokens: response.usage.total_tokens,
        timestamp: new Date(),
        metadata: {
          niche: validatedData.niche,
          analysisType: validatedData.analysisType,
          primaryObjective: validatedData.primaryObjective || null,
          marketType: validatedData.marketType || null,
          skillsCount: validatedData.skills.length,
          budget: validatedData.budget
        }
      });
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      data: {
        niche: validatedData.niche,
        analysisType: validatedData.analysisType,
        analysis,
        context: {
          primaryObjective: validatedData.primaryObjective,
          marketType: validatedData.marketType,
          budget: validatedData.budget,
          skillsAnalyzed: validatedData.skills.length
        },
        tokensUsed: response.usage.total_tokens
      },
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Market Analysis Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze market. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// ✅ UPDATED PROMPT BUILDER FOR NEW STRUCTURE
function buildMarketAnalysisPrompt(data: z.infer<typeof marketAnalysisSchema>): string {
  const {
    niche,
    analysisType,
    primaryObjective,
    riskAppetite,
    marketType,
    customerSize,
    budget,
    geographicFocus,
    timeCommitment,
    teamSize,
    skills,
    industries,
    excludedIndustries,
    includeCompetitors,
    includeTrends,
    includeValidation
  } = data;

  const contextSection = `
**NICHE TO ANALYZE:** ${niche}

**BUSINESS CONTEXT:**
- Primary Objective: ${primaryObjective || 'Not specified'}
- Risk Appetite: ${riskAppetite || 'Not specified'}
- Market Type Preference: ${marketType || 'Not specified'}
- Target Customer Size: ${customerSize || 'Not specified'}
- Budget Available: ${budget}
- Geographic Focus: ${geographicFocus || 'Not specified'}
- Time Commitment: ${timeCommitment ? `${timeCommitment} hours/week` : 'Not specified'}
- Team Size: ${teamSize || 'Not specified'}

**SKILLS & CAPABILITIES:**
Available Skills: ${skills.join(', ')}
${industries && industries.length > 0 ? `Industry Interests: ${industries.join(', ')}` : ''}
${excludedIndustries && excludedIndustries.length > 0 ? `Industries to Avoid: ${excludedIndustries.join(', ')}` : ''}
  `;

  const prompts = {
    competitive: `
      ${contextSection}
      
      **ANALYSIS TYPE:** Competitive Landscape Analysis
      
      Analyze the competitive environment for this niche. Provide response in JSON format:
      {
        "competitorCount": "estimated number of direct competitors",
        "marketSaturation": "Low/Medium/High",
        "topCompetitors": [
          {
            "name": "competitor name",
            "description": "what they do",
            "strengths": ["their key advantages"],
            "weaknesses": ["potential gaps you could exploit"]
          }
        ],
        "competitiveAdvantages": ["potential advantages based on your skills and context"],
        "barrierToEntry": "Low/Medium/High",
        "differentiationOpportunities": ["specific ways to stand out"],
        "marketGaps": ["underserved areas or customer segments"],
        "threatLevel": "Low/Medium/High",
        "competitiveStrategy": "recommended approach to compete",
        "timeToMarket": "estimated time to establish market presence",
        "recommendations": ["specific strategic recommendations"]
      }
    `,
    
    opportunity: `
      ${contextSection}
      
      **ANALYSIS TYPE:** Market Opportunity Analysis
      
      Analyze market opportunities for this niche. Provide response in JSON format:
      {
        "marketSize": "estimated total addressable market with currency",
        "growthRate": "annual growth percentage with context",
        "demandLevel": "Low/Medium/High",
        "seasonality": "seasonal patterns and timing considerations",
        "targetCustomers": [
          {
            "segment": "customer segment name",
            "size": "estimated segment size",
            "painPoints": ["specific problems they face"],
            "willingnessToPay": "their budget range and payment preferences"
          }
        ],
        "revenueStreams": [
          {
            "model": "revenue model name",
            "potential": "Low/Medium/High",
            "timeframe": "when this becomes viable"
          }
        ],
        "scalabilityFactor": "Low/Medium/High",
        "marketTrends": ["relevant trends driving growth"],
        "opportunityScore": "number from 1-10",
        "quickWins": ["immediate opportunities you can pursue"],
        "longTermPotential": "detailed description of long-term growth prospects",
        "resourceAlignment": "how well this fits your budget and skills"
      }
    `,
    
    validation: `
      ${contextSection}
      
      **ANALYSIS TYPE:** Niche Viability Validation
      
      Validate the viability of this niche idea. Provide response in JSON format:
      {
        "viabilityScore": "number from 1-10",
        "marketDemand": {
          "evidence": "concrete evidence of demand",
          "strength": "Low/Medium/High",
          "trends": ["demand trends"]
        },
        "competitionLevel": "Low/Medium/High",
        "skillFit": {
          "alignment": "how well your skills match niche needs",
          "score": "1-10",
          "gaps": ["skills you'd need to develop"]
        },
        "resourceRequirements": [
          {
            "category": "resource type",
            "requirement": "what's needed",
            "cost": "estimated cost range",
            "priority": "High/Medium/Low"
          }
        ],
        "timeToMarket": "estimated time to launch",
        "riskFactors": [
          {
            "risk": "potential risk",
            "probability": "Low/Medium/High",
            "impact": "Low/Medium/High",
            "mitigation": "how to address this risk"
          }
        ],
        "successFactors": ["critical factors for success"],
        "validationMethods": [
          {
            "method": "validation approach",
            "timeline": "how long this takes",
            "cost": "estimated cost"
          }
        ],
        "pivotOpportunities": ["related niches to consider"],
        "recommendation": "Go/No-Go/Modify",
        "reasoning": "detailed explanation of recommendation",
        "nextSteps": ["immediate actions to take"]
      }
    `,
    
    trends: `
      ${contextSection}
      
      **ANALYSIS TYPE:** Market Trends Analysis
      
      Analyze market trends affecting this niche. Provide response in JSON format:
      {
        "currentTrends": [
          {
            "trend": "trend name",
            "impact": "how it affects the niche",
            "timeline": "when this trend peaks",
            "relevance": "High/Medium/Low"
          }
        ],
        "emergingTrends": [
          {
            "trend": "emerging trend",
            "potential": "future impact potential",
            "timeframe": "when this becomes significant"
          }
        ],
        "technologyImpact": "how technology is changing this space",
        "consumerBehaviorShifts": ["changing customer behaviors"],
        "regulatoryChanges": ["relevant regulatory trends"],
        "economicFactors": ["economic conditions affecting the niche"],
        "seasonalPatterns": "seasonal trends and timing",
        "futurePredictions": ["predictions for next 2-3 years"],
        "opportunityWindows": ["best timing for market entry"],
        "threatIndicators": ["trends that could negatively impact the niche"]
      }
    `
  };

  return prompts[analysisType] || prompts.opportunity;
}

// ✅ UPDATED FALLBACK ANALYSIS FOR NEW STRUCTURE
function generateFallbackAnalysis(data: z.infer<typeof marketAnalysisSchema>) {
  const { niche, analysisType, budget, primaryObjective, marketType } = data;

  const budgetContext = {
    '<10k': { approach: 'lean startup', investment: 'minimal', timeline: '1-3 months' },
    '10k-50k': { approach: 'moderate investment', investment: 'moderate', timeline: '2-6 months' },
    '50k-250k': { approach: 'growth-focused', investment: 'substantial', timeline: '3-12 months' },
    '250k+': { approach: 'well-funded launch', investment: 'high', timeline: '6-18 months' }
  };

  const context = budgetContext[budget];

  const fallbacks = {
    competitive: {
      competitorCount: "25-100 depending on sub-niche definition",
      marketSaturation: "Medium",
      topCompetitors: [
        {
          name: "Established Industry Leaders",
          description: "Large companies with significant market share",
          strengths: ["Brand recognition", "Resources", "Market presence"],
          weaknesses: ["Slow to innovate", "Higher prices", "Less personal service"]
        },
        {
          name: "Specialized Boutique Firms",
          description: "Smaller companies with niche focus",
          strengths: ["Specialized expertise", "Personal service", "Agility"],
          weaknesses: ["Limited resources", "Smaller reach", "Capacity constraints"]
        }
      ],
      competitiveAdvantages: ["Unique skill combination", "Personal approach", "Cost efficiency", "Modern technology adoption"],
      barrierToEntry: context.investment === 'minimal' ? "Low" : context.investment === 'moderate' ? "Medium" : "Medium-High",
      differentiationOpportunities: ["Technology integration", "Niche specialization", "Superior customer experience", "Value-based pricing"],
      marketGaps: ["Underserved customer segments", "Geographic gaps", "Service quality gaps"],
      threatLevel: "Medium",
      competitiveStrategy: `${context.approach} with focus on differentiation`,
      timeToMarket: context.timeline,
      recommendations: [
        "Focus on unique value proposition",
        "Leverage your specific skill set",
        "Build strong customer relationships",
        "Consider strategic partnerships"
      ]
    },

    opportunity: {
      marketSize: budget === '<10k' ? "$100M - $500M" : budget === '250k+' ? "$1B - $10B" : "$500M - $2B",
      growthRate: primaryObjective === 'equity-exit' ? "15-25% annually" : "8-15% annually",
      demandLevel: "Medium to High",
      seasonality: "Relatively stable with some seasonal variations",
      targetCustomers: [
        {
          segment: marketType === 'b2b-saas' ? "Growing SaaS companies" : marketType === 'b2c-consumer' ? "Digital-savvy consumers" : "Professional service seekers",
          size: "Large and growing",
          painPoints: ["Cost efficiency", "Time constraints", "Quality concerns", "Lack of expertise"],
          willingnessToPay: budget === '<10k' ? "$100-$1000" : budget === '250k+' ? "$5000-$50000" : "$1000-$10000"
        }
      ],
      revenueStreams: [
        {
          model: primaryObjective === 'saas' ? "Subscription" : primaryObjective === 'agency' ? "Service fees" : "Project-based",
          potential: "High",
          timeframe: context.timeline
        }
      ],
      scalabilityFactor: primaryObjective === 'lifestyle' ? "Medium" : "High",
      marketTrends: ["Digital transformation", "Remote work adoption", "Automation demand", "Personalization expectations"],
      opportunityScore: 7,
      quickWins: ["Leverage existing network", "Start with core service", "Build reputation", "Focus on quality delivery"],
      longTermPotential: "Strong growth potential with proper execution and market positioning",
      resourceAlignment: `Good fit for ${budget} budget with ${context.approach} approach`
    },

    validation: {
      viabilityScore: 7,
      marketDemand: {
        evidence: "Growing market with demonstrated need",
        strength: "Medium to High",
        trends: ["Increasing market demand", "Technology adoption", "Service quality focus"]
      },
      competitionLevel: "Medium",
      skillFit: {
        alignment: "Good alignment with provided skills",
        score: 7,
        gaps: ["Market-specific knowledge", "Customer acquisition", "Operations scaling"]
      },
      resourceRequirements: [
        {
          category: "Technology",
          requirement: "Basic tools and platforms",
          cost: context.investment === 'minimal' ? "$100-$500" : "$1000-$5000",
          priority: "High"
        },
        {
          category: "Marketing",
          requirement: "Brand building and customer acquisition",
          cost: context.investment === 'minimal' ? "$500-$2000" : "$2000-$10000",
          priority: "High"
        }
      ],
      timeToMarket: context.timeline,
      riskFactors: [
        {
          risk: "Market competition",
          probability: "Medium",
          impact: "Medium",
          mitigation: "Focus on differentiation and unique value"
        },
        {
          risk: "Customer acquisition challenges",
          probability: "Medium",
          impact: "High",
          mitigation: "Leverage network and build referral system"
        }
      ],
      successFactors: ["Quality service delivery", "Strong customer relationships", "Effective marketing", "Operational efficiency"],
      validationMethods: [
        {
          method: "Customer interviews",
          timeline: "2-4 weeks",
          cost: "$0-$500"
        },
        {
          method: "MVP testing",
          timeline: "4-8 weeks",
          cost: "$500-$2000"
        }
      ],
      pivotOpportunities: ["Adjacent market segments", "Complementary services", "Different customer sizes"],
      recommendation: "Go",
      reasoning: `Solid foundation with manageable risks and clear path to market. Budget of ${budget} is appropriate for ${context.approach}.`,
      nextSteps: [
        "Validate specific customer segment",
        "Develop minimum viable service",
        "Test pricing and positioning",
        "Build initial customer base"
      ]
    },

    trends: {
      currentTrends: [
        {
          trend: "Digital transformation acceleration",
          impact: "Increases demand for digital solutions and expertise",
          timeline: "Peak over next 2-3 years",
          relevance: "High"
        },
        {
          trend: "Remote work normalization",
          impact: "Changes how services are delivered and consumed",
          timeline: "Ongoing",
          relevance: "High"
        }
      ],
      emergingTrends: [
        {
          trend: "AI integration in business processes",
          potential: "High impact on service delivery and efficiency",
          timeframe: "1-3 years"
        }
      ],
      technologyImpact: "Technology is enabling new service delivery models and efficiency gains",
      consumerBehaviorShifts: ["Preference for digital-first experiences", "Value-based purchasing decisions", "Demand for personalized solutions"],
      regulatoryChanges: ["Data privacy regulations", "Remote work policies", "Industry-specific compliance"],
      economicFactors: ["Economic uncertainty driving cost-consciousness", "Investment in efficiency solutions"],
      seasonalPatterns: "Generally stable with some Q4 budget cycles",
      futurePredictions: ["Continued digitalization", "Increased focus on sustainability", "Greater emphasis on value delivery"],
      opportunityWindows: ["Q1 budget planning", "Post-economic recovery", "Technology adoption cycles"],
      threatIndicators: ["Economic downturns", "Regulatory changes", "Technology disruption"]
    }
  };

  return fallbacks[analysisType] || fallbacks.opportunity;
}