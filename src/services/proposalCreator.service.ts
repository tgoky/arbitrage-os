// services/proposalCreator.service.ts - PRODUCTION-READY PART 1
import { Redis } from '@upstash/redis';
import { 
  ProposalInput, 
  GeneratedProposal,
  ProposalPackage,
  ProposalAnalysis,
  SavedProposal,
  AlternativeOption,
  RiskAssessment,
  CompetitiveAnalysis,
  ProposalType,
  IndustryType
} from '@/types/proposalCreator';
import { generateProposalCacheKey } from '../app/validators/proposalCreator.validator';
import { OpenRouterClient } from '@/lib/openrouter';

// Production-ready error classes
export class ProposalGenerationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ProposalGenerationError';
  }
}

export class ProposalValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ProposalValidationError';
  }
}

export class ProposalCreatorService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  private readonly CACHE_TTL = 7200; // 2 hours
  private readonly AI_TIMEOUT = 120000;// 2 minutes
  private readonly MAX_RETRIES = 2;
 
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
      token: process.env.UPSTASH_REDIS_TOKEN
    });
  }

async generateProposal(input: ProposalInput): Promise<ProposalPackage> {
  const startTime = Date.now();

  try {
    this.validateInput(input);

    const cachedResult = await this.getCachedProposal(input);
    if (cachedResult) {
      return cachedResult;
    }

    // Generate main proposal
    const proposal = await this.generateProposalWithRetry(input);
    
    // ALL AI-generated content - including analysis
    const [analysis, recommendations, alternatives, riskAssessment, competitiveAnalysis] = await Promise.all([
      this.generateAnalysisAI(input, proposal), // NEW AI method
      this.generateRecommendationsAI(input), // Remove analysis dependency
      proposal.alternativeOptions ? Promise.resolve(proposal.alternativeOptions) : this.generateAlternativeOptionsAI(input),
      this.generateRiskAssessmentAI(input), 
      this.generateCompetitiveAnalysisAI(input)
    ]);

    const proposalPackage: ProposalPackage = {
      proposal,
      analysis,
      recommendations,
      alternativeOptions: alternatives,
      riskAssessment,
      competitiveAnalysis,
      tokensUsed: (proposal.metadata?.tokensUsed || 0) + 4000, // 5 AI calls now
      generationTime: Date.now() - startTime,
      originalInput: input
    };

    this.cacheProposalAsync(input, proposalPackage);
    return proposalPackage;
    
  } catch (error) {
    console.error('Proposal generation failed:', error);
    
    if (error instanceof ProposalValidationError) {
      throw error;
    }
    
    throw new ProposalGenerationError(
      'Failed to generate proposal. Please check your input and try again.',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}


private async generateAnalysisAI(input: ProposalInput, proposal: GeneratedProposal): Promise<ProposalAnalysis> {
  try {
    const prompt = `Analyze this business proposal and provide strategic insights:

CLIENT: ${input.client.legalName} (${input.client.industry}, ${input.client.companySize})
PROJECT: "${input.project.description}"
VALUE: $${input.pricing.totalAmount.toLocaleString()}
TIMELINE: ${input.project.timeline || 'TBD'}

Analyze the win probability, pricing competitiveness, risk level, and strengths/weaknesses.

Return JSON:
{
  "winProbability": {
    "score": number (0-100),
    "factors": [{"factor": "string", "impact": "High|Medium|Low", "description": "string"}]
  },
  "pricingAnalysis": {
    "competitiveness": "low|competitive|premium",
    "valueJustification": "string",
    "recommendations": ["string1", "string2"]
  },
  "riskLevel": "low|medium|high",
  "strengthsWeaknesses": {
    "strengths": ["string1", "string2"],
    "weaknesses": ["string1", "string2"], 
    "improvements": ["string1", "string2"]
  }
}`;

    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a proposal analysis expert. Return only valid JSON with the specified structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 2000
    });

    return JSON.parse(response.content);
    
  } catch (error) {
    console.error('AI analysis generation failed:', error);
    throw new ProposalGenerationError(
      'Failed to generate proposal analysis. Please try again.',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

  
  private validateInput(input: ProposalInput): void {
    const errors: string[] = [];

    // Validate required fields
    if (!input.client?.legalName?.trim()) {
      errors.push('Client legal name is required');
    }
    if (!input.project?.description?.trim()) {
      errors.push('Project description is required');
    }
    if (!input.pricing?.totalAmount || input.pricing.totalAmount <= 0) {
      errors.push('Valid total amount is required');
    }
    if (!input.serviceProvider?.name?.trim()) {
      errors.push('Service provider name is required');
    }

    // Validate arrays exist and have proper structure
    if (!Array.isArray(input.project.deliverables)) {
      errors.push('Project deliverables must be an array');
    }
    if (!Array.isArray(input.project.objectives)) {
      errors.push('Project objectives must be an array');  
    }
    if (!Array.isArray(input.pricing.paymentSchedule)) {
      errors.push('Payment schedule must be an array');
    }

    // Validate enum values
    const validIndustries = ['technology', 'healthcare', 'finance', 'consulting', 'marketing', 'ecommerce', 'manufacturing', 'real-estate', 'education', 'other'];
    if (!validIndustries.includes(input.client.industry)) {
      errors.push(`Invalid industry: ${input.client.industry}`);
    }

    const validProposalTypes = ['service-agreement', 'project-proposal', 'retainer-agreement', 'consulting-proposal', 'custom-proposal'];
    if (!validProposalTypes.includes(input.proposalType)) {
      errors.push(`Invalid proposal type: ${input.proposalType}`);
    }

    if (errors.length > 0) {
      throw new ProposalValidationError('Input validation failed', { errors });
    }
  }

  // private async getCachedProposal(input: ProposalInput): Promise<ProposalPackage | null> {
  //   try {
  //     const cacheKey = generateProposalCacheKey(input);
  //     const cached = await this.redis.get(cacheKey);
      
  //     if (!cached) return null;

  //     // Handle both string and object responses from Redis
  //     let parsedCache: ProposalPackage;
  //     if (typeof cached === 'string') {
  //       parsedCache = JSON.parse(cached);
  //     } else if (typeof cached === 'object' && cached !== null) {
  //       parsedCache = cached as ProposalPackage;
  //     } else {
  //       console.warn('Invalid cache format, proceeding with fresh generation');
  //       return null;
  //     }

  //     // Validate cached structure
  //     if (this.validateProposalPackage(parsedCache)) {
  //       return parsedCache;
  //     } else {
  //       console.warn('Cached proposal structure invalid, proceeding with fresh generation');
  //       // Clean up invalid cache entry
  //       await this.redis.del(cacheKey).catch(() => {});
  //       return null;
  //     }
  //   } catch (error) {
  //     console.warn('Cache retrieval error, proceeding with fresh generation:', error);
  //     return null;
  //   }
  // }


  
  
  private async getCachedProposal(input: ProposalInput): Promise<ProposalPackage | null> {
  // Temporarily disable cache to force fresh generation
  return null;
}

  private validateProposalPackage(pkg: any): boolean {
    return !!(
      pkg &&
      typeof pkg === 'object' &&
      pkg.proposal &&
      pkg.analysis &&
      pkg.recommendations &&
      Array.isArray(pkg.recommendations) &&
      pkg.alternativeOptions &&
      Array.isArray(pkg.alternativeOptions) &&
      pkg.riskAssessment &&
      pkg.competitiveAnalysis &&
      typeof pkg.tokensUsed === 'number' &&
      typeof pkg.generationTime === 'number' &&
      pkg.originalInput
    );
  }

private async generateProposalWithRetry(input: ProposalInput): Promise<GeneratedProposal> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Generating proposal (attempt ${attempt}/${this.MAX_RETRIES})`);
      return await this.generateProposalFromAI(input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < this.MAX_RETRIES) {
        const delay = 2000 * attempt; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // TEMPORARILY THROW INSTEAD OF FALLBACK
  console.error('💥 ALL AI ATTEMPTS FAILED - THROWING ERROR INSTEAD OF FALLBACK');
  throw new Error(`AI generation failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  
  // Comment out fallback for debugging
  // console.warn('All AI generation attempts failed, using fallback generation');
  // return this.generateFallbackProposal(input);
}

 private async generateProposalFromAI(input: ProposalInput): Promise<GeneratedProposal> {
  console.log('🚀 Starting AI generation...');
  console.log('📝 Project description:', input.project.description);
  console.log('🏢 Client:', input.client.legalName);
  
  const prompt = this.buildProposalPrompt(input);
  console.log('📄 Prompt generated, length:', prompt.length);
  
  try {
    console.log('🤖 Making OpenRouter API call...');
    
    const response = await Promise.race([
      this.openRouterClient.complete({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(input.proposalType)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      max_tokens: 16000 
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI generation timeout')), this.AI_TIMEOUT);
      })
    ]);

    console.log('✅ AI response received, length:', response.content.length);
    console.log('🔍 First 500 chars:', response.content.substring(0, 500));
    
    const parsed = this.parseProposalResponse(response.content, input);
    
    // Add metadata about generation
    parsed.metadata = {
      tokensUsed: response.usage.total_tokens,
      model: 'openai/gpt-4o',
      generatedAt: new Date().toISOString()
    };

    console.log('✅ Proposal parsed successfully');
    return parsed;
    
  } catch (error) {
    console.error('❌ AI generation failed with error:', error);
    // console.error('❌ Error type:', error.constructor.name);
    // console.error('❌ Error message:', error.message);
    throw error;
  }
}


  private async cacheProposalAsync(input: ProposalInput, proposalPackage: ProposalPackage): Promise<void> {
    try {
      const cacheKey = generateProposalCacheKey(input);
      await this.redis.set(cacheKey, JSON.stringify(proposalPackage), { ex: this.CACHE_TTL });
    } catch (error) {
      console.warn('Failed to cache proposal (non-blocking):', error);
    }
  }

  private getSystemPrompt(proposalType: ProposalType): string {
    const basePrompt = `You are an expert business proposal writer with deep experience in creating compelling, professional proposals that win contracts. You understand legal frameworks, pricing psychology, and client decision-making processes. Always return valid JSON with all required fields.`;

    const typeSpecificPrompts: Record<ProposalType, string> = {
      'service-agreement': `${basePrompt} You specialize in service agreements that clearly define ongoing relationships, responsibilities, and deliverables. Focus on creating comprehensive service level agreements with clear performance metrics.`,
      'project-proposal': `${basePrompt} You specialize in project-based proposals that demonstrate clear value, defined scope, and measurable outcomes. Focus on compelling project narratives and detailed implementation plans.`,
      'retainer-agreement': `${basePrompt} You specialize in retainer agreements that establish ongoing advisory relationships. Focus on value justification for monthly fees and clear service boundaries.`,
      'consulting-proposal': `${basePrompt} You specialize in consulting proposals that position expertise and strategic thinking. Focus on problem diagnosis, methodology, and transformation outcomes.`,
      'custom-proposal': `${basePrompt} You adapt your writing style to match the specific requirements and context provided. Focus on customization and client-specific value propositions.`
    };

    return typeSpecificPrompts[proposalType];
  }

private buildProposalPrompt(input: ProposalInput): string {
    const formatCurrency = (amount: number, currency: string = 'USD') => {
      if (currency === 'USD') {
        return `$${amount.toLocaleString()}`;
      }
      return `${amount.toLocaleString()} ${currency}`;
    };

    const totalValue = input.pricing.totalAmount;
    const paymentSchedule = this.safeGeneratePaymentScheduleText(input.pricing, formatCurrency);

    return `
# PERSONALIZED PROPOSAL GENERATION BRIEF

## PERSONALIZATION MANDATE
Create a UNIQUE proposal that could ONLY be for ${input.client.legalName}. This is NOT a template - make it specific to their exact situation: "${input.project.description}"

Reference their specific project description throughout. Address ${input.client.industry}-specific challenges and regulations. Avoid generic phrases like "professional service delivery" or "quality assurance."

## CLIENT PROFILE
**Client:** ${this.getCleanValue(input.client.legalName)} (${input.client.entityType || 'Corporation'})
**Industry:** ${input.client.industry}
**Company Size:** ${input.client.companySize}
**Specific Project Need:** ${input.project.description}
**Decision Maker:** ${this.getCleanValue(input.client.decisionMaker, 'TBD')}

## SERVICE PROVIDER
**Provider:** ${this.getCleanValue(input.serviceProvider.name, 'Service Provider')}
**Specializations:** ${this.safeJoinArray(input.serviceProvider.specializations, 'Professional Services')}
**Credentials:** ${this.safeJoinArray(input.serviceProvider.credentials, 'Professional Credentials')}

## PROJECT SCOPE - CUSTOMIZE THIS SECTION
**Description:** ${input.project.description}
**Objectives:** ${this.safeGenerateObjectivesList(input.project.objectives)}
**Timeline:** ${this.getCleanValue(input.project.timeline, '8-12 weeks')}
**Deliverables:** ${this.safeGenerateDeliverablesText(input.project.deliverables, formatCurrency)}

## PRICING STRUCTURE
**Model:** ${input.pricing.model}
**Total Value:** ${formatCurrency(totalValue, input.pricing.currency)}
**Payment Schedule:** ${paymentSchedule}

## CONTRACT TERMS
**Proposal Validity:** ${input.terms.proposalValidityDays} days
**Contract Length:** ${input.terms.contractLength}
**IP Ownership:** ${input.terms.intellectualProperty}
**Governing Law:** ${this.getCleanValue(input.terms.governingLaw, 'Delaware')}

## SPECIFIC REQUIREMENTS FOR THIS PROPOSAL

1. **Industry Context**: Address specific ${input.client.industry} industry challenges, regulations, and best practices
2. **Project Integration**: Weave "${input.project.description}" throughout all sections - don't just mention it once
3. **Client-Specific Value**: Explain why THIS solution fits ${input.client.legalName}'s specific needs
4. **Unique Deliverables**: Create deliverables that directly serve "${input.project.description}" - not generic ones
5. **Personalized Risks**: Identify risks specific to ${input.client.industry} and this project type
6. **Custom Timeline**: Reference actual project phases that make sense for "${input.project.description}"

## ALTERNATIVE OPTIONS REQUIREMENT
Create 3 alternative approaches specifically for ${input.client.legalName}'s "${input.project.description}" project:

1. **Essential Package**: Streamlined version focusing on core aspects of "${input.project.description}" with reduced scope but faster delivery
2. **Premium Package**: Enhanced version with additional ${input.client.industry}-specific optimization and extended support
3. **Phased Approach**: Break "${input.project.description}" into strategic phases with validation checkpoints

Make each alternative specific to their project - not generic templates. Include realistic pricing adjustments, timeline changes, and specific scope modifications that make sense for "${input.project.description}".

## OUTPUT REQUIREMENTS
Return a valid JSON object with this exact structure:
{
  "executiveSummary": "string (optional, only if requested)",
  "projectOverview": "string (required - make this unique to ${input.client.legalName}'s situation)",
  "scopeOfWork": "string (required - directly address '${input.project.description}')", 
  "pricing": "string (required)",
  "timeline": "string (required)",
  "deliverables": "string (required - custom to this project)",
  "terms": "string (required)",
  "nextSteps": "string (required)",
  "alternativeOptions": [
    {
      "title": "string (specific to ${input.client.legalName})",
      "description": "string (specific to '${input.project.description}')",
      "pricingAdjustment": number (between -0.5 and 0.5),
      "timelineAdjustment": "string (specific timeline changes)",
      "scopeChanges": ["array of specific scope modifications for this project"],
      "pros": ["array of specific advantages for ${input.client.legalName}"],
      "cons": ["array of specific disadvantages or limitations"]
    }
  ],
  "contractTemplates": {
    "serviceAgreement": "string (required - full legal template)",
    "statementOfWork": "string (required - full SOW template)"
  }
}

CRITICAL: Make this proposal so specific to ${input.client.legalName} and "${input.project.description}" that it couldn't be used for any other client. Use their exact project description as the foundation for all content. The alternative options must be equally specific - not generic packages with client names swapped in.
`;
  }



  

  // Safe helper methods for handling arrays and undefined values
  private safeJoinArray(arr: string[] | undefined, fallback: string): string {
    if (!Array.isArray(arr) || arr.length === 0) return fallback;
    const filtered = arr.filter(item => item && !this.isPlaceholder(item));
    return filtered.length > 0 ? filtered.join(', ') : fallback;
  }

  private safeGenerateObjectivesList(objectives: string[] | undefined): string {
    if (!Array.isArray(objectives) || objectives.length === 0) {
      return '• Deliver high-quality professional solution';
    }
    
    const filtered = objectives.filter(obj => obj && !this.isPlaceholder(obj));
    if (filtered.length === 0) {
      return '• Deliver high-quality professional solution';
    }
    
    return filtered.map(obj => `• ${obj}`).join('\n');
  }

  private safeGenerateDeliverablesText(deliverables: any[] | undefined, formatCurrency: (amount: number) => string): string {
    if (!Array.isArray(deliverables) || deliverables.length === 0) {
      return '• Professional Project Deliverable: Comprehensive solution delivery (Document, qty: 1)';
    }

    try {
      const validDeliverables = deliverables.filter(del => 
        del && 
        del.name && 
        del.description && 
        !this.isPlaceholder(del.name)
      );

      if (validDeliverables.length === 0) {
        return '• Professional Project Deliverable: Comprehensive solution delivery (Document, qty: 1)';
      }

      return validDeliverables.map(del => 
        `• ${this.getCleanValue(del.name, 'Project Deliverable')}: ${this.getCleanValue(del.description, 'Professional deliverable')} (${del.format || 'Document'}, qty: ${del.quantity || 1})`
      ).join('\n');
    } catch (error) {
      console.warn('Error generating deliverables text:', error);
      return '• Professional Project Deliverable: Comprehensive solution delivery (Document, qty: 1)';
    }
  }

  private safeGenerateMilestonesText(milestones: any[] | undefined): string {
    if (!Array.isArray(milestones) || milestones.length === 0) {
      return '• Project Kickoff: Initial setup and planning (Due: Week 1)\n• Project Completion: Final delivery and approval (Due: Final week)';
    }

    try {
      const validMilestones = milestones.filter(m => 
        m && 
        m.name && 
        m.description && 
        !this.isPlaceholder(m.name)
      );

      if (validMilestones.length === 0) {
        return '• Project Kickoff: Initial setup and planning (Due: Week 1)\n• Project Completion: Final delivery and approval (Due: Final week)';
      }

      return validMilestones.map(milestone => 
        `• ${this.getCleanValue(milestone.name, 'Project Milestone')}: ${this.getCleanValue(milestone.description, 'Milestone completion')} (Due: ${this.getCleanValue(milestone.dueDate, 'TBD')})`
      ).join('\n');
    } catch (error) {
      console.warn('Error generating milestones text:', error);
      return '• Project Kickoff: Initial setup and planning (Due: Week 1)\n• Project Completion: Final delivery and approval (Due: Final week)';
    }
  }

  private safeGenerateListItems(items: string[] | undefined, defaultItems: string[]): string {
    if (!Array.isArray(items) || items.length === 0) {
      return defaultItems.map(item => `• ${item}`).join('\n');
    }

    const filtered = items.filter(item => item && !this.isPlaceholder(item));
    if (filtered.length === 0) {
      return defaultItems.map(item => `• ${item}`).join('\n');
    }

    return filtered.map(item => `• ${item}`).join('\n');
  }

  private safeGeneratePaymentScheduleText(pricing: any, formatCurrency: (amount: number) => string): string {
    if (!Array.isArray(pricing.paymentSchedule) || pricing.paymentSchedule.length === 0) {
      const upfront = Math.round(pricing.totalAmount * 0.5);
      const final = pricing.totalAmount - upfront;
      return `50% Upfront: ${formatCurrency(upfront)} due Upon signing\n50% Final: ${formatCurrency(final)} due Upon completion`;
    }

    try {
      const validPayments = pricing.paymentSchedule.filter((p: any) => 
        p && 
        p.description && 
        typeof p.amount === 'number' && 
        !this.isPlaceholder(p.description)
      );

      if (validPayments.length === 0) {
        const upfront = Math.round(pricing.totalAmount * 0.5);
        const final = pricing.totalAmount - upfront;
        return `50% Upfront: ${formatCurrency(upfront)} due Upon signing\n50% Final: ${formatCurrency(final)} due Upon completion`;
      }

      return validPayments.map((p: any) => 
        `${this.getCleanValue(p.description, 'Payment')}: ${formatCurrency(p.amount)} due ${this.getCleanValue(p.dueDate, 'TBD')}`
      ).join('\n');
    } catch (error) {
      console.warn('Error generating payment schedule text:', error);
      const upfront = Math.round(pricing.totalAmount * 0.5);
      const final = pricing.totalAmount - upfront;
      return `50% Upfront: ${formatCurrency(upfront)} due Upon signing\n50% Final: ${formatCurrency(final)} due Upon completion`;
    }
  }

  private safeGeneratePricingBreakdown(pricing: any, formatCurrency: (amount: number) => string): string {
    if (!Array.isArray(pricing.breakdown) || pricing.breakdown.length === 0) {
      return `• Professional Services: Complete project delivery as specified (1 × ${formatCurrency(pricing.totalAmount)} = ${formatCurrency(pricing.totalAmount)})`;
    }

    try {
      const validBreakdown = pricing.breakdown.filter((item: any) => 
        item && 
        item.item && 
        typeof item.amount === 'number' && 
        !this.isPlaceholder(item.item)
      );

      if (validBreakdown.length === 0) {
        return `• Professional Services: Complete project delivery as specified (1 × ${formatCurrency(pricing.totalAmount)} = ${formatCurrency(pricing.totalAmount)})`;
      }

      return validBreakdown.map((item: any) => 
        `• ${this.getCleanValue(item.item, 'Professional Services')}: ${this.getCleanValue(item.description, 'Complete project delivery')} (${item.quantity || 1} × ${formatCurrency(item.rate || item.amount)} = ${formatCurrency(item.amount)})`
      ).join('\n');
    } catch (error) {
      console.warn('Error generating pricing breakdown:', error);
      return `• Professional Services: Complete project delivery as specified (1 × ${formatCurrency(pricing.totalAmount)} = ${formatCurrency(pricing.totalAmount)})`;
    }
  }

  private isPlaceholder(value: string): boolean {
    if (!value || typeof value !== 'string') return true;
    return value.includes('[') && value.includes(']');
  }

  private getCleanValue(value: string | undefined, fallback: string = 'TBD'): string {
    if (!value || typeof value !== 'string') return fallback;
    return this.isPlaceholder(value) ? fallback : value.trim();
  }

private parseProposalResponse(content: string, input: ProposalInput): GeneratedProposal {
  console.log('🔧 Parsing AI response...');
  
  try {
    let jsonString = '';
    
    const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      jsonString = jsonBlockMatch[1];
      console.log('📦 Found JSON in code block');
    } else {
      const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonString = jsonObjectMatch[0];
        console.log('📦 Found raw JSON object');
      } else {
        console.log('❌ No JSON found in AI response');
        throw new Error('No JSON found in AI response');
      }
    }
    
    console.log('🔍 JSON string length:', jsonString.length);
    
    // Check if JSON appears truncated (ends abruptly)
    if (!jsonString.trim().endsWith('}')) {
      console.log('⚠️ JSON appears truncated, attempting to fix...');
      jsonString = this.attemptJSONRepair(jsonString);
    }
    
    const cleanedJson = jsonString
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');
    
    const parsed = JSON.parse(cleanedJson);
    
    // If structure is incomplete, use partial parsing
    if (!this.validateProposalStructure(parsed)) {
      console.log('⚠️ Structure incomplete, using partial AI content with fallback completion');
      return this.completePartialProposal(parsed, input);
    }
    
    return parsed;
    
  } catch (error) {
    console.error('❌ JSON parsing failed:', error);
    throw error;
  }
}

private attemptJSONRepair(truncatedJson: string): string {
  // Basic repair for truncated JSON
  let repaired = truncatedJson.trim();
  
  // Count open braces vs close braces
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  
  // Add missing closing braces
  const missingBraces = openBraces - closeBraces;
  for (let i = 0; i < missingBraces; i++) {
    repaired += '}';
  }
  
  return repaired;
}

private completePartialProposal(partialAI: any, input: ProposalInput): GeneratedProposal {
  // Use AI content where available, fallback for missing parts
  const fallback = this.generateMinimalProposal(input);
  
  return {
    projectOverview: partialAI.projectOverview || fallback.projectOverview,
    scopeOfWork: partialAI.scopeOfWork || fallback.scopeOfWork,
    pricing: partialAI.pricing || fallback.pricing,
    timeline: partialAI.timeline || fallback.timeline,
    deliverables: partialAI.deliverables || fallback.deliverables,
    terms: partialAI.terms || fallback.terms,
    nextSteps: partialAI.nextSteps || fallback.nextSteps,
    contractTemplates: partialAI.contractTemplates || fallback.contractTemplates,
    ...(partialAI.executiveSummary && { executiveSummary: partialAI.executiveSummary }),
    metadata: {
      generatedAt: new Date().toISOString(),
      partialGeneration: true,
      proposalType: input.proposalType
    }
  };
}

private validateProposalStructure(proposal: any): boolean {
    const required = [
      'projectOverview',
      'scopeOfWork', 
      'pricing',
      'timeline',
      'deliverables',
      'terms',
      'nextSteps',
      'contractTemplates',
      'alternativeOptions' // Add this
    ];

    if (!proposal || typeof proposal !== 'object') return false;

    for (const field of required) {
      if (!proposal[field]) {
        console.warn(`Missing field: ${field}`);
        return false;
      }
    }

    // Validate alternative options structure
    if (!Array.isArray(proposal.alternativeOptions) || proposal.alternativeOptions.length === 0) {
      console.warn('Alternative options must be an array with at least one option');
      return false;
    }

    // Validate contract templates structure
    if (!proposal.contractTemplates || 
        typeof proposal.contractTemplates !== 'object' ||
        !proposal.contractTemplates.serviceAgreement ||
        !proposal.contractTemplates.statementOfWork) {
      console.warn('Invalid contract templates structure');
      return false;
    }

    return true;
  }

  // services/proposalCreator.service.ts - PRODUCTION-READY PART 2
// Fallback Generation & Analysis Methods

private generateFallbackProposal(input: ProposalInput): GeneratedProposal {
  try {
    console.log('Generating fallback proposal for type:', input.proposalType);
    
    // Generate base content that's common to all types
    const baseContent = this.generateBaseContent(input);
    
    // Generate type-specific content with error handling
    const typeSpecificContent = this.generateTypeSpecificContent(input);
    
    // Ensure all required fields are present with string values
    const proposal: GeneratedProposal = {
      projectOverview: typeSpecificContent.projectOverview || baseContent.projectOverview || 'Professional services engagement as specified in project requirements',
      scopeOfWork: typeSpecificContent.scopeOfWork || 'Professional services will be delivered according to agreed specifications and quality standards',
      pricing: typeSpecificContent.pricing || `Total investment: $${input.pricing.totalAmount.toLocaleString()}. Payment terms to be finalized upon agreement execution.`,
      timeline: baseContent.timeline || input.project.timeline || '8-12 weeks estimated delivery timeframe',
      deliverables: baseContent.deliverables || 'Professional deliverables as specified in project scope and requirements',
      terms: baseContent.terms || `Standard professional terms apply. Contract length: ${input.terms.contractLength}`,
      nextSteps: baseContent.nextSteps || 'Next steps: 1) Review proposal, 2) Execute agreement, 3) Begin engagement',
      contractTemplates: typeSpecificContent.contractTemplates || {
        serviceAgreement: this.generateMinimalServiceAgreement(input),
        statementOfWork: this.generateMinimalSOW(input)
      },
      // Optional fields
      ...(baseContent.executiveSummary && { executiveSummary: baseContent.executiveSummary }),
      metadata: {
        generatedAt: new Date().toISOString(),
        fallbackGeneration: true,
        proposalType: input.proposalType
      }
    };
    
    return proposal;
  } catch (error) {
    console.error('Fallback proposal generation failed:', error);
    return this.generateMinimalProposal(input);
  }
}


private generateMinimalProposal(input: ProposalInput): GeneratedProposal {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  
  return {
    projectOverview: `${input.client.legalName} requires professional ${input.client.industry} services. ${input.serviceProvider.name || 'Our team'} will deliver ${input.project.description} with professional excellence and industry expertise.`,
    
    scopeOfWork: `Professional services will include:\n• ${input.project.description}\n• Regular progress updates and communication\n• Quality assurance throughout the engagement\n• Final delivery and documentation`,
    
    pricing: `Total Investment: ${formatCurrency(input.pricing.totalAmount)} ${input.pricing.currency}\nPricing Model: ${input.pricing.model}\nPayment terms will be established upon agreement execution.`,
    
    timeline: `Estimated timeline: ${input.project.timeline || '8-12 weeks'}\nDetailed milestones will be established during project initiation.`,
    
    deliverables: `Professional deliverables as specified in project scope, delivered according to agreed timeline and quality standards.`,
    
    terms: `This proposal is valid for ${input.terms.proposalValidityDays} days. Services will be governed by professional standards and ${input.terms.governingLaw || 'applicable'} law.`,
    
    nextSteps: `To proceed:\n1. Review and approve this proposal\n2. Execute service agreement\n3. Schedule project kickoff\n4. Begin service delivery`,
    
    contractTemplates: {
      serviceAgreement: this.generateMinimalServiceAgreement(input),
      statementOfWork: this.generateMinimalSOW(input)
    },
    
    metadata: {
      generatedAt: new Date().toISOString(),
      minimalGeneration: true,
      proposalType: input.proposalType
    }
  };
}

private generateBaseContent(input: ProposalInput): Partial<GeneratedProposal> {
  return {
    executiveSummary: input.customizations.includeExecutiveSummary ? 
      this.generateExecutiveSummary(input) : undefined,
    timeline: this.generateTimeline(input),
    deliverables: this.generateDeliverables(input),
    terms: this.generateTerms(input),
    nextSteps: this.generateNextSteps(input)
  };
}

private generateTypeSpecificContent(input: ProposalInput): Partial<GeneratedProposal> {
  const generators: Record<ProposalType, () => Partial<GeneratedProposal>> = {
    'retainer-agreement': () => ({
      projectOverview: this.generateRetainerOverview(input),
      scopeOfWork: this.generateRetainerScope(input),
      pricing: this.generateRetainerPricing(input),
      contractTemplates: {
        serviceAgreement: this.generateRetainerAgreement(input),
        statementOfWork: this.generateRetainerSOW(input)
      }
    }),
    'consulting-proposal': () => ({
      projectOverview: this.generateConsultingOverview(input),
      scopeOfWork: this.generateConsultingScope(input),
      pricing: this.generateConsultingPricing(input),
      contractTemplates: {
        serviceAgreement: this.generateConsultingAgreement(input),
        statementOfWork: this.generateConsultingSOW(input)
      }
    }),
    'project-proposal': () => ({
      projectOverview: this.generateProjectOverview(input),
      scopeOfWork: this.generateProjectScope(input),
      pricing: this.generateProjectPricing(input),
      contractTemplates: {
        serviceAgreement: this.generateProjectAgreement(input),
        statementOfWork: this.generateProjectSOW(input)
      }
    }),
    'custom-proposal': () => ({
      projectOverview: this.generateCustomOverview(input),
      scopeOfWork: this.generateCustomScope(input),
      pricing: this.generateCustomPricing(input),
      contractTemplates: {
        serviceAgreement: this.generateCustomAgreement(input),
        statementOfWork: this.generateCustomSOW(input)
      }
    }),
    'service-agreement': () => ({
      projectOverview: this.generateServiceOverview(input),
      scopeOfWork: this.generateServiceScope(input),
      pricing: this.generateServicePricing(input),
      contractTemplates: {
        serviceAgreement: this.generateStandardServiceAgreement(input),
        statementOfWork: this.generateStandardSOW(input)
      }
    })
  };

  try {
    const generator = generators[input.proposalType];
    return generator ? generator() : generators['service-agreement']();
  } catch (error) {
    console.error(`Error generating ${input.proposalType} content:`, error);
    return generators['service-agreement']();
  }
}


// Missing Methods for ProposalCreatorService
// Add these methods to your service class

// ===== SERVICE AGREEMENT GENERATORS =====
private generateServiceScope(input: ProposalInput): string {
  try {
    const deliverables = this.safeFilterArray(input.project.deliverables);
    const objectives = this.safeFilterArray(input.project.objectives);

    const deliverablesText = deliverables.length > 0 
      ? deliverables.map(del => `• ${del.name}: ${del.description}`).join('\n')
      : '• Professional service delivery as specified in project description\n• Quality assurance and ongoing support\n• Regular progress updates and reporting';

    const objectivesText = objectives.length > 0
      ? objectives.map(obj => `• ${obj}`).join('\n')
      : '• Deliver high-quality professional solution\n• Meet all specified requirements and standards\n• Ensure client satisfaction and value delivery';

    return `PROFESSIONAL SERVICES SCOPE:

Core Services:
${deliverablesText}

Service Objectives:
${objectivesText}

Service Standards:
• Professional performance consistent with industry standards
• Regular communication and progress reporting
• Quality assurance throughout engagement
• Timely delivery according to agreed schedule

Ongoing Support:
• Regular status updates and progress communication
• Issue resolution and problem-solving support
• Documentation and knowledge transfer as needed

This comprehensive scope ensures all client requirements are met with professional excellence.`;
  } catch (error) {
    console.error('Error generating service scope:', error);
    return `Professional services scope: ${input.project.description}. Delivered with quality assurance and regular progress reporting.`;
  }
}

private generateServicePricing(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    
    return `Total Service Investment: ${formatCurrency(input.pricing.totalAmount)} ${input.pricing.currency}

Pricing Model: ${input.pricing.model}

${input.pricing.paymentSchedule.length > 0 ? 
  `Payment Schedule:\n${input.pricing.paymentSchedule.map(payment => 
    `• ${payment.description}: ${formatCurrency(payment.amount)} due ${payment.dueDate || 'as scheduled'}`
  ).join('\n')}` :
  `Payment Terms:\n• 50% upon service agreement execution: ${formatCurrency(Math.round(input.pricing.totalAmount * 0.5))}\n• 50% upon service completion: ${formatCurrency(input.pricing.totalAmount - Math.round(input.pricing.totalAmount * 0.5))}`
}

Value Proposition:
• Professional service delivery with proven methodologies
• Dedicated team with relevant expertise and experience
• Quality assurance and performance monitoring throughout engagement
• Comprehensive documentation and knowledge transfer

Additional Terms:
• Expenses policy: ${input.pricing.expensePolicy || 'Pre-approved expenses reimbursed with receipts'}
• Late payment fee: ${input.pricing.lateFeePercentage}% per month
• Service level commitments and performance standards included

This pricing structure provides value certainty while ensuring quality service delivery.`;
  } catch (error) {
    console.error('Error generating service pricing:', error);
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    return `Total service investment: ${formatCurrency(input.pricing.totalAmount)}. Professional service delivery with quality assurance.`;
  }
}

private generateStandardSOW(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    
    return `STATEMENT OF WORK

Service Description: ${input.project.description}

DELIVERABLES:
${input.project.deliverables.length > 0 ? 
  input.project.deliverables.map(del => 
    `• ${del.name}: ${del.description} (Format: ${del.format || 'As specified'})`
  ).join('\n') :
  '• Professional services as specified in project description\n• Supporting documentation and materials\n• Regular progress reporting and communication'
}

SERVICE TIMELINE: ${input.project.timeline || '[SERVICE_TIMELINE]'}

MILESTONES:
${input.project.milestones.length > 0 ?
  input.project.milestones.map(m => `• ${m.name}: ${m.description} (Due: ${m.dueDate || 'TBD'})`).join('\n') :
  '• Service initiation and baseline establishment\n• Mid-engagement progress review and optimization\n• Service completion and performance evaluation'
}

TOTAL INVESTMENT: ${formatCurrency(input.pricing.totalAmount)} ${input.pricing.currency}

PAYMENT TERMS:
${this.generateContractPaymentTerms(input.pricing)}

ACCEPTANCE CRITERIA:
${input.project.deliverables.length > 0 && input.project.deliverables[0]?.acceptanceCriteria?.length > 0 ? 
  input.project.deliverables[0].acceptanceCriteria.map(criteria => `• ${criteria}`).join('\n') :
  '• Client approval of all deliverables\n• Completion within specified timeline\n• Quality standards met per professional requirements'
}

SERVICE EXCLUSIONS:
${input.project.exclusions.length > 0 ?
  input.project.exclusions.map(exc => `• ${exc}`).join('\n') :
  '• Third-party services and materials not specified\n• Ongoing support beyond defined scope\n• Services requiring specialized licenses or certifications not held'
}

This Statement of Work defines the complete scope and expectations for successful service delivery.`;
  } catch (error) {
    console.error('Error generating standard SOW:', error);
    return this.generateMinimalSOW(input);
  }
}

// ===== CUSTOM PROPOSAL GENERATORS =====
private generateCustomOverview(input: ProposalInput): string {
  try {
    const serviceProvider = input.serviceProvider.name || 'Our team';
    
    return `${input.client.legalName} has unique ${input.client.industry} requirements that demand a customized approach. ${serviceProvider} has developed this tailored proposal specifically to address these needs: ${input.project.description}. Our flexible engagement model combines deep industry expertise with adaptive project management to deliver optimal outcomes for your specific situation.

This customized approach recognizes that standard solutions may not address your unique challenges and opportunities. We've designed a flexible framework that can evolve with your needs while maintaining clear accountability and measurable outcomes. Our methodology balances proven best practices with innovative approaches tailored to your specific business context and objectives.`;
  } catch (error) {
    console.error('Error generating custom overview:', error);
    return `Customized professional engagement for ${input.client.legalName} with tailored approach to meet specific ${input.client.industry} requirements.`;
  }
}

private generateCustomScope(input: ProposalInput): string {
  try {
    const objectives = this.safeFilterArray(input.project.objectives);
    const deliverables = this.safeFilterArray(input.project.deliverables);

    return `CUSTOMIZED ENGAGEMENT SCOPE:

Tailored Service Delivery:
${input.project.description}

Custom Objectives:
${objectives.length > 0 ?
  objectives.map(obj => `• ${obj}`).join('\n') :
  '• Objectives customized to specific client requirements and business context\n• Flexible goal-setting that evolves with project needs\n• Continuous alignment with changing business priorities'
}

Custom Deliverables:
${deliverables.length > 0 ?
  deliverables.map(del => `• ${del.name}: ${del.description} (${del.format || 'Custom format'})`).join('\n') :
  '• Deliverables customized to client specifications and requirements\n• Format and timeline adapted to specific business needs\n• Quality standards aligned with industry and client expectations'
}

Adaptive Methodology:
• Flexible approach that adapts to changing requirements
• Regular checkpoint reviews to ensure alignment
• Customizable milestone structure based on business priorities
• Iterative refinement based on feedback and results

Service Flexibility:
• Scope adjustments accommodated through change management process
• Resource allocation adaptable to project evolution
• Timeline modifications based on priority changes
• Custom reporting and communication protocols

This customized approach ensures maximum value delivery while maintaining the flexibility needed for complex, evolving business requirements.`;
  } catch (error) {
    console.error('Error generating custom scope:', error);
    return `Customized engagement scope: ${input.project.description}. Flexible approach adapted to specific client requirements.`;
  }
}

private generateCustomPricing(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    
    return `Customized Investment Structure: ${formatCurrency(input.pricing.totalAmount)}

Flexible Payment Approach:
${input.pricing.paymentSchedule.length > 0 ?
  input.pricing.paymentSchedule.map(p => 
    `• ${p.description}: ${formatCurrency(p.amount)} due ${p.dueDate || 'as agreed'}`
  ).join('\n') :
  '• Payment terms customized to project requirements and business needs\n• Flexible milestone-based or time-based payment options available\n• Structured to align with project deliverables and business cash flow'
}

Pricing Model: ${input.pricing.model} - specifically tailored to this engagement's requirements

Custom Value Framework:
• Pricing structure adapted to unique project characteristics
• Flexible adjustment mechanisms for scope evolution
• Value-based components tied to business outcomes
• Risk-sharing arrangements where appropriate

Payment Flexibility Options:
• Standard payment schedule as outlined above
• Accelerated payment discounts available
• Extended payment terms for qualified clients
• Performance-based payment adjustments

Additional Considerations:
• Custom expense handling: ${input.pricing.expensePolicy || 'Tailored expense policy'}
• Flexible late payment terms: ${input.pricing.lateFeePercentage}% monthly or as negotiated
• Currency and international payment options available

This flexible pricing structure accommodates the unique nature of this customized engagement while ensuring fair value exchange for both parties.`;
  } catch (error) {
    console.error('Error generating custom pricing:', error);
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    return `Customized investment: ${formatCurrency(input.pricing.totalAmount)}. Flexible payment structure adapted to engagement requirements.`;
  }
}

private generateCustomAgreement(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    const serviceProviderName = this.getCleanValue(input.serviceProvider.legalName, '[CUSTOM_SERVICE_PROVIDER]');
    const clientName = this.getCleanValue(input.client.legalName);
    
    return `CUSTOM PROFESSIONAL SERVICES AGREEMENT

This Custom Agreement establishes terms for the unique engagement between ${serviceProviderName} and ${clientName}.

CUSTOMIZED ENGAGEMENT: ${input.project.description}

FLEXIBLE SERVICE FRAMEWORK:
• Adaptive scope that can evolve based on changing requirements and priorities
• Industry-specific ${input.client.industry} expertise and specialized methodologies  
• Customized delivery approach tailored to client's business culture and objectives
• Flexible resource allocation and team structure based on project needs

TOTAL INVESTMENT: ${formatCurrency(input.pricing.totalAmount)}
PRICING MODEL: ${input.pricing.model} - customized for this engagement

CUSTOM DELIVERABLES:
${input.project.deliverables.length > 0 ?
  input.project.deliverables.map(del => `• ${del.name}: ${del.description}`).join('\n') :
  '• Custom deliverables as defined in the engagement scope\n• Professional documentation and support materials\n• Tailored training and knowledge transfer components'
}

FLEXIBLE TERMS AND CONDITIONS:
• Custom intellectual property arrangements: ${input.terms.intellectualProperty}
• Industry-specific compliance considerations for ${input.client.industry}
• Flexible timeline and milestone arrangements: ${input.project.timeline || 'Customized timeline'}
• Tailored performance metrics and success criteria
• Adaptive change management process for scope evolution

PAYMENT STRUCTURE:
${this.generateContractPaymentTerms(input.pricing)}

GOVERNING PROVISIONS:
• Governing Law: ${this.getCleanValue(input.terms.governingLaw, '[CUSTOM_GOVERNING_LAW]')} law
• Dispute Resolution: ${this.getDisputeResolutionMethod(input.terms.disputeResolution)}
• Liability Limitations: ${input.terms.liabilityLimit > 0 ? formatCurrency(input.terms.liabilityLimit) : 'Customized liability terms'}

This agreement is specifically structured to address the unique requirements of this engagement while maintaining professional standards and clear expectations for both parties.

SERVICE PROVIDER:                    CLIENT:
${serviceProviderName}               ${clientName}

By: _________________________       By: _________________________
Name: [CUSTOM_SIGNATORY]            Name: [CLIENT_SIGNATORY]
Title: [CUSTOM_TITLE]               Title: [CLIENT_TITLE]
Date: [EXECUTION_DATE]              Date: [EXECUTION_DATE]`;

  } catch (error) {
    console.error('Error generating custom agreement:', error);
    return this.generateMinimalServiceAgreement(input);
  }
}

private generateCustomSOW(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    
    return `CUSTOM STATEMENT OF WORK

Unique Engagement: ${input.project.description}

CUSTOMIZED APPROACH:
• Methodology tailored specifically for ${input.client.industry} industry requirements
• Flexible deliverables that adapt to evolving business needs and priorities
• Adaptive timeline and milestone structure based on project complexity and dependencies

CUSTOM DELIVERABLES:
${input.project.deliverables.length > 0 ?
  input.project.deliverables.map((del, index) => 
    `${index + 1}. ${del.name}
   - Description: ${del.description}
   - Format: ${del.format || 'Custom format'}
   - Due Date: ${del.dueDate || 'Flexible scheduling'}`
  ).join('\n\n') :
  '• Custom deliverables as defined in the engagement scope\n• Professional documentation and support materials\n• Tailored training and knowledge transfer components'
}

FLEXIBLE TIMELINE: ${input.project.timeline || '[CUSTOM_TIMELINE]'}
TOTAL INVESTMENT: ${formatCurrency(input.pricing.totalAmount)}

ADAPTIVE MILESTONES:
${input.project.milestones.length > 0 ?
  input.project.milestones.map(m => `• ${m.name}: ${m.description} (Flexible: ${m.dueDate || 'TBD'})`).join('\n') :
  '• Phase 1: Custom project initiation and planning\n• Phase 2: Core implementation with regular reviews\n• Phase 3: Finalization and customized delivery'
}

CUSTOM SUCCESS CRITERIA:
• Customized acceptance criteria developed for each specific deliverable
• Industry-specific performance standards and quality metrics
• Client satisfaction measurements and business outcome achievement
• Successful knowledge transfer and capability building metrics
• Flexible success definitions that evolve with project needs

ADAPTIVE EXCLUSIONS:
${input.project.exclusions.length > 0 ?
  input.project.exclusions.map(exc => `• ${exc}`).join('\n') :
  '• Services outside the defined custom scope\n• Third-party tools or platforms not specified\n• Regulatory or compliance services requiring specialized certifications'
}

This Custom SOW ensures all unique requirements are clearly defined while maintaining flexibility for adaptation as the engagement evolves based on changing business needs and priorities.`;
  } catch (error) {
    console.error('Error generating custom SOW:', error);
    return this.generateMinimalSOW(input);
  }
}

// ===== RETAINER AGREEMENT GENERATORS =====
private generateRetainerAgreement(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    const monthlyAmount = this.calculateMonthlyRetainer(input);
    const serviceProviderName = this.getCleanValue(input.serviceProvider.legalName, '[RETAINER_SERVICE_PROVIDER]');
    const clientName = this.getCleanValue(input.client.legalName);
    
    return `RETAINER SERVICES AGREEMENT

This Retainer Agreement establishes an ongoing advisory relationship between ${serviceProviderName} ("Service Provider") and ${clientName} ("Client") for ${input.client.industry} consulting services.

1. RETAINER SERVICES SCOPE
Service Provider agrees to provide strategic advisory services on a retained basis, including:
• Strategic planning and business guidance (up to 10 hours monthly)
• Priority access to senior consultants with guaranteed response times
• Regular business reviews and performance optimization
• Email and phone consultation for urgent business matters
• Strategic document review and recommendations

Engagement Focus: ${input.project.description}

2. RETAINER FEES AND PAYMENT
Monthly Retainer: ${formatCurrency(monthlyAmount)}
Payment Due: 1st of each month in advance
Late Fee: ${input.pricing.lateFeePercentage}% per month on overdue amounts

Included Hours: Up to 10 hours of advisory time per month
Additional Hours: $${this.getHourlyRate(input)}/hour for work beyond monthly allocation
Unused Hours: Do not carry forward to subsequent months

3. TERM AND RENEWAL
Initial Term: ${input.terms.contractLength}
Auto-Renewal: Agreement renews monthly unless terminated
Termination Notice: ${input.terms.terminationNotice} days written notice required

4. SERVICE DELIVERY STANDARDS
• Response Time: Maximum 24 hours for urgent matters
• Scheduled Sessions: Minimum 2 strategic sessions per month
• Reporting: Monthly summary of activities and recommendations
• Availability: Business hours consultation with emergency access

5. INTELLECTUAL PROPERTY
${this.generateIPClause(input.terms.intellectualProperty)}
Pre-existing materials and methodologies remain with Service Provider.

6. CONFIDENTIALITY AND NON-DISCLOSURE
Both parties agree to maintain strict confidentiality of all proprietary information shared during the advisory relationship.

7. LIMITATION OF LIABILITY
Service Provider's liability is limited to ${input.terms.liabilityLimit > 0 ? formatCurrency(input.terms.liabilityLimit) : 'three (3) months of retainer fees'}.

8. GOVERNING LAW
This Agreement is governed by ${this.getCleanValue(input.terms.governingLaw, '[RETAINER_GOVERNING_LAW]')} law.

IN WITNESS WHEREOF, the parties execute this Retainer Agreement.

${serviceProviderName.toUpperCase()}                    ${clientName.toUpperCase()}
By: _________________________              By: _________________________
Name: ${this.getCleanValue(input.serviceProvider.signatoryName, '[RETAINER_SIGNATORY]')}              Name: ${this.getCleanValue(input.client.signatoryName, '[CLIENT_SIGNATORY]')}
Title: ${this.getCleanValue(input.serviceProvider.signatoryTitle, '[RETAINER_TITLE]')}                Title: ${this.getCleanValue(input.client.signatoryTitle, '[CLIENT_TITLE]')}
Date: _________________________             Date: _________________________`;

  } catch (error) {
    console.error('Error generating retainer agreement:', error);
    return this.generateMinimalServiceAgreement(input);
  }
}

private generateRetainerSOW(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    const monthlyAmount = this.calculateMonthlyRetainer(input);
    
    return `RETAINER STATEMENT OF WORK

This SOW defines the specific services under the Retainer Agreement between ${this.getCleanValue(input.serviceProvider.name, '[RETAINER_SERVICE_PROVIDER]')} and ${input.client.legalName}.

ADVISORY SERVICES SCOPE:
Strategic Business Advisory focusing on: ${input.project.description}

MONTHLY SERVICE ALLOCATION:
Core Advisory Hours: 10 hours per month included in retainer
Service Distribution:
• Strategic Planning Sessions: 4 hours monthly
• Business Review and Analysis: 3 hours monthly  
• Ad-hoc Consultation and Support: 3 hours monthly

SPECIFIC OBJECTIVES:
${input.project.objectives.length > 0 ? 
  input.project.objectives.map((obj, index) => `${index + 1}. ${obj}`).join('\n') :
  '1. Provide ongoing strategic guidance and business optimization\n2. Support key decision-making with industry expertise\n3. Monitor performance and recommend improvements'
}

DELIVERABLES AND REPORTING:
• Monthly Strategic Summary: Performance review and recommendations
• Quarterly Business Assessment: Comprehensive analysis and planning
• Ad-hoc Strategic Memos: Issue-specific guidance and recommendations
• Annual Strategic Plan: Long-term planning and goal-setting support

PERFORMANCE STANDARDS:
• Response Time: Maximum 24 hours for urgent requests
• Monthly Sessions: Minimum 2 scheduled advisory sessions
• Quarterly Reviews: Formal business performance assessment
• Annual Planning: Strategic planning and goal-setting workshop

RETAINER TERMS:
Monthly Investment: ${formatCurrency(monthlyAmount)}
Additional Hours: $${this.getHourlyRate(input)}/hour
Billing Cycle: Monthly, due in advance
Expense Reimbursement: ${this.getCleanValue(input.pricing.expensePolicy, 'Pre-approved expenses over $500')}

SERVICE EXCLUSIONS:
• Implementation services requiring specialized technical skills
• Third-party software, tools, or platform costs
• Services requiring more than 15 hours in any single month
• Legal, accounting, or regulatory compliance services

This SOW ensures consistent strategic support while maintaining flexibility for evolving business priorities and changing market conditions.`;
  } catch (error) {
    console.error('Error generating retainer SOW:', error);
    return this.generateMinimalSOW(input);
  }
}

// ===== CONSULTING AGREEMENT GENERATORS =====
private generateConsultingAgreement(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    const serviceProviderName = this.getCleanValue(input.serviceProvider.legalName, '[CONSULTING_FIRM_LEGAL_NAME]');
    const clientName = this.getCleanValue(input.client.legalName);
    
    return `STRATEGIC CONSULTING SERVICES AGREEMENT

This Strategic Consulting Services Agreement (this "Agreement") is entered into as of [EXECUTION_DATE], by and between ${serviceProviderName} ("Consultant") and ${clientName} ("Client").

RECITALS

WHEREAS, Client requires strategic ${input.client.industry} consulting services to ${input.project.description}; and

WHEREAS, Consultant possesses specialized expertise and experience in providing such consulting services;

NOW, THEREFORE, the parties agree as follows:

1. CONSULTING SERVICES

1.1 Engagement Scope. Consultant shall provide strategic consulting services comprising:

Phase I - Business Assessment and Analysis
• Comprehensive current state assessment and stakeholder analysis
• Industry benchmarking and competitive landscape evaluation
• Process analysis and operational efficiency review
• Identification of strategic opportunities and challenges

Phase II - Strategic Development and Planning  
• Development of strategic recommendations and alternatives
• Business case development with ROI projections and risk analysis
• Implementation roadmap with detailed timelines and resource requirements
• Change management strategy and stakeholder engagement plan

Phase III - Implementation Support and Optimization
• Implementation planning and project management support
• Performance metrics development and monitoring framework
• Executive coaching and organizational change facilitation
• Final reporting and knowledge transfer sessions

1.2 Methodology. Consultant shall employ proven strategic consulting methodologies, including structured problem-solving frameworks, data-driven analysis, and best-practice research.

1.3 Deliverables. Consultant shall provide the following deliverables:
${this.generateConsultingDeliverables(input)}

2. CONSULTING TEAM AND RESOURCES

2.1 Project Team. Consultant shall assign senior consultants with relevant ${input.client.industry} industry experience and expertise in strategic planning and organizational development.

2.2 Client Collaboration. Client shall provide reasonable access to personnel, facilities, records, and information necessary for Consultant to perform the services effectively.

3. COMPENSATION AND TERMS

3.1 Professional Fees. Total consulting investment: ${formatCurrency(input.pricing.totalAmount)} ${input.pricing.currency}

3.2 Phase-Based Payment Structure:
• Phase I Payment: ${formatCurrency(Math.round(input.pricing.totalAmount * 0.35))} due upon engagement commencement
• Phase II Payment: ${formatCurrency(Math.round(input.pricing.totalAmount * 0.40))} due upon Phase I completion  
• Phase III Payment: ${formatCurrency(Math.round(input.pricing.totalAmount * 0.25))} due upon Phase II completion

3.3 Expenses. Client shall reimburse pre-approved expenses exceeding $500 with appropriate documentation.

3.4 Timeline. Estimated engagement duration: ${input.project.timeline || '8-10 weeks'} from commencement date.

4. INTELLECTUAL PROPERTY AND CONFIDENTIALITY

4.1 Work Product. All strategic recommendations, analysis, and custom deliverables shall be owned by Client upon full payment. Consultant retains rights to general methodologies and pre-existing intellectual property.

4.2 Confidentiality. Both parties shall maintain strict confidentiality regarding all proprietary and sensitive business information disclosed during the engagement.

5. PROFESSIONAL STANDARDS

5.1 Quality Standards. Services shall be performed in accordance with professional consulting standards and industry best practices.

5.2 Limitation of Liability. Consultant's liability shall be limited to the total fees paid under this agreement.

This Agreement represents a strategic partnership focused on delivering measurable business value and sustainable competitive advantage.

IN WITNESS WHEREOF, the parties execute this Agreement.

CONSULTANT:                               CLIENT:
${serviceProviderName}                    ${clientName}

By: _____________________________        By: _____________________________
Name: [CONSULTING_SIGNATORY]             Name: [CLIENT_SIGNATORY]
Title: [CONSULTING_TITLE]                Title: [CLIENT_TITLE]  
Date: [EXECUTION_DATE]                   Date: [EXECUTION_DATE]`;

  } catch (error) {
    console.error('Error generating consulting agreement:', error);
    return this.generateMinimalServiceAgreement(input);
  }
}

private async generateAlternativeOptionsAI(input: ProposalInput): Promise<AlternativeOption[]> {
  try {
    const prompt = `Generate 3 unique alternative approaches for this specific proposal:

CLIENT: ${input.client.legalName} (${input.client.companySize} ${input.client.industry} company)
PROJECT: "${input.project.description}"
BUDGET: $${input.pricing.totalAmount.toLocaleString()}
TIMELINE: ${input.project.timeline || 'TBD'}

Create alternatives that are:
1. SPECIFIC to this exact project (not generic templates)
2. REALISTIC with actual pricing/timeline adjustments
3. CONTEXTUAL to ${input.client.industry} industry needs

Return JSON array with exactly this structure:
[
  {
    "title": "specific name for ${input.client.legalName}",
    "description": "detailed description specific to their project",
    "pricingAdjustment": number (-0.5 to 0.5),
    "timelineAdjustment": "specific timeline change description", 
    "scopeChanges": ["specific scope modification 1", "specific scope modification 2", "etc"],
    "pros": ["specific advantage 1", "specific advantage 2", "etc"],
    "cons": ["specific limitation 1", "specific limitation 2", "etc"]
  }
]

Generate: Essential version (-30-40% cost), Premium version (+40-50% cost), Phased approach (+15% cost)`;

    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system', 
          content: 'You are an expert at creating project alternatives. Always return valid JSON arrays only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000
    });

    const alternatives = JSON.parse(response.content);
    return Array.isArray(alternatives) ? alternatives : [];
    
 } catch (error) {
    console.error('AI alternatives generation failed:', error);
    throw new ProposalGenerationError(
      'Failed to generate alternative options. Please try again.',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}


private async generateRecommendationsAI(input: ProposalInput): Promise<string[]> {
  // Remove the analysis parameter since we're generating everything independently
  try {
    const prompt = `Generate 6-8 specific, actionable recommendations for this proposal:

CLIENT: ${input.client.legalName} (${input.client.industry}, ${input.client.companySize})
PROJECT: "${input.project.description}"
VALUE: $${input.pricing.totalAmount.toLocaleString()}

Focus on improving win probability, competitive positioning, and value proposition.
Return JSON array of strings: ["recommendation 1", "recommendation 2", ...]`;

    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a proposal optimization expert. Return only valid JSON arrays.'
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const recommendations = JSON.parse(response.content);
    return Array.isArray(recommendations) ? recommendations : [];
    
  } catch (error) {
    console.error('AI recommendations generation failed:', error);
    throw new ProposalGenerationError(
      'Failed to generate recommendations. Please try again.',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}


private async generateRiskAssessmentAI(input: ProposalInput): Promise<RiskAssessment> {
  try {
    const deliverableCount = input.project.deliverables?.length || 0;
    const timelineWeeks = this.parseTimelineToWeeks(input.project.timeline || '') || 8;
    const dependencyCount = input.project.dependencies?.length || 0;

    const prompt = `Analyze risks for this specific proposal:

CLIENT: ${input.client.legalName} (${input.client.industry}, ${input.client.companySize})
PROJECT: "${input.project.description}"
VALUE: $${input.pricing.totalAmount.toLocaleString()}
TIMELINE: ${input.project.timeline || 'TBD'} (${timelineWeeks} weeks)
DELIVERABLES: ${deliverableCount} items
DEPENDENCIES: ${dependencyCount} dependencies
PAYMENT: ${input.pricing.model} model

Analyze SPECIFIC risks for THIS project in these categories:
- Technical: Implementation, integration, complexity risks
- Financial: Payment, budget, cost overrun risks  
- Timeline: Delivery, milestone, scheduling risks
- Relationship: Client communication, expectation risks
- Market: Industry, competitive, economic risks

For each risk, assess:
- Probability: low/medium/high
- Impact: low/medium/high  
- Specific mitigation strategy

Return JSON:
{
  "overallRisk": "low|medium|high",
  "riskCategories": {
    "technical": [{"description": "specific risk", "probability": "medium", "impact": "high", "mitigation": "specific action"}],
    "financial": [...],
    "timeline": [...], 
    "relationship": [...],
    "market": [...]
  },
  "mitigationPlan": ["overall strategy 1", "overall strategy 2", ...]
}`;

    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a project risk analysis expert. Return only valid JSON with the specified structure.'
        },
        {
          role: 'user',
          content: prompt  
        }
      ],
      temperature: 0.6,
      max_tokens: 2500
    });

    const riskAssessment = JSON.parse(response.content);
    return riskAssessment;
    
} catch (error) {
    console.error('AI risk assessment generation failed:', error);
    throw new ProposalGenerationError(
      'Failed to generate risk assessment. Please try again.',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}


private async generateCompetitiveAnalysisAI(input: ProposalInput): Promise<CompetitiveAnalysis> {
  try {
    const specializations = input.serviceProvider.specializations?.join(', ') || 'General services';
    const credentials = input.serviceProvider.credentials?.join(', ') || 'Professional credentials';

    const prompt = `Generate competitive analysis for this specific proposal:

SERVICE PROVIDER: ${input.serviceProvider.name || 'Service Provider'}
SPECIALIZATIONS: ${specializations}  
CREDENTIALS: ${credentials}

CLIENT: ${input.client.legalName} (${input.client.industry}, ${input.client.companySize})
PROJECT: "${input.project.description}"
VALUE: $${input.pricing.totalAmount.toLocaleString()}
MODEL: ${input.pricing.model}

Analyze competitive positioning for THIS specific engagement:

1. POSITIONING ADVANTAGES: What makes this provider uniquely suited for THIS project?
2. POTENTIAL CHALLENGES: What competitive/market challenges might arise?  
3. DIFFERENTIATION POINTS: How does this proposal stand out from alternatives?
4. MARKET BENCHMARKS: Realistic pricing/timeline ranges for similar ${input.client.industry} projects

Be specific to:
- This exact project type and scope
- ${input.client.industry} industry dynamics  
- ${input.client.companySize} company decision factors
- Current market conditions

Return JSON:
{
  "positioningAdvantages": ["specific advantage 1", "specific advantage 2", ...],
  "potentialChallenges": ["specific challenge 1", "specific challenge 2", ...], 
  "differentiationPoints": ["specific differentiator 1", "specific differentiator 2", ...],
  "marketBenchmarks": {
    "pricingRange": {"min": 0, "max": 0},
    "typicalTimeline": "timeline description",
    "standardFeatures": ["standard feature 1", "standard feature 2", ...]
  }
}`;

    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a competitive analysis expert. Return only valid JSON with the specified structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const competitiveAnalysis = JSON.parse(response.content);
    return competitiveAnalysis;
    
} catch (error) {
    console.error('AI competitive analysis generation failed:', error);
    throw new ProposalGenerationError(
      'Failed to generate competitive analysis. Please try again.',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}



private generateConsultingSOW(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    
    return `CONSULTING STATEMENT OF WORK

Strategic Consulting Engagement: ${input.project.description}

PHASE 1 - DISCOVERY (Weeks 1-3):
• Stakeholder interviews and current state analysis
• Process documentation and gap identification
• Industry benchmarking and competitive landscape review
• Initial findings presentation to leadership team

PHASE 2 - ANALYSIS & STRATEGY (Weeks 4-7):
• Strategic options development and evaluation
• Business case development with ROI projections
• Risk analysis and mitigation planning
• Draft recommendations review with key stakeholders

PHASE 3 - IMPLEMENTATION PLANNING (Weeks 8-10):
• Final recommendations presentation to executive team
• Implementation roadmap with detailed timelines
• Success metrics and monitoring framework delivery
• Knowledge transfer and capability building sessions

CONSULTING TEAM: Senior consultants with ${input.client.industry} expertise
METHODOLOGY: Proven strategic consulting framework
TOTAL INVESTMENT: ${formatCurrency(input.pricing.totalAmount)}
PROJECT TIMELINE: ${input.project.timeline || '8-10 weeks'}

DELIVERABLES:
${this.generateConsultingDeliverables(input)}

SUCCESS CRITERIA: Client approval and acceptance of all phase deliverables, measurable strategic insights, actionable implementation roadmap

This SOW ensures comprehensive strategic analysis and actionable recommendations for sustainable business improvement.`;
  } catch (error) {
    console.error('Error generating consulting SOW:', error);
    return this.generateMinimalSOW(input);
  }
}

private generateConsultingDeliverables(input: ProposalInput): string {
  try {
    if (input.project.deliverables && input.project.deliverables.length > 0) {
      return input.project.deliverables
        .filter(del => del && del.name)
        .map(del => `• ${del.name}: ${del.description || 'Professional consulting deliverable'}`)
        .join('\n');
    }
    
    return `• Current State Assessment Report: Comprehensive analysis of existing operations and strategic position
• Strategic Recommendations Presentation: Detailed strategic options with implementation roadmaps  
• Implementation Planning Guide: Step-by-step execution framework with timelines and success metrics
• Executive Summary and Action Plan: Prioritized recommendations with immediate next steps`;
  } catch (error) {
    console.error('Error generating consulting deliverables:', error);
    return '• Strategic analysis and recommendations as specified in consulting scope';
  }
}



private generateProjectPricing(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    const phase1 = Math.round(input.pricing.totalAmount * 0.3);
    const phase2 = Math.round(input.pricing.totalAmount * 0.4);
    const phase3 = input.pricing.totalAmount - phase1 - phase2;

    return `Total Project Investment: ${formatCurrency(input.pricing.totalAmount)}

Milestone-Based Payment Structure:
• Project Initiation: ${formatCurrency(phase1)} (Upon signing and project kickoff)
• Mid-Project Milestone: ${formatCurrency(phase2)} (50% completion and milestone approval)
• Final Delivery: ${formatCurrency(phase3)} (Upon completion and client acceptance)

Payment Benefits:
• Milestone-based payments reduce risk for both parties
• Payment tied to tangible progress and deliverable completion
• Clear approval gates ensure alignment before proceeding
• Flexible payment timing based on actual project progress

Additional Terms:
• Invoices due within 30 days of milestone completion
• Late payments subject to ${input.pricing.lateFeePercentage}% monthly fee
• Project scope changes may affect milestone amounts

This payment structure ensures fair risk distribution while maintaining project momentum.`;
  } catch (error) {
    console.error('Error generating project pricing:', error);
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    return `Total project investment: ${formatCurrency(input.pricing.totalAmount)}. Milestone-based payment structure with progress-aligned payments.`;
  }
}

private generateProjectAgreement(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    const serviceProviderName = this.getCleanValue(input.serviceProvider.legalName, '[SERVICE_PROVIDER_LEGAL_NAME]');
    const clientName = this.getCleanValue(input.client.legalName);
    
    return `PROJECT SERVICES AGREEMENT

This Project Agreement establishes terms for ${serviceProviderName} to deliver project services for ${clientName}.

PROJECT SCOPE: ${input.project.description}

DELIVERABLES:
${this.generateContractDeliverablesList(input.project.deliverables)}

TIMELINE: ${input.project.timeline || '[PROJECT_TIMELINE]'}
TOTAL INVESTMENT: ${formatCurrency(input.pricing.totalAmount)}

PROJECT MILESTONES:
${input.project.milestones.length > 0 
  ? input.project.milestones.map(m => `• ${m.name} (Due: ${m.dueDate})`).join('\n')
  : '• Project kickoff and planning\n• Mid-project review and approval\n• Final delivery and acceptance'
}

PAYMENT TERMS:
${this.generateContractPaymentTerms(input.pricing)}

SUCCESS CRITERIA: 
• Completion of all deliverables within timeline and budget
• Client approval at each milestone checkpoint
• Meeting all specified acceptance criteria

INTELLECTUAL PROPERTY: ${this.generateIPClause(input.terms.intellectualProperty)}

GOVERNING LAW: ${this.getCleanValue(input.terms.governingLaw, '[GOVERNING_LAW_STATE]')} law
DISPUTE RESOLUTION: ${this.getDisputeResolutionMethod(input.terms.disputeResolution)}

This agreement ensures successful project delivery through clear scope definition and milestone tracking.

SERVICE PROVIDER:                    CLIENT:
${serviceProviderName}               ${clientName}

By: _________________________       By: _________________________
Name: [SIGNATORY_NAME]              Name: [CLIENT_SIGNATORY_NAME]  
Title: [SIGNATORY_TITLE]            Title: [CLIENT_SIGNATORY_TITLE]
Date: [EXECUTION_DATE]              Date: [EXECUTION_DATE]`;

  } catch (error) {
    console.error('Error generating project agreement:', error);
    return this.generateMinimalServiceAgreement(input);
  }
}

private generateProjectSOW(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    
    return `PROJECT STATEMENT OF WORK

Project Description: ${input.project.description}

WORK BREAKDOWN STRUCTURE:
${input.project.deliverables.length > 0 ?
  input.project.deliverables.map((del, index) => 
    `${index + 1}. ${del.name}
   - Description: ${del.description}
   - Format: ${del.format || 'Document'}
   - Quantity: ${del.quantity || 1}
   - Due Date: ${del.dueDate || 'As scheduled in project timeline'}`
  ).join('\n\n') :
  `1. Project Planning and Setup
   - Initial requirements gathering and planning
   - Resource allocation and timeline finalization
   
2. Core Implementation and Development  
   - Primary project work and deliverable creation
   - Regular progress reviews and quality checks
   
3. Testing, Delivery and Documentation
   - Final testing and quality assurance
   - Delivery of all project components and documentation`
}

PROJECT TIMELINE: ${input.project.timeline || '[PROJECT_TIMELINE]'}
TOTAL INVESTMENT: ${formatCurrency(input.pricing.totalAmount)}

PROJECT RESOURCES: Dedicated project team with relevant expertise
COMMUNICATION: Weekly progress updates and milestone review meetings
QUALITY ASSURANCE: Regular checkpoints and deliverable validation

ACCEPTANCE CRITERIA:
${input.project.deliverables.length > 0 && input.project.deliverables[0]?.acceptanceCriteria?.length > 0 ?
  input.project.deliverables[0].acceptanceCriteria.map(criteria => `• ${criteria}`).join('\n') :
  '• Client approval of all deliverables\n• Completion within specified timeline\n• Quality standards met per professional requirements'
}

This SOW ensures clear understanding of all project components and delivery expectations.`;
  } catch (error) {
    console.error('Error generating project SOW:', error);
    return this.generateMinimalSOW(input);
  }
}





private generateExecutiveSummary(input: ProposalInput): string {
  try {
    const typeDescriptions: Record<ProposalType, string> = {
      'retainer-agreement': 'ongoing advisory services through a monthly retainer arrangement',
      'consulting-proposal': 'strategic consulting engagement to analyze and improve business operations',
      'project-proposal': 'structured project delivery with defined deliverables and milestones',
      'custom-proposal': 'customized professional services tailored to specific requirements',
      'service-agreement': 'comprehensive professional services'
    };

    const description = typeDescriptions[input.proposalType];
    const specializations = this.safeJoinArray(input.serviceProvider.specializations, 'professional expertise');
    const timeline = input.project.timeline || '8-12 week';

    return `${input.client.legalName} requires ${description}. ${input.serviceProvider.name || 'Our team'} proposes ${input.project.description}. This engagement leverages our ${specializations} to deliver measurable value within the ${timeline} timeframe.`;
  } catch (error) {
    console.error('Error generating executive summary:', error);
    return `Professional engagement proposal for ${input.client.legalName} to deliver ${input.project.description} with industry expertise and proven methodologies.`;
  }
}



private assessPricingCompetitiveness(input: ProposalInput): 'low' | 'competitive' | 'premium' {
  try {
    const industryMultipliers: Record<string, number> = {
      technology: 1.3,
      finance: 1.4,
      healthcare: 1.2,
      consulting: 1.1,
      marketing: 1.0,
      ecommerce: 1.0,
      manufacturing: 1.1,
      'real-estate': 1.0,
      education: 0.9,
      other: 1.0
    };

    const baseRate = 150; // Base hourly rate
    const multiplier = industryMultipliers[input.client.industry] || 1.0;
    const expectedHourlyRate = baseRate * multiplier;

    // Estimate hours based on deliverables or use default
    let estimatedHours = 40; // Default minimum
    
    if (Array.isArray(input.project.deliverables) && input.project.deliverables.length > 0) {
      estimatedHours = input.project.deliverables.reduce((total, del) => {
        const quantity = typeof del.quantity === 'number' ? del.quantity : 1;
        const hoursPerDeliverable = this.estimateHoursPerDeliverable(del.format || 'document');
        return total + (quantity * hoursPerDeliverable);
      }, 0);
    }

    // Minimum hours threshold
    estimatedHours = Math.max(estimatedHours, 20);

    const impliedHourlyRate = input.pricing.totalAmount / estimatedHours;

    if (impliedHourlyRate > expectedHourlyRate * 1.4) return 'premium';
    if (impliedHourlyRate < expectedHourlyRate * 0.6) return 'low';
    return 'competitive';
  } catch (error) {
    console.error('Error assessing pricing competitiveness:', error);
    return 'competitive';
  }
}

private estimateHoursPerDeliverable(format: string): number {
  const formatHours: Record<string, number> = {
    'document': 8,
    'presentation': 12,
    'report': 16,
    'analysis': 20,
    'strategy': 24,
    'plan': 16,
    'assessment': 12,
    'workshop': 8,
    'training': 16
  };

  const normalizedFormat = format.toLowerCase();
  return formatHours[normalizedFormat] || formatHours['document'];
}

private assessTimelineRealism(input: ProposalInput): 'aggressive' | 'realistic' | 'conservative' | 'unknown' {
  try {
    const timeline = input.project.timeline;
    
    if (!timeline || this.isPlaceholder(timeline)) {
      return 'unknown';
    }

    const deliverableCount = this.safeFilterArray(input.project.deliverables).length || 1;
    const milestoneCount = this.safeFilterArray(input.project.milestones).length;
    const complexityScore = deliverableCount + (milestoneCount * 1.5);
    
    // Parse timeline to weeks
    const timelineWeeks = this.parseTimelineToWeeks(timeline);
    if (timelineWeeks === 0) return 'unknown';
    
    const weeksPerComplexityPoint = timelineWeeks / Math.max(complexityScore, 1);
    
    if (weeksPerComplexityPoint < 0.5) return 'aggressive';
    if (weeksPerComplexityPoint > 3) return 'conservative';
    return 'realistic';
  } catch (error) {
    console.error('Error assessing timeline realism:', error);
    return 'unknown';
  }
}

private parseTimelineToWeeks(timeline: string): number {
  try {
    const timelineMatch = timeline.match(/(\d+)\s*(week|month|day)/i);
    if (!timelineMatch) return 0;
    
    const timeValue = parseInt(timelineMatch[1]);
    const timeUnit = timelineMatch[2].toLowerCase();
    
    let timelineWeeks = timeValue;
    if (timeUnit === 'month') timelineWeeks *= 4.33;
    if (timeUnit === 'day') timelineWeeks /= 7;
    
    return Math.max(timelineWeeks, 0);
  } catch (error) {
    return 0;
  }
}

private assessScopeClarity(input: ProposalInput): 'unclear' | 'moderate' | 'clear' {
  try {
    let clarityScore = 0;
    
    // Check deliverables quality
    const validDeliverables = this.safeFilterArray(input.project.deliverables);
    if (validDeliverables.length > 0) {
      const avgAcceptanceCriteria = validDeliverables.reduce((sum, del) => {
        const criteria = Array.isArray(del.acceptanceCriteria) ? del.acceptanceCriteria.length : 0;
        return sum + criteria;
      }, 0) / validDeliverables.length;
      
      if (avgAcceptanceCriteria >= 3) clarityScore += 2;
      else if (avgAcceptanceCriteria >= 1) clarityScore += 1;
    }
    
    // Check supporting documentation
    if (this.safeFilterArray(input.project.exclusions).length > 0) clarityScore += 1;
    if (this.safeFilterArray(input.project.assumptions).length > 0) clarityScore += 1;
    if (this.safeFilterArray(input.project.dependencies).length > 0) clarityScore += 1;
    
    // Check objectives clarity
    if (this.safeFilterArray(input.project.objectives).length >= 2) clarityScore += 1;
    
    if (clarityScore >= 4) return 'clear';
    if (clarityScore >= 2) return 'moderate';
    return 'unclear';
  } catch (error) {
    console.error('Error assessing scope clarity:', error);
    return 'moderate';
  }
}



// Safe utility method for filtering arrays
private safeFilterArray(arr: any[] | undefined): any[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => item && typeof item === 'string' && !this.isPlaceholder(item));
}

// services/proposalCreator.service.ts - PRODUCTION-READY PART 3
// Type-Specific Generators & Contract Templates

// ===== RETAINER-SPECIFIC IMPLEMENTATIONS =====
private generateRetainerOverview(input: ProposalInput): string {
  try {
    const monthlyValue = this.calculateMonthlyRetainer(input);
    const serviceProvider = input.serviceProvider.name || 'Our team';
    
    return `${input.client.legalName} is seeking ongoing ${input.client.industry} advisory services to maintain competitive advantage and drive strategic growth. ${serviceProvider} proposes a comprehensive monthly retainer arrangement valued at $${monthlyValue.toLocaleString()} that provides priority access to senior expertise, strategic guidance, and continuous business support.

This retainer model ensures dedicated availability while providing cost predictability for ongoing consulting needs. Our approach combines industry best practices with your specific business context to deliver measurable improvements in ${input.project.description || 'key business areas'}.

The retainer structure allows for flexible service delivery while maintaining consistent strategic oversight, ensuring your business stays ahead of industry trends and competitive challenges.`;
  } catch (error) {
    console.error('Error generating retainer overview:', error);
    return `${input.client.legalName} requires ongoing advisory services. We propose a monthly retainer arrangement to provide continuous strategic support and business guidance.`;
  }
}

private generateRetainerScope(input: ProposalInput): string {
  try {
    const objectives = this.safeFilterArray(input.project.objectives);
    const objectivesText = objectives.length > 0 
      ? objectives.map(obj => `• ${obj}`).join('\n')
      : '• Continuous business improvement and optimization\n• Strategic decision support and guidance\n• Market analysis and competitive positioning';

    const hourlyRate = this.getHourlyRate(input);

    return `MONTHLY RETAINER SERVICES:

Core Advisory Services (Included in Monthly Retainer):
• Strategic planning sessions and business guidance (Up to 10 hours monthly)
• Priority access to senior consultants with rapid response times
• Ongoing business analysis and performance optimization
• Regular check-ins and progress reviews (2 scheduled sessions monthly)
• Email and phone consultation for urgent matters
• Strategic document review and feedback

Specific Objectives:
${objectivesText}

Additional Services (Billed Separately):
• Project work beyond retainer scope ($${hourlyRate}/hour)
• Extended strategic workshops and training sessions
• Specialized research and detailed market analysis
• Travel and on-site consultation (expenses + time)

Service Exclusions:
• Implementation services requiring specialized technical skills
• Third-party software, tools, or platform costs
• Legal, accounting, or regulatory compliance services
• Services requiring more than 15 hours in any single month

This structured approach ensures consistent value delivery while maintaining flexibility for evolving business needs.`;
  } catch (error) {
    console.error('Error generating retainer scope:', error);
    return `Monthly retainer services include strategic advisory, regular consultations, and priority access to senior expertise. Additional services available at standard rates.`;
  }
}

private generateRetainerPricing(input: ProposalInput): string {
  try {
    const monthlyAmount = this.calculateMonthlyRetainer(input);
    const hourlyRate = this.getHourlyRate(input);
    const includedHours = 10;
    
    return `MONTHLY RETAINER INVESTMENT: $${monthlyAmount.toLocaleString()}

What's Included in Your Monthly Retainer:
• Up to ${includedHours} hours of senior advisory time per month
• Priority scheduling with 24-hour response guarantee
• Strategic planning sessions and business guidance
• Regular performance reviews and optimization recommendations
• Unlimited email and phone consultation for urgent matters
• Strategic document review and feedback

Value Comparison:
• Hourly Rate Equivalent: $${hourlyRate}/hour (${includedHours} hours included)
• Retainer Savings: 20-30% compared to hourly engagements
• Predictable monthly investment with no surprise costs
• Priority access typically worth $${Math.round(hourlyRate * 0.3)}/hour premium

Additional Services Rate Structure:
• Extended project work: $${hourlyRate}/hour
• Specialized workshops: $${Math.round(hourlyRate * 1.2)}/hour
• On-site consultation: $${Math.round(hourlyRate * 1.5)}/hour + expenses

Payment Terms:
• Monthly retainer due on the 1st of each month
• Additional services billed monthly with 30-day terms
• Annual retainer payment option available (10% discount)
• Unused hours do not roll over between months

This investment provides exceptional value through consistent strategic support while ensuring cost predictability for your business planning.`;
  } catch (error) {
    console.error('Error generating retainer pricing:', error);
    const monthlyAmount = this.calculateMonthlyRetainer(input);
    return `Monthly retainer: $${monthlyAmount.toLocaleString()}. Includes strategic advisory services, priority access, and regular consultations.`;
  }
}

private calculateMonthlyRetainer(input: ProposalInput): number {
  try {
    // For retainer agreements, calculate monthly amount based on contract length
    const monthlyMultipliers: Record<string, number> = {
      'monthly': 1,
      '3-months': 3,
      '6-months': 6,
      'annual': 12,
      'ongoing': 1
    };
    
    const months = monthlyMultipliers[input.terms.contractLength] || 1;
    return Math.round(input.pricing.totalAmount / months);
  } catch (error) {
    console.error('Error calculating monthly retainer:', error);
    return Math.round(input.pricing.totalAmount);
  }
}

private getHourlyRate(input: ProposalInput): number {
  try {
    const estimatedHours = this.estimateProjectHours(input);
    return Math.round(input.pricing.totalAmount / Math.max(estimatedHours, 10));
  } catch (error) {
    return 200; // Default fallback rate
  }
}

private estimateProjectHours(input: ProposalInput): number {
  try {
    if (!Array.isArray(input.project.deliverables) || input.project.deliverables.length === 0) {
      return 40; // Default estimate
    }

    return input.project.deliverables.reduce((total, del) => {
      const quantity = typeof del.quantity === 'number' ? del.quantity : 1;
      const hoursPerUnit = this.estimateHoursPerDeliverable(del.format || 'document');
      return total + (quantity * hoursPerUnit);
    }, 0);
  } catch (error) {
    return 40;
  }
}

// ===== CONSULTING-SPECIFIC IMPLEMENTATIONS =====
private generateConsultingOverview(input: ProposalInput): string {
  try {
    const serviceProvider = input.serviceProvider.name || 'Our consulting team';
    
    return `${input.client.legalName} has engaged ${serviceProvider} for a strategic consulting engagement focused on ${input.project.description}. Our consulting methodology combines industry expertise, analytical rigor, and practical recommendations to deliver actionable insights and strategic direction for sustainable business improvement in the ${input.client.industry} sector.

Our approach leverages proven frameworks, data-driven analysis, and industry best practices to ensure recommendations are both strategic and implementable. The engagement will provide clear insights into current state challenges, competitive positioning, and strategic opportunities while delivering a comprehensive roadmap for sustainable growth and operational excellence.`;
  } catch (error) {
    console.error('Error generating consulting overview:', error);
    return `Strategic consulting engagement to analyze current state and provide actionable recommendations for business improvement and competitive advantage.`;
  }
}

private generateConsultingScope(input: ProposalInput): string {
  try {
    return `STRATEGIC CONSULTING ENGAGEMENT:

Phase 1 - Discovery & Assessment (Weeks 1-3):
• Comprehensive current state assessment and stakeholder interviews
• Business process documentation and gap analysis
• Industry benchmarking and competitive analysis
• Data collection and preliminary findings validation
• Initial insights presentation to leadership team

Phase 2 - Analysis & Strategy Development (Weeks 4-6):
• Strategic options development and evaluation
• Financial impact modeling and ROI projections
• Risk assessment and mitigation planning
• Stakeholder impact analysis and change considerations
• Draft recommendations review and refinement

Phase 3 - Implementation Planning (Weeks 7-8):
• Final recommendations presentation to executive team
• Detailed implementation roadmap with timelines and resources
• Success metrics and monitoring framework development
• Change management strategy and communication plan
• Knowledge transfer and capability building sessions

Consulting Methodology:
• Structured problem-solving approach with proven frameworks
• Data-driven analysis with quantitative and qualitative insights
• Stakeholder-centric design ensuring buy-in and adoption
• Iterative validation and refinement throughout engagement

This comprehensive approach ensures strategic insights translate into actionable business value and sustainable competitive advantage.`;
  } catch (error) {
    console.error('Error generating consulting scope:', error);
    return `Three-phase consulting engagement: Discovery & Assessment, Analysis & Strategy Development, and Implementation Planning. Comprehensive approach with proven methodologies.`;
  }
}

private generateConsultingPricing(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    const phase1 = Math.round(input.pricing.totalAmount * 0.3);
    const phase2 = Math.round(input.pricing.totalAmount * 0.4);
    const phase3 = input.pricing.totalAmount - phase1 - phase2;

    return `Total Consulting Investment: ${formatCurrency(input.pricing.totalAmount)}

Phase-Based Investment Structure:
• Phase 1 - Discovery & Assessment: ${formatCurrency(phase1)}
  └ Current state analysis, stakeholder interviews, initial findings
• Phase 2 - Analysis & Strategy Development: ${formatCurrency(phase2)}
  └ Strategic recommendations, ROI modeling, implementation planning
• Phase 3 - Implementation Support: ${formatCurrency(phase3)}
  └ Final recommendations, roadmap delivery, knowledge transfer

Value Delivered:
• Comprehensive situation analysis with industry benchmarking
• Strategic recommendations with quantified business impact
• Implementation roadmap with clear success metrics
• Executive-level presentation materials and documentation
• Change management and adoption strategy

Payment Schedule:
• Phase 1: 50% upon engagement start, 50% upon phase completion
• Phase 2: 100% upon Phase 1 completion and Phase 2 initiation
• Phase 3: 100% upon Phase 2 completion and final phase initiation

This structured approach ensures alignment between investment and value delivery at each phase.`;
  } catch (error) {
    console.error('Error generating consulting pricing:', error);
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    return `Total consulting investment: ${formatCurrency(input.pricing.totalAmount)}. Phase-based payment structure aligned with deliverable completion.`;
  }
}

// ===== PROJECT-SPECIFIC IMPLEMENTATIONS =====
private generateProjectOverview(input: ProposalInput): string {
  try {
    const serviceProvider = input.serviceProvider.name || 'Our project team';
    const timeline = input.project.timeline || '8-12 weeks';
    
    return `${input.client.legalName} requires structured project delivery for ${input.project.description}. ${serviceProvider} proposes a comprehensive project approach with defined milestones, clear deliverables, and measurable outcomes. Our project methodology ensures on-time delivery, budget adherence, and quality results through systematic project management and regular client communication.

The project will be executed using proven project management frameworks, with dedicated resources and clear accountability structures. Regular milestone reviews ensure alignment with expectations while maintaining flexibility to adapt to evolving requirements within the agreed scope and timeline of ${timeline}.`;
  } catch (error) {
    console.error('Error generating project overview:', error);
    return `Structured project delivery with defined milestones, clear deliverables, and systematic project management to ensure successful outcomes.`;
  }
}

private generateProjectScope(input: ProposalInput): string {
  try {
    const deliverables = this.safeFilterArray(input.project.deliverables);
    const milestones = this.safeFilterArray(input.project.milestones);
    const timeline = input.project.timeline || '8-12 weeks';

    const deliverablesText = deliverables.length > 0 
      ? deliverables.map(del => `• ${del.name}: ${del.description} (Format: ${del.format || 'Document'})`).join('\n')
      : '• Primary project deliverable as specified in description\n• Supporting documentation and materials\n• Implementation guidance and training materials';

    const milestonesText = milestones.length > 0
      ? milestones.map(m => `• ${m.name}: ${m.description}`).join('\n')
      : '• Project kickoff and planning phase\n• Mid-project review and approval checkpoint\n• Final delivery and client acceptance';

    return `PROJECT DELIVERABLES:
${deliverablesText}

PROJECT TIMELINE: ${timeline}

KEY MILESTONES:
${milestonesText}

PROJECT MANAGEMENT APPROACH:
• Dedicated project manager with regular status reporting
• Weekly progress updates and milestone review meetings  
• Risk monitoring and proactive issue resolution
• Quality assurance checkpoints throughout delivery
• Client approval gates at major milestones

ACCEPTANCE CRITERIA:
• All deliverables meet specified quality standards
• Client approval obtained at each milestone
• Final deliverables pass comprehensive review process
• Knowledge transfer completed to client satisfaction

This structured approach ensures clear expectations and measurable progress throughout the project lifecycle.`;
  } catch (error) {
    console.error('Error generating project scope:', error);
    return `Structured project delivery with defined deliverables, milestone-based progress tracking, and comprehensive quality assurance.`;
  }
}

// ===== SERVICE AGREEMENT IMPLEMENTATIONS =====
private generateServiceOverview(input: ProposalInput): string {
  try {
    const serviceProvider = input.serviceProvider.name || 'Our team';
    
    return `${input.client.legalName} requires professional ${input.client.industry} services to achieve ${input.project.description}. ${serviceProvider} provides comprehensive service delivery with clear performance metrics, ongoing support, and proven methodologies. Our structured approach ensures consistent quality while maintaining flexibility for evolving business needs.

The service engagement is designed to deliver measurable value through systematic execution, regular progress monitoring, and continuous optimization. Our team brings deep industry expertise and proven track record to ensure successful outcomes within agreed timelines and quality standards.`;
  } catch (error) {
    console.error('Error generating service overview:', error);
    return `Professional service engagement with systematic execution, quality assurance, and measurable outcomes.`;
  }
}

// ===== CONTRACT TEMPLATE GENERATORS =====
private generateStandardServiceAgreement(input: ProposalInput): string {
  try {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    const serviceProviderName = this.getCleanValue(input.serviceProvider.legalName, '[SERVICE_PROVIDER_LEGAL_NAME]');
    const serviceProviderAddress = this.getCleanValue(input.serviceProvider.address, '[SERVICE_PROVIDER_ADDRESS]');
    const clientName = this.getCleanValue(input.client.legalName);
    const clientAddress = this.getCleanValue(input.client.address, '[CLIENT_ADDRESS]');

    return `PROFESSIONAL SERVICES AGREEMENT

This Professional Services Agreement (this "Agreement") is made and entered into as of [EXECUTION_DATE] (the "Effective Date"), by and between:

${serviceProviderName}, a [ENTITY_TYPE] organized and existing under the laws of [STATE], with its principal place of business located at ${serviceProviderAddress} ("Service Provider"); and

${clientName}, a ${input.client.entityType || '[CLIENT_ENTITY_TYPE]'} organized and existing under the laws of [CLIENT_STATE], with its principal place of business located at ${clientAddress} ("Client").

RECITALS

WHEREAS, Service Provider is engaged in the business of providing professional ${input.client.industry} services;
WHEREAS, Client desires to engage Service Provider to perform certain professional services; and
WHEREAS, Service Provider desires to provide such services subject to the terms herein.

NOW, THEREFORE, in consideration of the mutual covenants herein, the Parties agree as follows:

1. SERVICES
1.1 Scope of Services. Service Provider shall provide the professional services described in the Statement of Work (the "Services"): ${input.project.description}.

1.2 Standard of Performance. Service Provider shall perform the Services in a professional and workmanlike manner in accordance with industry standards.

1.3 Personnel. Service Provider shall assign qualified personnel and may engage subcontractors as necessary.

2. DELIVERABLES
${this.generateContractDeliverablesList(input.project.deliverables)}

3. TERM AND TERMINATION
3.1 Term. This Agreement shall continue until ${this.getContractTermDescription(input.terms.contractLength)}.
3.2 Termination. Either Party may terminate this Agreement upon ${input.terms.terminationNotice} days' written notice.

4. COMPENSATION AND PAYMENT
4.1 Total Compensation. Client shall pay Service Provider ${formatCurrency(input.pricing.totalAmount)} ${input.pricing.currency}.
4.2 Payment Terms. ${this.generateContractPaymentTerms(input.pricing)}
4.3 Late Payment. Overdue amounts shall bear interest at 1.5% per month or maximum legal rate.

5. INTELLECTUAL PROPERTY
${this.generateIPClause(input.terms.intellectualProperty)}

6. CONFIDENTIALITY
Each Party shall maintain in confidence all proprietary information received from the other Party.

7. WARRANTIES AND REPRESENTATIONS
7.1 Each Party warrants it has authority to enter this Agreement.
7.2 Service Provider warrants Services will be performed professionally and competently.

8. LIMITATION OF LIABILITY
Service Provider's liability shall not exceed ${input.terms.liabilityLimit > 0 ? formatCurrency(input.terms.liabilityLimit) : 'the total fees paid hereunder'}.

9. DISPUTE RESOLUTION
Disputes shall be resolved through ${this.getDisputeResolutionMethod(input.terms.disputeResolution)}.

10. GENERAL PROVISIONS
10.1 This Agreement shall be governed by ${this.getCleanValue(input.terms.governingLaw, '[GOVERNING_LAW]')} law.
10.2 This Agreement constitutes the entire agreement between the Parties.

IN WITNESS WHEREOF, the Parties execute this Agreement.

SERVICE PROVIDER:                    CLIENT:
${serviceProviderName}               ${clientName}

By: _________________________       By: _________________________
Name: [SIGNATORY_NAME]              Name: [CLIENT_SIGNATORY_NAME]  
Title: [SIGNATORY_TITLE]            Title: [CLIENT_SIGNATORY_TITLE]
Date: [EXECUTION_DATE]              Date: [EXECUTION_DATE]`;

  } catch (error) {
    console.error('Error generating service agreement:', error);
    return this.generateMinimalServiceAgreement(input);
  }
}

private generateMinimalServiceAgreement(input: ProposalInput): string {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  
  return `PROFESSIONAL SERVICES AGREEMENT

Service Provider: ${this.getCleanValue(input.serviceProvider.legalName, '[SERVICE_PROVIDER]')}
Client: ${input.client.legalName}

Services: ${input.project.description}
Total Fee: ${formatCurrency(input.pricing.totalAmount)}
Term: ${input.terms.contractLength}

This agreement governs the professional services engagement between the parties.
Complete terms and conditions to be finalized upon execution.

Signatures:
Service Provider: _________________    Date: _________
Client: _________________________    Date: _________`;
}

private generateMinimalSOW(input: ProposalInput): string {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  
  return `STATEMENT OF WORK

Project: ${input.project.description}
Timeline: ${input.project.timeline || '[TIMELINE_TBD]'}
Total Investment: ${formatCurrency(input.pricing.totalAmount)}

Deliverables:
• Professional services as specified in project description
• Regular progress reporting and communication
• Final delivery and documentation

This SOW is executed under the Professional Services Agreement between the parties.`;
}

// Helper methods for contract generation
private generateContractDeliverablesList(deliverables: any[]): string {
  try {
    if (!Array.isArray(deliverables) || deliverables.length === 0) {
      return 'Service Provider shall deliver professional services as specified in the Statement of Work.';
    }

    const validDeliverables = deliverables.filter(del => del && del.name && del.description);
    if (validDeliverables.length === 0) {
      return 'Service Provider shall deliver professional services as specified in the Statement of Work.';
    }

    return validDeliverables.map(del => 
      `• ${del.name}: ${del.description} (${del.format || 'As specified'})`
    ).join('\n');
  } catch (error) {
    return 'Service Provider shall deliver professional services as specified in the Statement of Work.';
  }
}

private generateContractPaymentTerms(pricing: any): string {
  try {
    if (!Array.isArray(pricing.paymentSchedule) || pricing.paymentSchedule.length === 0) {
      const upfront = Math.round(pricing.totalAmount * 0.5);
      const final = pricing.totalAmount - upfront;
      return `${this.formatCurrency(upfront)} due upon execution, ${this.formatCurrency(final)} due upon completion.`;
    }

    return pricing.paymentSchedule
      .filter((p: any) => p && p.description && typeof p.amount === 'number')
      .map((p: any) => `${this.formatCurrency(p.amount)} due ${p.dueDate || 'as scheduled'}`)
      .join('; ') || 'Payment terms to be specified in Statement of Work.';
  } catch (error) {
    return 'Payment terms to be specified in Statement of Work.';
  }
}

private formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

private getContractTermDescription(contractLength: string): string {
  const descriptions: Record<string, string> = {
    'one-time': 'completion of all Services specified herein',
    'monthly': 'one (1) month from the Effective Date',
    '3-months': 'three (3) months from the Effective Date',
    '6-months': 'six (6) months from the Effective Date',
    'annual': 'one (1) year from the Effective Date',
    'ongoing': 'completion of all Services or until terminated'
  };
  return descriptions[contractLength] || 'completion of all Services specified herein';
}

private generateIPClause(ipType: string): string {
  const clauses: Record<string, string> = {
    'client-owns': 'All work product shall be deemed "work made for hire" and owned by Client upon payment.',
    'service-provider-owns': 'Service Provider retains ownership of all work product, granting Client a license for use.',
    'shared': 'Work product shall be jointly owned by both parties with shared usage rights.',
    'work-for-hire': 'All work product shall be deemed "work made for hire" and owned by Client.'
  };
  return clauses[ipType] || clauses['work-for-hire'];
}

private getDisputeResolutionMethod(method: string): string {
  const methods: Record<string, string> = {
    'arbitration': 'binding arbitration under AAA Commercial Rules',
    'mediation': 'mediation, and if unsuccessful, binding arbitration',
    'litigation': 'litigation in courts of competent jurisdiction'
  };
  return methods[method] || methods['arbitration'];
}



// ===== DATABASE OPERATIONS =====
async saveProposal(userId: string, workspaceId: string, proposal: ProposalPackage, input: ProposalInput): Promise<string> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // Validate required parameters
    if (!userId || !workspaceId || !proposal || !input) {
      throw new Error('Missing required parameters for proposal save');
    }

    const serializedProposal = JSON.stringify(proposal, null, 2);
    const clientName = input.client.legalName || 'Unknown Client';
    const proposalTitle = `${input.proposalType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${clientName}`;
    
    const deliverable = await prisma.deliverable.create({
      data: {
        title: proposalTitle,
        content: serializedProposal,
        type: 'proposal',
        user_id: userId,
        workspace_id: workspaceId,
        metadata: {
          proposalType: input.proposalType,
          clientName: clientName,
          clientIndustry: input.client.industry,
          totalValue: input.pricing.totalAmount,
          currency: input.pricing.currency,
          contractLength: input.terms.contractLength,
          pricingModel: input.pricing.model,
          winProbability: proposal.analysis?.winProbability?.score || 60,
          riskLevel: proposal.analysis?.riskLevel || 'medium',
          generatedAt: new Date().toISOString(),
          tokensUsed: proposal.tokensUsed || 0,
          generationTime: proposal.generationTime || 0,
          version: '1.0',
          fallbackGeneration: proposal.proposal?.metadata?.fallbackGeneration || false
        },
        tags: this.generateProposalTags(input)
      }
    });

    console.log('Proposal saved successfully with ID:', deliverable.id);
    return deliverable.id;
  } catch (error) {
    console.error('Error saving proposal:', error);
    throw new ProposalGenerationError('Failed to save proposal to database', error instanceof Error ? error : new Error(String(error)));
  }
}

private generateProposalTags(input: ProposalInput): string[] {
  const tags = ['proposal'];
  
  try {
    tags.push(input.proposalType);
    tags.push(input.client.industry);
    tags.push(input.pricing.model);
    tags.push(`value-${Math.floor(input.pricing.totalAmount / 10000)}0k`);
    tags.push(`term-${input.terms.contractLength}`);
    
    // Add company size tag if available
    if (input.client.companySize) {
      tags.push(`size-${input.client.companySize}`);
    }
    
    return tags.filter(tag => tag && tag.trim().length > 0);
  } catch (error) {
    console.error('Error generating proposal tags:', error);
    return ['proposal', 'business-services'];
  }
}

// services/proposalCreator.service.ts - PRODUCTION-READY PART 4 COMPLETION
// Database Operations & Utility Methods (Continued)

async getUserProposals(userId: string, workspaceId?: string): Promise<SavedProposal[]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const whereClause: any = {
      user_id: userId,
      type: 'proposal'
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    const proposals = await prisma.deliverable.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        workspace: true
      }
    });

    return proposals.map(proposal => this.mapProposalFromDatabase(proposal));
  } catch (error) {
    console.error('Error fetching user proposals:', error);
    throw new ProposalGenerationError('Failed to retrieve proposals from database', error instanceof Error ? error : new Error(String(error)));
  }
}

// In services/proposalCreator.service.ts, update the mapProposalFromDatabase method's parseError catch block:

private mapProposalFromDatabase(dbProposal: any): SavedProposal {
  try {
    let proposalData: ProposalPackage;
    
    try {
      proposalData = typeof dbProposal.content === 'string' 
        ? JSON.parse(dbProposal.content) 
        : dbProposal.content;
    } catch (parseError) {
      console.error('Error parsing proposal content:', parseError);
      // Create minimal proposal data for corrupted records
      proposalData = {
        proposal: { projectOverview: 'Content parsing error', scopeOfWork: '', pricing: '', timeline: '', deliverables: '', terms: '', nextSteps: '', contractTemplates: { serviceAgreement: '', statementOfWork: '' } },
        analysis: { winProbability: { score: 50, factors: [] }, pricingAnalysis: { competitiveness: 'competitive', valueJustification: '', recommendations: [] }, riskLevel: 'medium', strengthsWeaknesses: { strengths: [], weaknesses: [], improvements: [] } },
        recommendations: [],
        alternativeOptions: [],
        riskAssessment: { 
          overallRisk: 'medium', 
          riskCategories: {
            technical: [],
            financial: [],
            timeline: [],
            relationship: [],
            market: []
          },
          mitigationPlan: [] 
        },
        competitiveAnalysis: { positioningAdvantages: [], potentialChallenges: [], differentiationPoints: [], marketBenchmarks: { pricingRange: { min: 0, max: 0 }, typicalTimeline: '', standardFeatures: [] } },
        tokensUsed: 0,
        generationTime: 0,
        originalInput: null as any
      };
    }

    const metadata = dbProposal.metadata as any || {};
    
    return {
      id: dbProposal.id,
      title: dbProposal.title,
      proposalType: metadata.proposalType || 'service-agreement',
      clientName: metadata.clientName || 'Unknown Client',
      status: 'draft', // Default status for saved proposals
      totalValue: metadata.totalValue || 0,
      createdAt: dbProposal.created_at,
      updatedAt: dbProposal.updated_at,
      proposalData,
      metadata: {
        industry: metadata.clientIndustry || 'other',
        projectSize: this.categorizeProjectSize(metadata.totalValue || 0),
        complexity: this.assessComplexityFromMetadata(metadata),
        winProbability: metadata.winProbability || 50,
        version: metadata.version || '1.0'
      },
      workspace: dbProposal.workspace
    };
  } catch (error) {
    console.error('Error mapping proposal from database:', error);
    // Return minimal proposal on mapping error
    return {
      id: dbProposal.id,
      title: dbProposal.title || 'Proposal',
      proposalType: 'service-agreement',
      clientName: 'Unknown Client',
      status: 'draft',
      totalValue: 0,
      createdAt: dbProposal.created_at,
      updatedAt: dbProposal.updated_at,
      proposalData: null as any,
      metadata: {
        industry: 'other',
        projectSize: 'small',
        complexity: 'low',
        winProbability: 50,
        version: '1.0'
      },
      workspace: dbProposal.workspace
    };
  }
}

private categorizeProjectSize(totalValue: number): 'small' | 'medium' | 'large' {
  if (totalValue < 10000) return 'small';
  if (totalValue < 100000) return 'medium';
  return 'large';
}

private assessComplexityFromMetadata(metadata: any): 'low' | 'moderate' | 'high' {
  try {
    const riskLevel = metadata.riskLevel;
    const proposalType = metadata.proposalType;
    
    // Map risk levels to complexity
    if (riskLevel === 'high') return 'high';
    if (riskLevel === 'low') return 'low';
    
    // Assess based on proposal type
    const complexTypes = ['consulting-proposal', 'custom-proposal'];
    if (complexTypes.includes(proposalType)) return 'moderate';
    
    return 'moderate';
  } catch (error) {
    return 'moderate';
  }
}




async getProposal(userId: string, proposalId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    if (!userId || !proposalId) {
      throw new Error('User ID and Proposal ID are required');
    }
    
    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id: proposalId,
        user_id: userId,
        type: 'proposal'
      },
      include: {
        workspace: true
      }
    });

    if (!deliverable) {
      return null;
    }

    let parsedProposal: ProposalPackage;
    try {
      parsedProposal = typeof deliverable.content === 'string'
        ? JSON.parse(deliverable.content)
        : deliverable.content;
    } catch (parseError) {
      console.error('Error parsing proposal content:', parseError);
      throw new ProposalGenerationError('Proposal data is corrupted and cannot be retrieved');
    }

    return {
      id: deliverable.id,
      title: deliverable.title,
      proposal: parsedProposal,
      metadata: deliverable.metadata,
      createdAt: deliverable.created_at,
      updatedAt: deliverable.updated_at,
      workspace: deliverable.workspace
    };
  } catch (error) {
    console.error('Error retrieving proposal:', error);
    if (error instanceof ProposalGenerationError) {
      throw error;
    }
    throw new ProposalGenerationError('Failed to retrieve proposal', error instanceof Error ? error : new Error(String(error)));
  }
}

async deleteProposal(userId: string, proposalId: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    if (!userId || !proposalId) {
      throw new Error('User ID and Proposal ID are required');
    }
    
    const result = await prisma.deliverable.deleteMany({
      where: {
        id: proposalId,
        user_id: userId,
        type: 'proposal'
      }
    });

    const success = result.count > 0;
    if (success) {
      console.log(`Proposal ${proposalId} deleted successfully for user ${userId}`);
    } else {
      console.warn(`No proposal found with ID ${proposalId} for user ${userId}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error deleting proposal:', error);
    throw new ProposalGenerationError('Failed to delete proposal', error instanceof Error ? error : new Error(String(error)));
  }
}

async exportProposal(userId: string, proposalId: string, format: 'json' | 'html' | 'pdf' = 'html') {
  try {
    const proposal = await this.getProposal(userId, proposalId);
    if (!proposal) {
      throw new ProposalGenerationError('Proposal not found or access denied');
    }

    const clientName = this.sanitizeFilename((proposal.metadata as any)?.clientName || 'export');
    
    if (format === 'json') {
      return {
        format: 'json',
        content: JSON.stringify(proposal, null, 2),
        filename: `proposal-${clientName}.json`,
        mimeType: 'application/json'
      };
    }

    if (format === 'html') {
      const htmlContent = this.generateHTMLExport(proposal);
      return {
        format: 'html',
        content: htmlContent,
        filename: `proposal-${clientName}.html`,
        mimeType: 'text/html'
      };
    }

    throw new ProposalGenerationError('PDF export not yet implemented');
  } catch (error) {
    console.error('Error exporting proposal:', error);
    if (error instanceof ProposalGenerationError) {
      throw error;
    }
    throw new ProposalGenerationError('Failed to export proposal', error instanceof Error ? error : new Error(String(error)));
  }
}

private sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 50) || 'proposal';
}

private generateHTMLExport(proposal: any): string {
  try {
    const proposalData = proposal.proposal;
    const metadata = proposal.metadata || {};
    const currentDate = new Date().toLocaleDateString();
    
    // Safe access to nested properties
    const clientName = metadata?.clientName || 'Client';
    const totalValue = metadata?.totalValue || 0;
    const winProbability = metadata?.winProbability || 'Not calculated';
    const riskLevel = metadata?.riskLevel || 'Not assessed';
    const tokensUsed = proposalData?.tokensUsed || 0;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Proposal - ${this.escapeHtml(clientName)}</title>
    <style>
        body { 
            font-family: 'Georgia', serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 40px; 
            color: #333; 
            background: #f9f9f9; 
        }
        .container { 
            max-width: 900px; 
            margin: 0 auto; 
            background: white; 
            padding: 60px; 
            border-radius: 8px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
        }
        .header { 
            text-align: center; 
            margin-bottom: 50px; 
            padding-bottom: 30px; 
            border-bottom: 3px solid #2c5aa0; 
        }
        .section { 
            margin: 40px 0; 
            page-break-inside: avoid; 
        }
        .section h2 { 
            color: #2c5aa0; 
            border-bottom: 2px solid #e9ecef; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
        }
        .contract-section { 
            background: #f8f9fa; 
            padding: 30px; 
            border-radius: 6px; 
            margin: 30px 0; 
            border-left: 4px solid #2c5aa0; 
        }
        h1 { color: #2c5aa0; margin-bottom: 10px; }
        .meta-info { 
            background: #e9ecef; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 20px 0; 
            font-size: 0.9em; 
        }
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        @media print {
            body { background: white; padding: 20px; }
            .container { box-shadow: none; padding: 20px; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Business Proposal</h1>
            <p><strong>Client:</strong> ${this.escapeHtml(clientName)}</p>
            <p><strong>Total Value:</strong> $${totalValue.toLocaleString()}</p>
            <p><strong>Date:</strong> ${currentDate}</p>
        </div>

        ${this.generateHTMLSection('Executive Summary', proposalData?.executiveSummary)}
        ${this.generateHTMLSection('Project Overview', proposalData?.projectOverview)}
        ${this.generateHTMLSection('Scope of Work', proposalData?.scopeOfWork)}
        ${this.generateHTMLSection('Timeline & Milestones', proposalData?.timeline)}
        ${this.generateHTMLSection('Investment & Payment Terms', proposalData?.pricing)}
        ${this.generateHTMLSection('Deliverables', proposalData?.deliverables)}
        ${this.generateHTMLSection('Terms & Conditions', proposalData?.terms)}
        ${this.generateHTMLSection('Next Steps', proposalData?.nextSteps)}

        <div class="page-break"></div>

        ${this.generateHTMLContractSection('Service Agreement', proposalData?.contractTemplates?.serviceAgreement)}
        
        <div class="page-break"></div>

        ${this.generateHTMLContractSection('Statement of Work', proposalData?.contractTemplates?.statementOfWork)}

        <div class="meta-info">
            <h3>Proposal Analysis</h3>
            <p><strong>Win Probability:</strong> ${winProbability}${typeof winProbability === 'number' ? '%' : ''}</p>
            <p><strong>Risk Level:</strong> ${this.escapeHtml(String(riskLevel))}</p>
            <p><strong>Generated with:</strong> ${tokensUsed} AI tokens</p>
            <p><strong>Export Date:</strong> ${currentDate}</p>
        </div>
    </div>
</body>
</html>`;
  } catch (error) {
    console.error('Error generating HTML export:', error);
    return `
<!DOCTYPE html>
<html><head><title>Export Error</title></head>
<body>
    <h1>Export Error</h1>
    <p>Unable to generate HTML export due to data formatting issues.</p>
    <p>Please contact support if this problem persists.</p>
</body>
</html>`;
  }
}


private generateHTMLSection(title: string, content?: string): string {
  if (!content) return '';
  
  return `
        <div class="section">
            <h2>${this.escapeHtml(title)}</h2>
            <div>${this.formatContentForHTML(content)}</div>
        </div>`;
}

private generateHTMLContractSection(title: string, content?: string): string {
  if (!content) {
    return `
        <div class="contract-section">
            <h2>${this.escapeHtml(title)}</h2>
            <div class="error-message">
                ${title} content not available. Please regenerate proposal if needed.
            </div>
        </div>`;
  }
  
  return `
        <div class="contract-section">
            <h2>${this.escapeHtml(title)}</h2>
            <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.85em; overflow-x: auto;">
${this.escapeHtml(content)}
            </pre>
        </div>`;
}

private formatContentForHTML(content: string): string {
  return this.escapeHtml(content)
    .replace(/\n/g, '<br>')
    .replace(/•/g, '&bull;');
}

private escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return text.replace(/[&<>"'/]/g, (m) => map[m]);
}

// ===== CACHE MANAGEMENT =====
async clearProposalCache(input: ProposalInput): Promise<void> {
  try {
    const cacheKey = generateProposalCacheKey(input);
    await this.redis.del(cacheKey);
    console.log('Cache cleared for proposal input');
  } catch (error) {
    console.warn('Error clearing proposal cache:', error);
    // Non-blocking operation, don't throw
  }
}

async clearAllProposalCaches(userId: string): Promise<void> {
  try {
    const pattern = `proposal:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
      console.log(`Cleared ${keys.length} proposal cache entries for user ${userId}`);
    }
  } catch (error) {
    console.warn('Error clearing all proposal caches:', error);
    // Non-blocking operation, don't throw
  }
}

// ===== REMAINING TYPE-SPECIFIC GENERATORS =====
// Generate remaining content for missing proposal types

private generateTimeline(input: ProposalInput): string {
  try {
    const timeline = input.project.timeline || '8-12 weeks';
    const milestones = this.safeFilterArray(input.project.milestones);
    
    if (milestones.length > 0) {
      const milestonesText = milestones.map(milestone => 
        `• ${milestone.name}: ${milestone.description} (Due: ${milestone.dueDate || 'TBD'})`
      ).join('\n');
      
      return `Project Timeline: ${timeline}\n\nKey Milestones:\n${milestonesText}`;
    }
    
    // Generate default milestones based on proposal type
    const defaultMilestones = this.getDefaultMilestones(input.proposalType);
    return `Project Timeline: ${timeline}\n\nKey Milestones:\n${defaultMilestones.join('\n')}`;
  } catch (error) {
    console.error('Error generating timeline:', error);
    return `Project Timeline: ${input.project.timeline || '8-12 weeks'}\n\nMilestones will be defined during project initiation.`;
  }
}

private getDefaultMilestones(proposalType: ProposalType): string[] {
  const typeSpecificMilestones: Record<ProposalType, string[]> = {
    'retainer-agreement': [
      '• Month 1: Initial strategy development and planning sessions',
      '• Month 2: Implementation of priority initiatives and optimization', 
      '• Month 3+: Ongoing advisory support and performance monitoring'
    ],
    'consulting-proposal': [
      '• Week 1-2: Discovery phase and current state assessment',
      '• Week 3-6: Analysis, benchmarking, and strategy development',
      '• Week 7-8: Final recommendations and implementation planning'
    ],
    'project-proposal': [
      '• Week 1: Project kickoff and detailed requirements gathering',
      '• Mid-project: Core deliverable completion and milestone review',
      '• Final week: Quality assurance, delivery, and client acceptance'
    ],
    'service-agreement': [
      '• Week 1: Service initiation and baseline establishment',
      '• Mid-engagement: Progress review and service optimization',
      '• Final phase: Service completion and performance evaluation'
    ],
    'custom-proposal': [
      '• Phase 1: Project initiation and custom planning',
      '• Phase 2: Core implementation and progress review',
      '• Phase 3: Finalization and customized delivery'
    ]
  };

  return typeSpecificMilestones[proposalType] || typeSpecificMilestones['service-agreement'];
}

private generateDeliverables(input: ProposalInput): string {
  try {
    const deliverables = this.safeFilterArray(input.project.deliverables);
    
    if (deliverables.length > 0) {
      return deliverables.map(del => 
        `• ${del.name}: ${del.description} (${del.format || 'Document'}, ${del.quantity || 1} units)`
      ).join('\n');
    }

    // Type-specific default deliverables
    return this.getDefaultDeliverables(input.proposalType).join('\n');
  } catch (error) {
    console.error('Error generating deliverables:', error);
    return 'Professional deliverables as specified in project scope and requirements.';
  }
}

private getDefaultDeliverables(proposalType: ProposalType): string[] {
  const typeDeliverables: Record<ProposalType, string[]> = {
    'retainer-agreement': [
      '• Monthly Strategy Sessions: Regular advisory meetings (Video/Phone, 2 per month)',
      '• Strategic Recommendations: Ongoing guidance and action items (Document, As needed)',
      '• Monthly Reports: Performance insights and progress summary (Report, 1 per month)'
    ],
    'consulting-proposal': [
      '• Current State Assessment: Comprehensive business analysis (Report, 1 document)',
      '• Strategic Recommendations: Detailed improvement roadmap (Presentation, 1 deck)',
      '• Implementation Plan: Step-by-step execution guide (Document, 1 plan)'
    ],
    'project-proposal': [
      '• Primary Deliverable: Core project outcome as specified (Varies, 1 solution)',
      '• Project Documentation: Comprehensive project records (Document, 1 set)',
      '• Training Materials: User guides and support resources (Materials, 1 package)'
    ],
    'service-agreement': [
      '• Professional Services: Complete service delivery (Service, Ongoing)',
      '• Progress Reports: Regular status updates (Report, As scheduled)',
      '• Final Documentation: Service completion records (Document, 1 set)'
    ],
    'custom-proposal': [
      '• Custom Solution: Tailored deliverable as specified (Custom, 1 solution)',
      '• Implementation Support: Customized guidance (Support, As needed)',
      '• Documentation Package: Comprehensive project materials (Document, 1 set)'
    ]
  };

  return typeDeliverables[proposalType] || typeDeliverables['service-agreement'];
}

private generateTerms(input: ProposalInput): string {
  try {
    const governingLaw = input.terms.governingLaw || 'applicable jurisdiction';
    const liabilityLimit = input.terms.liabilityLimit > 0 
      ? `$${input.terms.liabilityLimit.toLocaleString()}` 
      : 'professional standards';

    return `This proposal is valid for ${input.terms.proposalValidityDays} days from submission date. The engagement will be governed by ${governingLaw} law with ${input.terms.disputeResolution} for dispute resolution. Intellectual property will be handled as ${input.terms.intellectualProperty}. Professional liability is limited to ${liabilityLimit}. Contract term: ${input.terms.contractLength} with ${input.terms.terminationNotice} days termination notice.`;
  } catch (error) {
    console.error('Error generating terms:', error);
    return 'Standard professional terms and conditions apply. Detailed terms will be provided in the formal agreement.';
  }
}

private generateNextSteps(input: ProposalInput): string {
  try {
    const typeSpecificSteps: Record<ProposalType, string[]> = {
      'retainer-agreement': [
        '1. Review and approve this retainer proposal',
        '2. Execute monthly retainer agreement',
        '3. Schedule initial strategic session within 5 business days',
        '4. Begin ongoing advisory relationship and regular check-ins'
      ],
      'consulting-proposal': [
        '1. Review and approve this consulting proposal',
        '2. Execute consulting services agreement',
        '3. Schedule discovery phase kickoff meeting',
        '4. Begin strategic analysis and stakeholder engagement'
      ],
      'project-proposal': [
        '1. Review and approve project proposal and scope',
        '2. Execute project agreement and statement of work',
        '3. Schedule project kickoff and planning meeting',
        '4. Begin project initiation and resource allocation'
      ],
      'service-agreement': [
        '1. Review and approve service proposal',
        '2. Execute professional services agreement',
        '3. Schedule service initiation meeting',
        '4. Begin service delivery and performance monitoring'
      ],
      'custom-proposal': [
        '1. Review and approve customized proposal',
        '2. Execute tailored service agreement',
        '3. Schedule engagement kickoff and planning session',
        '4. Begin customized service delivery'
      ]
    };

    const steps = typeSpecificSteps[input.proposalType] || typeSpecificSteps['service-agreement'];
    
    return `To proceed with this engagement:\n\n${steps.join('\n')}\n\nWe look forward to partnering with ${input.client.legalName} on this important initiative and delivering exceptional results that exceed your expectations.`;
  } catch (error) {
    console.error('Error generating next steps:', error);
    return 'To proceed: 1) Review proposal, 2) Execute agreement, 3) Schedule kickoff, 4) Begin engagement.';
  }
}

// ===== SERVICE CLEANUP =====
async cleanup(): Promise<void> {
  try {
    console.log('Cleaning up ProposalCreatorService resources...');
    // Add any cleanup logic here (close connections, clear intervals, etc.)
    console.log('ProposalCreatorService cleanup completed');
  } catch (error) {
    console.error('Error during service cleanup:', error);
  }
}

// ===== END OF SERVICE CLASS =====
}




