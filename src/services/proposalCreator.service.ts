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


private extractJSONFromResponse(content: string): string {
  console.log('Extracting JSON from content length:', content.length);
  
  // Try to extract JSON from markdown code blocks first
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    let jsonString = jsonBlockMatch[1].trim();
    console.log('Found JSON in code block, length:', jsonString.length);
    return this.repairTruncatedJSON(jsonString);
  }

  // Try to extract JSON object
  const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    let jsonString = jsonObjectMatch[0].trim();
    console.log('Found JSON object, length:', jsonString.length);
    return this.repairTruncatedJSON(jsonString);
  }

  // Try to extract JSON array
  const jsonArrayMatch = content.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch) {
    let jsonString = jsonArrayMatch[0].trim();
    console.log('Found JSON array, length:', jsonString.length);
    return this.repairTruncatedJSON(jsonString);
  }

  console.error('No valid JSON found in content:', content.substring(0, 500));
  throw new Error('No valid JSON found in AI response');
}

private repairTruncatedJSON(jsonString: string): string {
  // Check if JSON appears complete
  if (jsonString.endsWith('}') || jsonString.endsWith(']')) {
    return jsonString;
  }

  console.log('Attempting to repair truncated JSON...');
  
  // For objects, count braces and add missing ones
  if (jsonString.startsWith('{')) {
    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;
    const missingBraces = openBraces - closeBraces;
    
    for (let i = 0; i < missingBraces; i++) {
      jsonString += '}';
    }
  }
  
  // For arrays, count brackets and add missing ones
  if (jsonString.startsWith('[')) {
    const openBrackets = (jsonString.match(/\[/g) || []).length;
    const closeBrackets = (jsonString.match(/\]/g) || []).length;
    const missingBrackets = openBrackets - closeBrackets;
    
    for (let i = 0; i < missingBrackets; i++) {
      jsonString += ']';
    }
  }

  return jsonString;
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
      max_tokens: 16000
    });

    console.log('Raw analysis response (first 1000 chars):', response.content.substring(0, 1000));
    
    const jsonString = this.extractJSONFromResponse(response.content);
    const analysis = JSON.parse(jsonString);
    
    // Basic structure validation
    if (!analysis.winProbability || typeof analysis.winProbability.score !== 'number' ||
        !analysis.pricingAnalysis || !analysis.riskLevel ||
        !analysis.strengthsWeaknesses || !Array.isArray(analysis.pricingAnalysis.recommendations)) {
      throw new Error('Invalid analysis structure from AI: missing required fields');
    }
    return analysis;
    
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

// In services/proposalCreator.service.ts - update generateProposalFromAI:

private async generateProposalFromAI(input: ProposalInput): Promise<GeneratedProposal> {
  console.log('🚀 Starting AI generation...');
  console.log('📝 Project description:', input.project.description);
  console.log('🏢 Client:', input.client.legalName);
  
  const prompt = this.buildProposalPrompt(input);
  console.log('📄 Prompt length:', prompt.length);
  
  try {
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
        max_tokens: 32000  // INCREASED from 16000
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI generation timeout')), this.AI_TIMEOUT);
      })
    ]);

    console.log('✅ AI response received');
    console.log('📏 Response length:', response.content.length);
    console.log('🔍 First 1000 chars:', response.content.substring(0, 1000));
    console.log('🔍 Last 500 chars:', response.content.substring(response.content.length - 500));
    
    const parsed = this.parseProposalResponse(response.content, input);
    
    // CRITICAL: Log what we actually parsed
    console.log('✅ Parsed proposal structure:');
    console.log('  - projectOverview:', parsed.projectOverview?.substring(0, 100) + '...');
    console.log('  - scopeOfWork:', parsed.scopeOfWork?.substring(0, 100) + '...');
    console.log('  - pricing:', parsed.pricing?.substring(0, 100) + '...');
    console.log('  - timeline:', parsed.timeline?.substring(0, 100) + '...');
    console.log('  - deliverables:', parsed.deliverables?.substring(0, 100) + '...');
    console.log('  - contractTemplates.serviceAgreement:', parsed.contractTemplates?.serviceAgreement?.substring(0, 100) + '...');
    console.log('  - contractTemplates.statementOfWork:', parsed.contractTemplates?.statementOfWork?.substring(0, 100) + '...');
    
    parsed.metadata = {
      tokensUsed: response.usage.total_tokens,
      model: 'openai/gpt-4o',
      generatedAt: new Date().toISOString()
    };

    return parsed;
    
  } catch (error) {
    console.error('❌ AI generation failed:', error);
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
  console.log('📏 Content length:', content.length);
  
  try {
    let jsonString = this.extractJSONFromResponse(content);
    console.log('📦 Extracted JSON length:', jsonString.length);
    
    const parsed = JSON.parse(jsonString);
    
    // Log missing fields BEFORE validation
    const missingFields = this.getMissingFields(parsed);
    if (missingFields.length > 0) {
      console.error('❌ Missing fields in AI response:', missingFields);
      console.error('📄 Full parsed object keys:', Object.keys(parsed));
      
      // Log the actual content of each field
      for (const field of Object.keys(parsed)) {
        console.log(`  ${field}:`, typeof parsed[field], parsed[field]?.length || 'N/A');
      }
    }
    
    if (!this.validateProposalStructure(parsed)) {
      console.log('❌ Structure validation failed');
      throw new ProposalGenerationError('Invalid proposal structure from AI response');
    }

    return parsed;
  } catch (error) {
    console.error('❌ JSON parsing failed:', error);
    console.error('📄 Content sample:', content.substring(0, 2000));
    throw new ProposalGenerationError(
      'Failed to parse AI response into valid proposal structure',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// Add this helper method:
private getMissingFields(proposal: any): string[] {
  const required = [
    'projectOverview',
    'scopeOfWork', 
    'pricing',
    'timeline',
    'deliverables',
    'terms',
    'nextSteps',
    'contractTemplates',
    'alternativeOptions'
  ];
  
  return required.filter(field => {
    if (!proposal[field]) return true;
    if (typeof proposal[field] === 'string' && proposal[field].trim().length === 0) return true;
    if (field === 'contractTemplates') {
      return !proposal[field].serviceAgreement || !proposal[field].statementOfWork;
    }
    return false;
  });
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
      max_tokens: 16000
    });

    console.log('Raw alternatives response (first 1000 chars):', response.content.substring(0, 1000));
    
    const jsonString = this.extractJSONFromResponse(response.content);
    const alternatives = JSON.parse(jsonString);
    
    if (!Array.isArray(alternatives) || alternatives.length === 0) {
      throw new Error('Invalid alternatives format from AI: must be a non-empty array');
    }
    return alternatives;
    
  } catch (error) {
    console.error('AI alternatives generation failed:', error);
    throw new ProposalGenerationError(
      'Failed to generate alternative options. Please try again.',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}



private async generateRecommendationsAI(input: ProposalInput): Promise<string[]> {
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
      max_tokens: 16000
    });

    console.log('Raw recommendations response (first 1000 chars):', response.content.substring(0, 1000));
    
    const jsonString = this.extractJSONFromResponse(response.content);
    const recommendations = JSON.parse(jsonString);
    
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      throw new Error('Invalid recommendations format from AI');
    }
    return recommendations;
    
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
      max_tokens: 16000
    });

    console.log('Raw risk assessment response (first 1000 chars):', response.content.substring(0, 1000));
    
    const jsonString = this.extractJSONFromResponse(response.content);
    const riskAssessment = JSON.parse(jsonString);
    
    // Basic structure validation
    if (!riskAssessment.overallRisk || !riskAssessment.riskCategories || 
        !riskAssessment.mitigationPlan || !Array.isArray(riskAssessment.mitigationPlan)) {
      throw new Error('Invalid risk assessment structure from AI: missing required fields');
    }
    
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
      max_tokens: 16000
    });

    console.log('Raw competitive analysis response (first 1000 chars):', response.content.substring(0, 1000));
    
    const jsonString = this.extractJSONFromResponse(response.content);
    const competitiveAnalysis = JSON.parse(jsonString);
    
    // Basic structure validation
    if (!competitiveAnalysis.positioningAdvantages || !Array.isArray(competitiveAnalysis.positioningAdvantages) ||
        !competitiveAnalysis.marketBenchmarks || !competitiveAnalysis.marketBenchmarks.pricingRange ||
        typeof competitiveAnalysis.marketBenchmarks.pricingRange.min !== 'number' ||
        typeof competitiveAnalysis.marketBenchmarks.pricingRange.max !== 'number') {
      throw new Error('Invalid competitive analysis structure from AI: missing required fields');
    }
    return competitiveAnalysis;
    
  } catch (error) {
    console.error('AI competitive analysis generation failed:', error);
    throw new ProposalGenerationError(
      'Failed to generate competitive analysis. Please try again.',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}





private parseTimelineToWeeks(timeline: string): number {
  try {
    if (!timeline || typeof timeline !== 'string') {
      return 0;
    }

    // Clean the input string
    const cleanTimeline = timeline.toLowerCase().trim();
    
    // Enhanced regex to catch more patterns
    const timelineMatch = cleanTimeline.match(/(\d+(?:\.\d+)?)\s*[-–—]?\s*(\d+(?:\.\d+)?)?\s*(week|month|day|wk|mo|yr|year)s?/i);
    
    if (!timelineMatch) {
      // Try alternative patterns like "8-12 weeks" or "2-3 months"
      const rangeMatch = cleanTimeline.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*(week|month|day|wk|mo|yr|year)s?/i);
      if (rangeMatch) {
        const startValue = parseFloat(rangeMatch[1]);
        const endValue = parseFloat(rangeMatch[2]);
        const timeUnit = rangeMatch[3].toLowerCase();
        
        // Use average of range
        const avgValue = (startValue + endValue) / 2;
        return this.convertToWeeks(avgValue, timeUnit);
      }
      return 0;
    }
    
    const timeValue = parseFloat(timelineMatch[1]);
    const timeUnit = timelineMatch[3].toLowerCase();
    
    return this.convertToWeeks(timeValue, timeUnit);
    
  } catch (error) {
    console.warn('Error parsing timeline:', timeline, error);
    return 0;
  }
}

private convertToWeeks(value: number, unit: string): number {
  if (isNaN(value) || value <= 0) {
    return 0;
  }
  
  let timelineWeeks = value;
  
  switch (unit) {
    case 'month':
    case 'months':
    case 'mo':
      timelineWeeks *= 4.33; // More accurate weeks per month
      break;
    case 'day':
    case 'days':
      timelineWeeks /= 7;
      break;
    case 'year':
    case 'years':
    case 'yr':
      timelineWeeks *= 52;
      break;
    case 'week':
    case 'weeks':
    case 'wk':
    default:
      // Already in weeks
      break;
  }
  
  return Math.max(Math.round(timelineWeeks * 10) / 10, 0); // Round to 1 decimal place
}



// Safe utility method for filtering arrays
private safeFilterArray(arr: any[] | undefined): any[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => item && typeof item === 'string' && !this.isPlaceholder(item));
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
    console.log(`Starting export: userId=${userId}, proposalId=${proposalId}, format=${format}`);
    
    const proposal = await this.getProposal(userId, proposalId);
    if (!proposal) {
      console.error('Proposal not found:', { userId, proposalId });
      throw new ProposalGenerationError('Proposal not found or access denied');
    }

    console.log('Proposal found, checking data integrity...');
    
    // Check data integrity before export
    const hasMainContent = proposal.proposal?.proposal?.projectOverview || 
                          proposal.proposal?.proposal?.scopeOfWork ||
                          proposal.proposal?.proposal?.pricing;
    
    if (!hasMainContent) {
      console.warn('Proposal appears to have missing main content');
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
      console.log('Generating HTML content...');
      const htmlContent = this.generateHTMLExport(proposal);
      console.log('HTML content generated, length:', htmlContent.length);
      
      // Validate HTML has minimum content
      if (htmlContent.length < 1000) {
        console.warn('Generated HTML seems too short, may indicate missing data');
      }
      
      return {
        format: 'html',
        content: htmlContent,
        filename: `proposal-${clientName}.html`,
        mimeType: 'text/html'
      };
    }

    if (format === 'pdf') {
      console.log('Generating PDF content...');
      const htmlContent = this.generateHTMLExport(proposal);
      
      // Additional check for PDF generation
      if (htmlContent.includes('Export Error')) {
        throw new ProposalGenerationError('Cannot generate PDF due to data formatting issues. Try JSON export instead.');
      }
      
      const pdfBuffer = await this.generatePDFFromHTML(htmlContent);
      
      return {
        format: 'pdf',
        content: pdfBuffer,
        filename: `proposal-${clientName}.pdf`,
        mimeType: 'application/pdf'
      };
    }

    throw new ProposalGenerationError(`Unsupported export format: ${format}`);
    
  } catch (error) {
    console.error('Export service error:', error);
    console.error('Export error details:', {
      userId,
      proposalId,
      format,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack'
    });
    
    if (error instanceof ProposalGenerationError) {
      throw error;
    }
    throw new ProposalGenerationError(
      'Failed to export proposal', 
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

private async generatePDFFromHTML(htmlContent: string): Promise<Buffer> {
  const puppeteer = await import('puppeteer');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for fonts/styles to load
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Generate PDF with professional formatting
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; color: #666; text-align: center; width: 100%;">
          Business Proposal - Confidential
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; color: #666; text-align: center; width: 100%;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });
    
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new ProposalGenerationError('Failed to generate PDF', error instanceof Error ? error : new Error(String(error)));
  } finally {
    if (browser) {
      await browser.close();
    }
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
    const proposalContent = proposal.proposal?.proposal;
    const metadata = proposal.metadata || {};
    const originalInput = proposal.proposal?.originalInput;
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const clientName = metadata?.clientName || originalInput?.client?.legalName || 'Client Name';
    const totalValue = metadata?.totalValue || originalInput?.pricing?.totalAmount || 0;
    const providerName = originalInput?.serviceProvider?.name || 'Service Provider';
    const providerLegalName = originalInput?.serviceProvider?.legalName || providerName;
    const providerAddress = originalInput?.serviceProvider?.address || '[Service Provider Address]';
    const clientAddress = originalInput?.client?.address || '[Client Address]';
    const clientEntity = originalInput?.client?.entityType || 'Corporation';
    const signatoryName = originalInput?.serviceProvider?.signatoryName || '[Authorized Signatory]';
    const signatoryTitle = originalInput?.serviceProvider?.signatoryTitle || 'Authorized Representative';
    
    const serviceAgreement = proposalContent?.contractTemplates?.serviceAgreement || 
      this.generateDefaultServiceAgreement(providerName, providerLegalName, providerAddress, clientName, clientAddress, clientEntity, currentDate);
    
    const statementOfWork = proposalContent?.contractTemplates?.statementOfWork || 
      this.generateDefaultSOW(providerName, clientName, proposalContent, originalInput, currentDate);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Proposal - ${this.escapeHtml(clientName)}</title>
    <style>
        @page { margin: 0.75in; size: letter; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            background: #fff;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
        }
        .document-title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin: 20px 0 10px 0;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
        }
        .content {
            text-align: justify;
            margin: 10px 0;
            white-space: pre-wrap;
        }
        .signature-block {
            margin-top: 60px;
            page-break-inside: avoid;
        }
        .signature-container {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            gap: 40px;
        }
        .signature-box {
            flex: 1;
            min-width: 250px;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin: 40px 0 5px 0;
            padding-top: 5px;
        }
        .signature-label {
            font-size: 10pt;
            margin: 3px 0;
        }
        .page-break {
            page-break-before: always;
            margin-top: 40px;
        }
        .legal-text {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            white-space: pre-wrap;
            line-height: 1.5;
        }
        .contract-header {
            text-align: center;
            margin: 20px 0;
            font-size: 16pt;
            font-weight: bold;
        }
        .proposal-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            border-bottom: 3px solid #000;
        }
        .proposal-metadata {
            text-align: right;
            font-size: 10pt;
            color: #666;
            margin-bottom: 20px;
        }
        @media print {
            body { padding: 0; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <!-- BUSINESS PROPOSAL HEADER -->
    <div class="proposal-header">
        <div class="document-title">BUSINESS PROPOSAL</div>
        <div style="font-size: 14pt; margin-top: 10px;">For ${this.escapeHtml(clientName)}</div>
        <div class="proposal-metadata">
            Prepared by ${this.escapeHtml(providerName)}<br>
            ${currentDate}<br>
            Total Investment: $${totalValue.toLocaleString()}
        </div>
    </div>

    <!-- EXECUTIVE SUMMARY (if included) -->
    ${proposalContent?.executiveSummary ? `
    <div class="section-title">EXECUTIVE SUMMARY</div>
    <div class="content">${this.escapeHtml(proposalContent.executiveSummary)}</div>
    ` : ''}

    <!-- PROJECT OVERVIEW -->
    <div class="section-title">PROJECT OVERVIEW</div>
    <div class="content">${this.escapeHtml(proposalContent?.projectOverview || 'Project overview not available')}</div>

    <!-- SCOPE OF WORK -->
    <div class="section-title">SCOPE OF WORK</div>
    <div class="content">${this.escapeHtml(proposalContent?.scopeOfWork || 'Scope details not available')}</div>

    <!-- DELIVERABLES -->
    <div class="section-title">DELIVERABLES</div>
    <div class="content">${this.escapeHtml(proposalContent?.deliverables || 'Deliverables not specified')}</div>

    <!-- TIMELINE -->
    <div class="section-title">PROJECT TIMELINE</div>
    <div class="content">${this.escapeHtml(proposalContent?.timeline || 'Timeline not specified')}</div>

    <!-- INVESTMENT & PRICING -->
    <div class="section-title">INVESTMENT & PRICING</div>
    <div class="content">${this.escapeHtml(proposalContent?.pricing || 'Pricing details not available')}</div>

    <!-- TERMS & CONDITIONS -->
    <div class="section-title">TERMS & CONDITIONS</div>
    <div class="content">${this.escapeHtml(proposalContent?.terms || 'Terms not specified')}</div>

    <!-- NEXT STEPS -->
    <div class="section-title">NEXT STEPS</div>
    <div class="content">${this.escapeHtml(proposalContent?.nextSteps || 'Next steps not specified')}</div>

    <!-- SERVICE AGREEMENT (NEW PAGE) -->
    <div class="page-break"></div>
    <div class="document-title">SERVICE AGREEMENT</div>
    
    <div class="legal-text">${this.escapeHtml(serviceAgreement)}</div>
    
    <div class="signature-block">
        <p style="font-weight: bold; margin-bottom: 30px;">IN WITNESS WHEREOF, the Parties have executed this Service Agreement as of the Effective Date.</p>
        
        <div class="signature-container">
            <div class="signature-box">
                <div><strong>${this.escapeHtml(providerName).toUpperCase()}</strong></div>
                ${providerLegalName !== providerName ? `<div>${this.escapeHtml(providerLegalName)}</div>` : ''}
                <div class="signature-line"></div>
                <div class="signature-label">By: _________________________</div>
                <div class="signature-label">Name: ${this.escapeHtml(signatoryName)}</div>
                <div class="signature-label">Title: ${this.escapeHtml(signatoryTitle)}</div>
                <div class="signature-label">Date: _________________________</div>
            </div>
            
            <div class="signature-box">
                <div><strong>${this.escapeHtml(clientName).toUpperCase()}</strong></div>
                <div class="signature-line"></div>
                <div class="signature-label">By: _________________________</div>
                <div class="signature-label">Name: _________________________</div>
                <div class="signature-label">Title: _________________________</div>
                <div class="signature-label">Date: _________________________</div>
            </div>
        </div>
    </div>

    <!-- STATEMENT OF WORK (NEW PAGE) -->
    <div class="page-break"></div>
    <div class="contract-header">SCHEDULE A<br>STATEMENT OF WORK</div>
    
    <div class="legal-text">${this.escapeHtml(statementOfWork)}</div>
    
    <div class="signature-block">
        <p style="font-weight: bold; margin-bottom: 30px;">IN WITNESS WHEREOF, the Parties have executed this Statement of Work.</p>
        
        <div class="signature-container">
            <div class="signature-box">
                <div><strong>${this.escapeHtml(providerName).toUpperCase()}</strong></div>
                <div class="signature-line"></div>
                <div class="signature-label">By: _________________________</div>
                <div class="signature-label">Name: ${this.escapeHtml(signatoryName)}</div>
                <div class="signature-label">Title: ${this.escapeHtml(signatoryTitle)}</div>
                <div class="signature-label">Date: _________________________</div>
            </div>
            
            <div class="signature-box">
                <div><strong>${this.escapeHtml(clientName).toUpperCase()}</strong></div>
                <div class="signature-line"></div>
                <div class="signature-label">By: _________________________</div>
                <div class="signature-label">Name: _________________________</div>
                <div class="signature-label">Title: _________________________</div>
                <div class="signature-label">Date: _________________________</div>
            </div>
        </div>
    </div>
</body>
</html>`;
  } catch (error) {
    console.error('HTML generation error:', error);
    throw new ProposalGenerationError('Failed to generate HTML export');
  }
}


// Add these helper methods for fallback contracts:

private generateDefaultServiceAgreement(provider: string, providerLegal: string, providerAddr: string, client: string, clientAddr: string, clientEntity: string, date: string): string {
  return `This Service Agreement (the "Agreement") is entered into as of ${date} (the "Effective Date"), by and between:

${provider}, ${providerLegal ? `${providerLegal}, ` : ''}with its principal place of business at ${providerAddr} ("Service Provider"),

and

${client}, a ${clientEntity} with its principal place of business at ${clientAddr} ("Client").

Together referred to as the "Parties" and individually as a "Party."

1. SERVICES

1.1 Scope of Services.
Service Provider shall provide the services set forth in the attached Statement of Work.

1.2 Standard of Performance.
Service Provider shall perform the Services in a professional and workmanlike manner consistent with industry standards.

2. TERM

This Agreement shall commence on the Effective Date and continue until completion of services or earlier termination.

3. FEES & PAYMENT

3.1 Fees.
Client shall pay Service Provider the fees set forth in the Statement of Work.

3.2 Payment Terms.
Payment shall be made according to the schedule outlined in the Statement of Work.

4. INTELLECTUAL PROPERTY

All deliverables created specifically for Client under this Agreement shall be deemed "work made for hire" and owned by Client upon full payment.

5. CONFIDENTIALITY

Each Party agrees to maintain in strict confidence any non-public, proprietary, or confidential information disclosed by the other Party.

6. TERMINATION

Either Party may terminate upon thirty (30) days' written notice.

7. GOVERNING LAW

This Agreement shall be governed by and construed under the laws of Delaware.`;
}

private generateDefaultSOW(provider: string, client: string, content: any, input: any, date: string): string {
  const description = content?.projectOverview || input?.project?.description || 'Professional services as agreed';
  const scope = content?.scopeOfWork || 'Services to be performed as outlined in this agreement';
  const timeline = content?.timeline || input?.project?.timeline || 'To be determined';
  const pricing = content?.pricing || `Total: $${input?.pricing?.totalAmount?.toLocaleString() || '0'}`;
  
  return `This Statement of Work ("SOW") is issued pursuant to the Service Agreement entered into between ${provider} ("Service Provider") and ${client} ("Client").

1. Project Description

${description}

2. Scope of Services

${scope}

3. Timeline & Milestones

${timeline}

4. Fees & Payment

${pricing}

5. Acceptance Criteria

Deliverables shall be deemed accepted upon Client's written approval or five (5) business days after delivery if no objections are raised.`;
}


// Add this helper method for missing contract sections
private generateMissingContractSection(title: string): string {
  return `
        <div class="contract-section">
            <h2>${this.escapeHtml(title)}</h2>
            <div class="warning-box">
                <h3>⚠️ Contract Template Missing</h3>
                <p>The ${title} template was not generated during proposal creation. This may occur if:</p>
                <ul>
                    <li>The AI generation was interrupted</li>
                    <li>There was insufficient context to generate legal documents</li>
                    <li>The proposal was created with incomplete data</li>
                </ul>
                <p><strong>Recommended Action:</strong> Regenerate the proposal with complete information to include all contract templates.</p>
                <p><strong>Alternative:</strong> Contact support to obtain standard ${title} templates for your industry.</p>
            </div>
        </div>`;
}


// Add this helper method for better error handling
private generateErrorHTML(error: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export Error</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .error-container { max-width: 600px; margin: 0 auto; }
        .error-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; }
        .error-title { color: #721c24; font-size: 24px; margin-bottom: 10px; }
        .error-message { color: #721c24; margin-bottom: 20px; }
        .suggestions { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; }
        .suggestions h3 { color: #0c5460; margin-top: 0; }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-box">
            <h1 class="error-title">🚫 Export Error</h1>
            <p class="error-message">Unable to generate PDF due to data formatting issues.</p>
            <p><strong>Error Details:</strong> ${this.escapeHtml(error?.message || 'Unknown error')}</p>
        </div>
        
        <div class="suggestions">
            <h3>💡 Suggestions to Fix This Issue:</h3>
            <ul>
                <li>Try regenerating the proposal with complete information</li>
                <li>Ensure all required fields are filled before generation</li>
                <li>Contact support if the issue persists</li>
                <li>Try exporting as JSON format as an alternative</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
}


private generatePDFSection(title: string, content?: string): string {
  // Skip empty sections entirely
  if (!content || content.trim() === '' || content === 'Content not available') {
    return '';
  }
  
  return `
        <div class="section no-break">
            <h2>${this.escapeHtml(title)}</h2>
            <div>${this.formatContentForPDF(content)}</div>
        </div>`;
}


private generatePDFContractSection(title: string, content?: string): string {
  if (!content || content.trim() === '') {
    return this.generateMissingContractSection(title);
  }
  
  return `
        <div class="contract-section">
            <h2>${this.escapeHtml(title)}</h2>
            <div class="contract-content">${this.escapeHtml(content)}</div>
        </div>`;
} 


private formatContentForPDF(content: string): string {
  if (!content || content.trim() === '') {
    return '<p>Content not available.</p>';
  }
  
  return this.escapeHtml(content)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/•/g, '&bull;')
    .replace(/^\s*/, '<p>')
    .replace(/\s*$/, '</p>');
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


