// validators/nicheResearcher.validator.ts
import { z } from 'zod';

const nicheResearchSchema = z.object({
  // Professional Background
  roles: z.string()
    .min(20, 'Please provide more detail about your professional background')
    .max(1000, 'Professional background description is too long'),
  
  skills: z.array(z.string())
    .min(1, 'Please select at least one skill')
    .max(10, 'Please select no more than 10 skills')
    .refine(skills => skills.every(skill => skill.length > 0), 'Invalid skill selection'),
  
  competencies: z.string()
    .min(20, 'Please describe your unique competencies in more detail')
    .max(500, 'Competencies description is too long'),

  // Personal Interests & Network
  interests: z.string()
    .min(10, 'Please describe your interests in more detail')
    .max(500, 'Interests description is too long'),
  
  connections: z.string()
    .min(10, 'Please describe your network connections in more detail')
    .max(500, 'Network description is too long'),
  
  audienceAccess: z.string()
    .max(300, 'Audience access description is too long')
    .optional(),

  // Market Insights & Constraints
  problems: z.string()
    .min(20, 'Please describe business problems you\'ve noticed in more detail')
    .max(1000, 'Problems description is too long'),
  
  trends: z.string()
    .min(10, 'Please describe emerging trends that interest you')
    .max(500, 'Trends description is too long'),
  
  // Fixed enum definitions - Compatible with all Zod versions
  time: z.enum(['5-10', '10-20', '20-30', '30+']),
  budget: z.enum(['0-1k', '1k-5k', '5k-10k', '10k+']),
  location: z.enum(['remote-only', 'local-focused', 'hybrid']),
  
  otherConstraints: z.string()
    .max(300, 'Other constraints description is too long')
    .optional(),

  // Optional additional context
  currentEmploymentStatus: z.enum(['employed', 'unemployed', 'freelancing', 'student', 'retired']).optional(),
  industryExperience: z.array(z.string()).max(5).optional(),
  educationLevel: z.enum(['high-school', 'bachelors', 'masters', 'phd', 'other']).optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
  preferredBusinessModel: z.enum(['service', 'product', 'saas', 'ecommerce', 'marketplace', 'any']).optional()
});

export function validateNicheResearchInput(data: any): 
  | { success: true; data: z.infer<typeof nicheResearchSchema> }
  | { success: false; errors: any[] } {
  try {
    const validated = nicheResearchSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Fixed: Use 'issues' instead of 'errors' for compatibility
      return { success: false, errors: error.issues };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

// Business logic validation
export function validateNicheResearchBusinessRules(data: z.infer<typeof nicheResearchSchema>): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Time vs budget validation
  const timeHours = {
    '5-10': 7.5,
    '10-20': 15,
    '20-30': 25,
    '30+': 35
  } as const;

  const budgetAmount = {
    '0-1k': 500,
    '1k-5k': 3000,
    '5k-10k': 7500,
    '10k+': 15000
  } as const;

  const availableTime = timeHours[data.time];
  const availableBudget = budgetAmount[data.budget];

  // Low time + high expectations check
  if (availableTime < 15 && availableBudget > 5000) {
    warnings.push('High budget with limited time may require outsourcing or automation from the start');
    suggestions.push('Consider niches that can be heavily automated or require minimal ongoing time investment');
  }

  // High time + low budget check
  if (availableTime > 25 && availableBudget < 1000) {
    suggestions.push('Your high time availability is an asset - consider service-based niches that are time-intensive but low-cost to start');
  }

  // Skills diversity check
  if (data.skills.length < 3) {
    suggestions.push('Consider how you can combine your skills in unique ways for competitive advantage');
  }

  // Location vs business model alignment
  if (data.location === 'local-focused') {
    suggestions.push('Local-focused approach opens opportunities in service businesses, consulting, and location-based solutions');
  } else if (data.location === 'remote-only') {
    suggestions.push('Remote-only preference aligns well with digital products, online services, and global market opportunities');
  }

  // Network leverage validation
  const hasStrongNetwork = data.connections.length > 50 && 
    (data.connections.toLowerCase().includes('industry') || 
     data.connections.toLowerCase().includes('professional') ||
     data.connections.toLowerCase().includes('business'));

  if (hasStrongNetwork) {
    suggestions.push('Your strong professional network is a significant advantage for B2B opportunities');
  } else {
    suggestions.push('Consider building your network as part of your niche development strategy');
  }

  // Interest-skill alignment check
  const skillsText = data.skills.join(' ').toLowerCase();
  const interestsText = data.interests.toLowerCase();
  
  const hasAlignment = data.skills.some(skill => 
    interestsText.includes(skill.toLowerCase()) || 
    skill.toLowerCase().split(' ').some(word => interestsText.includes(word))
  );

  if (!hasAlignment) {
    suggestions.push('Look for ways to bridge your professional skills with your personal interests for more sustainable motivation');
  }

  // Market awareness check
  if (data.problems.length > 100 && data.trends.length > 50) {
    suggestions.push('Your strong market awareness is valuable - consider thought leadership as part of your strategy');
  }

  return {
    isValid: true, // Business rules don't invalidate, just guide
    warnings,
    suggestions
  };
}

// Helper function to extract insights from input - FIXED with proper typing
export function extractNicheInsights(data: z.infer<typeof nicheResearchSchema>) {
  const insights = {
    primaryStrengths: [] as string[], // Fixed: Explicitly type as string array
    marketOpportunities: [] as string[], // Fixed: Explicitly type as string array
    constraintFactors: [] as string[], // Fixed: Explicitly type as string array
    recommendedDirection: ''
  };

  // Analyze primary strengths
  if (data.skills.length >= 3) {
    insights.primaryStrengths.push('Diverse skill set enables multi-faceted approach');
  }

  const techSkills = ['software development', 'data analysis', 'digital marketing', 'seo', 'web development'];
  const hasTechSkills = data.skills.some(skill => 
    techSkills.some(tech => skill.toLowerCase().includes(tech))
  );

  if (hasTechSkills) {
    insights.primaryStrengths.push('Technical expertise provides strong foundation for digital opportunities');
  }

  const businessSkills = ['project management', 'sales', 'marketing', 'business development', 'consulting'];
  const hasBusinessSkills = data.skills.some(skill => 
    businessSkills.some(biz => skill.toLowerCase().includes(biz))
  );

  if (hasBusinessSkills) {
    insights.primaryStrengths.push('Business acumen supports entrepreneurial ventures');
  }

  // Analyze market opportunities from problems/trends
  const problemKeywords = ['automation', 'efficiency', 'cost', 'time', 'remote', 'digital', 'sustainability'];
  const hasMarketOpportunity = problemKeywords.some(keyword => 
    data.problems.toLowerCase().includes(keyword) || data.trends.toLowerCase().includes(keyword)
  );

  if (hasMarketOpportunity) {
    insights.marketOpportunities.push('Identified problems align with current market trends');
  }

  // Analyze constraint factors
  const timeCommitment = data.time;
  const budget = data.budget;

  if (timeCommitment === '5-10') {
    insights.constraintFactors.push('Limited time requires efficient, scalable solutions');
  } else if (timeCommitment === '30+') {
    insights.constraintFactors.push('High time availability enables hands-on, service-intensive approaches');
  }

  if (budget === '0-1k') {
    insights.constraintFactors.push('Low budget favors service-based, knowledge-work opportunities');
  } else if (budget === '10k+') {
    insights.constraintFactors.push('Higher budget enables product development and marketing investment');
  }

  // Generate recommended direction
  if (hasTechSkills && hasBusinessSkills) {
    insights.recommendedDirection = 'Tech-enabled business consulting or digital product development';
  } else if (hasTechSkills) {
    insights.recommendedDirection = 'Technical services or software solutions';
  } else if (hasBusinessSkills) {
    insights.recommendedDirection = 'Business consulting or service-based offerings';
  } else {
    insights.recommendedDirection = 'Leverage unique skill combination for specialized services';
  }

  return insights;
}

// Type exports
export type NicheResearchInput = z.infer<typeof nicheResearchSchema>;