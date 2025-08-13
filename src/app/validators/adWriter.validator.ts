// validators/adWriter.validator.ts
import { z } from 'zod';

const adWriterSchema = z.object({
  businessName: z.string().min(1).max(100),
  personalTitle: z.string().optional(),
  valueProposition: z.string().min(10).max(500),
  
  offerName: z.string().min(1).max(100),
  offerDescription: z.string().min(10).max(500),
  features: z.array(z.string()).max(3).optional(),
  pricing: z.string().min(1).max(50),
  uniqueMechanism: z.string().min(5).max(200),
  
  idealCustomer: z.string().min(10).max(500),
  primaryPainPoint: z.string().min(5).max(300),
  failedSolutions: z.string().optional(),
  coreResult: z.string().min(5).max(200),
  secondaryBenefits: z.array(z.string()).max(3).optional(),
  timeline: z.string().optional(),
  
  activePlatforms: z.array(z.enum(['facebook', 'google', 'linkedin', 'tiktok'])),
  adType: z.enum(['awareness', 'conversion', 'lead', 'traffic']),
  tone: z.enum(['professional', 'friendly', 'urgent', 'humorous', 'inspirational']),
  
  caseStudy1: z.string().optional(),
  credentials: z.string().optional(),
  
  cta: z.string().min(1).max(50),
  url: z.string().url(),
  urgency: z.string().optional(),
  leadMagnet: z.string().optional()
});

// Infer the type from the schema
export type AdWriterInput = z.infer<typeof adWriterSchema>;

export function validateAdWriterInput(data: unknown) {
  try {
    const validated = adWriterSchema.parse(data);
    return { success: true as const, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Access the issues property which contains the validation errors
      return { 
        success: false as const, 
        errors: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      };
    }
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