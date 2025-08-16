// services/pricingCalculator.service.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { PricingCalculatorInput, GeneratedPricingPackage } from '@/types/pricingCalculator';
import { Redis } from '@upstash/redis';

export class PricingCalculatorService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  async generatePricingPackage(input: PricingCalculatorInput): Promise<GeneratedPricingPackage> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(input);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    // Calculate core pricing results
    const baseCalculations = this.calculateBasePricing(input);
    
    // Build AI enhancement prompt
    const prompt = this.buildPricingStrategyPrompt(input, baseCalculations);
    
    // Generate enhanced strategy with AI
    const response = await this.openRouterClient.complete({
      model: 'anthropic/claude-3-sonnet',
      messages: [
        {
          role: 'system',
          content: `You are an expert pricing strategist and business consultant specializing in AI services and consulting. You understand value-based pricing, market positioning, and negotiation strategies. Generate comprehensive pricing packages that help consultants position their services effectively and maximize their value capture.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const enhancedResults = this.parseAIResponse(response.content, input, baseCalculations);
    
    const pricingPackage: GeneratedPricingPackage = {
      ...enhancedResults,
      tokensUsed: response.usage.total_tokens,
      generationTime: Date.now() - startTime
    };

    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(pricingPackage), { ex: 3600 });
    
    return pricingPackage;
  }

  private calculateBasePricing(input: PricingCalculatorInput) {
    const monthlySavings = input.annualSavings / 12;
    const monthlyHours = (input.hoursPerWeek * 4.33); // Average weeks per month
    
    // Base retainer calculation
    let baseRetainer = (monthlySavings * input.roiMultiple) / 100;
    
    // Adjust for hours if rate would be unreasonable
    const impliedHourlyRate = baseRetainer / monthlyHours;
    const minHourlyRate = 50; // Minimum viable rate
    const maxHourlyRate = 500; // Maximum reasonable rate for most services
    
    if (impliedHourlyRate < minHourlyRate) {
      baseRetainer = monthlyHours * minHourlyRate;
    } else if (impliedHourlyRate > maxHourlyRate) {
      baseRetainer = monthlyHours * maxHourlyRate;
    }
    
    // Apply risk adjustments
    const riskFactor = this.calculateRiskFactor(input);
    const adjustedRetainer = baseRetainer * riskFactor;
    
    const netSavings = monthlySavings - adjustedRetainer;
    const roiPercentage = adjustedRetainer > 0 ? (netSavings / adjustedRetainer) * 100 : 0;
    
    return {
      monthlySavings,
      recommendedRetainer: adjustedRetainer,
      netSavings,
      roiPercentage,
      baseHourlyRate: adjustedRetainer / monthlyHours,
      monthlyHours,
      riskFactor
    };
  }

  private calculateRiskFactor(input: PricingCalculatorInput): number {
    let factor = 1.0;
    
    // Experience level adjustment
    const experienceMultipliers = {
      beginner: 0.8,
      intermediate: 1.0,
      expert: 1.2,
      premium: 1.5
    };
    factor *= experienceMultipliers[input.experienceLevel || 'intermediate'];
    
    // Delivery risk adjustment
    const riskMultipliers = {
      low: 1.0,
      medium: 1.1,
      high: 1.25
    };
    factor *= riskMultipliers[input.deliveryRisk || 'medium'];
    
    // Urgency premium
    const urgencyMultipliers = {
      low: 1.0,
      medium: 1.05,
      high: 1.15
    };
    factor *= urgencyMultipliers[input.clientUrgency || 'medium'];
    
    // Relationship discount/premium
    const relationshipMultipliers = {
      new: 1.0,
      existing: 0.95,
      referral: 0.9,
      strategic: 1.1
    };
    factor *= relationshipMultipliers[input.relationshipType || 'new'];
    
    // Market demand adjustment
    const demandMultipliers = {
      low: 0.9,
      medium: 1.0,
      high: 1.1
    };
    factor *= demandMultipliers[input.marketDemand || 'medium'];
    
    return factor;
  }

  private buildPricingStrategyPrompt(input: PricingCalculatorInput, baseCalc: any): string {
    return `
    PRICING STRATEGY DEVELOPMENT REQUEST

    CLIENT & PROJECT CONTEXT:
    - Client: ${input.clientName || 'Unnamed Client'}
    - Project: ${input.projectName || 'AI Services Project'}
    - Industry: ${input.industry || 'Not specified'}
    - Service Type: ${input.serviceType || 'AI Consulting'}
    - Project Duration: ${input.projectDuration || 6} months
    
    CALCULATED PRICING:
    - Annual Savings for Client: $${input.annualSavings.toLocaleString()}
    - Monthly Savings: $${baseCalc.monthlySavings.toLocaleString()}
    - Recommended Monthly Retainer: $${baseCalc.recommendedRetainer.toLocaleString()}
    - Client Net Savings: $${baseCalc.netSavings.toLocaleString()}
    - Client ROI: ${baseCalc.roiPercentage.toFixed(1)}%
    - Implied Hourly Rate: $${baseCalc.baseHourlyRate.toFixed(0)}
    - Monthly Hours: ${baseCalc.monthlyHours.toFixed(0)}
    
    CONTEXT FACTORS:
    - Experience Level: ${input.experienceLevel || 'intermediate'}
    - Competitive Advantage: ${input.competitiveAdvantage || 'medium'}
    - Client Urgency: ${input.clientUrgency || 'medium'}
    - Relationship Type: ${input.relationshipType || 'new'}
    - Delivery Risk: ${input.deliveryRisk || 'medium'}
    - Payment Terms: ${input.paymentTerms || 'monthly'}
    - Guarantee Offered: ${input.guaranteeOffered ? 'Yes' : 'No'}
    - Market Demand: ${input.marketDemand || 'medium'}
    - Competition Level: ${input.competitionLevel || 'medium'}

    DELIVERABLE REQUIREMENTS:
    Generate a comprehensive pricing strategy package in JSON format:

    {
      "calculations": {
        "monthlySavings": ${baseCalc.monthlySavings},
        "recommendedRetainer": ${baseCalc.recommendedRetainer},
        "netSavings": ${baseCalc.netSavings},
        "roiPercentage": ${baseCalc.roiPercentage},
        "totalProjectValue": total_project_value,
        "hourlyRate": ${baseCalc.baseHourlyRate},
        "effectiveHourlyRate": accounting_for_all_factors,
        "profitMargin": estimated_profit_margin_percentage,
        "pricingOptions": [
          {
            "model": "retainer/project/hourly/success/hybrid",
            "price": price_amount,
            "description": "pricing model description",
            "pros": ["advantage 1", "advantage 2"],
            "cons": ["disadvantage 1", "disadvantage 2"],
            "recommendationScore": score_1_to_100
          }
        ],
        "riskAdjustment": {
          "factor": ${baseCalc.riskFactor},
          "adjustedPrice": adjusted_price_amount,
          "reasoning": ["reason for adjustment"]
        },
        "marketPosition": {
          "percentile": market_percentile_1_to_100,
          "competitorRange": {
            "low": low_market_price,
            "average": average_market_price,
            "high": high_market_price
          },
          "positioning": "budget/standard/premium/luxury"
        }
      },
      "strategy": {
        "recommendedApproach": "overall pricing strategy recommendation",
        "pricingFramework": "framework description (value-based, competitive, cost-plus, etc.)",
        "negotiationTactics": ["tactic 1", "tactic 2", "tactic 3"],
        "valueProposition": "clear value proposition statement",
        "presentationStructure": [
          {
            "section": "section name",
            "content": "what to present in this section",
            "emphasis": "low/medium/high"
          }
        ],
        "phases": [
          {
            "phase": "phase name",
            "duration": "time duration",
            "deliverables": ["deliverable 1", "deliverable 2"],
            "milestones": ["milestone 1", "milestone 2"],
            "payment": payment_amount
          }
        ],
        "kpis": [
          {
            "metric": "KPI name",
            "target": "target value",
            "timeline": "measurement timeline",
            "measurement": "how to measure"
          }
        ]
      },
      "benchmarks": {
        "industry": "${input.industry || 'Technology'}",
        "averageRoiMultiple": industry_average_roi_multiple,
        "typicalHourlyRates": {
          "junior": junior_rate,
          "mid": mid_rate,
          "senior": senior_rate,
          "expert": expert_rate
        },
        "commonPricingModels": ["model 1", "model 2"],
        "seasonalityFactors": ["factor 1", "factor 2"],
        "paymentTermPreferences": ["preference 1", "preference 2"]
      },
      "proposalTemplate": "complete proposal template with pricing presentation",
      "pricingPresentationSlides": [
        {
          "title": "slide title",
          "content": "slide content",
          "visualType": "text/chart/table/bullet"
        }
      ],
      "objectionHandling": [
        {
          "objection": "common client objection",
          "response": "recommended response",
          "alternatives": ["alternative approach 1", "alternative approach 2"]
        }
      ],
      "contractClauses": [
        {
          "clause": "clause name",
          "purpose": "why this clause is important",
          "template": "clause template text"
        }
      ]
    }

    REQUIREMENTS:
    1. Ensure pricing reflects the value delivered and market position
    2. Provide multiple pricing model options for different client preferences
    3. Include industry-specific benchmarks and considerations
    4. Generate client-ready presentation materials
    5. Address common pricing objections and negotiation scenarios
    6. Consider payment terms and risk factors in recommendations
    7. Provide actionable implementation guidance
    8. Include performance metrics and success measurement

    Focus on creating a comprehensive package that positions the pricing strategically and provides all materials needed for successful client conversations.
    `;
  }

private parseAIResponse(content: string, input: PricingCalculatorInput, baseCalc: any): Omit<GeneratedPricingPackage, 'tokensUsed' | 'generationTime'> {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // ✅ Validate the parsed object has required structure
      if (this.validateParsedResponse(parsed)) {
        return parsed;
      } else {
        console.warn('Parsed response failed validation, using fallback');
      }
    }
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
  }

  return this.generateFallbackPackage(input, baseCalc);
}
private validateParsedResponse(parsed: any): boolean {
  return (
    parsed &&
    parsed.calculations &&
    parsed.strategy &&
    parsed.benchmarks &&
    typeof parsed.calculations.recommendedRetainer === 'number' &&
    typeof parsed.calculations.roiPercentage === 'number'
  );
}

  private generateFallbackPackage(input: PricingCalculatorInput, baseCalc: any): Omit<GeneratedPricingPackage, 'tokensUsed' | 'generationTime'> {
    const projectDuration = input.projectDuration || 6;
    const totalProjectValue = baseCalc.recommendedRetainer * projectDuration;
    
    return {
      calculations: {
        monthlySavings: baseCalc.monthlySavings,
        recommendedRetainer: baseCalc.recommendedRetainer,
        netSavings: baseCalc.netSavings,
        roiPercentage: baseCalc.roiPercentage,
        totalProjectValue,
        hourlyRate: baseCalc.baseHourlyRate,
        effectiveHourlyRate: baseCalc.baseHourlyRate * 1.3, // Account for business overhead
        profitMargin: 65,
        pricingOptions: [
          {
            model: 'retainer',
            price: baseCalc.recommendedRetainer,
            description: 'Monthly retainer for ongoing services',
            pros: ['Predictable income', 'Strong client relationship', 'Scope flexibility'],
            cons: ['Requires trust building', 'Scope creep risk'],
            recommendationScore: 85
          },
          {
            model: 'project',
            price: totalProjectValue,
            description: 'Fixed project fee paid in milestones',
            pros: ['Clear scope boundaries', 'Upfront commitment', 'Higher margins possible'],
            cons: ['Risk of scope changes', 'Cash flow gaps'],
            recommendationScore: 75
          },
          {
            model: 'success',
            price: baseCalc.monthlySavings * 0.4,
            description: 'Performance-based fee tied to results',
            pros: ['Aligned incentives', 'Easier client buy-in', 'Potential for higher fees'],
            cons: ['Income uncertainty', 'Complex measurement'],
            recommendationScore: 70
          }
        ],
        riskAdjustment: {
          factor: baseCalc.riskFactor,
          adjustedPrice: baseCalc.recommendedRetainer,
          reasoning: [
            `Applied ${((baseCalc.riskFactor - 1) * 100).toFixed(1)}% risk adjustment`,
            'Accounts for delivery complexity and market factors',
            'Includes premium for expertise level'
          ]
        },
        marketPosition: {
          percentile: 75,
          competitorRange: {
            low: baseCalc.recommendedRetainer * 0.6,
            average: baseCalc.recommendedRetainer * 0.85,
            high: baseCalc.recommendedRetainer * 1.4
          },
          positioning: 'premium'
        }
      },

      strategy: {
        recommendedApproach: 'Value-based pricing with strong ROI justification',
        pricingFramework: 'ROI-based value pricing with risk-adjusted premiums',
        negotiationTactics: [
          'Lead with value and ROI, not price',
          'Offer multiple pricing options',
          'Use social proof and case studies',
          'Create urgency through limited availability'
        ],
        valueProposition: `Deliver $${baseCalc.monthlySavings.toLocaleString()} in monthly savings while maintaining ${baseCalc.roiPercentage.toFixed(0)}% ROI for your investment`,
        presentationStructure: [
          {
            section: 'Problem & Opportunity',
            content: 'Current situation analysis and potential for improvement',
            emphasis: 'high'
          },
          {
            section: 'Solution & Approach',
            content: 'Methodology and implementation plan',
            emphasis: 'high'
          },
          {
            section: 'Expected Results',
            content: 'Quantified outcomes and ROI projections',
            emphasis: 'high'
          },
          {
            section: 'Investment & Value',
            content: 'Pricing presentation with value justification',
            emphasis: 'medium'
          },
          {
            section: 'Next Steps',
            content: 'Clear path forward and timeline',
            emphasis: 'medium'
          }
        ],
        phases: [
          {
            phase: 'Discovery & Strategy',
            duration: '2-4 weeks',
            deliverables: ['Current state analysis', 'Strategy document', 'Implementation roadmap'],
            milestones: ['Stakeholder interviews completed', 'Strategy approved'],
            payment: baseCalc.recommendedRetainer * 1.5
          },
          {
            phase: 'Implementation',
            duration: `${Math.max(2, projectDuration - 2)} months`,
            deliverables: ['System setup', 'Process implementation', 'Team training'],
            milestones: ['System operational', 'Team certified', 'Initial results achieved'],
            payment: baseCalc.recommendedRetainer
          },
          {
            phase: 'Optimization & Handoff',
            duration: '2-4 weeks',
            deliverables: ['Performance optimization', 'Documentation', 'Knowledge transfer'],
            milestones: ['Target metrics achieved', 'Team fully independent'],
            payment: baseCalc.recommendedRetainer * 0.5
          }
        ],
        kpis: [
          {
            metric: 'Cost Savings Achieved',
            target: `$${input.annualSavings.toLocaleString()} annually`,
            timeline: 'Monthly tracking',
            measurement: 'Direct cost comparison before/after'
          },
          {
            metric: 'Implementation Progress',
            target: '100% milestone completion on schedule',
            timeline: 'Weekly tracking',
            measurement: 'Milestone completion percentage'
          },
          {
            metric: 'Client Satisfaction',
            target: '90%+ satisfaction score',
            timeline: 'Monthly surveys',
            measurement: 'NPS and satisfaction surveys'
          }
        ]
      },

      benchmarks: {
        industry: input.industry || 'Technology',
        averageRoiMultiple: 4.5,
        typicalHourlyRates: {
          junior: 75,
          mid: 125,
          senior: 200,
          expert: 350
        },
        commonPricingModels: ['Monthly retainer', 'Project-based', 'Success-based'],
        seasonalityFactors: ['Q4 budget planning', 'Q1 new initiatives'],
        paymentTermPreferences: ['Monthly terms', 'Milestone payments', 'Upfront discounts']
      },

      proposalTemplate: this.generateProposalTemplate(input, baseCalc),
      
      pricingPresentationSlides: [
        {
          title: 'Current Situation & Opportunity',
          content: `Your current processes are costing $${input.annualSavings.toLocaleString()} annually in inefficiencies and missed opportunities.`,
          visualType: 'text'
        },
        {
          title: 'Our Solution Approach',
          content: `Systematic implementation of AI-powered solutions tailored to your ${input.industry || 'business'} needs.`,
          visualType: 'bullet'
        },
        {
          title: 'Expected ROI & Savings',
          content: `Monthly savings: $${baseCalc.monthlySavings.toLocaleString()} | Your investment: $${baseCalc.recommendedRetainer.toLocaleString()} | Net benefit: $${baseCalc.netSavings.toLocaleString()}`,
          visualType: 'chart'
        },
        {
          title: 'Implementation Timeline',
          content: `${projectDuration}-month structured approach with clear milestones and deliverables.`,
          visualType: 'table'
        }
      ],

      objectionHandling: [
        {
          objection: "The price seems high",
          response: "I understand price is important. Let's look at the value - you'll save $" + baseCalc.netSavings.toLocaleString() + " per month after our fee, giving you a " + baseCalc.roiPercentage.toFixed(0) + "% ROI.",
          alternatives: ["Payment plan option", "Reduced scope pilot project", "Success-based fee structure"]
        },
        {
          objection: "We need to think about it",
          response: "Of course, this is an important decision. What specific concerns can I address to help with your evaluation?",
          alternatives: ["Provide references", "Offer pilot project", "Extended timeline option"]
        },
        {
          objection: "We don't have budget right now",
          response: "I understand budget constraints. The monthly savings of $" + baseCalc.monthlySavings.toLocaleString() + " would actually pay for this investment and provide additional profit.",
          alternatives: ["Phased implementation", "ROI-based timeline", "Creative financing options"]
        }
      ],

      contractClauses: [
        {
          clause: "Success Metrics",
          purpose: "Define measurable outcomes and accountability",
          template: "Services will be considered successful when Client achieves minimum " + (baseCalc.roiPercentage * 0.8).toFixed(0) + "% ROI within the agreed timeline."
        },
        {
          clause: "Scope Protection",
          purpose: "Prevent scope creep and protect margins",
          template: "Any additional work beyond the defined scope will be quoted separately and require written approval."
        },
        {
          clause: "Payment Terms",
          purpose: "Ensure timely payment and cash flow",
          template: "Monthly retainer of $" + baseCalc.recommendedRetainer.toLocaleString() + " due within 15 days of invoice date."
        }
      ]
    };
  }

  private generateProposalTemplate(input: PricingCalculatorInput, baseCalc: any): string {
    return `
# AI Services Proposal - ${input.clientName || 'Client Name'}

## Executive Summary
We propose to help ${input.clientName || 'your organization'} achieve $${input.annualSavings.toLocaleString()} in annual savings through strategic AI implementation and process optimization.

## Current Situation
Your current processes represent significant opportunities for improvement, with potential monthly savings of $${baseCalc.monthlySavings.toLocaleString()}.

## Our Approach
Systematic ${input.serviceType || 'AI consulting'} implementation designed specifically for the ${input.industry || 'technology'} industry.

## Investment & ROI
- **Monthly Investment:** $${baseCalc.recommendedRetainer.toLocaleString()}
- **Monthly Savings:** $${baseCalc.monthlySavings.toLocaleString()}
- **Net Monthly Benefit:** $${baseCalc.netSavings.toLocaleString()}
- **ROI:** ${baseCalc.roiPercentage.toFixed(0)}%

## Timeline
${input.projectDuration || 6}-month engagement with clear milestones and deliverables.

## Next Steps
1. Proposal review and feedback
2. Contract execution
3. Project kickoff within 2 weeks

---
*This proposal is valid for 30 days and represents our commitment to your success.*
    `;
  }

  async savePricingCalculation(userId: string, workspaceId: string, calculation: GeneratedPricingPackage, input: PricingCalculatorInput): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `Pricing Calculation - ${input.clientName || input.projectName || 'Unnamed Project'}`,
          content: JSON.stringify(calculation),
          type: 'pricing_calculator',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: {
            clientName: input.clientName,
            projectName: input.projectName,
            industry: input.industry,
            serviceType: input.serviceType,
            annualSavings: input.annualSavings,
            recommendedRetainer: calculation.calculations.recommendedRetainer,
            roiPercentage: calculation.calculations.roiPercentage,
            hourlyRate: calculation.calculations.hourlyRate,
            generatedAt: new Date().toISOString(),
            tokensUsed: calculation.tokensUsed,
            generationTime: calculation.generationTime
          },
          tags: ['pricing', 'calculator', input.industry?.toLowerCase() || 'general', 'roi']
        }
      });

      return deliverable.id;
    } catch (error) {
      console.error('Error saving pricing calculation:', error);
      throw error;
    }
  }

  async getPricingCalculation(userId: string, calculationId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.findFirst({
        where: {
          id: calculationId,
          user_id: userId,
          type: 'pricing_calculator'
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
        calculation: JSON.parse(deliverable.content),
        metadata: deliverable.metadata,
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        workspace: deliverable.workspace
      };
    } catch (error) {
      console.error('Error retrieving pricing calculation:', error);
      throw error;
    }
  }

async getUserPricingCalculations(userId: string, workspaceId?: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const whereClause: any = {
      user_id: userId,
      type: 'pricing_calculator'
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    const calculations = await prisma.deliverable.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        workspace: true
      }
    });

    return calculations.map(calc => ({
      id: calc.id,
      title: calc.title,
      clientName: (calc.metadata as any)?.clientName,
      projectName: (calc.metadata as any)?.projectName,
      industry: (calc.metadata as any)?.industry,
      annualSavings: (calc.metadata as any)?.annualSavings,
      recommendedRetainer: (calc.metadata as any)?.recommendedRetainer,
      roiPercentage: (calc.metadata as any)?.roiPercentage,
      hourlyRate: (calc.metadata as any)?.hourlyRate,
      createdAt: calc.created_at,
      updatedAt: calc.updated_at,
      workspace: calc.workspace
    }));
  } catch (error) {
    console.error('Error fetching user pricing calculations:', error);
    return [];
  }
}

async updatePricingCalculation(userId: string, calculationId: string, updates: Partial<PricingCalculatorInput>): Promise<any> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // Get existing calculation
    const existingCalc = await this.getPricingCalculation(userId, calculationId);
    if (!existingCalc) {
      throw new Error('Pricing calculation not found');
    }

    // Merge updates with existing input (cast metadata to any)
    const originalInput = existingCalc.metadata as any;
    const updatedInput = { ...originalInput, ...updates, userId };

    // Regenerate calculation with updates
    const newCalculation = await this.generatePricingPackage(updatedInput);

    // Update the deliverable
    const updated = await prisma.deliverable.update({
      where: { id: calculationId },
      data: {
        content: JSON.stringify(newCalculation),
        metadata: {
          ...(existingCalc.metadata as any),
          ...updates,
          updatedAt: new Date().toISOString(),
          tokensUsed: newCalculation.tokensUsed,
          generationTime: newCalculation.generationTime
        }
      }
    });

    return updated;
  } catch (error) {
    console.error('Error updating pricing calculation:', error);
    throw error;
  }
}


  async comparePricingScenarios(userId: string, scenarios: PricingCalculatorInput[]): Promise<{
    scenarios: Array<{
      input: PricingCalculatorInput;
      results: any;
    }>;
    comparison: {
      summary: string;
      recommendations: string[];
      bestScenario: number;
    };
    tokensUsed: number;
  }> {
    try {
      // Calculate all scenarios
      const scenarioResults = scenarios.map(scenario => ({
        input: scenario,
        results: this.calculateBasePricing(scenario)
      }));

      // Generate comparison analysis
      const comparisonPrompt = this.buildComparisonPrompt(scenarioResults);
      
      const response = await this.openRouterClient.complete({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'You are a pricing strategist. Compare pricing scenarios and provide recommendations.'
          },
          {
            role: 'user',
            content: comparisonPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      // Parse comparison results
      let comparison;
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          comparison = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (error) {
        comparison = {
          summary: 'Multiple pricing scenarios analyzed with varying ROI outcomes',
          recommendations: [
            'Choose scenario with best client ROI balance',
            'Consider market positioning implications',
            'Factor in delivery complexity'
          ],
          bestScenario: 0
        };
      }

      return {
        scenarios: scenarioResults,
        comparison,
        tokensUsed: response.usage.total_tokens
      };
    } catch (error) {
      console.error('Error comparing pricing scenarios:', error);
      throw error;
    }
  }

  private buildComparisonPrompt(scenarios: any[]): string {
    return `
    Compare these pricing scenarios and provide recommendations:

    ${scenarios.map((scenario, index) => `
    SCENARIO ${index + 1}:
    - Annual Savings: ${scenario.input.annualSavings}
    - Hours/Week: ${scenario.input.hoursPerWeek}
    - ROI Multiple: ${scenario.input.roiMultiple}
    - Recommended Retainer: ${scenario.results.recommendedRetainer.toFixed(0)}
    - Client ROI: ${scenario.results.roiPercentage.toFixed(1)}%
    - Hourly Rate: ${scenario.results.baseHourlyRate.toFixed(0)}
    `).join('\n')}

    Provide analysis in JSON format:
    {
      "summary": "overview of the scenarios and key differences",
      "recommendations": ["recommendation 1", "recommendation 2"],
      "bestScenario": scenario_index_0_based,
      "reasoning": "why this scenario is recommended"
    }
    `;
  }

  private generateCacheKey(input: PricingCalculatorInput): string {
  const key = [
    'pricing_calc',
    input.annualSavings,
    input.hoursPerWeek,
    input.roiMultiple,
    input.experienceLevel || 'intermediate',
    input.deliveryRisk || 'medium',
    input.industry || 'general'
  ].join(':');
  
  return key.toLowerCase().replace(/\s+/g, '_');
}
}