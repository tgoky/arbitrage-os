// types/adWriter.ts - UPDATED with Ad Length Control

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
  // ✅ NEW: Add ad length control
  adLength: 'short' | 'medium' | 'long';
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

export interface FullScript {
  framework: string;
  script: string;
}

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
  fullScripts?: FullScript[];
}

export type AdOptimizationType =
  | 'emotional'
  | 'urgency'
  | 'benefits'
  | 'social-proof'
  | 'simplify';

// ✅ NEW: Ad length configurations
export const AD_LENGTH_CONFIGS = {
  short: {
    label: 'Short Ads',
    description: 'Concise, impactful copy (1–2 lines)',
    headlineLength: '5-8 words',
    descriptionLength: '1-2 sentences',
    maxChars: { headline: 50, description: 150 },
    bestFor: 'TikTok, Instagram Stories, quick attention grabbers'
  },
  medium: {
    label: 'Medium Ads', 
    description: 'Well-rounded copy highlighting key benefits (2–3 sentences)',
    headlineLength: '8-12 words',
    descriptionLength: '2-3 sentences',
    maxChars: { headline: 80, description: 300 },
    bestFor: 'Facebook, LinkedIn, Google Search'
  },
  long: {
    label: 'Long Ads',
    description: 'Detailed copy with full story (3+ sentences)',
    headlineLength: '10-15 words',
    descriptionLength: '3-5 sentences',
    maxChars: { headline: 120, description: 500 },
    bestFor: 'Blog promotions, detailed explanations, email campaigns'
  }
} as const;

export function isValidPlatform(platform: string): platform is Platform {
  return ['facebook', 'google', 'linkedin', 'tiktok', 'generic'].includes(platform);
}

export function convertToPlatforms(platforms: string[]): Platform[] {
  return platforms.filter(isValidPlatform);
}