// utils/offerCreator.utils.ts
import { 
  OfferTemplate, 
  IndustryBenchmark, 
  PerformanceInsight,
  PerformanceEntry 
} from '@/types/offerCreator';

// Industry benchmarks for performance comparison
export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  'B2B SaaS': {
    clickThroughRate: { min: 2.5, avg: 4.2, max: 8.0 },
    conversionRate: { min: 2.0, avg: 3.5, max: 7.0 },
    description: 'B2B SaaS typically sees lower CTR but higher conversion rates due to qualified traffic'
  },
  'E-commerce': {
    clickThroughRate: { min: 1.8, avg: 3.2, max: 6.5 },
    conversionRate: { min: 1.5, avg: 2.8, max: 5.5 },
    description: 'E-commerce varies widely by product category and price point'
  },
  'Healthcare': {
    clickThroughRate: { min: 2.0, avg: 3.8, max: 7.2 },
    conversionRate: { min: 3.0, avg: 5.2, max: 9.0 },
    description: 'Healthcare offers often have higher conversion due to urgency and necessity'
  },
  'Finance': {
    clickThroughRate: { min: 2.2, avg: 4.0, max: 7.5 },
    conversionRate: { min: 2.5, avg: 4.1, max: 8.0 },
    description: 'Finance requires high trust, leading to higher conversion rates when achieved'
  },
  'Education': {
    clickThroughRate: { min: 3.0, avg: 5.5, max: 9.0 },
    conversionRate: { min: 4.0, avg: 7.2, max: 12.0 },
    description: 'Education offers often perform well with proper targeting and value demonstration'
  },
  'Marketing Agencies': {
    clickThroughRate: { min: 2.8, avg: 4.5, max: 8.5 },
    conversionRate: { min: 3.5, avg: 6.0, max: 10.0 },
    description: 'Marketing agencies benefit from showcasing results and ROI'
  },
  'Real Estate': {
    clickThroughRate: { min: 2.0, avg: 3.5, max: 6.0 },
    conversionRate: { min: 2.0, avg: 4.0, max: 8.0 },
    description: 'Real estate is highly location-dependent with seasonal variations'
  },
  'Manufacturing': {
    clickThroughRate: { min: 1.5, avg: 2.8, max: 5.0 },
    conversionRate: { min: 2.5, avg: 4.5, max: 7.5 },
    description: 'Manufacturing has longer sales cycles but higher conversion rates'
  }
};

// Default offer templates
export const OFFER_TEMPLATES: OfferTemplate[] = [
  {
    id: 'saas-discount',
    name: 'SaaS Annual Discount',
    offerType: 'discount',
    industry: 'B2B SaaS',
    headline: 'Save 40% on Annual Plans',
    description: 'Limited-time discount for annual subscribers',
    conversionRate: '8-12%',
    bestFor: 'New customer acquisition',
    example: {
      headline: 'Get 40% OFF Your First Year',
      subheadline: 'Join 10,000+ businesses scaling with our platform',
      discount: 40,
      urgency: '72-hour flash sale'
    }
  },
  {
    id: 'ecommerce-bonus',
    name: 'E-commerce Bundle Bonus',
    offerType: 'bonus',
    industry: 'E-commerce',
    headline: 'Free Bonus Bundle Worth $300',
    description: 'Add value with complementary products',
    conversionRate: '12-18%',
    bestFor: 'Increasing order value',
    example: {
      headline: 'Get Premium Bundle FREE',
      subheadline: 'With every purchase over $199',
      bonusValue: '$300',
      urgency: 'Limited inventory bonus'
    }
  },
  {
    id: 'consulting-guarantee',
    name: 'Consulting Risk Reversal',
    offerType: 'guarantee',
    industry: 'Professional Services',
    headline: '90-Day Results Guarantee',
    description: 'Remove risk with strong guarantee',
    conversionRate: '15-25%',
    bestFor: 'High-ticket services',
    example: {
      headline: 'Results or Full Refund',
      subheadline: 'See measurable improvement in 90 days',
      guarantee: '90-day money-back guarantee',
      urgency: 'Limited client spots available'
    }
  },
  {
    id: 'fitness-trial',
    name: 'Fitness Free Trial',
    offerType: 'trial',
    industry: 'Health & Fitness',
    headline: '30-Day Free Trial',
    description: 'Low-risk trial to build trust',
    conversionRate: '25-35%',
    bestFor: 'Subscription services',
    example: {
      headline: 'Try Free for 30 Days',
      subheadline: 'No commitment, cancel anytime',
      trialPeriod: 30,
      urgency: 'Start your transformation today'
    }
  },
  {
    id: 'agency-performance',
    name: 'Marketing Agency Performance',
    offerType: 'guarantee',
    industry: 'Marketing Agencies',
    headline: 'Double Your Leads or We Work Free',
    description: 'Performance-based guarantee offer',
    conversionRate: '18-28%',
    bestFor: 'Skeptical prospects',
    example: {
      headline: 'We Guarantee 2X More Leads',
      subheadline: 'Or you pay nothing for the next month',
      guarantee: 'Performance guarantee',
      urgency: 'Only 5 spots per month'
    }
  },
  {
    id: 'education-early-bird',
    name: 'Course Early Bird Special',
    offerType: 'discount',
    industry: 'Education',
    headline: 'Early Bird 50% Discount',
    description: 'Reward early commitment',
    conversionRate: '10-16%',
    bestFor: 'Course launches',
    example: {
      headline: 'Be First, Pay Less',
      subheadline: '50% off for the first 100 students',
      discount: 50,
      urgency: 'Only 23 spots remaining'
    }
  },
  {
    id: 'healthcare-urgency',
    name: 'Healthcare Emergency Discount',
    offerType: 'discount',
    industry: 'Healthcare',
    headline: 'Emergency Care 25% Off',
    description: 'Time-sensitive healthcare offers',
    conversionRate: '20-30%',
    bestFor: 'Urgent care services',
    example: {
      headline: 'Get Care Now, Save 25%',
      subheadline: 'Same-day appointments available',
      discount: 25,
      urgency: 'Limited availability today'
    }
  },
  {
    id: 'finance-security',
    name: 'Financial Security Guarantee',
    offerType: 'guarantee',
    industry: 'Finance',
    headline: '100% Security Guarantee',
    description: 'Trust-building for financial services',
    conversionRate: '12-20%',
    bestFor: 'New financial products',
    example: {
      headline: 'Your Money is 100% Secure',
      subheadline: 'Bank-level security with personal service',
      guarantee: 'Money-back security guarantee',
      urgency: 'Limited enrollment period'
    }
  }
];

// Performance insight generators
export function generatePerformanceInsights(history: PerformanceEntry[], currentMetrics: any): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];

  if (history.length < 2) {
    insights.push({
      type: 'info',
      message: 'Need more data points to generate trend insights',
      suggestion: 'Continue tracking performance to see trends and patterns'
    });
    return insights;
  }

  const previousMetrics = history[history.length - 2].metrics;
  
  // Conversion rate analysis
  const conversionChange = currentMetrics.conversionRate - previousMetrics.conversionRate;
  if (conversionChange > 1) {
    insights.push({
      type: 'positive',
      message: `Conversion rate improved by ${conversionChange.toFixed(1)}%`,
      suggestion: 'Great progress! Analyze what changes led to this improvement and replicate them'
    });
  } else if (conversionChange < -1) {
    insights.push({
      type: 'warning',
      message: `Conversion rate dropped by ${Math.abs(conversionChange).toFixed(1)}%`,
      suggestion: 'Consider A/B testing headline, CTA, or urgency message changes'
    });
  }

  // Click-through rate analysis
  const ctrChange = currentMetrics.clickThroughRate - previousMetrics.clickThroughRate;
  if (ctrChange > 0.5) {
    insights.push({
      type: 'positive',
      message: 'Click-through rate is trending upward',
      suggestion: 'Your offer is becoming more appealing to viewers - consider scaling'
    });
  } else if (ctrChange < -0.5) {
    insights.push({
      type: 'warning',
      message: 'Click-through rate is declining',
      suggestion: 'Consider refreshing your offer presentation, targeting, or creative elements'
    });
  }

  // Revenue analysis
  if (previousMetrics.revenue > 0) {
    const revenueChange = ((currentMetrics.revenue - previousMetrics.revenue) / previousMetrics.revenue) * 100;
    if (revenueChange > 20) {
      insights.push({
        type: 'positive',
        message: `Revenue increased by ${revenueChange.toFixed(1)}%`,
        suggestion: 'Excellent growth! Consider scaling successful elements or increasing ad spend'
      });
    } else if (revenueChange < -20) {
      insights.push({
        type: 'warning',
        message: `Revenue decreased by ${Math.abs(revenueChange).toFixed(1)}%`,
        suggestion: 'Review recent changes and consider reverting or testing new approaches'
      });
    }
  }

  // Benchmarking insights
  if (currentMetrics.conversionRate < 2) {
    insights.push({
      type: 'suggestion',
      message: 'Conversion rate is below industry average (2-5%)',
      suggestion: 'Try adding urgency, social proof, or risk reversal elements to boost conversions'
    });
  } else if (currentMetrics.conversionRate > 8) {
    insights.push({
      type: 'positive',
      message: 'Conversion rate is excellent - above industry average',
      suggestion: 'Consider documenting what works and applying these principles to other offers'
    });
  }

  if (currentMetrics.clickThroughRate < 3) {
    insights.push({
      type: 'suggestion',
      message: 'Click-through rate could be improved',
      suggestion: 'Test different headlines, visuals, or targeting to increase initial interest'
    });
  }

  // Average Order Value insights
  if (currentMetrics.averageOrderValue > 0) {
    if (history.length >= 2) {
      const previousAOV = previousMetrics.averageOrderValue || 0;
      const aovChange = currentMetrics.averageOrderValue - previousAOV;
      
      if (aovChange > previousAOV * 0.1) {
        insights.push({
          type: 'positive',
          message: 'Average order value is increasing',
          suggestion: 'Consider promoting higher-value packages or upsells more prominently'
        });
      } else if (aovChange < -previousAOV * 0.1) {
        insights.push({
          type: 'warning',
          message: 'Average order value is decreasing',
          suggestion: 'Review pricing strategy or add value-based upsells to increase order size'
        });
      }
    }
  }

  return insights.slice(0, 5); // Return top 5 insights
}

// Utility functions for offer optimization
export function calculateOfferMetrics(regularPrice: string, offerPrice: string) {
  const regular = parseFloat(regularPrice.replace(/[$,]/g, ''));
  const offer = parseFloat(offerPrice.replace(/[$,]/g, ''));
  
  const savings = regular - offer;
  const discountPercentage = (savings / regular) * 100;
  
  return {
    regularPrice: regular,
    offerPrice: offer,
    savings,
    discountPercentage,
    pricePoint: regular > 1000 ? 'high-ticket' : regular > 100 ? 'mid-ticket' : 'low-ticket'
  };
}

export function getIndustryBenchmark(industry: string): IndustryBenchmark {
  return INDUSTRY_BENCHMARKS[industry] || {
    clickThroughRate: { min: 2.0, avg: 4.0, max: 7.0 },
    conversionRate: { min: 2.0, avg: 4.0, max: 8.0 },
    description: 'General industry benchmarks'
  };
}

export function filterTemplatesByIndustry(industry?: string): OfferTemplate[] {
  if (!industry) return OFFER_TEMPLATES;
  
  return OFFER_TEMPLATES.filter(template => 
    template.industry.toLowerCase().includes(industry.toLowerCase())
  );
}

export function filterTemplatesByType(offerType?: string): OfferTemplate[] {
  if (!offerType) return OFFER_TEMPLATES;
  
  return OFFER_TEMPLATES.filter(template => template.offerType === offerType);
}

// Conversion optimization helpers
export function generateCopywritingVariations(originalText: string, type: 'headline' | 'cta' | 'urgency'): string[] {
  const variations: Record<string, string[]> = {
    headline: [
      `🚀 ${originalText}`,
      `Limited Time: ${originalText}`,
      `Exclusive: ${originalText}`,
      `Flash Sale: ${originalText}`,
      `Last Chance: ${originalText}`
    ],
    cta: [
      `${originalText} Now`,
      `${originalText} Today`,
      `Claim ${originalText}`,
      `Get ${originalText}`,
      `Start ${originalText}`
    ],
    urgency: [
      `⏰ ${originalText}`,
      `Only 24 hours left: ${originalText}`,
      `Limited spots: ${originalText}`,
      `Ends soon: ${originalText}`,
      `Act fast: ${originalText}`
    ]
  };

  return variations[type] || [originalText];
}

// Email subject line generators
export function generateEmailSubjectLines(offerName: string, offerType: string, savings?: string): string[] {
  const baseLines = [
    `🚨 ${savings} ${offerName} - Ending Soon`,
    `Last chance: ${offerName}`,
    `${offerName} special pricing expires today`,
    `Don't miss this: ${savings} limited time offer`,
    `Final hours: ${offerName}`
  ];

  const typeSpecific: Record<string, string[]> = {
    discount: [
      `💰 Save big on ${offerName}`,
      `${savings} ends at midnight`,
      `Flash sale: ${offerName}`
    ],
    bonus: [
      `🎁 Free bonus with ${offerName}`,
      `Double value: ${offerName} + bonus`,
      `Limited bonus offer: ${offerName}`
    ],
    trial: [
      `🆓 Try ${offerName} free`,
      `No risk trial: ${offerName}`,
      `Start your free ${offerName} trial`
    ],
    guarantee: [
      `🛡️ Risk-free ${offerName}`,
      `100% guaranteed: ${offerName}`,
      `No risk: ${offerName} guarantee`
    ]
  };

  return [...baseLines, ...(typeSpecific[offerType] || [])].slice(0, 5);
}

// Social media caption generators
export function generateSocialMediaCaptions(offerName: string, offerValue: string, price: string, deadline: string): string[] {
  return [
    `🔥 FLASH SALE: ${offerName}! Get ${offerValue} for just ${price}. Ends ${deadline}! Link in bio 👆`,
    `⏰ Limited time: ${offerName} at special price ${price}. Perfect for growing your business!`,
    `💡 Want to ${offerValue.toLowerCase()}? Our ${offerName} is on sale until ${deadline}. Don't wait - claim yours now!`,
    `🚀 Transform your business with ${offerName}. Special pricing ${price} ends ${deadline}. Tag someone who needs this!`,
    `💪 Ready to level up? ${offerName} helps you ${offerValue.toLowerCase()}. Limited time: ${price}. DM for details!`
  ].slice(0, 3);
}

// A/B testing helpers
export function generateABTestVariations(originalOffer: any) {
  return {
    headlines: [
      originalOffer.headline,
      `Limited Time: ${originalOffer.headline}`,
      `Exclusive Offer: ${originalOffer.headline}`,
      `🚀 ${originalOffer.headline}`
    ],
    ctas: [
      originalOffer.cta,
      `${originalOffer.cta} Now`,
      `Claim ${originalOffer.cta}`,
      `Get Started Today`
    ],
    urgencyMessages: [
      originalOffer.urgency,
      `⏰ Only 24 hours left`,
      `Limited spots available`,
      `Offer expires at midnight`
    ]
  };
}

// Performance scoring
export function calculateConversionScore(factors: any[]): number {
  const baseScore = 50;
  let adjustments = 0;

  factors.forEach(factor => {
    switch (factor.impact) {
      case 'positive':
        adjustments += factor.weight * 20;
        break;
      case 'negative':
        adjustments -= factor.weight * 15;
        break;
      case 'neutral':
        adjustments += factor.weight * 5;
        break;
    }
  });

  return Math.min(95, Math.max(20, baseScore + adjustments));
}

// Date and time utilities
export function formatOfferDeadline(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Ends today';
  if (diffDays === 1) return 'Ends tomorrow';
  if (diffDays <= 7) return `Ends in ${diffDays} days`;
  
  return date.toLocaleDateString();
}

export function isOfferExpired(dateString: string): boolean {
  return new Date(dateString) <= new Date();
}

export function getDaysUntilExpiry(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Industry-specific recommendations
export function getIndustrySpecificTips(industry: string): string[] {
  const tips: Record<string, string[]> = {
    'B2B SaaS': [
      'Highlight ROI and time savings in your messaging',
      'Offer free trials or freemium tiers to reduce friction',
      'Include integration capabilities and support quality',
      'Use case studies from similar company sizes',
      'Emphasize security and compliance features'
    ],
    'E-commerce': [
      'Include shipping costs and return policies clearly',
      'Use product bundling to increase order value',
      'Add customer reviews and ratings prominently',
      'Create urgency with limited inventory messages',
      'Offer multiple payment options including installments'
    ],
    'Healthcare': [
      'Emphasize safety, efficacy, and regulatory compliance',
      'Include professional credentials and certifications',
      'Use patient testimonials and success stories',
      'Address common health concerns and fears',
      'Provide clear information about insurance coverage'
    ],
    'Finance': [
      'Focus heavily on security and trust signals',
      'Include regulatory compliance information',
      'Use conservative, professional messaging',
      'Provide clear fee structures and terms',
      'Include financial advisor recommendations'
    ],
    'Education': [
      'Show learning outcomes and success metrics',
      'Include instructor credentials and experience',
      'Offer completion certificates or accreditation',
      'Use student success stories and career outcomes',
      'Provide clear curriculum and time commitments'
    ],
    'Marketing Agencies': [
      'Include detailed case studies with metrics',
      'Show ROI and performance improvements',
      'Highlight industry-specific experience',
      'Offer performance guarantees when possible',
      'Include client testimonials with company names'
    ],
    'Real Estate': [
      'Emphasize local market knowledge and expertise',
      'Include recent sales data and market trends',
      'Show professional photos and virtual tours',
      'Highlight unique property features and location benefits',
      'Provide clear commission and fee structures'
    ],
    'Manufacturing': [
      'Focus on quality certifications and standards',
      'Highlight cost savings and efficiency improvements',
      'Include technical specifications and capabilities',
      'Show production capacity and delivery timelines',
      'Emphasize long-term partnership benefits'
    ]
  };

  return tips[industry] || [
    'Focus on clear value propositions',
    'Include social proof and testimonials',
    'Create urgency without being pushy',
    'Address common objections upfront',
    'Make the next step clear and easy'
  ];
}

// Copywriting framework helpers
export function applyAIDAFramework(offer: any): string {
  return `
**ATTENTION:** ${offer.headline}

**INTEREST:** ${offer.subheadline}
${offer.offerValue}

**DESIRE:** ${offer.bulletPoints?.join('\n') || ''}

**ACTION:** ${offer.cta}
${offer.urgency}
  `.trim();
}

export function applyPASFramework(problem: string, agitation: string, solution: string): string {
  return `
**PROBLEM:** ${problem}

**AGITATION:** ${agitation}

**SOLUTION:** ${solution}
  `.trim();
}

// Export validation helpers
export function validateOfferData(offer: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!offer.primaryOffer?.headline) errors.push('Headline is required');
  if (!offer.primaryOffer?.cta) errors.push('Call-to-action is required');
  if (!offer.primaryOffer?.mainCopy) errors.push('Main copy is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Constants
export const OFFER_TYPES = ['discount', 'bonus', 'trial', 'guarantee'] as const;
export const INDUSTRIES = [
  'B2B SaaS',
  'E-commerce', 
  'Healthcare',
  'Finance',
  'Education',
  'Marketing Agencies',
  'Real Estate',
  'Manufacturing',
  'Professional Services',
  'Technology',
  'Retail',
  'Consulting'
] as const;

export const BUSINESS_GOALS = [
  'lead-generation',
  'sales',
  'retention', 
  'upsell',
  'brand-awareness'
] as const;

export const CUSTOMER_SEGMENTS = [
  'new',
  'existing',
  'churned',
  'high-value'
] as const;

// Rate limiting constants
export const RATE_LIMITS = {
  OFFER_GENERATION: { limit: 10, window: 3600 }, // 10 per hour
  OPTIMIZATION: { limit: 20, window: 3600 }, // 20 per hour
  ANALYSIS: { limit: 15, window: 3600 } // 15 per hour
} as const;