// validators/pricingCalculator.validator.ts
import { z } from 'zod';

const pricingCalculatorSchema = z.object({
  // Basic Calculation Inputs
  annualSavings: z.number()
    .min(1000, 'Annual savings must be at least $1,000')
    .max(50000000, 'Annual savings seems unrealistically high'),
  
  hoursPerWeek: z.number()
    .min(1, 'Hours per week must be at least 1')
    .max(80, 'Hours per week cannot exceed 80'),
  
  roiMultiple: z.number()
    .min(1, 'ROI multiple must be at least 1')
    .max(20, 'ROI multiple cannot exceed 20'),

  // Enhanced Client Context
  clientName: z.string()
    .min(1, 'Client name is required')
    .max(100, 'Client name is too long')
    .optional(),
  
  projectName: z.string()
    .max(100, 'Project name is too long')
    .optional(),
  
  industry: z.string()
    .max(50, 'Industry name is too long')
    .optional(),
  
  serviceType: z.string()
    .max(100, 'Service type is too long')
    .optional(),
  
  projectDuration: z.number()
    .min(1, 'Project duration must be at least 1 month')
    .max(60, 'Project duration cannot exceed 60 months')
    .optional(),

  // Advanced Pricing Factors
  experienceLevel: z.enum(['beginner', 'intermediate', 'expert', 'premium']).optional(),
  competitiveAdvantage: z.enum(['low', 'medium', 'high']).optional(),
  clientUrgency: z.enum(['low', 'medium', 'high']).optional(),
  relationshipType: z.enum(['new', 'existing', 'referral', 'strategic']).optional(),

  // Risk Factors
  deliveryRisk: z.enum(['low', 'medium', 'high']).optional(),
  paymentTerms: z.enum(['upfront', 'monthly', 'milestone', 'success-based']).optional(),
  guaranteeOffered: z.boolean().optional(),

  // Market Context
  marketDemand: z.enum(['low', 'medium', 'high']).optional(),
  seasonality: z.boolean().optional(),
  competitionLevel: z.enum(['low', 'medium', 'high']).optional()
});

export function validatePricingCalculatorInput(data: any, partial = false): 
  | { success: true; data: any }
  | { success: false; errors: any[] } {
  try {
    const schema = partial ? pricingCalculatorSchema.partial() : pricingCalculatorSchema;
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

// Business logic validation
export function validatePricingBusinessRules(data: z.infer<typeof pricingCalculatorSchema>): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
  insights: {
    marketPosition: 'budget' | 'standard' | 'premium' | 'luxury';
    riskLevel: 'low' | 'medium' | 'high';
    competitiveStrength: 'weak' | 'average' | 'strong';
    pricingStrategy: string;
  };
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Calculate implied metrics
  const monthlyHours = (data.hoursPerWeek * 4.33);
  const monthlySavings = data.annualSavings / 12;
  const impliedRetainer = (monthlySavings * data.roiMultiple) / 100;
  const impliedHourlyRate = impliedRetainer / monthlyHours;

  // Hourly rate analysis
  if (impliedHourlyRate < 50) {
    warnings.push('Implied hourly rate is very low - consider increasing ROI multiple');
    recommendations.push('Minimum viable hourly rate should be $50-75 for sustainability');
  } else if (impliedHourlyRate > 500) {
    warnings.push('Implied hourly rate is very high - ensure value justification is strong');
    recommendations.push('High rates require exceptional expertise and proven results');
  }

  // ROI analysis
  const clientROI = ((monthlySavings - impliedRetainer) / impliedRetainer) * 100;
  if (clientROI < 100) {
    warnings.push('Client ROI is below 100% - may be difficult to justify');
    recommendations.push('Consider reducing ROI multiple or demonstrating additional value');
  } else if (clientROI > 1000) {
    recommendations.push('Excellent client ROI - you may be underpricing your services');
  }

  // Experience vs pricing alignment
  const experienceRateRanges = {
    beginner: { min: 50, max: 120 },
    intermediate: { min: 100, max: 200 },
    expert: { min: 180, max: 350 },
    premium: { min: 300, max: 600 }
  };

  const experienceLevel = data.experienceLevel || 'intermediate';
  const expectedRange = experienceRateRanges[experienceLevel];
  
  if (impliedHourlyRate < expectedRange.min) {
    recommendations.push(`Your rate is below typical ${experienceLevel} range ($${expectedRange.min}-${expectedRange.max})`);
  } else if (impliedHourlyRate > expectedRange.max) {
    recommendations.push(`Your rate is above typical ${experienceLevel} range - ensure strong value proposition`);
  }

  // Project duration vs pricing model
  const duration = data.projectDuration || 6;
  if (duration > 12) {
    recommendations.push('Consider milestone-based pricing for longer projects');
  } else if (duration < 3) {
    recommendations.push('Short projects may benefit from fixed-fee pricing');
  }

  // Risk factors analysis
  let riskScore = 0;
  if (data.deliveryRisk === 'high') riskScore += 3;
  else if (data.deliveryRisk === 'medium') riskScore += 1;
  
  if (data.clientUrgency === 'high') riskScore += 2;
  else if (data.clientUrgency === 'low') riskScore -= 1;
  
  if (data.paymentTerms === 'success-based') riskScore += 2;
  else if (data.paymentTerms === 'upfront') riskScore -= 2;
  
  if (data.guaranteeOffered) riskScore += 1;

  const riskLevel: 'low' | 'medium' | 'high' = riskScore <= 1 ? 'low' : riskScore <= 4 ? 'medium' : 'high';

  if (riskLevel === 'high') {
    recommendations.push('High risk project - consider risk premium of 15-25%');
  }

  // Market positioning analysis
  let marketPosition: 'budget' | 'standard' | 'premium' | 'luxury';
  if (impliedHourlyRate < 100) marketPosition = 'budget';
  else if (impliedHourlyRate < 200) marketPosition = 'standard';
  else if (impliedHourlyRate < 400) marketPosition = 'premium';
  else marketPosition = 'luxury';

  // Competitive strength analysis
  let competitiveStrength: 'weak' | 'average' | 'strong';
  let strengthScore = 0;
  
  if (data.experienceLevel === 'expert' || data.experienceLevel === 'premium') strengthScore += 2;
  if (data.competitiveAdvantage === 'high') strengthScore += 2;
  if (data.relationshipType === 'referral' || data.relationshipType === 'strategic') strengthScore += 1;
  if (data.guaranteeOffered) strengthScore += 1;

  competitiveStrength = strengthScore <= 2 ? 'weak' : strengthScore <= 4 ? 'average' : 'strong';

  // Pricing strategy recommendation
  let pricingStrategy: string;
  if (clientROI > 500 && competitiveStrength === 'strong') {
    pricingStrategy = 'Value-based pricing with premium positioning';
  } else if (riskLevel === 'high') {
    pricingStrategy = 'Risk-adjusted pricing with success guarantees';
  } else if (marketPosition === 'budget') {
    pricingStrategy = 'Competitive pricing with volume focus';
  } else {
    pricingStrategy = 'Market-rate pricing with differentiation';
  }

  // Industry-specific recommendations
  const industryRecommendations = {
    'Healthcare': 'Consider compliance and regulatory factors in pricing',
    'Finance': 'Security and risk management add value - price accordingly',
    'Technology': 'Fast-moving industry - consider shorter engagements',
    'Manufacturing': 'ROI often measured in efficiency gains - quantify carefully',
    'Retail': 'Seasonal factors may affect project timing and urgency'
  };

  if (data.industry && data.industry in industryRecommendations) {
    recommendations.push(industryRecommendations[data.industry as keyof typeof industryRecommendations]);
  }

  // Payment terms recommendations
  if (data.paymentTerms === 'success-based' && clientROI < 300) {
    warnings.push('Success-based pricing with low client ROI may not be sustainable');
  }

  if (data.paymentTerms === 'upfront' && duration > 6) {
    recommendations.push('Consider milestone payments for longer projects even with upfront terms');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    recommendations,
    insights: {
      marketPosition,
      riskLevel,
      competitiveStrength,
      pricingStrategy
    }
  };
}

// Helper function to calculate pricing scenarios
export function generatePricingScenarios(baseData: z.infer<typeof pricingCalculatorSchema>) {
  const scenarios = [];
  
  // Conservative scenario
  scenarios.push({
    name: 'Conservative',
    data: { ...baseData, roiMultiple: Math.max(1, baseData.roiMultiple * 0.8) },
    description: 'Lower risk, easier client buy-in'
  });

  // Aggressive scenario
  scenarios.push({
    name: 'Aggressive',
    data: { ...baseData, roiMultiple: Math.min(20, baseData.roiMultiple * 1.3) },
    description: 'Higher margins, requires strong justification'
  });

  // Value-based scenario
  scenarios.push({
    name: 'Value-Based',
    data: { ...baseData, roiMultiple: baseData.roiMultiple * 1.1, guaranteeOffered: true },
    description: 'Premium pricing with performance guarantee'
  });

  // Relationship scenario
  scenarios.push({
    name: 'Relationship',
    data: { ...baseData, roiMultiple: baseData.roiMultiple * 0.9, relationshipType: 'existing' as const },
    description: 'Relationship discount for long-term partnership'
  });

  return scenarios;
}

// Helper function to extract key insights
export function extractPricingInsights(data: z.infer<typeof pricingCalculatorSchema>) {
  const monthlyHours = data.hoursPerWeek * 4.33;
  const monthlySavings = data.annualSavings / 12;
  const impliedRetainer = (monthlySavings * data.roiMultiple) / 100;
  const hourlyRate = impliedRetainer / monthlyHours;
  const clientROI = ((monthlySavings - impliedRetainer) / impliedRetainer) * 100;

  return {
    financials: {
      monthlyHours: Math.round(monthlyHours),
      monthlySavings: Math.round(monthlySavings),
      impliedRetainer: Math.round(impliedRetainer),
      hourlyRate: Math.round(hourlyRate),
      clientROI: Math.round(clientROI)
    },
    positioning: {
      isHighValue: hourlyRate > 250,
      isClientFriendly: clientROI > 200,
      isPremium: data.experienceLevel === 'expert' || data.experienceLevel === 'premium',
      hasCompetitiveAdvantage: data.competitiveAdvantage === 'high'
    },
    recommendations: {
      shouldIncreasePrice: clientROI > 500,
      shouldAddGuarantee: hourlyRate > 200 && !data.guaranteeOffered,
      shouldOfferPaymentPlan: impliedRetainer > 5000,
      shouldConsiderSuccess: clientROI > 300 && data.deliveryRisk === 'low'
    }
  };
}

// Type exports
export type PricingCalculatorInput = z.infer<typeof pricingCalculatorSchema>;