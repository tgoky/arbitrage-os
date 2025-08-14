// types/adWriter.ts
export interface AdGenerationInput {
  businessName: string;
  personalTitle?: string;
  valueProposition: string;
  offerName: string;
  offerDescription: string;
  features?: string[];
  pricing: string;
  uniqueMechanism: string;
  idealCustomer: string;
  primaryPainPoint: string;
  failedSolutions?: string;
  coreResult: string;
  secondaryBenefits?: string[];
  timeline?: string;
  platforms: Platform[];
  adType: 'awareness' | 'conversion' | 'lead' | 'traffic';
  tone: 'professional' | 'friendly' | 'urgent' | 'humorous' | 'inspirational';
  caseStudy1?: string;
  credentials?: string;
  cta: string;
  url: string;
  urgency?: string;
  leadMagnet?: string;
  userId?: string;
}

export type Platform = 'facebook' | 'google' | 'linkedin' | 'tiktok';

export interface GeneratedAd {
  platform: Platform;
  headlines: string[];
  descriptions: string[];
  ctas: string[];
  hooks: string[];
  visualSuggestions: string[];
}

export type AdOptimizationType = 
  | 'emotional' 
  | 'urgency' 
  | 'benefits' 
  | 'social-proof' 
  | 'simplify';