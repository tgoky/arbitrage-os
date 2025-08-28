// services/pricingCalculator.service.ts - FIXED VERSION with better error handling
import { OpenRouterClient } from '@/lib/openrouter';
import { PricingCalculatorInput, GeneratedPricingPackage } from '@/types/pricingCalculator';

export class PricingCalculatorService {
  private openRouterClient: OpenRouterClient;
  
  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY is not set');
      throw new Error('OpenRouter API key is required');
    }
    
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY);
  }

  async generatePricingPackage(input: PricingCalculatorInput): Promise<GeneratedPricingPackage> {
    const startTime = Date.now();
    console.log('🤖 Starting pricing package generation...');
    
    try {
      // Calculate core pricing results
      const baseCalculations = this.calculateBasePricing(input);
      console.log('✅ Base calculations completed:', {
        recommendedRetainer: baseCalculations.recommendedRetainer,
        hourlyRate: baseCalculations.baseHourlyRate,
        roiPercentage: baseCalculations.roiPercentage
      });
      
      // Build AI enhancement prompt
      const prompt = this.buildPricingStrategyPrompt(input, baseCalculations);
      console.log('✅ AI prompt built, length:', prompt.length);
      
      // Generate enhanced strategy with AI - with retry logic
      let response;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          console.log(`🤖 Attempting AI generation (attempt ${attempts + 1}/${maxAttempts})...`);
          
          response = await this.openRouterClient.complete({
            model: 'openai/gpt-5-mini',
            messages: [
              {
                role: 'system',
                content: `You are an expert pricing strategist and business consultant specializing in AI services and consulting. You understand value-based pricing, market positioning, and negotiation strategies. Generate comprehensive pricing packages that help consultants position their services effectively and maximize their value capture.

IMPORTANT: Always respond with valid JSON. Ensure all numeric values are properly formatted and all required fields are present.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 3000,
          });
          
          console.log('✅ AI response received, tokens used:', response.usage?.total_tokens);
          break;
          
        } catch (aiError: any) {
          attempts++;
          console.warn(`⚠️ AI generation attempt ${attempts} failed:`, aiError?.message);
          
          if (attempts >= maxAttempts) {
            console.error('❌ All AI generation attempts failed');
            // Fall back to basic package instead of throwing
            console.log('🔄 Falling back to basic pricing package...');
            break;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      let enhancedResults;
      
      if (response) {
        try {
          enhancedResults = this.parseAIResponse(response.content, input, baseCalculations);
          console.log('✅ AI response parsed successfully');
        } catch (parseError: any) {
          console.warn('⚠️ Failed to parse AI response, using fallback:', parseError?.message);
          enhancedResults = this.generateFallbackPackage(input, baseCalculations);
        }
      } else {
        console.log('🔄 Using fallback package due to AI failure');
        enhancedResults = this.generateFallbackPackage(input, baseCalculations);
      }
      
      const pricingPackage: GeneratedPricingPackage = {
        ...enhancedResults,
        tokensUsed: response?.usage?.total_tokens || 0,
        generationTime: Date.now() - startTime
      };

      console.log('✅ Pricing package generation completed in', pricingPackage.generationTime, 'ms');
      return pricingPackage;
      
    } catch (error: any) {
      console.error('❌ Error in generatePricingPackage:', error?.message, error?.stack);
      
      // Generate fallback package even on complete failure
      try {
        const baseCalculations = this.calculateBasePricing(input);
        const fallbackPackage = this.generateFallbackPackage(input, baseCalculations);
        
        return {
          ...fallbackPackage,
          tokensUsed: 0,
          generationTime: Date.now() - startTime
        };
      } catch (fallbackError: any) {
        console.error('❌ Even fallback generation failed:', fallbackError?.message);
        throw new Error('Failed to generate pricing package: ' + error?.message);
      }
    }
  }

// services/pricingCalculator.service.ts - UPDATED calculateBasePricing method

private calculateBasePricing(input: PricingCalculatorInput) {
  try {
    // NEW: Calculate total client impact
    const totalClientImpact = input.annualClientSavings + input.annualRevenueIncrease;
    const monthlyImpact = totalClientImpact / 12;
    const monthlyHours = (input.hoursPerWeek * 4.33); // Average weeks per month
    
    // NEW: Value-based pricing calculation
    // Your fee = Total Impact ÷ ROI Multiple
    let baseRetainer = totalClientImpact / input.roiMultiple;
    const monthlyRetainer = baseRetainer / 12;
    
    // Sanity check: Ensure hourly rate is reasonable
    const impliedHourlyRate = monthlyRetainer / monthlyHours;
    const minHourlyRate = 50;
    const maxHourlyRate = 500;
    
    let finalMonthlyRetainer = monthlyRetainer;
    
    if (impliedHourlyRate < minHourlyRate) {
      finalMonthlyRetainer = monthlyHours * minHourlyRate;
      console.log(`Adjusted pricing: hourly rate was too low (${impliedHourlyRate.toFixed(2)}), set to minimum ${minHourlyRate}`);
    } else if (impliedHourlyRate > maxHourlyRate) {
      finalMonthlyRetainer = monthlyHours * maxHourlyRate;
      console.log(`Adjusted pricing: hourly rate was too high (${impliedHourlyRate.toFixed(2)}), capped at ${maxHourlyRate}`);
    }
    
    // Apply risk adjustments
    const riskFactor = this.calculateRiskFactor(input);
    const adjustedRetainer = finalMonthlyRetainer * riskFactor;
    
    // Calculate client metrics
    const netClientBenefit = monthlyImpact - adjustedRetainer;
    const clientROI = adjustedRetainer > 0 ? (netClientBenefit / adjustedRetainer) * 100 : 0;
    
    return {
      // Client impact breakdown
      totalClientImpact: Math.round(totalClientImpact),
      monthlyImpact: Math.round(monthlyImpact),
      
      // Your pricing
      recommendedRetainer: Math.round(adjustedRetainer),
      annualFee: Math.round(adjustedRetainer * 12),
      
      // Client benefit after your fee
      netSavings: Math.round(netClientBenefit),
      roiPercentage: Math.round(clientROI * 100) / 100,
      
      // Rate analysis
      baseHourlyRate: Math.round(adjustedRetainer / monthlyHours),
      monthlyHours: Math.round(monthlyHours),
      riskFactor: Math.round(riskFactor * 100) / 100,
      
      // Value components for transparency
      savingsComponent: Math.round(input.annualClientSavings / 12),
      revenueComponent: Math.round(input.annualRevenueIncrease / 12),
    };
  } catch (error: any) {
    console.error('Error in calculateBasePricing:', error?.message);
    throw new Error('Failed to calculate base pricing: ' + error?.message);
  }
}


  private calculateRiskFactor(input: PricingCalculatorInput): number {
    let factor = 1.0;
    
    try {
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
      
      return Math.max(0.5, Math.min(2.0, factor)); // Clamp between 0.5 and 2.0
    } catch (error: any) {
      console.warn('⚠️ Error calculating risk factor, using default:', error?.message);
      return 1.0;
    }
  }

  private buildPricingStrategyPrompt(input: PricingCalculatorInput, baseCalc: any): string {
  // Calculate total client impact for the prompt
  const totalClientImpact = input.annualClientSavings + input.annualRevenueIncrease;
  
  return `
  PRICING STRATEGY DEVELOPMENT REQUEST

  CLIENT & PROJECT CONTEXT:
  - Client: ${input.clientName || 'Unnamed Client'}
  - Project: ${input.projectName || 'AI Services Project'}
  - Industry: ${input.industry || 'Technology'}
  - Service Type: ${input.serviceType || 'AI Consulting'}
  - Project Duration: ${input.projectDuration || 6} months
  
  CLIENT VALUE BREAKDOWN:
  - Annual Client Cost Savings: $${input.annualClientSavings.toLocaleString()}
  - Annual Revenue Increase: $${input.annualRevenueIncrease.toLocaleString()}
  - Total Client Impact: $${totalClientImpact.toLocaleString()}
  - Monthly Client Impact: $${baseCalc.monthlyImpact.toLocaleString()}
  
  CALCULATED PRICING:
  - Your Recommended Annual Fee: $${baseCalc.annualFee.toLocaleString()}
  - Your Recommended Monthly Retainer: $${baseCalc.recommendedRetainer.toLocaleString()}
  - Client Net Benefit After Your Fee: $${baseCalc.netSavings.toLocaleString()}/month
  - Client ROI: ${baseCalc.roiPercentage.toFixed(1)}% (gets $${(baseCalc.roiPercentage/100 + 1).toFixed(1)} back for every $1 invested)
  - Your Implied Hourly Rate: $${baseCalc.baseHourlyRate}
  - Monthly Hours: ${baseCalc.monthlyHours}
  - ROI Multiple Used: ${input.roiMultiple}x
  
  CONTEXT FACTORS:
  - Experience Level: ${input.experienceLevel || 'intermediate'}
  - Client Urgency: ${input.clientUrgency || 'medium'}
  - Relationship Type: ${input.relationshipType || 'new'}
  - Delivery Risk: ${input.deliveryRisk || 'medium'}
  - Payment Terms: ${input.paymentTerms || 'monthly'}
  - Guarantee Offered: ${input.guaranteeOffered ? 'Yes' : 'No'}

  Generate a comprehensive pricing strategy in JSON format with ALL required fields. Ensure all numeric values are valid numbers (not null or undefined).

  REQUIRED JSON STRUCTURE:
  {
    "calculations": {
      "monthlySavings": ${baseCalc.monthlyImpact},
      "recommendedRetainer": ${baseCalc.recommendedRetainer},
      "netSavings": ${baseCalc.netSavings},
      "roiPercentage": ${baseCalc.roiPercentage},
      "totalProjectValue": ${baseCalc.annualFee || baseCalc.recommendedRetainer * 12},
      "hourlyRate": ${baseCalc.baseHourlyRate},
      "effectiveHourlyRate": ${Math.round(baseCalc.baseHourlyRate * 1.3)},
      "profitMargin": 65,
      "pricingOptions": [
        {
          "model": "retainer",
          "price": ${baseCalc.recommendedRetainer},
          "description": "Monthly retainer based on ${input.roiMultiple}x ROI multiple",
          "pros": ["Predictable income", "Strong client relationship", "Scope flexibility"],
          "cons": ["Requires trust building", "Scope creep risk"],
          "recommendationScore": 85
        },
        {
          "model": "annual",
          "price": ${baseCalc.annualFee || baseCalc.recommendedRetainer * 12},
          "description": "Annual fee paid upfront with discount",
          "pros": ["Better cash flow", "Committed client", "Higher effective rate"],
          "cons": ["Larger upfront ask", "Annual renewals needed"],
          "recommendationScore": 75
        },
        {
          "model": "success",
          "price": ${Math.round(baseCalc.monthlyImpact * 0.4)},
          "description": "Performance-based fee tied to achieved results",
          "pros": ["Aligned incentives", "Easier client buy-in", "Potential for higher fees"],
          "cons": ["Income uncertainty", "Complex measurement", "Risk of disputes"],
          "recommendationScore": 70
        }
      ]
    },
    "strategy": {
      "recommendedApproach": "Value-based pricing with clear ROI demonstration showing client gets $${(baseCalc.roiPercentage/100 + 1).toFixed(1)} back for every $1 invested",
      "negotiationTactics": [
        "Lead with total client impact of $${totalClientImpact.toLocaleString()}/year",
        "Show breakdown: $${input.annualClientSavings.toLocaleString()} saved + $${input.annualRevenueIncrease.toLocaleString()} additional revenue",
        "Emphasize ${baseCalc.roiPercentage.toFixed(0)}% ROI for the client",
        "Offer multiple payment options to increase flexibility",
        "Use social proof and case studies from ${input.industry || 'similar industries'}"
      ],
      "valueProposition": "Deliver $${totalClientImpact.toLocaleString()} in annual impact (${input.annualClientSavings.toLocaleString()} savings + ${input.annualRevenueIncrease.toLocaleString()} revenue increase) while maintaining ${baseCalc.roiPercentage.toFixed(0)}% ROI on your investment",
      "phases": [
        {
          "phase": "Discovery & Value Validation",
          "duration": "2-4 weeks",
          "deliverables": ["Current state analysis", "Value opportunity assessment", "ROI projection validation"],
          "milestones": ["Baseline metrics established", "Value opportunities identified"],
          "payment": ${Math.round(baseCalc.recommendedRetainer * 1.5)}
        },
        {
          "phase": "Implementation & Optimization",
          "duration": "6-12 weeks",
          "deliverables": ["System implementation", "Process optimization", "Team training"],
          "milestones": ["First measurable results", "Process fully operational"],
          "payment": ${baseCalc.recommendedRetainer}
        },
        {
          "phase": "Results Measurement & Handoff",
          "duration": "2-4 weeks",
          "deliverables": ["ROI measurement", "Success documentation", "Knowledge transfer"],
          "milestones": ["Target ROI achieved", "Team fully independent"],
          "payment": ${Math.round(baseCalc.recommendedRetainer * 0.75)}
        }
      ]
    },
    "benchmarks": {
      "industry": "${input.industry || 'Technology'}",
      "averageRoiMultiple": 4.5,
      "typicalHourlyRates": {
        "junior": 75,
        "mid": 125,
        "senior": 200,
        "expert": 350
      }
    },
    "proposalTemplate": "# Value-Based Pricing Proposal\\n\\n## Executive Summary\\nWe will help ${input.clientName || 'your organization'} achieve $${totalClientImpact.toLocaleString()} in annual impact through $${input.annualClientSavings.toLocaleString()} in cost savings and $${input.annualRevenueIncrease.toLocaleString()} in revenue increases.\\n\\n## Investment & ROI\\n- **Annual Investment:** $${baseCalc.annualFee.toLocaleString()}\\n- **Annual Impact:** $${totalClientImpact.toLocaleString()}\\n- **Net Annual Benefit:** $${(totalClientImpact - baseCalc.annualFee).toLocaleString()}\\n- **ROI:** ${baseCalc.roiPercentage.toFixed(0)}%\\n\\n*You get $${(baseCalc.roiPercentage/100 + 1).toFixed(1)} back for every $1 invested*",
    "pricingPresentationSlides": [
      {
        "title": "Current Situation & Opportunity",
        "content": "Your current situation represents $${totalClientImpact.toLocaleString()} in annual opportunity through cost reduction and revenue growth.",
        "visualType": "text"
      },
      {
        "title": "Expected Impact Breakdown",
        "content": "Cost Savings: $${input.annualClientSavings.toLocaleString()} | Revenue Increase: $${input.annualRevenueIncrease.toLocaleString()} | Total Impact: $${totalClientImpact.toLocaleString()}",
        "visualType": "chart"
      },
      {
        "title": "Investment vs Return",
        "content": "Your Investment: $${baseCalc.annualFee.toLocaleString()} | Your Return: $${totalClientImpact.toLocaleString()} | ROI: ${baseCalc.roiPercentage.toFixed(0)}%",
        "visualType": "chart"
      }
    ],
    "objectionHandling": [
      {
        "objection": "The price seems high for our budget",
        "response": "I understand budget is important. Let's look at the return - you'll net $${(totalClientImpact - baseCalc.annualFee).toLocaleString()} annually after our fee, giving you ${baseCalc.roiPercentage.toFixed(0)}% ROI. This pays for itself ${(baseCalc.annualFee / totalClientImpact * 12).toFixed(1)} times over each year.",
        "alternatives": ["Monthly payment plan", "Phased implementation to spread costs", "Performance-based fee structure"]
      },
      {
        "objection": "We need to see results before paying this much",
        "response": "That's completely reasonable. We can structure this with milestone payments tied to measurable results, or offer a performance guarantee where fees are tied to achieving the projected $${totalClientImpact.toLocaleString()} impact.",
        "alternatives": ["Pilot project to prove value", "Success-based fee structure", "Money-back guarantee if ROI targets aren't met"]
      },
      {
        "objection": "We could hire someone internally for less",
        "response": "You're right that internal hiring has lower hourly costs. However, our approach delivers $${totalClientImpact.toLocaleString()} in impact from day one, versus 6-12 months to hire and train. The opportunity cost of waiting could be $${Math.round(totalClientImpact/2).toLocaleString()} in lost value.",
        "alternatives": ["Hybrid model with knowledge transfer", "Train-the-trainer approach", "Consulting + internal team collaboration"]
      }
    ],
    "contractClauses": [
      {
        "clause": "Success Metrics & ROI Guarantee",
        "purpose": "Define measurable outcomes and shared accountability",
        "template": "Services will be considered successful when Client achieves minimum ${Math.round(baseCalc.roiPercentage * 0.8)}% ROI within the agreed timeline, measured through agreed-upon KPIs including cost savings and revenue increases."
      },
      {
        "clause": "Value-Based Payment Terms",
        "purpose": "Align payments with value delivery",
        "template": "Monthly retainer of $${baseCalc.recommendedRetainer.toLocaleString()} due within 15 days of invoice date. Payments are based on the value delivered ($${totalClientImpact.toLocaleString()} annual impact) rather than time spent."
      },
      {
        "clause": "Impact Measurement & Reporting",
        "purpose": "Ensure transparent tracking of results",
        "template": "Monthly reporting will include progress toward $${input.annualClientSavings.toLocaleString()} cost savings target and $${input.annualRevenueIncrease.toLocaleString()} revenue increase target, with quarterly ROI assessments."
      }
    ]
  }

  CRITICAL: Respond ONLY with valid JSON. No additional text before or after the JSON.
  `;
}

  private parseAIResponse(content: string, input: PricingCalculatorInput, baseCalc: any): Omit<GeneratedPricingPackage, 'tokensUsed' | 'generationTime'> {
    try {
      // Clean the content to extract JSON
      let cleanContent = content.trim();
      
      // Remove any markdown code block formatting
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // Find JSON content between braces
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the parsed object has required structure
      if (this.validateParsedResponse(parsed)) {
        // Ensure all numeric values are properly set
        const validated = this.sanitizeParsedResponse(parsed, baseCalc);
        console.log('✅ AI response parsed and validated successfully');
        return validated;
      } else {
        console.warn('⚠️ Parsed response failed validation, using fallback');
        throw new Error('Parsed response failed validation');
      }
    } catch (error: any) {
      console.error('❌ Failed to parse JSON response:', error?.message);
      throw error;
    }
  }

  private validateParsedResponse(parsed: any): boolean {
    try {
      return (
        parsed &&
        parsed.calculations &&
        parsed.strategy &&
        parsed.benchmarks &&
        typeof parsed.calculations.recommendedRetainer === 'number' &&
        typeof parsed.calculations.roiPercentage === 'number' &&
        Array.isArray(parsed.calculations.pricingOptions) &&
        Array.isArray(parsed.strategy.negotiationTactics) &&
        Array.isArray(parsed.strategy.phases) &&
        typeof parsed.benchmarks.industry === 'string' &&
        typeof parsed.benchmarks.typicalHourlyRates === 'object'
      );
    } catch (error) {
      return false;
    }
  }

  private sanitizeParsedResponse(parsed: any, baseCalc: any): Omit<GeneratedPricingPackage, 'tokensUsed' | 'generationTime'> {
    // Ensure all required numeric values are present and valid
    const sanitized = {
      calculations: {
        monthlySavings: baseCalc.monthlyImpact,
        recommendedRetainer: baseCalc.recommendedRetainer,
        netSavings: baseCalc.netSavings,
        roiPercentage: baseCalc.roiPercentage,
        totalProjectValue: parsed.calculations?.totalProjectValue || (baseCalc.recommendedRetainer * 6),
        hourlyRate: baseCalc.baseHourlyRate,
        effectiveHourlyRate: parsed.calculations?.effectiveHourlyRate || (baseCalc.baseHourlyRate * 1.3),
        profitMargin: parsed.calculations?.profitMargin || 65,
        pricingOptions: parsed.calculations?.pricingOptions || [],
        riskAdjustment: {
          factor: baseCalc.riskFactor,
          adjustedPrice: baseCalc.recommendedRetainer,
          reasoning: [`Applied ${((baseCalc.riskFactor - 1) * 100).toFixed(1)}% risk adjustment`]
        },
        marketPosition: {
          percentile: 75,
          competitorRange: {
            low: Math.round(baseCalc.recommendedRetainer * 0.6),
            average: Math.round(baseCalc.recommendedRetainer * 0.85),
            high: Math.round(baseCalc.recommendedRetainer * 1.4)
          },
          positioning: 'premium' as const
        }
      },
      strategy: {
        recommendedApproach: parsed.strategy?.recommendedApproach || 'Value-based pricing with strong ROI justification',
        pricingFramework: parsed.strategy?.pricingFramework || 'ROI-based value pricing',
        negotiationTactics: parsed.strategy?.negotiationTactics || [
          'Lead with value and ROI, not price',
          'Offer multiple pricing options',
          'Use social proof and case studies'
        ],
valueProposition: parsed.strategy?.valueProposition || `Deliver ${baseCalc.monthlyImpact.toLocaleString()} in monthly impact with ${baseCalc.roiPercentage.toFixed(0)}% ROI`,
        presentationStructure: parsed.strategy?.presentationStructure || [],
        phases: parsed.strategy?.phases || [],
        kpis: parsed.strategy?.kpis || []
      },
      benchmarks: {
        industry: parsed.benchmarks?.industry || 'Technology',
        averageRoiMultiple: parsed.benchmarks?.averageRoiMultiple || 4.5,
        typicalHourlyRates: {
          junior: parsed.benchmarks?.typicalHourlyRates?.junior || 75,
          mid: parsed.benchmarks?.typicalHourlyRates?.mid || 125,
          senior: parsed.benchmarks?.typicalHourlyRates?.senior || 200,
          expert: parsed.benchmarks?.typicalHourlyRates?.expert || 350
        },
        commonPricingModels: parsed.benchmarks?.commonPricingModels || ['Monthly retainer', 'Project-based'],
        seasonalityFactors: parsed.benchmarks?.seasonalityFactors || [],
        paymentTermPreferences: parsed.benchmarks?.paymentTermPreferences || []
      },
      proposalTemplate: parsed.proposalTemplate || this.generateProposalTemplate(baseCalc),
      pricingPresentationSlides: parsed.pricingPresentationSlides || [],
      objectionHandling: parsed.objectionHandling || [],
      contractClauses: parsed.contractClauses || []
    };

    // Ensure pricing options are populated
    if (!sanitized.calculations.pricingOptions.length) {
      sanitized.calculations.pricingOptions = this.generateDefaultPricingOptions(baseCalc);
    }

    // Ensure phases are populated
    if (!sanitized.strategy.phases.length) {
      sanitized.strategy.phases = this.generateDefaultPhases(baseCalc);
    }

    return sanitized;
  }

  private generateDefaultPricingOptions(baseCalc: any) {
    const projectDuration = 6;
    const totalProjectValue = baseCalc.recommendedRetainer * projectDuration;
    
    return [
      {
        model: 'retainer' as const,
        price: baseCalc.recommendedRetainer,
        description: 'Monthly retainer for ongoing services',
        pros: ['Predictable income', 'Strong client relationship', 'Scope flexibility'],
        cons: ['Requires trust building', 'Scope creep risk'],
        recommendationScore: 85
      },
      {
        model: 'project' as const,
        price: totalProjectValue,
        description: 'Fixed project fee paid in milestones',
        pros: ['Clear scope boundaries', 'Upfront commitment', 'Higher margins possible'],
        cons: ['Risk of scope changes', 'Cash flow gaps'],
        recommendationScore: 75
      },
      {
        model: 'success' as const,
        price: Math.round(baseCalc.monthlyImpact * 0.4),
        description: 'Performance-based fee tied to results',
        pros: ['Aligned incentives', 'Easier client buy-in', 'Potential for higher fees'],
        cons: ['Income uncertainty', 'Complex measurement'],
        recommendationScore: 70
      }
    ];
  }

  private generateDefaultPhases(baseCalc: any) {
    return [
      {
        phase: 'Discovery & Strategy',
        duration: '2-4 weeks',
        deliverables: ['Current state analysis', 'Strategy document', 'Implementation roadmap'],
        milestones: ['Stakeholder interviews completed', 'Strategy approved'],
        payment: Math.round(baseCalc.recommendedRetainer * 1.5)
      },
      {
        phase: 'Implementation',
        duration: '4-8 weeks',
        deliverables: ['System setup', 'Process implementation', 'Team training'],
        milestones: ['System operational', 'Team certified', 'Initial results achieved'],
        payment: baseCalc.recommendedRetainer
      },
      {
        phase: 'Optimization & Handoff',
        duration: '2-4 weeks',
        deliverables: ['Performance optimization', 'Documentation', 'Knowledge transfer'],
        milestones: ['Target metrics achieved', 'Team fully independent'],
        payment: Math.round(baseCalc.recommendedRetainer * 0.5)
      }
    ];
  }

  private generateFallbackPackage(input: PricingCalculatorInput, baseCalc: any): Omit<GeneratedPricingPackage, 'tokensUsed' | 'generationTime'> {
    const projectDuration = input.projectDuration || 6;
    const totalProjectValue = baseCalc.recommendedRetainer * projectDuration;
    
    console.log('🔄 Generating fallback pricing package...');
    
    return {
      calculations: {
        monthlySavings: baseCalc.monthlyImpact,
        recommendedRetainer: baseCalc.recommendedRetainer,
        netSavings: baseCalc.netSavings,
        roiPercentage: baseCalc.roiPercentage,
        totalProjectValue,
        hourlyRate: baseCalc.baseHourlyRate,
        effectiveHourlyRate: Math.round(baseCalc.baseHourlyRate * 1.3),
        profitMargin: 65,
        pricingOptions: this.generateDefaultPricingOptions(baseCalc),
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
            low: Math.round(baseCalc.recommendedRetainer * 0.6),
            average: Math.round(baseCalc.recommendedRetainer * 0.85),
            high: Math.round(baseCalc.recommendedRetainer * 1.4)
          },
          positioning: 'premium' as const
        }
      },

      strategy: {
        recommendedApproach: 'Value-based pricing with strong ROI justification and phased implementation approach',
        pricingFramework: 'ROI-based value pricing with risk-adjusted premiums for sustainable growth',
        negotiationTactics: [
          'Lead with value and ROI, not price',
          'Offer multiple pricing options to give client control',
          'Use social proof and case studies to build trust',
          'Create urgency through limited availability or timing',
          'Focus on partnership rather than vendor relationship'
        ],
        valueProposition: `Deliver ${baseCalc.monthlyImpact.toLocaleString()} in monthly savings while maintaining ${baseCalc.roiPercentage.toFixed(0)}% ROI for your investment`,
        presentationStructure: [
          {
            section: 'Problem & Opportunity',
            content: 'Current situation analysis and potential for improvement',
            emphasis: 'high' as const
          },
          {
            section: 'Solution & Approach',
            content: 'Methodology and implementation plan',
            emphasis: 'high' as const
          },
          {
            section: 'Expected Results',
            content: 'Quantified outcomes and ROI projections',
            emphasis: 'high' as const
          },
          {
            section: 'Investment & Value',
            content: 'Pricing presentation with value justification',
            emphasis: 'medium' as const
          }
        ],
        phases: this.generateDefaultPhases(baseCalc),
        kpis: [
          {
            metric: 'Cost Savings Achieved',
            target: `${(input.annualClientSavings + input.annualRevenueIncrease).toLocaleString()} annually`,
            timeline: 'Monthly tracking',
            measurement: 'Direct cost comparison before/after'
          },
          {
            metric: 'Implementation Progress',
            target: '100% milestone completion on schedule',
            timeline: 'Weekly tracking',
            measurement: 'Milestone completion percentage'
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

      proposalTemplate: this.generateProposalTemplate(baseCalc, input),
      
    pricingPresentationSlides: [
  {
    title: 'Current Situation & Opportunity',
    content: `Your current processes represent ${(input.annualClientSavings + input.annualRevenueIncrease).toLocaleString()} in annual opportunity through cost reduction and revenue growth.`,
    visualType: 'text' as const
  },
  {
    title: 'Expected ROI & Impact',
    content: `Monthly impact: ${baseCalc.monthlyImpact.toLocaleString()} | Your investment: ${baseCalc.recommendedRetainer.toLocaleString()} | Net benefit: ${baseCalc.netSavings.toLocaleString()}`,
    visualType: 'chart' as const
  }
],

      objectionHandling: [
        {
          objection: "The price seems high",
          response: `I understand price is important. Let's look at the value - you'll save ${baseCalc.netSavings.toLocaleString()} per month after our fee, giving you a ${baseCalc.roiPercentage.toFixed(0)}% ROI.`,
          alternatives: ["Payment plan option", "Reduced scope pilot project", "Success-based fee structure"]
        },
        {
          objection: "We need to think about it",
          response: "Of course, this is an important decision. What specific concerns can I address to help with your evaluation?",
          alternatives: ["Provide references", "Offer pilot project", "Extended timeline option"]
        }
      ],

      contractClauses: [
        {
          clause: "Success Metrics",
          purpose: "Define measurable outcomes and accountability",
          template: `Services will be considered successful when Client achieves minimum ${(baseCalc.roiPercentage * 0.8).toFixed(0)}% ROI within the agreed timeline.`
        },
        {
          clause: "Payment Terms",
          purpose: "Ensure timely payment and cash flow",
          template: `Monthly retainer of ${baseCalc.recommendedRetainer.toLocaleString()} due within 15 days of invoice date.`
        }
      ]
    };
  }

  private generateProposalTemplate(baseCalc: any, input?: PricingCalculatorInput): string {
    return `
# AI Services Proposal - ${input?.clientName || 'Client Name'}

## Executive Summary
We propose to help ${input?.clientName || 'your organization'} achieve ${((input?.annualClientSavings || 0) + (input?.annualRevenueIncrease || 0)).toLocaleString() || 'significant'} in total annual impact through strategic AI implementation and process optimization.

## Investment & ROI
- **Monthly Investment:** ${baseCalc.recommendedRetainer.toLocaleString()}
- **Monthly Savings:** ${baseCalc.monthlyImpact.toLocaleString()}
- **Net Monthly Benefit:** ${baseCalc.netSavings.toLocaleString()}
- **ROI:** ${baseCalc.roiPercentage.toFixed(0)}%

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
      console.log('💾 Saving pricing calculation to database...');
      
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `Pricing Strategy - ${input.clientName || input.projectName || 'Unnamed Project'}`,
          content: JSON.stringify(calculation),
          type: 'pricing_calculation',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: {
            clientName: input.clientName,
            projectName: input.projectName,
            industry: input.industry,
            serviceType: input.serviceType,
            annualClientSavings: input.annualClientSavings,
annualRevenueIncrease: input.annualRevenueIncrease,
totalClientImpact: input.annualClientSavings + input.annualRevenueIncrease,
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

      console.log('✅ Pricing calculation saved with ID:', deliverable.id);
      return deliverable.id;
    } catch (error: any) {
      console.error('❌ Error saving pricing calculation:', error?.message);
      throw new Error('Failed to save pricing calculation: ' + error?.message);
    }
  }

  async getPricingCalculation(userId: string, calculationId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.findFirst({
        where: {
          id: calculationId,
          user_id: userId,
          type: 'pricing_calculation'
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
    } catch (error: any) {
      console.error('❌ Error retrieving pricing calculation:', error?.message);
      throw new Error('Failed to retrieve pricing calculation: ' + error?.message);
    }
  }

  async getUserPricingCalculations(userId: string, workspaceId?: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'pricing_calculation'
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
  // Handle both old and new field formats
  annualSavings: (calc.metadata as any)?.annualSavings || 
                ((calc.metadata as any)?.annualClientSavings || 0) + 
                ((calc.metadata as any)?.annualRevenueIncrease || 0),
  annualClientSavings: (calc.metadata as any)?.annualClientSavings,
  annualRevenueIncrease: (calc.metadata as any)?.annualRevenueIncrease,
  totalClientImpact: (calc.metadata as any)?.totalClientImpact,
  recommendedRetainer: (calc.metadata as any)?.recommendedRetainer,
  roiPercentage: (calc.metadata as any)?.roiPercentage,
  hourlyRate: (calc.metadata as any)?.hourlyRate,
  createdAt: calc.created_at,
  updatedAt: calc.updated_at,
  workspace: calc.workspace
}));
    } catch (error: any) {
      console.error('❌ Error fetching user pricing calculations:', error?.message);
      return [];
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

      // Generate simple comparison without AI to avoid additional complexity
      const bestScenario = scenarioResults.reduce((best, current, index) => {
        if (current.results.roiPercentage > scenarioResults[best].results.roiPercentage) {
          return index;
        }
        return best;
      }, 0);

      const comparison = {
        summary: `Compared ${scenarios.length} pricing scenarios with ROI ranging from ${Math.min(...scenarioResults.map(s => s.results.roiPercentage)).toFixed(0)}% to ${Math.max(...scenarioResults.map(s => s.results.roiPercentage)).toFixed(0)}%`,
        recommendations: [
          `Scenario ${bestScenario + 1} offers the best client ROI balance`,
          'Consider market positioning implications',
          'Factor in delivery complexity and risk'
        ],
        bestScenario
      };

      return {
        scenarios: scenarioResults,
        comparison,
        tokensUsed: 0
      };
    } catch (error: any) {
      console.error('❌ Error comparing pricing scenarios:', error?.message);
      throw new Error('Failed to compare pricing scenarios: ' + error?.message);
    }
  }
}