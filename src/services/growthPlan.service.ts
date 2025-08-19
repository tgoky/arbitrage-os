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
      // ✅ FIX: Handle both string and object returns from Redis
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
    model: 'openai/gpt-4o',
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
  private buildGrowthPlanPrompt(input: GrowthPlanInput): string {
    return `
    GROWTH PLAN GENERATION REQUEST

    CLIENT CONTEXT:
    - Company: ${input.clientCompany}
    - Industry: ${input.industry}
    - Contact: ${input.contactName} (${input.contactRole})
    - Current Revenue: ${input.currentRevenue ? `$${input.currentRevenue.toLocaleString()}` : 'Not specified'}
    - Target Revenue: ${input.targetRevenue ? `$${input.targetRevenue.toLocaleString()}` : 'Not specified'}
    - Timeframe: ${input.timeframe === '3m' ? '3 months' : input.timeframe === '6m' ? '6 months' : '12 months'}

    CONSULTANT PROFILE:
    - Name: ${input.name}
    - Company: ${input.company}
    - Core Skills: ${input.expertise.join(', ')}
    - Experience: ${input.experience}

    ${input.caseStudies && input.caseStudies.length > 0 ? `
    PROVEN RESULTS:
    ${input.caseStudies.map(cs => `- ${cs.client}: ${cs.result}`).join('\n')}
    ` : ''}

    ${input.transcript ? `
    DISCOVERY INSIGHTS:
    ${input.transcript}
    ` : ''}

    ${input.focusAreas && input.focusAreas.length > 0 ? `
    FOCUS AREAS: ${input.focusAreas.join(', ')}
    ` : ''}

    ${input.budget ? `BUDGET: $${input.budget.toLocaleString()}` : ''}

    DELIVERABLE REQUIREMENTS:
    Generate a comprehensive growth plan in JSON format with the following structure:

    {
      "executiveSummary": "2-3 paragraph summary of the growth opportunity and approach",
      "strategy": {
        "stages": [
          {
            "title": "Stage name",
            "duration": "timeframe",
            "tasks": ["specific actionable tasks"],
            "kpis": ["measurable outcomes"],
            "budget": estimated_cost_number
          }
        ],
        "priorities": [
          {
            "area": "growth area",
            "impact": "high/medium/low",
            "effort": "high/medium/low", 
            "timeline": "when to implement"
          }
        ],
        "recommendations": ["specific strategic recommendations"],
        "risks": [
          {
            "risk": "potential risk",
            "mitigation": "how to address",
            "probability": "high/medium/low"
          }
        ]
      },
      "metrics": {
        "timeline": [
          {
            "month": "Month 1",
            "leads": number,
            "revenue": number,
            "customers": number,
            "cac": number,
            "ltv": number
          }
        ],
        "kpis": [
          {
            "name": "KPI name",
            "current": current_value,
            "target": target_value,
            "improvement": percentage_improvement
          }
        ],
        "channels": [
          {
            "name": "channel name",
            "allocation": percentage,
            "expectedROI": number,
            "status": "active/planned/testing"
          }
        ]
      },
      "implementation": {
        "phases": [
          {
            "name": "phase name",
            "duration": "timeframe",
            "objectives": ["phase objectives"],
            "deliverables": ["what will be delivered"],
            "resources": ["what's needed"]
          }
        ],
        "timeline": "overall timeline description",
        "budget": {
          "total": total_budget_number,
          "breakdown": [
            {
              "category": "category name",
              "amount": amount_number,
              "percentage": percentage_number
            }
          ]
        }
      },
      "nextSteps": ["immediate actionable next steps"]
    }

    Make sure all data is realistic, industry-appropriate, and achievable. Base projections on industry benchmarks for ${input.industry}. Include specific tactics that align with the consultant's expertise in ${input.expertise.join(', ')}.
    `;
  }

 private parseGrowthPlanResponse(content: string, input: GrowthPlanInput) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // ✅ Validate required structure
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

  private generateFallbackPlan(input: GrowthPlanInput): Omit<GeneratedGrowthPlan, 'tokensUsed' | 'generationTime'> {
    const months = input.timeframe === '3m' ? 3 : input.timeframe === '6m' ? 6 : 12;
    const currentRevenue = input.currentRevenue || 10000;
    const growthRate = 0.2; // 20% monthly growth

    return {
      executiveSummary: `Strategic growth plan for ${input.clientCompany} focusing on ${input.expertise.join(', ')} to achieve sustainable revenue growth over ${months} months. Based on industry analysis and proven methodologies, we project significant improvements in key metrics through targeted implementation of growth initiatives.`,
      
      strategy: {
        stages: [
          {
            title: 'Foundation & Analysis',
            duration: '2-4 weeks',
            tasks: ['Audit current systems', 'Analyze competitor landscape', 'Set up tracking infrastructure'],
            kpis: ['Baseline metrics established', 'System audit completed'],
            budget: 5000
          },
          {
            title: 'Growth Implementation',
            duration: `${Math.ceil(months/2)} months`,
            tasks: ['Launch primary growth channels', 'Optimize conversion funnels', 'Scale successful initiatives'],
            kpis: ['Lead generation increase', 'Conversion rate improvement'],
            budget: 15000
          },
          {
            title: 'Optimization & Scale',
            duration: `${Math.floor(months/2)} months`,
            tasks: ['Refine top-performing channels', 'Expand to new markets', 'Automate processes'],
            kpis: ['Revenue targets achieved', 'Sustainable growth rate'],
            budget: 25000
          }
        ],
        priorities: [
          { area: 'Customer Acquisition', impact: 'high', effort: 'high', timeline: 'Month 1-2' },
          { area: 'Conversion Optimization', impact: 'high', effort: 'medium', timeline: 'Month 2-3' },
          { area: 'Retention Improvement', impact: 'medium', effort: 'medium', timeline: 'Month 3+' }
        ],
        recommendations: [
          'Focus on high-intent traffic sources initially',
          'Implement robust tracking before scaling',
          'Test multiple channels simultaneously',
          'Prioritize customer feedback and iteration'
        ],
        risks: [
          { risk: 'Market saturation', mitigation: 'Diversify channel mix', probability: 'medium' },
          { risk: 'Budget constraints', mitigation: 'Phase implementation', probability: 'low' }
        ]
      },

      metrics: {
        timeline: Array.from({ length: months }, (_, i) => ({
          month: `Month ${i + 1}`,
          leads: Math.round(100 * Math.pow(1 + growthRate, i)),
          revenue: Math.round(currentRevenue * Math.pow(1 + growthRate, i)),
          customers: Math.round(10 * Math.pow(1 + growthRate, i)),
          cac: Math.round(150 * (1 - i * 0.05)), // Decreasing CAC
          ltv: Math.round(1000 * (1 + i * 0.1)) // Increasing LTV
        })),
        kpis: [
          { name: 'Monthly Revenue', current: currentRevenue, target: Math.round(currentRevenue * Math.pow(1 + growthRate, months)), improvement: Math.round(((Math.pow(1 + growthRate, months) - 1) * 100)) },
          { name: 'Lead Generation', current: 100, target: Math.round(100 * Math.pow(1 + growthRate, months)), improvement: Math.round(((Math.pow(1 + growthRate, months) - 1) * 100)) },
          { name: 'Conversion Rate', current: 2.5, target: 5.0, improvement: 100 },
          { name: 'Customer Retention', current: 60, target: 85, improvement: 42 }
        ],
        channels: [
          { name: 'Organic Search', allocation: 35, expectedROI: 400, status: 'active' },
          { name: 'Paid Advertising', allocation: 25, expectedROI: 250, status: 'planned' },
          { name: 'Email Marketing', allocation: 20, expectedROI: 500, status: 'active' },
          { name: 'Referrals', allocation: 15, expectedROI: 600, status: 'testing' },
          { name: 'Partnerships', allocation: 5, expectedROI: 300, status: 'planned' }
        ]
      },

      implementation: {
        phases: [
          {
            name: 'Phase 1: Foundation',
            duration: '4 weeks',
            objectives: ['Establish baseline metrics', 'Set up infrastructure'],
            deliverables: ['Analytics setup', 'Competitor analysis', 'Strategy documentation'],
            resources: ['Analytics tools', 'Team training', 'Initial budget allocation']
          },
          {
            name: 'Phase 2: Growth',
            duration: `${Math.ceil(months/2)} months`,
            objectives: ['Launch growth initiatives', 'Optimize performance'],
            deliverables: ['Campaign launches', 'Optimization reports', 'Performance dashboards'],
            resources: ['Marketing budget', 'Content creation', 'Tool subscriptions']
          },
          {
            name: 'Phase 3: Scale',
            duration: `${Math.floor(months/2)} months`,
            objectives: ['Scale successful channels', 'Achieve targets'],
            deliverables: ['Scaled campaigns', 'Final reports', 'Handover documentation'],
            resources: ['Increased budget', 'Team expansion', 'Advanced tools']
          }
        ],
        timeline: `${months}-month implementation with monthly reviews and quarterly strategy adjustments`,
        budget: {
          total: 45000,
          breakdown: [
            { category: 'Advertising Spend', amount: 25000, percentage: 56 },
            { category: 'Tools & Software', amount: 8000, percentage: 18 },
            { category: 'Content Creation', amount: 7000, percentage: 16 },
            { category: 'Consulting Fees', amount: 5000, percentage: 11 }
          ]
        }
      },

      nextSteps: [
        'Schedule kick-off meeting with stakeholders',
        'Set up analytics and tracking infrastructure',
        'Conduct detailed competitor analysis',
        'Finalize budget allocation and timeline',
        'Begin Phase 1 implementation'
      ]
    };
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
    
    // ✅ 1. Validate user owns the plan (single query)
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

    // ✅ 2. Parse existing data safely
    let existingContent;
    try {
      existingContent = JSON.parse(existingPlan.content);
    } catch (error) {
      throw new Error('Invalid plan data format');
    }

    const currentMetadata = existingPlan.metadata as any || {};
    
    // ✅ 3. Sanitize and validate updates
    const sanitizedUpdates = this.sanitizeUpdates(updates);
    
    // ✅ 4. SMART UPDATE: Only regenerate if strategy changes or explicitly requested
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
      // ✅ Fast update: Just update metadata without AI regeneration
      tokensUsed = currentMetadata.tokensUsed || 0;
      generationTime = 0; // No generation time for metadata-only updates
    }

    // ✅ 5. Smart metadata merging (preserve important fields)
    const updatedMetadata = {
      ...currentMetadata,
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString(),
      tokensUsed: (currentMetadata.tokensUsed || 0) + tokensUsed,
      lastGenerationTime: generationTime,
      updateType: needsRegeneration ? 'full_regeneration' : 'metadata_only'
    };

    // ✅ 6. Single database update
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

    // ✅ 7. Return properly typed result
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
  async getGrowthPlanAnalytics(userId: string, workspaceId?: string, timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<GrowthPlanAnalytics> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const dateFilter = new Date();
      switch (timeframe) {
        case 'week':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case 'month':
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
        case 'quarter':
          dateFilter.setMonth(dateFilter.getMonth() - 3);
          break;
      }

      const whereClause: any = {
        user_id: userId,
        type: 'growth_plan',
        created_at: {
          gte: dateFilter
        }
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const plans = await prisma.deliverable.findMany({
        where: whereClause,
        select: {
          metadata: true,
          created_at: true
        }
      });

      // Calculate analytics
      const totalPlans = plans.length;
      const industryDistribution = plans.reduce((acc, plan) => {
        const industry = this.getMetadataField(plan.metadata, 'industry') || 'unknown';
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const timeframeDistribution = plans.reduce((acc, plan) => {
        const timeframe = this.getMetadataField(plan.metadata, 'timeframe') || 'unknown';
        acc[timeframe] = (acc[timeframe] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalPlans,
        industryDistribution,
        timeframeDistribution,
        timeframe,
        topIndustries: this.getTopIndustries(plans),
        insights: this.generatePlanInsights(plans)
      };
    } catch (error) {
      console.error('Error generating growth plan analytics:', error);
      throw error;
    }
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
          