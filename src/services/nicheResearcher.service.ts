// services/nicheResearcher.service.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { NicheResearchInput, GeneratedNicheReport , NicheReportMetadata } from '@/types/nicheResearcher';
import { Redis } from '@upstash/redis';

export class NicheResearcherService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  async generateNicheReport(input: NicheResearchInput): Promise<GeneratedNicheReport> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(input);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    // Build comprehensive analysis prompt
    const prompt = this.buildNicheAnalysisPrompt(input);
    
    // Generate report using AI
    const response = await this.openRouterClient.complete({
      model: 'anthropic/claude-3-sonnet',
      messages: [
        {
          role: 'system',
          content: `You are an expert business consultant and market researcher specializing in niche identification and opportunity analysis. Generate comprehensive, data-driven niche research reports that are practical, actionable, and tailored to the individual's unique background and constraints.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const parsedReport = this.parseNicheReportResponse(response.content, input);
    
    const nicheReport: GeneratedNicheReport = {
      ...parsedReport,
      tokensUsed: response.usage.total_tokens,
      generationTime: Date.now() - startTime
    };

    // Cache for 4 hours
    await this.redis.set(cacheKey, JSON.stringify(nicheReport), { ex: 14400 });
    
    return nicheReport;
  }

  private buildNicheAnalysisPrompt(input: NicheResearchInput): string {
    return `
    NICHE RESEARCH & OPPORTUNITY ANALYSIS REQUEST

    PROFESSIONAL BACKGROUND:
    - Past Roles & Industries: ${input.roles}
    - Core Skills: ${input.skills.join(', ')}
    - Unique Competencies: ${input.competencies}

    PERSONAL PROFILE:
    - Interests & Passions: ${input.interests}
    - Strategic Network: ${input.connections}
    - Audience Access: ${input.audienceAccess || 'Not specified'}

    MARKET INSIGHTS:
    - Observed Problems: ${input.problems}
    - Emerging Trends of Interest: ${input.trends}

    CONSTRAINTS & RESOURCES:
    - Time Available: ${input.time} hours per week
    - Startup Budget: ${input.budget}
    - Location Preference: ${input.location}
    - Other Constraints: ${input.otherConstraints || 'None specified'}

    DELIVERABLE REQUIREMENTS:
    Generate a comprehensive niche research report in JSON format with the following structure:

    {
      "executiveSummary": "2-3 paragraph overview of the analysis and key recommendations",
      "recommendedNiches": [
        {
          "name": "Specific niche name",
          "matchScore": number_0_to_100,
          "category": "industry category",
          "reasons": ["specific reason why this fits the person"],
          "marketSize": "market size with growth rate",
          "growthRate": "annual growth percentage",
          "competition": {
            "level": "Low/Moderate/High",
            "score": number_1_to_5,
            "description": "competitive landscape description"
          },
          "resourcesNeeded": ["specific resources required"],
          "startupCosts": {
            "min": minimum_cost_number,
            "max": maximum_cost_number,
            "breakdown": [
              {
                "category": "cost category",
                "amount": cost_number,
                "description": "what this covers"
              }
            ]
          },
          "timeToMarket": "estimated time to launch",
          "skillsRequired": ["skills needed"],
          "networkLeverage": ["how to use existing network"],
          "riskFactors": ["potential risks"],
          "monetizationModels": ["revenue strategies"],
          "targetCustomers": ["ideal customer segments"],
          "keyMetrics": ["important metrics to track"],
          "nextSteps": ["immediate actionable steps"]
        }
      ],
      "marketAnalysis": {
        "trends": [
          {
            "trend": "market trend",
            "relevance": "High/Medium/Low",
            "impact": "how it affects opportunities",
            "timeline": "when this trend peaks"
          }
        ],
        "gaps": [
          {
            "gap": "market gap",
            "severity": "High/Medium/Low",
            "opportunity": "how to capitalize"
          }
        ],
        "competitorLandscape": {
          "overview": "overall competitive situation",
          "keyPlayers": ["main competitors"],
          "barriers": ["barriers to entry"],
          "advantages": ["competitive advantages possible"]
        }
      },
      "personalFit": {
        "strengths": ["person's key strengths for these niches"],
        "skillGaps": ["areas needing development"],
        "networkAdvantages": ["network-based advantages"],
        "constraintImpacts": [
          {
            "constraint": "specific constraint",
            "impact": "how it affects success",
            "mitigation": "how to work around it"
          }
        ],
        "confidenceScore": confidence_0_to_100,
        "developmentAreas": ["skills/areas to focus on developing"]
      },
      "actionPlan": {
        "immediateSteps": ["actions to take this week"],
        "shortTerm": [
          {
            "action": "specific action",
            "timeline": "when to complete",
            "resources": ["what's needed"]
          }
        ],
        "longTerm": [
          {
            "goal": "long-term objective",
            "timeline": "target completion",
            "milestones": ["key milestones"]
          }
        ]
      },
      "riskAssessment": [
        {
          "risk": "potential risk",
          "probability": "High/Medium/Low",
          "impact": "High/Medium/Low",
          "mitigation": "how to address"
        }
      ],
      "financialProjections": [
        {
          "niche": "niche name",
          "timeline": "projection period",
          "revenue": {
            "conservative": conservative_estimate,
            "optimistic": optimistic_estimate,
            "realistic": realistic_estimate
          },
          "costs": estimated_costs,
          "profitability": net_profit_estimate
        }
      ]
    }

    ANALYSIS REQUIREMENTS:
    1. Identify 2-3 highly personalized niche opportunities that align with their background
    2. Consider their constraints (time, budget, location) in recommendations
    3. Leverage their existing skills and network advantages
    4. Provide realistic market analysis with current industry data
    5. Include specific, actionable next steps
    6. Address their observed problems and trend interests
    7. Match recommendations to their available resources and time commitment
    8. Provide financial projections based on their budget category

    Focus on practical, achievable opportunities that build on their existing strengths while addressing real market needs.
    `;
  }

  private parseNicheReportResponse(content: string, input: NicheResearchInput): Omit<GeneratedNicheReport, 'tokensUsed' | 'generationTime'> {
    try {
      // Try to parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, generating fallback report');
    }

    // Fallback to structured parsing if JSON fails
    return this.generateFallbackReport(input);
  }

  private generateFallbackReport(input: NicheResearchInput): Omit<GeneratedNicheReport, 'tokensUsed' | 'generationTime'> {
    const budgetMap = {
      '0-1k': { min: 0, max: 1000 },
      '1k-5k': { min: 1000, max: 5000 },
      '5k-10k': { min: 5000, max: 10000 },
      '10k+': { min: 10000, max: 50000 }
    };

    const budget = budgetMap[input.budget];

    return {
      executiveSummary: `Based on your background in ${input.skills.join(', ')} and interests in ${input.interests}, we've identified several niche opportunities that align with your constraints of ${input.time} hours per week and ${input.budget} budget. These recommendations leverage your existing network and skills while addressing market gaps you've observed.`,
      
      recommendedNiches: [
        {
          name: `${input.skills[0]} Consulting for Small Businesses`,
          matchScore: 88,
          category: 'Professional Services',
          reasons: [
            `Leverages your expertise in ${input.skills[0]}`,
            'Low startup costs align with your budget',
            'Can start part-time with your time constraints',
            'Your network provides initial client opportunities'
          ],
          marketSize: '$85B growing at 7% annually',
          growthRate: '7%',
          competition: {
            level: 'Moderate',
            score: 3,
            description: 'Competitive but room for specialized expertise'
          },
          resourcesNeeded: ['Professional website', 'Basic marketing materials', 'Client management system'],
          startupCosts: {
            min: budget.min,
            max: Math.min(budget.max, budget.min + 2000),
            breakdown: [
              { category: 'Website & Branding', amount: 800, description: 'Professional online presence' },
              { category: 'Marketing & Networking', amount: 500, description: 'Initial client acquisition' },
              { category: 'Tools & Software', amount: 300, description: 'CRM and productivity tools' }
            ]
          },
          timeToMarket: '4-6 weeks',
          skillsRequired: [input.skills[0], 'Client communication', 'Business development'],
          networkLeverage: ['Reach out to professional contacts', 'Join industry associations', 'Leverage LinkedIn connections'],
          riskFactors: ['Client acquisition challenges', 'Market saturation', 'Economic downturns affecting small business spending'],
          monetizationModels: ['Hourly consulting', 'Project-based fees', 'Retainer agreements', 'Training workshops'],
          targetCustomers: ['Small businesses (10-50 employees)', 'Startups needing expertise', 'Growing companies'],
          keyMetrics: ['Client acquisition cost', 'Average project value', 'Client retention rate', 'Referral rate'],
          nextSteps: [
            'Define your specific consulting niche',
            'Create a simple landing page',
            'Reach out to 5 contacts this week',
            'Develop a service package structure'
          ]
        },
        {
          name: `${input.interests.split(',')[0]?.trim()} Content & Education`,
          matchScore: 82,
          category: 'Digital Content',
          reasons: [
            'Aligns with your personal interests',
            'Can leverage your professional background',
            'Scalable with time constraints',
            'Growing market demand'
          ],
          marketSize: '$366B growing at 12% annually',
          growthRate: '12%',
          competition: {
            level: 'High',
            score: 4,
            description: 'Crowded but opportunities for unique angles'
          },
          resourcesNeeded: ['Content creation tools', 'Platform subscriptions', 'Recording equipment'],
          startupCosts: {
            min: Math.max(budget.min, 200),
            max: Math.min(budget.max, 3000),
            breakdown: [
              { category: 'Content Tools', amount: 600, description: 'Software and equipment' },
              { category: 'Platform Costs', amount: 400, description: 'Hosting and marketing platforms' },
              { category: 'Initial Marketing', amount: 500, description: 'Paid promotion and advertising' }
            ]
          },
          timeToMarket: '6-8 weeks',
          skillsRequired: ['Content creation', 'Marketing', 'Audience engagement'],
          networkLeverage: ['Share content with professional network', 'Collaborate with industry experts', 'Guest appearances'],
          riskFactors: ['Content saturation', 'Platform algorithm changes', 'Monetization challenges'],
          monetizationModels: ['Course sales', 'Affiliate marketing', 'Sponsorships', 'Consulting upsells'],
          targetCustomers: ['Professionals seeking skill development', 'Career changers', 'Industry newcomers'],
          keyMetrics: ['Content engagement rate', 'Subscriber growth', 'Conversion rate', 'Revenue per subscriber'],
          nextSteps: [
            'Choose your primary content platform',
            'Create content calendar for first month',
            'Produce 3 pieces of sample content',
            'Build email list landing page'
          ]
        }
      ],

      marketAnalysis: {
        trends: [
          {
            trend: 'Remote work acceleration',
            relevance: 'High',
            impact: 'Increased demand for digital services and consulting',
            timeline: 'Peak growth over next 2-3 years'
          },
          {
            trend: 'Small business digital transformation',
            relevance: 'High',
            impact: 'Growing need for expertise and guidance',
            timeline: 'Ongoing for next 5+ years'
          }
        ],
        gaps: [
          {
            gap: 'Affordable specialized expertise for small businesses',
            severity: 'High',
            opportunity: 'Position as accessible expert vs large consulting firms'
          },
          {
            gap: 'Practical, actionable education content',
            severity: 'Medium',
            opportunity: 'Focus on implementation over theory'
          }
        ],
        competitorLandscape: {
          overview: 'Fragmented market with opportunities for differentiation',
          keyPlayers: ['Large consulting firms', 'Independent consultants', 'Online course creators'],
          barriers: ['Building credibility', 'Client acquisition', 'Market noise'],
          advantages: ['Personal branding', 'Niche expertise', 'Network leverage']
        }
      },

      personalFit: {
        strengths: [`Deep ${input.skills[0]} knowledge`, 'Professional network', 'Industry experience'],
        skillGaps: ['Marketing and sales', 'Content creation', 'Business development'],
        networkAdvantages: ['Industry connections for referrals', 'Professional credibility', 'Market insights'],
        constraintImpacts: [
          {
            constraint: `${input.time} hours per week`,
            impact: 'Limits scaling speed but manageable for consulting',
            mitigation: 'Focus on high-value clients and systematic processes'
          },
          {
            constraint: `${input.budget} budget`,
            impact: 'Requires lean startup approach',
            mitigation: 'Bootstrap with minimal viable services first'
          }
        ],
        confidenceScore: 75,
        developmentAreas: ['Digital marketing', 'Sales processes', 'Content creation', 'Business operations']
      },

      actionPlan: {
        immediateSteps: [
          'Define your specific niche and ideal client',
          'Create a simple value proposition statement',
          'List 10 potential clients from your network',
          'Set up basic business structure and tracking'
        ],
        shortTerm: [
          {
            action: 'Launch minimal viable service offering',
            timeline: '2-4 weeks',
            resources: ['Time for outreach', 'Basic marketing materials', 'Service framework']
          },
          {
            action: 'Acquire first 3 clients',
            timeline: '4-8 weeks',
            resources: ['Network leverage', 'Referral process', 'Proposal templates']
          }
        ],
        longTerm: [
          {
            goal: 'Establish sustainable consulting practice',
            timeline: '6-12 months',
            milestones: ['10+ regular clients', 'Systematic processes', 'Referral engine']
          },
          {
            goal: 'Scale to desired income level',
            timeline: '12-18 months',
            milestones: ['Premium service tiers', 'Team support', 'Thought leadership']
          }
        ]
      },

      riskAssessment: [
        {
          risk: 'Slow client acquisition',
          probability: 'Medium',
          impact: 'High',
          mitigation: 'Leverage network actively and create referral incentives'
        },
        {
          risk: 'Time management challenges',
          probability: 'Medium',
          impact: 'Medium',
          mitigation: 'Set clear boundaries and systematic processes'
        },
        {
          risk: 'Market competition',
          probability: 'High',
          impact: 'Medium',
          mitigation: 'Focus on unique positioning and specialized expertise'
        }
      ],

      financialProjections: [
        {
          niche: `${input.skills[0]} Consulting`,
          timeline: '12 months',
          revenue: {
            conservative: budget.max * 3,
            optimistic: budget.max * 8,
            realistic: budget.max * 5
          },
          costs: budget.max,
          profitability: budget.max * 4
        }
      ]
    };
  }

  async saveNicheReport(userId: string, workspaceId: string, report: GeneratedNicheReport, input: NicheResearchInput): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `Niche Research Report - ${new Date().toLocaleDateString()}`,
          content: JSON.stringify(report),
          type: 'niche_research',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: {
            skills: input.skills,
            interests: input.interests,
            timeCommitment: input.time,
            budget: input.budget,
            location: input.location,
            generatedAt: new Date().toISOString(),
            tokensUsed: report.tokensUsed,
            generationTime: report.generationTime,
            topNiches: report.recommendedNiches.slice(0, 3).map(n => ({
              name: n.name,
              matchScore: n.matchScore,
              category: n.category
            }))
          },
          tags: ['niche-research', 'business-opportunity', ...input.skills.map(s => s.toLowerCase())]
        }
      });

      return deliverable.id;
    } catch (error) {
      console.error('Error saving niche report:', error);
      throw error;
    }
  }

  async getNicheReport(userId: string, reportId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.findFirst({
        where: {
          id: reportId,
          user_id: userId,
          type: 'niche_research'
        },
        include: {
          workspace: true
        }
      });

      if (!deliverable) {
        return null;
      }

      return {
        id: deliverable.id,
        title: deliverable.title,
        report: JSON.parse(deliverable.content),
        metadata: deliverable.metadata,
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        workspace: deliverable.workspace
      };
    } catch (error) {
      console.error('Error retrieving niche report:', error);
      throw error;
    }
  }

async getUserNicheReports(userId: string, workspaceId?: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const whereClause: any = {
      user_id: userId,
      type: 'niche_research'
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    const reports = await prisma.deliverable.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        workspace: true
      }
    });

    return reports.map(report => {
      const metadata = report.metadata as NicheReportMetadata; // Move inside the map function
      return {
        id: report.id,
        title: report.title,
        topNiches: metadata?.topNiches || [],
        skills: metadata?.skills || [],
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        workspace: report.workspace
      };
    });
  } catch (error) {
    console.error('Error fetching user niche reports:', error);
    return [];
  }
}

  private generateCacheKey(input: NicheResearchInput): string {
    const key = `niche_research:${input.skills.join('-')}:${input.interests}:${input.time}:${input.budget}`;
    return key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
  }
}