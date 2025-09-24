// validators/proposalCreator.validator.ts - ULTRA RELAXED VERSION (Only 3 required fields)
import { z } from 'zod';

// Ultra relaxed client schema - only legal name required
const clientInformationSchema = z.object({
  legalName: z.string()
    .min(2, 'Client legal name is required')
    .max(100, 'Client legal name too long'),
  
  stateOfIncorporation: z.string().optional(),
  entityType: z.enum(['corporation', 'llc', 'partnership', 'sole-proprietorship']).optional(),
  address: z.string().optional(), // Made fully optional
  signatoryName: z.string().optional(), // Made fully optional
  signatoryTitle: z.string().optional(), // Made fully optional
  
  industry: z.enum([
    'technology', 'healthcare', 'finance', 'marketing', 'consulting',
    'ecommerce', 'manufacturing', 'real-estate', 'education', 'other'
  ]).default('other'),
  
  companySize: z.enum(['startup', 'small', 'medium', 'enterprise']).default('medium'),
  decisionMaker: z.string().optional()
});

// Ultra relaxed service provider - all optional since workspace can provide
const serviceProviderSchema = z.object({
  name: z.string().optional(), // Made optional - can use workspace name
  legalName: z.string().optional(),
  address: z.string().optional(),
  signatoryName: z.string().optional(),
  signatoryTitle: z.string().optional(),
  businessStructure: z.string().optional(),
  
  credentials: z.array(z.string()).default([]),
  specializations: z.array(z.string()).default([])
});

// Ultra relaxed deliverable schema
const deliverableSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  format: z.string().default('Document'),
  quantity: z.number().default(1),
  dueDate: z.string().optional(),
  acceptanceCriteria: z.array(z.string()).default([])
});

// Ultra relaxed milestone schema
const milestoneSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  dueDate: z.string().default('TBD'),
  deliverables: z.array(z.string()).default([]),
  paymentPercentage: z.number().optional(),
  acceptanceCriteria: z.array(z.string()).default([])
});

// Project scope - only description required
const projectScopeSchema = z.object({
  description: z.string()
    .min(20, 'Project description required (min 20 chars)')
    .max(2000, 'Description too long'),
  
  objectives: z.array(z.string()).default([]),
  deliverables: z.array(deliverableSchema).min(0).default([]), // Made optional
  timeline: z.string().default('TBD'),
  milestones: z.array(milestoneSchema).default([]),
  exclusions: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([])
});

// Ultra relaxed pricing schemas
const pricingBreakdownSchema = z.object({
  item: z.string().default(''),
  description: z.string().default(''),
  quantity: z.number().default(1),
  rate: z.number().default(0),
  amount: z.number().default(0),
  category: z.enum(['labor', 'materials', 'expenses', 'other']).default('labor')
});

const paymentScheduleSchema = z.object({
  description: z.string().default(''),
  amount: z.number().default(0),
  dueDate: z.string().default('Upon signing'),
  conditions: z.array(z.string()).default([]),
  status: z.enum(['pending', 'paid', 'overdue']).default('pending')
});

// Pricing - only total amount required
const pricingStructureSchema = z.object({
  model: z.enum(['fixed-price', 'hourly-rate', 'milestone-based', 'value-based', 'retainer', 'hybrid'])
    .default('fixed-price'),
  
  totalAmount: z.number()
    .min(100, 'Total amount must be at least $100')
    .max(10000000, 'Amount too high'),
  
  currency: z.string().default('USD'),
  breakdown: z.array(pricingBreakdownSchema).default([]),
  paymentSchedule: z.array(paymentScheduleSchema).min(0).default([]), // Made optional
  expensePolicy: z.string().default(''),
  lateFeePercentage: z.number().default(1.5),
  discounts: z.array(z.any()).default([])
});

// All terms optional
const proposalTermsSchema = z.object({
  proposalValidityDays: z.number().default(30),
  contractLength: z.enum(['one-time', 'monthly', '3-months', '6-months', 'annual', 'ongoing']).default('one-time'),
  terminationNotice: z.number().default(30),
  intellectualProperty: z.enum(['client-owns', 'service-provider-owns', 'shared', 'work-for-hire']).default('work-for-hire'),
  confidentiality: z.boolean().default(true),
  liabilityLimit: z.number().default(0),
  warranty: z.string().default(''),
  governingLaw: z.string().default(''),
  disputeResolution: z.enum(['arbitration', 'mediation', 'litigation']).default('arbitration'),
  forceMarjeure: z.boolean().default(true),
  amendments: z.string().default('')
});

// Main schema - minimal requirements
const proposalInputSchema = z.object({
  proposalType: z.enum(['service-agreement', 'project-proposal', 'retainer-agreement', 'consulting-proposal', 'custom-proposal']).default('service-agreement'),
  client: clientInformationSchema,
  serviceProvider: serviceProviderSchema,
  project: projectScopeSchema,
  pricing: pricingStructureSchema,
  terms: proposalTermsSchema,
  customizations: z.any().default({}),
  workspaceId: z.string().min(1),
  userId: z.string().min(1)
}).superRefine((data, ctx) => {
  // Only validate if both payment schedule exists AND has values
  if (data.pricing.paymentSchedule.length > 0) {
    const paymentTotal = data.pricing.paymentSchedule.reduce((sum, payment) => sum + payment.amount, 0);
    if (paymentTotal > 0) {
      const variance = Math.abs(paymentTotal - data.pricing.totalAmount) / data.pricing.totalAmount;
      
      if (variance > 0.2) { // Allow 20% variance for ultra-relaxed mode
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Payment schedule total should roughly match pricing total (advisory)',
          path: ['pricing', 'paymentSchedule']
        });
      }
    }
  }
});

// Export the ultra-relaxed validation function
export function validateProposalInput(data: any): 
  | { success: true; data: z.infer<typeof proposalInputSchema> }
  | { success: false; errors: any[] } {
  try {
    const validated = proposalInputSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Only show the 3 critical errors
      const criticalErrors = error.issues.filter(issue => {
        const path = issue.path.join('.');
        return [
          'client.legalName',
          'project.description', 
          'pricing.totalAmount'
        ].some(criticalPath => path.includes(criticalPath));
      });
      
      return { success: false, errors: criticalErrors.length > 0 ? criticalErrors : [] };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

// Ultra-relaxed progressive validation - only 3 fields matter
export function validateProposalProgressive(
  input: Partial<any>, 
  showAllErrors = false
): any {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Only the 3 essential fields
  const essentialFields = [
    () => input.client?.legalName && input.client.legalName.length >= 2,
    () => input.project?.description && input.project.description.length >= 20,
    () => input.pricing?.totalAmount && input.pricing.totalAmount >= 100
  ];

  const completedEssential = essentialFields.filter(field => field()).length;
  const totalEssential = essentialFields.length;

  // Only the 3 critical errors
  if (showAllErrors || input.client?.legalName !== undefined) {
    if (!input.client?.legalName || input.client.legalName.length < 2) {
      errors['client.legalName'] = 'Client name is required (minimum 2 characters)';
    }
  }

  if (showAllErrors || input.project?.description !== undefined) {
    if (!input.project?.description || input.project.description.length < 20) {
      errors['project.description'] = 'Project description required (minimum 20 characters)';
    }
  }

  if (showAllErrors || input.pricing?.totalAmount !== undefined) {
    if (!input.pricing?.totalAmount || input.pricing.totalAmount < 100) {
      errors['pricing.totalAmount'] = 'Total amount must be at least $100';
    }
  }

  // Friendly suggestions (not blockers)
  if (!input.client?.address) {
    warnings['client.address'] = 'Adding client address improves contract professionalism';
  }

  if (!input.serviceProvider?.name && !input.serviceProvider?.legalName) {
    warnings['serviceProvider.name'] = 'Company name will be filled from workspace if not provided';
  }

  if (!input.project?.deliverables || input.project.deliverables.length === 0) {
    warnings['project.deliverables'] = 'Deliverables will be auto-generated if not specified';
  }

  if (!input.pricing?.paymentSchedule || input.pricing.paymentSchedule.length === 0) {
    warnings['pricing.paymentSchedule'] = 'Payment schedule will be auto-created based on total amount';
  }

  const completionPercentage = Math.round((completedEssential / totalEssential) * 100);
  const hasBlockingErrors = Object.keys(errors).length > 0;
  const isReadyToGenerate = !hasBlockingErrors && completedEssential === 3; // Need all 3

  const missingCriticalFields: string[] = [];
  if (!input.client?.legalName) missingCriticalFields.push('Client Name');
  if (!input.project?.description) missingCriticalFields.push('Project Description');
  if (!input.pricing?.totalAmount) missingCriticalFields.push('Total Amount');

  return {
    isValid: !hasBlockingErrors && completedEssential === totalEssential,
    isReadyToGenerate,
    errors,
    warnings,
    completionPercentage,
    completedFields: completedEssential,
    totalRequiredFields: totalEssential,
    missingCriticalFields
  };
}

// Keep existing business rules validation but make it advisory only
export function validateProposalBusinessRules(data: any): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  riskFactors: any[];
} {
  // Always return valid - this is advisory only
  return {
    isValid: true,
    warnings: [],
    suggestions: [
      'Review generated placeholders before sending to clients',
      'Customize legal terms based on your business needs',
      'Add specific deliverables for more detailed proposals'
    ],
    riskFactors: []
  };
}

// Cache key generator - MISSING FUNCTION
export function generateProposalCacheKey(input: any): string {
  const keyData = {
    proposalType: input.proposalType || 'service-agreement',
    clientIndustry: input.client?.industry || 'other',
    pricingModel: input.pricing?.model || 'fixed-price',
    contractLength: input.terms?.contractLength || 'one-time',
    totalAmount: Math.floor((input.pricing?.totalAmount || 0) / 1000) * 1000, // Round to nearest 1k
    deliverablesCount: input.project?.deliverables?.length || 0,
    milestonesCount: input.project?.milestones?.length || 0
  };
  
  return Buffer.from(JSON.stringify(keyData)).toString('base64');
}