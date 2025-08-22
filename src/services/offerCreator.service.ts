// services/offerCreator.service.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { 
  OfferCreatorInput, 
  GeneratedOffer,
  GeneratedOfferPackage,
  SignatureOffer,
  ComparisonFeature,
  OptimizationType,
  OptimizationResult,
  AnalysisRequest,
  SavedOffer,
  ApiResponse,
  OfferPerformance,
  PerformanceSummary
} from '@/types/offerCreator';
import { Redis } from '@upstash/redis';
import { generateCacheKey } from '../app/validators/offerCreator.validator';

export interface UserOffer {
  id: string;
  title: string;
  offerData?: OfferCreatorInput;
  metadata?: {
    offerType?: string;
    targetMarket?: string;
    industries?: string[];
    conversionScore?: number;
    createdAt?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    user_id: string | null;
    color?: string | null;
    created_at: Date | null;
    updated_at: Date | null;
  } | null;
}

export class OfferCreatorService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  async generateOffer(input: OfferCreatorInput): Promise<GeneratedOfferPackage> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = generateCacheKey(input);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    // Build comprehensive offer creation prompt
    const prompt = this.buildOfferCreationPrompt(input);
    
    try {
      // Generate offer using AI
      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert business strategist and offer architect specializing in creating signature service offerings for consultants, agencies, and service providers. You understand how to package expertise into scalable, profitable offers that command premium pricing.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 6000
      });

      const parsedOffer = this.parseOfferResponse(response.content, input);
      
      const offerPackage: GeneratedOfferPackage = {
        primaryOffer: parsedOffer,
        analysis: this.generateOfferAnalysis(input, parsedOffer),
        tokensUsed: response.usage.total_tokens,
        generationTime: Date.now() - startTime
      };

      // Cache for 4 hours
      await this.redis.set(cacheKey, JSON.stringify(offerPackage), { ex: 14400 });
      
      return offerPackage;
    } catch (error) {
      console.error('Error generating offer:', error);
      throw new Error('Failed to generate offer. Please try again.');
    }
  }

  private buildOfferCreationPrompt(input: OfferCreatorInput): string {
    return `
    SIGNATURE OFFER CREATION REQUEST

    FOUNDER/TEAM PROFILE:
    Signature Results: ${input.founder.signatureResults.join(', ')}
    Core Strengths: ${input.founder.coreStrengths.join(', ')}
    Proven Processes: ${input.founder.processes.join(', ')}
    Industry Expertise: ${input.founder.industries.join(', ')}
    Proof Assets: ${input.founder.proofAssets.join(', ')}
    
    TARGET MARKET:
    Primary Market: ${input.market.targetMarket}
    Buyer Role: ${input.market.buyerRole}
    Key Pains: ${input.market.pains.join(', ')}
    Desired Outcomes: ${input.market.outcomes.join(', ')}
    
    BUSINESS MODEL:
    Delivery Models: ${input.business.deliveryModel.join(', ')}
    Client Capacity: ${input.business.capacity} concurrent clients
    Monthly Hours: ${input.business.monthlyHours} hours
    Target ACV: ${input.business.acv}
    Fulfillment Stack: ${input.business.fulfillmentStack.join(', ')}
    
    PRICING STRATEGY:
    Price Posture: ${input.pricing.pricePosture}
    Contract Style: ${input.pricing.contractStyle}
    Guarantee: ${input.pricing.guarantee}
    
    BRAND & POSITIONING:
    Brand Tone: ${input.voice.brandTone}
    Positioning: ${input.voice.positioning}
    Key Differentiators: ${input.voice.differentiators.join(', ')}

    DELIVERABLE REQUIREMENTS:
    Create a comprehensive signature offer package with three tiers (Starter, Core, Premium) in JSON format:

    {
      "signatureOffers": {
        "starter": {
          "name": "clear offer name that reflects value",
          "for": "specific target customer description",
          "promise": "core promise/outcome in one sentence",
          "scope": ["specific deliverable 1", "specific deliverable 2", "specific deliverable 3"],
          "proof": ["credibility element 1", "credibility element 2", "credibility element 3"],
          "timeline": "realistic delivery timeline",
          "milestones": ["milestone 1", "milestone 2", "milestone 3"],
          "pricing": "pricing model explanation",
          "term": "contract terms",
          "guarantee": "guarantee description",
          "clientLift": "expected client outcome/lift",
          "requirements": "what client needs to provide"
        },
        "core": {
          // Same structure but more comprehensive
        },
        "premium": {
          // Same structure but most comprehensive
        }
      },
      "comparisonTable": {
        "features": [
          {
            "name": "Feature name",
            "starter": "✓ or ✕ or specific detail",
            "core": "✓ or ✕ or specific detail", 
            "premium": "✓ or ✕ or specific detail"
          }
          // 8-12 key differentiating features
        ]
      },
      "pricing": {
        "starter": "$X,XXX/month",
        "core": "$X,XXX/month", 
        "premium": "$X,XXX/month"
      }
    }

    CREATION GUIDELINES:
    1. Base pricing on the target ACV and capacity constraints
    2. Align offers with the chosen delivery models
    3. Incorporate the brand tone and positioning angle
    4. Use industry-specific language and pain points
    5. Build logical progression from starter to premium
    6. Include specific, measurable outcomes
    7. Reference the founder's proven processes and strengths
    8. Create compelling but realistic promises
    9. Ensure offers are scalable within capacity limits
    10. Match guarantee level to pricing posture

    PRICING GUIDELINES:
    - Starter: Entry-level, 60-70% of target ACV
    - Core: Sweet spot, 100% of target ACV 
    - Premium: High-touch, 150-200% of target ACV
    - Ensure pricing reflects the chosen price posture
    - Account for delivery model complexity

    DIFFERENTIATION FOCUS:
    - Highlight unique processes and methodologies
    - Incorporate specific industry expertise
    - Emphasize proven results and outcomes
    - Use positioning angle (${input.voice.positioning}) consistently
    - Reference key differentiators: ${input.voice.differentiators.join(', ')}

    Make the offers compelling, specific, and aligned with the founder's expertise while solving real customer problems.
    `;
  }

  private parseOfferResponse(content: string, input: OfferCreatorInput): GeneratedOffer {
    try {
      // Try to parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, generating fallback offer');
    }

    // Fallback to structured generation if JSON fails
    return this.generateFallbackOffer(input);
  }

  private generateFallbackOffer(input: OfferCreatorInput): GeneratedOffer {
    const baseACV = this.parseACV(input.business.acv);
    const capacity = parseInt(input.business.capacity) || 10;
    
    // Calculate pricing tiers based on ACV and capacity
    const starterPrice = Math.round(baseACV * 0.65 / 12);
    const corePrice = Math.round(baseACV / 12);
    const premiumPrice = Math.round(baseACV * 1.75 / 12);

    const industryFocus = input.founder.industries[0] || 'business';
    const primaryPain = input.market.pains[0] || 'operational inefficiency';
    const primaryOutcome = input.market.outcomes[0] || 'improved performance';
    const primaryStrength = input.founder.coreStrengths[0] || 'consulting';
    const primaryProcess = input.founder.processes[0] || 'strategic planning';

    return {
      signatureOffers: {
        starter: {
          name: `${industryFocus} ${primaryStrength} Starter`,
          for: `${input.market.targetMarket} ${input.market.buyerRole}s looking to address ${primaryPain}`,
          promise: `Achieve ${primaryOutcome} through proven ${primaryStrength} methodology`,
          scope: [
            `Initial ${primaryProcess} assessment and strategy`,
            'Monthly progress review and optimization',
            'Basic implementation guidance'
          ],
          proof: [
            input.founder.signatureResults[0] || 'Proven track record in industry',
            `Expertise in ${primaryStrength}`,
            `Specialized ${industryFocus} knowledge`
          ],
          timeline: '30-60 days for initial results',
          milestones: [
            'Week 1-2: Assessment and strategy development',
            'Week 3-4: Implementation kickoff',
            'Month 2: First optimization cycle'
          ],
          pricing: `${starterPrice.toLocaleString()}/month`,
          term: input.pricing.contractStyle,
          guarantee: this.generateGuarantee(input.pricing.guarantee, 'starter'),
          clientLift: `15-25% improvement in ${primaryOutcome}`,
          requirements: 'Dedicated point of contact, basic data access'
        },
        core: {
          name: `${industryFocus} ${primaryStrength} Core`,
          for: `Established ${input.market.targetMarket} businesses ready for comprehensive ${primaryOutcome}`,
          promise: `Transform ${primaryPain} into competitive advantage with our complete ${primaryProcess} system`,
          scope: [
            `Full ${primaryProcess} implementation`,
            'Weekly strategic sessions and optimization',
            'Custom process development',
            'Team training and knowledge transfer',
            'Performance tracking and reporting'
          ],
          proof: [
            input.founder.signatureResults[0] || 'Documented success stories',
            input.founder.signatureResults[1] || 'Industry expertise',
            `Proprietary ${primaryProcess} methodology`
          ],
          timeline: '90-120 days for full transformation',
          milestones: [
            'Month 1: Complete assessment and custom strategy',
            'Month 2: Implementation and team training',
            'Month 3: Optimization and performance validation'
          ],
          pricing: `${corePrice.toLocaleString()}/month`,
          term: input.pricing.contractStyle,
          guarantee: this.generateGuarantee(input.pricing.guarantee, 'core'),
          clientLift: `30-50% improvement in ${primaryOutcome}`,
          requirements: 'Executive sponsorship, team availability, data transparency'
        },
        premium: {
          name: `${industryFocus} ${primaryStrength} Premium`,
          for: `High-growth ${input.market.targetMarket} organizations seeking market leadership`,
          promise: `Achieve industry-leading ${primaryOutcome} with white-glove ${primaryStrength} partnership`,
          scope: [
            `Comprehensive ${primaryProcess} transformation`,
            'Daily advisory and strategic support',
            'Custom methodology development',
            'Executive coaching and leadership development',
            'Advanced analytics and predictive insights',
            'Priority access to latest innovations'
          ],
          proof: [
            input.founder.signatureResults[0] || 'Elite client portfolio',
            'C-level advisory experience',
            `Advanced ${primaryStrength} certifications`
          ],
          timeline: '6-12 months for market leadership position',
          milestones: [
            'Month 1-2: Executive alignment and strategic roadmap',
            'Month 3-6: Full transformation implementation',
            'Month 6-12: Market leadership and scaling'
          ],
          pricing: `${premiumPrice.toLocaleString()}/month`,
          term: input.pricing.contractStyle,
          guarantee: this.generateGuarantee(input.pricing.guarantee, 'premium'),
          clientLift: `50-100% improvement in ${primaryOutcome}`,
          requirements: 'C-level commitment, dedicated team, comprehensive data access'
        }
      },
      comparisonTable: {
        features: [
          { name: 'Strategy Development', starter: 'Basic', core: 'Comprehensive', premium: 'Advanced + Custom' },
          { name: 'Implementation Support', starter: 'Guidance', core: 'Hands-on', premium: 'White-glove' },
          { name: 'Meeting Frequency', starter: 'Monthly', core: 'Weekly', premium: 'Daily Access' },
          { name: 'Team Training', starter: '✕', core: '✓', premium: '✓ + Coaching' },
          { name: 'Custom Processes', starter: '✕', core: 'Limited', premium: 'Unlimited' },
          { name: 'Performance Tracking', starter: 'Basic', core: 'Advanced', premium: 'Predictive Analytics' },
          { name: 'Response Time', starter: '48 hours', core: '24 hours', premium: '4 hours' },
          { name: 'Executive Access', starter: '✕', core: 'Monthly', premium: 'On-demand' }
        ]
      },
      pricing: {
        starter: `${starterPrice.toLocaleString()}/month`,
        core: `${corePrice.toLocaleString()}/month`,
        premium: `${premiumPrice.toLocaleString()}/month`
      }
    };
  }

  private parseACV(acvString: string): number {
    const match = acvString.match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''));
    }
    return 100000; // Default fallback
  }

  private generateGuarantee(guaranteeType: string, tier: string): string {
    switch (guaranteeType) {
      case 'strong-guarantee':
        return tier === 'premium' ? 
          'Results guarantee: If you don\'t see measurable improvement within 90 days, we\'ll work for free until you do' :
          'Satisfaction guarantee: 30-day money-back guarantee if not completely satisfied';
      case 'conditional':
        return 'Performance guarantee: Results contingent on full engagement and implementation';
      default:
        return 'Professional service guarantee: All work delivered to industry standards';
    }
  }

  private generateOfferAnalysis(input: OfferCreatorInput, offer: GeneratedOffer) {
    const strengths = this.calculateOfferStrengths(input);
    const marketFit = this.assessMarketFit(input);
    const scalability = this.assessScalability(input);

    return {
      conversionPotential: {
        score: Math.round((strengths + marketFit + scalability) / 3),
        factors: [
          {
            factor: 'Founder credibility',
            impact: (strengths > 75 ? 'High' : strengths > 50 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
            recommendation: strengths < 60 ? 'Strengthen proof assets and case studies' : 'Leverage strong credibility in messaging'
          },
          {
            factor: 'Market alignment',
            impact: (marketFit > 75 ? 'High' : marketFit > 50 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
            recommendation: marketFit < 60 ? 'Refine target market and pain point focus' : 'Strong market-problem fit'
          },
          {
            factor: 'Business model',
            impact: (scalability > 75 ? 'High' : scalability > 50 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
            recommendation: scalability < 60 ? 'Optimize delivery model for scalability' : 'Well-designed scalable model'
          }
        ]
      }
    };
  }

  private calculateOfferStrengths(input: OfferCreatorInput): number {
    let score = 0;
    
    // Signature results strength (25%)
    score += Math.min(25, input.founder.signatureResults.length * 6);
    
    // Core strengths diversity (20%)
    score += Math.min(20, input.founder.coreStrengths.length * 4);
    
    // Process maturity (20%)
    score += Math.min(20, input.founder.processes.length * 5);
    
    // Industry focus (15%)
    score += input.founder.industries.length <= 2 ? 15 : 10;
    
    // Proof assets (10%)
    score += Math.min(10, input.founder.proofAssets.length * 2);
    
    // Differentiation clarity (10%)
    score += Math.min(10, input.voice.differentiators.length * 3);
    
    return Math.min(100, score);
  }

  private assessMarketFit(input: OfferCreatorInput): number {
    let score = 0;
    
    // Pain point clarity (30%)
    score += Math.min(30, input.market.pains.length * 10);
    
    // Outcome specificity (25%)
    score += Math.min(25, input.market.outcomes.length * 6);
    
    // Target market specificity (20%)
    score += input.market.targetMarket.length > 10 ? 20 : 10;
    
    // Buyer role clarity (15%)
    score += input.market.buyerRole.length > 5 ? 15 : 8;
    
    // Market-founder alignment (10%)
    const hasIndustryAlignment = input.founder.industries.some(industry => 
      input.market.targetMarket.toLowerCase().includes(industry.toLowerCase())
    );
    score += hasIndustryAlignment ? 10 : 5;
    
    return Math.min(100, score);
  }

  private assessScalability(input: OfferCreatorInput): number {
    let score = 0;
    
    // Delivery model scalability (30%)
    const scalableModels = ['productized-service', 'training', 'licensing'];
    const hasScalableModel = input.business.deliveryModel.some(model => 
      scalableModels.includes(model)
    );
    score += hasScalableModel ? 30 : 15;
    
    // Capacity planning (25%)
    const capacity = parseInt(input.business.capacity);
    const monthlyHours = parseInt(input.business.monthlyHours);
    if (!isNaN(capacity) && !isNaN(monthlyHours)) {
      const hoursPerClient = monthlyHours / capacity;
      score += hoursPerClient > 10 && hoursPerClient < 50 ? 25 : 15;
    }
    
    // Pricing strategy (20%)
    score += input.pricing.pricePosture === 'premium' ? 20 : 
             input.pricing.pricePosture === 'value-priced' ? 15 : 10;
    
    // Contract structure (15%)
    score += input.pricing.contractStyle !== 'month-to-month' ? 15 : 8;
    
    // Fulfillment automation (10%)
    score += input.business.fulfillmentStack.length > 2 ? 10 : 5;
    
    return Math.min(100, score);
  }

  async saveOffer(userId: string, workspaceId: string, offer: GeneratedOfferPackage, input: OfferCreatorInput): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      console.log('📝 Creating signature offer deliverable...');
      
      // Create a clean copy of the offer to avoid circular references
      const cleanOffer = {
        signatureOffers: offer.primaryOffer.signatureOffers || {},
        comparisonTable: offer.primaryOffer.comparisonTable || {},
        pricing: offer.primaryOffer.pricing || {},
        analysis: offer.analysis || {},
        tokensUsed: offer.tokensUsed || 0,
        generationTime: offer.generationTime || 0,
        originalInput: input
      };
      
      const serializedOffer = JSON.stringify(cleanOffer, null, 2);
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `Signature Offers - ${input.market.targetMarket}`,
          content: serializedOffer,
          type: 'signature_offers',
          user_id: userId,
          workspace_id: workspaceId || 'default',
          metadata: {
            targetMarket: input.market.targetMarket,
            buyerRole: input.market.buyerRole,
            industries: input.founder.industries,
            deliveryModels: input.business.deliveryModel,
            pricePosture: input.pricing.pricePosture,
            brandTone: input.voice.brandTone,
            positioning: input.voice.positioning,
            conversionScore: offer.analysis?.conversionPotential?.score || 75,
            generatedAt: new Date().toISOString(),
            tokensUsed: offer.tokensUsed || 0,
            generationTime: offer.generationTime || 0,
            capacity: input.business.capacity,
            monthlyHours: input.business.monthlyHours,
            acv: input.business.acv
          },
          tags: [
            'signature-offers',
            'business-strategy',
            input.market.targetMarket.toLowerCase().replace(/\s/g, '-'),
            input.pricing.pricePosture,
            ...input.founder.industries.map(i => i.toLowerCase().replace(/\s/g, '-'))
          ]
        }
      });

      console.log('✅ Signature offer deliverable created successfully with ID:', deliverable.id);
      return deliverable.id;
    } catch (error) {
      console.error('💥 Error saving signature offers:', error);
      throw error;
    }
  }

  async getUserOffers(userId: string, workspaceId?: string): Promise<UserOffer[]> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'signature_offers'
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const offers = await prisma.deliverable.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        include: {
          workspace: true
        }
      });

      return offers.map(offer => ({
        id: offer.id,
        title: offer.title,
        offerData: (offer.metadata as any)?.originalInput,
        metadata: {
          targetMarket: (offer.metadata as any)?.targetMarket,
          industries: (offer.metadata as any)?.industries,
          conversionScore: (offer.metadata as any)?.conversionScore,
          pricePosture: (offer.metadata as any)?.pricePosture,
          createdAt: (offer.metadata as any)?.generatedAt
        },
        createdAt: offer.created_at,
        updatedAt: offer.updated_at,
        workspace: offer.workspace
      }));
    } catch (error) {
      console.error('Error fetching user offers:', error);
      return [];
    }
  }

  async getOffer(userId: string, offerId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.findFirst({
        where: {
          id: offerId,
          user_id: userId,
          type: 'signature_offers'
        },
        include: {
          workspace: true
        }
      });

      if (!deliverable) {
        return null;
      }

      let parsedOffer;
      try {
        parsedOffer = JSON.parse(deliverable.content);
      } catch (parseError) {
        console.error('Error parsing offer content:', parseError);
        // Return a basic structure if parsing fails
        parsedOffer = {
          signatureOffers: {
            starter: { name: 'Error loading offer' },
            core: { name: 'Error loading offer' },
            premium: { name: 'Error loading offer' }
          },
          analysis: { conversionPotential: { score: 0 } }
        };
      }

      return {
        id: deliverable.id,
        title: deliverable.title,
        offer: parsedOffer,
        metadata: deliverable.metadata,
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        workspace: deliverable.workspace
      };
    } catch (error) {
      console.error('Error retrieving offer:', error);
      throw error;
    }
  }

  async optimizeOffer(userId: string, offerId: string, optimizationType: OptimizationType): Promise<OptimizationResult> {
    try {
      const offer = await this.getOffer(userId, offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      const optimizationPrompt = this.buildOptimizationPrompt(offer.offer, optimizationType);
      
      const response = await this.openRouterClient.complete({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'You are a business strategy optimization expert. Provide specific, actionable improvements to signature offers.'
          },
          {
            role: 'user',
            content: optimizationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      // Parse optimization response
      const optimizations = this.parseOptimizationResponse(response.content, optimizationType);

      return {
        ...optimizations,
        tokensUsed: response.usage.total_tokens
      };
    } catch (error) {
      console.error('Error optimizing offer:', error);
      throw error;
    }
  }

  private buildOptimizationPrompt(offer: any, type: OptimizationType): string {
    const prompts = {
      pricing: `Analyze and optimize the pricing strategy for these signature offers: ${JSON.stringify(offer.pricing)}. Consider market positioning, value delivery, and profit margins.`,
      positioning: `Improve the positioning and messaging for these offers: ${JSON.stringify(offer.signatureOffers)}. Focus on differentiation and market appeal.`,
      messaging: `Enhance the core messaging and value propositions across all tiers. Current offers: ${JSON.stringify(offer.signatureOffers)}`,
      delivery: `Optimize the delivery model and service scope for better scalability and client outcomes. Current structure: ${JSON.stringify(offer.signatureOffers)}`,
      guarantee: `Strengthen the guarantee and risk-reversal strategy across all offer tiers to increase conversion confidence.`
    };

    return prompts[type] + `

    Provide 3 specific optimization recommendations in JSON format:
    {
      "originalElement": "current approach description",
      "optimizedVersions": [
        {
          "version": "optimized approach",
          "rationale": "why this improvement works",
          "expectedImpact": "expected business impact"
        }
      ]
    }`;
  }

  private parseOptimizationResponse(content: string, type: OptimizationType): Omit<OptimizationResult, 'tokensUsed'> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // Fallback optimization
    }

    return {
      originalElement: `Current ${type} approach`,
      optimizedVersions: [
        {
          version: `Enhanced ${type} strategy v1`,
          rationale: 'Improved market positioning and value clarity',
          expectedImpact: '15-25% improvement in client acquisition'
        },
        {
          version: `Optimized ${type} approach v2`,
          rationale: 'Better differentiation and competitive advantage',
          expectedImpact: '20-30% increase in conversion rates'
        },
        {
          version: `Advanced ${type} methodology v3`,
          rationale: 'Scalable framework with premium positioning',
          expectedImpact: '25-40% improvement in profitability'
        }
      ]
    };
  }

  async deleteOffer(userId: string, offerId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: offerId,
          user_id: userId,
          type: 'signature_offers'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }
  }

  async exportOffer(userId: string, offerId: string, format: 'json' | 'html' = 'json') {
    try {
      const offer = await this.getOffer(userId, offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      if (format === 'json') {
        return {
          format: 'json',
          content: offer,
          filename: `signature-offers-${(offer.metadata as any)?.targetMarket || 'export'}.json`
        };
      }

      // For HTML format, generate a structured HTML export
      const htmlContent = this.generateHTMLExport(offer);
      return {
        format: 'html',
        content: htmlContent,
        filename: `signature-offers-${(offer.metadata as any)?.targetMarket || 'export'}.html`
      };
    } catch (error) {
      console.error('Error exporting offer:', error);
      throw error;
    }
  }

  private generateHTMLExport(offer: any): string {
    const offerData = offer.offer;
    const metadata = offer.metadata;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Signature Offers - ${metadata?.targetMarket}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 40px; color: #333; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #007bff; }
        .offer-tier { background: #f8f9fa; margin: 30px 0; padding: 30px; border-radius: 8px; border-left: 5px solid #007bff; }
        .offer-tier.core { border-left-color: #28a745; background: #f8fff8; }
        .offer-tier.premium { border-left-color: #6f42c1; background: #faf8ff; }
        .comparison-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .comparison-table th, .comparison-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .comparison-table th { background: #007bff; color: white; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
        .pricing-card { background: white; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; }
        .pricing-card.recommended { border-color: #28a745; transform: scale(1.02); }
        .price { font-size: 2em; font-weight: bold; color: #007bff; margin: 10px 0; }
        h1, h2, h3 { color: #2c3e50; }
        .meta-info { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .tag { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin: 2px; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Signature Offers Portfolio</h1>
            <p><strong>Target Market:</strong> ${metadata?.targetMarket}</p>
            <p><strong>Generated:</strong> ${new Date(metadata?.createdAt || Date.now()).toLocaleDateString()}</p>
            <p><strong>Conversion Score:</strong> <span class="tag">${metadata?.conversionScore || 'N/A'}%</span></p>
        </div>

        <div class="pricing-grid">
            <div class="pricing-card">
                <h3>Starter</h3>
                <div class="price">${offerData.pricing?.starter || 'TBD'}</div>
                <p>Entry-level solution</p>
            </div>
            <div class="pricing-card recommended">
                <h3>Core</h3>
                <div class="price">${offerData.pricing?.core || 'TBD'}</div>
                <p>Recommended solution</p>
            </div>
            <div class="pricing-card">
                <h3>Premium</h3>
                <div class="price">${offerData.pricing?.premium || 'TBD'}</div>
                <p>Premium solution</p>
            </div>
        </div>

        <div class="offer-tier starter">
            <h2>${offerData.signatureOffers?.starter?.name || 'Starter Offer'}</h2>
            <p><strong>For:</strong> ${offerData.signatureOffers?.starter?.for || 'Entry-level clients'}</p>
            <p><strong>Promise:</strong> ${offerData.signatureOffers?.starter?.promise || 'Core value delivery'}</p>
            
            <h4>What's Included:</h4>
            <ul>
                ${offerData.signatureOffers?.starter?.scope?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Basic service delivery</li>'}
            </ul>
            
            <h4>Timeline:</h4>
            <p>${offerData.signatureOffers?.starter?.timeline || '30-60 days'}</p>
            
            <h4>Expected Results:</h4>
            <p>${offerData.signatureOffers?.starter?.clientLift || 'Measurable improvement'}</p>
        </div>

        <div class="offer-tier core">
            <h2>${offerData.signatureOffers?.core?.name || 'Core Offer'}</h2>
            <p><strong>For:</strong> ${offerData.signatureOffers?.core?.for || 'Growing businesses'}</p>
            <p><strong>Promise:</strong> ${offerData.signatureOffers?.core?.promise || 'Comprehensive transformation'}</p>
            
            <h4>What's Included:</h4>
            <ul>
                ${offerData.signatureOffers?.core?.scope?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Full service delivery</li>'}
            </ul>
            
            <h4>Timeline:</h4>
            <p>${offerData.signatureOffers?.core?.timeline || '90-120 days'}</p>
            
            <h4>Expected Results:</h4>
            <p>${offerData.signatureOffers?.core?.clientLift || 'Significant improvement'}</p>
        </div>

        <div class="offer-tier premium">
            <h2>${offerData.signatureOffers?.premium?.name || 'Premium Offer'}</h2>
            <p><strong>For:</strong> ${offerData.signatureOffers?.premium?.for || 'Enterprise clients'}</p>
            <p><strong>Promise:</strong> ${offerData.signatureOffers?.premium?.promise || 'Market leadership'}</p>
            
            <h4>What's Included:</h4>
            <ul>
                ${offerData.signatureOffers?.premium?.scope?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Premium service delivery</li>'}
            </ul>
            
            <h4>Timeline:</h4>
            <p>${offerData.signatureOffers?.premium?.timeline || '6-12 months'}</p>
            
            <h4>Expected Results:</h4>
            <p>${offerData.signatureOffers?.premium?.clientLift || 'Exceptional results'}</p>
        </div>

        <h2>Feature Comparison</h2>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>Starter</th>
                    <th>Core</th>
                    <th>Premium</th>
                </tr>
            </thead>
            <tbody>
                ${offerData.comparisonTable?.features?.map((feature: any) => `
                    <tr>
                        <td><strong>${feature.name}</strong></td>
                        <td>${feature.starter}</td>
                        <td>${feature.core}</td>
                        <td>${feature.premium}</td>
                    </tr>
                `).join('') || '<tr><td colspan="4">No comparison data available</td></tr>'}
            </tbody>
        </table>

        <div class="meta-info">
            <h3>Analysis Summary</h3>
            <p><strong>Conversion Potential:</strong> ${offerData.analysis?.conversionPotential?.score || 'Not analyzed'}%</p>
            <p><strong>Generated with:</strong> ${offerData.tokensUsed || 0} AI tokens in ${offerData.generationTime || 0}ms</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Cache management
  async clearOfferCache(input: OfferCreatorInput): Promise<void> {
    try {
      const cacheKey = generateCacheKey(input);
      await this.redis.del(cacheKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
      // Don't throw error for cache issues
    }
  }

  async getCacheStats(): Promise<{ hits: number; misses: number }> {
    try {
      // This would require implementing cache hit/miss tracking
      // For now, return placeholder values
      return { hits: 0, misses: 0 };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { hits: 0, misses: 0 };
    }
  }

  // Performance tracking methods
  async updateOfferPerformance(
    userId: string, 
    offerId: string, 
    performanceData: {
      inquiries: number;
      proposals: number;
      conversions: number;
      avgDealSize: number;
      timeToClose: number;
      dateRange: { start: string; end: string };
    }
  ): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      // First verify the offer belongs to the user
      const offer = await prisma.deliverable.findFirst({
        where: {
          id: offerId,
          user_id: userId,
          type: 'signature_offers'
        }
      });

      if (!offer) {
        throw new Error('Offer not found or access denied');
      }

      // Calculate metrics
      const proposalRate = performanceData.inquiries > 0 ? (performanceData.proposals / performanceData.inquiries) * 100 : 0;
      const conversionRate = performanceData.proposals > 0 ? (performanceData.conversions / performanceData.proposals) * 100 : 0;
      const totalRevenue = performanceData.conversions * performanceData.avgDealSize;

      // Update offer metadata with performance data
      const currentMetadata = offer.metadata as any || {};
      const performanceHistory = currentMetadata.performanceHistory || [];
      
      const newPerformanceEntry = {
        dateRange: performanceData.dateRange,
        metrics: {
          inquiries: performanceData.inquiries,
          proposals: performanceData.proposals,
          conversions: performanceData.conversions,
          avgDealSize: performanceData.avgDealSize,
          timeToClose: performanceData.timeToClose,
          proposalRate: Math.round(proposalRate * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100
        },
        recordedAt: new Date().toISOString()
      };

      performanceHistory.push(newPerformanceEntry);

      // Keep only last 12 entries
      if (performanceHistory.length > 12) {
        performanceHistory.splice(0, performanceHistory.length - 12);
      }

      // Generate insights
      const insights = this.generatePerformanceInsights(performanceHistory, newPerformanceEntry.metrics);

      await prisma.deliverable.update({
        where: { id: offerId },
        data: {
          metadata: {
            ...currentMetadata,
            performanceHistory,
            latestMetrics: newPerformanceEntry.metrics,
            latestInsights: insights,
            lastUpdated: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error updating offer performance:', error);
      throw error;
    }
  }

  private generatePerformanceInsights(history: any[], latestMetrics: any): string[] {
    const insights: string[] = [];
    
    // Conversion rate analysis
    if (latestMetrics.conversionRate > 25) {
      insights.push('Excellent conversion rate - consider raising prices');
    } else if (latestMetrics.conversionRate < 10) {
      insights.push('Low conversion rate - review offer positioning and pricing');
    }
    
    // Deal size analysis
    if (latestMetrics.avgDealSize > 50000) {
      insights.push('High-value deals - focus on retention and upselling');
    } else if (latestMetrics.avgDealSize < 10000) {
      insights.push('Consider premium tier positioning to increase deal size');
    }
    
    // Time to close analysis
    if (latestMetrics.timeToClose > 90) {
      insights.push('Long sales cycle - consider adding urgency or trial options');
    } else if (latestMetrics.timeToClose < 30) {
      insights.push('Quick sales cycle - excellent market fit');
    }
    
    // Trend analysis if we have historical data
    if (history.length >= 3) {
      const recent = history.slice(-3);
      const avgRecentConversion = recent.reduce((sum, entry) => sum + entry.metrics.conversionRate, 0) / 3;
      const older = history.slice(-6, -3);
      
      if (older.length > 0) {
        const avgOlderConversion = older.reduce((sum, entry) => sum + entry.metrics.conversionRate, 0) / older.length;
        
        if (avgRecentConversion > avgOlderConversion * 1.2) {
          insights.push('Conversion rate trending up - great momentum');
        } else if (avgRecentConversion < avgOlderConversion * 0.8) {
          insights.push('Conversion rate declining - review recent changes');
        }
      }
    }
    
    return insights.slice(0, 5); // Return top 5 insights
  }

  // Helper function for industry benchmarks
  private getIndustryBenchmark(industry: string) {
    const benchmarks: Record<string, any> = {
      'B2B SaaS': {
        averageConversionRate: 3.5,
        averageProposalRate: 25,
        averageDealSize: 50000,
        averageTimeToClose: 60
      },
      'E-commerce': {
        averageConversionRate: 2.8,
        averageProposalRate: 35,
        averageDealSize: 15000,
        averageTimeToClose: 30
      },
      'Healthcare': {
        averageConversionRate: 4.2,
        averageProposalRate: 30,
        averageDealSize: 75000,
        averageTimeToClose: 90
      },
      'Finance': {
        averageConversionRate: 3.8,
        averageProposalRate: 28,
        averageDealSize: 100000,
        averageTimeToClose: 120
      },
      'Marketing Agencies': {
        averageConversionRate: 5.5,
        averageProposalRate: 40,
        averageDealSize: 25000,
        averageTimeToClose: 45
      },
      'General': {
        averageConversionRate: 3.0,
        averageProposalRate: 30,
        averageDealSize: 35000,
        averageTimeToClose: 60
      }
    };

    return benchmarks[industry] || benchmarks['General'];
  }

  async getOfferPerformance(userId: string, offerId: string): Promise<OfferPerformance> {
    try {
      const offer = await this.getOffer(userId, offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      const metadata = offer.metadata as any || {};
      const performanceHistory = metadata.performanceHistory || [];
      const latestMetrics = metadata.latestMetrics;
      const insights = metadata.latestInsights || [];
      const benchmark = metadata.industryBenchmark || this.getIndustryBenchmark(metadata.targetIndustry || 'General');

      const summary = this.generatePerformanceSummary(performanceHistory);

      return {
        offerId,
        offerName: metadata.offerName || offer.title,
        performanceHistory,
        latestMetrics,
        insights,
        summary
      };
    } catch (error) {
      console.error('Error getting offer performance:', error);
      throw error;
    }
  }

  private generatePerformanceSummary(history: any[]): PerformanceSummary {
    if (history.length === 0) {
      return {
        totalInquiries: 0,
        totalProposals: 0,
        totalConversions: 0,
        totalRevenue: 0,
        averageConversionRate: 0,
        averageProposalRate: 0,
        averageDealSize: 0,
        trend: 'no-data' as const,
        dataPoints: 0
      };
    }

    const totals = history.reduce(
      (acc, entry) => ({
        inquiries: acc.inquiries + entry.metrics.inquiries,
        proposals: acc.proposals + entry.metrics.proposals,
        conversions: acc.conversions + entry.metrics.conversions,
        revenue: acc.revenue + entry.metrics.totalRevenue
      }),
      { inquiries: 0, proposals: 0, conversions: 0, revenue: 0 }
    );

    const averageConversionRate = history.reduce(
      (sum, entry) => sum + entry.metrics.conversionRate,
      0
    ) / history.length;

    const averageProposalRate = history.reduce(
      (sum, entry) => sum + entry.metrics.proposalRate,
      0
    ) / history.length;

    const averageDealSize = totals.conversions > 0 ? totals.revenue / totals.conversions : 0;

    // Determine trend with proper typing
    let trend: 'improving' | 'stable' | 'declining' | 'no-data' = 'stable';
    if (history.length >= 3) {
      const recent = history.slice(-3);
      const recentAvgConversion = recent.reduce((sum, entry) => sum + entry.metrics.conversionRate, 0) / 3;
      const older = history.slice(-6, -3);
      if (older.length > 0) {
        const olderAvgConversion = older.reduce((sum, entry) => sum + entry.metrics.conversionRate, 0) / older.length;
        if (recentAvgConversion > olderAvgConversion * 1.1) {
          trend = 'improving';
        } else if (recentAvgConversion < olderAvgConversion * 0.9) {
          trend = 'declining';
        }
      }
    }

    return {
      totalInquiries: totals.inquiries,
      totalProposals: totals.proposals,
      totalConversions: totals.conversions,
      totalRevenue: Math.round(totals.revenue * 100) / 100,
      averageConversionRate: Math.round(averageConversionRate * 100) / 100,
      averageProposalRate: Math.round(averageProposalRate * 100) / 100,
      averageDealSize: Math.round(averageDealSize * 100) / 100,
      trend,
      dataPoints: history.length
    };
  }
}