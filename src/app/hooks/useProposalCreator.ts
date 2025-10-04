// hooks/useProposalCreator.ts - SIMPLIFIED VERSION

import { useState, useCallback } from 'react';
import { message } from 'antd';
import {
  ProposalInput,
  ProposalPackage,
  SavedProposal,
  ApiResponse,
  ApiResponseOptional
} from '../../types/proposalCreator';
import { useWorkspaceContext } from './useWorkspaceContext';

// ============================================================================
// MAIN PROPOSAL CREATOR HOOK
// ============================================================================
export const useProposalCreator = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspaceContext();

  const generateProposal = useCallback(async (input: ProposalInput): Promise<{
    proposalId: string;
    proposal: ProposalPackage;
  } | null> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    setGenerating(true);
    setError(null);
    
    try {
      console.log('🚀 Sending proposal generation request...');

      // Validate essential fields only
      if (!input.clientInfo?.legalName?.trim()) {
        throw new Error('Client name is required');
      }
      if (!input.projectScope?.description || input.projectScope.description.length < 20) {
        throw new Error('Project description is required (minimum 20 characters)');
      }
      if (!input.serviceProvider?.name?.trim()) {
        throw new Error('Service provider name is required');
      }

      const requestBody = {
        serviceProvider: input.serviceProvider,
        clientInfo: input.clientInfo,
        projectScope: input.projectScope,
        effectiveDate: input.effectiveDate,
        workspaceId: currentWorkspace.id
      };

      const response = await fetch('/api/proposal-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json() as ApiResponseOptional<ProposalPackage>;

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Generation failed');
      }

      message.success('Proposal generated successfully!');

      return {
        proposalId: data.meta?.proposalId || 'temp-id',
        proposal: data.data
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('💥 Generation error:', err);
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setGenerating(false);
    }
  }, [currentWorkspace]);

  return {
    generating,
    error,
    generateProposal,
    setError
  };
};

// ============================================================================
// PROPOSAL VALIDATION HOOK - SIMPLIFIED
// ============================================================================
export const useProposalValidation = () => {
  const validateProposalProgressive = useCallback((
    input: Partial<ProposalInput>, 
    showAllErrors = false
  ) => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // Only 3 essential fields
    const essentialFields = [
      () => input.clientInfo?.legalName && input.clientInfo.legalName.trim().length >= 2,
      () => input.projectScope?.description && input.projectScope.description.trim().length >= 20,
      () => input.serviceProvider?.name && input.serviceProvider.name.trim().length >= 2
    ];

    const completedEssential = essentialFields.filter(field => field()).length;

    // Critical blocking errors
    if (!input.clientInfo?.legalName || input.clientInfo.legalName.trim().length < 2) {
      errors['clientInfo.legalName'] = 'Client legal name is required (minimum 2 characters)';
    }
    if (!input.projectScope?.description || input.projectScope.description.trim().length < 20) {
      errors['projectScope.description'] = 'Project description required (minimum 20 characters)';
    }
    if (!input.serviceProvider?.name || input.serviceProvider.name.trim().length < 2) {
      errors['serviceProvider.name'] = 'Service provider name is required';
    }

    // Friendly suggestions
    if (!input.serviceProvider?.address) {
      warnings['serviceProvider.address'] = 'Adding address improves professionalism';
    }
    if (!input.clientInfo?.address) {
      warnings['clientInfo.address'] = 'Adding client address improves completeness';
    }
    if (!input.serviceProvider?.signatoryName) {
      warnings['serviceProvider.signatory'] = 'Signatory details help with legal execution';
    }

    const completionPercentage = Math.round((completedEssential / 3) * 100);
    const isReadyToGenerate = Object.keys(errors).length === 0 && completedEssential === 3;

    return {
      isValid: completedEssential === 3 && Object.keys(errors).length === 0,
      isReadyToGenerate,
      errors,
      warnings,
      completionPercentage,
      completedFields: completedEssential,
      totalRequiredFields: 3,
      missingCriticalFields: Object.keys(errors)
    };
  }, []);

  return { validateProposalProgressive };
};

// ============================================================================
// SAVED PROPOSALS HOOK
// ============================================================================
export const useSavedProposals = () => {
  const [proposals, setProposals] = useState<SavedProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspaceContext();

  const fetchProposals = useCallback(async () => {
    if (!currentWorkspace) {
      console.log('No current workspace');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('workspaceId', currentWorkspace.id);
      
      const url = `/api/proposal-creator?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch proposals: ${response.status}`);
      }

      const data = await response.json() as ApiResponseOptional<SavedProposal[]>;
      
      if (data.success && data.data) {
        setProposals(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch proposals');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  const getProposal = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/proposal-creator/${proposalId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch proposal');
      }

      const data = await response.json() as ApiResponseOptional<any>;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch proposal');
      }

      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProposal = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/proposal-creator/${proposalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete proposal');
      }

      const data = await response.json() as ApiResponse<{ deleted: boolean }>;
      
      if (!data.success || !data.data?.deleted) {
        throw new Error('Delete operation failed');
      }

      setProposals(prev => prev.filter(proposal => proposal.id !== proposalId));
      message.success('Proposal deleted successfully');
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    proposals,
    loading,
    error,
    fetchProposals,
    getProposal,
    deleteProposal,
    setError
  };
};

// ============================================================================
// PROPOSAL EXPORT HOOK
// ============================================================================
export const useProposalExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportProposal = useCallback(async (
    proposalId: string, 
    format: 'json' | 'html' | 'pdf' = 'html'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      if (format === 'html') {
        // Open HTML directly in new tab
        const url = `/api/proposal-creator/${proposalId}/export?format=html`;
        window.open(url, '_blank');
        message.success('Proposal opened in new tab!');
        return true;
      } else if (format === 'json') {
        // Download JSON
        const response = await fetch(`/api/proposal-creator/${proposalId}/export?format=json`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Export failed');
        }

        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.meta.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        message.success('JSON exported successfully');
        return true;
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    exportProposal,
    setError
  };
};