// validators/coldEmail.validator.ts
import { z } from 'zod';

const coldEmailSchema = z.object({
  // Business Information
  businessName: z.string().min(1).max(100),
  industry: z.string().min(1).max(50),
  valueProposition: z.string().min(10).max(500),
  
  // Target Information
  prospectName: z.string().min(1).max(100),
  prospectCompany: z.string().min(1).max(100),
  prospectTitle: z.string().min(1).max(100),
  prospectIndustry: z.string().optional(),
  prospectPainPoint: z.string().min(5).max(300),
  
  // Email Strategy
  method: z.enum(['cold', 'warm', 'follow_up', 'introduction']),
  tone: z.enum(['professional', 'friendly', 'casual', 'formal', 'conversational']),
  purpose: z.enum(['meeting', 'demo', 'sale', 'partnership', 'introduction']),
  
  // Offer/CTA
  offer: z.string().min(5).max(200),
  cta: z.string().min(1).max(100),
  
  // Social Proof (optional)
  socialProof: z.string().optional(),
  caseStudy: z.string().optional(),
  mutualConnection: z.string().optional(),
  
  // Email Settings
  subject: z.string().optional(),
  numberOfVariations: z.number().min(1).max(5).default(3),
  
  // Follow-up settings
  includeFollowUp: z.boolean().default(false),
  followUpDays: z.number().min(1).max(30).optional(),
});

// Types for TypeScript
export type ColdEmailInput = z.infer<typeof coldEmailSchema>;

export function validateColdEmailInput(data: unknown): 
  | { success: true; data: ColdEmailInput }
  | { success: false; errors: Array<{ path: string; message: string; code: string }> } {
  try {
    const validated = coldEmailSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Use 'issues' instead of 'errors'
      return { 
        success: false, 
        errors: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      };
    }
    return { 
      success: false, 
      errors: [{ 
        path: '',
        message: 'Validation failed',
        code: 'unknown' 
      }] 
    };
  }
}