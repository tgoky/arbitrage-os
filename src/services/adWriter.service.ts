// services/adWriter.service.ts - FIXED generateVisualSuggestions method
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
    
    // ✅ Handle optional platforms - default to generic if none selected
    const platforms = input.platforms && input.platforms.length > 0 
      ? input.platforms 
      : ['generic']; // Generate platform-agnostic scripts
    
    console.log('🚀 Starting script-section ad generation for platforms:', platforms);
    
    // Skip cache for better variety - each generation should be unique
    
    // Generate ads for each platform using AI with different frameworks
    const adsPromises = platforms.map(platform => 
      this.generatePlatformAdsWithAI(platform as Platform, input)
    );
    
    console.log('⏳ Calling AI to generate unique script sections for', platforms.length, 'platforms...');
    const results = await Promise.all(adsPromises);
    
    const tokensUsed = results.reduce((sum, r) => sum + r.tokensUsed, 0);
    
    const response = {
      ads: results.map(r => r.ad),
      tokensUsed,
      generationTime: Date.now() - startTime
    };

    console.log('✅ Generated script-section ads:', {
      platforms: response.ads.map(ad => ad.platform),
      tokensUsed,
      generationTime: response.generationTime
    });
    
    return response;
  }

  private async generatePlatformAdsWithAI(
    platform: Platform,
    input: AdGenerationInput
  ): Promise<{ ad: GeneratedAd; tokensUsed: number }> {
    console.log(`🎯 Generating high-converting script sections for ${platform}...`);
    
    // ✅ Always select different frameworks for variety (no hard limit)
    const selectedFrameworks = this.frameworks
      .sort(() => 0.5 - Math.random())
      .slice(0, 5); // Use 5 frameworks for more variety
    
    console.log(`📋 Using frameworks for ${platform}:`, selectedFrameworks);

    // Call AI to generate 5 complete script sections using different frameworks
    const frameworkPromises = selectedFrameworks.map(framework => 
      this.generateScriptSections(framework, platform, input)
    );
    
    const frameworkResults = await Promise.all(frameworkPromises);
    
    // ✅ NEW STRUCTURE: Extract script sections instead of basic ad parts
    const headlines = frameworkResults.map(result => result.headline);
    const hooks = frameworkResults.map(result => result.hook);
    const fixes = frameworkResults.map(result => result.fix);
    const results = frameworkResults.map(result => result.result);
    const proofs = frameworkResults.map(result => result.proof);
    const ctas = frameworkResults.map(result => result.cta);
    
    // Generate visual suggestions
    const visualSuggestions = await this.generateVisualSuggestions(platform, input);
    
    const totalTokens = frameworkResults.reduce((sum, result) => sum + result.tokensUsed, 0);
    
    console.log(`✅ Generated ${platform} script sections with ${selectedFrameworks.length} frameworks`);
    
    return {
      ad: {
        platform,
        headlines,
        descriptions: fixes, // ✅ Use 'fix' sections as descriptions
        ctas,
        hooks,
        visualSuggestions,
        // ✅ NEW: Add the new script sections
        fixes,
        results,
        proofs
      },
      tokensUsed: totalTokens
    };
  }

 private async generateScriptSections(
  framework: string,
  platform: Platform,
  input: AdGenerationInput
): Promise<{
  headline: string;
  hook: string;
  fix: string;
  result: string;
  proof: string;
  cta: string;
  tokensUsed: number;
}> {
  const prompt = this.buildScriptSectionPrompt(framework, platform, input);
  
  console.log(`🎬 Generating script sections for ${framework} on ${platform}...`);
  
  try {
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a world-class direct response copywriter who creates scroll-stopping video script sections like the example:
"Your funnel isn't broken—it's just missing the 3 growth-strategy bolts that turn clicks into cash."
You create PUNCHY, SPECIFIC, URGENT copy with:
- Concrete numbers and timeframes
- Visual metaphors and analogies
- Urgency and scarcity
- Specific proof points
- Action-driving language
CRITICAL: Return ONLY a valid JSON object with no extra text, markdown, or code fences.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 600
    });

    console.log(`📥 Received script sections for ${framework}:`, response.content.substring(0, 100) + '...');
    
    const parsed = this.parseScriptSectionResponse(response.content, input); // Pass input here
    
    return {
      ...parsed,
      tokensUsed: response.usage.total_tokens
    };
  } catch (error) {
    console.error(`❌ AI call failed for ${framework}:`, error);
    return {
      headline: `${input.coreResult} in ${input.timeline || '30 Days'} - ${input.businessName}`,
      hook: `Struggling with ${input.primaryPainPoint.toLowerCase()}? ${input.uniqueMechanism} changes that.`,
      fix: `Our ${input.offerName} delivers ${input.coreResult} in ${input.timeline || 'weeks'}.`,
      result: `Result: ${input.coreResult} for ${input.idealCustomer.toLowerCase()}.`,
      proof: `${input.caseStudy1 || 'Proven results with real clients'}.`,
      cta: `${input.cta} at ${input.url} now.`,
      tokensUsed: 0
    };
  }
}


private buildScriptSectionPrompt(framework: string, platform: Platform, input: AdGenerationInput): string {
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

  const personalizedExample = `{
    "headline": "${input.coreResult} in ${input.timeline || '30 Days'} - ${input.businessName}",
    "hook": "Your ${input.primaryPainPoint.toLowerCase()} isn't permanent—it's missing ${input.uniqueMechanism.toLowerCase()}.",
    "fix": "We deliver ${input.coreResult} with ${input.uniqueMechanism} in ${input.timeline || 'weeks'}.",
    "result": "Result: ${input.coreResult} and transformed ${input.idealCustomer.toLowerCase()} business.",
    "proof": "${input.caseStudy1 || 'Proven results with real clients'}.",
    "cta": "${input.cta} at ${input.url} now."
  }`;

  const platformContext = platform === 'generic' 
    ? 'Create high-converting ad script sections for any platform'
    : `Create high-converting ${platform} script optimized for its audience`;

  const frameworkGuidance = this.getFrameworkGuidance(framework, input);

  return `
**Instructions**:
- Generate ad script sections using the ${framework} framework.
- Return **only a valid JSON object** with no markdown, code fences (e.g., \`\`\`json), or extra text.
- Use the EXACT business data provided below for personalized, punchy copy.
- Match the tone: ${input.tone}.
- Incorporate specific pain point (${input.primaryPainPoint}), unique mechanism (${input.uniqueMechanism}), and result (${input.coreResult}).

${businessContext}

${platformContext}

${frameworkGuidance}

**Example Output** (for reference, do not include):
${personalizedExample}

**JSON Format**:
{
  "headline": "string",
  "hook": "string",
  "fix": "string",
  "result": "string",
  "proof": "string",
  "cta": "string"
}

**Requirements**:
- Use ${input.businessName}, ${input.primaryPainPoint}, ${input.uniqueMechanism}, ${input.coreResult}.
- Include ${input.pricing} and ${input.caseStudy1 || 'proven results'}.
- Write for ${input.idealCustomer}.
- Use specific numbers/timeframes from ${input.timeline || 'weeks'}.
- Avoid generic phrases like "3 accelerators" or "proven system."
- Return only the JSON object.
`;
}

// ✅ Enhanced framework guidance that uses actual business data
private getFrameworkGuidance(framework: string, input: AdGenerationInput): string {
  const frameworkMap: Record<string, string> = {
    'Problem → Solution': `Reframe "${input.primaryPainPoint}" as solvable, then present "${input.uniqueMechanism}" as the missing solution that delivers "${input.coreResult}".`,
    
    'Before → After Bridge': `Paint the contrast between their current "${input.primaryPainPoint}" struggle and the "${input.coreResult}" transformation your "${input.offerName}" provides.`,
    
    'AIDA': `Grab attention with their pain "${input.primaryPainPoint}", build interest with "${input.uniqueMechanism}", create desire with "${input.coreResult}", prompt action with "${input.cta}".`,
    
    'PAS (Problem → Agitation → Solution)': `Identify "${input.primaryPainPoint}", amplify the cost of staying stuck, then position "${input.offerName}" as the relief that delivers "${input.coreResult}".`,
    
    'Star → Story → Solution': `Lead with "${input.idealCustomer}" identity, tell a transformation story about achieving "${input.coreResult}", present "${input.uniqueMechanism}" as the vehicle.`,
    
    'Feel → Felt → Found': `Connect with their "${input.primaryPainPoint}" feelings, show others felt the same, reveal they found "${input.uniqueMechanism}" that delivered "${input.coreResult}".`,
    
    'Broken System → Fix': `Expose why current solutions fail at solving "${input.primaryPainPoint}", then introduce "${input.uniqueMechanism}" as the systematic fix for "${input.coreResult}".`
  };
  
  return frameworkMap[framework] || `Structure a compelling transformation story using their specific business details: ${input.businessName}, ${input.uniqueMechanism}, ${input.coreResult}.`;
}

private parseScriptSectionResponse(content: string, input: AdGenerationInput): {
  headline: string;
  hook: string;
  fix: string;
  result: string;
  proof: string;
  cta: string;
} {
  try {
    console.log('Raw AI response:', content);
    const parsed = JSON.parse(content);
    if (!parsed.headline || !parsed.hook || !parsed.fix || !parsed.result || !parsed.proof || !parsed.cta) {
      throw new Error('Incomplete JSON structure');
    }
    return parsed;
  } catch (error) {
    console.error('JSON parsing error:', error, 'Raw content:', content);
    return {
      headline: `${input.coreResult} in ${input.timeline || '30 Days'} - ${input.businessName}`,
      hook: `Struggling with ${input.primaryPainPoint.toLowerCase()}? ${input.uniqueMechanism} changes that.`,
      fix: `Our ${input.offerName} delivers ${input.coreResult} in ${input.timeline || 'weeks'}.`,
      result: `Result: ${input.coreResult} for ${input.idealCustomer.toLowerCase()}.`,
      proof: `${input.caseStudy1 || 'Proven results with real clients'}.`,
      cta: `${input.cta} at ${input.url} now.`,
    };
  }
}




  // ✅ FIXED: Add 'generic' platform to visual suggestions
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
      ],
      // ✅ NEW: Add generic platform suggestions
      generic: [
        `Visual comparison showing before/after transformation from "${input.primaryPainPoint}" to "${input.coreResult}"`,
        `Professional graphic showcasing key benefits and your unique methodology`,
        `Client testimonial video or graphic with specific results and timeframes`,
        `Infographic demonstrating your ${input.uniqueMechanism} process step-by-step`
      ]
    };

    return suggestions[platform] || suggestions.generic;
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
      model: 'openai/gpt-4o',
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