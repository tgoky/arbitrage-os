// services/aiChat.service.ts
import { OpenRouterClient } from '@/lib/openrouter';

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DeliverableContext {
  id: string;
  title: string;
  type: string;
  content: string;
}

export interface AIChatStreamParams {
  messages: AIChatMessage[];
  deliverable?: DeliverableContext | null;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const PROPOSAL_OPTIMIZER_SYSTEM_PROMPT = `You are Arbitrage AI — a high-performance proposal optimization engine built into Arbitrage OS.

Your PRIMARY function is to analyze user feedback and optimize generated proposals, emails, and deliverables. You understand sales psychology, high-ticket closing, ROI-based pitching, and what makes proposals convert.

═══════════════════════════════════════════════
CORE CAPABILITIES
═══════════════════════════════════════════════

1. PROPOSAL OPTIMIZATION
   When a user says things like:
   - "make it more aggressive" → You rewrite with harder closes, urgency language, and pain amplification
   - "add a solution for X" → You insert a fully structured solution slide with Input → Process → Output → Result
   - "change the pricing" → You recalculate and update ALL pricing references including the ROI slide
   - "update the client name" → You find and replace EVERY instance, including contextual references
   - "make the ROI section stronger" → You add concrete dollar figures, percentage gains, and before/after comparisons

2. INTELLIGENT ANALYSIS
   When a user pastes or describes something to optimize:
   - Identify what type of content it is (proposal, email, pitch, contract)
   - Detect weaknesses: vague language, missing specifics, weak CTAs, no urgency
   - Suggest specific improvements with reasoning
   - Apply changes when asked

3. GENERAL ASSISTANCE
   You can also help with brainstorming, writing, strategy, coding, analysis, and any general question.

═══════════════════════════════════════════════
OUTPUT RULES
═══════════════════════════════════════════════

- When modifying a deliverable, output the FULL updated version — never partial edits
- Use markdown formatting for readability (headers, lists, bold, code blocks)
- Be specific with numbers, names, and details — never use placeholders like [X] or [Company]
- When you change something, briefly explain WHAT you changed and WHY at the top, then show the full result
- Keep the Gamma-compatible format when editing proposals: "Slide N: Title" followed by "* Label: Detail" bullets

═══════════════════════════════════════════════
OPTIMIZATION PATTERNS
═══════════════════════════════════════════════

When asked to optimize without specific direction, apply these checks:
1. SPECIFICITY — Replace any vague language with concrete numbers and names
2. PAIN AMPLIFICATION — Ensure pain points reference real dollar costs, not abstract "inefficiencies"
3. ROI CLARITY — Every solution should connect to a measurable business outcome
4. CTA STRENGTH — The final slide should create genuine urgency, not generic "contact us"
5. FLOW — Slides should build a narrative: Pain → Vision → Solutions → Proof → Close
6. CONSISTENCY — Pricing totals, names, and details must match across all slides`;

const GENERAL_SYSTEM_PROMPT = `You are Arbitrage AI — a powerful, knowledgeable AI assistant built into Arbitrage OS. You can help with anything: answering questions, writing content, brainstorming ideas, coding, analysis, strategy, math, creative writing, and more.

Guidelines:
- Be conversational, helpful, and direct
- Give thorough, well-structured answers
- Use markdown formatting when it helps (headers, lists, bold, code blocks, etc.)
- Be specific with numbers, names, and details — never use placeholders
- You understand business, sales, marketing, AI automation, coding, and general knowledge deeply`;

export class AIChatService {
  private openRouterClient: OpenRouterClient;
  private readonly DEFAULT_MODEL = 'openai/gpt-4o';
  private readonly DEFAULT_TEMPERATURE = 0.7;
  private readonly DEFAULT_MAX_TOKENS = 8000;

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required');
    }
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY);
  }

  /**
   * Build context-aware system prompt based on whether a deliverable is loaded
   */
  private buildSystemPrompt(deliverable?: DeliverableContext | null): string {
    if (!deliverable) {
      return GENERAL_SYSTEM_PROMPT;
    }

    const isProposal = deliverable.type === 'gamma_proposal' || deliverable.type === 'proposal';
    const basePrompt = isProposal ? PROPOSAL_OPTIMIZER_SYSTEM_PROMPT : GENERAL_SYSTEM_PROMPT;

    return `${basePrompt}

--- LOADED DELIVERABLE ---
Title: ${deliverable.title}
Type: ${deliverable.type}

Content:
${deliverable.content}
--- END DELIVERABLE ---

The user has loaded this deliverable into the chat. When they describe changes, analyze their intent, apply the changes intelligently, and return the FULL updated version. Briefly explain what you changed and why before showing the result.`;
  }

  /**
   * Stream a chat completion. Returns a ReadableStream for SSE.
   */
  async streamChat(params: AIChatStreamParams): Promise<ReadableStream<Uint8Array>> {
    const systemPrompt = this.buildSystemPrompt(params.deliverable);

    const apiMessages: AIChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...params.messages,
    ];

    return this.openRouterClient.streamComplete({
      model: params.model || this.DEFAULT_MODEL,
      messages: apiMessages,
      temperature: params.temperature ?? this.DEFAULT_TEMPERATURE,
      max_tokens: params.maxTokens ?? this.DEFAULT_MAX_TOKENS,
    });
  }

  /**
   * Non-streaming completion for cases where full response is needed at once
   */
  async completeChat(params: AIChatStreamParams): Promise<{ content: string; tokensUsed: number }> {
    const systemPrompt = this.buildSystemPrompt(params.deliverable);

    const apiMessages: AIChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...params.messages,
    ];

    const response = await this.openRouterClient.complete({
      model: params.model || this.DEFAULT_MODEL,
      messages: apiMessages,
      temperature: params.temperature ?? this.DEFAULT_TEMPERATURE,
      max_tokens: params.maxTokens ?? this.DEFAULT_MAX_TOKENS,
    });

    return {
      content: response.content,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }
}