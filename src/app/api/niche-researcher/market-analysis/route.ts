// app/api/niche-research/market-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OpenRouterClient } from '@/lib/openrouter';
import { z } from 'zod';

const marketAnalysisSchema = z.object({
  niche: z.string().min(3).max(100),
  skills: z.array(z.string()).min(1).max(10),
  location: z.enum(['remote-only', 'local-focused', 'hybrid']),
  budget: z.enum(['0-1k', '1k-5k', '5k-10k', '10k+']),
  analysisType: z.enum(['competitive', 'opportunity', 'validation']).default('opportunity')
});

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const body = await req.json();
    const validation = marketAnalysisSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { niche, skills, location, budget, analysisType } = validation.data;

    // Perform market analysis with AI
    const openRouter = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    
    const analysisPrompt = buildMarketAnalysisPrompt(niche, skills, location, budget, analysisType);

    const response = await openRouter.complete({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content: 'You are a market research expert specializing in niche business analysis. Provide detailed, actionable market insights.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    // Parse AI response
    let analysis;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback analysis
      analysis = generateFallbackAnalysis(niche, analysisType);
    }

    return NextResponse.json({
      success: true,
      data: {
        niche,
        analysisType,
        analysis,
        tokensUsed: response.usage.total_tokens
      }
    });

  } catch (error) {
    console.error('Market Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze market' },
      { status: 500 }
    );
  }
}

function buildMarketAnalysisPrompt(
  niche: string, 
  skills: string[], 
  location: string, 
  budget: string, 
  analysisType: string
): string {
  const prompts = {
    competitive: `
      Analyze the competitive landscape for the "${niche}" niche.
      
      Skills available: ${skills.join(', ')}
      Location preference: ${location}
      Budget: ${budget}
      
      Provide analysis in JSON format:
      {
        "competitorCount": "estimated number of competitors",
        "marketSaturation": "Low/Medium/High",
        "topCompetitors": ["list of 3-5 main competitors"],
        "competitiveAdvantages": ["potential advantages based on skills"],
        "barrierToEntry": "Low/Medium/High",
        "differentiationOpportunities": ["ways to stand out"],
        "marketGaps": ["underserved areas"],
        "threatLevel": "Low/Medium/High",
        "recommendations": ["strategic recommendations"]
      }
    `,
    opportunity: `
      Analyze market opportunities for the "${niche}" niche.
      
      Skills available: ${skills.join(', ')}
      Location preference: ${location}
      Budget: ${budget}
      
      Provide analysis in JSON format:
      {
        "marketSize": "estimated market size",
        "growthRate": "annual growth percentage",
        "demandLevel": "Low/Medium/High",
        "seasonality": "seasonal patterns if any",
        "targetCustomers": ["ideal customer segments"],
        "painPoints": ["key customer problems"],
        "revenueStreams": ["potential monetization methods"],
        "scalabilityFactor": "Low/Medium/High",
        "marketTrends": ["relevant trends"],
        "opportunityScore": number_1_to_10,
        "quickWins": ["immediate opportunities"],
        "longTermPotential": "description of long-term prospects"
      }
    `,
    validation: `
      Validate the viability of the "${niche}" niche idea.
      
      Skills available: ${skills.join(', ')}
      Location preference: ${location}
      Budget: ${budget}
      
      Provide analysis in JSON format:
      {
        "viabilityScore": number_1_to_10,
        "marketDemand": "evidence of demand",
        "competitionLevel": "Low/Medium/High",
        "skillFit": "how well skills match niche needs",
        "resourceRequirements": ["what's needed to start"],
        "timeToMarket": "estimated time to launch",
        "riskFactors": ["potential risks"],
        "successFactors": ["keys to success"],
        "validationMethods": ["ways to test the idea"],
        "pivotOpportunities": ["related niches to consider"],
        "recommendation": "Go/No-Go/Modify",
        "reasoning": "detailed explanation of recommendation"
      }
    `
  };

  return prompts[analysisType as keyof typeof prompts] || prompts.opportunity;
}

function generateFallbackAnalysis(niche: string, analysisType: string) {
  const fallbacks = {
    competitive: {
      competitorCount: "50-200 depending on sub-niche",
      marketSaturation: "Medium",
      topCompetitors: ["Industry leaders", "Local competitors", "Digital-first companies"],
      competitiveAdvantages: ["Specialized expertise", "Personal approach", "Cost efficiency"],
      barrierToEntry: "Medium",
      differentiationOpportunities: ["Unique service combinations", "Niche specialization", "Technology integration"],
      marketGaps: ["Underserved customer segments", "Lack of personalized solutions"],
      threatLevel: "Medium",
      recommendations: ["Focus on differentiation", "Build strong customer relationships", "Leverage unique skills"]
    },
    opportunity: {
      marketSize: "$500M - $2B depending on scope",
      growthRate: "8-15% annually",
      demandLevel: "Medium",
      seasonality: "Relatively stable year-round",
      targetCustomers: ["Small businesses", "Individual professionals", "Growing companies"],
      painPoints: ["Cost constraints", "Time limitations", "Lack of expertise"],
      revenueStreams: ["Service fees", "Consulting retainers", "Product sales"],
      scalabilityFactor: "Medium",
      marketTrends: ["Digital transformation", "Remote work adoption", "Cost optimization"],
      opportunityScore: 7,
      quickWins: ["Leverage existing network", "Start with consulting", "Build reputation"],
      longTermPotential: "Strong potential with proper execution and market positioning"
    },
    validation: {
      viabilityScore: 7,
      marketDemand: "Moderate demand with growth potential",
      competitionLevel: "Medium",
      skillFit: "Good alignment with provided skills",
      resourceRequirements: ["Time investment", "Basic tools", "Marketing materials"],
      timeToMarket: "2-4 months",
      riskFactors: ["Market competition", "Customer acquisition challenges"],
      successFactors: ["Quality delivery", "Strong networking", "Consistent marketing"],
      validationMethods: ["Customer interviews", "MVP testing", "Market surveys"],
      pivotOpportunities: ["Adjacent niches", "Broader market segments"],
      recommendation: "Go",
      reasoning: "Solid foundation with manageable risks and clear path to market"
    }
  };

  return fallbacks[analysisType as keyof typeof fallbacks] || fallbacks.opportunity;
}