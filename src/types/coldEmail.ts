// types/coldEmail.ts
export interface ColdEmailGenerationInput {
  // Business Information
  businessName: string;
  industry: string;
  valueProposition: string;
  
  // Target Information
  prospectName: string;
  prospectCompany: string;
  prospectTitle: string;
  prospectIndustry?: string;
  prospectPainPoint: string;
  
  // Email Strategy
  method: 'cold' | 'warm' | 'follow_up' | 'introduction';
  tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'conversational';
  purpose: 'meeting' | 'demo' | 'sale' | 'partnership' | 'introduction';
  
  // Offer/CTA
  offer: string;
  cta: string;
  
  // Social Proof (optional)
  socialProof?: string;
  caseStudy?: string;
  mutualConnection?: string;
  
  // Email Settings
  subject?: string;
  numberOfVariations: number;
  
  // Follow-up settings
  includeFollowUp: boolean;
  followUpDays?: number;
  
  // System field
  userId: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  variation: number;
  tone: string;
  purpose: string;
}

export interface ColdEmailResponse {
  emails: GeneratedEmail[];
  tokensUsed: number;
  generationTime: number;
}

// Optimization types
export type ColdEmailOptimizationType = 'personalization' | 'value' | 'urgency' | 'social-proof' | 'clarity' | 'cta';
export type AdOptimizationType = 'emotional' | 'urgency' | 'benefits' | 'social-proof' | 'simplify';
