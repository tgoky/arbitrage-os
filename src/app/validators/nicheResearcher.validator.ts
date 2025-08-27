// validators/nicheResearcher.validator.ts - UPDATED TO MATCH NEW TYPES
import { z } from 'zod';

const nicheResearchSchema = z.object({
  // Business & Strategic Goals - REQUIRED
  primaryObjective: z.enum(['cashflow', 'equity-exit', 'lifestyle', 'audience-build', 'saas', 'agency', 'ecomm']),
  riskAppetite: z.enum(['low', 'medium', 'high']),
  
  // Target Customer Preferences - REQUIRED
  marketType: z.enum(['b2b-saas', 'b2c-consumer', 'professional-services', 'local-business', 'info-education']),
  customerSize: z.enum(['startups', 'smb', 'enterprise', 'consumers', 'government']),
  industries: z.array(z.string()).optional(),
  geographicFocus: z.enum(['local', 'regional', 'us-only', 'global']).optional(),
    targetArea: z.string().max(100, 'Target area is too long').optional(),
  
  // Constraints & Resources - REQUIRED budget, others optional
  budget: z.enum(['<10k', '10k-50k', '50k-250k', '250k+']),
  teamSize: z.enum(['solo', 'small-team', 'established-team']).optional(),
  skills: z.array(z.string()).max(15, 'Please select no more than 15 skills').optional(),
  timeCommitment: z.enum(['5-10', '10-20', '20-30', '30+']).optional(),
  
  // Market Directional Inputs - ALL OPTIONAL
  problems: z.string()
    .max(1000, 'Problems description is too long')
    .optional(),
  excludedIndustries: z.array(z.string()).max(10).optional(),
  monetizationPreference: z.enum(['high-ticket', 'subscription', 'low-ticket', 'ad-supported']).optional(),
  acquisitionChannels: z.array(z.string()).max(10).optional(),
  
  // Validation & Scalability Factors - ALL OPTIONAL
  validationData: z.array(z.string()).max(10).optional(),
  competitionPreference: z.enum(['low-competition', 'high-potential']).optional(),
  scalabilityPreference: z.enum(['stay-small', 'grow-fast', 'build-exit']).optional(),
  
  // System field
  userId: z.string().optional()
});


export function validateNicheResearchInput(data: any): 
  | { success: true; data: z.infer<typeof nicheResearchSchema> }
  | { success: false; errors: any[] } {
  try {
    console.log('🔍 Validating niche research input:', data);
    
    // Clean up the data
    const cleanedData = {
      ...data,
      // Ensure arrays are arrays, not undefined
      industries: Array.isArray(data.industries) ? data.industries : [],
      excludedIndustries: Array.isArray(data.excludedIndustries) ? data.excludedIndustries : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      acquisitionChannels: Array.isArray(data.acquisitionChannels) ? data.acquisitionChannels : [],
      validationData: Array.isArray(data.validationData) ? data.validationData : [],
      // Clean string fields
      problems: data.problems || undefined,
      targetArea: data.targetArea || undefined,
    };

    const validated = nicheResearchSchema.parse(cleanedData);
    
    // Custom validation: targetArea required for local/regional
    if ((validated.geographicFocus === 'local' || validated.geographicFocus === 'regional') 
        && !validated.targetArea?.trim()) {
      console.error('❌ Target area required for local/regional focus');
      return {
        success: false,
        errors: [{
          code: 'custom',
          path: ['targetArea'],
          message: `Target ${validated.geographicFocus === 'local' ? 'city/area' : 'region'} is required when geographic focus is ${validated.geographicFocus}`
        }]
      };
    }
    
    console.log('✅ Validation successful');
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation errors:', error.issues);
      return { success: false, errors: error.issues };
    }
    console.error('❌ Unknown validation error:', error);
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}


// Business logic validation for better UX
export function validateNicheResearchBusinessRules(data: z.infer<typeof nicheResearchSchema>): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Budget vs objective alignment
  const budgetAmounts = {
    '<10k': 5000,
    '10k-50k': 30000,
    '50k-250k': 150000,
    '250k+': 500000
  };

  const estimatedBudget = budgetAmounts[data.budget];

  // High-growth objectives need adequate funding
  if ((data.primaryObjective === 'equity-exit' || data.primaryObjective === 'saas') && estimatedBudget < 30000) {
    warnings.push('Building for equity/exit typically requires more capital for faster growth');
    suggestions.push('Consider starting with cashflow focus and reinvesting profits for growth');
  }

  // Lifestyle business with high budget
  if (data.primaryObjective === 'lifestyle' && estimatedBudget > 150000) {
    suggestions.push('Your budget allows for premium lifestyle business opportunities or multiple revenue streams');
  }

  // Team size vs objectives
  if (data.teamSize === 'solo' && (data.primaryObjective === 'saas' || data.primaryObjective === 'agency')) {
    warnings.push('Solo founders in SaaS/Agency spaces face significant challenges scaling');
    suggestions.push('Consider building strategic partnerships or planning for early hires');
  }

  // Time vs objectives
  if (data.timeCommitment === '5-10' && data.primaryObjective === 'equity-exit') {
    warnings.push('Building for exit typically requires significant time investment');
    suggestions.push('Consider passive investment opportunities or automated business models');
  }

  // Market type vs customer size alignment
  const misalignedCombos = [
    { market: 'b2c-consumer', customer: 'enterprise' },
    { market: 'professional-services', customer: 'consumers' }
  ];

  const hasMisalignment = misalignedCombos.some(combo => 
    data.marketType === combo.market && data.customerSize === combo.customer
  );

  if (hasMisalignment) {
    warnings.push('Market type and customer size may not align optimally');
    suggestions.push('Consider refining your target market definition');
  }

  // Geographic vs market type
  if (data.geographicFocus === 'local' && data.marketType === 'b2b-saas') {
    suggestions.push('Local focus with B2B SaaS is unusual - consider if this limits your addressable market');
  }

  // Skills analysis
  if (data.skills && data.skills.length > 0) {
    const techSkills = ['Tech Development', 'AI/ML', 'Data Analysis', 'SEO'];
    const businessSkills = ['Marketing', 'Sales', 'Operations', 'Finance'];
    
    const hasTech = data.skills.some(skill => techSkills.includes(skill));
    const hasBusiness = data.skills.some(skill => businessSkills.includes(skill));
    
    if (hasTech && hasBusiness) {
      suggestions.push('Your tech-business skill combination is valuable for modern opportunities');
    } else if (hasTech && !hasBusiness) {
      suggestions.push('Consider developing business skills to complement your technical expertise');
    } else if (!hasTech && hasBusiness) {
      suggestions.push('Your business skills are strong - consider how to leverage technology for scaling');
    }
  }

  // Risk appetite vs preferences
  if (data.riskAppetite === 'low' && data.competitionPreference === 'high-potential') {
    warnings.push('Low risk appetite typically conflicts with high-potential (competitive) markets');
    suggestions.push('Consider focusing on proven markets with differentiation opportunities');
  }

  return {
    isValid: true,
    warnings,
    suggestions
  };
}

// Helper to extract key insights from validated input
export function extractNicheInputInsights(data: z.infer<typeof nicheResearchSchema>) {
  const insights = {
    primaryFocus: '',
    keyConstraints: [] as string[],
    opportunities: [] as string[],
    recommendations: [] as string[]
  };

  // Primary focus based on objective
  const focusMap = {
    'cashflow': 'Immediate revenue generation',
    'equity-exit': 'Building scalable, valuable business',
    'lifestyle': 'Work-life balance optimization',
    'audience-build': 'Community and audience development',
    'saas': 'Recurring revenue software',
    'agency': 'Service-based business model',
    'ecomm': 'Product sales and commerce'
  };

  insights.primaryFocus = focusMap[data.primaryObjective];

  // Key constraints
  const budgetConstraint = {
    '<10k': 'Bootstrap/lean startup approach required',
    '10k-50k': 'Moderate initial investment available',
    '50k-250k': 'Substantial funding for growth',
    '250k+': 'Well-funded startup opportunity'
  };

  insights.keyConstraints.push(budgetConstraint[data.budget]);

  if (data.timeCommitment) {
    const timeConstraint = {
      '5-10': 'Part-time commitment limits scope',
      '10-20': 'Moderate time investment available',
      '20-30': 'Significant time for business building',
      '30+': 'Full-time entrepreneurial focus'
    };
    insights.keyConstraints.push(timeConstraint[data.timeCommitment]);
  }

  if (data.teamSize === 'solo') {
    insights.keyConstraints.push('Solo founder requires efficient, manageable scope');
  }

  // Opportunities based on skills and preferences
  if (data.skills && data.skills.length > 0) {
    insights.opportunities.push(`Leverage ${data.skills.length} identified skills for competitive advantage`);
  }

  if (data.geographicFocus === 'global') {
    insights.opportunities.push('Global focus expands addressable market significantly');
  }

  if (data.acquisitionChannels && data.acquisitionChannels.length > 0) {
    insights.opportunities.push('Clear acquisition strategy preferences identified');
  }

  // Generate recommendations
  if (data.riskAppetite === 'low' && data.budget === '<10k') {
    insights.recommendations.push('Focus on service-based businesses with predictable revenue');
  }

  if (data.primaryObjective === 'saas' && data.skills?.includes('Tech Development')) {
    insights.recommendations.push('Technical background strongly supports SaaS development');
  }

  if (data.marketType === 'b2b-saas' && data.customerSize === 'smb') {
    insights.recommendations.push('SMB B2B SaaS market offers good balance of opportunity and accessibility');
  }

  return insights;
}

// Type exports
export type NicheResearchInput = z.infer<typeof nicheResearchSchema>;