// validators/adWriter.validator.ts - UPDATED VERSION
import { z } from 'zod';

const adWriterSchema = z.object({
  // Business Information
  businessName: z.string().min(1, "Business name is required").max(100),
  personalTitle: z.string().optional(),
  valueProposition: z.string().min(10, "Value proposition must be at least 10 characters").max(500),
  
  // Offer Details  
  offerName: z.string().min(1, "Offer name is required").max(100),
  offerDescription: z.string().min(10, "Offer description must be at least 10 characters").max(500),
  features: z.array(z.string()).max(3).optional().default([]),
  pricing: z.string().min(1, "Pricing is required").max(50),
  uniqueMechanism: z.string().min(5, "Unique mechanism must be at least 5 characters").max(200),
  
  // Target Audience
  idealCustomer: z.string().min(10, "Ideal customer description must be at least 10 characters").max(500),
  primaryPainPoint: z.string().min(5, "Primary pain point must be at least 5 characters").max(300),
  failedSolutions: z.string().optional().default(""),
  coreResult: z.string().min(5, "Core result must be at least 5 characters").max(200),
  secondaryBenefits: z.array(z.string()).max(3).optional().default([]),
  timeline: z.string().optional().default(""),


  //ad length
  adLength: z.enum(['short', 'medium', 'long']).optional().default('medium'),


  
  //   UPDATED: Platforms are now optional
  activePlatforms: z.array(z.string()).optional().default([]),
  adType: z.enum(['awareness', 'conversion', 'lead', 'traffic']),
  tone: z.enum(['professional', 'friendly', 'urgent', 'humorous', 'inspirational']),
  
  // Social Proof
  caseStudy1: z.string().optional().default(""),
  credentials: z.string().optional().default(""),
  
  // Call-to-Action
  cta: z.string().min(1, "Call-to-action is required").max(50),
  url: z.string().url("Please enter a valid URL"),
  urgency: z.string().optional().default(""),
  leadMagnet: z.string().optional().default("")
});

// Infer the type from the schema
export type AdWriterInput = z.infer<typeof adWriterSchema>;

export function validateAdWriterInput(data: unknown) {
  try {
    // Add debug logging
    console.log('Validating input:', JSON.stringify(data, null, 2));
    
    const validated = adWriterSchema.parse(data);
    console.log('Validation successful:', JSON.stringify(validated, null, 2));
    
    return { success: true as const, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.issues);
      
      return {
        success: false as const,
        errors: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
          received: issue.code === 'invalid_type' ? (issue as any).received : undefined
        }))
      };
    }
    
    console.error('Unknown validation error:', error);
    return {
      success: false as const,
      errors: [{
        path: '',
        message: 'Validation failed',
        code: 'unknown'
      }]
    };
  }
}

// Helper function to validate specific step data
export function validateStep(step: number, data: Partial<AdWriterInput>) {
  switch (step) {
    case 0: // Business & Offer
      return adWriterSchema.pick({
        businessName: true,
        valueProposition: true,
        offerName: true,
        offerDescription: true,
        pricing: true,
        uniqueMechanism: true
      }).safeParse(data);
      
    case 1: // Target Audience
      return adWriterSchema.pick({
        idealCustomer: true,
        primaryPainPoint: true,
        coreResult: true
      }).safeParse(data);
      
    case 2: // Ad Strategy
      return adWriterSchema.pick({
        adType: true,
        tone: true,
        cta: true,
        url: true
      }).safeParse(data);
      
    default:
      return { success: false, error: 'Invalid step' };
  }
}