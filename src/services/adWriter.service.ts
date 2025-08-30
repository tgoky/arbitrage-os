// services/adWriter.service.ts - FIXED with Unique Content Generation & Length Control

import { OpenRouterClient } from '@/lib/openrouter';
import { AdGenerationInput, GeneratedAd, Platform, AD_LENGTH_CONFIGS } from '@/types/adWriter';
import { AdOptimizationType } from '@/types/adWriter';
import { Redis } from '@upstash/redis';

export class AdWriterService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
  // 7 proven frameworks - each will generate DIFFERENT content
private frameworks = [
  'Challenge → Remedy',
  'Then → Now → Path',
  'AIDA',
  'PAS (Problem → Agitation → Solution)',
  'Hero → Journey → Outcome',
  'Relate → Experienced → Discovered',
  'Flawed System → Fix'
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
    
    // Handle optional platforms - default to generic if none selected
    const platforms = input.platforms && input.platforms.length > 0 
      ? input.platforms 
      : ['generic'];
    
    console.log('🚀 Starting UNIQUE script generation for platforms:', platforms);
    console.log('📏 Ad length:', input.adLength);
    
    // Generate UNIQUE ads for each platform
    const adsPromises = platforms.map(platform => 
      this.generatePlatformAdsWithUniqueContent(platform as Platform, input)
    );
    
    console.log('⏳ Calling AI to generate UNIQUE ad content for', platforms.length, 'platforms...');
    const results = await Promise.all(adsPromises);
    
    const tokensUsed = results.reduce((sum, r) => sum + r.tokensUsed, 0);
    
    const response = {
      ads: results.map(r => r.ad),
      tokensUsed,
      generationTime: Date.now() - startTime
    };

    console.log('✅ Generated UNIQUE ad content:', {
      platforms: response.ads.map(ad => ad.platform),
      tokensUsed,
      generationTime: response.generationTime
    });
    
    return response;
  }

  private async generatePlatformAdsWithUniqueContent(
    platform: Platform,
    input: AdGenerationInput
  ): Promise<{ ad: GeneratedAd; tokensUsed: number }> {
    console.log(`🎯 Generating UNIQUE content for ${platform} with ${input.adLength} length...`);
    
    // ✅ CRITICAL FIX: Use ALL frameworks but with DIFFERENT approaches
    const allFrameworks = [...this.frameworks]; // Use all 7 frameworks
    
    console.log(`📋 Using ALL ${allFrameworks.length} frameworks for ${platform}:`, allFrameworks);

    // ✅ Generate UNIQUE sections - each call gets DIFFERENT instructions
    const uniquePromises = allFrameworks.map((framework, index) => 
      this.generateUniqueScriptSections(framework, platform, input, index)
    );
    
    const uniqueResults = await Promise.all(uniquePromises);
    
    // ✅ Extract UNIQUE sections (no duplicates)
    const headlines = uniqueResults.map(result => result.headline);
    const hooks = uniqueResults.map(result => result.hook);
    const fixes = uniqueResults.map(result => result.fix);
    const results = uniqueResults.map(result => result.result);
    const proofs = uniqueResults.map(result => result.proof);
    const ctas = uniqueResults.map(result => result.cta);
    
    // ✅ Generate UNIQUE full scripts
    const fullScripts = uniqueResults.map((result, index) => 
      this.combineIntoFullScript(result, allFrameworks[index], platform, input)
    );
    
    // Generate platform-specific visual suggestions
    const visualSuggestions = await this.generateVisualSuggestions(platform, input);
    
    const totalTokens = uniqueResults.reduce((sum, result) => sum + result.tokensUsed, 0);
    
    console.log(`✅ Generated ${platform} UNIQUE content with ${allFrameworks.length} frameworks`);
    
    return {
      ad: {
        platform,
        headlines,
        descriptions: fixes, // These are actually "fix" sections
        ctas,
        hooks,
        visualSuggestions,
        fixes,
        results,
        proofs,
        fullScripts
      },
      tokensUsed: totalTokens
    };
  }

  // ✅ CRITICAL FIX: Generate UNIQUE content for each framework
  private async generateUniqueScriptSections(
    framework: string,
    platform: Platform,
    input: AdGenerationInput,
    variationIndex: number // ✅ NEW: Ensure uniqueness with index
  ): Promise<{
    headline: string;
    hook: string;
    fix: string;
    result: string;
    proof: string;
    cta: string;
    tokensUsed: number;
  }> {
    const prompt = this.buildUniqueScriptPrompt(framework, platform, input, variationIndex);
    
    console.log(`🎬 Generating UNIQUE script #${variationIndex + 1} for ${framework} on ${platform}...`);
    
    try {
      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.buildUniqueSystemPrompt(input.adLength, variationIndex)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.85 + (variationIndex * 0.02), // ✅ VARY temperature for uniqueness
        max_tokens: this.getMaxTokensForLength(input.adLength),
        top_p: 0.9 + (variationIndex * 0.01) // ✅ VARY sampling for uniqueness
      });

      console.log(`📥 Received UNIQUE script #${variationIndex + 1}:`, response.content.substring(0, 100) + '...');
      
      const parsed = this.parseScriptSectionResponse(response.content, input);
      
      return {
        ...parsed,
        tokensUsed: response.usage.total_tokens
      };
    } catch (error) {
      console.error(`❌ AI call failed for ${framework} variation ${variationIndex}:`, error);
      return this.getFallbackContent(input, framework, variationIndex);
    }
  }

  // ✅ NEW: Build system prompt that ensures uniqueness
  private buildUniqueSystemPrompt(adLength: string, variationIndex: number): string {
    const lengthConfig = AD_LENGTH_CONFIGS[adLength as keyof typeof AD_LENGTH_CONFIGS];
    
    const uniquenessInstructions = [
      "You must create completely ORIGINAL content. No repetition of phrases or concepts.",
      "Use different angles, metaphors, and approaches than typical ads.",
      "Avoid clichés and overused marketing phrases.",
      "Each element should feel fresh and unique.",
      "Focus on unexpected hooks and creative angles."
    ];
    
    const variationSpecificInstructions = [
      "Use power words and emotional triggers",
      "Focus on specific numbers and concrete benefits", 
      "Emphasize urgency and time-sensitive elements",
      "Highlight social proof and community aspects",
      "Create curiosity gaps and pattern interrupts",
      "Use storytelling and narrative elements",
      "Focus on transformation and dramatic change"
    ];

    return `You are a world-class direct response copywriter creating ${lengthConfig.label.toLowerCase()}.

LENGTH REQUIREMENTS:
- Headlines: ${lengthConfig.headlineLength} (max ${lengthConfig.maxChars.headline} chars)
- Descriptions: ${lengthConfig.descriptionLength} (max ${lengthConfig.maxChars.description} chars)
- Best for: ${lengthConfig.bestFor}

UNIQUENESS REQUIREMENTS:
${uniquenessInstructions.join('\n')}

VARIATION #${variationIndex + 1} FOCUS:
${variationSpecificInstructions[variationIndex] || "Create compelling, conversion-focused copy"}

CRITICAL: Return ONLY a valid JSON object with no extra text, markdown, or code fences.`;
  }

  // ✅ NEW: Build prompt that enforces uniqueness
  private buildUniqueScriptPrompt(
    framework: string, 
    platform: Platform, 
    input: AdGenerationInput, 
    variationIndex: number
  ): string {
    const lengthConfig = AD_LENGTH_CONFIGS[input.adLength as keyof typeof AD_LENGTH_CONFIGS];
    
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

  const uniqueExamples = [
  `"The ad strategy your competitors hope you never discover"`,
  `"Why your best leads vanish right before checkout"`,
  `"One overlooked fix that triples your click-through rate"`,
  `"The hidden friction point killing your conversions"`,
  `"Turn casual scrollers into loyal buyers with this method"`,
  `"What separates high-converting ads from money pits"`,
  `"The single headline formula that outperforms 90% of ads"`,
  `"Why lowering prices won’t save your funnel (and what will)"`,
  `"The tiny trust signal that makes people say ‘yes’"`,
  `"From ignored to irresistible in one simple shift"`,
  `"How to stop burning budget on the wrong audience"`,
  `"The unseen bias shaping every buying decision online"`,
  `"Your ads aren’t failing—you’re just missing this piece"`,
  `"The conversion ceiling you don’t know you’ve hit"`,
  `"Why people believe your competitor’s promises over yours"`,
  `"The social proof playbook Fortune 500 brands won’t share"`,
  `"How to make prospects feel like you’re reading their mind"`,
  `"The micro-commitment hack that accelerates sales"`,
  `"From bland to binge-worthy: rewrite your offer in minutes"`,
  `"Why targeting more people is shrinking your results"`,
  `"The messaging blind spot that even pros overlook"`,
  `"What your CTA secretly tells prospects about your offer"`,
  `"The buying trigger hidden in your customer’s objections"`,
  `"The shortcut to turning skepticism into sold-out demand"`,
   `"The costly mistake 8 out of 10 marketers make without realizing"`,
  `"Your ads are saying the right words to the wrong people"`,
  `"What happens when you stop selling features and start selling futures"`,
  `"The hidden bias in your copy that repels ready-to-buy customers"`,
  `"This one emotional trigger outperforms discounts every time"`,
  `"Why complexity is the silent killer of conversions"`,
  `"The ad formula that works even when your product isn’t ‘sexy’"`,
  `"Stop guessing: how data reveals what your customers *really* want"`,
  `"The brain shortcut that makes offers feel ‘too good to pass up’"`,
  `"From ad fatigue to ad frenzy: reignite stalled campaigns"`,
  `"Why copying ‘proven templates’ is holding your results back"`,
  `"The overlooked first 3 seconds that decide your ROAS fate"`,
  `"What your landing page design whispers about your credibility"`,
  `"The neuroscience-backed tweak that instantly boosts engagement"`,
  `"Why the best ads don’t look like ads at all"`
];


    const platformContext = platform === 'generic' 
      ? `Create high-converting ${lengthConfig.label.toLowerCase()} ad script sections for any platform`
      : `Create high-converting ${platform} ${lengthConfig.label.toLowerCase()} script optimized for its audience`;

    const frameworkGuidance = this.getFrameworkGuidance(framework, input);
    
    // ✅ Add uniqueness constraints
    const uniquenessConstraints = `
UNIQUENESS REQUIREMENTS FOR VARIATION #${variationIndex + 1}:
- NO generic phrases like "proven system," "game-changer," "secret"
- Use SPECIFIC details from the business data
- Create ORIGINAL metaphors and analogies
- Avoid overused marketing language
- Make each element feel completely fresh
- Example style (but create your own): ${uniqueExamples[variationIndex] || uniqueExamples[0]}
`;

    return `
**Instructions**:
Generate ${lengthConfig.label.toLowerCase()} ad script sections using the ${framework} framework.

${businessContext}

${platformContext}

${frameworkGuidance}

${uniquenessConstraints}

**LENGTH SPECIFICATIONS:**
- Headlines: ${lengthConfig.headlineLength} (max ${lengthConfig.maxChars.headline} chars)
- Descriptions: ${lengthConfig.descriptionLength} (max ${lengthConfig.maxChars.description} chars)

**JSON Format Required:**
{
  "headline": "string",
  "hook": "string", 
  "fix": "string",
  "result": "string",
  "proof": "string",
  "cta": "string"
}

**Critical Rules:**
- Use EXACT business details: ${input.businessName}, ${input.primaryPainPoint}, ${input.uniqueMechanism}
- Create COMPLETELY ORIGINAL content - no repetition
- Match tone: ${input.tone}
- Include specific numbers and proof points
- Return ONLY the JSON object
`;
  }

  // ✅ NEW: Get appropriate max tokens based on ad length
  private getMaxTokensForLength(adLength: string): number {
    const tokenMap = {
      short: 300,
      medium: 500, 
      long: 800
    };
    return tokenMap[adLength as keyof typeof tokenMap] || 500;
  }

  // ✅ NEW: Provide unique fallback content for each variation
  private getFallbackContent(input: AdGenerationInput, framework: string, index: number): {
    headline: string;
    hook: string;
    fix: string;
    result: string;
    proof: string;
    cta: string;
    tokensUsed: number;
  } {
    const variations = [
      "breakthrough", "rapid", "proven", "exclusive", "revolutionary", "instant", "guaranteed"
    ];
    const variation = variations[index] || "effective";
    
    return {
      headline: `${variation.charAt(0).toUpperCase() + variation.slice(1)} ${input.coreResult} - ${input.businessName}`,
      hook: `Struggling with ${input.primaryPainPoint.toLowerCase()}? This ${variation} approach changes everything.`,
      fix: `Our ${input.offerName} delivers ${variation} ${input.coreResult} using ${input.uniqueMechanism}.`,
      result: `Result: ${variation.charAt(0).toUpperCase() + variation.slice(1)} ${input.coreResult} for ${input.idealCustomer.toLowerCase()}.`,
      proof: `${input.caseStudy1 || `${variation.charAt(0).toUpperCase() + variation.slice(1)} results with real clients`}.`,
      cta: `${input.cta} - Get ${variation} results at ${input.url}`,
      tokensUsed: 0
    };
  }

  // Keep existing methods but update with uniqueness focus...
  private combineIntoFullScript(
    sections: {
      headline: string;
      hook: string;
      fix: string;
      result: string;
      proof: string;
      cta: string;
    },
    framework: string,
    platform: Platform,
    input: AdGenerationInput
  ): {
    framework: string;
    script: string;
  } {
    const lengthConfig = AD_LENGTH_CONFIGS[input.adLength as keyof typeof AD_LENGTH_CONFIGS];
    
    // Create length-appropriate script structure
    let script = '';
    
    switch (framework) {
      case 'AIDA':
        if (input.adLength === 'short') {
          script = `${sections.hook}\n${sections.fix}\n${sections.cta}`;
        } else if (input.adLength === 'medium') {
          script = `[ATTENTION]\n${sections.hook}\n\n[INTEREST & DESIRE]\n${sections.fix}\n${sections.result}\n\n[ACTION]\n${sections.cta}`;
        } else {
          script = `[ATTENTION]\n${sections.hook}\n\n[INTEREST]\n${sections.fix}\n\n[DESIRE]\n${sections.result}\n${sections.proof}\n\n[ACTION]\n${sections.cta}`;
        }
        break;
        
      case 'PAS (Problem → Agitation → Solution)':
        if (input.adLength === 'short') {
          script = `${sections.hook}\n${sections.fix}\n${sections.cta}`;
        } else if (input.adLength === 'medium') {
          script = `[PROBLEM]\n${sections.hook}\n\n[SOLUTION]\n${sections.fix}\n${sections.result}\n\n${sections.cta}`;
        } else {
          script = `[PROBLEM]\n${sections.hook}\n\n[AGITATION]\nMost ${input.idealCustomer.toLowerCase()} struggle with this because traditional solutions don't address the root cause.\n\n[SOLUTION]\n${sections.fix}\n${sections.result}\n${sections.proof}\n\n${sections.cta}`;
        }
        break;
        
      // Add other framework cases with length variations...
      default:
        if (input.adLength === 'short') {
          script = `${sections.hook}\n${sections.fix}\n${sections.cta}`;
        } else if (input.adLength === 'medium') {
          script = `${sections.headline}\n\n${sections.hook}\n\n${sections.fix}\n${sections.result}\n\n${sections.cta}`;
        } else {
          script = `${sections.headline}\n\n${sections.hook}\n\n${sections.fix}\n\n${sections.result}\n\n${sections.proof}\n\n${sections.cta}`;
        }
    }
    
    return {
      framework,
      script
    };
  }

  // Keep existing methods unchanged...
private getFrameworkGuidance(framework: string, input: AdGenerationInput): string {
  const frameworkMap: Record<string, string> = {
    'Challenge → Remedy': `Position "${input.primaryPainPoint}" as a clear challenge, then spotlight "${input.uniqueMechanism}" as the breakthrough that unlocks "${input.coreResult}".`,
    
    'Then → Now → Path': `Show the gap between their old struggle with "${input.primaryPainPoint}" and the new reality of "${input.coreResult}" — with "${input.offerName}" as the bridge.`,
    
    'AIDA': `Capture attention by naming "${input.primaryPainPoint}", spark curiosity with "${input.uniqueMechanism}", build desire through "${input.coreResult}", and drive action using "${input.cta}".`,
    
    'PAS (Problem → Agitation → Solution)': `Call out "${input.primaryPainPoint}", intensify the pain of staying stuck, then position "${input.offerName}" as the simple fix that unlocks "${input.coreResult}".`,
    
    'Hero → Journey → Outcome': `Highlight "${input.idealCustomer}" as the hero, tell their journey toward "${input.coreResult}", and reveal "${input.uniqueMechanism}" as the key driver of success.`,
    
    'Relate → Experienced → Discovered': `Empathize with the frustration of "${input.primaryPainPoint}", validate that others felt the same, then reveal "${input.uniqueMechanism}" as the discovery that delivered "${input.coreResult}".`,
    
    'Flawed System → Fix': `Uncover why current options fail to solve "${input.primaryPainPoint}", then show how "${input.uniqueMechanism}" delivers a reliable fix that produces "${input.coreResult}".`
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
        adLength: input.adLength, // ✅ Save ad length
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
        adLength: input.adLength, // ✅ Save ad length in metadata
        adCount: adResponse.ads.length,
        tokensUsed: adResponse.tokensUsed,
        generationTime: adResponse.generationTime,
        generatedAt: new Date().toISOString(),
        originalInput: serializedInput
      };
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `Ad Campaign (${input.adLength}) - ${input.offerName || input.businessName}`,
          content: JSON.stringify(adResponse),
          type: 'ad_writer',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: metadata,
          tags: [
            'ad-campaign',
            input.adType,
            input.tone,
            input.adLength, // ✅ Add length as tag
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