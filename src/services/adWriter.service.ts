// services/adWriter.service.ts - FIXED with Natural Full Script Generation

import { OpenRouterClient } from '@/lib/openrouter';
import { AdGenerationInput, GeneratedAd, Platform, AD_LENGTH_CONFIGS } from '@/types/adWriter';
import { AdOptimizationType } from '@/types/adWriter';
import { Redis } from '@upstash/redis';

export class AdWriterService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
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
    
    const platforms = input.platforms && input.platforms.length > 0 
      ? input.platforms 
      : ['generic'];
    
    console.log(' Starting script generation for platforms:', platforms);
    console.log('📏 Ad length:', input.adLength);
    
    const adsPromises = platforms.map(platform => 
      this.generatePlatformAdsWithUniqueContent(platform as Platform, input)
    );
    
    const results = await Promise.all(adsPromises);
    const tokensUsed = results.reduce((sum, r) => sum + r.tokensUsed, 0);
    
    const response = {
      ads: results.map(r => r.ad),
      tokensUsed,
      generationTime: Date.now() - startTime
    };

    console.log('  Generated ad content:', {
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
    console.log(`🎯 Generating content for ${platform} with ${input.adLength} length...`);
    
    const allFrameworks = [...this.frameworks];
    
    // Generate sections
    const uniquePromises = allFrameworks.map((framework, index) => 
      this.generateUniqueScriptSections(framework, platform, input, index)
    );
    
    const uniqueResults = await Promise.all(uniquePromises);
    
    const headlines = uniqueResults.map(result => result.headline);
    const hooks = uniqueResults.map(result => result.hook);
    const fixes = uniqueResults.map(result => result.fix);
    const results = uniqueResults.map(result => result.result);
    const proofs = uniqueResults.map(result => result.proof);
    const ctas = uniqueResults.map(result => result.cta);
    
    //   FIXED: Generate natural full scripts separately
    const fullScriptPromises = allFrameworks.map((framework, index) => 
      this.generateNaturalFullScript(framework, platform, input, index)
    );
    
    const fullScriptResults = await Promise.all(fullScriptPromises);
    const fullScripts = fullScriptResults.map((result, index) => ({
      framework: allFrameworks[index],
      script: result.script
    }));
    
    const visualSuggestions = await this.generateVisualSuggestions(platform, input);
    
    const totalTokens = uniqueResults.reduce((sum, result) => sum + result.tokensUsed, 0) +
                      fullScriptResults.reduce((sum, result) => sum + result.tokensUsed, 0);
    
    console.log(`  Generated ${platform} content with ${allFrameworks.length} frameworks`);
    
    return {
      ad: {
        platform,
        headlines,
        descriptions: fixes,
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

  //   NEW: Generate natural, flowing full scripts instead of template insertions
  private async generateNaturalFullScript(
    framework: string,
    platform: Platform,
    input: AdGenerationInput,
    variationIndex: number
  ): Promise<{
    script: string;
    tokensUsed: number;
  }> {
    const prompt = this.buildFullScriptPrompt(framework, platform, input, variationIndex);
    
    console.log(`🎬 Generating natural full script #${variationIndex + 1} for ${framework} on ${platform}...`);
    
    try {
      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.buildFullScriptSystemPrompt(input.adLength, framework)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8 + (variationIndex * 0.03),
        max_tokens: this.getMaxTokensForLength(input.adLength) + 200, // Extra tokens for full script
        top_p: 0.9
      });

      console.log(`📥 Received natural full script #${variationIndex + 1}`);
      
      return {
        script: response.content.trim(),
        tokensUsed: response.usage.total_tokens
      };
    } catch (error) {
      console.error(`  Full script generation failed for ${framework} variation ${variationIndex}:`, error);
      return {
        script: this.getFallbackFullScript(input, framework),
        tokensUsed: 0
      };
    }
  }

  //   NEW: System prompt specifically for natural full scripts
  private buildFullScriptSystemPrompt(adLength: string, framework: string): string {
    const lengthConfig = AD_LENGTH_CONFIGS[adLength as keyof typeof AD_LENGTH_CONFIGS];
    
    return `You are a world-class direct response copywriter creating a complete ${lengthConfig.label.toLowerCase()} ad script.

CRITICAL REQUIREMENTS:
- Write naturally flowing, conversational copy - NOT template insertions
- Don't literally repeat user inputs - transform them into compelling copy
- Create smooth transitions between ideas
- Use varied language and avoid repetitive phrases
- Make it sound like natural human communication
- Total length: ${lengthConfig.description}

FRAMEWORK: ${framework}
Follow this framework's structure but make it feel completely natural and conversational.

TONE GUIDELINES:
- Write as if speaking directly to one person
- Use contractions and natural speech patterns
- Vary sentence structure and length
- Avoid marketing jargon and clichés
- Make transitions feel organic, not forced

AVOID:
- Literal insertion of user inputs without context
- Repetitive phrases or awkward wording
- Template-like language that sounds robotic
- Overuse of the same value propositions
- Unnatural transitions or forced connections

OUTPUT: Return ONLY the complete, natural-flowing ad script with no extra formatting, labels, or sections.`;
  }

  //   NEW: Build prompt for natural full script generation
  private buildFullScriptPrompt(
    framework: string, 
    platform: Platform, 
    input: AdGenerationInput, 
    variationIndex: number
  ): string {
    const lengthConfig = AD_LENGTH_CONFIGS[input.adLength as keyof typeof AD_LENGTH_CONFIGS];
    
    const businessContext = `
BUSINESS INFORMATION (transform this into natural copy, don't insert literally):
- Company: ${input.businessName}
- What they offer: ${input.offerName} - ${input.offerDescription}  
- Price point: ${input.pricing}
- Unique approach: ${input.uniqueMechanism}
- Who it's for: ${input.idealCustomer}
- Main problem they solve: ${input.primaryPainPoint}
- Key outcome: ${input.coreResult}
- Desired tone: ${input.tone}
- What you want them to do: ${input.cta}
- Where to send them: ${input.url}
${input.urgency ? `- Time sensitivity: ${input.urgency}` : ''}
${input.caseStudy1 ? `- Social proof: ${input.caseStudy1}` : ''}
${input.credentials ? `- Credibility: ${input.credentials}` : ''}
    `;

    const platformGuidance = platform === 'generic' 
      ? `Create a compelling ${lengthConfig.label.toLowerCase()} ad script that works across platforms`
      : `Create a compelling ${platform} ${lengthConfig.label.toLowerCase()} ad script optimized for ${platform}'s audience and format`;

    const frameworkInstructions = this.getDetailedFrameworkInstructions(framework);
    
    const naturalityInstructions = `
NATURALNESS REQUIREMENTS:
- Transform the business information into flowing, conversational copy
- Don't say things like "Struggling with [pain point]" - make it natural
- Instead of "I know how you feel about [input]" use authentic empathy
- Vary your language - don't repeat the same phrases
- Use storytelling, metaphors, and relatable scenarios
- Make transitions feel organic and logical
- Sound like a real person talking to another real person

EXAMPLE OF WHAT NOT TO DO:
  "Struggling with want additional passive income without a ton of additional time investment"
  "I know how you feel about want additional passive income without a ton of additional time investment..."

EXAMPLE OF WHAT TO DO INSTEAD:
  "You're putting in long hours but your bank account isn't reflecting the effort..."
  "I used to think the only way to earn more was to work more hours..."
`;

    return `
Create a complete, naturally-flowing ${lengthConfig.label.toLowerCase()} ad script using the ${framework} framework.

${businessContext}

${platformGuidance}

${frameworkInstructions}

${naturalityInstructions}

**Target Length**: ${lengthConfig.description}
**Tone**: ${input.tone} but natural and conversational
**Platform**: ${platform}

Write the complete ad script now - make it flow naturally from start to finish:
`;
  }

  //   NEW: Detailed framework instructions for natural flow
  private getDetailedFrameworkInstructions(framework: string): string {
    const instructions: Record<string, string> = {
      'Challenge → Remedy': `
Structure: Start by presenting their challenge in a relatable way, then introduce your remedy as the natural solution.
Flow: Challenge (empathetic) → Why it's hard (understanding) → The remedy (hopeful) → What changes (specific) → How to get it (clear)`,
      
      'Then → Now → Path': `
Structure: Paint the picture of their current struggle (Then), show the better future (Now), then reveal the path to get there.
Flow: Then (their struggle) → Now (the possibility) → Path (your solution) → Next steps (action)`,
      
      'AIDA': `
Structure: Grab Attention with a compelling opener, build Interest in the solution, create Desire for the outcome, prompt Action.
Flow: Attention (hook) → Interest (intrigue) → Desire (benefits/outcomes) → Action (clear next step)`,
      
      'PAS (Problem → Agitation → Solution)': `
Structure: Identify the problem they relate to, agitate by showing the cost of inaction, then present your solution as relief.
Flow: Problem (relatable) → Agitation (consequences) → Solution (relief and results) → Call to action`,
      
      'Hero → Journey → Outcome': `
Structure: Position them as the hero of their story, describe their journey/struggle, then show the successful outcome your solution enables.
Flow: Hero (them) → Journey (their path/challenges) → Guide (you/your solution) → Success (outcome)`,
      
      'Relate → Experienced → Discovered': `
Structure: Relate to their situation, share what you/others experienced, then reveal what was discovered that changed everything.
Flow: Relate (understanding) → Experienced (shared struggle) → Discovered (breakthrough) → Results (transformation)`,
      
      'Flawed System → Fix': `
Structure: Expose why current approaches are flawed, then introduce your fix as the better alternative.
Flow: Flawed system (what's wrong) → Why it fails (explanation) → The fix (your solution) → Better results (outcome)`
    };
    
    return instructions[framework] || 'Create a compelling narrative that flows naturally from problem to solution to action.';
  }

  //   NEW: Fallback for natural full scripts
  private getFallbackFullScript(input: AdGenerationInput, framework: string): string {
    const lengthConfig = AD_LENGTH_CONFIGS[input.adLength as keyof typeof AD_LENGTH_CONFIGS];
    
    if (input.adLength === 'short') {
      return `${input.idealCustomer} tired of ${input.primaryPainPoint.toLowerCase()}? ${input.businessName}'s ${input.uniqueMechanism.toLowerCase()} delivers ${input.coreResult.toLowerCase()} in ${input.timeline || 'weeks'}. ${input.cta} at ${input.url}`;
    } else if (input.adLength === 'medium') {
      return `Every ${input.idealCustomer.toLowerCase()} knows the frustration of ${input.primaryPainPoint.toLowerCase()}. You've tried everything, but nothing seems to stick.

That's exactly why we created ${input.offerName}. Our ${input.uniqueMechanism.toLowerCase()} approach finally delivers the ${input.coreResult.toLowerCase()} you've been looking for.

${input.caseStudy1 || 'Our clients see results fast'} - and you can too.

Ready to get started? ${input.cta} at ${input.url}`;
    } else {
      return `Let me guess - you're a ${input.idealCustomer.toLowerCase()} who's fed up with ${input.primaryPainPoint.toLowerCase()}. You've probably tried the usual solutions, maybe even invested time and money, but still haven't gotten the results you want.

I get it. I've worked with hundreds of people in your exact situation, and here's what I've learned: the problem isn't you. The problem is that most approaches miss the crucial element that actually creates lasting change.

That's why we developed ${input.offerName}. Instead of the same old methods, we use ${input.uniqueMechanism.toLowerCase()} to help you achieve ${input.coreResult.toLowerCase()} ${input.timeline ? `in just ${input.timeline.toLowerCase()}` : 'faster than you thought possible'}.

${input.caseStudy1 || 'Our clients consistently see dramatic improvements'}, and the best part? It doesn't require you to completely overhaul your life.

${input.urgency ? `${input.urgency} - ` : ''}${input.cta} and let's get you the results you deserve. Visit ${input.url}`;
    }
  }

  // Keep existing section generation method unchanged
  private async generateUniqueScriptSections(
    framework: string,
    platform: Platform,
    input: AdGenerationInput,
    variationIndex: number
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
        temperature: 0.85 + (variationIndex * 0.02),
        max_tokens: this.getMaxTokensForLength(input.adLength),
        top_p: 0.9 + (variationIndex * 0.01)
      });
      
      const parsed = this.parseScriptSectionResponse(response.content, input);
      
      return {
        ...parsed,
        tokensUsed: response.usage.total_tokens
      };
    } catch (error) {
      console.error(`  AI call failed for ${framework} variation ${variationIndex}:`, error);
      return this.getFallbackContent(input, framework, variationIndex);
    }
  }

  // Keep all other existing methods unchanged...
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
      `"The single headline formula that outperforms 90% of ads"`
    ];

    const platformContext = platform === 'generic' 
      ? `Create high-converting ${lengthConfig.label.toLowerCase()} ad script sections for any platform`
      : `Create high-converting ${platform} ${lengthConfig.label.toLowerCase()} script optimized for its audience`;

    const frameworkGuidance = this.getFrameworkGuidance(framework, input);
    
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

  private getMaxTokensForLength(adLength: string): number {
    const tokenMap = {
      short: 300,
      medium: 500, 
      long: 800
    };
    return tokenMap[adLength as keyof typeof tokenMap] || 500;
  }

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
        adLength: input.adLength, //   Save ad length
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
        adLength: input.adLength, //   Save ad length in metadata
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
            input.adLength, //   Add length as tag
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