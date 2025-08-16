// services/adWriter.service.ts - FIXED VERSION WITH PROPER TYPE SAFETY
import { OpenRouterClient } from '@/lib/openrouter';
import { AdGenerationInput, GeneratedAd, Platform } from '@/types/adWriter';
import { AdOptimizationType } from '@/types/adWriter';
import { Redis } from '@upstash/redis';

export class AdWriterService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  // ✅ FIXED: Wrapper method that generates AND saves ads
  async generateAndSaveAds(
    input: AdGenerationInput, 
    userId: string, 
    workspaceId: string
  ): Promise<{
    ads: GeneratedAd[];
    deliverableId: string;
    tokensUsed: number;
    generationTime: number;
  }> {
    // Generate ads using existing method
    const response = await this.generateAds(input);
    
    // Save to deliverables
    const deliverableId = await this.saveAdGeneration(userId, workspaceId, response, input);
    
    return {
      ...response,
      deliverableId
    };
  }

  // ✅ FIXED: Method to save ad generation to deliverables table with proper JSON serialization
  async saveAdGeneration(
    userId: string, 
    workspaceId: string, 
    adResponse: { ads: GeneratedAd[]; tokensUsed: number; generationTime: number }, 
    input: AdGenerationInput
  ): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      // ✅ SOLUTION: Convert AdGenerationInput to a plain JSON-serializable object
      const serializedInput: Record<string, any> = {
        businessName: input.businessName,
        personalTitle: input.personalTitle,
        valueProposition: input.valueProposition,
        offerName: input.offerName,
        offerDescription: input.offerDescription,
        features: input.features,
        pricing: input.pricing,
        uniqueMechanism: input.uniqueMechanism,
        idealCustomer: input.idealCustomer,
        primaryPainPoint: input.primaryPainPoint,
        failedSolutions: input.failedSolutions,
        coreResult: input.coreResult,
        secondaryBenefits: input.secondaryBenefits,
        timeline: input.timeline,
        platforms: input.platforms,
        adType: input.adType,
        tone: input.tone,
        caseStudy1: input.caseStudy1,
        credentials: input.credentials,
        cta: input.cta,
        url: input.url,
        urgency: input.urgency,
        leadMagnet: input.leadMagnet,
        userId: input.userId
      };

      // ✅ FIXED: Create metadata object with proper typing
      const metadata: Record<string, any> = {
        businessName: input.businessName,
        offerName: input.offerName,
        idealCustomer: input.idealCustomer,
        primaryPainPoint: input.primaryPainPoint,
        platforms: input.platforms,
        adType: input.adType,
        tone: input.tone,
        adCount: adResponse.ads.length,
        tokensUsed: adResponse.tokensUsed,
        generationTime: adResponse.generationTime,
        generatedAt: new Date().toISOString(),
        originalInput: serializedInput // Now properly serialized
      };
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `Ad Campaign - ${input.offerName || input.businessName}`,
          content: JSON.stringify(adResponse),
          type: 'ad_writer',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: metadata, // This now satisfies InputJsonValue
          tags: [
            'ad-campaign',
            input.adType,
            input.tone,
            ...input.platforms,
            input.businessName.toLowerCase().replace(/\s+/g, '-')
          ].filter(Boolean)
        }
      });

      return deliverable.id;
    } catch (error) {
      console.error('Error saving ad generation:', error);
      throw error;
    }
  }

  // ✅ NEW: Method to get user's ad generations
  async getUserAdGenerations(userId: string, workspaceId?: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'ad_writer'
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const generations = await prisma.deliverable.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          metadata: true,
          created_at: true,
          updated_at: true,
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return generations.map(gen => {
        const metadata = gen.metadata as Record<string, any>;
        
        return {
          id: gen.id,
          title: gen.title,
          businessName: metadata?.businessName,
          offerName: metadata?.offerName,
          idealCustomer: metadata?.idealCustomer,
          primaryPainPoint: metadata?.primaryPainPoint,
          platforms: metadata?.platforms || [],
          adType: metadata?.adType,
          tone: metadata?.tone,
          adCount: metadata?.adCount,
          tokensUsed: metadata?.tokensUsed,
          generationTime: metadata?.generationTime,
          createdAt: gen.created_at,
          updatedAt: gen.updated_at,
          workspace: gen.workspace
        };
      });
    } catch (error) {
      console.error('Error fetching ad generations:', error);
      return [];
    }
  }

  // ✅ NEW: Method to get specific ad generation
  async getAdGeneration(userId: string, generationId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const generation = await prisma.deliverable.findFirst({
        where: {
          id: generationId,
          user_id: userId,
          type: 'ad_writer'
        },
        include: {
          workspace: true
        }
      });

      if (!generation) {
        return null;
      }

      return {
        id: generation.id,
        title: generation.title,
        ads: JSON.parse(generation.content),
        metadata: generation.metadata,
        createdAt: generation.created_at,
        updatedAt: generation.updated_at,
        workspace: generation.workspace
      };
    } catch (error) {
      console.error('Error retrieving ad generation:', error);
      throw error;
    }
  }

  // ✅ NEW: Method to delete ad generation
  async deleteAdGeneration(userId: string, generationId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: generationId,
          user_id: userId,
          type: 'ad_writer'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting ad generation:', error);
      throw error;
    }
  }

  // EXISTING METHODS (unchanged)
  async generateAds(input: AdGenerationInput): Promise<{
    ads: GeneratedAd[];
    tokensUsed: number;
    generationTime: number;
  }> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(input);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    // Build comprehensive prompt
    const prompt = this.buildAdPrompt(input);
    
    // Generate ads for each platform
    const adsPromises = input.platforms.map(platform => 
      this.generatePlatformAds(platform, prompt, input)
    );
    
    const results = await Promise.all(adsPromises);
    
    // Calculate total tokens
    const tokensUsed = results.reduce((sum, r) => sum + r.tokensUsed, 0);
    
    const response = {
      ads: results.map(r => r.ad),
      tokensUsed,
      generationTime: Date.now() - startTime
    };

    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(response), { ex: 3600 });
    
    return response;
  }

  private async generatePlatformAds(
    platform: Platform,
    basePrompt: string,
    input: AdGenerationInput
  ): Promise<{ ad: GeneratedAd; tokensUsed: number }> {
    const platformPrompt = this.getPlatformSpecificPrompt(platform, basePrompt, input);
    
    const response = await this.openRouterClient.complete({
      model: 'anthropic/claude-3-sonnet',
      messages: [
        {
          role: 'system',
          content: `You are an expert direct response copywriter specializing in ${platform} ads. 
                   Generate high-converting ad copy that follows platform best practices.`
        },
        {
          role: 'user',
          content: platformPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const parsedAds = this.parseAIResponse(response.content, platform);
    
    return {
      ad: {
        platform,
        headlines: parsedAds.headlines,
        descriptions: parsedAds.descriptions,
        ctas: parsedAds.ctas,
        hooks: parsedAds.hooks,
        visualSuggestions: parsedAds.visualSuggestions
      },
      tokensUsed: response.usage.total_tokens
    };
  }

  private buildAdPrompt(input: AdGenerationInput): string {
    return `
    BUSINESS CONTEXT:
    - Business Name: ${input.businessName}
    - Value Proposition: ${input.valueProposition}
    - Offer: ${input.offerName} - ${input.offerDescription}
    - Unique Mechanism: ${input.uniqueMechanism}
    - Pricing: ${input.pricing}
    - Features: ${input.features?.join(', ') || 'N/A'}
    
    TARGET AUDIENCE:
    - Ideal Customer: ${input.idealCustomer}
    - Primary Pain Point: ${input.primaryPainPoint}
    - Failed Solutions: ${input.failedSolutions || 'N/A'}
    - Desired Outcome: ${input.coreResult}
    - Timeline: ${input.timeline || 'N/A'}
    - Secondary Benefits: ${input.secondaryBenefits?.join(', ') || 'N/A'}
    
    SOCIAL PROOF:
    - Case Study: ${input.caseStudy1 || 'N/A'}
    - Credentials: ${input.credentials || 'N/A'}
    
    AD STRATEGY:
    - Campaign Objective: ${input.adType}
    - Brand Tone: ${input.tone}
    - Primary CTA: ${input.cta}
    - Urgency/Scarcity: ${input.urgency || 'N/A'}
    - Lead Magnet: ${input.leadMagnet || 'N/A'}
    
    Generate compelling ad copy that:
    1. Grabs attention with a strong hook
    2. Addresses the primary pain point
    3. Presents the unique solution
    4. Provides social proof
    5. Creates urgency
    6. Has a clear call-to-action
    `;
  }

  private getPlatformSpecificPrompt(
    platform: Platform, 
    basePrompt: string,
    input: AdGenerationInput
  ): string {
    const platformSpecs: Record<Platform, string> = {
      facebook: `
        Generate Facebook/Instagram ad copy following these specifications:
        - 3 Headlines (25 characters max for best performance)
        - 3 Primary Text variations (125 characters for feed, can go longer for engagement)
        - 3 Descriptions (30 characters max)
        - Include emojis strategically
        - Focus on storytelling and emotional connection
        - Mobile-first formatting
        ${basePrompt}
      `,
      google: `
        Generate Google Ads copy following these specifications:
        - 3 Headlines (30 characters max each)
        - 3 Descriptions (90 characters max each)
        - 3 Responsive Search Ad headlines (30 chars)
        - Include keywords naturally
        - Focus on search intent and benefits
        - Include numbers/statistics when possible
        ${basePrompt}
      `,
      linkedin: `
        Generate LinkedIn ad copy following these specifications:
        - 3 Headlines (70 characters recommended)
        - 3 Introductory text variations (150 characters)
        - 3 Descriptions (100 characters)
        - Professional tone but conversational
        - Focus on business value and ROI
        - Industry-specific language
        ${basePrompt}
      `,
      tiktok: `
        Generate TikTok ad copy following these specifications:
        - 3 Video hooks (first 3 seconds scripts)
        - 3 Caption variations (150 characters)
        - 3 CTA overlays (20 characters)
        - Trending language and formats
        - Focus on entertainment value
        - Native feel, not overtly promotional
        ${basePrompt}
      `
    };

    return platformSpecs[platform];
  }

  private parseAIResponse(content: string, platform: Platform): {
    headlines: string[];
    descriptions: string[];
    ctas: string[];
    hooks: string[];
    visualSuggestions: string[];
  } {
    // Parse the AI response and structure it
    const lines = content.split('\n').filter(line => line.trim());
    
    const headlines: string[] = [];
    const descriptions: string[] = [];
    const ctas: string[] = [];
    const hooks: string[] = [];
    const visualSuggestions: string[] = [];
    
    let currentSection = '';
    
    for (const line of lines) {
      if (line.toLowerCase().includes('headline')) {
        currentSection = 'headlines';
      } else if (line.toLowerCase().includes('description') || line.toLowerCase().includes('text')) {
        currentSection = 'descriptions';
      } else if (line.toLowerCase().includes('cta') || line.toLowerCase().includes('call')) {
        currentSection = 'ctas';
      } else if (line.toLowerCase().includes('hook')) {
        currentSection = 'hooks';
      } else if (line.toLowerCase().includes('visual') || line.toLowerCase().includes('image')) {
        currentSection = 'visuals';
      } else if (line.startsWith('-') || line.startsWith('•')) {
        const content = line.substring(1).trim();
        switch(currentSection) {
          case 'headlines':
            headlines.push(content);
            break;
          case 'descriptions':
            descriptions.push(content);
            break;
          case 'ctas':
            ctas.push(content);
            break;
          case 'hooks':
            hooks.push(content);
            break;
          case 'visuals':
            visualSuggestions.push(content);
            break;
        }
      }
    }

    return {
      headlines: headlines.slice(0, 3),
      descriptions: descriptions.slice(0, 3),
      ctas: ctas.length > 0 ? ctas.slice(0, 3) : ['Learn More', 'Get Started', 'Sign Up Now'],
      hooks: hooks.slice(0, 3),
      visualSuggestions: visualSuggestions.slice(0, 2)
    };
  }

  // ✅ IMPROVED: Added generationTime to optimizeAd
  async optimizeAd(adCopy: string, optimizationType: AdOptimizationType): Promise<{
    content: string;
    tokensUsed: number;
    generationTime: number;
  }> {
    const startTime = Date.now();

    const optimizationPrompts: Record<AdOptimizationType, string> = {
      'emotional': 'Rewrite this ad copy to have stronger emotional appeal',
      'urgency': 'Add more urgency and scarcity to this ad copy',
      'benefits': 'Focus more on benefits rather than features',
      'social-proof': 'Incorporate more social proof elements',
      'simplify': 'Simplify this ad copy for better clarity'
    };

    const prompt = optimizationPrompts[optimizationType];
    if (!prompt) {
      throw new Error(`Invalid optimization type: ${optimizationType}`);
    }

    const response = await this.openRouterClient.complete({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content: 'You are an expert copywriter specializing in conversion optimization.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nOriginal copy:\n${adCopy}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      content: response.content,
      tokensUsed: response.usage.total_tokens,
      generationTime: Date.now() - startTime
    };
  }

  // ✅ FIXED: Method to update ad generation metadata with proper JSON handling
  async updateAdGeneration(
    userId: string, 
    generationId: string, 
    updates: Partial<AdGenerationInput>
  ) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const existingGeneration = await prisma.deliverable.findFirst({
        where: {
          id: generationId,
          user_id: userId,
          type: 'ad_writer'
        }
      });

      if (!existingGeneration) {
        throw new Error('Ad generation not found');
      }

      const currentMetadata = existingGeneration.metadata as Record<string, any> || {};
      
      // ✅ FIXED: Serialize the updates properly
      const serializedUpdates: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        const value = updates[key as keyof AdGenerationInput];
        serializedUpdates[key] = value;
      });
      
      const updatedMetadata: Record<string, any> = {
        ...currentMetadata,
        ...serializedUpdates,
        updatedAt: new Date().toISOString()
      };

      const updated = await prisma.deliverable.update({
        where: { id: generationId },
        data: {
          title: updates.offerName ? `Ad Campaign - ${updates.offerName}` : undefined,
          metadata: updatedMetadata,
          updated_at: new Date()
        }
      });

      return updated;
    } catch (error) {
      console.error('Error updating ad generation:', error);
      throw error;
    }
  }

  // ✅ NEW: Method to get analytics for ad generations
  async getAdAnalytics(userId: string, workspaceId?: string, timeframe: 'week' | 'month' | 'quarter' = 'month') {
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
        type: 'ad_writer',
        created_at: {
          gte: dateFilter
        }
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const campaigns = await prisma.deliverable.findMany({
        where: whereClause,
        select: {
          metadata: true,
          created_at: true
        }
      });

      // Calculate analytics
      const totalCampaigns = campaigns.length;
      
      const platformDistribution = campaigns.reduce((acc, campaign) => {
        const metadata = campaign.metadata as Record<string, any>;
        const platforms = metadata?.platforms || [];
        platforms.forEach((platform: string) => {
          acc[platform] = (acc[platform] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const toneDistribution = campaigns.reduce((acc, campaign) => {
        const metadata = campaign.metadata as Record<string, any>;
        const tone = metadata?.tone || 'unknown';
        acc[tone] = (acc[tone] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const adTypeDistribution = campaigns.reduce((acc, campaign) => {
        const metadata = campaign.metadata as Record<string, any>;
        const adType = metadata?.adType || 'unknown';
        acc[adType] = (acc[adType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalAdsGenerated = campaigns.reduce((sum, campaign) => {
        const metadata = campaign.metadata as Record<string, any>;
        return sum + (metadata?.adCount || 0);
      }, 0);

      const averageGenerationTime = campaigns.reduce((sum, campaign) => {
        const metadata = campaign.metadata as Record<string, any>;
        return sum + (metadata?.generationTime || 0);
      }, 0) / totalCampaigns || 0;

      return {
        totalCampaigns,
        totalAdsGenerated,
        averageGenerationTime: Math.round(averageGenerationTime),
        platformDistribution,
        toneDistribution,
        adTypeDistribution,
        timeframe,
        insights: this.generateAdInsights(campaigns)
      };
    } catch (error) {
      console.error('Error generating ad analytics:', error);
      throw error;
    }
  }

  private generateAdInsights(campaigns: any[]): string[] {
    const insights: string[] = [];
    
    if (campaigns.length === 0) return ['No ad campaigns created yet'];

    const platforms = campaigns.reduce((acc, campaign) => {
      const metadata = campaign.metadata as Record<string, any>;
      const platforms = metadata?.platforms || [];
      platforms.forEach((platform: string) => {
        acc[platform] = (acc[platform] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // ✅ FIXED: Explicit type annotations for sort function
    const mostPopularPlatform = Object.entries(platforms).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    if (mostPopularPlatform) {
      insights.push(`Most popular platform: ${mostPopularPlatform[0]} (${mostPopularPlatform[1]} campaigns)`);
    }

    const tones = campaigns.reduce((acc, campaign) => {
      const metadata = campaign.metadata as Record<string, any>;
      const tone = metadata?.tone;
      if (tone) acc[tone] = (acc[tone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // ✅ FIXED: Explicit type annotations for sort function
    const preferredTone = Object.entries(tones).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    if (preferredTone) {
      insights.push(`Preferred tone: ${preferredTone[0]} (${preferredTone[1]} campaigns)`);
    }

    const avgAdsPerCampaign = campaigns.reduce((sum, campaign) => {
      const metadata = campaign.metadata as Record<string, any>;
      return sum + (metadata?.adCount || 0);
    }, 0) / campaigns.length;

    if (avgAdsPerCampaign > 3) {
      insights.push('High ad variety - generating multiple platforms per campaign');
    } else if (avgAdsPerCampaign < 2) {
      insights.push('Consider expanding to multiple platforms for better reach');
    }

    return insights;
  }

  // ✅ NEW: Export ad generation
  async exportAdGeneration(userId: string, generationId: string, format: 'json' | 'csv' = 'json') {
    try {
      const generation = await this.getAdGeneration(userId, generationId);
      if (!generation) {
        throw new Error('Ad generation not found');
      }

      const metadata = generation.metadata as Record<string, any>;
      const ads = generation.ads?.ads || [];

      if (format === 'json') {
        return {
          format: 'json',
          content: generation,
          filename: `ad-campaign-${metadata?.businessName || 'export'}.json`
        };
      }

      // For CSV format, flatten the ads data
      const csvContent = this.generateCSVExport(ads, metadata);
      return {
        format: 'csv',
        content: csvContent,
        filename: `ad-campaign-${metadata?.businessName || 'export'}.csv`
      };
    } catch (error) {
      console.error('Error exporting ad generation:', error);
      throw error;
    }
  }

  private generateCSVExport(ads: GeneratedAd[], metadata: Record<string, any>): string {
    const headers = [
      'Platform',
      'Headlines',
      'Descriptions', 
      'CTAs',
      'Hooks',
      'Visual Suggestions',
      'Business Name',
      'Offer Name',
      'Ad Type',
      'Tone'
    ];

    const rows = ads.map(ad => [
      ad.platform,
      ad.headlines?.join(' | ') || '',
      ad.descriptions?.join(' | ') || '',
      ad.ctas?.join(' | ') || '',
      ad.hooks?.join(' | ') || '',
      ad.visualSuggestions?.join(' | ') || '',
      metadata?.businessName || '',
      metadata?.offerName || '',
      metadata?.adType || '',
      metadata?.tone || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  private generateCacheKey(input: AdGenerationInput): string {
    const key = `ad_writer:${input.businessName}:${input.offerName}:${input.platforms.join('-')}`;
    return key.toLowerCase().replace(/\s+/g, '_');
  }
}