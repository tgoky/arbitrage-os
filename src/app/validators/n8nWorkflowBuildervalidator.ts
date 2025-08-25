// validators/n8nWorkflowBuilder.validator.ts
import { z } from 'zod';

const n8nWorkflowInputSchema = z.object({
  // Basic Workflow Information
  workflowName: z.string()
    .min(1, 'Workflow name is required')
    .max(100, 'Workflow name is too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Workflow name contains invalid characters'),
  
  workflowDescription: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  // Trigger Configuration
  triggerType: z.enum(['schedule', 'webhook', 'event'], {
    message: 'Trigger type must be schedule, webhook, or event'
  }),
  
  scheduleDetails: z.string()
    .max(200, 'Schedule details are too long')
    .optional(),
    
  webhookDetails: z.string()
    .max(200, 'Webhook details are too long')
    .optional(),
    
  eventDetails: z.string()
    .max(200, 'Event details are too long')
    .optional(),
    
  triggerData: z.string()
    .max(1000, 'Trigger data description is too long')
    .optional(),
  
  // Actions & Integrations
  integrations: z.array(z.string().max(100))
    .min(1, 'At least one integration is required')
    .max(20, 'Too many integrations selected'),
  
  actionDescription: z.string()
    .min(10, 'Please describe what the workflow should do')
    .max(2000, 'Action description is too long'),
  
  // Advanced Configuration
  additionalContext: z.string()
    .max(1000, 'Additional context is too long')
    .optional(),
    
  specificRequirements: z.array(z.string().max(200))
    .max(10, 'Too many specific requirements')
    .optional(),
    
  workflowGoals: z.array(z.string().max(100))
    .max(5, 'Too many workflow goals')
    .optional(),
  
  // Metadata
  complexity: z.enum(['simple', 'moderate', 'complex'])
    .optional(),
    
  estimatedRunTime: z.number()
    .min(0)
    .max(86400) // 24 hours in seconds
    .optional()
});

export function validateN8nWorkflowInput(data: any, partial = false): 
  | { success: true; data: z.infer<typeof n8nWorkflowInputSchema> }
  | { success: false; errors: any[] } {
  try {
    const schema = partial ? n8nWorkflowInputSchema.partial() : n8nWorkflowInputSchema;
    const validated = schema.parse(data);
    return { success: true, data: validated as z.infer<typeof n8nWorkflowInputSchema> };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

// Business logic validation
export function validateWorkflowBusinessRules(data: z.infer<typeof n8nWorkflowInputSchema>): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
  insights: {
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedSetupTime: number; // in minutes
    estimatedExecutionTime: number; // in seconds
    securityLevel: 'low' | 'medium' | 'high';
    maintenanceLevel: 'low' | 'medium' | 'high';
    expectedAccuracy: number; // 0-100
  };
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let complexityScore = 0;
  let setupTimeMinutes = 15; // Base setup time
  let securityRisk = 0;
  let maintenanceComplexity = 0;

  // Analyze trigger configuration
  if (data.triggerType === 'schedule') {
    complexityScore += 1;
    setupTimeMinutes += 5;
    if (!data.scheduleDetails) {
      warnings.push('Schedule details not provided - will use default configuration');
      recommendations.push('Specify schedule details for more precise timing');
    }
  } else if (data.triggerType === 'webhook') {
    complexityScore += 2;
    setupTimeMinutes += 10;
    securityRisk += 2;
    if (!data.webhookDetails) {
      warnings.push('Webhook details not provided - security considerations needed');
      recommendations.push('Define webhook security requirements and authentication');
    }
    recommendations.push('Consider implementing webhook signature verification');
  } else if (data.triggerType === 'event') {
    complexityScore += 2;
    setupTimeMinutes += 8;
    if (!data.eventDetails) {
      warnings.push('Event details not specified - may need additional configuration');
    }
  }

  // Analyze integrations
  const integrationCount = data.integrations.length;
  complexityScore += integrationCount;
  setupTimeMinutes += integrationCount * 5;
  maintenanceComplexity += integrationCount * 0.5;

  // Check for high-security integrations
  const securityIntegrations = [
    'AWS', 'Google Cloud', 'Azure', 'PayPal', 'Stripe', 'Banking APIs',
    'Microsoft SQL Server', 'PostgreSQL', 'MongoDB', 'Redis'
  ];
  
  const hasSecurityIntegrations = data.integrations.some(integration =>
    securityIntegrations.some(secure => integration.includes(secure))
  );
  
  if (hasSecurityIntegrations) {
    securityRisk += 3;
    recommendations.push('High-security integrations detected - ensure proper credential management');
    recommendations.push('Consider using environment variables for sensitive data');
  }

  // Check for complex integrations
  const complexIntegrations = [
    'Salesforce', 'SAP', 'Oracle', 'Microsoft Dynamics', 'Workday',
    'ServiceNow', 'Jira', 'Confluence', 'SharePoint'
  ];
  
  const hasComplexIntegrations = data.integrations.some(integration =>
    complexIntegrations.some(complex => integration.includes(complex))
  );
  
  if (hasComplexIntegrations) {
    complexityScore += 3;
    setupTimeMinutes += 20;
    maintenanceComplexity += 2;
    recommendations.push('Complex enterprise integrations require additional setup time');
    recommendations.push('Consider staging environment for testing before production');
  }

  // Analyze action complexity
  const actionWords = data.actionDescription.split(' ').length;
  if (actionWords > 50) {
    complexityScore += 2;
    setupTimeMinutes += 10;
    recommendations.push('Complex actions detected - consider breaking into smaller workflows');
  }
  
  if (data.actionDescription.toLowerCase().includes('conditional') || 
      data.actionDescription.toLowerCase().includes('if') ||
      data.actionDescription.toLowerCase().includes('based on')) {
    complexityScore += 2;
    recommendations.push('Conditional logic detected - ensure proper error handling');
  }

  // Check for data transformation needs
  if (data.actionDescription.toLowerCase().includes('transform') ||
      data.actionDescription.toLowerCase().includes('format') ||
      data.actionDescription.toLowerCase().includes('convert')) {
    complexityScore += 1;
    recommendations.push('Data transformation identified - consider using Set or Code nodes');
  }

  // Check for looping/iteration
  if (data.actionDescription.toLowerCase().includes('each') ||
      data.actionDescription.toLowerCase().includes('every') ||
      data.actionDescription.toLowerCase().includes('loop')) {
    complexityScore += 2;
    maintenanceComplexity += 1;
    recommendations.push('Iteration logic detected - implement proper batch handling');
  }

  // Integration-specific warnings and recommendations
  if (data.integrations.includes('Gmail') || data.integrations.includes('Google Sheets')) {
    recommendations.push('Google integrations require OAuth2 setup - prepare Google Cloud Console access');
  }
  
  if (data.integrations.includes('Slack') || data.integrations.includes('Discord')) {
    recommendations.push('Chat integrations need app creation in respective platforms');
  }
  
  if (data.integrations.includes('Stripe') || data.integrations.includes('PayPal')) {
    warnings.push('Payment integrations require careful error handling for transaction safety');
    recommendations.push('Implement proper webhook validation for payment events');
  }

  // Determine complexity level
  let complexity: 'simple' | 'moderate' | 'complex';
  if (complexityScore <= 5) {
    complexity = 'simple';
  } else if (complexityScore <= 12) {
    complexity = 'moderate';
  } else {
    complexity = 'complex';
    warnings.push('High complexity workflow - consider professional n8n training');
    recommendations.push('Plan for extensive testing and gradual rollout');
  }

  // Calculate security level
  let securityLevel: 'low' | 'medium' | 'high';
  if (securityRisk <= 2) {
    securityLevel = 'low';
  } else if (securityRisk <= 5) {
    securityLevel = 'medium';
    recommendations.push('Medium security requirements - review credential storage');
  } else {
    securityLevel = 'high';
    warnings.push('High security requirements - ensure compliance with security policies');
    recommendations.push('Consider dedicated n8n instance for high-security workflows');
  }

  // Calculate maintenance level
  let maintenanceLevel: 'low' | 'medium' | 'high';
  if (maintenanceComplexity <= 3) {
    maintenanceLevel = 'low';
  } else if (maintenanceComplexity <= 8) {
    maintenanceLevel = 'medium';
  } else {
    maintenanceLevel = 'high';
    recommendations.push('High maintenance workflow - document thoroughly');
    recommendations.push('Set up monitoring and alerting for critical paths');
  }

  // Estimate execution time
  let estimatedExecutionTime = 10; // Base 10 seconds
  estimatedExecutionTime += integrationCount * 3; // 3 seconds per integration
  if (hasComplexIntegrations) estimatedExecutionTime += 15;
  if (data.actionDescription.toLowerCase().includes('large') || 
      data.actionDescription.toLowerCase().includes('many')) {
    estimatedExecutionTime += 30;
  }

  // Calculate expected accuracy
  const accuracyFactors = [
    data.actionDescription.length > 50 ? 20 : 10,
    integrationCount <= 5 ? 20 : 15,
    data.triggerType === 'schedule' ? 15 : data.triggerType === 'webhook' ? 10 : 12,
    data.additionalContext ? 10 : 0,
    (data.specificRequirements?.length || 0) * 5,
    data.workflowGoals ? 15 : 0
  ];
  
  const expectedAccuracy = Math.min(95, accuracyFactors.reduce((sum, factor) => sum + factor, 30));

  // Additional recommendations based on integrations
  if (integrationCount > 10) {
    warnings.push('Many integrations can impact performance and reliability');
    recommendations.push('Consider splitting into multiple smaller workflows');
  }

  if (data.triggerType === 'schedule' && !data.scheduleDetails) {
    recommendations.push('Specify timezone for scheduled workflows to avoid confusion');
  }

  // Specific trigger recommendations
  switch (data.triggerType) {
    case 'webhook':
      recommendations.push('Test webhook endpoint thoroughly before going live');
      recommendations.push('Implement proper request validation and error responses');
      break;
    case 'event':
      recommendations.push('Ensure event source reliability and implement retries');
      break;
    case 'schedule':
      recommendations.push('Consider off-peak hours for resource-intensive workflows');
      break;
  }

  // Final setup time adjustment
  if (setupTimeMinutes < 30) setupTimeMinutes = 30; // Minimum realistic setup time
  if (setupTimeMinutes > 180) setupTimeMinutes = 180; // Cap at 3 hours

  return {
    isValid: warnings.length < 3, // Allow up to 2 warnings
    warnings,
    recommendations,
    insights: {
      complexity,
      estimatedSetupTime: setupTimeMinutes,
      estimatedExecutionTime,
      securityLevel,
      maintenanceLevel,
      expectedAccuracy: Math.round(expectedAccuracy)
    }
  };
}

// Helper function to extract workflow insights
export function extractWorkflowInsights(data: z.infer<typeof n8nWorkflowInputSchema>) {
  const insights = {
    context: {
      hasTriggerDetails: !!(
        (data.triggerType === 'schedule' && data.scheduleDetails) ||
        (data.triggerType === 'webhook' && data.webhookDetails) ||
        (data.triggerType === 'event' && data.eventDetails)
      ),
      hasCompleteContext: !!(data.additionalContext && data.workflowGoals),
      hasRequirements: !!(data.specificRequirements && data.specificRequirements.length > 0),
      actionComplexity: data.actionDescription.split(' ').length > 30 ? 'high' : 
                        data.actionDescription.split(' ').length > 15 ? 'medium' : 'low'
    },
    completeness: {
      trigger: data.triggerType && (
        (data.triggerType === 'schedule' && data.scheduleDetails) ||
        (data.triggerType === 'webhook' && data.webhookDetails) ||
        (data.triggerType === 'event' && data.eventDetails) ||
        data.triggerData
      ) ? 3 : data.triggerType ? 2 : 1,
      integrations: data.integrations.length,
      actions: data.actionDescription ? (data.actionDescription.length > 50 ? 3 : 2) : 1,
      context: [
        data.additionalContext,
        data.specificRequirements,
        data.workflowGoals,
        data.workflowDescription
      ].filter(x => x && (Array.isArray(x) ? x.length > 0 : true)).length
    },
    recommendations: {
      shouldGenerate: !!(data.workflowName && data.integrations.length > 0 && data.actionDescription),
      needsMoreDetails: !data.additionalContext && !data.workflowGoals,
      readyForAdvanced: !!(
        data.workflowDescription && 
        data.additionalContext && 
        data.specificRequirements?.length &&
        data.workflowGoals?.length
      ),
      integrationComplexity: data.integrations.length > 5 ? 'high' : 
                           data.integrations.length > 2 ? 'medium' : 'low'
    }
  };

  return insights;
}

// Specific integration validators
export function validateIntegrationRequirements(integrations: string[]): {
  valid: boolean;
  conflicts: string[];
  requirements: string[];
  suggestions: string[];
} {
  const conflicts: string[] = [];
  const requirements: string[] = [];
  const suggestions: string[] = [];

  // Check for conflicting integrations
  const databases = ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'];
  const dbIntegrations = integrations.filter(i => databases.some(db => i.includes(db)));
  if (dbIntegrations.length > 3) {
    conflicts.push('Multiple database integrations may cause performance issues');
  }

  // Check for authentication conflicts
  const googleServices = integrations.filter(i => i.startsWith('Google'));
  const microsoftServices = integrations.filter(i => i.includes('Microsoft') || i.includes('Outlook'));
  
  if (googleServices.length > 0 && microsoftServices.length > 0) {
    suggestions.push('Consider consolidating to one productivity suite for easier management');
  }

  // Required setups
  if (integrations.some(i => i.includes('AWS'))) {
    requirements.push('AWS IAM credentials and proper permissions setup required');
  }
  
  if (integrations.some(i => i.includes('Stripe') || i.includes('PayPal'))) {
    requirements.push('Payment processor webhook endpoints must be configured');
  }

  // Performance suggestions
  if (integrations.length > 8) {
    suggestions.push('Consider using sub-workflows to organize complex integrations');
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    requirements,
    suggestions
  };
}

// Export the main input type for use in services
export type N8nWorkflowInput = z.infer<typeof n8nWorkflowInputSchema>;