// services/offerCreator.service.ts - COMPLETELY ENHANCED VERSION
import { Redis } from '@upstash/redis';
import { 
  OfferCreatorInput, 
  GeneratedOffer, 
  GeneratedOfferPackage, 
  OfferAnalysis,
  OptimizationType,
  OptimizationResult,
  PerformanceData,
  OfferPerformance,
  UserOffer,
  GuaranteeType
} from '@/types/offerCreator';
import { generateCacheKey } from '../app/validators/offerCreator.validator';
import { OpenRouterClient } from '@/lib/openrouter';

export class OfferCreatorService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;

  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }


async generateOffer(input: OfferCreatorInput): Promise<GeneratedOfferPackage> {
  const startTime = Date.now();

  // Check cache first with proper error handling
  const cacheKey = generateCacheKey(input);
  try {
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      if (typeof cached === 'string') {
        return JSON.parse(cached);
      } else if (typeof cached === 'object' && cached !== null) {
        return cached as GeneratedOfferPackage;
      }
    }
  } catch (cacheError) {
    console.warn('Cache retrieval/parsing error, proceeding with fresh generation:', cacheError);
    await this.redis.del(cacheKey).catch(() => {});
  }

  const prompt = this.buildEnhancedOfferPrompt(input);

  try {
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: `You are an elite business strategist who creates breakthrough signature offers for service businesses. Your offers are known for their specificity, compelling outcomes, and strong guarantees that convert prospects into premium clients.

CRITICAL SUCCESS FACTORS:
1. CONCRETE DELIVERABLES: Never use vague terms like "strategy" or "plan" - specify exactly what tangible assets or measurable actions the client receives
2. OUTCOME-FOCUSED NAMING: Names should promise transformation, not just describe service tiers
3. QUANTIFIED GUARANTEES: Tie guarantees to specific, measurable deliverables or outcomes
4. PAIN-SOLUTION ALIGNMENT: Directly address stated customer pains with specific solutions
5. VALUE JUSTIFICATION: Pricing must align with the tangible value and scope of deliverables

Your goal is to create offers that make prospects think "I need this" immediately upon reading them.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 6000
    });

    const parsedOffer = this.parseOfferResponse(response.content, input);
    const analysis = this.generateOfferAnalysis(input, parsedOffer);

    // FIXED: Create the flat structure that matches your actual API response
    const offerPackage: GeneratedOfferPackage = {
      // Direct properties (not nested under primaryOffer)
      signatureOffers: parsedOffer.signatureOffers,
      comparisonTable: parsedOffer.comparisonTable,
      pricing: parsedOffer.pricing,
      analysis,
      tokensUsed: response.usage.total_tokens,
      generationTime: Date.now() - startTime,
      originalInput: input // Add this for loading saved offers
    };

    // Cache for 4 hours with proper error handling
    try {
      await this.redis.set(cacheKey, JSON.stringify(offerPackage), { ex: 14400 });
    } catch (cacheSetError) {
      console.warn('Failed to cache offer, but generation succeeded:', cacheSetError);
    }

    return offerPackage;
  } catch (error) {
    console.error('Error generating offer:', error);
    throw new Error('Failed to generate offer. Please try again.');
  }
}


  private buildEnhancedOfferPrompt(input: OfferCreatorInput): string {
    // Calculate pricing targets
    const targetACV = this.parseACV(input.business.acv);
    const starterPrice = Math.round(targetACV * 0.65 / 12);
    const corePrice = Math.round(targetACV / 12);
    const premiumPrice = Math.round(targetACV * 1.75 / 12);

    // Generate specific examples based on industry
    const industryExamples = this.getIndustrySpecificExamples(input.founder.industries[0]);

    return `
# SIGNATURE OFFER CREATION BRIEF

## CLIENT PROFILE
**Target Market:** ${input.market.targetMarket}
**Buyer Role:** ${input.market.buyerRole}
**Top Customer Pains:** ${input.market.pains.join(' | ')}
**Desired Outcomes:** ${input.market.outcomes.join(' | ')}

## FOUNDER EXPERTISE
**Signature Results:** ${input.founder.signatureResults.join(' | ')}
**Core Strengths:** ${input.founder.coreStrengths.join(' | ')}
**Proven Processes:** ${input.founder.processes.join(' | ')}
**Industries:** ${input.founder.industries.join(' | ')}

## BUSINESS PARAMETERS
**Delivery Models:** ${input.business.deliveryModel.join(' | ')}
**Capacity:** ${input.business.capacity} clients
**Monthly Hours:** ${input.business.monthlyHours} hours
**Target ACV:** ${input.business.acv}
**Price Posture:** ${input.pricing.pricePosture}
**Brand Tone:** ${input.voice.brandTone}
**Positioning:** ${input.voice.positioning}
**Differentiators:** ${input.voice.differentiators.join(' | ')}

---

# TASK: CREATE THREE WORLD-CLASS SIGNATURE OFFERS

## SUCCESS CRITERIA (MANDATORY):

### 1. OFFER NAMING FORMULA
- **Starter:** "The [Industry/Target] [Outcome] Kickstart" or "The [Problem Solution] Foundation"
- **Core:** "The [Industry/Target] [Outcome] Engine/Machine/System" 
- **Premium:** "The [Timeframe] [Transformation] Build" or "The [Industry] Excellence Program"

**Examples:**
- ✅ "The AgTech Lead Generation Engine"
- ✅ "The 90-Day Revenue Infrastructure Build" 
- ❌ "Starter Package" or "Premium Service"

### 2. DELIVERABLE SPECIFICITY REQUIREMENTS

**INSTEAD OF VAGUE TERMS:**
- ❌ "Strategy development"
- ❌ "Process optimization" 
- ❌ "Implementation support"
- ❌ "Consultation services"

**USE CONCRETE DELIVERABLES:**
- ✅ "75 targeted prospect emails + 25 LinkedIn messages sent daily"
- ✅ "Setup and management of 3 paid advertising channels (Facebook, Google, LinkedIn)"
- ✅ "Delivery of 5 custom sales scripts with objection handling responses"
- ✅ "Implementation of CRM with 7 automated follow-up sequences"
- ✅ "90-day content calendar with 30 ready-to-post pieces"

${industryExamples}

### 3. GUARANTEE STRUCTURE (MANDATORY)
Each tier MUST have a specific, measurable guarantee:

**Starter Example:** "Deliver 500 qualified prospect contacts and 2 tested outreach templates, or first week free"
**Core Example:** "Generate 15+ qualified meetings within 60 days, or provide 20 hours of free optimization"  
**Premium Example:** "Complete system deployment within 90 days with documented SOPs, or 25% refund"

### 4. OUTCOME QUANTIFICATION
- Specify WHAT metric improves by HOW MUCH in WHAT timeframe
- ✅ "Increase qualified lead flow by 40% within 8 weeks"
- ✅ "Reduce customer acquisition cost by $200 per customer"
- ❌ "Improve operational efficiency by 20%" (too vague)

### 5. PRICING JUSTIFICATION
- **Starter:** $${starterPrice.toLocaleString()}/month (Entry-level, specific deliverables)
- **Core:** $${corePrice.toLocaleString()}/month (Comprehensive system)
- **Premium:** $${premiumPrice.toLocaleString()}/month (Transformation/build project)

---

## OUTPUT FORMAT (STRICT JSON):

\`\`\`json
{
  "signatureOffers": {
    "starter": {
      "name": "[Compelling transformation-focused name]",
      "for": "[Highly specific ideal client description with role, company stage, and immediate trigger]",
      "promise": "[Specific promise addressing one key pain and delivering one clear outcome]",
      "scope": [
        "[Specific deliverable with quantities - e.g., 'Deploy 2 automated email sequences with 5 messages each']",
        "[Tangible asset creation - e.g., 'Create 20 targeted prospect lists with contact details']", 
        "[Measurable activity - e.g., 'Conduct 4 weekly optimization sessions with performance reports']"
      ],
      "proof": [
        "[Specific relevant result from founder background]",
        "[Relevant process or methodology]",
        "[Industry-specific credential or experience]"
      ],
      "timeline": "[Realistic timeframe for core deliverables]",
      "milestones": [
        "[Week/Month X: Specific deliverable completed - e.g., 'Week 1: First 200 prospects identified and outreach launched']",
        "[Week/Month Y: Measurable outcome - e.g., 'Week 3: First optimization report showing 15% improvement']",
        "[Week/Month Z: Final deliverable - e.g., 'Week 4: Complete system handover with training materials']"
      ],
      "pricing": "$${starterPrice.toLocaleString()}/month",
      "term": "${input.pricing.contractStyle}",
      "guarantee": "[Specific guarantee tied to deliverables - e.g., 'Deliver X within Y days or Z consequence']",
      "clientLift": "[Specific, measurable outcome with metric and timeframe]",
      "requirements": "[Specific items client must provide for success]"
    },
    "core": {
      "name": "[Engine/System/Machine name promising comprehensive solution]",
      "for": "[Specific client type ready for full transformation]",
      "promise": "[Comprehensive promise addressing multiple pains with integrated solution]",
      "scope": [
        "[Multiple channel/system management with specifics]",
        "[Regular deliverables with quantities and frequency]",
        "[Optimization activities with measurable targets]",
        "[Asset creation with specific outputs]"
      ],
      "proof": "[Enhanced proof elements]",
      "timeline": "[90-120 day comprehensive timeline]",
      "milestones": "[Month-by-month deliverable milestones]",
      "pricing": "$${corePrice.toLocaleString()}/month",
      "term": "${input.pricing.contractStyle}",
      "guarantee": "[Stronger guarantee with performance metrics]",
      "clientLift": "[Significant measurable improvement 30-50%]",
      "requirements": "[Enhanced client commitment requirements]"
    },
    "premium": {
      "name": "[Build/Program/Transformation name for strategic engagement]",
      "for": "[High-growth organizations seeking market leadership]",
      "promise": "[Transformational promise with industry-leading outcomes]",
      "scope": [
        "[White-glove system building with specific components]",
        "[Strategic advisory with defined frequency and outputs]",
        "[Team training with specific curriculum and materials]",
        "[Custom development with measurable deliverables]",
        "[Ongoing optimization with performance guarantees]"
      ],
      "proof": "[Elite-level proof and positioning]",
      "timeline": "[6-12 month strategic timeline]",
      "milestones": "[Quarter-by-quarter transformation milestones]",
      "pricing": "$${premiumPrice.toLocaleString()}/month",
      "term": "${input.pricing.contractStyle === 'project' ? 'Project-based engagement' : input.pricing.contractStyle + ' with quarterly reviews'}",
      "guarantee": "[Premium guarantee with outcome assurance or extension]",
      "clientLift": "[Transformational outcome 50-100% improvement or market leadership]",
      "requirements": "[Executive-level commitment and resources]"
    }
  },
  "comparisonTable": {
    "features": [
      {"name": "Core Deliverable Type", "starter": "[Specific starter deliverable]", "core": "[Comprehensive core deliverable]", "premium": "[Strategic premium deliverable]"},
      {"name": "Activity Volume", "starter": "[Specific quantities]", "core": "[Higher volume/frequency]", "premium": "[Maximum volume + custom]"},
      {"name": "System Complexity", "starter": "Basic Setup", "core": "Multi-Channel Integration", "premium": "Custom Infrastructure"},
      {"name": "Support Level", "starter": "Guided Implementation", "core": "Hands-on Management", "premium": "White-glove Partnership"},
      {"name": "Reporting Frequency", "starter": "Weekly", "core": "Daily + Weekly Analysis", "premium": "Real-time + Strategic Reviews"},
      {"name": "Guarantee Strength", "starter": "[Deliverable guarantee]", "core": "[Performance guarantee]", "premium": "[Outcome or refund guarantee]"},
      {"name": "Team Training", "starter": "Basic Handover", "core": "Process Training", "premium": "Comprehensive Certification"},
      {"name": "Strategic Input", "starter": "Templates", "core": "Custom Strategy", "premium": "Executive Advisory"}
    ]
  },
  "pricing": {
    "starter": "$${starterPrice.toLocaleString()}/month",
    "core": "$${corePrice.toLocaleString()}/month", 
    "premium": "$${premiumPrice.toLocaleString()}/month"
  }
}
\`\`\`

## FINAL VALIDATION CHECKLIST:
- ✅ Names are outcome-focused, not tier-focused
- ✅ Scope items are specific, measurable deliverables
- ✅ Guarantees are tied to concrete outputs or metrics
- ✅ Client lift specifies exact metrics and timeframes
- ✅ Each offer solves different scales of the same core problem
- ✅ Pricing aligns with deliverable complexity and value
- ✅ Milestones are outcome-based, not process-based

Generate offers that make prospects immediately understand the value and want to buy.`;
  }

  private getIndustrySpecificExamples(industry: string): string {
    const examples: Record<string, string> = {
      'healthcare': `
### HEALTHCARE-SPECIFIC DELIVERABLE EXAMPLES:
- "Setup patient appointment booking system processing 200+ appointments/month"
- "Create 5 patient education video series with follow-up email sequences"  
- "Implement patient retention system with 3 automated touchpoint campaigns"
- "Deploy telehealth platform with scheduling and payment integration"
- "Generate 15 qualified patient leads per week through targeted local advertising"`,

      'agtech': `
### AGTECH-SPECIFIC DELIVERABLE EXAMPLES:
- "Identify and contact 500 qualified farm decision-makers per month"
- "Create agribusiness-specific sales presentations for 3 crop seasons"
- "Deploy farmer education content series with 12 seasonal topics"
- "Setup GPS territory mapping system for 200-mile sales radius"
- "Generate 25 qualified agribusiness meetings per month"`,

      'marketing': `
### MARKETING AGENCY DELIVERABLE EXAMPLES:
- "Launch and manage 4 client acquisition channels generating 30 leads/month"
- "Create 50-piece content library with templates and automation"
- "Deploy client retention system reducing churn by 40%"
- "Setup project management system handling 20+ concurrent campaigns"
- "Generate $100k in new monthly recurring revenue within 90 days"`,

      'saas': `
### SAAS-SPECIFIC DELIVERABLE EXAMPLES:
- "Deploy lead scoring system processing 1,000+ prospects monthly"
- "Create 8-sequence product demo and trial conversion system"
- "Launch integration marketplace connecting to 15 popular tools"
- "Implement customer success program reducing churn by 30%"
- "Generate 200 qualified demo requests per month"`,

      'ecommerce': `
### ECOMMERCE-SPECIFIC DELIVERABLE EXAMPLES:
- "Launch 3-channel advertising system generating 4x ROAS minimum"
- "Deploy abandoned cart recovery system capturing 25% of lost sales"
- "Create customer lifecycle email system with 12 automated sequences"
- "Setup inventory management system with demand forecasting"
- "Generate 40% increase in average order value within 60 days"`,

      'finance': `
### FINANCE-SPECIFIC DELIVERABLE EXAMPLES:
- "Deploy compliance automation system processing 500+ applications monthly"
- "Create risk assessment framework with 15 evaluation criteria"
- "Launch referral partner network generating 50 qualified leads/month"
- "Setup client onboarding system reducing processing time by 60%"
- "Generate 30% increase in qualified loan applications"`
    };

    return examples[industry.toLowerCase()] || `
### INDUSTRY-SPECIFIC DELIVERABLE EXAMPLES:
- "Deploy automated lead generation system producing 100+ qualified prospects monthly"
- "Create sales process automation handling 50+ opportunities simultaneously"
- "Launch customer retention program reducing churn by 25%"
- "Setup performance tracking dashboard with 10 key business metrics"
- "Generate 35% increase in monthly recurring revenue within 90 days"`;
  }

  private parseOfferResponse(content: string, input: OfferCreatorInput): GeneratedOffer {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonString);
        
        // Validate required structure
        if (this.validateOfferStructure(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to parse AI JSON response, using enhanced fallback');
    }

    // Enhanced fallback generation
    return this.generateEnhancedFallbackOffer(input);
  }

  private validateOfferStructure(offer: any): boolean {
    return (
      offer &&
      offer.signatureOffers &&
      offer.signatureOffers.starter &&
      offer.signatureOffers.core &&
      offer.signatureOffers.premium &&
      offer.comparisonTable &&
      offer.pricing
    );
  }

private generateEnhancedFallbackOffer(input: OfferCreatorInput): GeneratedOffer {
  const targetACV = this.parseACV(input.business.acv);
  const starterPrice = Math.round(targetACV * 0.65 / 12);
  const corePrice = Math.round(targetACV / 12);
  const premiumPrice = Math.round(targetACV * 1.75 / 12);

  const primaryIndustry = input.founder.industries[0] || 'Business';
  const primaryPain = input.market.pains[0] || 'operational inefficiency';
  const primaryOutcome = input.market.outcomes[0] || 'improved performance';
  const primaryStrength = input.founder.coreStrengths[0] || 'consulting';

  // Generate industry-specific deliverables
  const deliverables = this.generateIndustryDeliverables(primaryIndustry, input);

  // FIXED: Return the flat structure instead of nested under primaryOffer
  return {
    signatureOffers: {
      starter: {
        name: `The ${primaryIndustry} ${primaryOutcome.split(' ')[0]} Kickstart`,
        for: `${input.market.targetMarket} ${input.market.buyerRole}s who need to quickly address ${primaryPain} without overwhelming their current operations`,
        promise: `Eliminate ${primaryPain} with a proven system that delivers measurable ${primaryOutcome} within 30 days`,
        scope: [
          deliverables.starter.primary,
          deliverables.starter.secondary,
          deliverables.starter.support
        ],
        proof: [
          input.founder.signatureResults[0] || `Documented success in ${primaryIndustry}`,
          `Proven ${primaryStrength} methodology`,
          `${input.founder.industries.length} industry specialization`
        ],
        timeline: '30-45 days for core deliverables',
        milestones: [
          `Week 1: ${deliverables.starter.milestone1}`,
          `Week 2: ${deliverables.starter.milestone2}`,
          `Week 4: ${deliverables.starter.milestone3}`
        ],
        pricing: `$${starterPrice.toLocaleString()}/month`,
        term: input.pricing.contractStyle,
        guarantee: this.generateSpecificGuarantee(input.pricing.guarantee, 'starter', deliverables.starter.guarantee),
        clientLift: `Achieve ${deliverables.starter.outcome} within 45 days`,
        requirements: 'Access to current systems, 2 hours weekly for implementation calls'
      },
      core: {
        name: `The ${primaryIndustry} ${primaryOutcome.split(' ')[0]} Engine`,
        for: `Established ${input.market.targetMarket} organizations ready to systematically transform ${primaryPain} into sustainable competitive advantage`,
        promise: `Build a complete ${primaryOutcome} system that runs automatically while delivering consistent, measurable results`,
        scope: [
          deliverables.core.primary,
          deliverables.core.secondary,
          deliverables.core.optimization,
          deliverables.core.support
        ],
        proof: [
          input.founder.signatureResults[0] || `Multiple success stories in ${primaryIndustry}`,
          input.founder.signatureResults[1] || 'Proven transformation methodology',
          `Advanced ${primaryStrength} certification`
        ],
        timeline: '90 days for complete system deployment',
        milestones: [
          `Month 1: ${deliverables.core.milestone1}`,
          `Month 2: ${deliverables.core.milestone2}`,
          `Month 3: ${deliverables.core.milestone3}`
        ],
        pricing: `$${corePrice.toLocaleString()}/month`,
        term: input.pricing.contractStyle,
        guarantee: this.generateSpecificGuarantee(input.pricing.guarantee, 'core', deliverables.core.guarantee),
        clientLift: `Achieve ${deliverables.core.outcome} within 90 days`,
        requirements: 'Dedicated team member, full data access, weekly strategy sessions'
      },
      premium: {
        name: `The 180-Day ${primaryIndustry} Excellence Build`,
        for: `High-growth ${input.market.targetMarket} leaders seeking to establish market dominance through superior ${primaryOutcome} capabilities`,
        promise: `Build and deploy a custom ${primaryOutcome} infrastructure that positions your organization as the industry leader`,
        scope: [
          deliverables.premium.strategic,
          deliverables.premium.implementation,
          deliverables.premium.optimization,
          deliverables.premium.training,
          deliverables.premium.ongoing
        ],
        proof: [
          input.founder.signatureResults[0] || `C-level advisory experience in ${primaryIndustry}`,
          'White-glove transformation expertise',
          'Industry-leading methodology development'
        ],
        timeline: '6 months for complete transformation',
        milestones: [
          `Month 1-2: ${deliverables.premium.milestone1}`,
          `Month 3-4: ${deliverables.premium.milestone2}`,
          `Month 5-6: ${deliverables.premium.milestone3}`
        ],
        pricing: `$${premiumPrice.toLocaleString()}/month`,
        term: input.pricing.contractStyle === 'project' ? 'Project-based engagement' : `${input.pricing.contractStyle} with quarterly reviews`,
        guarantee: this.generateSpecificGuarantee(input.pricing.guarantee, 'premium', deliverables.premium.guarantee),
        clientLift: `Achieve ${deliverables.premium.outcome} and establish market leadership position`,
        requirements: 'Executive sponsorship, dedicated project team, comprehensive data access'
      }
    },
    comparisonTable: {
      features: [
        { name: 'System Scope', starter: 'Single Channel Focus', core: 'Multi-Channel Integration', premium: 'Custom Infrastructure Build' },
        { name: 'Implementation Speed', starter: '30-45 days', core: '90 days', premium: '180 days (strategic)' },
        { name: 'Deliverable Volume', starter: deliverables.comparison.volume.starter, core: deliverables.comparison.volume.core, premium: deliverables.comparison.volume.premium },
        { name: 'Support Level', starter: 'Guided Setup', core: 'Hands-on Management', premium: 'White-glove Partnership' },
        { name: 'Optimization Frequency', starter: 'Monthly', core: 'Weekly', premium: 'Real-time + Strategic' },
        { name: 'Team Training', starter: 'Basic Handover', core: 'Process Training', premium: 'Comprehensive Certification' },
        { name: 'Strategic Input', starter: 'Templates & Guides', core: 'Custom Strategy', premium: 'Executive Advisory' },
        { name: 'Guarantee Level', starter: 'Deliverable-based', core: 'Performance-based', premium: 'Outcome-based' }
      ]
    },
    pricing: {
      starter: `$${starterPrice.toLocaleString()}/month`,
      core: `$${corePrice.toLocaleString()}/month`,
      premium: `$${premiumPrice.toLocaleString()}/month`
    }
  };
}

  private generateIndustryDeliverables(industry: string, input: OfferCreatorInput) {
    const capacity = parseInt(input.business.capacity) || 10;
    const monthlyHours = parseInt(input.business.monthlyHours) || 160;
    
    // Base deliverable calculations
    const baseVolume = Math.min(100, capacity * 10);
    const coreVolume = baseVolume * 2;
    const premiumVolume = baseVolume * 3;

    const templates: Record<string, any> = {
      healthcare: {
        starter: {
          primary: `Setup patient acquisition system generating ${baseVolume} qualified leads monthly`,
          secondary: 'Deploy automated appointment booking with 3 reminder sequences',
          support: 'Create 5 patient education templates with follow-up workflows',
          milestone1: 'Patient tracking system live with first 50 contacts',
          milestone2: 'Booking automation active and processing appointments',
          milestone3: 'Complete system handover with performance report',
          outcome: '30% increase in new patient bookings',
          guarantee: `${baseVolume} qualified patient leads monthly`
        },
        core: {
          primary: `Manage complete patient acquisition system generating ${coreVolume} leads monthly`,
          secondary: 'Deploy retention system with automated patient lifecycle management',
          optimization: 'Weekly performance optimization with conversion rate improvements',
          support: 'Monthly strategy sessions with growth planning',
          milestone1: 'Multi-channel patient acquisition system deployment',
          milestone2: 'Retention automation and lifecycle management active',
          milestone3: 'Performance optimization delivering target metrics',
          outcome: '50% increase in patient lifetime value',
          guarantee: `${coreVolume} leads monthly or 20 hours free optimization`
        },
        premium: {
          strategic: `Build custom patient ecosystem generating ${premiumVolume} monthly leads`,
          implementation: 'Deploy integrated practice management with predictive analytics',
          optimization: 'Real-time performance monitoring with daily optimizations',
          training: 'Comprehensive staff training with certification program',
          ongoing: '24/7 system monitoring with quarterly strategic reviews',
          milestone1: 'Custom infrastructure design and foundation build',
          milestone2: 'Full ecosystem deployment with staff certification',
          milestone3: 'Performance validation and market leadership establishment',
          outcome: '100% increase in practice revenue',
          guarantee: 'Achieve industry-leading metrics or 6-month extension'
        },
        comparison: {
          volume: {
            starter: `${baseVolume} leads/month`,
            core: `${coreVolume} leads/month`,
            premium: `${premiumVolume} leads/month + custom`
          }
        }
      },
      // Add similar detailed templates for other industries
      agtech: {
        starter: {
          primary: `Deploy targeted outreach system contacting ${baseVolume} qualified agribusiness decision-makers monthly`,
          secondary: 'Create 5 season-specific sales presentations with farmer ROI calculators',
          support: 'Setup CRM with agricultural contact scoring and follow-up automation',
          milestone1: 'Farm database compiled and first 200 contacts made',
          milestone2: 'Sales materials deployed and first meetings scheduled',
          milestone3: 'Complete system handover with territory mapping',
          outcome: '40% increase in qualified farm meetings',
          guarantee: `${baseVolume} qualified farmer contacts monthly`
        },
        core: {
          primary: `Manage complete agribusiness development system reaching ${coreVolume} decision-makers monthly`,
          secondary: 'Deploy seasonal marketing automation aligned with crop cycles',
          optimization: 'Weekly territory optimization with conversion tracking',
          support: 'Monthly agricultural market analysis with strategy updates',
          milestone1: 'Multi-channel agribusiness acquisition system live',
          milestone2: 'Seasonal automation and territory optimization active',
          milestone3: 'Performance targets achieved with expansion planning',
          outcome: '60% increase in agribusiness contract value',
          guarantee: `${coreVolume} contacts monthly or extended territory support`
        },
        premium: {
          strategic: `Build comprehensive agricultural market presence reaching ${premiumVolume} monthly prospects`,
          implementation: 'Deploy precision agriculture partnership network with integrated sales',
          optimization: 'Real-time market monitoring with predictive crop cycle planning',
          training: 'Agricultural sales team certification with territory management',
          ongoing: 'Quarterly market expansion with partnership development',
          milestone1: 'Agricultural network infrastructure and partnerships established',
          milestone2: 'Precision agriculture integration with sales automation',
          milestone3: 'Market leadership position with sustainable growth systems',
          outcome: 'Establish market dominance in target agricultural regions',
          guarantee: 'Achieve regional market leadership or investment protection'
        },
        comparison: {
          volume: {
            starter: `${baseVolume} contacts/month`,
            core: `${coreVolume} contacts/month`,
            premium: `${premiumVolume} contacts/month + partnerships`
          }
        }
      }
      // Continue with other industries...
    };

    // Return industry-specific template or generic business template
    return templates[industry.toLowerCase()] || templates.healthcare; // Fallback to healthcare template
  }

private generateSpecificGuarantee(guaranteeType: GuaranteeType, tier: string, fallbackText: string): string {
  const guarantees: Record<GuaranteeType, Record<string, string>> = {
    'strong-guarantee': {
      starter: `Deliver all specified outputs within timeline, or first month refunded`,
      core: `Achieve performance targets within 90 days, or work free until targets met`,
      premium: `Complete transformation with measurable outcomes, or 25% refund plus 3-month extension`
    },
    conditional: {
      starter: `Deliver specified outputs assuming client provides required access and participation`,
      core: `Achieve performance improvements contingent on full process implementation`,
      premium: `Deliver transformation outcomes with dedicated client engagement and resource allocation`
    },
    none: {
      starter: `Professional delivery guarantee: All outputs delivered to specification`,
      core: `Service quality guarantee: All deliverables completed to professional standards`,
      premium: `Executive-level service guarantee: Premium quality delivery and outcomes`
    }
  };

  return guarantees[guaranteeType]?.[tier] || fallbackText;
}

  private parseACV(acvString: string): number {
    const match = acvString.match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''));
    }
    return 120000; // Default fallback
  }

  private generateOfferAnalysis(input: OfferCreatorInput, offer: GeneratedOffer): OfferAnalysis {
    const strengths = this.calculateOfferStrengths(input);
    const marketFit = this.assessMarketFit(input);
    const scalability = this.assessScalability(input);

    return {
      conversionPotential: {
        score: Math.round((strengths + marketFit + scalability) / 3),
        factors: [
          {
            factor: 'Founder credibility',
            impact: (strengths > 75 ? 'High' : strengths > 50 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
            recommendation: strengths < 60 ? 'Strengthen proof assets and case studies' : 'Leverage strong credibility in messaging'
          },
          {
            factor: 'Market alignment',
            impact: (marketFit > 75 ? 'High' : marketFit > 50 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
            recommendation: marketFit < 60 ? 'Refine target market and pain point focus' : 'Strong market-problem fit'
          },
          {
            factor: 'Business model',
            impact: (scalability > 75 ? 'High' : scalability > 50 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
            recommendation: scalability < 60 ? 'Optimize delivery model for scalability' : 'Well-designed scalable model'
          }
        ]
      }
    };
  }

  private calculateOfferStrengths(input: OfferCreatorInput): number {
    let score = 0;
    
    // Signature results strength (25%)
    score += Math.min(25, input.founder.signatureResults.length * 6);
    
    // Core strengths diversity (20%)
    score += Math.min(20, input.founder.coreStrengths.length * 4);
    
    // Process maturity (20%)
    score += Math.min(20, input.founder.processes.length * 5);
    
    // Industry focus (15%)
    score += input.founder.industries.length <= 2 ? 15 : 10;
    
    // Proof assets (10%)
    score += Math.min(10, input.founder.proofAssets.length * 2);
    
    // Differentiation clarity (10%)
    score += Math.min(10, input.voice.differentiators.length * 3);
    
    return Math.min(100, score);
  }

  private assessMarketFit(input: OfferCreatorInput): number {
    let score = 0;
    
    // Pain point clarity (30%)
    score += Math.min(30, input.market.pains.length * 10);
    
    // Outcome specificity (25%)
    score += Math.min(25, input.market.outcomes.length * 6);
    
    // Target market specificity (20%)
    score += input.market.targetMarket.length > 10 ? 20 : 10;
    
    // Buyer role clarity (15%)
    score += input.market.buyerRole.length > 5 ? 15 : 8;
    
    // Market-founder alignment (10%)
    const hasIndustryAlignment = input.founder.industries.some(industry => 
      input.market.targetMarket.toLowerCase().includes(industry.toLowerCase())
    );
    score += hasIndustryAlignment ? 10 : 5;
    
    return Math.min(100, score);
  }

  private assessScalability(input: OfferCreatorInput): number {
    let score = 0;
    
    // Delivery model scalability (30%)
    const scalableModels = ['productized-service', 'training', 'licensing'];
    const hasScalableModel = input.business.deliveryModel.some(model => 
      scalableModels.includes(model)
    );
    score += hasScalableModel ? 30 : 15;
    
    // Capacity planning (25%)
    const capacity = parseInt(input.business.capacity);
    const monthlyHours = parseInt(input.business.monthlyHours);
    if (!isNaN(capacity) && !isNaN(monthlyHours)) {
      const hoursPerClient = monthlyHours / capacity;
      score += hoursPerClient > 10 && hoursPerClient < 50 ? 25 : 15;
    }
    
    // Pricing strategy (20%)
    score += input.pricing.pricePosture === 'premium' ? 20 : 
             input.pricing.pricePosture === 'value-priced' ? 15 : 10;
    
    // Contract structure (15%)
    score += input.pricing.contractStyle !== 'month-to-month' ? 15 : 8;
    
    // Fulfillment automation (10%)
    score += input.business.fulfillmentStack.length > 2 ? 10 : 5;
    
    return Math.min(100, score);
  }


async saveOffer(userId: string, workspaceId: string, offer: GeneratedOfferPackage, input: OfferCreatorInput): Promise<string> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    console.log('📝 Creating signature offer deliverable...');
    
    // FIXED: Create a clean copy that matches the flat structure
    const cleanOffer = {
      signatureOffers: offer.signatureOffers || {},
      comparisonTable: offer.comparisonTable || {},
      pricing: offer.pricing || {},
      analysis: offer.analysis || {},
      tokensUsed: offer.tokensUsed || 0,
      generationTime: offer.generationTime || 0,
      originalInput: input
    };
    
    const serializedOffer = JSON.stringify(cleanOffer, null, 2);
    
    const deliverable = await prisma.deliverable.create({
      data: {
        title: `Signature Offers - ${input.market.targetMarket}`,
        content: serializedOffer,
        type: 'signature_offers',
        user_id: userId,
        workspace_id: workspaceId || 'default',
        metadata: {
          targetMarket: input.market.targetMarket,
          buyerRole: input.market.buyerRole,
          industries: input.founder.industries,
          deliveryModels: input.business.deliveryModel,
          pricePosture: input.pricing.pricePosture,
          brandTone: input.voice.brandTone,
          positioning: input.voice.positioning,
          conversionScore: offer.analysis?.conversionPotential?.score || 75,
          generatedAt: new Date().toISOString(),
          tokensUsed: offer.tokensUsed || 0,
          generationTime: offer.generationTime || 0,
          capacity: input.business.capacity,
          monthlyHours: input.business.monthlyHours,
          acv: input.business.acv
        },
        tags: [
          'signature-offers',
          'business-strategy',
          input.market.targetMarket.toLowerCase().replace(/\s/g, '-'),
          input.pricing.pricePosture,
          ...input.founder.industries.map(i => i.toLowerCase().replace(/\s/g, '-'))
        ]
      }
    });

    console.log('✅ Signature offer deliverable created successfully with ID:', deliverable.id);
    return deliverable.id;
  } catch (error) {
    console.error('💥 Error saving signature offers:', error);
    throw error;
  }
}


  async getUserOffers(userId: string, workspaceId?: string): Promise<UserOffer[]> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'signature_offers'
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const offers = await prisma.deliverable.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        include: {
          workspace: true
        }
      });

      return offers.map(offer => ({
        id: offer.id,
        title: offer.title,
        offerData: (offer.metadata as any)?.originalInput,
        metadata: {
          targetMarket: (offer.metadata as any)?.targetMarket,
          industries: (offer.metadata as any)?.industries,
          conversionScore: (offer.metadata as any)?.conversionScore,
          pricePosture: (offer.metadata as any)?.pricePosture,
          createdAt: (offer.metadata as any)?.generatedAt
        },
        createdAt: offer.created_at,
        updatedAt: offer.updated_at,
        workspace: offer.workspace
      }));
    } catch (error) {
      console.error('Error fetching user offers:', error);
      return [];
    }
  }

 async getOffer(userId: string, offerId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id: offerId,
        user_id: userId,
        type: 'signature_offers'
      },
      include: {
        workspace: true
      }
    });

    if (!deliverable) {
      return null;
    }

    let parsedOffer: GeneratedOfferPackage;
    try {
      parsedOffer = JSON.parse(deliverable.content);
    } catch (parseError) {
      console.error('Error parsing offer content:', parseError);
      // FIXED: Use the flat structure for fallback
      parsedOffer = {
        signatureOffers: {
          starter: {
            name: 'Error loading Starter offer',
            for: 'Not available',
            promise: 'Not available',
            scope: [],
            proof: [],
            timeline: 'Not available',
            milestones: [],
            pricing: 'Not available',
            term: 'Not available',
            guarantee: 'Not available',
            clientLift: 'Not available',
            requirements: 'Not available'
          },
          core: {
            name: 'Error loading Core offer',
            for: 'Not available',
            promise: 'Not available',
            scope: [],
            proof: [],
            timeline: 'Not available',
            milestones: [],
            pricing: 'Not available',
            term: 'Not available',
            guarantee: 'Not available',
            clientLift: 'Not available',
            requirements: 'Not available'
          },
          premium: {
            name: 'Error loading Premium offer',
            for: 'Not available',
            promise: 'Not available',
            scope: [],
            proof: [],
            timeline: 'Not available',
            milestones: [],
            pricing: 'Not available',
            term: 'Not available',
            guarantee: 'Not available',
            clientLift: 'Not available',
            requirements: 'Not available'
          }
        },
        comparisonTable: { features: [] },
        pricing: {
          starter: 'Not available',
          core: 'Not available',
          premium: 'Not available'
        },
        analysis: { conversionPotential: { score: 0, factors: [] } },
        tokensUsed: 0,
        generationTime: 0
      };
    }

    return {
      id: deliverable.id,
      title: deliverable.title,
      offer: parsedOffer,
      metadata: deliverable.metadata,
      createdAt: deliverable.created_at,
      updatedAt: deliverable.updated_at,
      workspace: deliverable.workspace
    };
  } catch (error) {
    console.error('Error retrieving offer:', error);
    throw error;
  }
}


  async optimizeOffer(userId: string, offerId: string, optimizationType: OptimizationType): Promise<OptimizationResult> {
    try {
      const offer = await this.getOffer(userId, offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      const optimizationPrompt = this.buildOptimizationPrompt(offer.offer, optimizationType);
      
      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a business strategy optimization expert. Provide specific, actionable improvements to signature offers.'
          },
          {
            role: 'user',
            content: optimizationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      // Parse optimization response
      const optimizations = this.parseOptimizationResponse(response.content, optimizationType);

      return {
        ...optimizations,
        tokensUsed: response.usage.total_tokens
      };
    } catch (error) {
      console.error('Error optimizing offer:', error);
      throw error;
    }
  }

  private buildOptimizationPrompt(offer: any, type: OptimizationType): string {
    const prompts = {
      pricing: `Analyze and optimize the pricing strategy for these signature offers: ${JSON.stringify(offer.pricing)}. Consider market positioning, value delivery, and profit margins.`,
      positioning: `Improve the positioning and messaging for these offers: ${JSON.stringify(offer.signatureOffers)}. Focus on differentiation and market appeal.`,
      messaging: `Enhance the core messaging and value propositions across all tiers. Current offers: ${JSON.stringify(offer.signatureOffers)}`,
      delivery: `Optimize the delivery model and service scope for better scalability and client outcomes. Current structure: ${JSON.stringify(offer.signatureOffers)}`,
      guarantee: `Strengthen the guarantee and risk-reversal strategy across all offer tiers to increase conversion confidence.`
    };

    return prompts[type] + `

    Provide 3 specific optimization recommendations in JSON format:
    {
      "originalElement": "current approach description",
      "optimizedVersions": [
        {
          "version": "optimized approach",
          "rationale": "why this improvement works",
          "expectedImpact": "expected business impact"
        }
      ]
    }`;
  }

  private parseOptimizationResponse(content: string, type: OptimizationType): Omit<OptimizationResult, 'tokensUsed'> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // Fallback optimization
    }

    return {
      originalElement: `Current ${type} approach`,
      optimizedVersions: [
        {
          version: `Enhanced ${type} strategy v1`,
          rationale: 'Improved market positioning and value clarity',
          expectedImpact: '15-25% improvement in client acquisition'
        },
        {
          version: `Optimized ${type} approach v2`,
          rationale: 'Better differentiation and competitive advantage',
          expectedImpact: '20-30% increase in conversion rates'
        },
        {
          version: `Advanced ${type} methodology v3`,
          rationale: 'Scalable framework with premium positioning',
          expectedImpact: '25-40% improvement in profitability'
        }
      ]
    };
  }

  async deleteOffer(userId: string, offerId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: offerId,
          user_id: userId,
          type: 'signature_offers'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }
  }

  async exportOffer(userId: string, offerId: string, format: 'json' | 'html' = 'json') {
    try {
      const offer = await this.getOffer(userId, offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      if (format === 'json') {
        return {
          format: 'json',
          content: offer,
          filename: `signature-offers-${(offer.metadata as any)?.targetMarket || 'export'}.json`
        };
      }

      // For HTML format, generate a structured HTML export
      const htmlContent = this.generateHTMLExport(offer);
      return {
        format: 'html',
        content: htmlContent,
        filename: `signature-offers-${(offer.metadata as any)?.targetMarket || 'export'}.html`
      };
    } catch (error) {
      console.error('Error exporting offer:', error);
      throw error;
    }
  }

  private generateHTMLExport(offer: any): string {
    const offerData = offer.offer;
    const metadata = offer.metadata;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Signature Offers - ${metadata?.targetMarket}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 40px; color: #333; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #007bff; }
        .offer-tier { background: #f8f9fa; margin: 30px 0; padding: 30px; border-radius: 8px; border-left: 5px solid #007bff; }
        .offer-tier.core { border-left-color: #28a745; background: #f8fff8; }
        .offer-tier.premium { border-left-color: #6f42c1; background: #faf8ff; }
        .comparison-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .comparison-table th, .comparison-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .comparison-table th { background: #007bff; color: white; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
        .pricing-card { background: white; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; }
        .pricing-card.recommended { border-color: #28a745; transform: scale(1.02); }
        .price { font-size: 2em; font-weight: bold; color: #007bff; margin: 10px 0; }
        h1, h2, h3 { color: #2c3e50; }
        .meta-info { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .tag { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin: 2px; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Signature Offers Portfolio</h1>
            <p><strong>Target Market:</strong> ${metadata?.targetMarket}</p>
            <p><strong>Generated:</strong> ${new Date(metadata?.createdAt || Date.now()).toLocaleDateString()}</p>
            <p><strong>Conversion Score:</strong> <span class="tag">${metadata?.conversionScore || 'N/A'}%</span></p>
        </div>

        <div class="pricing-grid">
            <div class="pricing-card">
                <h3>Starter</h3>
                <div class="price">${offerData.pricing?.starter || 'TBD'}</div>
                <p>Entry-level solution</p>
            </div>
            <div class="pricing-card recommended">
                <h3>Core</h3>
                <div class="price">${offerData.pricing?.core || 'TBD'}</div>
                <p>Recommended solution</p>
            </div>
            <div class="pricing-card">
                <h3>Premium</h3>
                <div class="price">${offerData.pricing?.premium || 'TBD'}</div>
                <p>Premium solution</p>
            </div>
        </div>

        <div class="offer-tier starter">
            <h2>${offerData.signatureOffers?.starter?.name || 'Starter Offer'}</h2>
            <p><strong>For:</strong> ${offerData.signatureOffers?.starter?.for || 'Entry-level clients'}</p>
            <p><strong>Promise:</strong> ${offerData.signatureOffers?.starter?.promise || 'Core value delivery'}</p>
            
            <h4>What's Included:</h4>
            <ul>
                ${offerData.signatureOffers?.starter?.scope?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Basic service delivery</li>'}
            </ul>
            
            <h4>Timeline:</h4>
            <p>${offerData.signatureOffers?.starter?.timeline || '30-60 days'}</p>
            
            <h4>Expected Results:</h4>
            <p>${offerData.signatureOffers?.starter?.clientLift || 'Measurable improvement'}</p>
        </div>

        <div class="offer-tier core">
            <h2>${offerData.signatureOffers?.core?.name || 'Core Offer'}</h2>
            <p><strong>For:</strong> ${offerData.signatureOffers?.core?.for || 'Growing businesses'}</p>
            <p><strong>Promise:</strong> ${offerData.signatureOffers?.core?.promise || 'Comprehensive transformation'}</p>
            
            <h4>What's Included:</h4>
            <ul>
                ${offerData.signatureOffers?.core?.scope?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Full service delivery</li>'}
            </ul>
            
            <h4>Timeline:</h4>
            <p>${offerData.signatureOffers?.core?.timeline || '90-120 days'}</p>
            
            <h4>Expected Results:</h4>
            <p>${offerData.signatureOffers?.core?.clientLift || 'Significant improvement'}</p>
        </div>

        <div class="offer-tier premium">
            <h2>${offerData.signatureOffers?.premium?.name || 'Premium Offer'}</h2>
            <p><strong>For:</strong> ${offerData.signatureOffers?.premium?.for || 'Enterprise clients'}</p>
            <p><strong>Promise:</strong> ${offerData.signatureOffers?.premium?.promise || 'Market leadership'}</p>
            
            <h4>What's Included:</h4>
            <ul>
                ${offerData.signatureOffers?.premium?.scope?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Premium service delivery</li>'}
            </ul>
            
            <h4>Timeline:</h4>
            <p>${offerData.signatureOffers?.premium?.timeline || '6-12 months'}</p>
            
            <h4>Expected Results:</h4>
            <p>${offerData.signatureOffers?.premium?.clientLift || 'Exceptional results'}</p>
        </div>

        <h2>Feature Comparison</h2>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>Starter</th>
                    <th>Core</th>
                    <th>Premium</th>
                </tr>
            </thead>
            <tbody>
                ${offerData.comparisonTable?.features?.map((feature: any) => `
                    <tr>
                        <td><strong>${feature.name}</strong></td>
                        <td>${feature.starter}</td>
                        <td>${feature.core}</td>
                        <td>${feature.premium}</td>
                    </tr>
                `).join('') || '<tr><td colspan="4">No comparison data available</td></tr>'}
            </tbody>
        </table>

        <div class="meta-info">
            <h3>Analysis Summary</h3>
            <p><strong>Conversion Potential:</strong> ${offerData.analysis?.conversionPotential?.score || 'Not analyzed'}%</p>
            <p><strong>Generated with:</strong> ${offerData.tokensUsed || 0} AI tokens in ${offerData.generationTime || 0}ms</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Cache management
  async clearOfferCache(input: OfferCreatorInput): Promise<void> {
    try {
      const cacheKey = generateCacheKey(input);
      await this.redis.del(cacheKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
      // Don't throw error for cache issues
    }
  }

  async getCacheStats(): Promise<{ hits: number; misses: number }> {
    try {
      // This would require implementing cache hit/miss tracking
      // For now, return placeholder values
      return { hits: 0, misses: 0 };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { hits: 0, misses: 0 };
    }
  }



// Performance tracking methods
  async getOfferPerformance(userId: string, offerId: string): Promise<OfferPerformance> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      // First verify the offer belongs to the user
      const offer = await prisma.deliverable.findFirst({
        where: {
          id: offerId,
          user_id: userId,
          type: 'signature_offers'
        }
      });

      if (!offer) {
        throw new Error('Offer not found');
      }

      const metadata = offer.metadata as any || {};
      const performanceHistory = metadata.performanceHistory || [];
      const latestMetrics = metadata.latestMetrics;
      const insights = metadata.latestInsights || [];

      // Calculate summary statistics
      const summary = this.calculatePerformanceSummary(performanceHistory);

      return {
        offerId,
        offerName: offer.title,
        performanceHistory,
        latestMetrics,
        insights,
        summary
      };
    } catch (error) {
      console.error('Error getting offer performance:', error);
      throw error;
    }
  }

  private calculatePerformanceSummary(history: any[]): any {
    if (!history.length) {
      return {
        totalInquiries: 0,
        totalProposals: 0,
        totalConversions: 0,
        totalRevenue: 0,
        averageConversionRate: 0,
        averageProposalRate: 0,
        averageDealSize: 0,
        trend: 'no-data',
        dataPoints: 0
      };
    }

    const totals = history.reduce((acc, entry) => ({
      inquiries: acc.inquiries + (entry.metrics.inquiries || 0),
      proposals: acc.proposals + (entry.metrics.proposals || 0),
      conversions: acc.conversions + (entry.metrics.conversions || 0),
      revenue: acc.revenue + (entry.metrics.totalRevenue || 0)
    }), { inquiries: 0, proposals: 0, conversions: 0, revenue: 0 });

    const avgConversionRate = history.reduce((sum, entry) => 
      sum + (entry.metrics.conversionRate || 0), 0) / history.length;
    const avgProposalRate = history.reduce((sum, entry) => 
      sum + (entry.metrics.proposalRate || 0), 0) / history.length;
    const avgDealSize = totals.conversions > 0 ? totals.revenue / totals.conversions : 0;

    // Calculate trend
    let trend = 'stable';
    if (history.length >= 3) {
      const recent = history.slice(-2).map(e => e.metrics.conversionRate || 0);
      const older = history.slice(-4, -2).map(e => e.metrics.conversionRate || 0);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        if (recentAvg > olderAvg * 1.1) trend = 'improving';
        else if (recentAvg < olderAvg * 0.9) trend = 'declining';
      }
    }

    return {
      totalInquiries: totals.inquiries,
      totalProposals: totals.proposals,
      totalConversions: totals.conversions,
      totalRevenue: Math.round(totals.revenue * 100) / 100,
      averageConversionRate: Math.round(avgConversionRate * 100) / 100,
      averageProposalRate: Math.round(avgProposalRate * 100) / 100,
      averageDealSize: Math.round(avgDealSize * 100) / 100,
      trend,
      dataPoints: history.length
    };
  }






  // Performance tracking methods
  async updateOfferPerformance(
    userId: string, 
    offerId: string, 
    performanceData: {
      inquiries: number;
      proposals: number;
      conversions: number;
      avgDealSize: number;
      timeToClose: number;
      dateRange: { start: string; end: string };
    }
  ): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      // First verify the offer belongs to the user
      const offer = await prisma.deliverable.findFirst({
        where: {
          id: offerId,
          user_id: userId,
          type: 'signature_offers'
        }
      });

      if (!offer) {
        throw new Error('Offer not found or access denied');
      }

      // Calculate metrics
      const proposalRate = performanceData.inquiries > 0 ? (performanceData.proposals / performanceData.inquiries) * 100 : 0;
      const conversionRate = performanceData.proposals > 0 ? (performanceData.conversions / performanceData.proposals) * 100 : 0;
      const totalRevenue = performanceData.conversions * performanceData.avgDealSize;

      // Update offer metadata with performance data
      const currentMetadata = offer.metadata as any || {};
      const performanceHistory = currentMetadata.performanceHistory || [];
      
      const newPerformanceEntry = {
        dateRange: performanceData.dateRange,
        metrics: {
          inquiries: performanceData.inquiries,
          proposals: performanceData.proposals,
          conversions: performanceData.conversions,
          avgDealSize: performanceData.avgDealSize,
          timeToClose: performanceData.timeToClose,
          proposalRate: Math.round(proposalRate * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100
        },
        recordedAt: new Date().toISOString()
      };

      performanceHistory.push(newPerformanceEntry);

      // Keep only last 12 entries
      if (performanceHistory.length > 12) {
        performanceHistory.splice(0, performanceHistory.length - 12);
      }

      // Generate insights
      const insights = this.generatePerformanceInsights(performanceHistory, newPerformanceEntry.metrics);

      await prisma.deliverable.update({
        where: { id: offerId },
        data: {
          metadata: {
            ...currentMetadata,
            performanceHistory,
            latestMetrics: newPerformanceEntry.metrics,
            latestInsights: insights,
            lastUpdated: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error updating offer performance:', error);
      throw error;
    }
  }

  private generatePerformanceInsights(history: any[], latestMetrics: any): string[] {
    const insights: string[] = [];
    
    // Conversion rate analysis
    if (latestMetrics.conversionRate > 25) {
      insights.push('Excellent conversion rate - consider raising prices');
    } else if (latestMetrics.conversionRate < 10) {
      insights.push('Low conversion rate - review offer positioning and pricing');
    }
    
    // Deal size analysis
    if (latestMetrics.avgDealSize > 50000) {
      insights.push('High-value deals - focus on retention and upselling');
    } else if (latestMetrics.avgDealSize < 10000) {
      insights.push('Consider premium tier positioning to increase deal size');
    }
    
    // Time to close analysis
    if (latestMetrics.timeToClose > 90) {
      insights.push('Long sales cycle - consider adding urgency or trial options');
    } else if (latestMetrics.timeToClose < 30) {
      insights.push('Quick sales cycle - excellent market fit');
    }
    
    // Trend analysis if we have historical data
    if (history.length >= 3) {
      const recent = history.slice(-3);
      const avgRecentConversion = recent.reduce((sum, entry) => sum + entry.metrics.conversionRate, 0) / 3;
      const older = history.slice(-6, -3);
      
      if (older.length > 0) {
        const avgOlderConversion = older.reduce((sum, entry) => sum + entry.metrics.conversionRate, 0) / older.length;
        
        if (avgRecentConversion > avgOlderConversion * 1.2) {
          insights.push('Conversion rate trending up - great momentum');
        } else if (avgRecentConversion < avgOlderConversion * 0.8) {
          insights.push('Conversion rate declining - review recent changes');
        }
      }
    }
    
    return insights.slice(0, 5); // Return top 5 insights
  }
}