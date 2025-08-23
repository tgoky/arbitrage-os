// types/adWriter.ts - UPDATED with Full Scripts
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
  [key: string]: any;
}

export type Platform = 'facebook' | 'google' | 'linkedin' | 'tiktok' | 'generic';

// ✅ NEW: Full Script interface
export interface FullScript {
  framework: string;
  script: string;
}

// ✅ UPDATED: Add fullScripts to GeneratedAd interface
export interface GeneratedAd {
  platform: Platform;
  headlines: string[];
  descriptions: string[];
  ctas: string[];
  hooks?: string[];
  visualSuggestions?: string[];
  fixes?: string[];
  results?: string[];
  proofs?: string[];
  // ✅ NEW: Add full scripts array
  fullScripts?: FullScript[];
}

export type AdOptimizationType =
  | 'emotional'
  | 'urgency'
  | 'benefits'
  | 'social-proof'
  | 'simplify';

export function isValidPlatform(platform: string): platform is Platform {
  return ['facebook', 'google', 'linkedin', 'tiktok', 'generic'].includes(platform);
}

export function convertToPlatforms(platforms: string[]): Platform[] {
  return platforms.filter(isValidPlatform);
}