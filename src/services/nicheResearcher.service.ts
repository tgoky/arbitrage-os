// services/nicheResearcher.service.ts - COMPLETE AND PROPER VERSION
import { OpenRouterClient } from '@/lib/openrouter';
import { 
  NicheResearchInput, 
  GeneratedNicheReport, 
  NicheReportMetadata,
  MultiNicheReport,
  NicheComparisonMatrix,
  NicheScore
} from '@/types/nicheResearcher';
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

  // Main wrapper method for generating and saving reports
 async generateAndSaveNicheReport(
  input: NicheResearchInput, 
  userId: string, 
  workspaceId: string
): Promise<{
  report: MultiNicheReport;  // Changed from GeneratedNicheReport
  reportId: string;
}> {
  console.log(' Starting niche report generation for user:', userId);
  
  // Generate report using AI
  const report = await this.generateNicheReport(input);
  
  // Save to database
  const reportId = await this.saveNicheReport(userId, workspaceId, report, input);
  
  console.log('  Niche report generated and saved with ID:', reportId);
  
  return {
    report,
    reportId,
  };
}
  async generateNicheReport(input: NicheResearchInput): Promise<MultiNicheReport> {
  const startTime = Date.now();
  
  // Check cache first
  const cacheKey = this.generateCacheKey(input);
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    console.log('📋 Using cached niche report');
    return JSON.parse(cached as string);
  }

  console.log('🤖 Generating new niche report with AI');

  // Build comprehensive analysis prompt
  const prompt = this.buildNicheAnalysisPrompt(input);
  
  // Generate report using AI
  const response = await this.openRouterClient.complete({
    model: 'openai/gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert business consultant and market researcher specializing in niche identification and opportunity analysis. Generate comprehensive, data-driven niche research reports that are practical, actionable, and tailored to the individual's unique background and constraints.

Focus on finding the perfect intersection of:
1. Market demand and growth potential
2. Individual's skills, resources, and constraints
3. Competitive landscape and entry barriers
4. Monetization and scalability opportunities

Provide specific, actionable recommendations with real market insights.`
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
  
  const nicheReport: MultiNicheReport = {
    ...parsedReport,
    tokensUsed: response.usage.total_tokens,
    generationTime: Date.now() - startTime
  };

  // Cache for 4 hours
  await this.redis.set(cacheKey, JSON.stringify(nicheReport), { ex: 14400 });
  
  return nicheReport;
}


private parseNicheReportResponse(content: string, input: NicheResearchInput): Omit<MultiNicheReport, 'tokensUsed' | 'generationTime'> {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the multi-niche structure
      if (!parsed.niches || !Array.isArray(parsed.niches) || parsed.niches.length !== 3) {
        throw new Error('Invalid multi-niche response format');
      }
      
      return parsed;
    }
    throw new Error('No valid JSON found');
  } catch (error) {
    return this.generateFallbackMultiNicheReport(input);
  }
}

async saveNicheReport(
  userId: string, 
  workspaceId: string, 
  report: MultiNicheReport,
  input: NicheResearchInput
): Promise<string> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // Get the recommended niche from the report
    const recommendedNiche = report.niches[report.recommendedNiche];
    
    // Create metadata from the input and report
    const metadata: NicheReportMetadata = {
      primaryObjective: input.primaryObjective,
      marketType: input.marketType,
      customerSize: input.customerSize,
      budget: input.budget,
      generatedAt: new Date().toISOString(),
      tokensUsed: report.tokensUsed,
      generationTime: report.generationTime,
      topNiches: report.niches.map((niche, index) => ({
        name: niche.nicheOverview.name,
        matchScore: this.calculateMatchScore(input, niche),
        category: input.marketType,
        isRecommended: index === report.recommendedNiche
      })),
      // Additional metadata
      riskAppetite: input.riskAppetite,
      geographicFocus: input.geographicFocus,
      teamSize: input.teamSize,
      timeCommitment: input.timeCommitment,
      skills: input.skills || [],
      industries: input.industries || [],
      originalInput: input,
      // Add multi-niche specific metadata
      recommendedNicheIndex: report.recommendedNiche,
      recommendationReason: report.recommendationReason,
      totalNiches: report.niches.length
    };
    
    const deliverable = await prisma.deliverable.create({
      data: {
        title: `Multi-Niche Research Report - ${recommendedNiche.nicheOverview.name} (Recommended)`,
        content: JSON.stringify(report),
        type: 'niche_research',
        user_id: userId,
        workspace_id: workspaceId,
        metadata: metadata,
        tags: [
          'niche-research',
          'multi-niche',
          input.primaryObjective,
          input.marketType,
          input.customerSize,
          input.budget,
          input.riskAppetite,
          ...(input.skills || []).map(s => s.toLowerCase().replace(/\s+/g, '-')),
          ...(input.industries || []).map(i => i.toLowerCase().replace(/\s+/g, '-'))
        ].filter(Boolean)
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
        metadata: deliverable.metadata as NicheReportMetadata,
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
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return reports.map(report => {
      const metadata = report.metadata as NicheReportMetadata;
      // CHANGED: Parse as MultiNicheReport instead of GeneratedNicheReport
      const reportContent = JSON.parse(report.content) as MultiNicheReport;
      const recommendedNiche = reportContent.niches?.[reportContent.recommendedNiche];
      
      return {
        id: report.id,
        title: report.title,
        // CHANGED: Use recommended niche data instead of direct properties
        nicheName: recommendedNiche?.nicheOverview?.name || 'Multi-Niche Report',
        marketSize: recommendedNiche?.marketDemand?.marketSize || 'Unknown',
        primaryObjective: metadata?.primaryObjective || 'Not specified',
        marketType: metadata?.marketType || 'Not specified',
        budget: metadata?.budget || 'Not specified',
        tokensUsed: metadata?.tokensUsed || 0,
        generationTime: metadata?.generationTime || 0,
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

  async deleteNicheReport(userId: string, reportId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: reportId,
          user_id: userId,
          type: 'niche_research'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting niche report:', error);
      throw error;
    }
  }

async exportNicheReport(reportId: string, format: 'html' | 'json' = 'html'): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: reportId }
    });

    if (!deliverable) {
      throw new Error('Report not found');
    }

    // CHANGED: Parse as MultiNicheReport instead of GeneratedNicheReport
    const report = JSON.parse(deliverable.content) as MultiNicheReport;
    const metadata = deliverable.metadata as NicheReportMetadata;
    
    // CHANGED: Get the recommended niche for HTML export
    const recommendedNiche = report.niches[report.recommendedNiche];

    if (format === 'html') {
      // CHANGED: Pass the recommended niche to generateHTMLReport
      const htmlContent = this.generateHTMLReport(recommendedNiche, metadata);
      this.downloadFile(htmlContent, `${deliverable.title}.html`, 'text/html');
    } else {
      // For JSON, export the entire multi-niche report
      const jsonContent = JSON.stringify({ report, metadata }, null, 2);
      this.downloadFile(jsonContent, `${deliverable.title}.json`, 'application/json');
    }
  } catch (error) {
    console.error('Error exporting niche report:', error);
    throw error;
  }
}

  private calculateMatchScore(input: NicheResearchInput, report: GeneratedNicheReport): number {
    let score = 0;
    let maxScore = 0;

    // Skills alignment (25 points max)
    maxScore += 25;
    if (input.skills && input.skills.length > 0) {
      // If the niche name or summary mentions skills, give points
      const nicheText = (report.nicheOverview.name + ' ' + report.nicheOverview.summary).toLowerCase();
      
      const skillMatches = input.skills.filter(skill => 
        nicheText.includes(skill.toLowerCase()) || 
        skill.toLowerCase().split(' ').some(word => nicheText.includes(word))
      );
      
      score += (skillMatches.length / input.skills.length) * 25;
    } else {
      score += 15; // Default points if no skills specified
    }

    // Market demand alignment (20 points max)
    maxScore += 20;
    if (report.marketDemand) {
      if (report.marketDemand.trend === 'growing') score += 20;
      else if (report.marketDemand.trend === 'plateauing') score += 12;
      else score += 5; // declining
    }

    // Risk alignment (15 points max)
    maxScore += 15;
    if (report.competitiveLandscape) {
      const riskMap = {
        'low': { 'Low': 15, 'Medium': 10, 'High': 3 },
        'medium': { 'Low': 12, 'Medium': 15, 'High': 8 },
        'high': { 'Low': 8, 'Medium': 12, 'High': 15 }
      };
      score += riskMap[input.riskAppetite][report.competitiveLandscape.barrierToEntry] || 5;
    }

    // Budget-opportunity alignment (15 points max)
    maxScore += 15;
    const budgetScores = {
      '<10k': report.competitiveLandscape?.barrierToEntry === 'Low' ? 15 : 8,
      '10k-50k': 12,
      '50k-250k': report.scalabilityExit?.scalabilityScore === 'High' ? 15 : 10,
      '250k+': report.scalabilityExit?.scalabilityScore === 'High' ? 15 : 12
    };
    score += budgetScores[input.budget] || 8;

    // Objective alignment (15 points max)
    maxScore += 15;
    const objectiveBonus = this.getObjectiveAlignmentScore(input.primaryObjective, report);
    score += objectiveBonus;

    // Market type consistency (10 points max)
    maxScore += 10;
    score += 10; // Always give points since we're targeting their preferred market type

    // Normalize to 0-100 scale
    const normalizedScore = Math.round((score / maxScore) * 100);
    
    // Ensure score is between 60-98 (realistic range)
    return Math.max(60, Math.min(98, normalizedScore));
  }

  private getObjectiveAlignmentScore(objective: string, report: GeneratedNicheReport): number {
    const alignmentMap: Record<string, (report: GeneratedNicheReport) => number> = {
      'cashflow': (r) => r.scorecard?.profitability === 'High' ? 15 : 
                         r.scorecard?.profitability === 'Medium' ? 10 : 5,
      'equity-exit': (r) => r.scalabilityExit?.scalabilityScore === 'High' ? 15 : 8,
      'lifestyle': (r) => r.competitiveLandscape?.barrierToEntry === 'Low' ? 15 : 10,
      'saas': (r) => r.scalabilityExit?.scalabilityScore === 'High' ? 15 : 10,
      'agency': (r) => r.scorecard?.easeOfEntry === 'High' ? 15 : 10,
      'ecomm': (r) => r.scorecard?.profitability === 'High' ? 15 : 10,
      'audience-build': (r) => r.marketDemand?.trend === 'growing' ? 15 : 10
    };

    return alignmentMap[objective]?.(report) || 10;
  }

private buildNicheAnalysisPrompt(input: NicheResearchInput): string {
    const skills = input.skills || ['Business Development', 'Marketing', 'Operations'];
    const industries = input.industries || ['Technology', 'Healthcare', 'Professional Services'];
    
    return `
**GENERATE 3 COMPLETELY DISTINCT NICHE OPPORTUNITIES WITH INDUSTRY-SPECIFIC DETAILS**

CRITICAL ENFORCEMENT: Each section of each niche MUST be customized for its specific skill-industry combination. Generic responses will be rejected.

**FORCED DIVERSIFICATION WITH DETAILED CUSTOMIZATION:**

NICHE 1 - ${skills[0]} + ${industries[0]} SERVICE:
- Industry-Specific Pain Points: Problems unique to ${industries[0]} companies when dealing with ${skills[0]}
- ${industries[0]}-Specific Competitors: Actual companies serving ${industries[0]} with ${skills[0]} solutions
- ${industries[0]} Market Size: Real market data for ${skills[0]} services in ${industries[0]}
- ${industries[0]} Customer Willingness to Pay: Pricing specific to ${industries[0]} ${input.customerSize} budgets
- ${industries[0]} + ${skills[0]} Arbitrage: Unique opportunity combining these specifically

NICHE 2 - ${skills[1]} + ${industries[1]} PRODUCT:
- Industry-Specific Pain Points: Problems unique to ${industries[1]} organizations with ${skills[1]} challenges
- ${industries[1]}-Specific Competitors: Actual products/platforms serving ${industries[1]} ${skills[1]} market
- ${industries[1]} Market Size: Real market data for ${skills[1]} products in ${industries[1]}
- ${industries[1]} Customer Willingness to Pay: SaaS/product pricing for ${industries[1]} ${input.customerSize}
- ${industries[1]} + ${skills[1]} Arbitrage: Unique product opportunity in this specific intersection

NICHE 3 - ${skills[2]}+${skills[0]} + ${industries[2]} CONSULTING:
- Industry-Specific Pain Points: Problems unique to ${industries[2]} needing combined ${skills[2]}+${skills[0]} expertise
- ${industries[2]}-Specific Competitors: Actual consultants serving ${industries[2]} with these skill combinations
- ${industries[2]} Market Size: Real consulting market data for this skill combo in ${industries[2]}
- ${industries[2]} Willingness to Pay: Consulting rates specific to ${industries[2]} ${input.customerSize}
- Multi-skill Arbitrage: Unique opportunity from combining ${skills[2]} + ${skills[0]} for ${industries[2]}

**MANDATORY INDUSTRY-SPECIFIC CUSTOMIZATION EXAMPLES:**

For Healthcare + Marketing:
- Pain Points: "HIPAA-compliant patient acquisition campaigns", "Referral network engagement"
- Competitors: "PatientPop", "Solutionreach", "Kareo Marketing"
- Market Size: "$4.6B healthcare marketing automation market"
- Pricing: "Healthcare practices pay $300-2000/month for compliant marketing tools"

For Technology + Sales:
- Pain Points: "Complex B2B sales cycles", "Technical product demos", "Developer-focused lead gen"
- Competitors: "Salesloft", "Outreach.io", "Gong for tech sales"
- Market Size: "$8.1B sales enablement for technology companies"
- Pricing: "Tech companies pay $100-500/user/month for sales tools"

For Entertainment + SEO:
- Pain Points: "Event discovery optimization", "Venue visibility", "Seasonal search patterns"
- Competitors: "Eventbrite marketing", "Bandsintown promotion", "Songkick venue tools"
- Market Size: "$2.3B entertainment digital marketing market"
- Pricing: "Entertainment venues pay $500-5000/month for digital marketing"

**CLIENT PROFILE:**
Primary Objective: ${input.primaryObjective}
Risk Appetite: ${input.riskAppetite}
Market Type Preference: ${input.marketType}
Target Customer Size: ${input.customerSize}
Budget Available: ${input.budget}
${input.timeCommitment ? `Time Commitment: ${input.timeCommitment} hours/week` : ''}
${input.teamSize ? `Team Size: ${input.teamSize}` : ''}
${input.geographicFocus ? `Geographic Focus: ${input.geographicFocus}` : ''}
${input.targetArea ? `Target Area: ${input.targetArea}` : ''}

**AVAILABLE RESOURCES:**
Skills Available: ${skills.join(', ')}
Industries of Interest: ${industries.join(', ')}
${input.excludedIndustries && input.excludedIndustries.length > 0 ? `Excluded Industries: ${input.excludedIndustries.join(', ')}` : ''}
${input.problems ? `Observed Problems: ${input.problems}` : ''}
${input.monetizationPreference ? `Monetization Preference: ${input.monetizationPreference}` : ''}
${input.acquisitionChannels && input.acquisitionChannels.length > 0 ? `Preferred Acquisition Channels: ${input.acquisitionChannels.join(', ')}` : ''}

**VALIDATION & SCALING:**
${input.validationData && input.validationData.length > 0 ? `Validation Data Preferences: ${input.validationData.join(', ')}` : ''}
${input.competitionPreference ? `Competition Preference: ${input.competitionPreference}` : ''}
${input.scalabilityPreference ? `Scalability Preference: ${input.scalabilityPreference}` : ''}

**MANDATORY CUSTOMIZATION REQUIREMENTS:**

MARKET DEMAND - MUST BE INDUSTRY-SPECIFIC:
- Use real market size data for [SKILL] in [INDUSTRY] sector
- Mention industry-specific growth drivers and trends
- Reference actual industry reports or data sources when possible
- Customize willingness to pay based on industry + customer size combination

PAIN POINTS - MUST BE INDUSTRY + SKILL SPECIFIC:
- NO generic business problems
- Focus on problems specific to [INDUSTRY] companies struggling with [SKILL]
- Include industry jargon and specific use cases
- Reference actual challenges these industries face with this skill area

COMPETITIVE LANDSCAPE - MUST INCLUDE REAL COMPANIES:
- Name actual competitors serving [INDUSTRY] with [SKILL] solutions
- Include industry-specific market leaders and disruptions
- Analyze barriers specific to this industry-skill combination
- Mention industry-specific regulations, standards, or requirements

ARBITRAGE OPPORTUNITY - MUST BE CONTEXT-SPECIFIC:
- Explain the unique intersection of [SKILL] + [INDUSTRY] + [BUSINESS MODEL]
- Reference specific industry trends creating this opportunity
- Mention why this combination is underserved in this specific context

GTM STRATEGY - MUST BE INDUSTRY-TAILORED:
- Use acquisition channels specific to reaching [INDUSTRY] decision-makers
- Reference industry events, publications, or communities
- Consider industry-specific sales cycles and decision processes

RISK FACTORS - MUST BE INDUSTRY + SKILL SPECIFIC:
- Include risks specific to this industry-skill combination
- Mention industry-specific regulations, seasonality, or market dynamics
- Consider technology disruptions specific to this niche

**MANDATORY JSON STRUCTURE:**
{
  "niches": [
    {
      "nicheOverview": {
        "name": "MUST contain '${skills[0]}' and '${industries[0]}' - specific service name",
        "summary": "Detailed summary explaining how ${skills[0]} specifically helps ${industries[0]} companies with their unique challenges",
        "whyItFits": "Your ${skills[0]} background aligns with ${industries[0]} industry needs because..."
      },
      "marketDemand": {
        "marketSize": "Specific market size for ${skills[0]} services in ${industries[0]} industry with real data",
        "trend": "growing|plateauing|declining based on actual ${industries[0]} industry trends",
        "willingnessToPay": "${industries[0]} ${input.customerSize} companies typically budget $X-Y for ${skills[0]} services"
      },
      "painPoints": [
        {
          "problem": "Specific ${skills[0]} challenge that ONLY ${industries[0]} companies face",
          "intensity": "High|Medium|Low"
        },
        {
          "problem": "Another ${industries[0]}-specific ${skills[0]} problem with industry jargon",
          "intensity": "High|Medium|Low"
        },
        {
          "problem": "Third ${industries[0]} + ${skills[0]} specific challenge",
          "intensity": "High|Medium|Low"
        }
      ],
      "competitiveLandscape": {
        "competitors": [
          {
            "name": "Actual company name serving ${industries[0]} with ${skills[0]}",
            "description": "What they specifically do for ${industries[0]} market"
          },
          {
            "name": "Second real competitor in ${industries[0]} + ${skills[0]} space",
            "description": "Their specific approach to ${industries[0]} ${skills[0]} challenges"
          }
        ],
        "gapAnalysis": "Specific gaps in ${skills[0]} solutions for ${industries[0]} market",
        "barrierToEntry": "Barriers specific to entering ${industries[0]} with ${skills[0]} services"
      },
      "arbitrageOpportunity": {
        "explanation": "Why the intersection of ${skills[0]} + ${industries[0]} + service model creates unique value",
        "concreteAngle": "Specific positioning for ${skills[0]} in ${industries[0]} context"
      },
      "entryOffers": [
        {
          "positioning": "How to position ${skills[0]} services specifically for ${industries[0]} market",
          "businessModel": "Service-based model tailored to ${industries[0]} buying patterns",
          "pricePoint": "Pricing that reflects ${industries[0]} ${input.customerSize} typical budgets"
        }
      ],
      "gtmStrategy": {
        "primaryChannel": "Acquisition channel specific to reaching ${industries[0]} decision-makers",
        "justification": "Why this channel works best for ${industries[0]} + fits your constraints"
      },
      "scalabilityExit": {
        "scalabilityScore": "High|Medium|Low based on ${industries[0]} market dynamics",
        "exitPotential": "Exit opportunities specific to ${skills[0]} + ${industries[0]} combination"
      },
      "riskFactors": [
        {
          "risk": "Risk specific to ${skills[0]} + ${industries[0]} combination",
          "impact": "High|Medium|Low"
        },
        {
          "risk": "Another ${industries[0]}-specific risk for ${skills[0]} providers",
          "impact": "High|Medium|Low"
        }
      ],
      "scorecard": {
        "marketDemand": "High|Medium|Low based on ${industries[0]} demand for ${skills[0]}",
        "competition": "High|Medium|Low based on ${industries[0]} competitive landscape",
        "easeOfEntry": "High|Medium|Low considering ${industries[0]} barriers",
        "profitability": "High|Medium|Low based on ${industries[0]} pricing norms"
      }
    },
    {
      "nicheOverview": {
        "name": "MUST contain '${skills[1]}' and '${industries[1]}' - specific product name",
        "summary": "Product/Platform opportunity using ${skills[1]} for ${industries[1]} sector",
        "whyItFits": "Explanation focusing on ${skills[1]} expertise in ${industries[1]}"
      },
      "marketDemand": {
        "marketSize": "Real market data for ${skills[1]} products in ${industries[1]}",
        "trend": "growing|plateauing|declining",
        "willingnessToPay": "${industries[1]} ${input.customerSize} SaaS/product pricing norms"
      },
      "painPoints": [
        {
          "problem": "${industries[1]}-specific ${skills[1]} challenge requiring product solution",
          "intensity": "High|Medium|Low"
        },
        {
          "problem": "Another ${industries[1]} organization ${skills[1]} pain point",
          "intensity": "High|Medium|Low"
        },
        {
          "problem": "Third ${industries[1]} + ${skills[1]} product-solvable problem",
          "intensity": "High|Medium|Low"
        }
      ],
      "competitiveLandscape": {
        "competitors": [
          {
            "name": "Real product/platform serving ${industries[1]} ${skills[1]} market",
            "description": "Their specific ${industries[1]} solution"
          },
          {
            "name": "Another actual ${industries[1]} + ${skills[1]} product competitor",
            "description": "Their approach to ${industries[1]} market"
          }
        ],
        "gapAnalysis": "Product gaps in ${skills[1]} solutions for ${industries[1]}",
        "barrierToEntry": "${industries[1]} product market entry barriers"
      },
      "arbitrageOpportunity": {
        "explanation": "Product opportunity at ${skills[1]} + ${industries[1]} intersection",
        "concreteAngle": "Specific product positioning for ${industries[1]} market"
      },
      "entryOffers": [
        {
          "positioning": "Product positioning for ${industries[1]} ${skills[1]} market",
          "businessModel": "Product/Platform/SaaS model for ${industries[1]}",
          "pricePoint": "${industries[1]} SaaS pricing benchmarks"
        }
      ],
      "gtmStrategy": {
        "primaryChannel": "${industries[1]} product distribution strategy",
        "justification": "Why this works for ${industries[1]} product adoption"
      },
      "scalabilityExit": {
        "scalabilityScore": "High|Medium|Low for ${industries[1]} products",
        "exitPotential": "${industries[1]} + ${skills[1]} product exit opportunities"
      },
      "riskFactors": [
        {
          "risk": "${industries[1]} product development risks",
          "impact": "High|Medium|Low"
        },
        {
          "risk": "${industries[1]} market adoption challenges",
          "impact": "High|Medium|Low"
        }
      ],
      "scorecard": {
        "marketDemand": "High|Medium|Low for ${industries[1]} ${skills[1]} products",
        "competition": "High|Medium|Low in ${industries[1]} product space",
        "easeOfEntry": "High|Medium|Low for ${industries[1]} product development",
        "profitability": "High|Medium|Low for ${industries[1]} SaaS models"
      }
    },
    {
      "nicheOverview": {
        "name": "MUST contain '${skills[2]}' + '${skills[0]}' and '${industries[2]}' - consulting name",
        "summary": "Hybrid/Consulting opportunity combining ${skills[2]} + ${skills[0]} for ${industries[2]}",
        "whyItFits": "Skill combination advantage in ${industries[2]} context"
      },
      "marketDemand": {
        "marketSize": "Consulting market data for ${skills[2]} + ${skills[0]} in ${industries[2]}",
        "trend": "growing|plateauing|declining",
        "willingnessToPay": "${industries[2]} ${input.customerSize} consulting rate expectations"
      },
      "painPoints": [
        {
          "problem": "${industries[2]} challenge requiring both ${skills[2]} AND ${skills[0]}",
          "intensity": "High|Medium|Low"
        },
        {
          "problem": "Multi-skill gap in ${industries[2]} that few consultants fill",
          "intensity": "High|Medium|Low"
        },
        {
          "problem": "${industries[2]} strategic challenge needing combined expertise",
          "intensity": "High|Medium|Low"
        }
      ],
      "competitiveLandscape": {
        "competitors": [
          {
            "name": "Consulting firm serving ${industries[2]} with similar skills",
            "description": "Their approach to ${industries[2]} consulting"
          },
          {
            "name": "Independent consultant in ${industries[2]} + these skills",
            "description": "Their positioning in ${industries[2]} market"
          }
        ],
        "gapAnalysis": "Consulting gaps for ${skills[2]} + ${skills[0]} in ${industries[2]}",
        "barrierToEntry": "${industries[2]} consulting market entry requirements"
      },
      "arbitrageOpportunity": {
        "explanation": "Unique value from combining ${skills[2]} + ${skills[0]} for ${industries[2]}",
        "concreteAngle": "Multi-skill consultant positioning in ${industries[2]}"
      },
      "entryOffers": [
        {
          "positioning": "Combined ${skills[2]} + ${skills[0]} consultant for ${industries[2]}",
          "businessModel": "Consulting/Hybrid model for ${industries[2]} market",
          "pricePoint": "${industries[2]} consulting rates for specialized expertise"
        }
      ],
      "gtmStrategy": {
        "primaryChannel": "${industries[2]} consulting acquisition strategy",
        "justification": "Best approach for ${industries[2]} consulting sales"
      },
      "scalabilityExit": {
        "scalabilityScore": "High|Medium|Low for ${industries[2]} consulting",
        "exitPotential": "Exit opportunities for ${industries[2]} consulting practice"
      },
      "riskFactors": [
        {
          "risk": "${industries[2]} consulting market risks",
          "impact": "High|Medium|Low"
        },
        {
          "risk": "Multi-skill positioning challenges in ${industries[2]}",
          "impact": "High|Medium|Low"
        }
      ],
      "scorecard": {
        "marketDemand": "High|Medium|Low for specialized ${industries[2]} consulting",
        "competition": "High|Medium|Low in ${industries[2]} consulting space",
        "easeOfEntry": "High|Medium|Low for ${industries[2]} consulting",
        "profitability": "High|Medium|Low for ${industries[2]} specialized rates"
      }
    }
  ],
  "recommendedNiche": 0,
  "recommendationReason": "Clear explanation of why recommended niche is best for this specific client profile",
  "comparisonMatrix": {
    "criteria": ["Market Demand", "Competition Level", "Skill Fit", "Budget Alignment", "Time to Revenue"],
    "scores": [
      { "nicheIndex": 0, "scores": { "marketDemand": 85, "competitionLevel": 40, "skillFit": 95, "budgetAlignment": 80, "timeToRevenue": 70 }, "totalScore": 74 },
      { "nicheIndex": 1, "scores": { "marketDemand": 75, "competitionLevel": 60, "skillFit": 80, "budgetAlignment": 90, "timeToRevenue": 85 }, "totalScore": 78 },
      { "nicheIndex": 2, "scores": { "marketDemand": 95, "competitionLevel": 80, "skillFit": 70, "budgetAlignment": 60, "timeToRevenue": 50 }, "totalScore": 71 }
    ]
  }
}

**VALIDATION CHECKLIST:**
Before generating response, verify each niche has:
1. Industry-specific market size and trends with real data
2. Pain points that could ONLY apply to this industry-skill combination
3. Named competitors actually serving this specific market
4. Arbitrage explanation specific to this context
5. GTM strategy tailored to this industry's buying patterns
6. Risk factors specific to this industry-skill combination
7. Pricing that reflects this industry's typical budgets
8. All sections customized for the specific skill-industry-business model combination

**FINAL VALIDATION BEFORE RESPONSE:**
1. Check that Niche 1 uses "${skills[0]}" + "${industries[0]}" throughout ALL sections
2. Check that Niche 2 uses "${skills[1]}" + "${industries[1]}" throughout ALL sections
3. Check that Niche 3 uses "${skills[2]}+${skills[0]}" + "${industries[2]}" throughout ALL sections
4. Verify all three have different business models (Service vs Product vs Consulting)
5. Ensure no two niches have similar market data, competitors, or pain points
6. Confirm each section is contextually relevant to its specific industry-skill combination

Return ONLY the JSON object with no additional text, markdown formatting, or code blocks.
`;
  }

private generateFallbackMultiNicheReport(input: NicheResearchInput): Omit<MultiNicheReport, 'tokensUsed' | 'generationTime'> {
  console.log('🔄 Generating fallback multi-niche report with diversification');
  
  // Get available skills and industries for diversification
  const skills = input.skills || ['Business Development', 'Marketing', 'Customer Service'];
  const industries = input.industries || ['Technology', 'Healthcare', 'Professional Services'];
  
  // Create 3 distinct niches using different skill-industry combinations
  const fallbackNiche1: GeneratedNicheReport = {
    ...this.generateFallbackReport(input),
    tokensUsed: 0,
    generationTime: 0,
    nicheOverview: {
      name: `${skills[0] || 'Business Development'} Services for ${industries[0] || 'Technology'} ${input.customerSize === 'smb' ? 'SMBs' : 'Companies'}`,
      summary: `A service-based ${input.marketType.replace('-', ' ')} opportunity focused on helping ${industries[0] || 'technology'} ${input.customerSize} businesses with ${(skills[0] || 'business development').toLowerCase()}. This high-touch approach leverages your primary expertise for immediate revenue.`,
      whyItFits: `Your ${skills[0] || 'business development'} background combined with ${industries[0] || 'technology'} market knowledge positions you well. The service-delivery model fits your ${input.budget} budget and ${input.riskAppetite} risk tolerance.`
    }
  };
  
  const fallbackNiche2: GeneratedNicheReport = {
    ...this.generateFallbackReport(input),
    tokensUsed: 0,
    generationTime: 0,
    nicheOverview: {
      name: `${skills[1] || 'Marketing'} Automation Platform for ${industries[1] || 'Healthcare'} Providers`,
      summary: `A product-focused ${input.marketType.replace('-', ' ')} solution that automates ${(skills[1] || 'marketing').toLowerCase()} processes for ${industries[1] || 'healthcare'} organizations. This scalable SaaS approach targets recurring revenue.`,
      whyItFits: `Your ${skills[1] || 'marketing'} skills enable you to understand and solve automation challenges in ${industries[1] || 'healthcare'}. The product approach aligns with ${input.primaryObjective} objectives and scales beyond personal time.`
    },
    gtmStrategy: {
      primaryChannel: 'Content Marketing + Direct Outreach',
      justification: `Product-based offering benefits from educational content marketing to demonstrate value, with direct outreach to ${industries[1] || 'healthcare'} decision makers for faster initial traction.`
    },
    entryOffers: [
      {
        positioning: `The specialized ${skills[1] || 'marketing'} automation platform built specifically for ${industries[1] || 'healthcare'}`,
        businessModel: 'SaaS Subscription with onboarding fees',
        pricePoint: input.customerSize === 'enterprise' ? '$500-2000/month + setup' : '$99-500/month + setup'
      }
    ],
    arbitrageOpportunity: {
      explanation: `Generic automation tools don't understand ${industries[1] || 'healthcare'} workflows. Your ${skills[1] || 'marketing'} expertise combined with industry-specific knowledge creates a compelling niche solution.`,
      concreteAngle: `"The only ${skills[1]?.toLowerCase() || 'marketing'} automation built by ${industries[1] || 'healthcare'} experts for ${industries[1] || 'healthcare'} teams" - position as the industry specialist.`
    }
  };
  
  const fallbackNiche3: GeneratedNicheReport = {
    ...this.generateFallbackReport(input),
    tokensUsed: 0,
    generationTime: 0,
    nicheOverview: {
      name: `Cross-Industry ${skills[0] || 'Business Development'} + ${skills[2] || 'Data Analysis'} Consulting Hub`,
      summary: `A hybrid consulting platform that combines ${(skills[0] || 'business development').toLowerCase()} with ${(skills[2] || 'data analysis').toLowerCase()} to help companies across multiple industries make data-driven growth decisions. This consulting marketplace approach maximizes market reach.`,
      whyItFits: `Your unique combination of ${skills[0] || 'business development'} and ${skills[2] || 'data analysis'} creates a differentiated consulting offering. The cross-industry approach maximizes your addressable market while leveraging skill synergies.`
    },
    gtmStrategy: {
      primaryChannel: 'Strategic Partnerships + Referral Network',
      justification: `Cross-industry consulting benefits from partnerships with complementary service providers and strong referral networks to access diverse client bases efficiently.`
    },
    entryOffers: [
      {
        positioning: 'Strategic growth consulting that bridges business insight with data-driven recommendations',
        businessModel: 'Retainer + Success fees',
        pricePoint: input.customerSize === 'enterprise' ? '$5k-15k/month retainer' : '$2k-8k/month retainer'
      }
    ],
    arbitrageOpportunity: {
      explanation: `Most consultants focus on either business strategy OR data analysis. Your combination creates a unique value proposition that bridges the gap between strategic vision and analytical execution.`,
      concreteAngle: `"The only consultant who shows you what to do AND proves it with data" - position as the analytical strategist for ${input.customerSize} companies serious about growth.`
    },
    marketDemand: {
      marketSize: input.budget === '<10k' ? '$2-5B cross-industry consulting market' : '$10-25B strategic consulting market',
      trend: 'growing',
      willingnessToPay: 'High - companies value data-driven strategic guidance'
    }
  };

  return {
    niches: [fallbackNiche1, fallbackNiche2, fallbackNiche3],
    recommendedNiche: 0,
    recommendationReason: `Based on your ${input.primaryObjective} objective and ${input.riskAppetite} risk appetite, the service-based approach leverages your core expertise with lowest execution risk while maintaining strong revenue potential within your ${input.budget} budget.`,
    comparisonMatrix: {
      criteria: ["Market Demand", "Competition Level", "Skill Fit", "Budget Alignment", "Time to Revenue"],
      scores: [
        {
          nicheIndex: 0,
          scores: { 
            marketDemand: 85, 
            competitionLevel: 40, 
            skillFit: 95, 
            budgetAlignment: 90, 
            timeToRevenue: 80 
          },
          totalScore: 78
        },
        {
          nicheIndex: 1,
          scores: { 
            marketDemand: 90, 
            competitionLevel: 60, 
            skillFit: 80, 
            budgetAlignment: 70, 
            timeToRevenue: 60 
          },
          totalScore: 72
        },
        {
          nicheIndex: 2,
          scores: { 
            marketDemand: 75, 
            competitionLevel: 50, 
            skillFit: 85, 
            budgetAlignment: 85, 
            timeToRevenue: 70 
          },
          totalScore: 73
        }
      ]
    }
  };
}


  private generateFallbackReport(input: NicheResearchInput): Omit<GeneratedNicheReport, 'tokensUsed' | 'generationTime'> {
    console.log('🔄 Generating fallback niche report');
    
    // Create a reasonable fallback based on user inputs
    const primarySkill = input.skills?.[0] || 'Business Development';
    const nicheName = `${primarySkill} for ${input.customerSize === 'smb' ? 'Small Businesses' : 'Enterprises'}`;
    
    return {
      nicheOverview: {
        name: nicheName,
        summary: `A ${input.marketType.replace('-', ' ')} opportunity focused on helping ${input.customerSize} businesses with ${primarySkill.toLowerCase()}. This niche aligns with your ${input.primaryObjective} objective and ${input.riskAppetite} risk tolerance.`,
        whyItFits: `Your background in ${input.skills?.join(', ') || 'business'} positions you well for this market. The ${input.budget} budget is sufficient for entry, and the ${input.marketType} space offers good growth potential.`
      },
      marketDemand: {
        marketSize: input.budget === '250k+' ? '$15B+ market' : input.budget === '50k-250k' ? '$5-15B market' : '$1-5B market',
        trend: 'growing',
        willingnessToPay: input.customerSize === 'enterprise' ? 'High - $10k-100k+ budgets' : 'Medium - $1k-10k budgets'
      },
      painPoints: [
        {
          problem: `Lack of specialized ${primarySkill.toLowerCase()} expertise`,
          intensity: 'High'
        },
        {
          problem: 'Difficulty finding reliable service providers',
          intensity: 'Medium'
        },
        {
          problem: 'Cost of hiring full-time specialists',
          intensity: 'High'
        }
      ],
      competitiveLandscape: {
        competitors: [
          {
            name: 'Large Consulting Firms',
            description: 'Expensive, slow-moving traditional consultants'
          },
          {
            name: 'Freelance Specialists',
            description: 'Individual contractors with limited capacity'
          },
          {
            name: 'Software Solutions',
            description: 'Generic tools that lack personalized expertise'
          }
        ],
        gapAnalysis: 'Market gap exists for mid-tier, specialized services that combine expertise with accessibility and reasonable pricing.',
        barrierToEntry: input.budget === '<10k' ? 'Low' : input.budget === '250k+' ? 'High' : 'Medium'
      },
      arbitrageOpportunity: {
        explanation: `Position between expensive enterprise solutions and cheap DIY options. Leverage your ${primarySkill.toLowerCase()} expertise to provide premium value at accessible pricing.`,
        concreteAngle: `"Enterprise-quality ${primarySkill.toLowerCase()} for growing businesses" - bridge the gap between high-end consulting and basic services.`
      },
      entryOffers: [
        {
          positioning: `Specialized ${primarySkill} consultant for ${input.customerSize} businesses`,
          businessModel: input.monetizationPreference || (input.primaryObjective === 'cashflow' ? 'Project-based fees' : 'Subscription model'),
          pricePoint: input.customerSize === 'enterprise' ? '$5k-25k per project' : '$1k-5k per project'
        }
      ],
      gtmStrategy: {
        primaryChannel: input.acquisitionChannels?.[0] || 'LinkedIn outreach and content marketing',
        justification: `Aligns with your ${input.timeCommitment || '20-30'} hours/week availability and leverages your professional network for ${input.customerSize} targeting.`
      },
      scalabilityExit: {
        scalabilityScore: input.primaryObjective === 'equity-exit' ? 'High' : input.primaryObjective === 'lifestyle' ? 'Low' : 'Medium',
        exitPotential: input.primaryObjective === 'equity-exit' ? 'Strategic acquisition opportunity within 3-5 years' : 'Focus on cash generation rather than exit'
      },
      riskFactors: [
        {
          risk: 'Market saturation in core service area',
          impact: 'Medium'
        },
        {
          risk: 'Economic downturn affecting business spending',
          impact: 'High'
        },
        {
          risk: 'Difficulty scaling beyond personal capacity',
          impact: input.teamSize === 'solo' ? 'High' : 'Medium'
        }
      ],
      scorecard: {
        marketDemand: 'High',
        competition: input.riskAppetite === 'low' ? 'Low' : 'Medium',
        easeOfEntry: input.budget === '<10k' ? 'High' : 'Medium',
        profitability: input.primaryObjective === 'cashflow' ? 'High' : 'Medium'
      }
    };
  }

 private generateHTMLReport(report: GeneratedNicheReport, metadata: NicheReportMetadata): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.nicheOverview.name} - Recommended Niche Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 25px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .section h2 { color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .tag { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .score { font-weight: bold; font-size: 18px; }
        .high { color: #28a745; }
        .medium { color: #ffc107; }
        .low { color: #dc3545; }
        .recommended-badge { background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
        ul { padding-left: 20px; }
        .competitor { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.nicheOverview.name}</h1>
        <div class="recommended-badge">⭐ RECOMMENDED NICHE</div>
        <p><strong>Multi-Niche Research Report - Top Recommendation</strong></p>
        <p>Generated: ${new Date(metadata.generatedAt).toLocaleDateString()}</p>
        ${metadata.recommendationReason ? `<p><em>"${metadata.recommendationReason}"</em></p>` : ''}
        <div>
            <span class="tag">${metadata.primaryObjective}</span>
            <span class="tag">${metadata.marketType}</span>
            <span class="tag">${metadata.budget}</span>
            ${metadata.totalNiches ? `<span class="tag">1 of ${metadata.totalNiches} niches</span>` : ''}
        </div>
    </div>

    <div class="section">
        <h2>1. Niche Overview</h2>
        <p><strong>Summary:</strong> ${report.nicheOverview.summary}</p>
        <p><strong>Why This Fits:</strong> ${report.nicheOverview.whyItFits}</p>
    </div>

    <div class="section">
        <h2>2. Market Demand</h2>
        <p><strong>Market Size:</strong> ${report.marketDemand.marketSize}</p>
        <p><strong>Trend:</strong> <span class="tag ${report.marketDemand.trend === 'growing' ? 'high' : 'medium'}">${report.marketDemand.trend}</span></p>
        <p><strong>Willingness to Pay:</strong> ${report.marketDemand.willingnessToPay}</p>
    </div>

    <div class="section">
        <h2>3. Customer Pain Points</h2>
        <ul>
            ${report.painPoints.map(point => 
              `<li><strong>${point.problem}</strong> - <span class="${point.intensity.toLowerCase()}">${point.intensity} intensity</span></li>`
            ).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>4. Competitive Landscape</h2>
        <p><strong>Barrier to Entry:</strong> <span class="tag ${report.competitiveLandscape.barrierToEntry.toLowerCase()}">${report.competitiveLandscape.barrierToEntry}</span></p>
        <h3>Key Competitors:</h3>
        ${report.competitiveLandscape.competitors.map(comp => 
          `<div class="competitor"><strong>${comp.name}:</strong> ${comp.description}</div>`
        ).join('')}
        <p><strong>Gap Analysis:</strong> ${report.competitiveLandscape.gapAnalysis}</p>
    </div>

    <div class="section">
        <h2>5. Arbitrage Opportunity</h2>
        <p><strong>Explanation:</strong> ${report.arbitrageOpportunity.explanation}</p>
        <p><strong>Concrete Angle:</strong> ${report.arbitrageOpportunity.concreteAngle}</p>
    </div>

    <div class="section">
        <h2>6. Entry Offers</h2>
        ${report.entryOffers.map(offer => 
          `<div style="margin-bottom: 15px;">
            <p><strong>Positioning:</strong> ${offer.positioning}</p>
            <p><strong>Business Model:</strong> ${offer.businessModel}</p>
            <p><strong>Price Point:</strong> ${offer.pricePoint}</p>
          </div>`
        ).join('')}
    </div>

    <div class="section">
        <h2>7. Go-to-Market Strategy</h2>
        <p><strong>Primary Channel:</strong> ${report.gtmStrategy.primaryChannel}</p>
        <p><strong>Justification:</strong> ${report.gtmStrategy.justification}</p>
    </div>

    <div class="section">
        <h2>8. Scalability & Exit Potential</h2>
        <p><strong>Scalability Score:</strong> <span class="tag ${report.scalabilityExit.scalabilityScore.toLowerCase()}">${report.scalabilityExit.scalabilityScore}</span></p>
        <p><strong>Exit Potential:</strong> ${report.scalabilityExit.exitPotential}</p>
    </div>

    <div class="section">
        <h2>9. Risk Factors</h2>
        <ul>
            ${report.riskFactors.map(risk => 
              `<li><strong>${risk.risk}</strong> - <span class="${risk.impact.toLowerCase()}">${risk.impact} impact</span></li>`
            ).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>10. Opportunity Scorecard</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Market Demand:</strong> <span class="score ${report.scorecard.marketDemand.toLowerCase()}">${report.scorecard.marketDemand}</span></div>
            <div><strong>Competition:</strong> <span class="score ${report.scorecard.competition.toLowerCase()}">${report.scorecard.competition}</span></div>
            <div><strong>Ease of Entry:</strong> <span class="score ${report.scorecard.easeOfEntry.toLowerCase()}">${report.scorecard.easeOfEntry}</span></div>
            <div><strong>Profitability:</strong> <span class="score ${report.scorecard.profitability.toLowerCase()}">${report.scorecard.profitability}</span></div>
        </div>
    </div>

    <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
        <p><strong>Report Statistics:</strong></p>
        <p>Tokens Used: ${metadata.tokensUsed} | Generation Time: ${metadata.generationTime}ms</p>
        <p>Match Score: ${metadata.topNiches?.find(n => n.isRecommended)?.matchScore || metadata.topNiches?.[0]?.matchScore || 'N/A'}/100</p>
        ${metadata.totalNiches && metadata.totalNiches > 1 ? `<p><em>This is the recommended niche from ${metadata.totalNiches} analyzed opportunities</em></p>` : ''}
    </div>
</body>
</html>
`;
}


  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private generateCacheKey(input: NicheResearchInput): string {
    // Create a unique cache key based on critical input parameters
    const keyParts = [
      input.primaryObjective,
      input.riskAppetite,
      input.marketType,
      input.customerSize,
      input.budget,
      input.timeCommitment || 'any',
      input.teamSize || 'any',
      input.geographicFocus || 'any',
      (input.skills || []).sort().join(','),
      (input.industries || []).sort().join(','),
      (input.excludedIndustries || []).sort().join(','),
      input.monetizationPreference || 'any',
      (input.acquisitionChannels || []).sort().join(','),
      (input.validationData || []).sort().join(','),
      input.competitionPreference || 'any',
      input.scalabilityPreference || 'any'
    ];

    const baseKey = keyParts.join('|');
    
    // Create a hash of the key to keep it manageable
    let hash = 0;
    for (let i = 0; i < baseKey.length; i++) {
      const char = baseKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `niche_research:${Math.abs(hash)}`;
  }

  // Analytics method for tracking usage
  async getNicheAnalytics(userId: string, workspaceId?: string, timeframe: 'week' | 'month' | 'quarter' = 'month') {
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
        type: 'niche_research',
        created_at: {
          gte: dateFilter
        }
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const reports = await prisma.deliverable.findMany({
        where: whereClause,
        select: {
          metadata: true,
          created_at: true
        }
      });

      const totalReports = reports.length;
      
      // Analyze objectives distribution
      const objectiveDistribution = reports.reduce((acc, report) => {
        const metadata = report.metadata as NicheReportMetadata;
        const objective = metadata?.primaryObjective || 'unknown';
        acc[objective] = (acc[objective] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Analyze market types
      const marketTypeDistribution = reports.reduce((acc, report) => {
        const metadata = report.metadata as NicheReportMetadata;
        const marketType = metadata?.marketType || 'unknown';
        acc[marketType] = (acc[marketType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Analyze budget ranges
      const budgetDistribution = reports.reduce((acc, report) => {
        const metadata = report.metadata as NicheReportMetadata;
        const budget = metadata?.budget || 'unknown';
        acc[budget] = (acc[budget] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate average metrics
      const averageGenerationTime = reports.reduce((sum, report) => {
        const metadata = report.metadata as NicheReportMetadata;
        return sum + (metadata?.generationTime || 0);
      }, 0) / totalReports || 0;

      const totalTokensUsed = reports.reduce((sum, report) => {
        const metadata = report.metadata as NicheReportMetadata;
        return sum + (metadata?.tokensUsed || 0);
      }, 0);

      const averageMatchScore = reports.reduce((sum, report) => {
        const metadata = report.metadata as NicheReportMetadata;
        return sum + (metadata?.topNiches?.[0]?.matchScore || 0);
      }, 0) / totalReports || 0;

      return {
        totalReports,
        averageGenerationTime: Math.round(averageGenerationTime),
        totalTokensUsed,
        averageMatchScore: Math.round(averageMatchScore),
        objectiveDistribution,
        marketTypeDistribution,
        budgetDistribution,
        timeframe
      };
    } catch (error) {
      console.error('Error generating niche analytics:', error);
      throw error;
    }
  }

  // Update method for modifying existing reports
  async updateNicheReport(
    userId: string, 
    reportId: string, 
    updates: { title?: string; tags?: string[] }
  ) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const existingReport = await prisma.deliverable.findFirst({
        where: {
          id: reportId,
          user_id: userId,
          type: 'niche_research'
        }
      });

      if (!existingReport) {
        throw new Error('Niche report not found');
      }

      const currentMetadata = existingReport.metadata as NicheReportMetadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        updatedAt: new Date().toISOString()
      };

      const updated = await prisma.deliverable.update({
        where: { id: reportId },
        data: {
          title: updates.title || existingReport.title,
          tags: updates.tags || existingReport.tags,
          metadata: updatedMetadata,
          updated_at: new Date()
        }
      });

      return updated;
    } catch (error) {
      console.error('Error updating niche report:', error);
      throw error;
    }
  }
}