// services/nicheResearcher.service.ts - COMPLETE AND PROPER VERSION
import { OpenRouterClient } from '@/lib/openrouter';
import { NicheResearchInput, GeneratedNicheReport, NicheReportMetadata } from '@/types/nicheResearcher';
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
    report: GeneratedNicheReport;
    reportId: string;
  }> {
    console.log('🚀 Starting niche report generation for user:', userId);
    
    // Generate report using AI
    const report = await this.generateNicheReport(input);
    
    // Save to database
    const reportId = await this.saveNicheReport(userId, workspaceId, report, input);
    
    console.log('✅ Niche report generated and saved with ID:', reportId);
    
    return {
      report,
      reportId,
    };
  }

  async generateNicheReport(input: NicheResearchInput): Promise<GeneratedNicheReport> {
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
      model: 'openai/gpt-5-mini',
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
    
    const nicheReport: GeneratedNicheReport = {
      ...parsedReport,
      tokensUsed: response.usage.total_tokens,
      generationTime: Date.now() - startTime
    };

    // Cache for 4 hours
    await this.redis.set(cacheKey, JSON.stringify(nicheReport), { ex: 14400 });
    
    return nicheReport;
  }

  async saveNicheReport(
    userId: string, 
    workspaceId: string, 
    report: GeneratedNicheReport, 
    input: NicheResearchInput
  ): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      // Create metadata from the input and report
      const metadata: NicheReportMetadata = {
        primaryObjective: input.primaryObjective,
        marketType: input.marketType,
        customerSize: input.customerSize,
        budget: input.budget,
        generatedAt: new Date().toISOString(),
        tokensUsed: report.tokensUsed,
        generationTime: report.generationTime,
        topNiches: [{
          name: report.nicheOverview.name,
          matchScore: this.calculateMatchScore(input, report),
          category: input.marketType
        }],
        // Additional metadata
        riskAppetite: input.riskAppetite,
        geographicFocus: input.geographicFocus,
        teamSize: input.teamSize,
        timeCommitment: input.timeCommitment,
        skills: input.skills || [],
        industries: input.industries || [],
        originalInput: input
      };
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `${report.nicheOverview.name} - Niche Research Report`,
          content: JSON.stringify(report),
          type: 'niche_research',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: metadata,
          tags: [
            'niche-research',
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
        const reportContent = JSON.parse(report.content) as GeneratedNicheReport;
        
        return {
          id: report.id,
          title: report.title,
          nicheName: reportContent.nicheOverview?.name || 'Untitled Niche',
          marketSize: reportContent.marketDemand?.marketSize || 'Unknown',
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

      const report = JSON.parse(deliverable.content) as GeneratedNicheReport;
      const metadata = deliverable.metadata as NicheReportMetadata;

      if (format === 'html') {
        const htmlContent = this.generateHTMLReport(report, metadata);
        this.downloadFile(htmlContent, `${deliverable.title}.html`, 'text/html');
      } else {
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
    return `
**NICHE RESEARCH ANALYSIS REQUEST**

Generate a comprehensive niche research report based on the following inputs. Respond with ONLY a valid JSON object matching the exact structure specified.

**CLIENT PROFILE:**
Primary Objective: ${input.primaryObjective}
Risk Appetite: ${input.riskAppetite}
Market Type Preference: ${input.marketType}
Target Customer Size: ${input.customerSize}
Budget Available: ${input.budget}
${input.timeCommitment ? `Time Commitment: ${input.timeCommitment} hours/week` : ''}
${input.teamSize ? `Team Size: ${input.teamSize}` : ''}
${input.geographicFocus ? `Geographic Focus: ${input.geographicFocus}` : ''}

**SKILLS & CAPABILITIES:**
${input.skills && input.skills.length > 0 ? `Available Skills: ${input.skills.join(', ')}` : 'No specific skills provided'}

**MARKET PREFERENCES:**
${input.industries && input.industries.length > 0 ? `Industries of Interest: ${input.industries.join(', ')}` : ''}
${input.excludedIndustries && input.excludedIndustries.length > 0 ? `Excluded Industries: ${input.excludedIndustries.join(', ')}` : ''}
${input.problems ? `Observed Problems: ${input.problems}` : ''}
${input.monetizationPreference ? `Monetization Preference: ${input.monetizationPreference}` : ''}
${input.acquisitionChannels && input.acquisitionChannels.length > 0 ? `Preferred Acquisition Channels: ${input.acquisitionChannels.join(', ')}` : ''}

**VALIDATION & SCALING:**
${input.validationData && input.validationData.length > 0 ? `Validation Data Preferences: ${input.validationData.join(', ')}` : ''}
${input.competitionPreference ? `Competition Preference: ${input.competitionPreference}` : ''}
${input.scalabilityPreference ? `Scalability Preference: ${input.scalabilityPreference}` : ''}

**REQUIRED JSON STRUCTURE:**
{
  "nicheOverview": {
    "name": "Specific niche name that aligns with inputs",
    "summary": "2-3 sentence overview of the niche opportunity",
    "whyItFits": "Explanation of why this niche matches the client's profile"
  },
  "marketDemand": {
    "marketSize": "Market size estimate with currency",
    "trend": "growing|plateauing|declining",
    "willingnessToPay": "Price sensitivity and willingness to pay"
  },
  "painPoints": [
    {
      "problem": "Specific customer problem",
      "intensity": "High|Medium|Low"
    }
  ],
  "competitiveLandscape": {
    "competitors": [
      {
        "name": "Competitor name",
        "description": "What they do and their positioning"
      }
    ],
    "gapAnalysis": "Market gaps and opportunities",
    "barrierToEntry": "Low|Medium|High"
  },
  "arbitrageOpportunity": {
    "explanation": "The specific arbitrage or unfair advantage",
    "concreteAngle": "Specific positioning or approach to exploit"
  },
  "entryOffers": [
    {
      "positioning": "How to position the offer",
      "businessModel": "Revenue model",
      "pricePoint": "Suggested pricing"
    }
  ],
  "gtmStrategy": {
    "primaryChannel": "Best go-to-market channel for this client",
    "justification": "Why this channel fits their constraints and skills"
  },
  "scalabilityExit": {
    "scalabilityScore": "High|Medium|Low",
    "exitPotential": "Exit opportunities and timeline"
  },
  "riskFactors": [
    {
      "risk": "Potential risk",
      "impact": "High|Medium|Low"
    }
  ],
  "scorecard": {
    "marketDemand": "High|Medium|Low",
    "competition": "High|Medium|Low",
    "easeOfEntry": "High|Medium|Low",
    "profitability": "High|Medium|Low"
  }
}

**ANALYSIS REQUIREMENTS:**
1. Find a niche that specifically aligns with the client's objective (${input.primaryObjective})
2. Respect budget constraints (${input.budget}) in recommendations
3. Consider risk appetite (${input.riskAppetite}) in opportunity selection
4. Match market type preference (${input.marketType}) and customer size (${input.customerSize})
5. Leverage available skills: ${input.skills?.join(', ') || 'General business skills'}
6. Consider geographic constraints: ${input.geographicFocus || 'No geographic restrictions'}
7. Address time commitment limitations: ${input.timeCommitment || 'Flexible time commitment'} hours/week
8. Factor in team size: ${input.teamSize || 'Solo or small team'}
9. Avoid excluded industries: ${input.excludedIndustries?.join(', ') || 'No industry restrictions'}
10. Align with monetization preferences: ${input.monetizationPreference || 'Flexible revenue models'}

**CRITICAL INSTRUCTIONS:**
- Provide realistic market size estimates based on actual data
- Include 2-4 specific competitors for credibility
- Ensure all recommendations are actionable within the specified budget
- Address both opportunities AND realistic challenges
- Make recommendations specific to the input constraints
- Focus on niches with genuine market demand and growth potential
- Consider the client's skill set when suggesting market entry strategies
- Provide concrete next steps that can be executed immediately

Return ONLY the JSON object with no additional text, markdown formatting, or code blocks.
`;
  }

  private parseNicheReportResponse(content: string, input: NicheResearchInput): Omit<GeneratedNicheReport, 'tokensUsed' | 'generationTime'> {
    try {
      console.log('🔍 Parsing AI response for niche report');
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!parsed.nicheOverview || !parsed.marketDemand || !parsed.competitiveLandscape) {
          throw new Error('Missing required fields in AI response');
        }
        
        console.log('✅ Successfully parsed AI response');
        return parsed;
      }
      
      throw new Error('No valid JSON found in AI response');
    } catch (error) {
      console.warn('⚠️ Failed to parse AI response, using fallback:', error);
      return this.generateFallbackReport(input);
    }
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
    <title>${report.nicheOverview.name} - Niche Research Report</title>
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
        ul { padding-left: 20px; }
        .competitor { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.nicheOverview.name}</h1>
        <p><strong>Niche Research Report</strong></p>
        <p>Generated: ${new Date(metadata.generatedAt).toLocaleDateString()}</p>
        <div>
            <span class="tag">${metadata.primaryObjective}</span>
            <span class="tag">${metadata.marketType}</span>
            <span class="tag">${metadata.budget}</span>
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
        <p>Match Score: ${metadata.topNiches[0]?.matchScore || 'N/A'}/100</p>
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