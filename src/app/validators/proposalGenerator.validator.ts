// validators/proposalGenerator.validator.ts
import { z } from 'zod';

const proposalSolutionSchema = z.object({
  id: z.string().min(1),
  solutionName: z.string().min(1, 'Solution name is required').max(200),
  howItWorks: z.string().max(2000).optional().default(''),
  keyBenefits: z.string().max(1000).optional().default(''),
  setupFee: z.string().max(50).optional().default(''),
  monthlyFee: z.string().max(50).optional().default(''),
});

const proposalGeneratorInputSchema = z.object({
  clientDetails: z.object({
    clientName: z.string().min(1, 'Client name is required').max(100),
    clientTitle: z.string().max(100).optional().default(''),
    companyName: z.string().max(200).optional().default(''),
    corePitchGoal: z.string().max(500).optional().default(''),
    presentationTone: z.string().max(100).optional().default('Professional, ROI-focused'),
  }),

  currentState: z.object({
    mainBottleneck: z.string().max(2000).optional().default(''),
    teamInefficiencies: z.string().max(2000).optional().default(''),
    opportunityCost: z.string().max(2000).optional().default(''),
  }),

  futureState: z.object({
    proposedTeamStructure: z.string().max(2000).optional().default(''),
    ownerExecutiveRole: z.string().max(2000).optional().default(''),
  }),

  solutions: z
    .array(proposalSolutionSchema)
    .min(1, 'At least one solution is required')
    .max(10, 'Maximum 10 solutions'),

  closeDetails: z.object({
    bundleDiscountOffer: z.string().max(500).optional().default(''),
    callToAction: z.string().max(200).optional().default('Book Your Strategy Call'),
    bookingLink: z.string().max(500).optional().default(''),
  }),

  rawAnalysisContext: z.string().max(200000).optional(),
});

export function validateProposalGeneratorInput(data: unknown):
  | { success: true; data: z.infer<typeof proposalGeneratorInputSchema> }
  | { success: false; errors: z.ZodIssue[] } {
  try {
    const validated = proposalGeneratorInputSchema.parse(data);

    // Business rule: at least one solution must have a name
    const namedSolutions = validated.solutions.filter((s) => s.solutionName.trim().length > 0);
    if (namedSolutions.length === 0) {
      return {
        success: false,
        errors: [
          {
            code: 'custom',
            path: ['solutions'],
            message: 'At least one solution must have a name',
          },
        ],
      };
    }

    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return {
      success: false,
      errors: [{ code: 'custom', path: [], message: 'Validation failed' }],
    };
  }
}

export type ValidatedProposalInput = z.infer<typeof proposalGeneratorInputSchema>;