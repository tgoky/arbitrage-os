// validators/growthPlan.validator.ts - COMPLETE VERSION
import { z } from 'zod';

const caseStudySchema = z.object({
  client: z.string().min(1).max(100),
  result: z.string().min(1).max(500)
});

const growthPlanSchema = z.object({
  // User Information
  email: z.string().email('Invalid email address'),
  name: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  
  // Client Information
  clientCompany: z.string().min(1).max(100),
  industry: z.string().min(1).max(50),
  contactName: z.string().min(1).max(100),
  contactRole: z.string().min(1).max(100),
  
  // Discovery & Expertise
  transcript: z.string().max(10000).optional(),
  expertise: z.array(z.string().min(1)).min(1, 'At least one expertise area is required').max(10),
  experience: z.string().min(10).max(2000),
  
  // Case Studies
  caseStudies: z.array(caseStudySchema).max(5).optional(),
  
  // Plan Configuration
  timeframe: z.enum(['3m', '6m', '12m']).default('6m'),
  focusAreas: z.array(z.string()).max(5).optional(),
  budget: z.number().min(0).max(1000000).optional(),
  currentRevenue: z.number().min(0).max(10000000).optional(),
  targetRevenue: z.number().min(0).max(100000000).optional(),
  
  // Optional business context
  businessModel: z.enum(['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'E-commerce', 'Service']).optional(),
  teamSize: z.number().min(1).max(10000).optional(),
  currentChannels: z.array(z.string()).max(10).optional(),
  painPoints: z.array(z.string()).max(10).optional(),
  objectives: z.array(z.string()).max(10).optional()
});

export function validateGrowthPlanInput(data: any, partial = false): 
  | { success: true; data: z.infer<typeof growthPlanSchema> }
  | { success: false; errors: any[] } {
  try {
    let schema;
    if (partial) {
      // For partial updates, make most fields optional but keep critical ones required
      schema = growthPlanSchema.partial({
        transcript: true,
        caseStudies: true,
        focusAreas: true,
        budget: true,
        currentRevenue: true,
        targetRevenue: true,
        businessModel: true,
        teamSize: true,
        currentChannels: true,
        painPoints: true,
        objectives: true
      });
    } else {
      schema = growthPlanSchema;
    }
    
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

// Custom validation for business logic
export function validateGrowthPlanBusinessRules(data: z.infer<typeof growthPlanSchema>): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  insights: {
    complexity: 'simple' | 'moderate' | 'complex';
    feasibility: 'high' | 'medium' | 'low';
    credibility: 'strong' | 'moderate' | 'weak';
    expectedSuccess: number; // 0-100
  };
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Revenue validation
  if (data.targetRevenue && data.currentRevenue && data.targetRevenue <= data.currentRevenue) {
    warnings.push('Target revenue should be higher than current revenue for growth planning');
  }

  // Timeframe vs goals validation
  if (data.targetRevenue && data.currentRevenue) {
    const growthMultiple = data.targetRevenue / data.currentRevenue;
    if (data.timeframe === '3m' && growthMultiple > 3) {
      warnings.push('Very aggressive growth target for a 3-month timeframe');
    }
    if (data.timeframe === '6m' && growthMultiple > 5) {
      warnings.push('Very aggressive growth target for a 6-month timeframe');
    }
    if (data.timeframe === '12m' && growthMultiple > 10) {
      warnings.push('Extremely aggressive growth target even for a 12-month timeframe');
    }
  }

  // Budget validation
  if (data.budget && data.currentRevenue && data.budget > data.currentRevenue * 2) {
    warnings.push('Budget is very high relative to current revenue');
  }

  if (data.budget && data.budget < 1000) {
    warnings.push('Budget may be too low for meaningful growth initiatives');
  }

  // Expertise vs industry alignment
  const techIndustries = ['saas', 'software', 'tech', 'ai', 'fintech', 'technology'];
  const isClientTech = techIndustries.some(tech => 
    data.industry.toLowerCase().includes(tech)
  );
  const hasTechExpertise = data.expertise.some(exp => 
    techIndustries.some(tech => exp.toLowerCase().includes(tech)) ||
    exp.toLowerCase().includes('seo') ||
    exp.toLowerCase().includes('ppc') ||
    exp.toLowerCase().includes('digital') ||
    exp.toLowerCase().includes('social media') ||
    exp.toLowerCase().includes('content marketing')
  );
  
  if (isClientTech && !hasTechExpertise) {
    warnings.push('Consider highlighting any digital marketing expertise for tech industry clients');
  }

  // Case studies validation
  if (!data.caseStudies || data.caseStudies.length === 0) {
    warnings.push('Adding case studies will strengthen your growth plan credibility');
  }

  // Experience length validation
  if (data.experience.length < 50) {
    warnings.push('Consider providing more detailed experience description');
  }

  if (data.experience.length < 20) {
    errors.push('Experience description is too brief for credible growth planning');
  }

  // Team size vs revenue validation
  if (data.teamSize && data.currentRevenue) {
    const revenuePerEmployee = data.currentRevenue / data.teamSize;
    if (revenuePerEmployee < 50000) {
      warnings.push('Revenue per employee seems low - consider efficiency improvements');
    }
    if (revenuePerEmployee > 500000) {
      warnings.push('High revenue per employee - scaling team might be beneficial');
    }
  }

  // Focus areas validation
  if (data.focusAreas && data.focusAreas.length > 3) {
    warnings.push('Consider focusing on 2-3 key areas for better execution');
  }

  // Business model specific validations
  if (data.businessModel === 'SaaS' && data.expertise.some(exp => exp.toLowerCase().includes('subscription'))) {
    // Good alignment
  } else if (data.businessModel === 'E-commerce' && !data.expertise.some(exp => 
    exp.toLowerCase().includes('conversion') || 
    exp.toLowerCase().includes('ecommerce') ||
    exp.toLowerCase().includes('retail')
  )) {
    warnings.push('Consider highlighting e-commerce or conversion expertise');
  }

  // Calculate insights
  const complexity = calculateComplexity(data);
  const feasibility = calculateFeasibility(data, warnings.length, errors.length);
  const credibility = calculateCredibility(data);
  const expectedSuccess = calculateExpectedSuccess(data, warnings.length, errors.length);

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    insights: {
      complexity,
      feasibility,
      credibility,
      expectedSuccess
    }
  };
}

function calculateComplexity(data: z.infer<typeof growthPlanSchema>): 'simple' | 'moderate' | 'complex' {
  let complexityScore = 0;

  // Revenue growth complexity
  if (data.targetRevenue && data.currentRevenue) {
    const growthMultiple = data.targetRevenue / data.currentRevenue;
    if (growthMultiple > 5) complexityScore += 3;
    else if (growthMultiple > 2) complexityScore += 2;
    else complexityScore += 1;
  }

  // Industry complexity
  const complexIndustries = ['healthcare', 'finance', 'fintech', 'biotech', 'pharmaceuticals'];
  if (complexIndustries.some(industry => data.industry.toLowerCase().includes(industry))) {
    complexityScore += 2;
  }

  // Business model complexity
  const complexModels = ['Marketplace', 'B2B2C'];
  if (data.businessModel && complexModels.includes(data.businessModel)) {
    complexityScore += 2;
  }

  // Team size complexity
  if (data.teamSize && data.teamSize > 100) {
    complexityScore += 2;
  } else if (data.teamSize && data.teamSize > 50) {
    complexityScore += 1;
  }

  // Focus areas complexity
  if (data.focusAreas && data.focusAreas.length > 3) {
    complexityScore += 1;
  }

  if (complexityScore <= 3) return 'simple';
  if (complexityScore <= 6) return 'moderate';
  return 'complex';
}

function calculateFeasibility(data: z.infer<typeof growthPlanSchema>, warningsCount: number, errorsCount: number): 'high' | 'medium' | 'low' {
  if (errorsCount > 0) return 'low';
  if (warningsCount > 3) return 'low';
  if (warningsCount > 1) return 'medium';

  // Check for realistic goals
  if (data.targetRevenue && data.currentRevenue) {
    const growthMultiple = data.targetRevenue / data.currentRevenue;
    const months = data.timeframe === '3m' ? 3 : data.timeframe === '6m' ? 6 : 12;
    const monthlyGrowthRequired = Math.pow(growthMultiple, 1/months) - 1;
    
    if (monthlyGrowthRequired > 0.5) return 'low'; // >50% monthly growth
    if (monthlyGrowthRequired > 0.2) return 'medium'; // >20% monthly growth
  }

  return 'high';
}

function calculateCredibility(data: z.infer<typeof growthPlanSchema>): 'strong' | 'moderate' | 'weak' {
  let credibilityScore = 0;

  // Case studies
  if (data.caseStudies && data.caseStudies.length >= 3) credibilityScore += 3;
  else if (data.caseStudies && data.caseStudies.length >= 1) credibilityScore += 2;
  else credibilityScore += 0;

  // Experience description
  if (data.experience.length > 500) credibilityScore += 3;
  else if (data.experience.length > 200) credibilityScore += 2;
  else if (data.experience.length > 50) credibilityScore += 1;

  // Expertise breadth
  if (data.expertise.length >= 5) credibilityScore += 2;
  else if (data.expertise.length >= 3) credibilityScore += 1;

  // Industry-expertise alignment
  const hasRelevantExpertise = data.expertise.some(exp => 
    exp.toLowerCase().includes(data.industry.toLowerCase()) ||
    data.industry.toLowerCase().includes(exp.toLowerCase())
  );
  if (hasRelevantExpertise) credibilityScore += 2;

  if (credibilityScore >= 8) return 'strong';
  if (credibilityScore >= 5) return 'moderate';
  return 'weak';
}

function calculateExpectedSuccess(data: z.infer<typeof growthPlanSchema>, warningsCount: number, errorsCount: number): number {
  let successScore = 70; // Base score

  // Penalize for errors and warnings
  successScore -= errorsCount * 20;
  successScore -= warningsCount * 5;

  // Boost for positive factors
  if (data.caseStudies && data.caseStudies.length > 0) {
    successScore += data.caseStudies.length * 5;
  }

  if (data.experience.length > 200) {
    successScore += 10;
  }

  if (data.expertise.length >= 3) {
    successScore += 5;
  }

  // Budget adequacy
  if (data.budget && data.currentRevenue && data.budget >= data.currentRevenue * 0.1) {
    successScore += 10;
  }

  // Realistic timeline
  if (data.timeframe === '12m') {
    successScore += 10; // Longer timeframes are more realistic
  } else if (data.timeframe === '3m') {
    successScore -= 10; // Very short timeframes are challenging
  }

  return Math.max(0, Math.min(100, successScore));
}

// Helper function to extract growth plan insights
export function extractGrowthPlanInsights(data: z.infer<typeof growthPlanSchema>) {
  const insights = {
    context: {
      hasTranscript: !!data.transcript,
      hasRevenueData: !!(data.currentRevenue && data.targetRevenue),
      hasBudget: !!data.budget,
      hasCaseStudies: !!(data.caseStudies && data.caseStudies.length > 0),
      industrySpecific: data.expertise.some(exp => 
        exp.toLowerCase().includes(data.industry.toLowerCase())
      )
    },
    scope: {
      expertiseAreas: data.expertise.length,
      focusAreas: data.focusAreas?.length || 0,
      timeframe: data.timeframe,
      businessModel: data.businessModel || 'Not specified',
      teamSize: data.teamSize || 'Not specified'
    },
    growth: {
      hasGrowthTarget: !!(data.currentRevenue && data.targetRevenue),
      growthMultiple: data.currentRevenue && data.targetRevenue ? 
        data.targetRevenue / data.currentRevenue : null,
      monthlyGrowthRequired: calculateMonthlyGrowthRequired(data),
      budgetToRevenueRatio: data.budget && data.currentRevenue ? 
        data.budget / data.currentRevenue : null
    },
    recommendations: {
      shouldAddCaseStudies: !data.caseStudies || data.caseStudies.length === 0,
      shouldExpandExperience: data.experience.length < 100,
      shouldNarrowFocus: (data.focusAreas?.length || 0) > 3,
      shouldAdjustTimeline: calculateMonthlyGrowthRequired(data) > 0.3,
      shouldIncreaseBudget: data.budget && data.currentRevenue && 
        data.budget < data.currentRevenue * 0.05
    }
  };

  return insights;
}

function calculateMonthlyGrowthRequired(data: z.infer<typeof growthPlanSchema>): number {
  if (!data.currentRevenue || !data.targetRevenue) return 0;
  
  const growthMultiple = data.targetRevenue / data.currentRevenue;
  const months = data.timeframe === '3m' ? 3 : data.timeframe === '6m' ? 6 : 12;
  
  return Math.pow(growthMultiple, 1/months) - 1;
}

// Helper function to generate validation suggestions
export function generateGrowthPlanSuggestions(data: z.infer<typeof growthPlanSchema>) {
  const suggestions = {
    improvements: [] as string[],
    optimizations: [] as string[],
    alternatives: [] as string[]
  };

  // Improvements
  if (!data.caseStudies || data.caseStudies.length === 0) {
    suggestions.improvements.push('Add 2-3 relevant case studies to strengthen credibility');
  }

  if (data.experience.length < 100) {
    suggestions.improvements.push('Expand experience description with specific achievements and metrics');
  }

  if (data.expertise.length < 3) {
    suggestions.improvements.push('Add more expertise areas to demonstrate comprehensive capabilities');
  }

  // Optimizations
  if (data.focusAreas && data.focusAreas.length > 3) {
    suggestions.optimizations.push('Consider focusing on 2-3 key areas for better execution and results');
  }

  const monthlyGrowth = calculateMonthlyGrowthRequired(data);
  if (monthlyGrowth > 0.2) {
    suggestions.optimizations.push('Consider extending timeframe for more realistic growth targets');
  }

  if (data.budget && data.currentRevenue && data.budget < data.currentRevenue * 0.05) {
    suggestions.optimizations.push('Consider increasing budget allocation for meaningful growth impact');
  }

  // Alternatives
  if (data.timeframe === '3m' && monthlyGrowth > 0.15) {
    suggestions.alternatives.push('Alternative: 6-month timeline for more sustainable growth');
  }

  if (data.targetRevenue && data.currentRevenue) {
    const conservativeTarget = data.currentRevenue * 2;
    if (data.targetRevenue > conservativeTarget) {
      suggestions.alternatives.push(`Alternative: Conservative target of $${conservativeTarget.toLocaleString()} for higher success probability`);
    }
  }

  return suggestions;
}

// Type exports
export type GrowthPlanInput = z.infer<typeof growthPlanSchema>;
export type CaseStudy = z.infer<typeof caseStudySchema>;