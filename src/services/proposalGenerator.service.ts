// services/proposalGenerator.service.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { Redis } from '@upstash/redis';
import type { ProposalGeneratorInput, ProposalGeneratorOutput } from '@/types/proposalGenerator';
import crypto from 'crypto';

export class ProposalGeneratorError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ProposalGeneratorError';
  }
}

export class ProposalGeneratorService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  private readonly AI_TIMEOUT = 60000;
  private readonly MAX_RETRIES = 2;
  private readonly CACHE_TTL = 86400; // 24 hours

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required');
    }
    if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
      throw new Error('Redis configuration is required');
    }

    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  }

  async generateGammaPrompt(input: ProposalGeneratorInput): Promise<ProposalGeneratorOutput> {
    const startTime = Date.now();

    console.log('🎯 ProposalGeneratorService.generateGammaPrompt called');
    console.log('📦 Input:', {
      clientName: input.clientDetails.clientName,
      companyName: input.clientDetails.companyName,
      solutionCount: input.solutions.length,
    });

    // Check cache
    const cacheKey = this.buildCacheKey(input);
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('✅ Cache hit');
        return JSON.parse(cached as string);
      }
      console.log('📭 Cache miss');
    } catch (cacheError) {
      console.warn('⚠️ Cache read error (non-critical):', cacheError);
    }

    // Generate with retry
    const gammaPrompt = await this.generateWithRetry(input);

    const output: ProposalGeneratorOutput = {
      gammaPrompt,
      generatedAt: new Date().toISOString(),
      tokensUsed: 0, // Updated after generation
      processingTime: Date.now() - startTime,
      inputSnapshot: input,
    };

    // Cache result
    try {
      await this.redis.set(cacheKey, JSON.stringify(output), { ex: this.CACHE_TTL });
      console.log('💾 Result cached');
    } catch (cacheError) {
      console.warn('⚠️ Cache write error (non-critical):', cacheError);
    }

    return output;
  }

  private async generateWithRetry(input: ProposalGeneratorInput): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Generating Gamma prompt (attempt ${attempt}/${this.MAX_RETRIES})`);
        return await this.callAI(input);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Attempt ${attempt} failed:`, lastError.message);

        if (attempt < this.MAX_RETRIES) {
          const delay = 2000 * attempt;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed — use deterministic fallback
    console.warn('⚠️ AI generation failed, using deterministic fallback');
    return this.buildFallbackPrompt(input);
  }

  private async callAI(input: ProposalGeneratorInput): Promise<string> {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    const response = await Promise.race([
      this.openRouterClient.complete({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 6000,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI generation timeout')), this.AI_TIMEOUT);
      }),
    ]);

    console.log('✅ AI response received');
    console.log('📊 Tokens used:', response.usage?.total_tokens);

    if (!response.content || response.content.length < 100) {
      throw new Error('AI returned insufficient content');
    }

    return response.content.trim();
  }

  private getSystemPrompt(): string {
    return `You are an expert business proposal writer and presentation strategist. Your job is to create comprehensive, polished Gamma.app presentation prompts that produce stunning, high-converting sales proposals.

RULES:
- Output ONLY the Gamma prompt text. No preambles, no explanations, no markdown code fences.
- Every slide must have a clear title and detailed content instructions.
- Use specific data from the input — never use generic placeholders like [COMPANY] or [NAME].
- Frame everything around ROI, cost savings, and concrete business impact.
- Use power words: "eliminate", "transform", "reclaim", "unlock", "automate".
- Structure pricing as investment vs. cost — always anchor against what they're currently losing.
- The tone must match what the user specified (professional, aggressive, consultative, etc.)
- Include a clear call-to-action slide at the end.
- If solution pricing data is provided, calculate and include totals in the summary slide.
- Make the presentation tell a story: Problem → Impact → Vision → Solutions → Proof → CTA.`;
  }

  private buildUserPrompt(input: ProposalGeneratorInput): string {
    const { clientDetails, currentState, futureState, solutions, closeDetails } = input;

    // Calculate totals
    let totalSetup = 0;
    let totalMonthly = 0;
    solutions.forEach((s) => {
      totalSetup += this.parseCurrency(s.setupFee);
      totalMonthly += this.parseCurrency(s.monthlyFee);
    });

    let prompt = `Generate a Gamma.app presentation prompt for the following client proposal.

--- CLIENT DETAILS ---
Client Name: ${clientDetails.clientName}
Client Title: ${clientDetails.clientTitle || 'Decision Maker'}
Company: ${clientDetails.companyName}
Core Pitch: ${clientDetails.corePitchGoal || 'Custom AI & Automation Solutions'}
Desired Tone: ${clientDetails.presentationTone}

--- CURRENT PAIN POINTS (The "Bleed") ---
Main Bottleneck: ${currentState.mainBottleneck || 'Not specified'}
Team Inefficiencies: ${currentState.teamInefficiencies || 'Not specified'}
${currentState.opportunityCost ? `Opportunity Cost: ${currentState.opportunityCost}` : ''}

--- FUTURE STATE (The "Cure") ---
Proposed Team Structure: ${futureState.proposedTeamStructure || 'Not specified'}
Owner/Executive New Role: ${futureState.ownerExecutiveRole || 'Not specified'}

--- SOLUTIONS (${solutions.length} total) ---
`;

    solutions.forEach((s, i) => {
      prompt += `
Solution ${i + 1}: ${s.solutionName}
  How it Works: ${s.howItWorks || 'TBD'}
  Key Benefits: ${s.keyBenefits || 'Streamlined operations'}
  Setup Fee: ${s.setupFee || 'TBD'}
  Monthly Fee: ${s.monthlyFee || 'TBD'}
`;
    });

    prompt += `
--- PRICING TOTALS ---
Total Upfront Setup: $${totalSetup.toLocaleString()}
Total Monthly: $${totalMonthly.toLocaleString()}/mo
${totalSetup > 0 && totalMonthly > 0 ? `First Year Value: $${(totalSetup + totalMonthly * 12).toLocaleString()}` : ''}

--- THE CLOSE ---
${closeDetails.bundleDiscountOffer ? `Bundle Offer: ${closeDetails.bundleDiscountOffer}` : ''}
Call to Action: ${closeDetails.callToAction || 'Book Your Strategy Call'}
${closeDetails.bookingLink ? `Booking Link: ${closeDetails.bookingLink}` : ''}

---

Generate a complete Gamma.app prompt with 7-10 slides covering:
1. Title Card (company name + powerful subtitle)
2. The Problem / Main Bottleneck (with specific pain point data)
3. The Current vs. Future Operating Model
4. One slide per solution (${solutions.length} solutions) with workflow, benefits, and pricing
5. ROI Summary with total investment breakdown
6. Next Steps / Call to Action

Make each slide content detailed and specific to this client. Use their actual numbers and situation. Do NOT use generic filler.`;

    return prompt;
  }

  /**
   * Deterministic fallback prompt when AI is unavailable.
   * Produces a solid prompt using only the structured input data.
   */
  private buildFallbackPrompt(input: ProposalGeneratorInput): string {
    const { clientDetails, currentState, futureState, solutions, closeDetails } = input;

    let totalSetup = 0;
    let totalMonthly = 0;
    solutions.forEach((s) => {
      totalSetup += this.parseCurrency(s.setupFee);
      totalMonthly += this.parseCurrency(s.monthlyFee);
    });

    const totalSetupStr = totalSetup > 0 ? `$${totalSetup.toLocaleString()}` : 'TBD';
    const totalMonthlyStr = totalMonthly > 0 ? `$${totalMonthly.toLocaleString()}` : 'TBD';

    let prompt = '';

    prompt += `Create a comprehensive proposal presentation for ${clientDetails.clientName}, ${clientDetails.clientTitle || 'Decision Maker'} of ${clientDetails.companyName}. The tone should be ${clientDetails.presentationTone}. The goal is to pitch ${clientDetails.corePitchGoal || 'Custom Solutions'}.\n\n`;

    prompt += `Slide 1: Title Card\nTitle: Scaling ${clientDetails.companyName} with ${clientDetails.corePitchGoal || 'Smart Automation'}\nSubtitle: Eliminating Bottlenecks, Recovering Lost Revenue, and Building a Lean Machine.\n\n`;

    prompt += `Slide 2: The Core Problem\nHighlight the primary pain points:\n`;
    if (currentState.mainBottleneck) prompt += `* The Main Bleed: ${currentState.mainBottleneck}\n`;
    if (currentState.teamInefficiencies) prompt += `* Wasted Labor: ${currentState.teamInefficiencies}\n`;
    if (currentState.opportunityCost) prompt += `* Opportunity Cost: ${currentState.opportunityCost}\n`;
    prompt += '\n';

    prompt += `Slide 3: The New Operating Model\nVisualize the transformation:\n`;
    prompt += `* Current State: ${currentState.teamInefficiencies || 'Manual, inefficient processes draining time and capital.'}\n`;
    prompt += `* Proposed Structure: ${futureState.proposedTeamStructure || 'Lean, automated team structure.'}\n`;
    prompt += `* Executive Role: ${futureState.ownerExecutiveRole || 'Owner focuses only on high-value activities.'}\n\n`;

    solutions.forEach((solution, index) => {
      const slideNum = index + 4;
      prompt += `Slide ${slideNum}: Solution ${index + 1} - ${solution.solutionName}\nDescribe the workflow and investment:\n`;
      prompt += `* How it Works: ${solution.howItWorks || 'Automated workflow replacing manual processes.'}\n`;
      if (solution.keyBenefits) prompt += `* Key Benefits: ${solution.keyBenefits}\n`;
      prompt += `* Result: Streamlined operations with measurable, immediate impact.\n`;
      prompt += `* Investment: ${solution.setupFee || 'TBD'} One-Time Setup | ${solution.monthlyFee || 'TBD'} / Month.\n\n`;
    });

    const summarySlide = solutions.length + 4;
    prompt += `Slide ${summarySlide}: Summary of Impact & ROI\nProvide a clear breakdown of value vs. cost:\n`;
    prompt += `* Efficiency: Dramatic reduction in manual work and operational bottlenecks.\n`;
    prompt += `* Team Restructure: ${futureState.proposedTeamStructure || 'Optimized team structure.'}\n`;
    prompt += `* Total Investment Summary: ${totalSetupStr} Total Upfront Setup | ${totalMonthlyStr} / Month.\n`;
    if (closeDetails.bundleDiscountOffer) {
      prompt += `* Bundle Offer: ${closeDetails.bundleDiscountOffer}\n`;
    }
    prompt += '\n';

    const ctaSlide = summarySlide + 1;
    prompt += `Slide ${ctaSlide}: Next Steps\n`;
    prompt += `Call to Action: ${closeDetails.callToAction || 'Book Your Strategy Call'}\n`;
    if (closeDetails.bookingLink) prompt += `Booking Link: ${closeDetails.bookingLink}\n`;

    return prompt.trim();
  }

  private parseCurrency(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  }

  private buildCacheKey(input: ProposalGeneratorInput): string {
    const raw = JSON.stringify({
      c: input.clientDetails.companyName,
      n: input.clientDetails.clientName,
      s: input.solutions.map((s) => s.solutionName).join(','),
      t: input.clientDetails.presentationTone,
    });
    const hash = crypto.createHash('md5').update(raw).digest('hex');
    return `proposal_gamma:${hash}`;
  }
}