// types/adWriter.ts - FIXED VERSION
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
  platforms: Platform[]; // ✅ Changed from string[] to Platform[]
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

// ✅ FIXED: Add 'generic' to Platform type to support platform-agnostic generation
export type Platform = 'facebook' | 'google' | 'linkedin' | 'tiktok' | 'generic';

// ✅ FIXED: Add missing properties to GeneratedAd interface
export interface GeneratedAd {
  platform: Platform;
  headlines: string[];
  descriptions: string[];
  ctas: string[];
  hooks?: string[]; // Made optional since some platforms might not have hooks
  visualSuggestions?: string[]; // Made optional
  // ✅ NEW: Add the missing script section properties
  fixes?: string[];
  results?: string[];
  proofs?: string[];
}

export type AdOptimizationType = 
  | 'emotional' 
  | 'urgency' 
  | 'benefits' 
  | 'social-proof' 
  | 'simplify';

// ✅ NEW: Helper function to validate platforms
export function isValidPlatform(platform: string): platform is Platform {
  return ['facebook', 'google', 'linkedin', 'tiktok', 'generic'].includes(platform);
}

// ✅ NEW: Helper function to convert string array to Platform array
export function convertToPlatforms(platforms: string[]): Platform[] {
  return platforms.filter(isValidPlatform);
}