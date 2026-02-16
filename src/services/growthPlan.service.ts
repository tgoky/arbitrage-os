// services/growthPlan.service.ts - COMPLETE FIXED VERSION
import { OpenRouterClient } from '@/lib/openrouter';
import { Redis } from '@upstash/redis';
import { 
  GrowthPlanInput, 
  GeneratedGrowthPlan,
  SavedGrowthPlan,
  GrowthPlanSummary,
  GrowthPlanAnalytics,
  GrowthPlanMetadata,
  GrowthPlanServiceResponse
} from '@/types/growthPlan';

interface GrowthChannel {
  name: string;
  allocation: number;
  expectedROI: number;
  status: 'active' | 'planned' | 'testing';
}

interface ExpertiseStrategy {
  name: string;
  allocation: number;
  tactics: string[];
}

interface IndustryMetrics {
  revenuePerLead: number;
  conversionRate: number;
  baseCac: number;
  baseLtv: number;
}

interface BudgetBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

interface ImplementationPhase {
  name: string;
  duration: string;
  objectives: string[];
  deliverables: string[];
  resources: string[];
}


interface UpdateGrowthPlanOptions {
  regenerateStrategy?: boolean; // Only regenerate if explicitly requested
  preserveManualEdits?: boolean; // Don't overwrite manual edits
}

export class GrowthPlanService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

async generateGrowthPlan(input: GrowthPlanInput): Promise<GeneratedGrowthPlan> {
  const startTime = Date.now();
  
  // Check cache first - FIX: Handle different Redis return types
  const cacheKey = this.generateCacheKey(input);
  const cached = await this.redis.get(cacheKey);
  
  if (cached) {
    try {
      //   FIX: Handle both string and object returns from Redis
      if (typeof cached === 'string') {
        return JSON.parse(cached);
      } else if (typeof cached === 'object' && cached !== null) {
        // Redis sometimes returns parsed objects directly
        return cached as GeneratedGrowthPlan;
      }
    } catch (error) {
      console.warn('Failed to parse cached growth plan, regenerating:', error);
      // Continue to generation if cache is corrupted
    }
  }

  // Build comprehensive prompt
  const prompt = this.buildGrowthPlanPrompt(input);
  
  // Generate plan using AI
  const response = await this.openRouterClient.complete({
    model: 'openai/gpt-5-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert growth strategist and business consultant. Generate comprehensive, data-driven growth plans that are practical and actionable. Focus on measurable outcomes and realistic timelines.`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  const parsedPlan = this.parseGrowthPlanResponse(response.content, input);
  
  const growthPlan: GeneratedGrowthPlan = {
    ...parsedPlan,
    tokensUsed: response.usage.total_tokens,
    generationTime: Date.now() - startTime
  };

  // Cache for 2 hours - FIX: Always store as string
  try {
    await this.redis.set(cacheKey, JSON.stringify(growthPlan), { ex: 7200 });
  } catch (cacheError) {
    console.warn('Failed to cache growth plan:', cacheError);
    // Don't fail the request if caching fails
  }
  
  return growthPlan;
}
  // services/growthPlan.service.ts - FIXED buildGrowthPlanPrompt method

private buildGrowthPlanPrompt(input: GrowthPlanInput): string {
  // Calculate growth metrics for context
  const currentRev = input.currentRevenue || 50000;
  const targetRev = input.targetRevenue || currentRev * 2;
  const growthMultiple = targetRev / currentRev;
  const months = input.timeframe === '3m' ? 3 : input.timeframe === '6m' ? 6 : 12;
  const monthlyGrowthRate = Math.pow(growthMultiple, 1/months) - 1;
  const totalBudget = input.budget || Math.max(5000, currentRev * 0.15);

  return `
GROWTH PLAN GENERATION FOR ${input.clientCompany.toUpperCase()}

CLIENT PROFILE:
- Company: ${input.clientCompany}
- Industry: ${input.industry}
- Contact: ${input.contactName} (${input.contactRole})
- Current Monthly Revenue: $${currentRev.toLocaleString()}
- Target Monthly Revenue: $${targetRev.toLocaleString()}
- Growth Required: ${(monthlyGrowthRate * 100).toFixed(1)}% monthly growth
- Total Budget Available: $${totalBudget.toLocaleString()}
- Timeframe: ${months} months
- Team Size: ${input.teamSize || 'Not specified'}
- Business Model: ${input.businessModel || 'Not specified'}

CONSULTANT EXPERTISE:
- Consultant: ${input.name} from ${input.company}
- Core Specializations: ${input.expertise.join(', ')}
- Track Record: ${input.experience}

${input.caseStudies && input.caseStudies.length > 0 ? `
PROVEN SUCCESS STORIES:
${input.caseStudies.map(cs => `- ${cs.client}: ${cs.result}`).join('\n')}
` : ''}

${input.transcript ? `
KEY DISCOVERY INSIGHTS:
${input.transcript}
` : ''}

${input.focusAreas && input.focusAreas.length > 0 ? `
PRIMARY FOCUS AREAS: ${input.focusAreas.join(', ')}
` : ''}

${input.painPoints && input.painPoints.length > 0 ? `
CLIENT PAIN POINTS: ${input.painPoints.join(', ')}
` : ''}

${input.objectives && input.objectives.length > 0 ? `
CLIENT OBJECTIVES: ${input.objectives.join(', ')}
` : ''}

${input.currentChannels && input.currentChannels.length > 0 ? `
CURRENT MARKETING CHANNELS: ${input.currentChannels.join(', ')}
` : ''}

CRITICAL REQUIREMENTS:
1. Base ALL strategies on the consultant's specific expertise: ${input.expertise.join(', ')}
2. Create industry-specific tactics for ${input.industry}
3. Ensure budget allocations total exactly $${totalBudget.toLocaleString()}
4. Make growth targets realistic for ${(monthlyGrowthRate * 100).toFixed(1)}% monthly growth
5. Focus on the consultant's proven specializations, NOT generic lead generation

DELIVERABLE: Generate a comprehensive JSON growth plan with this EXACT structure:

{
  "executiveSummary": "2-3 paragraph summary highlighting how [consultant's expertise] will drive [specific growth outcomes] for [client company] in [industry]. Focus on the unique value proposition and expected outcomes.",
  
  "strategy": {
    "stages": [
      {
        "title": "Stage name reflecting consultant's expertise",
        "duration": "specific timeframe",
        "tasks": ["specific tasks using consultant's skills", "industry-relevant activities", "measurable actions"],
        "kpis": ["specific measurable outcomes", "industry benchmarks"],
        "budget": exact_dollar_amount_from_total_budget
      }
      // 3-4 stages that add up to full budget
    ],
    "priorities": [
      {
        "area": "priority area matching consultant expertise",
        "impact": "high/medium/low",
        "effort": "high/medium/low",
        "timeline": "when to implement based on expertise"
      }
      // 4-6 priorities focusing on consultant's strengths
    ],
    "recommendations": [
      "specific recommendations using consultant's expertise",
      "industry-specific growth tactics",
      "actionable strategies based on proven experience"
    ],
    "risks": [
      {
        "risk": "realistic risk for this industry/approach",
        "mitigation": "how consultant's expertise addresses this",
        "probability": "high/medium/low"
      }
    ]
  },
  
  "metrics": {
    "timeline": [
      {
        "month": "Month 1",
        "leads": realistic_number_based_on_industry,
        "revenue": current_revenue_plus_growth,
        "customers": realistic_customer_number,
        "cac": industry_appropriate_cac,
        "ltv": industry_appropriate_ltv
      }
      // Continue for full timeframe with realistic progression
    ],
    "kpis": [
      {
        "name": "KPI relevant to consultant expertise",
        "current": current_value,
        "target": realistic_target,
        "improvement": percentage_improvement
      }
      // 4-6 KPIs specific to the consultant's specializations
    ],
    "channels": [
      {
        "name": "channel from consultant's expertise",
        "allocation": percentage_of_budget,
        "expectedROI": realistic_roi_for_consultant_specialty,
        "status": "active/planned/testing"
      }
      // Only channels the consultant actually specializes in
    ]
  },
  
  "implementation": {
    "phases": [
      {
        "name": "Phase name reflecting consultant approach",
        "duration": "realistic timeframe",
        "objectives": ["objectives matching consultant expertise"],
        "deliverables": ["specific deliverables consultant can provide"],
        "resources": ["resources needed for consultant's approach"]
      }
    ],
    "timeline": "${months}-month implementation leveraging [consultant's expertise]",
    "budget": {
      "total": ${totalBudget},
      "breakdown": [
        {
          "category": "category relevant to consultant expertise",
          "amount": dollar_amount,
          "percentage": percentage_of_total
        }
        // Breakdown must total exactly $${totalBudget.toLocaleString()}
      ]
    }
  },
  
  "nextSteps": [
    "immediate step 1 using consultant's expertise",
    "step 2 specific to the industry and approach",
    "step 3 that leverages proven experience",
    "step 4 with clear timeline and ownership"
  ]
}

INDUSTRY-SPECIFIC CONTEXT FOR ${input.industry}:
${this.getIndustryContext(input.industry)}

CONSULTANT SPECIALIZATION CONTEXT:
${this.getExpertiseContext(input.expertise)}

Remember: This plan must reflect the consultant's actual expertise (${input.expertise.join(', ')}) and create realistic, industry-appropriate strategies for ${input.industry}. Avoid generic "lead generation" advice unless that's specifically the consultant's expertise.
`;
}

// Add these new helper methods to the GrowthPlanService class:

private getIndustryContext(industry: string): string {
  const contexts: Record<string, string> = {
    'SaaS': 'Focus on MRR growth, churn reduction, product-led growth, freemium conversions, and expansion revenue. Typical metrics: 5-15% monthly churn, $100-500 CAC, 3:1+ LTV:CAC ratio.',
    'E-commerce': 'Emphasize conversion rate optimization, average order value, customer lifetime value, and seasonal trends. Typical metrics: 2-4% conversion rates, $25-100 CAC, strong repeat purchase rates.',
    'Healthcare': 'Prioritize compliance, trust-building, referral programs, and education-based marketing. Longer sales cycles and higher trust requirements.',
    'Finance': 'Focus on trust, compliance, thought leadership, and relationship-based sales. High-value customers with longer sales cycles.',
    'Education': 'Emphasize content marketing, community building, student success stories, and institutional partnerships.',
    'Manufacturing': 'B2B focused with trade shows, industry publications, technical content, and relationship-based sales.',
    'Real Estate': 'Local market focus, referral systems, community presence, and relationship-based marketing.',
    'Consulting': 'Thought leadership, case studies, networking, speaking engagements, and referral systems.'
  };
  
  return contexts[industry] || `Industry-specific growth strategies for ${industry} with focus on relationship-building and value demonstration.`;
}

private getExpertiseContext(expertise: string[]): string {
  const expertiseMap: Record<string, string> = {
    'SEO': 'Organic search optimization, content strategy, technical SEO, keyword research, and long-term traffic growth.',
    'PPC': 'Paid advertising optimization, conversion tracking, A/B testing, and ROI-focused campaign management.',
    'Content Marketing': 'Educational content creation, thought leadership, blog strategy, and audience engagement.',
    'Social Media': 'Platform-specific strategies, community building, influencer partnerships, and social commerce.',
    'Email Marketing': 'List building, automation sequences, segmentation, and lifecycle marketing.',
    'Sales Funnels': 'Conversion optimization, lead nurturing, funnel analysis, and customer journey mapping.',
    'Cold Email': 'Outbound prospecting, personalization strategies, deliverability optimization, and response rate improvement.',
    'Web Design': 'User experience optimization, conversion-focused design, mobile optimization, and landing page creation.',
    'Marketing Automation': 'Workflow setup, lead scoring, behavioral triggers, and customer lifecycle automation.',
    'Analytics': 'Data tracking, performance measurement, conversion attribution, and ROI analysis.'
  };
  
  return expertise.map(exp => {
    const key = Object.keys(expertiseMap).find(k => 
      exp.toLowerCase().includes(k.toLowerCase()) || 
      k.toLowerCase().includes(exp.toLowerCase())
    );
    return expertiseMap[key || ''] || `${exp} specialization strategies`;
  }).join(' ');
}

 private parseGrowthPlanResponse(content: string, input: GrowthPlanInput) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      //   Validate required structure
      if (!this.validateParsedPlan(parsed)) {
        throw new Error('Invalid plan structure');
      }
      
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse JSON response:', error);
  }
  return this.generateFallbackPlan(input);
}


private validateParsedPlan(plan: any): boolean {
  return !!(
    plan.executiveSummary &&
    plan.strategy &&
    plan.metrics &&
    plan.implementation &&
    Array.isArray(plan.nextSteps)
  );
}

  // services/growthPlan.service.ts - FIXED generateFallbackPlan method

private generateFallbackPlan(input: GrowthPlanInput): Omit<GeneratedGrowthPlan, 'tokensUsed' | 'generationTime'> {
  const months = input.timeframe === '3m' ? 3 : input.timeframe === '6m' ? 6 : 12;
  const currentRevenue = input.currentRevenue || 50000;
  const targetRevenue = input.targetRevenue || currentRevenue * 2;
  const totalBudget = input.budget || Math.max(5000, currentRevenue * 0.15);
  const growthMultiple = targetRevenue / currentRevenue;
  const monthlyGrowthRate = Math.pow(growthMultiple, 1/months) - 1;

  // Generate expertise-specific strategies
  const expertiseStrategies = this.generateExpertiseStrategies(input.expertise, totalBudget);
  const industryMetrics = this.getIndustryMetrics(input.industry, currentRevenue);

  return {
    executiveSummary: `Strategic ${months}-month growth plan for ${input.clientCompany} leveraging ${input.name}'s expertise in ${input.expertise.join(', ')}. This plan targets ${((growthMultiple - 1) * 100).toFixed(0)}% revenue growth in the ${input.industry} sector through proven methodologies and industry-specific tactics. Based on ${input.name}'s track record and ${input.clientCompany}'s current position, we project reaching $${targetRevenue.toLocaleString()} monthly revenue through focused execution of ${input.expertise.length} core growth strategies.`,
    
    strategy: {
      stages: this.generateExpertiseStages(input, totalBudget, months),
      priorities: this.generateExpertisePriorities(input.expertise, input.industry),
      recommendations: this.generateExpertiseRecommendations(input),
      risks: this.generateIndustryRisks(input.industry, input.expertise)
    },

    metrics: {
      timeline: this.generateRealisticTimeline(currentRevenue, targetRevenue, months, industryMetrics),
      kpis: this.generateExpertiseKPIs(input.expertise, currentRevenue, targetRevenue),
      channels: this.generateExpertiseChannels(input.expertise, totalBudget)
    },

    implementation: {
      phases: this.generateImplementationPhases(input, totalBudget),
      timeline: `${months}-month implementation focused on ${input.expertise.join(', ')} with quarterly milestone reviews`,
      budget: {
        total: totalBudget,
        breakdown: this.generateExpertiseBudgetBreakdown(input.expertise, totalBudget)
      }
    },

    nextSteps: this.generateExpertiseNextSteps(input)
  };
}

// Helper methods for expertise-specific generation
private generateExpertiseStrategies(expertise: string[], budget: number): ExpertiseStrategy[] {
  const strategies: ExpertiseStrategy[] = expertise.map(exp => {
    const allocation = Math.floor(budget / expertise.length);
    
    switch (exp.toLowerCase()) {
      case 'seo':
        return {
          name: 'SEO & Organic Growth',
          allocation,
          tactics: ['Technical SEO audit', 'Content optimization', 'Link building campaign']
        };
      case 'ppc':
        return {
          name: 'Paid Advertising Optimization',
          allocation,
          tactics: ['Campaign restructuring', 'Ad copy testing', 'Landing page optimization']
        };
      case 'email marketing':
        return {
          name: 'Email Marketing Automation',
          allocation,
          tactics: ['List segmentation', 'Drip campaigns', 'Behavioral triggers']
        };
      default:
        return {
          name: `${exp} Strategy`,
          allocation,
          tactics: [`${exp} audit`, `${exp} optimization`, `${exp} scaling`]
        };
    }
  });
  
  return strategies;
}


private generateExpertiseStages(input: GrowthPlanInput, totalBudget: number, months: number): any[] {
  const stageCount = Math.min(3, months);
  const budgetPerStage = Math.floor(totalBudget / stageCount);
  
  const stages = [];
  
  // Foundation stage
  stages.push({
    title: `Foundation & ${input.expertise[0]} Setup`,
    duration: stageCount === 3 ? '4-6 weeks' : '2-3 weeks',
    tasks: [
      `Audit current ${input.expertise[0]} performance`,
      `Implement ${input.expertise.join(' & ')} tracking`,
      'Establish baseline metrics and KPIs',
      `Set up ${input.industry}-specific processes`
    ],
    kpis: ['Baseline metrics established', 'Tracking infrastructure live', 'Initial optimization opportunities identified'],
    budget: budgetPerStage
  });
  
  // Growth stage
  stages.push({
    title: `${input.expertise.join(' & ')} Acceleration`,
    duration: stageCount === 3 ? `${Math.floor(months/2)} months` : `${Math.floor(months*0.6)} months`,
    tasks: [
      `Launch primary ${input.expertise[0]} initiatives`,
      `Scale ${input.expertise.slice(1).join(' and ')} efforts`,
      'Optimize conversion funnels',
      `Implement ${input.industry}-specific best practices`
    ],
    kpis: [
      `${input.expertise[0]} performance improvement`,
      'Revenue growth acceleration',
      'Customer acquisition increase'
    ],
    budget: budgetPerStage
  });
  
  // Optimization stage (if 3+ months)
  if (stageCount === 3) {
    stages.push({
      title: 'Optimization & Scale',
      duration: `${Math.floor(months/3)} months`,
      tasks: [
        `Refine top-performing ${input.expertise.join(' and ')} channels`,
        'Automate successful processes',
        'Expand to secondary opportunities',
        'Implement advanced analytics'
      ],
      kpis: ['Target revenue achieved', 'Sustainable growth rate', 'Process automation complete'],
      budget: totalBudget - (budgetPerStage * 2) // Remainder
    });
  }
  
  return stages;
}

private generateExpertisePriorities(expertise: string[], industry: string): any[] {
  return expertise.slice(0, 4).map((exp, index) => ({
    area: `${exp} for ${industry}`,
    impact: index < 2 ? 'high' : 'medium',
    effort: index === 0 ? 'high' : 'medium',
    timeline: `Month ${index + 1}-${index + 2}`
  }));
}

private generateExpertiseRecommendations(input: GrowthPlanInput): string[] {
  const recs = [
    `Leverage ${input.name}'s proven expertise in ${input.expertise[0]} for immediate impact`,
    `Focus on ${input.industry}-specific applications of ${input.expertise.join(' and ')}`,
    `Implement ${input.expertise.length > 1 ? 'multi-channel' : 'focused'} approach based on consultant strengths`
  ];
  
  if (input.caseStudies && input.caseStudies.length > 0) {
    recs.push(`Apply proven methodologies from ${input.caseStudies.length} documented case studies`);
  }
  
  if (input.focusAreas && input.focusAreas.length > 0) {
    recs.push(`Prioritize ${input.focusAreas.join(' and ')} as defined focus areas`);
  }
  
  return recs;
}

private generateIndustryRisks(industry: string, expertise: string[]): any[] {
  const industryRisks: Record<string, any[]> = {
    'SaaS': [
      { risk: 'High customer churn during scaling', mitigation: 'Implement retention-focused onboarding', probability: 'medium' },
      { risk: 'Competitive market saturation', mitigation: 'Differentiate through specialized targeting', probability: 'medium' }
    ],
    'E-commerce': [
      { risk: 'Seasonal revenue fluctuations', mitigation: 'Diversify product mix and target markets', probability: 'high' },
      { risk: 'Platform dependency risks', mitigation: 'Build direct customer relationships', probability: 'medium' }
    ],
    'Healthcare': [
      { risk: 'Regulatory compliance challenges', mitigation: 'Partner with compliance specialists', probability: 'medium' },
      { risk: 'Long sales cycles', mitigation: 'Focus on education and trust-building', probability: 'high' }
    ]
  };
  
  return industryRisks[industry] || [
    { risk: 'Market competition increase', mitigation: `Leverage ${expertise[0]} specialization`, probability: 'medium' },
    { risk: 'Budget allocation inefficiency', mitigation: 'Phased implementation with performance tracking', probability: 'low' }
  ];
}

private generateRealisticTimeline(currentRev: number, targetRev: number, months: number, industryMetrics: any): any[] {
  const timeline = [];
  const monthlyGrowthRate = Math.pow(targetRev / currentRev, 1/months) - 1;
  
  for (let i = 0; i < months; i++) {
    const revenue = Math.round(currentRev * Math.pow(1 + monthlyGrowthRate, i + 1));
    const leads = Math.round(revenue / industryMetrics.revenuePerLead);
    const customers = Math.round(leads * industryMetrics.conversionRate);
    
    timeline.push({
      month: `Month ${i + 1}`,
      leads,
      revenue,
      customers,
      cac: Math.round(industryMetrics.baseCac * (1 - i * 0.05)), // Improving CAC
      ltv: Math.round(industryMetrics.baseLtv * (1 + i * 0.03)) // Improving LTV
    });
  }
  
  return timeline;
}

private generateExpertiseKPIs(expertise: string[], currentRev: number, targetRev: number): any[] {
  const kpis = [
    {
      name: 'Monthly Revenue',
      current: currentRev,
      target: targetRev,
      improvement: Math.round(((targetRev / currentRev) - 1) * 100)
    }
  ];
  
  expertise.slice(0, 3).forEach(exp => {
    switch (exp.toLowerCase()) {
      case 'seo':
        kpis.push({
          name: 'Organic Traffic',
          current: 5000,
          target: 25000,
          improvement: 400
        });
        break;
      case 'ppc':
        kpis.push({
          name: 'ROAS (Return on Ad Spend)',
          current: 3.0,
          target: 5.0,
          improvement: 67
        });
        break;
      case 'email marketing':
        kpis.push({
          name: 'Email Revenue Attribution',
          current: 15,
          target: 30,
          improvement: 100
        });
        break;
      default:
        kpis.push({
          name: `${exp} Performance Score`,
          current: 65,
          target: 90,
          improvement: 38
        });
    }
  });
  
  return kpis;
}

private generateExpertiseChannels(expertise: string[], totalBudget: number): GrowthChannel[] {
  const channels: GrowthChannel[] = [];
  const allocation = Math.floor(100 / expertise.length);
  
  expertise.forEach((exp, index) => {
    let channelName: string;
    let expectedROI: number;
    let status: 'active' | 'planned' | 'testing';
    
    switch (exp.toLowerCase()) {
      case 'seo':
        channelName = 'Organic Search';
        expectedROI = 400;
        status = 'active';
        break;
      case 'ppc':
        channelName = 'Paid Advertising';
        expectedROI = 250;
        status = 'active';
        break;
      case 'email marketing':
        channelName = 'Email Marketing';
        expectedROI = 500;
        status = 'active';
        break;
      case 'social media':
        channelName = 'Social Media';
        expectedROI = 300;
        status = 'planned';
        break;
      default:
        channelName = exp;
        expectedROI = 350;
        status = index === 0 ? 'active' : 'planned';
    }
    
    channels.push({
      name: channelName,
      allocation: index === expertise.length - 1 ? 100 - (allocation * (expertise.length - 1)) : allocation,
      expectedROI,
      status
    });
  });
  
  return channels;
}

private generateImplementationPhases(input: GrowthPlanInput, totalBudget: number): ImplementationPhase[] {
  const months = input.timeframe === '3m' ? 3 : input.timeframe === '6m' ? 6 : 12;
  const phaseCount = Math.min(3, Math.ceil(months / 2));
  
  return Array.from({ length: phaseCount }, (_, i): ImplementationPhase => ({
    name: `Phase ${i + 1}: ${this.getPhaseNames(input.expertise)[i] || 'Optimization'}`,
    duration: `${Math.ceil(months / phaseCount)} months`,
    objectives: this.getPhaseObjectives(input.expertise, i),
    deliverables: this.getPhaseDeliverables(input.expertise, i),
    resources: this.getPhaseResources(input.expertise, i, totalBudget, phaseCount)
  }));
}

private generateExpertiseBudgetBreakdown(expertise: string[], totalBudget: number): BudgetBreakdownItem[] {
  const breakdown: BudgetBreakdownItem[] = [];
  const mainAllocation = Math.floor(totalBudget * 0.6);
  const remainingBudget = totalBudget - mainAllocation;
  
  // Primary expertise gets largest allocation
  breakdown.push({
    category: `${expertise[0]} Implementation`,
    amount: mainAllocation,
    percentage: Math.round((mainAllocation / totalBudget) * 100)
  });
  
  // Distribute remaining budget
  const secondaryCount = expertise.length - 1;
  if (secondaryCount > 0) {
    const secondaryAmount = Math.floor(remainingBudget * 0.7 / secondaryCount);
    expertise.slice(1).forEach(exp => {
      breakdown.push({
        category: `${exp} Support`,
        amount: secondaryAmount,
        percentage: Math.round((secondaryAmount / totalBudget) * 100)
      });
    });
  }
  
  // Tools and overhead
  const overhead = totalBudget - breakdown.reduce((sum, item) => sum + item.amount, 0);
  if (overhead > 0) {
    breakdown.push({
      category: 'Tools & Analytics',
      amount: overhead,
      percentage: Math.round((overhead / totalBudget) * 100)
    });
  }
  
  return breakdown;
}



private generateExpertiseNextSteps(input: GrowthPlanInput): string[] {
  return [
    `Schedule ${input.expertise[0]} audit and strategy session with ${input.contactName}`,
    `Set up tracking infrastructure for ${input.expertise.join(', ')} initiatives`,
    `Begin ${input.industry}-specific ${input.expertise[0]} implementation`,
    `Establish weekly performance review schedule`,
    `Prepare detailed execution plan for Phase 1 activities`
  ];
}

// Helper methods for industry-specific data
private getIndustryMetrics(industry: string, currentRevenue: number): IndustryMetrics {
  const metrics: Record<string, IndustryMetrics> = {
    'SaaS': {
      revenuePerLead: 150,
      conversionRate: 0.15,
      baseCac: 200,
      baseLtv: 2400
    },
    'E-commerce': {
      revenuePerLead: 50,
      conversionRate: 0.03,
      baseCac: 50,
      baseLtv: 300
    },
    'Healthcare': {
      revenuePerLead: 500,
      conversionRate: 0.08,
      baseCac: 400,
      baseLtv: 5000
    }
  };
  
  return metrics[industry] || {
    revenuePerLead: 100,
    conversionRate: 0.1,
    baseCac: 150,
    baseLtv: 1500
  };
}


private getPhaseNames(expertise: string[]): string[] {
  return [
    `${expertise[0]} Foundation`,
    `Multi-Channel Integration`,
    'Optimization & Scale'
  ];
}

private getPhaseObjectives(expertise: string[], phaseIndex: number): string[] {
  switch (phaseIndex) {
    case 0:
      return [
        `Establish ${expertise[0]} baseline and infrastructure`,
        'Implement tracking and measurement systems',
        'Complete initial optimization opportunities'
      ];
    case 1:
      return [
        `Scale ${expertise.join(' and ')} initiatives`,
        'Integrate cross-channel strategies',
        'Optimize customer acquisition funnel'
      ];
    case 2:
      return [
        'Achieve target performance metrics',
        'Implement advanced automation',
        'Establish sustainable growth processes'
      ];
    default:
      return ['Continue optimization', 'Scale successful initiatives'];
  }
}

private getPhaseDeliverables(expertise: string[], phaseIndex: number): string[] {
  switch (phaseIndex) {
    case 0:
      return [
        `${expertise[0]} audit report`,
        'Performance tracking dashboard',
        'Implementation roadmap'
      ];
    case 1:
      return [
        `Active ${expertise.join(' and ')} campaigns`,
        'Conversion optimization reports',
        'Performance analysis'
      ];
    case 2:
      return [
        'Final performance report',
        'Process documentation',
        'Handover materials'
      ];
    default:
      return ['Performance reports', 'Optimization recommendations'];
  }
}

private getPhaseResources(expertise: string[], phaseIndex: number, totalBudget: number, phaseCount: number): string[] {
  const budgetPerPhase = Math.floor(totalBudget / phaseCount);
  
  const baseResources = [
    `Phase budget: $${budgetPerPhase.toLocaleString()}`,
    `${expertise[0]} specialist time`,
    'Analytics and tracking tools'
  ];
  
  if (expertise.length > 1) {
    baseResources.push(`${expertise.slice(1).join(' and ')} support`);
  }
  
  return baseResources;
}
  async saveGrowthPlan(userId: string, workspaceId: string, plan: GeneratedGrowthPlan, input: GrowthPlanInput): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `Growth Plan - ${input.clientCompany}`,
          content: JSON.stringify(plan),
          type: 'growth_plan',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: {
            clientCompany: input.clientCompany,
            industry: input.industry,
            timeframe: input.timeframe,
            contactName: input.contactName,
            contactRole: input.contactRole,
            generatedAt: new Date().toISOString(),
            tokensUsed: plan.tokensUsed,
            generationTime: plan.generationTime,
            consultant: {
              name: input.name,
              company: input.company,
              expertise: input.expertise
            }
          },
          tags: ['growth-plan', input.industry.toLowerCase(), input.timeframe, 'strategy']
        }
      });

      return deliverable.id;
    } catch (error) {
      console.error('Error saving growth plan:', error);
      throw error;
    }
  }

  async getGrowthPlan(userId: string, planId: string): Promise<SavedGrowthPlan | null> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.findFirst({
        where: {
          id: planId,
          user_id: userId,
          type: 'growth_plan'
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
        plan: JSON.parse(deliverable.content),
        metadata: deliverable.metadata as GrowthPlanMetadata,
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        workspace: deliverable.workspace ? {
          id: deliverable.workspace.id,
          name: deliverable.workspace.name
        } : undefined
      };
    } catch (error) {
      console.error('Error retrieving growth plan:', error);
      throw error;
    }
  }

  async getUserGrowthPlans(userId: string, workspaceId?: string): Promise<GrowthPlanSummary[]> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'growth_plan'
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const plans = await prisma.deliverable.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        include: {
          workspace: true
        }
      });

      return plans.map(plan => ({
        id: plan.id,
        title: plan.title,
        clientCompany: this.getMetadataField(plan.metadata, 'clientCompany') || 'Unknown',
        industry: this.getMetadataField(plan.metadata, 'industry') || 'Unknown',
        timeframe: this.getMetadataField(plan.metadata, 'timeframe') || '6m',
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
        workspace: plan.workspace ? {
          id: plan.workspace.id,
          name: plan.workspace.name
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching user growth plans:', error);
      return [];
    }
  }

  // FIXED UPDATE METHOD - Type Safe
  async updateGrowthPlan(
  userId: string, 
  planId: string, 
  updates: Partial<GrowthPlanInput>,
  options: UpdateGrowthPlanOptions = {}
): Promise<SavedGrowthPlan> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    //   1. Validate user owns the plan (single query)
    const existingPlan = await prisma.deliverable.findFirst({
      where: {
        id: planId,
        user_id: userId,
        type: 'growth_plan'
      }
    });
    
    if (!existingPlan) {
      throw new Error('Growth plan not found');
    }

    //   2. Parse existing data safely
    let existingContent;
    try {
      existingContent = JSON.parse(existingPlan.content);
    } catch (error) {
      throw new Error('Invalid plan data format');
    }

    const currentMetadata = existingPlan.metadata as any || {};
    
    //   3. Sanitize and validate updates
    const sanitizedUpdates = this.sanitizeUpdates(updates);
    
    //   4. SMART UPDATE: Only regenerate if strategy changes or explicitly requested
    const needsRegeneration = options.regenerateStrategy || 
      this.hasStrategyChanges(sanitizedUpdates);
    
    let updatedContent = existingContent;
    let tokensUsed = 0;
    let generationTime = 0;
    
    if (needsRegeneration) {
      // Only regenerate if necessary
      const fullInput = this.mergeWithExistingData(currentMetadata, sanitizedUpdates, userId);
      const newPlan = await this.generateGrowthPlan(fullInput);
      updatedContent = newPlan;
      tokensUsed = newPlan.tokensUsed;
      generationTime = newPlan.generationTime;
    } else {
      //   Fast update: Just update metadata without AI regeneration
      tokensUsed = currentMetadata.tokensUsed || 0;
      generationTime = 0; // No generation time for metadata-only updates
    }

    //   5. Smart metadata merging (preserve important fields)
    const updatedMetadata = {
      ...currentMetadata,
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString(),
      tokensUsed: (currentMetadata.tokensUsed || 0) + tokensUsed,
      lastGenerationTime: generationTime,
      updateType: needsRegeneration ? 'full_regeneration' : 'metadata_only'
    };

    //   6. Single database update
    const updated = await prisma.deliverable.update({
      where: { id: planId },
      data: {
        content: JSON.stringify(updatedContent),
        metadata: updatedMetadata,
        updated_at: new Date()
      },
      include: {
        workspace: true
      }
    });

    //   7. Return properly typed result
    return {
      id: updated.id,
      title: updated.title,
      plan: updatedContent,
      metadata: updatedMetadata,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      workspace: updated.workspace ? {
        id: updated.workspace.id,
        name: updated.workspace.name
      } : undefined
    };

  } catch (error) {
    console.error('Error updating growth plan:', error);
    throw error;
  }
}

private sanitizeUpdates(updates: Partial<GrowthPlanInput>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  // Only include defined values and sanitize strings
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else if (Array.isArray(value)) {
        sanitized[key] = value.filter(Boolean); // Remove empty items
      } else {
        sanitized[key] = value;
      }
    }
  });
  
  return sanitized;
}


private hasStrategyChanges(updates: Record<string, any>): boolean {
  // Only regenerate if these critical fields change
  const strategyFields = [
    'expertise', 'experience', 'timeframe', 'targetRevenue', 
    'currentRevenue', 'budget', 'focusAreas', 'businessModel'
  ];
  
  return strategyFields.some(field => updates.hasOwnProperty(field));
}

private mergeWithExistingData(
  currentMetadata: any, 
  updates: Record<string, any>, 
  userId: string
): GrowthPlanInput {
  // Create complete input object with fallbacks
  return {
    userId,
    email: updates.email || currentMetadata.email || '',
    name: updates.name || currentMetadata.name || '',
    company: updates.company || currentMetadata.company || '',
    clientCompany: updates.clientCompany || currentMetadata.clientCompany || '',
    industry: updates.industry || currentMetadata.industry || '',
    contactName: updates.contactName || currentMetadata.contactName || '',
    contactRole: updates.contactRole || currentMetadata.contactRole || '',
    expertise: updates.expertise || currentMetadata.expertise || [],
    experience: updates.experience || currentMetadata.experience || '',
    timeframe: updates.timeframe || currentMetadata.timeframe || '6m',
    // Optional fields with proper fallbacks
    transcript: updates.transcript || currentMetadata.transcript,
    caseStudies: updates.caseStudies || currentMetadata.caseStudies || [],
    focusAreas: updates.focusAreas || currentMetadata.focusAreas || [],
    budget: updates.budget || currentMetadata.budget,
    currentRevenue: updates.currentRevenue || currentMetadata.currentRevenue,
    targetRevenue: updates.targetRevenue || currentMetadata.targetRevenue,
    businessModel: updates.businessModel || currentMetadata.businessModel,
    teamSize: updates.teamSize || currentMetadata.teamSize,
    currentChannels: updates.currentChannels || currentMetadata.currentChannels || [],
    painPoints: updates.painPoints || currentMetadata.painPoints || [],
    objectives: updates.objectives || currentMetadata.objectives || []
  };
}


  async deleteGrowthPlan(userId: string, planId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: planId,
          user_id: userId,
          type: 'growth_plan'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting growth plan:', error);
      throw error;
    }
  }

  // NEW: Analytics method for performance tracking
async getGrowthPlanAnalytics(
  userId: string, 
  workspaceId?: string, 
  timeframe: 'week' | 'month' | 'quarter' = 'month'
): Promise<GrowthPlanAnalytics> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    console.log('📊 Starting analytics calculation for user:', userId, 'timeframe:', timeframe);
    
    //   Calculate date filter based on timeframe
    const now = new Date();
    const dateFilter = new Date();
    
    switch (timeframe) {
      case 'week':
        dateFilter.setDate(now.getDate() - 7);
        break;
      case 'month':
        dateFilter.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        dateFilter.setMonth(now.getMonth() - 3);
        break;
    }

    console.log('📅 Date filter:', dateFilter.toISOString(), 'to', now.toISOString());

    //   Build where clause
    const whereClause: any = {
      user_id: userId,
      type: 'growth_plan'
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    console.log('🔍 Query where clause:', JSON.stringify(whereClause, null, 2));

    //   Get all plans for this user (for total count)
    const allPlans = await prisma.deliverable.findMany({
      where: whereClause,
      select: {
        id: true,
        metadata: true,
        created_at: true
      }
    });

    console.log('📈 Found', allPlans.length, 'total growth plans');

    //   Get plans within timeframe (for period-specific stats)
    const recentPlans = await prisma.deliverable.findMany({
      where: {
        ...whereClause,
        created_at: {
          gte: dateFilter
        }
      },
      select: {
        id: true,
        metadata: true,
        created_at: true
      }
    });

    console.log('📅 Found', recentPlans.length, 'plans in', timeframe, 'period');

    //   Calculate industry distribution
    const industryCount: Record<string, number> = {};
    allPlans.forEach(plan => {
      const industry = this.getMetadataField(plan.metadata, 'industry') || 'Unknown';
      industryCount[industry] = (industryCount[industry] || 0) + 1;
    });

    console.log('🏭 Industry distribution:', industryCount);

    //   Calculate timeframe distribution
    const timeframeCount: Record<string, number> = { '3m': 0, '6m': 0, '12m': 0 };
    allPlans.forEach(plan => {
      const planTimeframe = this.getMetadataField(plan.metadata, 'timeframe') || '6m';
      if (timeframeCount.hasOwnProperty(planTimeframe)) {
        timeframeCount[planTimeframe]++;
      }
    });

    console.log('⏰ Timeframe distribution:', timeframeCount);

    //   Calculate average metrics
    let totalTokens = 0;
    let totalGenerationTime = 0;
    let validMetricsCount = 0;

    allPlans.forEach(plan => {
      const tokens = this.getMetadataField(plan.metadata, 'tokensUsed');
      const generationTime = this.getMetadataField(plan.metadata, 'generationTime');
      
      if (typeof tokens === 'number' && tokens > 0) {
        totalTokens += tokens;
        validMetricsCount++;
      }
      
      if (typeof generationTime === 'number' && generationTime > 0) {
        totalGenerationTime += generationTime;
      }
    });

    const averageTokens = validMetricsCount > 0 ? Math.round(totalTokens / validMetricsCount) : 0;
    const averageGenerationTime = validMetricsCount > 0 ? Math.round(totalGenerationTime / validMetricsCount) : 0;

    console.log('📊 Average tokens per plan:', averageTokens);
    console.log('⏱️ Average generation time:', averageGenerationTime, 'ms');

    //   Create plans by date for charting
    const plansByDate = this.createPlansByDateData(recentPlans, timeframe);

    //   Generate insights
    const insights = this.generateAnalyticsInsights(allPlans, recentPlans, timeframe);

    //   Create top industries array
    const topIndustries = Object.entries(industryCount)
      .map(([industry, count]) => ({
        industry,
        count: Number(count),
        percentage: allPlans.length > 0 ? Math.round((Number(count) / allPlans.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    console.log('🏆 Top industries:', topIndustries);

    //   Build final analytics response
    const analytics: GrowthPlanAnalytics = {
      totalPlans: allPlans.length,
      plansThisMonth: recentPlans.length, // Plans in current timeframe
      industryDistribution: industryCount, //   ADD: Required property
      topIndustries,
      timeframeDistribution: timeframeCount,
      timeframe, //   ADD: Required property from parameter
      averageMetrics: {
        tokensPerPlan: averageTokens,
        generationTime: averageGenerationTime
      },
      plansByDate,
      insights
    };

    console.log('  Analytics calculation completed:');
    console.log('- Total plans:', analytics.totalPlans);
    console.log('- Recent plans:', analytics.plansThisMonth);
    console.log('- Top industry:', topIndustries[0]?.industry || 'None');
    console.log('- Insights count:', insights.length);

    return analytics;

  } catch (error) {
    console.error('  Error calculating growth plan analytics:', error);
    console.error('Analytics error stack:', error instanceof Error ? error.stack : 'No stack');
    throw error;
  }
}

//   Helper method to create plans by date data for charts
private createPlansByDateData(plans: any[], timeframe: string): Array<{
  date: string;
  count: number;
  cumulative: number;
}> {
  const dateMap: Record<string, number> = {};
  
  plans.forEach(plan => {
    const date = new Date(plan.created_at);
    let dateKey: string;
    
    if (timeframe === 'week') {
      dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else {
      dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    }
    
    dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
  });
  
  // Sort dates and create cumulative data
  const sortedDates = Object.keys(dateMap).sort();
  let cumulative = 0;
  
  return sortedDates.map(date => {
    const count = dateMap[date];
    cumulative += count;
    return {
      date,
      count,
      cumulative
    };
  });
}



//   Helper method to generate insights
private generateAnalyticsInsights(
  allPlans: any[], 
  recentPlans: any[], 
  timeframe: string
): string[] {
  const insights: string[] = [];
  
  if (allPlans.length === 0) {
    return [
      'No growth plans created yet',
      'Create your first plan to see detailed analytics',
      'Analytics will show trends as you generate more plans'
    ];
  }
  
  // Total plans insight
  insights.push(`You have created ${allPlans.length} growth plan${allPlans.length === 1 ? '' : 's'} total`);
  
  // Recent activity insight
  if (recentPlans.length > 0) {
    const timeframeName = timeframe === 'week' ? 'week' : timeframe === 'month' ? 'month' : 'quarter';
    insights.push(`${recentPlans.length} plan${recentPlans.length === 1 ? '' : 's'} created in the last ${timeframeName}`);
  } else {
    const timeframeName = timeframe === 'week' ? 'week' : timeframe === 'month' ? 'month' : 'quarter';
    insights.push(`No plans created in the last ${timeframeName}`);
  }
  
  //   FIXED: Industry insights with proper typing
  const industries: Record<string, number> = {};
  allPlans.forEach(plan => {
    const industry = this.getMetadataField(plan.metadata, 'industry');
    if (industry && typeof industry === 'string') {
      industries[industry] = (industries[industry] || 0) + 1;
    }
  });
  
  const topIndustryEntry = Object.entries(industries)
    .sort(([, countA], [, countB]) => countB - countA)[0];
  
  if (topIndustryEntry) {
    const [industryName, count] = topIndustryEntry;
    insights.push(`Most plans are for ${industryName} industry (${count} plan${count === 1 ? '' : 's'})`);
  }
  
  //   FIXED: Timeframe insights with proper typing
  const timeframes: Record<string, number> = {};
  allPlans.forEach(plan => {
    const tf = this.getMetadataField(plan.metadata, 'timeframe');
    if (tf && typeof tf === 'string') {
      timeframes[tf] = (timeframes[tf] || 0) + 1;
    }
  });
  
  const topTimeframeEntry = Object.entries(timeframes)
    .sort(([, countA], [, countB]) => countB - countA)[0];
  
  if (topTimeframeEntry) {
    const [timeframeValue, count] = topTimeframeEntry;
    const timeframeName = timeframeValue === '3m' ? '3-month' : 
                         timeframeValue === '6m' ? '6-month' : '12-month';
    insights.push(`${timeframeName} plans are most common (${count} plan${count === 1 ? '' : 's'})`);
  }
  
  //   FIXED: Performance insights with proper typing
  const tokensUsed: number[] = [];
  allPlans.forEach(plan => {
    const tokens = this.getMetadataField(plan.metadata, 'tokensUsed');
    if (typeof tokens === 'number' && tokens > 0) {
      tokensUsed.push(tokens);
    }
  });
    
  if (tokensUsed.length > 0) {
    const avgTokens = Math.round(tokensUsed.reduce((sum, tokens) => sum + tokens, 0) / tokensUsed.length);
    insights.push(`Average ${avgTokens.toLocaleString()} tokens used per plan`);
  }
  
  return insights;
}



  async exportGrowthPlan(userId: string, planId: string, format: 'pdf' | 'word' | 'markdown' = 'markdown'): Promise<string> {
    const plan = await this.getGrowthPlan(userId, planId);
    if (!plan) {
      throw new Error('Growth plan not found');
    }

    const planData = plan.plan;
    const metadata = plan.metadata;

    switch (format) {
      case 'markdown':
        return this.generateMarkdownExport(planData, metadata);
      case 'pdf':
      case 'word':
        // For now, return markdown format
        // In production, you'd use libraries like puppeteer for PDF or officegen for Word
        return this.generateMarkdownExport(planData, metadata);
      default:
        return this.generateMarkdownExport(planData, metadata);
    }
  }

  private generateMarkdownExport(planData: any, metadata: any): string {
    return `
# Growth Plan - ${this.getMetadataField(metadata, 'clientCompany')}

**Industry:** ${this.getMetadataField(metadata, 'industry')}  
**Timeframe:** ${this.getMetadataField(metadata, 'timeframe')}  
**Generated:** ${new Date().toLocaleDateString()}

---

## Executive Summary

${planData.executiveSummary}

## Growth Strategy

### Implementation Stages

${planData.strategy?.stages?.map((stage: any, index: number) => `
#### Stage ${index + 1}: ${stage.title}

**Duration:** ${stage.duration}  
**Budget:** ${stage.budget?.toLocaleString()}

**Tasks:**
${stage.tasks?.map((task: string) => `- ${task}`).join('\n')}

**KPIs:**
${stage.kpis?.map((kpi: string) => `- ${kpi}`).join('\n')}
`).join('\n') || ''}

### Strategic Priorities

${planData.strategy?.priorities?.map((priority: any) => `
- **${priority.area}** - Impact: ${priority.impact}, Effort: ${priority.effort}, Timeline: ${priority.timeline}
`).join('') || ''}

### Key Recommendations

${planData.strategy?.recommendations?.map((rec: string) => `- ${rec}`).join('\n') || ''}

## Growth Metrics & Projections

### Monthly Timeline

| Month | Leads | Revenue | Customers | CAC | LTV |
|-------|-------|---------|-----------|-----|-----|
${planData.metrics?.timeline?.map((month: any) => 
  `| ${month.month} | ${month.leads} | ${month.revenue?.toLocaleString()} | ${month.customers} | ${month.cac} | ${month.ltv?.toLocaleString()} |`
).join('\n') || ''}

### Key Performance Indicators

${planData.metrics?.kpis?.map((kpi: any) => `
- **${kpi.name}:** ${kpi.current} → ${kpi.target} (${kpi.improvement}% improvement)
`).join('') || ''}

### Marketing Channels

${planData.metrics?.channels?.map((channel: any) => `
- **${channel.name}:** ${channel.allocation}% allocation, ${channel.expectedROI}% ROI, Status: ${channel.status}
`).join('') || ''}

## Implementation Plan

### Phases

${planData.implementation?.phases?.map((phase: any, index: number) => `
#### Phase ${index + 1}: ${phase.name}

**Duration:** ${phase.duration}

**Objectives:**
${phase.objectives?.map((obj: string) => `- ${obj}`).join('\n')}

**Deliverables:**
${phase.deliverables?.map((del: string) => `- ${del}`).join('\n')}

**Resources Required:**
${phase.resources?.map((res: string) => `- ${res}`).join('\n')}
`).join('\n') || ''}

### Budget Breakdown

**Total Budget:** ${planData.implementation?.budget?.total?.toLocaleString()}

${planData.implementation?.budget?.breakdown?.map((item: any) => `
- **${item.category}:** ${item.amount?.toLocaleString()} (${item.percentage}%)
`).join('') || ''}

## Risk Assessment

${planData.strategy?.risks?.map((risk: any) => `
### ${risk.risk}
**Probability:** ${risk.probability}  
**Mitigation:** ${risk.mitigation}
`).join('\n') || ''}

## Next Steps

${planData.nextSteps?.map((step: string) => `1. ${step}`).join('\n') || ''}

---

*This growth plan was generated on ${new Date().toLocaleDateString()} and should be reviewed quarterly for adjustments based on market conditions and performance metrics.*
    `;
  }

  // Helper method to safely extract metadata fields
 private getMetadataField(metadata: any, field: string): any {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }
  return metadata[field] || null;
}

  private getTopIndustries(plans: any[]): Array<{industry: string, plans: number}> {
    const industries = plans.reduce((acc, plan) => {
      const industry = this.getMetadataField(plan.metadata, 'industry') || 'Unknown';
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(industries)
      .map(([industry, count]) => ({ 
        industry, 
        plans: Number(count) // Explicitly convert to number
      }))
      .sort((a, b) => b.plans - a.plans)
      .slice(0, 5);
  }

  private generatePlanInsights(plans: any[]): string[] {
    const insights: string[] = [];
    
    if (plans.length === 0) return ['No growth plans created yet'];

    const timeframes = plans.reduce((acc, plan) => {
      const timeframe = this.getMetadataField(plan.metadata, 'timeframe');
      acc[timeframe] = (acc[timeframe] || 0) + 1;
      return acc;
    }, {});

    const mostCommonTimeframe = Object.entries(timeframes).sort((a: any, b: any) => b[1] - a[1])[0];
    if (mostCommonTimeframe) {
      insights.push(`Most common timeframe: ${mostCommonTimeframe[0]} (${mostCommonTimeframe[1]} plans)`);
    }

    const industries = plans.reduce((acc, plan) => {
      const industry = this.getMetadataField(plan.metadata, 'industry');
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {});

    const topIndustry = Object.entries(industries).sort((a: any, b: any) => b[1] - a[1])[0];
    if (topIndustry) {
      insights.push(`Primary target industry: ${topIndustry[0]}`);
    }

    return insights;
  }

  private generateCacheKey(input: GrowthPlanInput): string {
    const key = `growth_plan:${input.clientCompany}:${input.industry}:${input.timeframe}:${input.expertise.join('-')}`;
    return key.toLowerCase().replace(/\s+/g, '_');
  }

  // NEW: Bulk operations for enterprise features
  async bulkDeleteGrowthPlans(userId: string, planIds: string[]): Promise<number> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: { in: planIds },
          user_id: userId,
          type: 'growth_plan'
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error bulk deleting growth plans:', error);
      throw error;
    }
  }

  async searchGrowthPlans(userId: string, query: string, filters?: {
    industry?: string;
    timeframe?: string;
    workspaceId?: string;
  }): Promise<GrowthPlanSummary[]> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'growth_plan',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      };

      if (filters?.industry) {
        whereClause.metadata = {
          path: ['industry'],
          equals: filters.industry
        };
      }

      if (filters?.timeframe) {
        whereClause.metadata = {
          ...whereClause.metadata,
          path: ['timeframe'],
          equals: filters.timeframe
        };
      }

      if (filters?.workspaceId) {
        whereClause.workspace_id = filters.workspaceId;
      }

      const plans = await prisma.deliverable.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        include: {
          workspace: true
        },
        take: 50 // Limit results
      });

      return plans.map(plan => ({
        id: plan.id,
        title: plan.title,
        clientCompany: this.getMetadataField(plan.metadata, 'clientCompany') || 'Unknown',
        industry: this.getMetadataField(plan.metadata, 'industry') || 'Unknown',
        timeframe: this.getMetadataField(plan.metadata, 'timeframe') || '6m',
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
        workspace: plan.workspace ? {
          id: plan.workspace.id,
          name: plan.workspace.name
        } : undefined
      }));
    } catch (error) {
      console.error('Error searching growth plans:', error);
      return [];
    }
  }

  // NEW: Template management
  async createGrowthPlanTemplate(userId: string, name: string, description: string, input: Partial<GrowthPlanInput>): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
  // Option 1: Add workspace_id (simpler)
const template = await prisma.deliverable.create({
  data: {
    title: `Template: ${name}`,
    content: JSON.stringify(input),
    type: 'growth_plan_template',
    user_id: userId,
    workspace_id: 'default', // Add this line
    metadata: {
      name,
      description,
      createdAt: new Date().toISOString(),
      templateVersion: '1.0'
    },
    tags: ['template', 'growth-plan']
  }
});


      return template.id;
    } catch (error) {
      console.error('Error creating growth plan template:', error);
      throw error;
    }
  }

  async getGrowthPlanTemplates(userId: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    template: Partial<GrowthPlanInput>;
    createdAt: Date;
  }>> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const templates = await prisma.deliverable.findMany({
        where: {
          user_id: userId,
          type: 'growth_plan_template'
        },
        orderBy: { created_at: 'desc' }
      });

      return templates.map(template => ({
        id: template.id,
        name: this.getMetadataField(template.metadata, 'name') || 'Unnamed Template',
        description: this.getMetadataField(template.metadata, 'description') || '',
        template: JSON.parse(template.content),
        createdAt: template.created_at
      }));
    } catch (error) {
      console.error('Error fetching growth plan templates:', error);
      return [];
    }
  }
}
          