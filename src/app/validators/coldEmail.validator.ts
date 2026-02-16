// validators/coldEmail.validator.ts
import { z } from 'zod';

const coldEmailInputSchema = z.object({
  // Your Information
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  jobTitle: z.string().min(1, 'Job title is required').max(100),
  companyName: z.string().min(1, 'Company name is required').max(100),
  workEmail: z.string().email('Invalid work email format'),
  companyWebsite: z.string().url('Invalid website URL').optional(),
  
  // Email Strategy
  method: z.enum(['interview', 'podcast', 'direct', 'masterclass', 'referral', 'problem']),
  tone: z.enum(['professional', 'friendly', 'casual', 'formal']),
 emailLength: z.enum(['short', 'medium', 'long']).default('medium'), //   Add default
quality: z.enum(['fast', 'balanced', 'high']).default('balanced'),   //   Add default
creativity: z.enum(['low', 'moderate', 'high']).default('moderate'), //   Add default
  
  // Target Details
  targetIndustry: z.string().min(1, 'Target industry is required').max(100),
  targetRole: z.string().min(1, 'Target role is required').max(100),
  targetFirstName: z.string().max(50).optional(),
  targetCompany: z.string().max(100).optional(),
  targetCompanySize: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
  targetPainPoints: z.array(z.string()).optional(),
  targetGoals: z.array(z.string()).optional(),
  valueProposition: z.string().min(10, 'Value proposition is required').max(500),
  uniqueDifferentiator: z.string().max(300).optional(),
  socialProof: z.string().max(300).optional(),
  
  // Advanced Options
  phone: z.string().max(20).optional(),
  linkedIn: z.string().url('Invalid LinkedIn URL').optional(),
  companyAddress: z.string().max(200).optional(),
  callToAction: z.enum(['call', 'demo', 'coffee', 'lunch', 'reply']).optional(),
  meetingType: z.enum(['call', 'demo', 'coffee', 'lunch']).optional(),
  urgencyFactor: z.string().max(100).optional(),
  subjectLineStyle: z.enum(['intriguing', 'direct', 'personal', 'benefit']).optional(),
  personalizedElement: z.string().max(200).optional(),
  
  // Referral Information
  referrerFirstName: z.string().max(50).optional(),
  referrerLastName: z.string().max(50).optional(),
  referrerJobTitle: z.string().max(100).optional(),
  referrerEmail: z.string().email().optional(),
  referrerRelationship: z.string().max(100).optional(),
  
  // Generation Settings
  variations: z.number().min(1).max(5).default(1),
  generateFollowUps: z.boolean().default(false),
  followUpCount: z.number().min(1).max(5).default(3),
  saveAsTemplate: z.boolean().default(false)
});

export function validateColdEmailInput(data: any) {
  try {
    const validated = coldEmailInputSchema.parse(data);
    return { success: true as const, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
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

export type ColdEmailInput = z.infer<typeof coldEmailInputSchema>;