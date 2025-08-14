// types/coldEmail.ts
export interface ColdEmailGenerationInput {
  // Your Information (from frontend form)
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  companyName: string;
  workEmail: string;
  companyWebsite?: string;
  
  // Email Strategy
  method: 'interview' | 'podcast' | 'direct' | 'masterclass' | 'referral' | 'problem';
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  emailLength: 'short' | 'medium' | 'long';
  quality: 'fast' | 'balanced' | 'high';
  creativity: 'low' | 'moderate' | 'high';
  
  // Target Details
  targetIndustry: string;
  targetRole: string;
  targetFirstName?: string;
  targetCompany?: string;
  targetCompanySize?: string;
  targetPainPoints?: string[];
  targetGoals?: string[];
  valueProposition: string;
  uniqueDifferentiator?: string;
  socialProof?: string;
  
  // Advanced Options
  phone?: string;
  linkedIn?: string;
  companyAddress?: string;
  callToAction?: string;
  meetingType?: string;
  urgencyFactor?: string;
  subjectLineStyle?: string;
  personalizedElement?: string;
  
  // Referral Information (optional)
  referrerFirstName?: string;
  referrerLastName?: string;
  referrerJobTitle?: string;
  referrerEmail?: string;
  referrerRelationship?: string;
  
  // Generation Settings
  variations: number;
  generateFollowUps: boolean;
  followUpCount: number;
  saveAsTemplate: boolean;
  
  // System field
  userId: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  signature: string;
  method: string;
  followUpSequence?: GeneratedEmail[];
  metadata?: {
    targetIndustry: string;
    targetRole: string;
    generatedAt: string;
    variationIndex?: number;
    dayInterval?: number;
    sequenceNumber?: number;
  };
}

export interface ColdEmailResponse {
  emails: GeneratedEmail[];
  tokensUsed: number;
  generationTime: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  method: string;
  category: 'outreach' | 'follow_up' | 'introduction' | 'meeting' | 'demo';
  description?: string;
  variables?: string[];
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    targetIndustry?: string;
    targetRole?: string;
  };
}

// Optimization types
export type ColdEmailOptimizationType = 
  | 'personalization' 
  | 'value' 
  | 'urgency' 
  | 'social-proof' 
  | 'clarity' 
  | 'cta';

export type AdOptimizationType = 
  | 'emotional' 
  | 'urgency' 
  | 'benefits' 
  | 'social-proof' 
  | 'simplify';