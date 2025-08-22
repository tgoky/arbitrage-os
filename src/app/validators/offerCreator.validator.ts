// validators/offerCreator.validator.ts
import { z } from 'zod';
import { 
  OfferCreatorInput, 
  FounderInputs,
  MarketInputs,
  BusinessInputs,
  PricingInputs,
  VoiceInputs,
  BusinessRulesValidation
} from '@/types/offerCreator';

// Schema for founder inputs
const founderInputsSchema = z.object({
  signatureResults: z.array(z.string().min(1, 'Result cannot be empty'))
    .min(1, 'At least one signature result is required')
    .max(5, 'Maximum 5 signature results allowed'),
  
  coreStrengths: z.array(z.string().min(1, 'Strength cannot be empty'))
    .min(1, 'At least one core strength is required')
    .max(10, 'Maximum 10 core strengths allowed'),
  
  processes: z.array(z.string().min(1, 'Process cannot be empty'))
    .min(1, 'At least one process is required')
    .max(8, 'Maximum 8 processes allowed'),
  
  industries: z.array(z.string().min(1, 'Industry cannot be empty'))
    .min(1, 'At least one industry is required')
    .max(3, 'Maximum 3 industries allowed'),
  
  proofAssets: z.array(z.string().min(1, 'Proof asset cannot be empty'))
    .max(10, 'Maximum 10 proof assets allowed')
    .optional()
    .default([])
});

// Schema for market inputs
const marketInputsSchema = z.object({
  targetMarket: z.string()
    .min(3, 'Target market must be at least 3 characters')
    .max(100, 'Target market must be less than 100 characters'),
  
  buyerRole: z.string()
    .min(3, 'Buyer role must be at least 3 characters')
    .max(100, 'Buyer role must be less than 100 characters'),
  
  pains: z.array(z.string().min(5, 'Pain point must be at least 5 characters'))
    .min(1, 'At least one pain point is required')
    .max(5, 'Maximum 5 pain points allowed'),
  
  outcomes: z.array(z.string().min(5, 'Outcome must be at least 5 characters'))
    .min(1, 'At least one outcome is required')
    .max(8, 'Maximum 8 outcomes allowed')
});

// Schema for business inputs
const businessInputsSchema = z.object({
  deliveryModel: z.array(
    z.enum(['productized-service', 'monthly-retainer', 'one-time-project', 'training', 'advisory', 'licensing'], {
      message: 'Please select valid delivery models'
    })
  ).min(1, 'At least one delivery model is required')
   .max(3, 'Maximum 3 delivery models allowed'),
  
  capacity: z.string()
    .min(1, 'Capacity is required')
    .regex(/^\d+$/, 'Capacity must be a number'),
  
  monthlyHours: z.string()
    .min(1, 'Monthly hours is required')
    .regex(/^\d+$/, 'Monthly hours must be a number'),
  
  acv: z.string()
    .min(1, 'Annual Contract Value is required')
    .regex(/^\$?[\d,]+(\.\d{2})?$/, 'Please enter a valid ACV format'),
  
  fulfillmentStack: z.array(z.string().min(1, 'Tool cannot be empty'))
    .max(10, 'Maximum 10 tools allowed')
    .optional()
    .default([])
});

// Schema for pricing inputs
const pricingInputsSchema = z.object({
  pricePosture: z.enum(['value-priced', 'market-priced', 'premium'], {
    message: 'Please select a valid price posture'
  }),
  
  contractStyle: z.enum(['month-to-month', '3-month-min', '6-month-min', 'project'], {
    message: 'Please select a valid contract style'
  }),
  
  guarantee: z.enum(['none', 'conditional', 'strong-guarantee'], {
    message: 'Please select a valid guarantee option'
  })
});

// Schema for voice inputs
const voiceInputsSchema = z.object({
  brandTone: z.enum(['assertive', 'consultative', 'friendly', 'elite'], {
    message: 'Please select a valid brand tone'
  }),
  
  positioning: z.enum(['speed', 'certainty', 'specialization', 'done-for-you', 'ROI'], {
    message: 'Please select a valid positioning angle'
  }),
  
  differentiators: z.array(z.string().min(3, 'Differentiator must be at least 3 characters'))
    .min(1, 'At least one differentiator is required')
    .max(5, 'Maximum 5 differentiators allowed')
});

// Main offer creator schema
const offerCreatorSchema = z.object({
  founder: founderInputsSchema,
  market: marketInputsSchema,
  business: businessInputsSchema,
  pricing: pricingInputsSchema,
  voice: voiceInputsSchema,
  userId: z.string().min(1, 'User ID is required')
}).superRefine((data, ctx) => {
  // Cross-section validation
  
  // Capacity validation
  const capacity = parseInt(data.business.capacity);
  const monthlyHours = parseInt(data.business.monthlyHours);
  
  if (!isNaN(capacity) && !isNaN(monthlyHours)) {
    const hoursPerClient = monthlyHours / capacity;
    if (hoursPerClient < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hours per client seems too low (less than 5 hours). Consider adjusting capacity or monthly hours.',
        path: ['business', 'capacity']
      });
    }
    if (hoursPerClient > 80) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hours per client seems too high (more than 80 hours). Consider increasing capacity or reducing monthly hours.',
        path: ['business', 'monthlyHours']
      });
    }
  }

  // ACV validation based on price posture
  const acvMatch = data.business.acv.match(/[\d,]+/);
  if (acvMatch) {
    const acvValue = parseInt(acvMatch[0].replace(/,/g, ''));
    
    if (data.pricing.pricePosture === 'premium' && acvValue < 25000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Premium pricing typically requires higher ACV (>$25K)',
        path: ['business', 'acv']
      });
    }
    
    if (data.pricing.pricePosture === 'value-priced' && acvValue > 100000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Value pricing at this ACV level may not be optimal',
        path: ['pricing', 'pricePosture']
      });
    }
  }

  // Delivery model validation
  if (data.business.deliveryModel.includes('one-time-project') && 
      data.pricing.contractStyle !== 'project') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'One-time project delivery should use project-based contract style',
      path: ['pricing', 'contractStyle']
    });
  }

  // Industry and market alignment
  const techIndustries = ['saas', 'software', 'tech', 'technology'];
  const hasTechIndustry = data.founder.industries.some(industry => 
    techIndustries.some(tech => industry.toLowerCase().includes(tech))
  );
  
  if (hasTechIndustry && data.voice.brandTone === 'friendly') {
    // This is just a suggestion, not an error
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Consider "consultative" or "assertive" tone for tech industries',
      path: ['voice', 'brandTone']
    });
  }
});

export function validateOfferCreatorInput(data: any): 
  | { success: true; data: z.infer<typeof offerCreatorSchema> }
  | { success: false; errors: any[] } {
  try {
    const validated = offerCreatorSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

// Business logic validation for offer strategy
export function validateOfferBusinessRules(data: z.infer<typeof offerCreatorSchema>): BusinessRulesValidation {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const conversionFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }> = [];

  // Analyze founder credibility
  const credibilityScore = calculateCredibilityScore(data.founder);
  if (credibilityScore < 60) {
    warnings.push('Consider strengthening your proof assets and signature results');
    conversionFactors.push({
      factor: 'Founder credibility',
      impact: 'negative',
      weight: 0.3
    });
  } else {
    conversionFactors.push({
      factor: 'Strong founder credibility',
      impact: 'positive',
      weight: 0.25
    });
  }

  // Market focus analysis
  if (data.founder.industries.length > 2) {
    suggestions.push('Consider focusing on 1-2 industries for stronger positioning');
  } else {
    conversionFactors.push({
      factor: 'Focused industry targeting',
      impact: 'positive',
      weight: 0.2
    });
  }

  // Pain point clarity
  if (data.market.pains.length >= 3) {
    conversionFactors.push({
      factor: 'Clear pain point identification',
      impact: 'positive',
      weight: 0.15
    });
  } else {
    suggestions.push('Identify more specific pain points for better targeting');
  }

  // Delivery model assessment
  const deliveryComplexity = assessDeliveryComplexity(data.business.deliveryModel);
  if (deliveryComplexity === 'high') {
    warnings.push('Multiple delivery models may complicate operations');
    conversionFactors.push({
      factor: 'Delivery complexity',
      impact: 'negative',
      weight: 0.1
    });
  }

  // Pricing strategy analysis
  const pricingAlignment = assessPricingAlignment(data);
  conversionFactors.push({
    factor: `${data.pricing.pricePosture} pricing strategy`,
    impact: pricingAlignment.impact,
    weight: pricingAlignment.weight
  });

  if (pricingAlignment.suggestions) {
    suggestions.push(...pricingAlignment.suggestions);
  }

  // Guarantee strategy
  if (data.pricing.guarantee === 'strong-guarantee') {
    conversionFactors.push({
      factor: 'Strong guarantee reduces risk',
      impact: 'positive',
      weight: 0.2
    });
  } else if (data.pricing.guarantee === 'none' && data.pricing.pricePosture === 'premium') {
    suggestions.push('Consider adding a guarantee for premium pricing');
  }

  // Differentiation analysis
  if (data.voice.differentiators.length >= 3) {
    conversionFactors.push({
      factor: 'Clear differentiation',
      impact: 'positive',
      weight: 0.2
    });
  } else {
    suggestions.push('Develop more unique differentiators');
  }

  // Industry-specific recommendations
  const industryTips = getIndustrySpecificTips(data.founder.industries, data.market.targetMarket);
  suggestions.push(...industryTips.slice(0, 2));

  // Calculate conversion prediction score
  const baseScore = 65;
  const positiveImpact = conversionFactors
    .filter(f => f.impact === 'positive')
    .reduce((sum, f) => sum + (f.weight * 100), 0);
  
  const negativeImpact = conversionFactors
    .filter(f => f.impact === 'negative')
    .reduce((sum, f) => sum + (f.weight * 50), 0);

  const conversionScore = Math.min(95, Math.max(25, baseScore + positiveImpact - negativeImpact));

  // Capacity and pricing recommendations
  const capacity = parseInt(data.business.capacity);
  const acvMatch = data.business.acv.match(/[\d,]+/);
  const acvValue = acvMatch ? parseInt(acvMatch[0].replace(/,/g, '')) : 0;
  
  if (acvValue > 0 && capacity > 0) {
    const potentialRevenue = acvValue * capacity;
    if (potentialRevenue < 500000) {
      suggestions.push('Consider increasing ACV or capacity for better revenue potential');
    } else if (potentialRevenue > 2000000) {
      suggestions.push('Excellent revenue potential - focus on delivery scalability');
    }
  }

  return {
    isValid: true,
    warnings,
    suggestions: suggestions.slice(0, 8),
    conversionPrediction: {
      score: Math.round(conversionScore),
      factors: conversionFactors
    }
  };
}

// Helper functions
function calculateCredibilityScore(founder: FounderInputs): number {
  let score = 0;
  
  // Signature results (30%)
  score += Math.min(30, founder.signatureResults.length * 8);
  
  // Core strengths (20%)
  score += Math.min(20, founder.coreStrengths.length * 4);
  
  // Processes (20%)
  score += Math.min(20, founder.processes.length * 4);
  
  // Industry focus (15%)
  score += Math.min(15, (4 - founder.industries.length) * 5); // Fewer industries = higher score
  
  // Proof assets (15%)
  score += Math.min(15, founder.proofAssets.length * 3);
  
  return score;
}

function assessDeliveryComplexity(deliveryModels: string[]): 'low' | 'medium' | 'high' {
  if (deliveryModels.length === 1) return 'low';
  if (deliveryModels.length === 2) return 'medium';
  return 'high';
}

function assessPricingAlignment(data: z.infer<typeof offerCreatorSchema>): {
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  suggestions?: string[];
} {
  const { pricePosture, guarantee, contractStyle } = data.pricing;
  const suggestions: string[] = [];
  
  // Premium pricing analysis
  if (pricePosture === 'premium') {
    if (guarantee === 'strong-guarantee') {
      return { impact: 'positive', weight: 0.3 };
    } else {
      suggestions.push('Premium pricing works better with strong guarantees');
      return { impact: 'neutral', weight: 0.2, suggestions };
    }
  }
  
  // Value pricing analysis
  if (pricePosture === 'value-priced') {
    if (contractStyle === 'month-to-month') {
      suggestions.push('Consider longer commitments for value pricing');
      return { impact: 'neutral', weight: 0.15, suggestions };
    }
    return { impact: 'positive', weight: 0.2 };
  }
  
  // Market pricing
  return { impact: 'neutral', weight: 0.15 };
}

function getIndustrySpecificTips(industries: string[], targetMarket: string): string[] {
  const tips: string[] = [];
  
  // Generic tips based on common industry patterns
  const industryKeywords = industries.join(' ').toLowerCase();
  
  if (industryKeywords.includes('saas') || industryKeywords.includes('software')) {
    tips.push('Focus on ROI metrics and integration capabilities');
    tips.push('Consider tiered pricing with feature differentiation');
  }
  
  if (industryKeywords.includes('healthcare') || industryKeywords.includes('medical')) {
    tips.push('Emphasize compliance and safety in your messaging');
    tips.push('Patient outcome data is highly valuable proof');
  }
  
  if (industryKeywords.includes('marketing') || industryKeywords.includes('agency')) {
    tips.push('Performance guarantees work well in marketing services');
    tips.push('Case studies with specific metrics are crucial');
  }
  
  if (industryKeywords.includes('finance') || industryKeywords.includes('fintech')) {
    tips.push('Security and regulatory compliance are table stakes');
    tips.push('Risk reduction messaging resonates strongly');
  }
  
  // Default tips if no specific industry matches
  if (tips.length === 0) {
    tips.push('Focus on measurable outcomes in your industry');
    tips.push('Gather industry-specific case studies and testimonials');
  }
  
  return tips;
}

// Additional validation schemas for API endpoints
export const optimizationRequestSchema = z.object({
  type: z.enum(['pricing', 'positioning', 'messaging', 'delivery', 'guarantee'], {
    message: 'Invalid optimization type'
  }),
  focus: z.enum(['conversion', 'differentiation', 'scalability']).optional()
});

export const analysisRequestSchema = z.object({
  offerData: offerCreatorSchema,
  analysisType: z.enum(['market-fit', 'competitive', 'scalability'], {
    message: 'Invalid analysis type'
  }).default('market-fit')
});

export const performanceDataSchema = z.object({
  offerId: z.string().min(1, 'Offer ID is required'),
  metrics: z.object({
    inquiries: z.number().min(0, 'Inquiries must be positive'),
    proposals: z.number().min(0, 'Proposals must be positive'),
    conversions: z.number().min(0, 'Conversions must be positive'),
    avgDealSize: z.number().min(0, 'Average deal size must be positive'),
    timeToClose: z.number().min(0, 'Time to close must be positive')
  }),
  dateRange: z.object({
    start: z.string().min(1, 'Start date is required'),
    end: z.string().min(1, 'End date is required')
  })
}).refine((data) => {
  const startDate = new Date(data.dateRange.start);
  const endDate = new Date(data.dateRange.end);
  return startDate <= endDate;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['dateRange']
}).refine((data) => {
  return data.metrics.proposals <= data.metrics.inquiries;
}, {
  message: 'Proposals cannot exceed inquiries',
  path: ['metrics', 'proposals']
}).refine((data) => {
  return data.metrics.conversions <= data.metrics.proposals;
}, {
  message: 'Conversions cannot exceed proposals',
  path: ['metrics', 'conversions']
});

// Type exports
export type OfferCreatorValidated = z.infer<typeof offerCreatorSchema>;
export type OptimizationRequest = z.infer<typeof optimizationRequestSchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type PerformanceDataInput = z.infer<typeof performanceDataSchema>;

// Validation helper functions
export function validateOptimizationRequest(data: any) {
  try {
    const validated = optimizationRequestSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

export function validateAnalysisRequest(data: any) {
  try {
    const validated = analysisRequestSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

export function validatePerformanceData(data: any) {
  try {
    const validated = performanceDataSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

// Cache key generator for the new structure
export function generateCacheKey(input: OfferCreatorInput): string {
  const keyData = {
    industries: input.founder.industries.sort(),
    targetMarket: input.market.targetMarket,
    deliveryModel: input.business.deliveryModel.sort(),
    pricePosture: input.pricing.pricePosture,
    brandTone: input.voice.brandTone,
    positioning: input.voice.positioning,
    // Include key differentiators for uniqueness
    differentiators: input.voice.differentiators.slice(0, 3).sort()
  };
  
  return Buffer.from(JSON.stringify(keyData)).toString('base64');
}