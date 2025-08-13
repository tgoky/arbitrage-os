// services/adWriter.service.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { AdGenerationInput, GeneratedAd, Platform } from '@/types/adWriter';
import { AdOptimizationType } from '@/types/coldEmail';
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
    - Features: ${input.features?.join(', ')}
    
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

  async optimizeAd(adCopy: string, optimizationType: AdOptimizationType): Promise<{
    content: string;
    tokensUsed: number;
  }> {
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
      tokensUsed: response.usage.total_tokens
    };
  }

  private generateCacheKey(input: AdGenerationInput): string {
    const key = `ad_writer:${input.businessName}:${input.offerName}:${input.platforms.join('-')}`;
    return key.toLowerCase().replace(/\s+/g, '_');
  }
}