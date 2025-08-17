// services/adWriter.service.ts - FRAMEWORK-BASED VERSION with real AI generation
import { OpenRouterClient } from '@/lib/openrouter';
import { AdGenerationInput, GeneratedAd, Platform } from '@/types/adWriter';
import { AdOptimizationType } from '@/types/adWriter';
import { Redis } from '@upstash/redis';

export class AdWriterService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
  // Define the 7 proven frameworks
  private frameworks = [
    'Problem → Solution',
    'Before → After Bridge', 
    'AIDA',
    'PAS (Problem → Agitation → Solution)',
    'Star → Story → Solution',
    'Feel → Felt → Found',
    'Broken System → Fix'
  ];
  
  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

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
    const response = await this.generateAds(input);
    const deliverableId = await this.saveAdGeneration(userId, workspaceId, response, input);
    
    return {
      ...response,
      deliverableId
    };
  }

  async generateAds(input: AdGenerationInput): Promise<{
    ads: GeneratedAd[];
    tokensUsed: number;
    generationTime: number;
  }> {
    const startTime = Date.now();
    
    console.log('🚀 Starting framework-based ad generation for platforms:', input.platforms);
    
    // Check cache first
    const cacheKey = this.generateCacheKey(input);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('✅ Found cached result');
      return JSON.parse(cached as string);
    }

    // Generate ads for each platform using AI with different frameworks
    const adsPromises = input.platforms.map(platform => 
      this.generatePlatformAdsWithAI(platform, input)
    );
    
    console.log('⏳ Calling AI to generate ads for', input.platforms.length, 'platforms...');
    const results = await Promise.all(adsPromises);
    
    const tokensUsed = results.reduce((sum, r) => sum + r.tokensUsed, 0);
    
    const response = {
      ads: results.map(r => r.ad),
      tokensUsed,
      generationTime: Date.now() - startTime
    };

    console.log('✅ Generated AI-powered ads:', {
      platforms: response.ads.map(ad => ad.platform),
      tokensUsed,
      generationTime: response.generationTime
    });

    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(response), { ex: 3600 });
    
    return response;
  }

  private async generatePlatformAdsWithAI(
    platform: Platform,
    input: AdGenerationInput
  ): Promise<{ ad: GeneratedAd; tokensUsed: number }> {
    console.log(`🎯 Calling AI for ${platform} ads using proven frameworks...`);
    
    // Select 3 random frameworks for variety
    const selectedFrameworks = this.frameworks
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    console.log(`📋 Using frameworks for ${platform}:`, selectedFrameworks);

    // Call AI for each framework to get unique copy
    const frameworkPromises = selectedFrameworks.map(framework => 
      this.generateFrameworkCopy(framework, platform, input)
    );
    
    const frameworkResults = await Promise.all(frameworkPromises);
    
    // Extract the copy from each framework
    const headlines = frameworkResults.map(result => result.headline);
    const descriptions = frameworkResults.map(result => result.description);  
    const ctas = frameworkResults.map(result => result.cta);
    const hooks = frameworkResults.map(result => result.hook);
    
    // Generate visual suggestions
    const visualSuggestions = await this.generateVisualSuggestions(platform, input);
    
    const totalTokens = frameworkResults.reduce((sum, result) => sum + result.tokensUsed, 0);
    
    console.log(`✅ Generated ${platform} ads with ${selectedFrameworks.length} frameworks`);
    
    return {
      ad: {
        platform,
        headlines,
        descriptions,
        ctas,
        hooks,
        visualSuggestions
      },
      tokensUsed: totalTokens
    };
  }

  private async generateFrameworkCopy(
    framework: string,
    platform: Platform,
    input: AdGenerationInput
  ): Promise<{
    headline: string;
    description: string;
    cta: string;
    hook: string;
    tokensUsed: number;
  }> {
    const prompt = this.buildFrameworkPrompt(framework, platform, input);
    
    console.log(`🤖 Calling AI for ${framework} framework on ${platform}...`);
    
    try {
      const response = await this.openRouterClient.complete({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: `You are a world-class direct response copywriter who specializes in high-converting ${platform} ads. 
            
            You create compelling, unique copy that drives action. Never use generic phrases or templates. 
            Every piece of copy should be tailored to the specific business data provided.
            
            CRITICAL: Return ONLY the requested format with no extra text or formatting.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // Higher for more creativity
        max_tokens: 500
      });

      console.log(`📥 Received AI response for ${framework}:`, response.content.substring(0, 100) + '...');
      
      const parsed = this.parseFrameworkResponse(response.content);
      
      return {
        ...parsed,
        tokensUsed: response.usage.total_tokens
      };
      
    } catch (error) {
      console.error(`❌ AI call failed for ${framework}:`, error);
      
      // Return a basic fallback that's still personalized
      return {
        headline: `${input.businessName}: ${input.coreResult} in 30 Days`,
        description: `Transform your ${input.primaryPainPoint.toLowerCase()} into ${input.coreResult.toLowerCase()} with ${input.offerName}. Join ${input.idealCustomer} who've already seen results for just ${input.pricing}.`,
        cta: input.cta || 'Get Started Now',
        hook: `Tired of ${input.primaryPainPoint.toLowerCase()}?`,
        tokensUsed: 0
      };
    }
  }

  private buildFrameworkPrompt(framework: string, platform: Platform, input: AdGenerationInput): string {
    const businessContext = `
BUSINESS DATA:
- Company: ${input.businessName}
- Offer: ${input.offerName} - ${input.offerDescription}  
- Price: ${input.pricing}
- Unique System: ${input.uniqueMechanism}
- Target: ${input.idealCustomer}
- Pain Point: ${input.primaryPainPoint}
- Solution Result: ${input.coreResult}
- Tone: ${input.tone}
- CTA: ${input.cta}
- URL: ${input.url}
${input.urgency ? `- Urgency: ${input.urgency}` : ''}
${input.caseStudy1 ? `- Proof: ${input.caseStudy1}` : ''}
    `;

    const frameworkInstructions: Record<string, string> = {
      'Problem → Solution': `
Using the Problem → Solution framework, create a ${platform} ad that:
1. Opens with the pain point in a compelling way
2. Presents the solution (the offer) clearly  
3. Shows the transformation/result
4. Ends with a strong call-to-action

Return in this EXACT format:
HEADLINE: [compelling headline]
DESCRIPTION: [full ad copy following problem → solution structure]
CTA: [action-oriented call-to-action]
HOOK: [attention-grabbing opening line]
      `,
      
      'Before → After Bridge': `
Using the Before → After Bridge framework, create a ${platform} ad that:
1. Paints the "before" state (current pain)
2. Shows the "after" state (desired outcome)  
3. Positions your offer as the bridge
4. Creates urgency to cross that bridge

Return in this EXACT format:
HEADLINE: [compelling headline]
DESCRIPTION: [full ad copy showing before → after transformation]
CTA: [action-oriented call-to-action]
HOOK: [attention-grabbing opening line]
      `,
      
      'AIDA': `
Using the AIDA framework, create a ${platform} ad that:
1. ATTENTION: Grabs attention with the pain point
2. INTEREST: Builds interest with the unique solution
3. DESIRE: Creates desire by showing the outcome
4. ACTION: Drives to clear action

Return in this EXACT format:
HEADLINE: [attention-grabbing headline]
DESCRIPTION: [full ad copy following AIDA structure]
CTA: [clear action step]
HOOK: [attention-grabbing opening line]
      `,
      
      'PAS (Problem → Agitation → Solution)': `
Using the PAS framework, create a ${platform} ad that:
1. PROBLEM: States the core problem clearly
2. AGITATION: Makes the problem feel urgent/costly
3. SOLUTION: Presents your offer as the solution

Return in this EXACT format:
HEADLINE: [problem-focused headline]
DESCRIPTION: [full ad copy following PAS structure]
CTA: [solution-oriented call-to-action]
HOOK: [problem-focused hook]
      `,
      
      'Star → Story → Solution': `
Using the Star → Story → Solution framework, create a ${platform} ad that:
1. STAR: Position the ideal customer as the star
2. STORY: Tell a relatable transformation story
3. SOLUTION: Present your offer as their solution

Return in this EXACT format:
HEADLINE: [story-driven headline]
DESCRIPTION: [full ad copy following star → story → solution]
CTA: [story-conclusion call-to-action]
HOOK: [story-opening hook]
      `,
      
      'Feel → Felt → Found': `
Using the Feel → Felt → Found framework, create a ${platform} ad that:
1. FEEL: "I know how you feel..." (empathy)
2. FELT: "I felt the same way..." (relatability)
3. FOUND: "Then I found..." (solution)

Return in this EXACT format:
HEADLINE: [empathy-driven headline]
DESCRIPTION: [full ad copy following feel → felt → found]
CTA: [empathetic call-to-action]
HOOK: [empathy-opening hook]
      `,
      
      'Broken System → Fix': `
Using the Broken System → Fix framework, create a ${platform} ad that:
1. Identify what's broken in their current approach
2. Explain why traditional solutions fail
3. Present your system as the fix

Return in this EXACT format:
HEADLINE: [system-focused headline]
DESCRIPTION: [full ad copy showing broken system → fix]
CTA: [fix-oriented call-to-action]
HOOK: [broken-system hook]
      `
    };

    return `${businessContext}

${frameworkInstructions[framework] || frameworkInstructions['Problem → Solution']}

Remember: 
- Use the actual business data to personalize every element
- Make it specific to ${platform} best practices
- Keep ${input.tone} tone throughout
- Be compelling and conversion-focused
- NO generic phrases or templates`;
  }

  private parseFrameworkResponse(content: string): {
    headline: string;
    description: string;
    cta: string;
    hook: string;
  } {
    const lines = content.split('\n').filter(line => line.trim());
    
    let headline = '';
    let description = '';
    let cta = '';
    let hook = '';
    
    for (const line of lines) {
      if (line.startsWith('HEADLINE:')) {
        headline = line.replace('HEADLINE:', '').trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.replace('DESCRIPTION:', '').trim();
      } else if (line.startsWith('CTA:')) {
        cta = line.replace('CTA:', '').trim();
      } else if (line.startsWith('HOOK:')) {
        hook = line.replace('HOOK:', '').trim();
      }
    }
    
    // Fallback if parsing fails
    if (!headline || !description || !cta || !hook) {
      const fullContent = content.replace(/\n/g, ' ').trim();
      headline = headline || fullContent.substring(0, 60) + '...';
      description = description || fullContent;
      cta = cta || 'Learn More';
      hook = hook || fullContent.substring(0, 40) + '...';
    }
    
    return { headline, description, cta, hook };
  }

  private async generateVisualSuggestions(platform: Platform, input: AdGenerationInput): Promise<string[]> {
    const suggestions: Record<Platform, string[]> = {
      facebook: [
        `Before/after visual showing transformation from "${input.primaryPainPoint}" to "${input.coreResult}"`,
        `User-generated content video featuring real client results and testimonials`
      ],
      google: [
        `Clean graphic highlighting "${input.coreResult}" with supporting statistics`,
        `Professional comparison showing your solution vs. traditional approaches`
      ],
      linkedin: [
        `Professional case study graphic with specific metrics and client results`,
        `Industry-specific infographic demonstrating your unique process`
      ],
      tiktok: [
        `Behind-the-scenes video showing your ${input.uniqueMechanism} in action`,
        `Quick transformation reveal video with dramatic before/after results`
      ]
    };

    return suggestions[platform] || suggestions.facebook;
  }

  private generateCacheKey(input: AdGenerationInput): string {
    const key = `ad_writer_v2:${input.businessName}:${input.offerName}:${input.platforms.join('-')}`;
    return key.toLowerCase().replace(/\s+/g, '_');
  }

  // Keep all existing database methods unchanged...
  async saveAdGeneration(userId: string, workspaceId: string, adResponse: { ads: GeneratedAd[]; tokensUsed: number; generationTime: number }, input: AdGenerationInput): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
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
        originalInput: serializedInput
      };
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `Ad Campaign - ${input.offerName || input.businessName}`,
          content: JSON.stringify(adResponse),
          type: 'ad_writer',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: metadata,
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

  async optimizeAd(adCopy: string, optimizationType: AdOptimizationType): Promise<{
    content: string;
    tokensUsed: number;
    generationTime: number;
  }> {
    const startTime = Date.now();

    const optimizationPrompts: Record<AdOptimizationType, string> = {
      'emotional': 'Rewrite this ad copy to have stronger emotional appeal and connection',
      'urgency': 'Add more urgency and scarcity to this ad copy without being pushy',
      'benefits': 'Focus more on benefits and outcomes rather than features',
      'social-proof': 'Incorporate more social proof and credibility elements',
      'simplify': 'Simplify this ad copy for better clarity and readability'
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
}