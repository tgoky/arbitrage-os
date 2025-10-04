// validators/proposalCreator.validator.ts - SIMPLIFIED VERSION

import { z } from 'zod';

// Simplified schemas matching frontend
const clientInformationSchema = z.object({
  legalName: z.string()
    .min(2, 'Client legal name is required')
    .max(100, 'Client legal name too long'),
  stateOfIncorporation: z.string().optional(),
  entityType: z.enum(['corporation', 'llc', 'partnership', 'sole-proprietorship']).optional(),
  address: z.string().optional(),
  signatoryName: z.string().optional(),
  signatoryTitle: z.string().optional(),
});

const serviceProviderSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  signatoryName: z.string().optional(),
  signatoryTitle: z.string().optional(),
});

const projectScopeSchema = z.object({
  description: z.string()
    .min(20, 'Project description required (min 20 chars)')
    .max(2000, 'Description too long'),
  scopeOfServices: z.string().optional(),
  timeline: z.string().optional(),
  fees: z.string().optional(),
  serviceProviderResponsibilities: z.string().optional(),
  clientResponsibilities: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  additionalTerms: z.string().optional(),
});

// Main schema - minimal requirements
const proposalInputSchema = z.object({
  serviceProvider: serviceProviderSchema,
  clientInfo: clientInformationSchema,
  projectScope: projectScopeSchema,
  effectiveDate: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  userId: z.string().optional(),
});

// Ultra-relaxed progressive validation
export function validateProposalProgressive(
  input: Partial<any>, 
  showAllErrors = false
): any {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Essential fields - only 3 required
  const essentialFields = [
    () => input.clientInfo?.legalName && input.clientInfo.legalName.length >= 2,
    () => input.projectScope?.description && input.projectScope.description.length >= 20,
    () => input.serviceProvider?.name && input.serviceProvider.name.length >= 2
  ];

  const completedEssential = essentialFields.filter(field => field()).length;
  const totalEssential = essentialFields.length;

  // Critical errors
  if (showAllErrors || input.clientInfo?.legalName !== undefined) {
    if (!input.clientInfo?.legalName || input.clientInfo.legalName.length < 2) {
      errors['clientInfo.legalName'] = 'Client legal name is required (minimum 2 characters)';
    }
  }

  if (showAllErrors || input.projectScope?.description !== undefined) {
    if (!input.projectScope?.description || input.projectScope.description.length < 20) {
      errors['projectScope.description'] = 'Project description required (minimum 20 characters)';
    }
  }

  if (showAllErrors || input.serviceProvider?.name !== undefined) {
    if (!input.serviceProvider?.name || input.serviceProvider.name.length < 2) {
      errors['serviceProvider.name'] = 'Service provider name is required (minimum 2 characters)';
    }
  }

  // Friendly suggestions
  if (!input.serviceProvider?.address) {
    warnings['serviceProvider.address'] = 'Adding service provider address improves professionalism';
  }

  if (!input.clientInfo?.address) {
    warnings['clientInfo.address'] = 'Adding client address improves contract completeness';
  }

  if (!input.serviceProvider?.signatoryName || !input.serviceProvider?.signatoryTitle) {
    warnings['serviceProvider.signatory'] = 'Service provider signatory details help with legal execution';
  }

  if (!input.clientInfo?.signatoryName || !input.clientInfo?.signatoryTitle) {
    warnings['clientInfo.signatory'] = 'Client signatory details help with legal execution';
  }

  if (!input.projectScope?.scopeOfServices) {
    warnings['projectScope.scopeOfServices'] = 'Scope of services helps define project boundaries';
  }

  if (!input.projectScope?.fees) {
    warnings['projectScope.fees'] = 'Fee details help clarify payment expectations';
  }

  const completionPercentage = Math.round((completedEssential / totalEssential) * 100);
  const hasBlockingErrors = Object.keys(errors).length > 0;
  const isReadyToGenerate = !hasBlockingErrors && completedEssential === 3;

  const missingCriticalFields: string[] = [];
  if (!input.clientInfo?.legalName) missingCriticalFields.push('Client Legal Name');
  if (!input.projectScope?.description) missingCriticalFields.push('Project Description');
  if (!input.serviceProvider?.name) missingCriticalFields.push('Service Provider Name');

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

// Export the validation function
export function validateProposalInput(data: any): 
  | { success: true; data: z.infer<typeof proposalInputSchema> }
  | { success: false; errors: any[] } {
  try {
    const transformedData = {
      serviceProvider: data.serviceProvider || {},
      clientInfo: data.clientInfo || {},
      projectScope: data.projectScope || {},
      effectiveDate: data.effectiveDate || '',
      workspaceId: data.workspaceId || '',
      userId: data.userId || ''
    };

    const validated = proposalInputSchema.parse(transformedData);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const criticalErrors = error.issues.filter(issue => {
        const path = issue.path.join('.');
        return [
          'clientInfo.legalName',
          'projectScope.description',
          'serviceProvider.name'
        ].some(criticalPath => path.includes(criticalPath));
      });
      
      return { success: false, errors: criticalErrors.length > 0 ? criticalErrors : [] };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

// Helper to check if proposal is minimally viable
export function isProposalMinimallyViable(input: any): boolean {
  return !!(
    input.clientInfo?.legalName &&
    input.clientInfo.legalName.length >= 2 &&
    input.projectScope?.description &&
    input.projectScope.description.length >= 20 &&
    input.serviceProvider?.name &&
    input.serviceProvider.name.length >= 2
  );
}

// Helper to get validation summary for UI
export function getValidationSummary(input: any) {
  const validation = validateProposalProgressive(input);
  
  return {
    status: validation.isReadyToGenerate ? 'ready' : 
            validation.completedFields > 0 ? 'in-progress' : 'not-started',
    progress: validation.completionPercentage,
    criticalFieldsMissing: validation.missingCriticalFields,
    suggestions: Object.values(validation.warnings),
    canGenerate: validation.isReadyToGenerate
  };
}