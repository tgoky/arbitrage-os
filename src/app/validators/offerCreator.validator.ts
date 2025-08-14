// validators/offerCreator.validator.ts
import { z } from 'zod';
import { 
  OfferCreatorInput, 
  BusinessRulesValidation, 
  OfferInsights 
} from '@/types/offerCreator';

const offerCreatorSchema = z.object({
  // Offer Basics
  offerName: z.string()
    .min(3, 'Offer name must be at least 3 characters')
    .max(100, 'Offer name must be less than 100 characters'),
  
  offerValue: z.string()
    .min(10, 'Please provide a more detailed value proposition')
    .max(200, 'Value proposition is too long'),
  
  regularPrice: z.string()
    .min(1, 'Regular price is required')
    .regex(/^\$?[\d,]+(\.\d{2})?$/, 'Please enter a valid price format'),
  
  offerPrice: z.string()
    .min(1, 'Offer price is required')
    .regex(/^\$?[\d,]+(\.\d{2})?$/, 'Please enter a valid price format'),
  
  expiryDate: z.string()
    .min(1, 'Expiry date is required'),
  
  targetIndustry: z.string()
    .min(1, 'Please select a target industry'),

  // Offer Strategy
 offerType: z.enum(['discount', 'bonus', 'trial', 'guarantee'], {
  message: 'Please select a valid offer type'
}),

  // Conditional fields based on offer type
  discountValue: z.number()
    .min(1, 'Discount must be at least 1%')
    .max(99, 'Discount cannot be more than 99%')
    .optional(),
  
  discountAmount: z.string()
    .regex(/^\$?[\d,]+(\.\d{2})?$/, 'Please enter a valid amount format')
    .optional(),
  
  bonusItem: z.string()
    .min(3, 'Bonus item name must be at least 3 characters')
    .max(100, 'Bonus item name is too long')
    .optional(),
  
  bonusValue: z.string()
    .regex(/^\$?[\d,]+(\.\d{2})?$/, 'Please enter a valid value format')
    .optional(),
  
  totalValue: z.string()
    .regex(/^\$?[\d,]+(\.\d{2})?$/, 'Please enter a valid total value format')
    .optional(),
  
  trialPeriod: z.number()
    .min(1, 'Trial period must be at least 1 day')
    .max(365, 'Trial period cannot exceed 365 days')
    .optional(),
  
  guaranteePeriod: z.number()
    .min(1, 'Guarantee period must be at least 1 day')
    .max(365, 'Guarantee period cannot exceed 365 days')
    .optional(),

  // Conversion Boosters
  cta: z.string()
    .max(50, 'Call-to-action is too long')
    .optional(),
  
  redemptionInstructions: z.string()
    .max(200, 'Redemption instructions are too long')
    .optional(),
  
  scarcity: z.boolean().optional(),
  
  scarcityReason: z.string()
    .min(5, 'Please provide more detail about scarcity')
    .max(100, 'Scarcity reason is too long')
    .optional(),
  
  socialProof: z.boolean().optional(),
  
  testimonialQuote: z.string()
    .min(10, 'Testimonial quote should be more detailed')
    .max(300, 'Testimonial quote is too long')
    .optional(),
  
  testimonialAuthor: z.string()
    .min(2, 'Please provide the testimonial author')
    .max(100, 'Author name is too long')
    .optional(),

  // Additional Context (optional)
  businessGoal: z.enum(['lead-generation', 'sales', 'retention', 'upsell', 'brand-awareness']).optional(),
  customerSegment: z.enum(['new', 'existing', 'churned', 'high-value']).optional(),
  seasonality: z.string().max(200).optional(),
  competitorAnalysis: z.string().max(500).optional(),

  // System field
  userId: z.string().min(1, 'User ID is required')
}).superRefine((data, ctx) => {
  // Conditional validation based on offer type
  if (data.offerType === 'discount') {
    if (!data.discountValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount percentage is required for discount offers',
        path: ['discountValue']
      });
    }
    if (!data.discountAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount amount is required for discount offers',
        path: ['discountAmount']
      });
    }
  }

  if (data.offerType === 'bonus') {
    if (!data.bonusItem) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bonus item is required for bonus offers',
        path: ['bonusItem']
      });
    }
    if (!data.bonusValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bonus value is required for bonus offers',
        path: ['bonusValue']
      });
    }
  }

  if (data.offerType === 'trial' && !data.trialPeriod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Trial period is required for trial offers',
      path: ['trialPeriod']
    });
  }

  if (data.offerType === 'guarantee' && !data.guaranteePeriod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Guarantee period is required for guarantee offers',
      path: ['guaranteePeriod']
    });
  }

  // Scarcity validation
  if (data.scarcity && !data.scarcityReason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Scarcity reason is required when scarcity is enabled',
      path: ['scarcityReason']
    });
  }

  // Social proof validation
  if (data.socialProof) {
    if (!data.testimonialQuote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Testimonial quote is required when social proof is enabled',
        path: ['testimonialQuote']
      });
    }
    if (!data.testimonialAuthor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Testimonial author is required when social proof is enabled',
        path: ['testimonialAuthor']
      });
    }
  }

  // Price validation
  const regularPriceNum = parseFloat(data.regularPrice.replace(/[$,]/g, ''));
  const offerPriceNum = parseFloat(data.offerPrice.replace(/[$,]/g, ''));
  
  if (offerPriceNum >= regularPriceNum) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Offer price must be lower than regular price',
      path: ['offerPrice']
    });
  }

  // Expiry date validation
  const expiryDate = new Date(data.expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (expiryDate <= today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expiry date must be in the future',
      path: ['expiryDate']
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

// Business logic validation
export function validateOfferBusinessRules(data: z.infer<typeof offerCreatorSchema>): BusinessRulesValidation {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const conversionFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }> = [];

  // Price analysis
  const regularPrice = parseFloat(data.regularPrice.replace(/[$,]/g, ''));
  const offerPrice = parseFloat(data.offerPrice.replace(/[$,]/g, ''));
  const discountPercentage = ((regularPrice - offerPrice) / regularPrice) * 100;

  if (discountPercentage > 50) {
    warnings.push('Very high discount may hurt perceived value');
    conversionFactors.push({
      factor: 'High discount percentage',
      impact: 'negative',
      weight: 0.2
    });
  } else if (discountPercentage >= 25) {
    conversionFactors.push({
      factor: 'Strong discount incentive',
      impact: 'positive',
      weight: 0.3
    });
  } else if (discountPercentage < 10) {
    suggestions.push('Consider increasing discount for stronger motivation');
    conversionFactors.push({
      factor: 'Minimal discount incentive',
      impact: 'neutral',
      weight: 0.1
    });
  }

  // Offer type effectiveness
  const offerTypeScores = {
    guarantee: 0.35,
    bonus: 0.30,
    discount: 0.25,
    trial: 0.20
  };

  conversionFactors.push({
    factor: `${data.offerType} offer type`,
    impact: 'positive',
    weight: offerTypeScores[data.offerType]
  });

  // Urgency/Scarcity analysis
  if (data.scarcity) {
    conversionFactors.push({
      factor: 'Scarcity element',
      impact: 'positive',
      weight: 0.25
    });
  } else {
    suggestions.push('Adding scarcity could increase urgency and conversions');
  }

  // Social proof analysis
  if (data.socialProof) {
    conversionFactors.push({
      factor: 'Social proof included',
      impact: 'positive',
      weight: 0.20
    });
  } else {
    suggestions.push('Adding testimonials or social proof could build trust');
  }

  // Expiry date analysis
  const expiryDate = new Date(data.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry > 30) {
    warnings.push('Long expiry period may reduce urgency');
    conversionFactors.push({
      factor: 'Extended deadline',
      impact: 'negative',
      weight: 0.15
    });
  } else if (daysUntilExpiry <= 7) {
    conversionFactors.push({
      factor: 'Short deadline creates urgency',
      impact: 'positive',
      weight: 0.25
    });
  }

  // Industry-specific suggestions
  const industryTips = {
    'B2B SaaS': [
      'Consider highlighting ROI and time savings',
      'Annual payment discounts work well',
      'Free trial extensions are effective'
    ],
    'E-commerce': [
      'Bundle deals increase average order value',
      'Free shipping thresholds drive larger orders',
      'Limited inventory creates urgency'
    ],
    'Healthcare': [
      'Emphasize safety and reliability',
      'Professional certifications build trust',
      'Patient testimonials are powerful'
    ],
    'Education': [
      'Early bird pricing rewards commitment',
      'Completion guarantees reduce risk',
      'Skill-based outcomes resonate well'
    ],
    'Finance': [
      'Security and compliance are crucial',
      'Money-back guarantees reduce risk',
      'Professional credentials build trust'
    ],
    'Marketing Agencies': [
      'Performance guarantees work well',
      'Case studies are very effective',
      'ROI-focused messaging converts'
    ],
    'Real Estate': [
      'Local market expertise matters',
      'Success stories are powerful',
      'Time-sensitive market conditions'
    ],
    'Manufacturing': [
      'Quality certifications are important',
      'Cost savings and efficiency focus',
      'Long-term partnership messaging'
    ]
  };

  if (data.targetIndustry in industryTips) {
    suggestions.push(...(industryTips[data.targetIndustry as keyof typeof industryTips] || []).slice(0, 2));
  }

  // Calculate conversion prediction score
  const baseScore = 50;
  const positiveImpact = conversionFactors
    .filter(f => f.impact === 'positive')
    .reduce((sum, f) => sum + (f.weight * 100), 0);
  
  const negativeImpact = conversionFactors
    .filter(f => f.impact === 'negative')
    .reduce((sum, f) => sum + (f.weight * 50), 0);

  const conversionScore = Math.min(95, Math.max(20, baseScore + positiveImpact - negativeImpact));

  // CTA analysis
  if (!data.cta) {
    suggestions.push('Add a compelling call-to-action to drive action');
  } else if (data.cta.length > 30) {
    warnings.push('CTA might be too long - consider shortening for impact');
  }

  // Additional validation checks
  if (regularPrice < 50) {
    suggestions.push('Consider bundling products to increase perceived value');
  } else if (regularPrice > 5000) {
    suggestions.push('High-ticket offers benefit from payment plans and consultations');
  }

  // Business goal specific suggestions
  if (data.businessGoal) {
    const goalSuggestions = {
      'lead-generation': 'Focus on low-friction offers like free trials or consultations',
      'sales': 'Strong value proposition and urgency elements are crucial',
      'retention': 'Loyalty bonuses and exclusive access work well',
      'upsell': 'Highlight enhanced features and premium benefits',
      'brand-awareness': 'Generous offers with sharing incentives increase reach'
    };
    
    const goalSuggestion = goalSuggestions[data.businessGoal];
    if (goalSuggestion) {
      suggestions.push(goalSuggestion);
    }
  }

  // Customer segment specific recommendations
  if (data.customerSegment) {
    const segmentRecommendations = {
      'new': 'Lower barrier offers like trials work better for new customers',
      'existing': 'Loyalty rewards and exclusive offers increase effectiveness',
      'churned': 'Win-back offers should include strong guarantees',
      'high-value': 'Premium positioning and exclusive access appeal to VIP customers'
    };
    
    const segmentRec = segmentRecommendations[data.customerSegment];
    if (segmentRec) {
      suggestions.push(segmentRec);
    }
  }

  return {
    isValid: true,
    warnings,
    suggestions: suggestions.slice(0, 8), // Limit to top 8 suggestions
    conversionPrediction: {
      score: Math.round(conversionScore),
      factors: conversionFactors
    }
  };
}

// Helper function to extract offer insights
export function extractOfferInsights(data: z.infer<typeof offerCreatorSchema>): OfferInsights {
  const regularPrice = parseFloat(data.regularPrice.replace(/[$,]/g, ''));
  const offerPrice = parseFloat(data.offerPrice.replace(/[$,]/g, ''));
  const savings = regularPrice - offerPrice;
  const discountPercentage = (savings / regularPrice) * 100;

  return {
    pricing: {
      regularPrice,
      offerPrice,
      savings,
      discountPercentage: Math.round(discountPercentage),
      pricePoint: regularPrice > 1000 ? 'high-ticket' : regularPrice > 100 ? 'mid-ticket' : 'low-ticket'
    },
    urgency: {
      hasScarcity: data.scarcity || false,
      hasDeadline: true,
      expiryDate: data.expiryDate,
      daysUntilExpiry: Math.ceil((new Date(data.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    },
    trust: {
      hasSocialProof: data.socialProof || false,
      hasGuarantee: data.offerType === 'guarantee',
      hasTestimonial: !!(data.testimonialQuote && data.testimonialAuthor)
    },
    offerStrength: {
      type: data.offerType,
      valueProposition: data.offerValue,
      targetMarket: data.targetIndustry,
      hasBonus: data.offerType === 'bonus',
      hasTrial: data.offerType === 'trial'
    },
    recommendations: generateRecommendations(data)
  };
}

function generateRecommendations(data: z.infer<typeof offerCreatorSchema>): string[] {
  const recommendations: string[] = [];
  
  // Based on offer type
  switch (data.offerType) {
    case 'discount':
      recommendations.push('Consider adding a fast-action bonus for early purchasers');
      if (!data.scarcity) {
        recommendations.push('Add limited quantity to create scarcity');
      }
      break;
    case 'bonus':
      recommendations.push('Clearly communicate the value of the bonus item');
      recommendations.push('Consider making the bonus time-limited');
      break;
    case 'trial':
      recommendations.push('Reduce friction in the signup process');
      recommendations.push('Set clear expectations for the trial period');
      break;
    case 'guarantee':
      recommendations.push('Make the guarantee terms crystal clear');
      recommendations.push('Use the guarantee to justify premium pricing');
      break;
  }

  // Based on price point
  const regularPrice = parseFloat(data.regularPrice.replace(/[$,]/g, ''));
  if (regularPrice > 500) {
    recommendations.push('Consider offering payment plans to reduce barrier');
    recommendations.push('Emphasize ROI and long-term value');
  }

  // Based on industry
  const industryRecommendations = {
    'B2B SaaS': 'Highlight integration capabilities and support',
    'E-commerce': 'Include shipping and return policy details',
    'Healthcare': 'Emphasize safety and compliance credentials',
    'Finance': 'Focus on security and regulatory compliance',
    'Education': 'Show learning outcomes and success metrics',
    'Marketing Agencies': 'Include case studies and ROI examples',
    'Real Estate': 'Emphasize local market expertise',
    'Manufacturing': 'Focus on quality certifications and standards'
  };

  if (data.targetIndustry in industryRecommendations) {
    recommendations.push(industryRecommendations[data.targetIndustry as keyof typeof industryRecommendations]);
  }

  // Missing elements
  if (!data.socialProof) {
    recommendations.push('Add customer testimonials or reviews');
  }

  if (!data.scarcity) {
    recommendations.push('Consider adding time or quantity limitations');
  }

  if (!data.cta) {
    recommendations.push('Add a clear and compelling call-to-action');
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

// Additional validation schemas for other endpoints

export const performanceDataSchema = z.object({
  views: z.number().min(0, 'Views must be a positive number'),
  clicks: z.number().min(0, 'Clicks must be a positive number'),
  conversions: z.number().min(0, 'Conversions must be a positive number'),
  revenue: z.number().min(0, 'Revenue must be a positive number'),
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
  return data.clicks <= data.views;
}, {
  message: 'Clicks cannot exceed views',
  path: ['clicks']
}).refine((data) => {
  return data.conversions <= data.clicks;
}, {
  message: 'Conversions cannot exceed clicks',
  path: ['conversions']
});

export const optimizationRequestSchema = z.object({
 type: z.enum(['headline', 'cta', 'urgency', 'social-proof', 'pricing'], {
  message: 'Invalid optimization type'
})
});

export const analysisRequestSchema = z.object({
  offerText: z.string()
    .min(50, 'Offer text must be at least 50 characters')
    .max(2000, 'Offer text must be less than 2000 characters'),
  industry: z.string().optional(),
analysisType: z.enum(['conversion', 'psychology', 'competition'], {
  message: 'Invalid analysis type'
}).default('conversion')
});

// Type exports
export type PerformanceDataInput = z.infer<typeof performanceDataSchema>;
export type OptimizationRequest = z.infer<typeof optimizationRequestSchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

// Validation helper functions
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

// Business validation helpers
export function validateOfferPerformance(metrics: any): {
  isValid: boolean;
  warnings: string[];
  insights: string[];
} {
  const warnings: string[] = [];
  const insights: string[] = [];

  const { clickThroughRate, conversionRate, averageOrderValue } = metrics;

  // CTR Analysis
  if (clickThroughRate < 2) {
    warnings.push('Click-through rate is below industry average (2-4%)');
    insights.push('Consider testing different headlines or visual elements');
  } else if (clickThroughRate > 8) {
    insights.push('Excellent click-through rate! Your offer is very appealing');
  }

  // Conversion Rate Analysis
  if (conversionRate < 2) {
    warnings.push('Conversion rate is below average (2-5%)');
    insights.push('Try adding urgency, social proof, or risk reversal elements');
  } else if (conversionRate > 10) {
    insights.push('Outstanding conversion rate! Consider scaling this offer');
  }

  // AOV Analysis
  if (averageOrderValue > 0) {
    if (averageOrderValue < 50) {
      insights.push('Consider upsells or bundles to increase order value');
    } else if (averageOrderValue > 500) {
      insights.push('High-value customers - focus on retention and referrals');
    }
  }

  return {
    isValid: true,
    warnings,
    insights
  };
}

// Cache key generator
export function generateCacheKey(input: OfferCreatorInput): string {
  const keyData = {
    offerName: input.offerName,
    offerType: input.offerType,
    regularPrice: input.regularPrice,
    offerPrice: input.offerPrice,
    targetIndustry: input.targetIndustry,
    discountValue: input.discountValue,
    bonusItem: input.bonusItem,
    trialPeriod: input.trialPeriod,
    guaranteePeriod: input.guaranteePeriod
  };
  
  return Buffer.from(JSON.stringify(keyData)).toString('base64');
}
