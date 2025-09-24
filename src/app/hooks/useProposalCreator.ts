// hooks/useProposalCreator.ts - COMPLETE UPDATED VERSION for intelligent placeholders

import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import {
  ProposalInput,
  ProposalPackage,
  SavedProposal,
  ProposalValidationResult,
  ApiResponse,
  ApiResponseOptional,
  ProposalType,
  IndustryType
} from '../../types/proposalCreator';
import { useWorkspaceContext } from './useWorkspaceContext';

export type {
  ProposalInput,
  ProposalPackage,
  SavedProposal,
  ProposalValidationResult
};

// ============================================================================
// MAIN PROPOSAL CREATOR HOOK
// ============================================================================
export const useProposalCreator = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspaceContext();

  const generateProposal = useCallback(async (input: ProposalInput): Promise<{
    proposalId: string;
    proposal: ProposalPackage;
  } | null> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected. Please access the proposal creator from within a workspace.');
    }

    setGenerating(true);
    setError(null);
    
    try {
      console.log('🚀 Sending proposal generation request...', input);

      // **UPDATED: Only check the absolute essentials (let API handle placeholders)**
      if (!input.client?.legalName || input.client.legalName.length < 2) {
        throw new Error('Client name is required (minimum 2 characters)');
      }
      
      if (!input.project?.description || input.project.description.length < 20) {
        throw new Error('Project description is required (minimum 20 characters)');
      }
      
      if (!input.pricing?.totalAmount || input.pricing.totalAmount < 100) {
        throw new Error('Project amount must be at least $100');
      }

      // **UPDATED: Send the raw input - API will handle placeholders**
      const requestBody = {
        proposalType: input.proposalType || 'service-agreement',
        client: input.client,
        serviceProvider: input.serviceProvider,
        project: input.project,
        pricing: input.pricing,
        terms: input.terms,
        customizations: input.customizations,
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

        // **UPDATED: Better error message handling**
        if (errorData.details && Array.isArray(errorData.details)) {
          const criticalErrors = errorData.details.filter((detail: any) => detail.userFriendly || detail.critical);
          if (criticalErrors.length > 0) {
            throw new Error(errorData.error || 'Please check the required fields and try again.');
          }
        }

        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json() as ApiResponseOptional<ProposalPackage>;

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      if (!data.data) {
        throw new Error('No proposal data received from server');
      }

      // **UPDATED: Show different message based on whether placeholders were used**
      if (data.meta?.appliedPlaceholders) {
        message.success('Proposal generated with placeholders! Review and customize before sending.');
      } else {
        message.success('Proposal generated successfully!');
      }

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

  // **UPDATED: Placeholder-aware insights**
  const getProposalInsights = useCallback((input: ProposalInput) => {
    const insights = {
      strengths: [] as string[],
      weaknesses: [] as string[],
      recommendations: [] as string[]
    };

    // Analyze project complexity
    const deliverableCount = input.project.deliverables?.length || 0;
    const milestoneCount = input.project.milestones?.length || 0;
    
    if (deliverableCount >= 5 && milestoneCount >= 3) {
      insights.strengths.push('Well-structured project with comprehensive deliverables');
    } else if (deliverableCount < 3) {
      insights.weaknesses.push('Consider adding more detailed deliverables');
      insights.recommendations.push('Break down major deliverables into smaller, measurable components');
    }

    // **NEW: Check for placeholders in key fields**
    if (input.client?.address?.includes('[') || input.serviceProvider?.address?.includes('[')) {
      insights.recommendations.push('Complete address information for professional contracts');
    }

    if (input.serviceProvider?.signatoryName?.includes('[') || input.client?.signatoryName?.includes('[')) {
      insights.recommendations.push('Add authorized signatory names for legal validity');
    }

    if (input.terms?.governingLaw?.includes('[') || !input.terms?.governingLaw) {
      insights.recommendations.push('Specify governing law based on your business location');
    }

    // Analyze pricing structure
    if (input.pricing.model === 'milestone-based' && milestoneCount >= 3) {
      insights.strengths.push('Milestone-based pricing aligned with project structure');
    } else if (input.pricing.model === 'milestone-based' && milestoneCount < 3) {
      insights.recommendations.push('Add more milestones to support milestone-based pricing');
    }
    
    // **UPDATED: Safer payment schedule analysis**
    if (input.pricing.paymentSchedule && input.pricing.paymentSchedule.length > 0) {
      const firstPayment = input.pricing.paymentSchedule[0];
      if (firstPayment && !firstPayment.description?.includes('[')) {
        const upfrontPercentage = firstPayment.amount / input.pricing.totalAmount;
        if (upfrontPercentage >= 0.3) {
          insights.strengths.push('Healthy upfront payment reduces risk');
        } else if (upfrontPercentage < 0.2) {
          insights.weaknesses.push('Low upfront payment may create cash flow risk');
          insights.recommendations.push('Consider negotiating higher upfront payment');
        }
      }
    } else {
      insights.recommendations.push('Payment schedule will be auto-generated with balanced terms');
    }

    // Industry-specific insights
    if (input.client.industry === 'technology' && input.pricing.totalAmount > 50000) {
      insights.strengths.push('Good positioning for technology sector engagement');
    }

    return insights;
  }, []);

  return {
    loading,
    generating,
    error,
    generateProposal,
    getProposalInsights,
    setError
  };
};

// ============================================================================
// PROPOSAL VALIDATION HOOK - ULTRA RELAXED
// ============================================================================
export const useProposalValidation = () => {
  const validateProposalProgressive = useCallback((
    input: Partial<ProposalInput>, 
    showAllErrors = false
  ): ProposalValidationResult => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // **UPDATED: Only 3 essential fields**
    const essentialFields = [
      () => input.client?.legalName && input.client.legalName.length >= 2,
      () => input.project?.description && input.project.description.length >= 20,
      () => input.pricing?.totalAmount && input.pricing.totalAmount >= 100
    ];

    const completedEssential = essentialFields.filter(field => field()).length;
    const totalEssential = essentialFields.length;

    // **UPDATED: Only critical blocking errors**
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

    // **UPDATED: Everything else is just friendly suggestions**
    if (!input.client?.address) {
      warnings['client.address'] = 'Client address will improve contract professionalism';
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

    if (!input.terms?.governingLaw) {
      warnings['terms.governingLaw'] = 'Consider specifying governing law for your contracts';
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
  }, []);

  // **UPDATED: Safer pricing metrics calculation**
  const calculatePricingMetrics = useCallback((input: ProposalInput) => {
    const totalAmount = input.pricing.totalAmount;
    const deliverableCount = Math.max(input.project.deliverables?.length || 1, 1);
    
    const parseTimelineToWeeks = (timeline: string): number => {
      if (!timeline || timeline.includes('[')) return 0; // Handle placeholders
      
      const match = timeline.match(/(\d+)\s*(week|month|day)/i);
      if (!match) return 0;
      
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      switch (unit) {
        case 'day': return value / 7;
        case 'week': return value;
        case 'month': return value * 4;
        default: return value;
      }
    };
    
    const timelineWeeks = parseTimelineToWeeks(input.project.timeline || '');
    
    // **UPDATED: Handle placeholder payment schedules**
    let upfrontPercentage = 0;
    if (input.pricing.paymentSchedule && input.pricing.paymentSchedule.length > 0) {
      const firstPayment = input.pricing.paymentSchedule[0];
      if (firstPayment && !firstPayment.description?.includes('[')) {
        upfrontPercentage = Math.round((firstPayment.amount / totalAmount) * 100);
      }
    }
    
    return {
      pricePerDeliverable: Math.round(totalAmount / deliverableCount),
      weeklyRate: timelineWeeks ? Math.round(totalAmount / timelineWeeks) : 0,
      upfrontPercentage,
      recommendations: {
        pricePerDeliverable: totalAmount / deliverableCount > 10000 ? 
          'High value per deliverable - ensure detailed specifications' :
          totalAmount / deliverableCount < 1000 ?
          'Consider bundling deliverables for better pricing' :
          'Good balance of value per deliverable',
        paymentStructure: input.pricing.paymentSchedule?.length >= 3 ?
          'Good payment milestone distribution' :
          'Payment schedule will be optimized if not specified'
      }
    };
  }, []);

  return {
    validateProposalProgressive,
    calculatePricingMetrics
  };
};

// ============================================================================
// SAVED PROPOSALS HOOK - UNCHANGED
// ============================================================================
export const useSavedProposals = () => {
  const [proposals, setProposals] = useState<SavedProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspaceContext();

  const fetchProposals = useCallback(async (
    proposalType?: ProposalType, 
    clientIndustry?: IndustryType
  ) => {
    if (!currentWorkspace) {
      console.log('No current workspace, skipping proposals fetch');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('workspaceId', currentWorkspace.id);
      if (proposalType) params.append('proposalType', proposalType);
      if (clientIndustry) params.append('clientIndustry', clientIndustry);
      
      const url = `/api/proposal-creator${params.toString() ? `?${params.toString()}` : ''}`;
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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
        throw new Error(errorData.error || `Failed to fetch proposal: ${response.status}`);
      }

      const data = await response.json() as ApiResponseOptional<any>;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch proposal');
      }

      if (!data.data) {
        throw new Error('Proposal not found');
      }

      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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
      
      if (!data.success) {
        throw new Error('Failed to delete proposal');
      }

      if (!data.data?.deleted) {
        throw new Error('Delete operation failed');
      }

      setProposals(prev => prev.filter(proposal => proposal.id !== proposalId));
      message.success('Proposal deleted successfully');
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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
// PROPOSAL EXPORT HOOK - UNCHANGED
// ============================================================================
export const useProposalExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    try {
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
    } finally {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const exportProposal = useCallback(async (
    proposalId: string, 
    format: 'json' | 'html' | 'pdf' = 'html'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/proposal-creator/${proposalId}/export?format=${format}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export proposal');
      }

      if (format === 'html' || format === 'pdf') {
        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch?.[1] || `proposal-${proposalId}.${format}`;

        const blob = await response.blob();
        downloadFile(blob, filename);
        message.success(`Proposal exported as ${format.toUpperCase()} successfully`);
        return true;
      } else {
        const data = await response.json() as ApiResponseOptional<any>;
        if (data.success && data.data) {
          return data.data;
        } else {
          throw new Error(data.error || 'Export failed');
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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

// ============================================================================
// PROPOSAL TEMPLATES HOOK - UNCHANGED
// ============================================================================
export const useProposalTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getIndustryTemplates = useCallback((industry: IndustryType) => {
    const industryTemplates: Record<IndustryType, Array<{
      id: string;
      name: string;
      description: string;
      proposalType: ProposalType;
    }>> = {
      technology: [
        {
          id: 'tech-software-dev',
          name: 'Software Development Project',
          description: 'Template for custom software development projects',
          proposalType: 'project-proposal' as ProposalType
        },
        {
          id: 'tech-consulting',
          name: 'Technology Consulting',
          description: 'Template for technology advisory services',
          proposalType: 'consulting-proposal' as ProposalType
        }
      ],
      marketing: [
        {
          id: 'marketing-campaign',
          name: 'Marketing Campaign',
          description: 'Template for marketing campaign projects',
          proposalType: 'project-proposal' as ProposalType
        },
        {
          id: 'marketing-retainer',
          name: 'Marketing Retainer',
          description: 'Template for ongoing marketing services',
          proposalType: 'retainer-agreement' as ProposalType
        }
      ],
      consulting: [
        {
          id: 'strategy-consulting',
          name: 'Strategy Consulting',
          description: 'Template for strategic consulting engagements',
          proposalType: 'consulting-proposal' as ProposalType
        }
      ],
      healthcare: [
        {
          id: 'healthcare-consulting',
          name: 'Healthcare Consulting',
          description: 'Template for healthcare consulting services',
          proposalType: 'consulting-proposal' as ProposalType
        }
      ],
      finance: [
        {
          id: 'financial-advisory',
          name: 'Financial Advisory',
          description: 'Template for financial advisory services',
          proposalType: 'consulting-proposal' as ProposalType
        }
      ],
      ecommerce: [
        {
          id: 'ecommerce-development',
          name: 'E-commerce Development',
          description: 'Template for e-commerce platform development',
          proposalType: 'project-proposal' as ProposalType
        }
      ],
      manufacturing: [
        {
          id: 'manufacturing-consulting',
          name: 'Manufacturing Consulting',
          description: 'Template for manufacturing process consulting',
          proposalType: 'consulting-proposal' as ProposalType
        }
      ],
      'real-estate': [
        {
          id: 'real-estate-consulting',
          name: 'Real Estate Consulting',
          description: 'Template for real estate consulting services',
          proposalType: 'consulting-proposal' as ProposalType
        }
      ],
      education: [
        {
          id: 'education-consulting',
          name: 'Education Consulting',
          description: 'Template for educational consulting services',
          proposalType: 'consulting-proposal' as ProposalType
        }
      ],
      other: [
        {
          id: 'general-consulting',
          name: 'General Consulting',
          description: 'Template for general consulting services',
          proposalType: 'consulting-proposal' as ProposalType
        }
      ]
    };

    return industryTemplates[industry] || industryTemplates.other;
  }, []);

  return {
    templates,
    loading,
    getIndustryTemplates
  };
};