// services/proposalGenerator.service.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { Redis } from '@upstash/redis';
import type { ProposalGeneratorInput, ProposalGeneratorOutput } from '@/types/proposalGenerator';
import crypto from 'crypto';

export class ProposalGeneratorService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  private readonly AI_TIMEOUT = 90000;
  private readonly MAX_RETRIES = 2;
  private readonly CACHE_TTL = 86400;

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

    // Check cache
    const cacheKey = this.buildCacheKey(input);
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('✅ Cache hit');
        return JSON.parse(cached as string);
      }
    } catch (e) {
      console.warn('⚠️ Cache read error:', e);
    }

    // Generate with retry
    let gammaPrompt: string;
    let tokensUsed = 0;

    try {
      const result = await this.generateWithRetry(input);
      gammaPrompt = result.content;
      tokensUsed = result.tokensUsed;
    } catch {
      console.warn('⚠️ AI failed, using fallback');
      gammaPrompt = this.buildFallbackPrompt(input);
    }

    // Clean up any markdown artifacts before returning
    gammaPrompt = this.cleanupPrompt(gammaPrompt);

    const output: ProposalGeneratorOutput = {
      gammaPrompt,
      generatedAt: new Date().toISOString(),
      tokensUsed,
      processingTime: Date.now() - startTime,
      inputSnapshot: input,
    };

    // Cache
    try {
      await this.redis.set(cacheKey, JSON.stringify(output), { ex: this.CACHE_TTL });
    } catch (e) {
      console.warn('⚠️ Cache write error:', e);
    }

    return output;
  }

  private async generateWithRetry(input: ProposalGeneratorInput): Promise<{ content: string; tokensUsed: number }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.MAX_RETRIES}`);
        return await this.callAI(input);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Attempt ${attempt} failed:`, lastError.message);
        if (attempt < this.MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
    }

    throw lastError || new Error('AI generation failed');
  }

  private async callAI(input: ProposalGeneratorInput): Promise<{ content: string; tokensUsed: number }> {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    const response = await Promise.race([
      this.openRouterClient.complete({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 8000,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI generation timeout')), this.AI_TIMEOUT);
      }),
    ]);

    console.log('✅ AI response received, tokens:', response.usage?.total_tokens);

    if (!response.content || response.content.length < 200) {
      throw new Error('AI returned insufficient content');
    }

    return {
      content: response.content.trim(),
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  /**
   * Clean up markdown artifacts that cause display issues in Gamma
   */
  private cleanupPrompt(prompt: string): string {
    return prompt
      // Remove triple asterisks first (order matters)
      .replace(/\*\*\*/g, '')
      // Remove double asterisks
      .replace(/\*\*/g, '')
      // Normalize bullet points — single asterisk at line start is fine for Gamma
      .replace(/^\s*\*\s+/gm, '* ')
      .trim();
  }

  // ════════════════════════════════════════════════════════════════════
  // SYSTEM PROMPT — The brain of the Gamma prompt generation
  // ════════════════════════════════════════════════════════════════════

  private getSystemPrompt(): string {
    return `You are a world-class sales proposal strategist and closing consultant. You write Gamma.app presentation prompts that close high-ticket deals.

Your output is pasted DIRECTLY into Gamma.app's "Generate" field to produce a full presentation deck. It must be a single, continuous block of text — no JSON, no code blocks, no meta-commentary.

═══════════════════════════════════════════════
CRITICAL FORMAT RULES (NON-NEGOTIABLE)
═══════════════════════════════════════════════

1. OPENING LINE: Always start with this exact structure:
   - When a company name is provided: "Create a comprehensive proposal presentation for [Full Name], [Title] of [Company Name]. The tone should be [tone]. The goal is to pitch [goal]."
   - When no company (individual / personal pitch): "Create a comprehensive proposal presentation for [Full Name], [Title]. The tone should be [tone]. The goal is to pitch [goal]."
   Use whichever format matches the prospect data given to you. NEVER write "the company" or placeholder text.

2. SLIDE STRUCTURE: Write each slide as:
   "Slide N: [Descriptive Title]"
   Then a short sentence setting the context of the slide.
   Then bullet points, each on its own line starting with "* "

3. BULLET FORMAT — THIS IS THE MOST IMPORTANT RULE:
   Every bullet must follow this exact format:
   "* Bold Label: Specific, detailed content tied to THIS prospect's exact situation."
   
   Examples of GOOD bullets:
   "* The Main Bleed: Manual proposal generation is taking 45+ minutes per lead, and leads are going cold before numbers land in their inbox."
   "* Wasted Labor: You are paying a 3-person team to do slow manual admin busywork instead of closing $17k deals."
   "* Opportunity Cost: Every hour without automation is another warm lead handed to a competitor who responds in 5 minutes."
   
   Examples of BAD bullets (never write these):
   "* Improve efficiency" ← too vague, no label
   "* The team will work better" ← no specifics, no label
   "* Automate processes" ← meaningless filler

4. BULLET LABELS TO USE:
   Pain slides: "The Main Bleed:", "Wasted Labor:", "Opportunity Cost:", "The Hidden Cost:", "What This Is Costing You:"
   Solution slides: "The Problem It Solves:", "How It Works:", "Input:", "Process:", "Output:", "Result:", "Business Impact:", "Investment:"
   ROI slides: "Direct Savings:", "Efficiency Gain:", "Team Restructure:", "Total Investment:", "What You Get:"
   CTA slides: "Your Next Step:", "What Happens Next:", "The Offer:", "Why Now:"

5. SOLUTION SLIDES — MANDATORY STRUCTURE:
   Each solution gets its own slide. Structure MUST include:
   - The specific problem it solves (named after the prospect's actual pain)
   - Step-by-step workflow: "* Input: → * Process: → * Output: → * Result:"
   - The business impact for THIS company
   - Investment formatted as: "* Investment: $X One-Time Setup | $Y / Month"

6. ROI SUMMARY SLIDE — MANDATORY — THIS IS THE PENULTIMATE SLIDE:
   Title MUST be: "Summary of Impact & ROI"
   This slide MUST contain ALL of these labeled bullets, in this order:
   "* Efficiency: [Specific % reduction — e.g. 100% reduction in manual proposal creation. Instant speed-to-lead.]"
   "* Team Restructure: [Specific headcount/role change — e.g. Transition from a 3-person sales team to 1 rep + [Owner], reducing overhead while retaining maximum margins on a $17k average deal.]"
   "* Direct Savings: [Specific cost eliminated — e.g. Eliminates the need for a $50k+/year full-time CSM hire. The AI handles it for $750/month.]"
   "* Total Investment Summary: [Exact totals] Total Upfront Setup | [$X] / Month for AI Infrastructure."

   BAD (never write):
   "* Current Losses: Significant time wasted" ← vague, no numbers
   "* Projected Gains: Automation will help" ← meaningless

   GOOD (write this):
   "* Efficiency: 100% reduction in manual proposal creation time. Zero leads going cold due to slow turnaround."
   "* Team Restructure: Transition from a 3-person team to 1 rep + [Owner], retaining maximum margins on a $17k average deal."
   "* Direct Savings: Eliminates the need for a $50k+/year full-time CSM hire. AI handles it for $750/month."
   "* Total Investment Summary: $4,250 Total Upfront Setup | $1,750 / Month for AI Infrastructure."

7. FINAL CTA SLIDE — MANDATORY:
   Must have specific urgency. Not "contact us." Instead:
   "Every day without this system, [Company] loses [X]. Book the call. Move fast."

═══════════════════════════════════════════════
QUALITY STANDARDS
═══════════════════════════════════════════════

This prompt must read like it was written by a $50,000/year proposal consultant who spent hours on this specific prospect — not a template generator that swapped in a name.

SPECIFICITY RULES:
- Use the prospect's actual name in every 2-3 slides minimum
- Use the company name throughout — not "the company" or "your business"
- Reference their actual pain points with real numbers where available
- If they mentioned "19 employees watching Netflix" — say "19 idle employees burning $X in payroll"
- If they mentioned a $17k average deal size — anchor every ROI calculation to that number
- If they mentioned losing 40% of leads — calculate what 40% of leads costs them annually

LANGUAGE STANDARDS:
- Strong, declarative sentences. Not "may improve" — say "eliminates 100% of manual proposal time"
- Direct comparisons: "Instead of paying a $50k CSM salary, this AI handles it for $750/month"
- Real numbers over vague claims: "$2,340/month in recovered missed-call leads" beats "increased revenue"

SLIDE COUNT: 8-11 slides (Title + Pain + New Ecosystem + one per solution + ROI Summary + CTA). Never fewer than 8.

OUTPUT: Return ONLY the Gamma prompt text. Start immediately with "Create a comprehensive proposal presentation for..." — no preamble, no "Here is your prompt:", no code fences.`;
  }

  // ════════════════════════════════════════════════════════════════════
  // USER PROMPT — Feeds all the data to the AI
  // ════════════════════════════════════════════════════════════════════

  private buildUserPrompt(input: ProposalGeneratorInput): string {
    const { clientDetails, currentState, futureState, solutions, closeDetails } = input;

    const hasCompany = Boolean(clientDetails.companyName?.trim());
    const prospectRef = clientDetails.clientName || 'the prospect';
    const companyRef = clientDetails.companyName || '';
    const entityRef = companyRef || clientDetails.clientName || 'the prospect';

    let totalSetup = 0;
    let totalMonthly = 0;
    solutions.forEach((s) => {
      totalSetup += this.parseCurrency(s.setupFee);
      totalMonthly += this.parseCurrency(s.monthlyFee);
    });

    const totalSetupStr = totalSetup > 0 ? `$${totalSetup.toLocaleString()}` : 'Custom quote';
    const totalMonthlyStr = totalMonthly > 0 ? `$${totalMonthly.toLocaleString()}/mo` : 'Custom quote';
    const firstYearValue = totalSetup > 0 && totalMonthly > 0
      ? `$${(totalSetup + totalMonthly * 12).toLocaleString()}`
      : '';

    const openingLine = hasCompany
      ? `Create a comprehensive proposal presentation for ${prospectRef}, ${clientDetails.clientTitle || 'Owner'} of ${companyRef}.`
      : `Create a comprehensive proposal presentation for ${prospectRef}, ${clientDetails.clientTitle || 'Owner'}.`;

    let prompt = `Generate a high-converting Gamma.app proposal prompt for this prospect. Use ALL the data below — every detail is there to make this specific and compelling.

═══ WHO WE'RE PITCHING ═══
Prospect Name: ${prospectRef}
Title: ${clientDetails.clientTitle || 'Owner / Decision Maker'}
${hasCompany ? `Company: ${companyRef}` : 'Company: None — this is an individual / personal pitch. Do NOT use "the company" anywhere — use the client\'s name instead.'}
What We're Pitching: ${clientDetails.corePitchGoal || 'Custom AI & Automation Solutions'}
Tone: ${clientDetails.presentationTone || 'Professional, direct, ROI-focused'}

═══ WHAT'S BLEEDING THEM DRY ═══
Main Bottleneck: ${currentState.mainBottleneck || 'Manual processes consuming time and killing lead velocity'}
Team Inefficiencies: ${currentState.teamInefficiencies || 'Team doing low-value admin instead of revenue work'}
${currentState.opportunityCost ? `Opportunity Cost (use this for real dollar anchoring): ${currentState.opportunityCost}` : ''}

IMPORTANT: These pain points must appear in the proposal with BOLD LABELS and SPECIFIC NUMBERS. Don't summarize — dramatize. What is this costing ${entityRef} every single week? Extrapolate.

═══ WHERE WE'RE TAKING THEM ═══
New Operational Model: ${futureState.proposedTeamStructure || 'Lean, automation-first operation'}
${prospectRef}'s New Role: ${futureState.ownerExecutiveRole || 'Focus on high-value closing only — step away from daily grind'}

═══ THE SOLUTIONS (${solutions.length} total — each gets its own slide) ═══`;

    solutions.forEach((s, i) => {
      const setup = s.setupFee || 'TBD';
      const monthly = s.monthlyFee || 'TBD';
      prompt += `

Solution ${i + 1}: "${s.solutionName}"
  What it does: ${s.howItWorks || 'Automates the current manual process end-to-end'}
  ${s.keyBenefits ? `Key benefit for ${entityRef}: ${s.keyBenefits}` : ''}
  Investment: ${setup} One-Time Setup | ${monthly} / Month

  SLIDE INSTRUCTIONS for Solution ${i + 1}:
  - Open with the SPECIFIC problem this solves for ${prospectRef}${hasCompany ? ` at ${companyRef}` : ''}
  - Show the full workflow as: Input → Process → Output → Result (each as its own bullet with a label)
  - End with: "* Investment: ${setup} One-Time Setup | ${monthly} / Month"`;
    });

    prompt += `

═══ PRICING TOTALS (use these exact numbers in the ROI slide) ═══
Total Setup Investment: ${totalSetupStr}
Total Monthly Investment: ${totalMonthlyStr}
${firstYearValue ? `Year 1 Total Value: ${firstYearValue}` : ''}

ROI SUMMARY SLIDE INSTRUCTIONS (title MUST be "Summary of Impact & ROI"):
- REQUIRED bullet 1: "* Efficiency: [specific % reduction — e.g. 100% reduction in manual proposal creation time. Instant speed-to-lead.]"
- REQUIRED bullet 2: "* Team Restructure: [describe the before/after headcount or role change for ${entityRef}]"
- REQUIRED bullet 3: "* Direct Savings: [specific cost eliminated — e.g. Eliminates $50k/year CSM hire. AI handles it for $750/month.]"
- REQUIRED bullet 4: "* Total Investment Summary: ${totalSetupStr} Total Upfront Setup | ${totalMonthlyStr} / Month for AI Infrastructure."
${firstYearValue ? '- REQUIRED bullet 5: "* Year 1 Total Value: ' + firstYearValue + '"'  : ''}
- Anchor against what ${prospectRef} currently loses — if the problem costs more than the solution, say so with real numbers

═══ THE CLOSE ═══
${closeDetails.bundleDiscountOffer ? `Bundle / Discount Offer: ${closeDetails.bundleDiscountOffer}` : ''}
Call to Action: ${closeDetails.callToAction || 'Book Your Strategy Call'}
${closeDetails.bookingLink ? `Booking Link: ${closeDetails.bookingLink}` : ''}

CTA SLIDE INSTRUCTIONS:
- Create urgency tied to the bottleneck — not generic "contact us" language
- Reference ${prospectRef} by name
- Make the ask specific: what happens when they book the call?`;

    // If raw analysis data from Sales Call Analyzer is available
    if (input.rawAnalysisContext) {
      prompt += `

═══ SALES CALL INTELLIGENCE (GOLDMINE — USE ALL OF THIS) ═══
The following data was extracted from a real sales call with ${clientDetails.clientName || 'this prospect'}. This is the highest-quality data in this entire prompt. Pull direct quotes, specific numbers, their exact words about their problems, buying signals, and any detail that makes this proposal feel hand-built for them specifically.

${input.rawAnalysisContext}

INSTRUCTION: Cross-reference everything above against this call data. Where the call data has MORE specific information (exact dollar figures, exact problem descriptions, direct quotes), use the call data. The call data wins over generic descriptions every time.`;
    }

    prompt += `

═══ FINAL OUTPUT INSTRUCTIONS ═══
Start your output with: "${openingLine} The tone should be ${clientDetails.presentationTone || 'professional, direct, ROI-focused'}. The goal is to pitch ${clientDetails.corePitchGoal || 'Custom AI & Automation Solutions'}."

Rules:
- Use ${prospectRef}'s name throughout — in every 2-3 slides minimum${hasCompany ? `\n- Use ${companyRef} as the company name throughout — never write "the company" or "your business"` : '\n- There is NO company name for this pitch — never write "the company". Reference the prospect by name only.'}
- Every bullet must have a BOLD LABEL followed by a colon, then specific detail
- Each solution slide must show the full Input → Process → Output → Result workflow
- The ROI/Summary slide must use the exact totals: ${totalSetupStr} setup + ${totalMonthlyStr}/month
- The final slide must create urgency and have a specific CTA
- Write 8-11 slides: Title → Pain → New Ecosystem → one slide per solution → Summary of Impact & ROI → CTA. Never fewer than 8.
- DO NOT use ** for bold. Use the label format "* Label: detail" for all bullets
- Output ONLY the Gamma prompt — no preamble, no explanation, no code fences`;

    return prompt;
  }

  // ════════════════════════════════════════════════════════════════════
  // FALLBACK — deterministic prompt when AI is down
  // ════════════════════════════════════════════════════════════════════

  private buildFallbackPrompt(input: ProposalGeneratorInput): string {
    const { clientDetails, currentState, futureState, solutions, closeDetails } = input;

    let totalSetup = 0;
    let totalMonthly = 0;
    solutions.forEach((s) => {
      totalSetup += this.parseCurrency(s.setupFee);
      totalMonthly += this.parseCurrency(s.monthlyFee);
    });

    const name = clientDetails.clientName || 'the prospect';
    const title = clientDetails.clientTitle || 'Owner';
    const company = clientDetails.companyName?.trim() || '';
    const hasCompany = Boolean(company);
    const entityRef = company || name;
    const pitch = clientDetails.corePitchGoal || 'Custom AI Automation Solutions';
    const tone = clientDetails.presentationTone || 'professional, innovative, direct, and highly ROI-focused';
    const totalSetupStr = totalSetup > 0 ? `$${totalSetup.toLocaleString()}` : 'Custom';
    const totalMonthlyStr = totalMonthly > 0 ? `$${totalMonthly.toLocaleString()}` : 'Custom';

    const openingLine = hasCompany
      ? `Create a comprehensive proposal presentation for ${name}, ${title} of ${company}.`
      : `Create a comprehensive proposal presentation for ${name}, ${title}.`;

    let p = `${openingLine} The tone should be ${tone}. The goal is to pitch ${pitch}.\n`;

    p += `\nSlide 1: Title Card\nTitle: ${hasCompany ? `Scaling ${company} with` : `${name}'s Growth with`} ${pitch}\nSubtitle: Eliminating ${currentState.mainBottleneck ? currentState.mainBottleneck.split('.')[0].trim() : 'Operational Bottlenecks'}, Stopping Revenue Leakage, and Building a Lean Machine.\n`;

    p += `\nSlide 2: The Main Bottleneck\nHighlight the primary pain points facing ${entityRef}:\n`;
    p += `* The Main Bleed: ${currentState.mainBottleneck || `${entityRef} is losing time and money to manual, inefficient processes that should be automated.`}\n`;
    p += `* Wasted Labor: ${currentState.teamInefficiencies || `The current team structure is burning capital on low-value admin tasks instead of revenue-generating activities.`}\n`;
    if (currentState.opportunityCost) {
      p += `* Opportunity Cost: ${currentState.opportunityCost}\n`;
    } else {
      p += `* Opportunity Cost: Every day without a fix, ${entityRef} loses deals, momentum, and competitive advantage to faster-moving competitors.\n`;
    }

    p += `\nSlide 3: The New ${hasCompany ? `${company} ` : ''}Ecosystem\nVisualize the operational and financial transformation:\n`;
    p += `* Current State: ${currentState.teamInefficiencies || 'Manual processes, team inefficiencies, and missed opportunities draining the business.'}\n`;
    p += `* The Lean Model: ${futureState.proposedTeamStructure || 'A streamlined, automation-first operation that eliminates waste and scales without adding headcount.'}\n`;
    p += `* ${name}'s New Role: ${futureState.ownerExecutiveRole || `${name} steps away from the daily grind and focuses exclusively on high-value, high-margin closing activities.`}\n`;

    solutions.forEach((solution, index) => {
      const slideNum = index + 4;
      p += `\nSlide ${slideNum}: Solution ${index + 1} - ${solution.solutionName}\nDescribe the full workflow and investment for ${entityRef}:\n`;
      p += `* The Problem It Solves: ${solution.howItWorks ? `${solution.howItWorks.split('.')[0]}.` : `Eliminates the manual bottleneck identified in ${entityRef}'s current process.`}\n`;
      p += `* Input: Current manual data or trigger event enters the system.\n`;
      p += `* Process: ${solution.howItWorks || 'Automated workflow processes the input without human intervention.'}\n`;
      p += `* Output: ${solution.keyBenefits || 'Clean, automated result delivered instantly.'}\n`;
      p += `* Result: ${entityRef} gains speed, accuracy, and recovered capacity — without adding headcount.\n`;
      p += `* Investment: ${solution.setupFee || 'TBD'} One-Time Setup | ${solution.monthlyFee || 'TBD'} / Month.\n`;
    });

    const summarySlide = solutions.length + 4;
    const firstYearFallback = totalSetup > 0 && totalMonthly > 0 ? `\$${(totalSetup + totalMonthly * 12).toLocaleString()}` : '';
    p += `\nSlide ${summarySlide}: Summary of Impact & ROI\nProvide a clear breakdown of the full value vs. cost for ${name}${hasCompany ? ` and ${company}` : ''}:\n`;
    p += `* Efficiency: 100% reduction in manual admin work. Instant speed-to-lead — zero leads going cold due to slow turnaround.\n`;
    p += `* Team Restructure: ${futureState.proposedTeamStructure || `Streamlined, automation-first operation — ${entityRef} does more with less, freeing ${name} to focus exclusively on closing.`}\n`;
    p += `* Direct Savings: ${currentState.opportunityCost || `Eliminates the cost of manual inefficiencies, reducing overhead and recovering lost leads.`}\n`;
    p += `* Total Investment Summary: ${totalSetupStr} Total Upfront Setup | ${totalMonthlyStr} / Month for AI Infrastructure.\n`;
    if (firstYearFallback) {
      p += `* Year 1 Total Value: ${firstYearFallback}\n`;
    }
    if (closeDetails.bundleDiscountOffer) {
      p += `* Bundle Offer: ${closeDetails.bundleDiscountOffer}\n`;
    }

    p += `\nSlide ${summarySlide + 1}: Next Steps — ${name}, Let's Move\n`;
    p += `* Your Next Step: ${closeDetails.callToAction || 'Book Your Strategy Call'} — this is how we start the build.\n`;
    p += `* What Happens Next: We scope the project, confirm the timeline, and begin Phase 1 within 48 hours of agreement.\n`;
    p += `* Why Now: Every week without this system is another week of leads going cold, admin burning time, and revenue left on the table.\n`;
    if (closeDetails.bookingLink) {
      p += `* Booking Link: ${closeDetails.bookingLink}\n`;
    }

    return p.trim();
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
      p: input.currentState.mainBottleneck?.substring(0, 50),
      r: input.rawAnalysisContext ? 'y' : 'n',
    });
    return `proposal_gamma:${crypto.createHash('md5').update(raw).digest('hex')}`;
  }
}