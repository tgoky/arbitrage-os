// types/n8nWorkflowBuilder.ts
export interface N8nWorkflowInput {
  // Basic Workflow Information
  workflowName: string;
  workflowDescription?: string;
  
  // Trigger Configuration
  triggerType: 'schedule' | 'webhook' | 'event';
  scheduleDetails?: string;
  webhookDetails?: string;
  eventDetails?: string;
  triggerData?: string;
  
  // Actions & Integrations
  integrations: string[];
  actionDescription: string;
  
  // Advanced Configuration
  additionalContext?: string;
  specificRequirements?: string[];
  workflowGoals?: string[];
  
  // Metadata
  userId?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  estimatedRunTime?: number;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, string>;
  webhookId?: string;
  disabled?: boolean;
}

export interface N8nConnection {
  [key: string]: {
    main: Array<Array<{
      node: string;
      type: string;
      index: number;
    }>>;
  };
}

export interface N8nWorkflowConfig {
  id: string;
  name: string;
  nodes: N8nNode[];
  connections: N8nConnection;
  active: boolean;
  settings: {
    executionOrder?: 'v0' | 'v1';
    saveManualExecutions?: boolean;
    callerPolicy?: string;
    errorWorkflow?: string;
    timezone?: string;
  };
  staticData?: Record<string, any>;
  tags?: string[];
  triggerCount?: number;
  updatedAt?: string;
  versionId?: string;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedSetupTime: number; // in minutes
  requiredCredentials: RequiredCredential[];
}

export interface RequiredCredential {
  name: string;
  type: string;
  service: string;
  setupLink: string;
  priority: 'required' | 'optional';
  description: string;
}

export interface WorkflowAnalysis {
  nodeCount: number;
  connectionCount: number;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedExecutionTime: number;
  potentialIssues: string[];
  optimizationSuggestions: string[];
  securityConsiderations: string[];
  scalabilityNotes: string[];
}

export interface GeneratedWorkflowPackage {
  workflowId: string;
  workflowConfig: N8nWorkflowConfig;
  setupInstructions: {
    steps: string[];
    credentialSetup: RequiredCredential[];
    testingGuidance: string[];
    troubleshooting: string[];
  };
  exportFormats: {
    n8nJson: string;
    documentation: string;
    setupScript?: string;
  };
  analysis: WorkflowAnalysis;
  alternatives: {
    simplified?: N8nWorkflowConfig;
    advanced?: N8nWorkflowConfig;
  };
  tokensUsed: number;
  processingTime: number;
}

export interface IntegrationTemplate {
  name: string;
  displayName: string;
  category: string;
  description: string;
  nodeType: string;
  credentialType?: string;
  commonParameters: Record<string, any>;
  examples: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  documentation: string;
  setupComplexity: 'easy' | 'moderate' | 'complex';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  useCase: string;
  requiredIntegrations: string[];
  estimatedSetupTime: number;
  workflowConfig: Partial<N8nWorkflowConfig>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'new' | 'running' | 'finished' | 'failed' | 'canceled' | 'crashed' | 'waiting';
  mode: 'manual' | 'trigger' | 'webhook' | 'retry';
  startedAt: Date;
  stoppedAt?: Date;
  duration?: number;
  data?: any;
  error?: string;
}

// Database/API Response Types
export interface SavedWorkflow {
  id: string;
  title: string;
  workflowName: string;
  workflowDescription?: string;
  triggerType: string;
  integrations: string[];
  complexity: string;
  nodeCount: number;
  status: 'draft' | 'active' | 'paused' | 'error';
  workflowConfig: N8nWorkflowConfig;
  analysis: WorkflowAnalysis;
  setupInstructions: any;
  createdAt: Date;
  updatedAt: Date;
  workspace: {
    id: string;
    name: string;
  };
}

export interface WorkflowListItem {
  id: string;
  title: string;
  workflowName: string;
  triggerType: string;
  integrations: string[];
  complexity: string;
  nodeCount: number;
  status: string;
  lastRun?: Date;
  totalRuns?: number;
  successRate?: number;
  createdAt: Date;
  updatedAt: Date;
  workspace: {
    id: string;
    name: string;
  };
}

// Service Response Types
export interface WorkflowGenerationResponse {
  success: boolean;
  data?: {
    workflowId: string;
    package: GeneratedWorkflowPackage;
  };
  meta?: {
    tokensUsed: number;
    processingTime: number;
    remaining: number;
  };
  error?: string;
  debug?: string;
}

export interface WorkflowListResponse {
  success: boolean;
  data?: WorkflowListItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    remaining: number;
  };
  error?: string;
}

// Utility Types
export type WorkflowFormat = 'n8n' | 'json' | 'yaml' | 'documentation' | 'summary';
export type ExportFormat = 'summary' | 'detailed' | 'json' | 'setup-guide' | 'troubleshooting';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';
export type TriggerCategory = 'time' | 'webhook' | 'file' | 'database' | 'email' | 'api' | 'manual';
export type IntegrationCategory = 
  | 'communication' 
  | 'storage' 
  | 'database' 
  | 'marketing' 
  | 'crm' 
  | 'finance' 
  | 'productivity' 
  | 'developer-tools' 
  | 'ai-ml' 
  | 'ecommerce'
  | 'social-media'
  | 'analytics'
  | 'security'
  | 'other';

// Error Types
export interface WorkflowError {
  code: string;
  message: string;
  details?: any;
  suggestions?: string[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// Advanced Configuration Types
export interface WorkflowSettings {
  timezone?: string;
  errorWorkflow?: string;
  callerPolicy?: 'workflowsFromSameOwner' | 'workflowsFromAList' | 'any';
  executionOrder?: 'v0' | 'v1';
  saveManualExecutions?: boolean;
  saveExecutionProgress?: boolean;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionDate?: Date;
  successRate: number;
  errorPatterns: Array<{
    error: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

// UI Component Props Types (for frontend integration)
export interface WorkflowBuilderProps {
  onSave?: (workflow: N8nWorkflowInput) => Promise<void>;
  onExport?: (format: ExportFormat) => void;
  initialData?: Partial<N8nWorkflowInput>;
  templates?: WorkflowTemplate[];
  integrations?: IntegrationTemplate[];
}

export interface WorkflowViewerProps {
  workflowId: string;
  workflow: SavedWorkflow;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: (format: ExportFormat) => void;
  onDuplicate?: () => void;
}