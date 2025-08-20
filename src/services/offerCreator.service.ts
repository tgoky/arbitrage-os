// services/offerCreator.service.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { 
  OfferCreatorInput, 
  GeneratedOfferPackage,
  OptimizationType,
  OptimizationResult,
  AnalysisRequest,
  ConversionAnalysis,
  PsychologyAnalysis,
  CompetitiveAnalysis
} from '@/types/offerCreator';
import { Redis } from '@upstash/redis';
import { generateCacheKey } from '../app/validators/offerCreator.validator';
import { 
  generatePerformanceInsights, 
  getIndustryBenchmark,
  calculateOfferMetrics,
  formatOfferDeadline,
  generateEmailSubjectLines,
  generateSocialMediaCaptions,
  getDaysUntilExpiry,
  getIndustrySpecificTips
} from '@/utils/offerCreator.utils';

// Add these interfaces after your imports
export interface UserOffer {
  id: string;
  title: string;
  offerName?: string;
  offerType?: string;
  targetIndustry?: string;
  conversionScore?: number;
  expiryDate?: string;
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
    
    // Generate offer using AI
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert conversion copywriter and marketing strategist specializing in creating high-converting offers. You understand consumer psychology, persuasion techniques, and proven frameworks that drive action. Generate comprehensive offer packages that not only convert but also provide complete marketing assets.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const parsedOffer = this.parseOfferResponse(response.content, input);
    
    const offerPackage: GeneratedOfferPackage = {
      ...parsedOffer,
      tokensUsed: response.usage.total_tokens,
      generationTime: Date.now() - startTime
    };

    // Cache for 2 hours
    await this.redis.set(cacheKey, JSON.stringify(offerPackage), { ex: 7200 });
    
    return offerPackage;
  }

  private buildOfferCreationPrompt(input: OfferCreatorInput): string {
    return `
    OFFER CREATION & OPTIMIZATION REQUEST

    OFFER DETAILS:
    - Name: ${input.offerName}
    - Value Proposition: ${input.offerValue}
    - Regular Price: ${input.regularPrice}
    - Offer Price: ${input.offerPrice}
    - Expires: ${input.expiryDate}
    - Target Industry: ${input.targetIndustry}
    
    OFFER TYPE & STRATEGY:
    - Type: ${input.offerType}
    ${input.offerType === 'discount' ? `
    - Discount: ${input.discountValue}% (${input.discountAmount})` : ''}
    ${input.offerType === 'bonus' ? `
    - Bonus Item: ${input.bonusItem}
    - Bonus Value: ${input.bonusValue}
    - Total Package Value: ${input.totalValue}` : ''}
    ${input.offerType === 'trial' ? `
    - Trial Period: ${input.trialPeriod} days` : ''}
    ${input.offerType === 'guarantee' ? `
    - Guarantee Period: ${input.guaranteePeriod} days` : ''}
    
    CONVERSION ELEMENTS:
    - Call-to-Action: ${input.cta || 'Not specified'}
    - Redemption Method: ${input.redemptionInstructions || 'Not specified'}
    - Scarcity Element: ${input.scarcity ? `Yes - ${input.scarcityReason}` : 'No'}
    - Social Proof: ${input.socialProof ? `Yes - "${input.testimonialQuote}" - ${input.testimonialAuthor}` : 'No'}
    
    BUSINESS CONTEXT:
    - Goal: ${input.businessGoal || 'Not specified'}
    - Target Segment: ${input.customerSegment || 'Not specified'}
    - Seasonality: ${input.seasonality || 'Not specified'}
    - Competition: ${input.competitorAnalysis || 'Not specified'}

    DELIVERABLE REQUIREMENTS:
    Generate a comprehensive offer package in JSON format with the following structure:

    {
      "primaryOffer": {
        "headline": "compelling main headline under 10 words",
        "subheadline": "supporting headline that elaborates value",
        "mainCopy": "persuasive body copy 150-250 words using proven frameworks",
        "bulletPoints": ["3-5 key benefit bullet points"],
        "cta": "action-oriented call-to-action text",
        "urgency": "urgency/scarcity messaging",
        "socialProof": "social proof statement",
        "riskReversal": "risk mitigation messaging",
        "offerSummary": "concise offer summary for quick reference",
        "emailSubjectLines": ["5 email subject line variations"],
        "socialMediaCaptions": ["3 social media post variations"],
        "adCopy": "optimized ad copy for paid campaigns"
      },
      "analysis": {
        "conversionPotential": {
          "score": conversion_score_1_to_100,
          "factors": [
            {
              "factor": "specific factor affecting conversion",
              "impact": "High/Medium/Low",
              "recommendation": "specific improvement suggestion"
            }
          ]
        },
        "marketFit": {
          "industryRelevance": relevance_score_1_to_100,
          "competitiveAdvantage": ["unique positioning points"],
          "marketTiming": "Excellent/Good/Fair/Poor"
        },
        "psychologyFactors": {
          "persuasionTechniques": ["techniques used in offer"],
          "cognitiveTriggersUsed": ["psychological triggers applied"],
          "emotionalAppeal": emotional_score_1_to_100
        },
        "optimizationSuggestions": [
          {
            "area": "area to optimize",
            "suggestion": "specific improvement",
            "expectedImpact": "impact description",
            "difficulty": "Easy/Medium/Hard"
          }
        ]
      },
      "variations": {
        "alternatives": [
          {
            "type": "alternative offer type",
            "headline": "alternative headline",
            "description": "how this version differs",
            "expectedPerformance": "performance expectation",
            "useCases": ["when to use this version"]
          }
        ],
        "upsellOpportunities": [
          {
            "name": "upsell offer name",
            "description": "what the upsell includes",
            "pricePoint": "suggested price range",
            "timing": "when to present upsell"
          }
        ],
        "crossSellIdeas": [
          {
            "product": "complementary product/service",
            "rationale": "why customers would want this",
            "bundleOpportunity": true_or_false
          }
        ]
      },
      "marketingAssets": {
        "landingPageCopy": "complete landing page copy structure",
        "emailSequence": [
          {
            "day": day_number,
            "subject": "email subject line",
            "content": "email content",
            "purpose": "email purpose in sequence"
          }
        ],
        "socialMediaKit": [
          {
            "platform": "platform name",
            "content": "post content",
            "hashtags": ["relevant hashtags"]
          }
        ],
        "adCreatives": [
          {
            "platform": "ad platform",
            "format": "ad format",
            "headline": "ad headline",
            "description": "ad description",
            "cta": "ad call-to-action"
          }
        ]
      },
      "performanceMetrics": {
        "expectedConversionRate": "estimated conversion rate range",
        "estimatedROI": "projected return on investment",
        "benchmarkComparison": "how this compares to industry standards",
        "keyMetricsToTrack": ["important metrics to monitor"]
      }
    }

    REQUIREMENTS:
    1. Use proven copywriting frameworks (AIDA, PAS, Before/After/Bridge)
    2. Apply psychological triggers (scarcity, social proof, authority, reciprocity)
    3. Ensure industry-specific language and pain points
    4. Create urgency without being manipulative
    5. Provide complete marketing asset suite
    6. Include A/B testing variations
    7. Focus on measurable outcomes
    8. Consider customer journey stage

    Make the offer irresistible while maintaining authenticity and ethical persuasion techniques.
    `;
  }

  private parseOfferResponse(content: string, input: OfferCreatorInput): Omit<GeneratedOfferPackage, 'tokensUsed' | 'generationTime'> {
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

 
// Replace the generateFallbackOffer method with this type-safe version:

private generateFallbackOffer(input: OfferCreatorInput): Omit<GeneratedOfferPackage, 'tokensUsed' | 'generationTime'> {
  const savings = input.discountValue ? `${input.discountValue}% OFF` : '';
  const deadline = this.formatOfferDeadline(input.expiryDate);
  const metrics = this.calculateOfferMetrics(input.regularPrice, input.offerPrice);
  
  // Safe email subject lines generation
  const emailSubjects = [
    `🔥 ${input.offerName} - Limited Time Offer`,
    `Last Chance: ${savings} ${input.offerName}`,
    `Don't Miss Out: ${input.offerName} Special Pricing`,
    `⏰ ${input.offerName} - Expires ${deadline}`,
    `Exclusive: ${input.offerValue} - ${savings}`
  ];
  
  // Safe social media captions
  const socialCaptions = [
    `🚨 Special offer: ${input.offerName} for just ${input.offerPrice}! ${savings} - Expires ${deadline}`,
    `💡 Transform your business with ${input.offerName}. Limited time: ${input.offerPrice}`,
    `🔥 Don't miss out! ${input.offerValue} - Special pricing ends ${deadline}`
  ];
  
  // Ensure all arrays and objects are properly structured with correct types
  const fallbackOffer = {
    primaryOffer: {
      headline: `${savings} ${input.offerName} - Limited Time`,
      subheadline: `${input.offerValue} - Special Pricing Ends ${deadline}`,
      mainCopy: `Transform your business with ${input.offerName}. This exclusive offer gives you everything you need to ${input.offerValue.toLowerCase()}. Normally ${input.regularPrice}, but for a limited time, you can get started for just ${input.offerPrice}. This special pricing ends ${deadline}, so don't wait.`,
      bulletPoints: [
        `Save ${input.discountAmount || `$${metrics.savings.toFixed(0)}`} with this limited-time offer`,
        'Immediate access to all features and benefits',
        `Proven results in the ${input.targetIndustry} industry`,
        'Risk-free with our satisfaction guarantee'
      ],
      cta: input.cta || 'Claim Your Offer Now',
      urgency: `Offer expires ${deadline} - Limited availability`,
      socialProof: input.socialProof ? `"${input.testimonialQuote}" - ${input.testimonialAuthor}` : 'Trusted by thousands of satisfied customers',
      riskReversal: 'Backed by our 100% satisfaction guarantee',
      offerSummary: `${input.offerName} - ${input.offerPrice} (Reg. ${input.regularPrice}) - Expires ${deadline}`,
      emailSubjectLines: emailSubjects,
      socialMediaCaptions: socialCaptions,
      adCopy: `${input.offerValue} with ${input.offerName}. Limited-time offer: ${input.offerPrice} (regularly ${input.regularPrice}). Proven results for ${input.targetIndustry} businesses. Offer ends ${deadline}.`
    },

    analysis: {
      conversionPotential: {
        score: 75,
        factors: [
          {
            factor: 'Clear value proposition',
            impact: 'High' as const, // Fix: Use 'as const' to ensure literal type
            recommendation: 'Emphasize specific outcomes and benefits'
          },
          {
            factor: 'Price reduction creates urgency',
            impact: 'Medium' as const, // Fix: Use 'as const'
            recommendation: 'Add countdown timer for stronger urgency'
          },
          {
            factor: 'Industry targeting',
            impact: 'Medium' as const, // Fix: Use 'as const'
            recommendation: 'Include industry-specific case studies'
          }
        ]
      },
      marketFit: {
        industryRelevance: 80,
        competitiveAdvantage: ['Competitive pricing', 'Industry focus', 'Time-limited availability'],
        marketTiming: 'Good' as const // Fix: Use 'as const' for literal type
      },
      psychologyFactors: {
        persuasionTechniques: ['Scarcity', 'Loss aversion', 'Social proof'],
        cognitiveTriggersUsed: ['Time pressure', 'Price anchoring', 'Authority'],
        emotionalAppeal: 70
      },
      optimizationSuggestions: [
        {
          area: 'Social Proof',
          suggestion: 'Add customer logos and specific results',
          expectedImpact: '15-25% conversion increase',
          difficulty: 'Easy' as const // Fix: Use 'as const'
        },
        {
          area: 'Urgency',
          suggestion: 'Include real-time countdown timer',
          expectedImpact: '10-20% conversion increase',
          difficulty: 'Medium' as const // Fix: Use 'as const'
        }
      ]
    },

    variations: {
      alternatives: [
        {
          type: 'Bundle Offer',
          headline: `${input.offerName} Complete Bundle`,
          description: 'Add complementary services for higher value',
          expectedPerformance: 'Higher AOV, slightly lower conversion',
          useCases: ['Existing customers', 'High-value prospects']
        },
        {
          type: 'Payment Plan',
          headline: `${input.offerName} - 3 Easy Payments`,
          description: 'Split payment to reduce barrier',
          expectedPerformance: 'Higher conversion, same total value',
          useCases: ['Price-sensitive customers', 'Larger purchases']
        }
      ],
      upsellOpportunities: [
        {
          name: `${input.offerName} Premium`,
          description: 'Enhanced version with premium features',
          pricePoint: `${Math.round(parseInt(input.offerPrice.replace(/[^0-9]/g, '')) * 1.5)}`,
          timing: 'Immediately after purchase'
        }
      ],
      crossSellIdeas: [
        {
          product: 'Training & Support Package',
          rationale: 'Ensures successful implementation',
          bundleOpportunity: true
        }
      ]
    },

    marketingAssets: {
      landingPageCopy: `# ${input.offerName} - ${savings} Limited Time Offer\n\n## ${input.offerValue}\n\n**Special Price:** ${input.offerPrice} (Regular: ${input.regularPrice})\n**Expires:** ${deadline}\n\n### What You Get:\n- Full access to ${input.offerName}\n- Implementation guide\n- Customer support\n- 30-day guarantee\n\n**${input.cta || 'Get Started Now'}**`,
      
      emailSequence: [
        {
          day: 1,
          subject: `Welcome! Your ${input.offerName} is waiting`,
          content: `Thanks for your interest! Here's everything you need to know about this limited-time offer...`,
          purpose: 'Welcome and set expectations'
        },
        {
          day: 3,
          subject: `How ${input.offerName} helps ${input.targetIndustry} businesses`,
          content: `See exactly how other businesses like yours are using ${input.offerName} to achieve results...`,
          purpose: 'Social proof and case studies'
        }
      ],

      socialMediaKit: [
        {
          platform: 'LinkedIn',
          content: `🔥 Limited-time offer for ${input.targetIndustry} professionals: ${input.offerName} at ${input.offerPrice} (normally ${input.regularPrice}). Get ${input.offerValue} before ${deadline}.`,
          hashtags: [`#${input.targetIndustry.replace(/\s/g, '')}`, '#LimitedOffer', '#BusinessGrowth']
        }
      ],

      adCreatives: [
        {
          platform: 'Facebook',
          format: 'Single Image',
          headline: `${savings} ${input.offerName}`,
          description: `${input.offerValue} - Special pricing ends ${deadline}`,
          cta: input.cta || 'Learn More'
        }
      ]
    },

    performanceMetrics: {
      expectedConversionRate: '3-8% depending on traffic quality and targeting',
      estimatedROI: '200-400% based on industry benchmarks',
      benchmarkComparison: `Above average for limited-time offers in ${input.targetIndustry}`,
      keyMetricsToTrack: [
        'Conversion rate by traffic source',
        'Time on landing page',
        'Cart abandonment rate', 
        'Email sequence open/click rates'
      ]
    }
  };

  return fallbackOffer;
}

// Helper methods (keep these the same as before):
private formatOfferDeadline(expiryDate: string): string {
  try {
    const date = new Date(expiryDate);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch (error) {
    return 'soon';
  }
}

private calculateOfferMetrics(regularPrice: string, offerPrice: string) {
  try {
    const regular = parseFloat(regularPrice.replace(/[$,]/g, ''));
    const offer = parseFloat(offerPrice.replace(/[$,]/g, ''));
    
    if (isNaN(regular) || isNaN(offer)) {
      return { savings: 0, percentage: 0 };
    }
    
    const savings = regular - offer;
    const percentage = (savings / regular) * 100;
    
    return { savings, percentage };
  } catch (error) {
    return { savings: 0, percentage: 0 };
  }
}


async saveOffer(userId: string, workspaceId: string, offer: GeneratedOfferPackage, input: OfferCreatorInput): Promise<string> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    console.log('📝 Creating deliverable...');
    console.log('📝 User ID:', userId);
    console.log('📝 Workspace ID:', workspaceId);
    
    // Ensure we can properly serialize the offer data
    let serializedOffer: string;
    try {
      // Create a clean copy of the offer to avoid circular references
      const cleanOffer = {
        primaryOffer: offer.primaryOffer || {},
        analysis: offer.analysis || {},
        variations: offer.variations || {},
        marketingAssets: offer.marketingAssets || {},
        performanceMetrics: offer.performanceMetrics || {},
        tokensUsed: offer.tokensUsed || 0,
        generationTime: offer.generationTime || 0
      };
      
      serializedOffer = JSON.stringify(cleanOffer, null, 2);
      console.log('✅ Offer serialization successful');
    } catch (serializationError) {
      console.error('💥 Offer serialization failed:', serializationError);
      // Fallback serialization with basic data
      serializedOffer = JSON.stringify({
        primaryOffer: {
          headline: offer.primaryOffer?.headline || 'Generated Offer',
          subheadline: offer.primaryOffer?.subheadline || 'AI-generated offer content',
          mainCopy: offer.primaryOffer?.mainCopy || 'Offer details',
          bulletPoints: offer.primaryOffer?.bulletPoints || [],
          cta: offer.primaryOffer?.cta || 'Get Started',
          urgency: offer.primaryOffer?.urgency || 'Limited time offer',
          socialProof: offer.primaryOffer?.socialProof || 'Trusted by customers',
          riskReversal: offer.primaryOffer?.riskReversal || 'Satisfaction guaranteed',
          offerSummary: offer.primaryOffer?.offerSummary || `${input.offerName} - ${input.offerPrice}`
        },
        analysis: {
          conversionPotential: { score: 75 },
          marketFit: { industryRelevance: 80 },
          psychologyFactors: { emotionalAppeal: 70 }
        },
        tokensUsed: offer.tokensUsed || 0,
        generationTime: offer.generationTime || 0,
        fallbackUsed: true
      }, null, 2);
    }
    
    // Let Prisma generate the UUID automatically - don't set explicit ID
    const deliverable = await prisma.deliverable.create({
      data: {
        // Remove the explicit ID - let the database generate it
        title: `${input.offerType.charAt(0).toUpperCase() + input.offerType.slice(1)} Offer - ${input.offerName}`,
        content: serializedOffer,
        type: 'offer_creator',
        user_id: userId,
        workspace_id: workspaceId || 'default',
        metadata: {
          offerName: input.offerName,
          offerType: input.offerType,
          targetIndustry: input.targetIndustry,
          regularPrice: input.regularPrice,
          offerPrice: input.offerPrice,
          expiryDate: input.expiryDate,
          conversionScore: offer.analysis?.conversionPotential?.score || 75,
          generatedAt: new Date().toISOString(),
          tokensUsed: offer.tokensUsed || 0,
          generationTime: offer.generationTime || 0,
          // Include discount info if it's a discount offer
          ...(input.offerType === 'discount' && {
            discountValue: input.discountValue,
            discountAmount: input.discountAmount
          }),
          // Include bonus info if it's a bonus offer
          ...(input.offerType === 'bonus' && {
            bonusItem: input.bonusItem,
            bonusValue: input.bonusValue,
            totalValue: input.totalValue
          }),
          // Include trial info if it's a trial offer
          ...(input.offerType === 'trial' && {
            trialPeriod: input.trialPeriod
          }),
          // Include guarantee info if it's a guarantee offer
          ...(input.offerType === 'guarantee' && {
            guaranteePeriod: input.guaranteePeriod
          })
        },
        tags: [
          'offer', 
          input.offerType, 
          input.targetIndustry.toLowerCase().replace(/\s/g, '-'), 
          'marketing',
          `${input.offerType}-offer`
        ]
      }
    });

    console.log('✅ Deliverable created successfully with ID:', deliverable.id);
    return deliverable.id;
  } catch (error) {
    console.error('💥 Error saving offer:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
    throw error;
  }
}

  async getUserOffers(userId: string, workspaceId?: string): Promise<UserOffer[]> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'offer_creator'
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
  offerName: (offer.metadata as any)?.offerName,
  offerType: (offer.metadata as any)?.offerType,
  targetIndustry: (offer.metadata as any)?.targetIndustry,
  conversionScore: (offer.metadata as any)?.conversionScore,
  expiryDate: (offer.metadata as any)?.expiryDate,
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
        type: 'offer_creator'
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
        primaryOffer: {
          headline: 'Error loading offer',
          subheadline: 'Please regenerate this offer',
          mainCopy: 'There was an issue loading the offer content.',
          bulletPoints: [],
          cta: 'Get Started'
        }
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
            content: 'You are a conversion optimization expert. Provide specific, actionable improvements to increase offer performance.'
          },
          {
            role: 'user',
            content: optimizationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
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
      headline: `Optimize this headline for higher conversion: "${offer.primaryOffer.headline}". Context: ${offer.primaryOffer.subheadline}`,
      cta: `Improve this call-to-action: "${offer.primaryOffer.cta}". Context: ${offer.primaryOffer.offerSummary}`,
      urgency: `Enhance the urgency messaging: "${offer.primaryOffer.urgency}". Make it more compelling without being manipulative.`,
      'social-proof': `Strengthen the social proof: "${offer.primaryOffer.socialProof}". Make it more specific and credible.`,
      pricing: `Optimize the pricing strategy. Current: ${offer.primaryOffer.offerSummary}. Suggest pricing psychology improvements.`
    };

    return prompts[type] + `

    Provide 3 optimized versions with:
    1. The improved text
    2. Rationale for the change
    3. Expected impact on conversions

    Format as JSON:
    {
      "originalElement": "current text",
      "optimizedVersions": [
        {
          "version": "improved version",
          "rationale": "why this works better",
          "expectedImpact": "expected improvement"
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
      originalElement: `Current ${type}`,
      optimizedVersions: [
        {
          version: `Optimized ${type} version 1`,
          rationale: 'Improved clarity and persuasion',
          expectedImpact: '10-15% conversion increase'
        },
        {
          version: `Optimized ${type} version 2`,
          rationale: 'Enhanced emotional appeal',
          expectedImpact: '12-18% conversion increase'
        },
        {
          version: `Optimized ${type} version 3`,
          rationale: 'Stronger urgency and action orientation',
          expectedImpact: '8-22% conversion increase'
        }
      ]
    };
  }

  async analyzeOffer(request: AnalysisRequest): Promise<ConversionAnalysis | PsychologyAnalysis | CompetitiveAnalysis> {
    try {
      const analysisPrompt = this.buildAnalysisPrompt(request);
      
      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a conversion optimization expert. Analyze offers for effectiveness and provide actionable improvements.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      // Parse analysis
      let analysis;
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        analysis = this.generateFallbackAnalysis(request.analysisType);
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing offer:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(request: AnalysisRequest): string {
    const prompts = {
      conversion: `
        Analyze this offer for conversion potential:
        
        OFFER: "${request.offerText}"
        ${request.industry ? `INDUSTRY: ${request.industry}` : ''}
        
        Provide analysis in JSON format:
        {
          "conversionScore": number_1_to_100,
          "strengths": ["positive elements"],
          "weaknesses": ["areas needing improvement"],
          "improvements": [
            {
              "element": "specific element to change",
              "suggestion": "how to improve it",
              "expectedImpact": "impact description"
            }
          ],
          "missingElements": ["what's missing from the offer"],
          "headline": "improved headline suggestion",
          "cta": "improved call-to-action suggestion"
        }
      `,
      psychology: `
        Analyze the psychological triggers in this offer:
        
        OFFER: "${request.offerText}"
        
        Provide analysis in JSON format:
        {
          "psychologyScore": number_1_to_100,
          "triggersUsed": ["psychological triggers present"],
          "triggersMissing": ["missing psychological triggers"],
          "emotionalAppeal": "analysis of emotional connection",
          "persuasionTechniques": ["techniques being used"],
          "cognitiveShortcuts": ["mental shortcuts triggered"],
          "recommendations": ["how to strengthen psychological appeal"]
        }
      `,
      competition: `
        Analyze this offer's competitive positioning:
        
        OFFER: "${request.offerText}"
        ${request.industry ? `INDUSTRY: ${request.industry}` : ''}
        
        Provide analysis in JSON format:
        {
          "competitiveScore": number_1_to_100,
          "differentiators": ["what makes this offer unique"],
          "commodityRisk": "risk of being seen as commodity",
          "marketPosition": "how this positions in market",
          "competitiveAdvantages": ["advantages over competitors"],
          "vulnerabilities": ["competitive weaknesses"],
          "recommendations": ["how to strengthen positioning"]
        }
      `
    };

    return prompts[request.analysisType];
  }

  private generateFallbackAnalysis(analysisType: string): ConversionAnalysis | PsychologyAnalysis | CompetitiveAnalysis {
    const fallbacks = {
      conversion: {
        conversionScore: 65,
        strengths: ["Clear value proposition", "Specific offer details"],
        weaknesses: ["Could use stronger urgency", "Missing social proof"],
        improvements: [
          {
            element: "Urgency",
            suggestion: "Add time-limited deadline",
            expectedImpact: "15-25% conversion increase"
          },
          {
            element: "Social Proof",
            suggestion: "Include customer testimonials",
            expectedImpact: "10-20% conversion increase"
          }
        ],
        missingElements: ["Social proof", "Risk reversal"],
        headline: "Improved headline with stronger benefit",
        cta: "More action-oriented call-to-action"
      },
      psychology: {
        psychologyScore: 60,
        triggersUsed: ["Scarcity", "Value perception"],
        triggersMissing: ["Social proof", "Authority", "Reciprocity"],
        emotionalAppeal: "Moderate appeal to desire for savings",
        persuasionTechniques: ["Price anchoring", "Loss aversion"],
        cognitiveShortcuts: ["Availability heuristic"],
        recommendations: ["Add customer testimonials", "Include expert endorsement", "Create sense of belonging"]
      },
      competition: {
        competitiveScore: 70,
        differentiators: ["Specific value proposition", "Clear pricing"],
        commodityRisk: "Medium - needs stronger unique positioning",
        marketPosition: "Value-focused positioning",
        competitiveAdvantages: ["Clear pricing structure", "Specific benefits"],
        vulnerabilities: ["Generic positioning", "No unique mechanism"],
        recommendations: ["Develop unique methodology", "Strengthen brand story", "Add proprietary elements"]
      }
    };

    return fallbacks[analysisType as keyof typeof fallbacks] as any;
  }

  async deleteOffer(userId: string, offerId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: offerId,
          user_id: userId,
          type: 'offer_creator'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }
  }

  async updateOfferPerformance(
    userId: string, 
    offerId: string, 
    performanceData: {
      views: number;
      clicks: number;
      conversions: number;
      revenue: number;
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
          type: 'offer_creator'
        }
      });

      if (!offer) {
        throw new Error('Offer not found or access denied');
      }

      // Calculate metrics
      const clickThroughRate = performanceData.views > 0 ? (performanceData.clicks / performanceData.views) * 100 : 0;
      const conversionRate = performanceData.clicks > 0 ? (performanceData.conversions / performanceData.clicks) * 100 : 0;
      const averageOrderValue = performanceData.conversions > 0 ? performanceData.revenue / performanceData.conversions : 0;

      // Update offer metadata with performance data
      const currentMetadata = offer.metadata as any || {};
      const performanceHistory = currentMetadata.performanceHistory || [];
      
      const newPerformanceEntry = {
        dateRange: performanceData.dateRange,
        metrics: {
          views: performanceData.views,
          clicks: performanceData.clicks,
          conversions: performanceData.conversions,
          revenue: performanceData.revenue,
          clickThroughRate: Math.round(clickThroughRate * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100
        },
        recordedAt: new Date().toISOString()
      };

      performanceHistory.push(newPerformanceEntry);

      // Keep only last 12 entries
      if (performanceHistory.length > 12) {
        performanceHistory.splice(0, performanceHistory.length - 12);
      }

      // Generate insights using utility function
      const insights = generatePerformanceInsights(performanceHistory, newPerformanceEntry.metrics);
      const industryBenchmark = getIndustryBenchmark(currentMetadata.targetIndustry || 'General');

      await prisma.deliverable.update({
        where: { id: offerId },
        data: {
          metadata: {
            ...currentMetadata,
            performanceHistory,
            latestMetrics: newPerformanceEntry.metrics,
            latestInsights: insights,
            industryBenchmark,
            lastUpdated: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error updating offer performance:', error);
      throw error;
    }
  }

  async getOfferPerformance(userId: string, offerId: string) {
    try {
      const offer = await this.getOffer(userId, offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      const metadata = offer.metadata as any || {};
      const performanceHistory = metadata.performanceHistory || [];
      const latestMetrics = metadata.latestMetrics;
      const insights = metadata.latestInsights || [];
      const benchmark = metadata.industryBenchmark || getIndustryBenchmark(metadata.targetIndustry || 'General');

      return {
        offerId,
        offerName: metadata.offerName,
        performanceHistory,
        latestMetrics,
        insights,
        benchmark,
        summary: this.generatePerformanceSummary(performanceHistory)
      };
    } catch (error) {
      console.error('Error getting offer performance:', error);
      throw error;
    }
  }

  private generatePerformanceSummary(history: any[]) {
    if (history.length === 0) {
      return {
        totalViews: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        averageConversionRate: 0,
        averageClickThroughRate: 0,
        trend: 'no-data'
      };
    }

    const totals = history.reduce(
      (acc, entry) => ({
        views: acc.views + entry.metrics.views,
        clicks: acc.clicks + entry.metrics.clicks,
        conversions: acc.conversions + entry.metrics.conversions,
        revenue: acc.revenue + entry.metrics.revenue
      }),
      { views: 0, clicks: 0, conversions: 0, revenue: 0 }
    );

    const averageConversionRate = history.reduce(
      (sum, entry) => sum + entry.metrics.conversionRate,
      0
    ) / history.length;

    const averageClickThroughRate = history.reduce(
      (sum, entry) => sum + entry.metrics.clickThroughRate,
      0
    ) / history.length;

    // Determine trend
    let trend = 'stable';
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
      totalViews: totals.views,
      totalClicks: totals.clicks,
      totalConversions: totals.conversions,
      totalRevenue: Math.round(totals.revenue * 100) / 100,
      averageConversionRate: Math.round(averageConversionRate * 100) / 100,
      averageClickThroughRate: Math.round(averageClickThroughRate * 100) / 100,
      trend,
      dataPoints: history.length
    };
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
         filename: `offer-${(offer.metadata as any)?.offerName || 'export'}.json`
        };
      }

      // For HTML format, generate a structured HTML export
      const htmlContent = this.generateHTMLExport(offer);
      return {
        format: 'html',
        content: htmlContent,
        filename: `offer-${(offer.metadata as any)?.offerName || 'export'}.html`
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
    <title>Offer Export - ${metadata?.offerName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .offer-card { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .metric { background: #e7f3ff; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .cta { background: #007bff; color: white; padding: 15px 25px; border-radius: 5px; text-decoration: none; display: inline-block; }
        .section { margin: 30px 0; }
        .bullet { margin: 10px 0; padding-left: 20px; }
        h1, h2, h3 { color: #2c3e50; }
        .score { font-size: 24px; font-weight: bold; color: #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${metadata?.offerName || 'Offer Export'}</h1>
        <p><strong>Type:</strong> ${metadata?.offerType} | <strong>Industry:</strong> ${metadata?.targetIndustry}</p>
        <p><strong>Generated:</strong> ${new Date(metadata?.generatedAt).toLocaleDateString()}</p>
    </div>

    <div class="offer-card">
        <h2>${offerData.primaryOffer?.headline}</h2>
        <h3>${offerData.primaryOffer?.subheadline}</h3>
        <p>${offerData.primaryOffer?.mainCopy}</p>
        
        <div class="section">
            <h4>Key Benefits:</h4>
            ${offerData.primaryOffer?.bulletPoints?.map((bullet: string) => `<div class="bullet">✓ ${bullet}</div>`).join('') || ''}
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="#" class="cta">${offerData.primaryOffer?.cta}</a>
        </div>
        
        <div class="metric"><strong>Urgency:</strong> ${offerData.primaryOffer?.urgency}</div>
        <div class="metric"><strong>Social Proof:</strong> ${offerData.primaryOffer?.socialProof}</div>
        <div class="metric"><strong>Risk Reversal:</strong> ${offerData.primaryOffer?.riskReversal}</div>
    </div>

    <div class="section">
        <h2>Performance Analysis</h2>
        <div class="score">Conversion Score: ${offerData.analysis?.conversionPotential?.score}%</div>
        <p><strong>Market Fit:</strong> ${offerData.analysis?.marketFit?.industryRelevance}% industry relevance</p>
        <p><strong>Expected Conversion Rate:</strong> ${offerData.performanceMetrics?.expectedConversionRate}</p>
        <p><strong>Estimated ROI:</strong> ${offerData.performanceMetrics?.estimatedROI}</p>
    </div>

    <div class="section">
        <h2>Email Subject Lines</h2>
        ${offerData.primaryOffer?.emailSubjectLines?.map((subject: string, index: number) => `
            <div class="metric">${index + 1}. ${subject}</div>
        `).join('') || ''}
    </div>

    <div class="section">
        <h2>Social Media Captions</h2>
        ${offerData.primaryOffer?.socialMediaCaptions?.map((caption: string, index: number) => `
            <div class="offer-card">
                <strong>Variation ${index + 1}:</strong><br>
                ${caption}
            </div>
        `).join('') || ''}
    </div>

    <div class="section">
        <h2>Optimization Suggestions</h2>
        ${offerData.analysis?.optimizationSuggestions?.map((suggestion: any) => `
            <div class="offer-card">
                <h4>${suggestion.area}</h4>
                <p><strong>Suggestion:</strong> ${suggestion.suggestion}</p>
                <p><strong>Expected Impact:</strong> ${suggestion.expectedImpact}</p>
                <p><strong>Difficulty:</strong> ${suggestion.difficulty}</p>
            </div>
        `).join('') || ''}
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
}