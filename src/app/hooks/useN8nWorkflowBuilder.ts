// hooks/useN8nWorkflowBuilder.ts
import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { 
  N8nWorkflowInput, 
  GeneratedWorkflowPackage, 
  SavedWorkflow, 
  WorkflowListItem, 
  ExportFormat,
  WorkflowGenerationResponse,
  WorkflowListResponse,
  RequiredCredential
} from '@/types/n8nWorkflowBuilder';

interface UseN8nWorkflowBuilderReturn {
  // Generation
  generateWorkflow: (input: N8nWorkflowInput) => Promise<{ workflowId: string; workflow: GeneratedWorkflowPackage } | null>;
  isGenerating: boolean;
  generationError: string | null;
  
  // Workflow Management  
  workflows: WorkflowListItem[];
  getWorkflow: (workflowId: string) => Promise<SavedWorkflow | null>;
  updateWorkflow: (workflowId: string, updates: Partial<N8nWorkflowInput>) => Promise<SavedWorkflow | null>;
  deleteWorkflow: (workflowId: string) => Promise<boolean>;
  exportWorkflow: (workflowId: string, format: ExportFormat) => Promise<string | null>;
  
  // List Management
  loadWorkflows: (workspaceId?: string) => Promise<void>;
  isLoading: boolean;
  loadError: string | null;
  
  // State Management
  selectedWorkflow: SavedWorkflow | null;
  setSelectedWorkflow: (workflow: SavedWorkflow | null) => void;
  clearErrors: () => void;
  refreshWorkflows: () => Promise<void>;
}

export const useN8nWorkflowBuilder = (workspaceId?: string): UseN8nWorkflowBuilderReturn => {
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // List State
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Selected Workflow State
  const [selectedWorkflow, setSelectedWorkflow] = useState<SavedWorkflow | null>(null);

  // API Base URL
  const API_BASE = '/api/n8n-workflow-builder';

  // Helper function for API calls
  const makeApiCall = async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'API call failed');
      }

      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Generate Workflow
const generateWorkflow = useCallback(async (
  input: N8nWorkflowInput
): Promise<{ workflowId: string; workflow: GeneratedWorkflowPackage } | null> => {
  setIsGenerating(true);
  setGenerationError(null);

  try {
    console.log('🚀 Generating n8n workflow...', input);

    const response = await makeApiCall<WorkflowGenerationResponse>(API_BASE, {
      method: 'POST',
      body: JSON.stringify(input),
    });

    console.log('✅ Workflow generation successful:', response);

    // Show success message
    message.success({
      content: `Workflow "${input.workflowName}" generated successfully!`,
      duration: 3,
    });

    // Refresh workflows list to include the new workflow
    if (workspaceId) {
      await loadWorkflows(workspaceId);
    }

    // Handle undefined response.data
    if (!response.data) {
      return null;
    }

    // Map response.data to the expected return type
    return {
      workflowId: response.data.workflowId,
      workflow: response.data.package, // Rename 'package' to 'workflow' to match the return type
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate workflow';
    console.error('❌ Workflow generation failed:', error);
    
    setGenerationError(errorMessage);
    message.error({
      content: `Failed to generate workflow: ${errorMessage}`,
      duration: 5,
    });
    
    return null;
  } finally {
    setIsGenerating(false);
  }
}, [workspaceId]);

  // Load Workflows List
const loadWorkflows = useCallback(async (targetWorkspaceId?: string): Promise<void> => {
  setIsLoading(true);
  setLoadError(null);

  try {
    const params = new URLSearchParams();
    if (targetWorkspaceId) {
      params.append('workspaceId', targetWorkspaceId);
    }

    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
    console.log('📋 Loading workflows from:', url);

    const response = await makeApiCall<WorkflowListResponse>(url);
    
    // Check if response.data is defined, fallback to empty array if not
    const workflowsData = response.data || [];
    console.log('✅ Workflows loaded:', workflowsData.length);
    setWorkflows(workflowsData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load workflows';
    console.error('❌ Failed to load workflows:', error);
    
    setLoadError(errorMessage);
    message.error({
      content: `Failed to load workflows: ${errorMessage}`,
      duration: 5,
    });
  } finally {
    setIsLoading(false);
  }
}, []);

  // Get Single Workflow
  const getWorkflow = useCallback(async (workflowId: string): Promise<SavedWorkflow | null> => {
    try {
      console.log('📋 Fetching workflow:', workflowId);

      const response = await makeApiCall<{ success: true; data: SavedWorkflow }>(
        `${API_BASE}?workflowId=${workflowId}`
      );

      console.log('✅ Workflow fetched:', response.data);
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workflow';
      console.error('❌ Failed to fetch workflow:', error);
      
      message.error({
        content: `Failed to fetch workflow: ${errorMessage}`,
        duration: 5,
      });
      
      return null;
    }
  }, []);

  // Update Workflow
  const updateWorkflow = useCallback(async (
    workflowId: string, 
    updates: Partial<N8nWorkflowInput>
  ): Promise<SavedWorkflow | null> => {
    try {
      console.log('🔄 Updating workflow:', workflowId, updates);

      const response = await makeApiCall<{ success: true; data: SavedWorkflow }>(
        `${API_BASE}?workflowId=${workflowId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      );

      console.log('✅ Workflow updated:', response.data);

      // Update in local list
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId 
          ? { ...w, ...updates, updatedAt: new Date() }
          : w
      ));

      // Update selected workflow if it's the one being updated
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(response.data);
      }

      message.success({
        content: 'Workflow updated successfully!',
        duration: 3,
      });

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update workflow';
      console.error('❌ Failed to update workflow:', error);
      
      message.error({
        content: `Failed to update workflow: ${errorMessage}`,
        duration: 5,
      });
      
      return null;
    }
  }, [selectedWorkflow]);

  // Delete Workflow
  const deleteWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting workflow:', workflowId);

      await makeApiCall<{ success: true; data: { deleted: true } }>(
        `${API_BASE}?workflowId=${workflowId}`,
        {
          method: 'DELETE',
        }
      );

      console.log('✅ Workflow deleted:', workflowId);

      // Remove from local list
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));

      // Clear selected workflow if it was deleted
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null);
      }

      message.success({
        content: 'Workflow deleted successfully!',
        duration: 3,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete workflow';
      console.error('❌ Failed to delete workflow:', error);
      
      message.error({
        content: `Failed to delete workflow: ${errorMessage}`,
        duration: 5,
      });
      
      return false;
    }
  }, [selectedWorkflow]);

  // Export Workflow
  const exportWorkflow = useCallback(async (
    workflowId: string, 
    format: ExportFormat
  ): Promise<string | null> => {
    try {
      console.log('📤 Exporting workflow:', workflowId, 'as', format);

      // For exports, we'll call the service method via a dedicated endpoint
      // You might want to add this endpoint to handle exports specifically
      const workflow = await getWorkflow(workflowId);
      if (!workflow) return null;

      let exportContent = '';
      
      switch (format) {
        case 'json':
          exportContent = JSON.stringify(workflow.workflowConfig, null, 2);
          break;
        case 'summary':
          exportContent = generateWorkflowSummary(workflow);
          break;
        case 'detailed':
          exportContent = generateDetailedExport(workflow);
          break;
        case 'setup-guide':
          exportContent = generateSetupGuide(workflow);
          break;
        case 'troubleshooting':
          exportContent = generateTroubleshootingGuide(workflow);
          break;
        default:
          exportContent = JSON.stringify(workflow.workflowConfig, null, 2);
      }

      console.log('✅ Workflow exported successfully');
      return exportContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export workflow';
      console.error('❌ Failed to export workflow:', error);
      
      message.error({
        content: `Failed to export workflow: ${errorMessage}`,
        duration: 5,
      });
      
      return null;
    }
  }, [getWorkflow]);

  // Helper functions for export formatting
  const generateWorkflowSummary = (workflow: SavedWorkflow): string => {
    return `# ${workflow.workflowName}

**Type**: ${workflow.triggerType.toUpperCase()} Workflow
**Complexity**: ${workflow.complexity.toUpperCase()}
**Nodes**: ${workflow.nodeCount}
**Status**: ${workflow.status.toUpperCase()}
**Created**: ${workflow.createdAt.toLocaleDateString()}

## Description
${workflow.workflowDescription || 'No description provided'}

## Integrations
${workflow.integrations.map(integration => `• ${integration}`).join('\n')}

## Setup Requirements
${workflow.setupInstructions.credentialSetup.map((cred: RequiredCredential) => `• ${cred.name} (${cred.type})`).join('\n')}

## Analysis
• **Estimated Execution Time**: ${workflow.analysis.estimatedExecutionTime} seconds
• **Complexity**: ${workflow.analysis.complexity}
• **Security Level**: ${workflow.analysis.securityConsiderations.length > 2 ? 'High' : 'Medium'}

## Quick Setup
1. Import the workflow JSON into n8n
2. Configure required credentials
3. Test the workflow
4. Activate when ready

---
*Generated by n8n Workflow Builder*`;
  };

  const generateDetailedExport = (workflow: SavedWorkflow): string => {
    return `# ${workflow.workflowName} - Detailed Documentation

## Workflow Configuration
\`\`\`json
${JSON.stringify(workflow.workflowConfig, null, 2)}
\`\`\`

## Setup Instructions
${workflow.setupInstructions.steps.map((step: string, i: number)  => `${i + 1}. ${step}`).join('\n')}

## Required Credentials
${workflow.setupInstructions.credentialSetup.map((cred: RequiredCredential)  => `### ${cred.name}\n- **Type**: ${cred.type}\n- **Setup Guide**: [${cred.setupLink}](${cred.setupLink})`).join('\n\n')}

---
*Generated by n8n Workflow Builder*`;
  };

  const generateSetupGuide = (workflow: SavedWorkflow): string => {
    return `# Setup Guide: ${workflow.workflowName}

## Prerequisites
- n8n instance (cloud or self-hosted)
- Admin access to configure credentials
- Access to required third-party services

## Step-by-Step Setup
${workflow.setupInstructions.steps.map((step: string, i: number)  => `### Step ${i + 1}: ${step}\n\nDetailed instructions for this step...`).join('\n\n')}

## Testing Your Workflow
${workflow.setupInstructions.testingGuidance.map((test: string, i: number) => `${i + 1}. ${test}`).join('\n')}

---
*Setup completed? Return to n8n and activate your workflow!*`;
  };

  const generateTroubleshootingGuide = (workflow: SavedWorkflow): string => {
    return `# Troubleshooting Guide: ${workflow.workflowName}

## Common Issues
${workflow.setupInstructions.troubleshooting.map((trouble: string) => `### Issue: ${trouble}\n\n**Solution**: Check the specific configuration mentioned in the error.\n`).join('\n')}

## Integration-Specific Troubleshooting
${workflow.integrations.map(integration => `### ${integration}\n- Check API credentials and permissions\n- Verify service status and rate limits`).join('\n\n')}

---
*Need more help? Check the n8n community at community.n8n.io*`;
  };

  // Refresh Workflows (alias for loadWorkflows with current workspace)
  const refreshWorkflows = useCallback(async (): Promise<void> => {
    return loadWorkflows(workspaceId);
  }, [loadWorkflows, workspaceId]);

  // Clear Errors
  const clearErrors = useCallback(() => {
    setGenerationError(null);
    setLoadError(null);
  }, []);

  // Auto-load workflows on mount and workspace change
  useEffect(() => {
    if (workspaceId) {
      loadWorkflows(workspaceId);
    }
  }, [workspaceId, loadWorkflows]);

  return {
    // Generation
    generateWorkflow,
    isGenerating,
    generationError,
    
    // Workflow Management
    workflows,
    getWorkflow,
    updateWorkflow,
    deleteWorkflow,
    exportWorkflow,
    
    // List Management
    loadWorkflows,
    isLoading,
    loadError,
    
    // State Management
    selectedWorkflow,
    setSelectedWorkflow,
    clearErrors,
    refreshWorkflows,
  };
};

// Additional hook for workflow analytics
export const useN8nWorkflowAnalytics = (userId: string, workspaceId?: string, timeframe: 'week' | 'month' | 'quarter' = 'month') => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would call your analytics endpoint when implemented
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      params.append('timeframe', timeframe);
      
      const url = `/api/n8n-workflow-builder/analytics?${params}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load analytics');
      }

      setAnalytics(data.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics';
      setError(errorMessage);
      console.error('Failed to load workflow analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, timeframe]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refresh: loadAnalytics,
  };
};

// Utility hooks for common operations
export const useWorkflowExport = () => {
  const downloadWorkflow = useCallback((
    workflowName: string, 
    content: string, 
    format: ExportFormat
  ) => {
    const extensions = {
      json: 'json',
      summary: 'md',
      detailed: 'md',
      'setup-guide': 'md',
      'troubleshooting': 'md',
    };

    const extension = extensions[format] || 'txt';
    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : 'text/markdown' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/[^a-zA-Z0-9]/g, '-')}-${format}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success('Copied to clipboard!');
    }).catch(() => {
      message.error('Failed to copy to clipboard');
    });
  }, []);

  return {
    downloadWorkflow,
    copyToClipboard,
  };
};

// Integration Templates Hook
export const useIntegrationTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      // This would load integration templates from your backend or static config
      // For now, return common templates
      const commonTemplates = [
        {
          name: 'Slack Notification',
          integrations: ['Slack'],
          description: 'Send notifications to Slack channels',
          triggerTypes: ['schedule', 'webhook', 'event'],
        },
        {
          name: 'Google Sheets Data Sync',
          integrations: ['Google Sheets', 'Gmail'],
          description: 'Sync data to Google Sheets and send email notifications',
          triggerTypes: ['schedule', 'webhook'],
        },
        {
          name: 'CRM Lead Processing',
          integrations: ['HubSpot', 'Slack', 'Gmail'],
          description: 'Process new leads from CRM and notify team',
          triggerTypes: ['webhook', 'event'],
        },
      ];

      setTemplates(commonTemplates);
    } catch (error) {
      console.error('Failed to load integration templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    isLoading,
    refresh: loadTemplates,
  };
};