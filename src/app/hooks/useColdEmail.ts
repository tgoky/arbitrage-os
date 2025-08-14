// hooks/useColdEmail.ts
import { useState } from 'react';
import { message } from 'antd';
import { 
  ColdEmailGenerationInput, 
  GeneratedEmail, 
  EmailTemplate, 
  ColdEmailOptimizationType 
} from '@/types/coldEmail';

export function useColdEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateEmails = async (input: ColdEmailGenerationInput): Promise<GeneratedEmail[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cold-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate emails');
      }

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const optimizeEmail = async (
    emailContent: string, 
    optimizationType: ColdEmailOptimizationType
  ): Promise<string> => {
    try {
      const response = await fetch('/api/cold-email/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent, optimizationType })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Optimization failed');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimization failed';
      message.error(errorMessage);
      throw err;
    }
  };

  const getTemplates = async (options?: {
    category?: 'outreach' | 'follow_up' | 'introduction' | 'meeting' | 'demo';
    includePublic?: boolean;
  }): Promise<EmailTemplate[]> => {
    try {
      const params = new URLSearchParams();
      if (options?.category) params.set('category', options.category);
      if (options?.includePublic) params.set('includePublic', 'true');

      const response = await fetch(`/api/cold-email/templates?${params.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch templates');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      message.error(errorMessage);
      throw err;
    }
  };

  const createTemplate = async (templateData: {
    name: string;
    description?: string;
    subject: string;
    body: string;
    category: 'outreach' | 'follow_up' | 'introduction' | 'meeting' | 'demo';
    tags?: string[];
    variables?: string[];
    isPublic?: boolean;
  }): Promise<EmailTemplate> => {
    try {
      const response = await fetch('/api/cold-email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create template');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      message.error(errorMessage);
      throw err;
    }
  };

  const updateTemplate = async (
    templateId: string, 
    updateData: Partial<{
      name: string;
      description?: string;
      subject: string;
      body: string;
      category: 'outreach' | 'follow_up' | 'introduction' | 'meeting' | 'demo';
      tags?: string[];
      variables?: string[];
      isPublic?: boolean;
    }>
  ): Promise<EmailTemplate> => {
    try {
      const response = await fetch(`/api/cold-email/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update template');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      message.error(errorMessage);
      throw err;
    }
  };

  const deleteTemplate = async (templateId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/cold-email/templates/${templateId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete template');
      }

      message.success('Template deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      message.error(errorMessage);
      throw err;
    }
  };

  return {
    generateEmails,
    optimizeEmail,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    loading,
    error,
    setError
  };
}