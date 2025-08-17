// hooks/useColdEmail.ts - SIMPLIFIED VERSION (matching working pattern)
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

  // ✅ Simplified API call (same as pricing calculator)
  const handleApiCall = async <T>(
    url: string, 
    options: RequestInit,
    errorMessage: string = 'Operation failed'
  ): Promise<T> => {
    try {
      console.log(`Making API call to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      console.log(`API Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorMessage);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || errorMessage);
      }

      return data.data;
    } catch (err) {
      console.error(`API Error for ${url}:`, err);
      throw err;
    }
  };

  const generateEmails = async (input: ColdEmailGenerationInput): Promise<GeneratedEmail[]> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Generating emails with input:', input);
      
      const response = await handleApiCall<{
        generationId: string;
        emails: GeneratedEmail[];
      }>(
        '/api/cold-email',
        {
          method: 'POST',
          body: JSON.stringify(input)
        },
        'Failed to generate emails'
      );

      console.log('✅ Received response from API:', response);
      console.log('✅ Response has emails:', !!response.emails);
      console.log('✅ Email count:', response.emails?.length || 0);

      // ✅ Extract emails from the nested response structure
      const emails = response.emails || [];
      
      if (emails.length === 0) {
        throw new Error('No emails were generated');
      }

      message.success('Emails generated successfully!');
      return emails;
    } catch (err) {
      console.error('❌ Generate emails error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      message.error(errorMessage);
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
      console.log('Optimizing email:', { emailContent: emailContent.substring(0, 100), optimizationType });
      
      const data = await handleApiCall<string>(
        '/api/cold-email/optimize',
        {
          method: 'POST',
          body: JSON.stringify({ emailContent, optimizationType })
        },
        'Optimization failed'
      );

      message.success('Email optimized successfully!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimization failed';
      message.error(errorMessage);
      throw new Error(errorMessage);
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

      const url = `/api/cold-email/templates${params.toString() ? `?${params.toString()}` : ''}`;
      
      return await handleApiCall<EmailTemplate[]>(
        url,
        { method: 'GET' },
        'Failed to fetch templates'
      );
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
      const data = await handleApiCall<EmailTemplate>(
        '/api/cold-email/templates',
        {
          method: 'POST',
          body: JSON.stringify(templateData)
        },
        'Failed to create template'
      );

      message.success('Template created successfully!');
      return data;
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
      const data = await handleApiCall<EmailTemplate>(
        `/api/cold-email/templates/${templateId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData)
        },
        'Failed to update template'
      );

      message.success('Template updated successfully!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      message.error(errorMessage);
      throw err;
    }
  };

  const deleteTemplate = async (templateId: string): Promise<void> => {
    try {
      await handleApiCall<void>(
        `/api/cold-email/templates/${templateId}`,
        { method: 'DELETE' },
        'Failed to delete template'
      );

      message.success('Template deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      message.error(errorMessage);
      throw err;
    }
  };

  const getEmailGenerations = async (workspaceId?: string): Promise<any[]> => {
    try {
      const params = new URLSearchParams();
      if (workspaceId) params.set('workspaceId', workspaceId);

      const url = `/api/cold-email${params.toString() ? `?${params.toString()}` : ''}`;
      
      return await handleApiCall<any[]>(
        url,
        { method: 'GET' },
        'Failed to fetch email generations'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch email generations';
      message.error(errorMessage);
      throw err;
    }
  };

  const getEmailGeneration = async (generationId: string): Promise<any> => {
    try {
      return await handleApiCall<any>(
        `/api/cold-email/${generationId}`,
        { method: 'GET' },
        'Failed to fetch email generation'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch email generation';
      message.error(errorMessage);
      throw err;
    }
  };

  const deleteEmailGeneration = async (generationId: string): Promise<void> => {
    try {
      await handleApiCall<void>(
        `/api/cold-email/${generationId}`,
        { method: 'DELETE' },
        'Failed to delete email generation'
      );

      message.success('Email generation deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete email generation';
      message.error(errorMessage);
      throw err;
    }
  };

  const getTemplate = async (templateId: string): Promise<EmailTemplate> => {
    try {
      return await handleApiCall<EmailTemplate>(
        `/api/cold-email/templates/${templateId}`,
        { method: 'GET' },
        'Failed to fetch template'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch template';
      message.error(errorMessage);
      throw err;
    }
  };

  const analyzeEmail = async (emailContent: string): Promise<any> => {
    try {
      const data = await handleApiCall<any>(
        '/api/cold-email/analyze',
        {
          method: 'POST',
          body: JSON.stringify({ emailContent })
        },
        'Failed to analyze email'
      );

      message.success('Email analyzed successfully!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze email';
      message.error(errorMessage);
      throw err;
    }
  };

  const generateFollowUps = async (
    originalEmail: string,
    count: number = 3,
    strategy: 'value' | 'urgency' | 'social' = 'value'
  ): Promise<GeneratedEmail[]> => {
    try {
      const data = await handleApiCall<GeneratedEmail[]>(
        '/api/cold-email/follow-ups',
        {
          method: 'POST',
          body: JSON.stringify({ originalEmail, count, strategy })
        },
        'Failed to generate follow-ups'
      );

      message.success('Follow-ups generated successfully!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate follow-ups';
      message.error(errorMessage);
      throw err;
    }
  };

  const getEmailMetrics = async (generationId: string): Promise<any> => {
    try {
      return await handleApiCall<any>(
        `/api/cold-email/${generationId}/metrics`,
        { method: 'GET' },
        'Failed to fetch email metrics'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch email metrics';
      message.error(errorMessage);
      throw err;
    }
  };

  const bulkOptimizeEmails = async (
    emails: string[],
    optimizationType: ColdEmailOptimizationType
  ): Promise<string[]> => {
    try {
      const data = await handleApiCall<string[]>(
        '/api/cold-email/bulk-optimize',
        {
          method: 'POST',
          body: JSON.stringify({ emails, optimizationType })
        },
        'Failed to bulk optimize emails'
      );

      message.success('Emails optimized successfully!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk optimize emails';
      message.error(errorMessage);
      throw err;
    }
  };

  const exportEmails = async (
    generationId: string,
    format: 'csv' | 'json' | 'txt' = 'csv'
  ): Promise<Blob> => {
    try {
      const response = await fetch(`/api/cold-email/${generationId}/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export emails');
      }

      const blob = await response.blob();
      message.success('Emails exported successfully!');
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export emails';
      message.error(errorMessage);
      throw err;
    }
  };

  const validateEmail = async (emailContent: string): Promise<any> => {
    try {
      const data = await handleApiCall<any>(
        '/api/cold-email/validate',
        {
          method: 'POST',
          body: JSON.stringify({ emailContent })
        },
        'Failed to validate email'
      );

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate email';
      message.error(errorMessage);
      throw err;
    }
  };

  const getUsageStats = async (): Promise<any> => {
    try {
      return await handleApiCall<any>(
        '/api/cold-email/usage',
        { method: 'GET' },
        'Failed to fetch usage stats'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage stats';
      message.error(errorMessage);
      throw err;
    }
  };

  return {
    // Core functions
    generateEmails,
    optimizeEmail,
    
    // Template management
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    
    // Email generation management
    getEmailGenerations,
    getEmailGeneration,
    deleteEmailGeneration,
    
    // Advanced features
    analyzeEmail,
    generateFollowUps,
    getEmailMetrics,
    bulkOptimizeEmails,
    exportEmails,
    validateEmail,
    getUsageStats,
    
    // State
    loading,
    error,
    setError
  };
}