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

  // Helper function to handle common API patterns
  const handleApiCall = async <T>(
    url: string, 
    options: RequestInit,
    errorMessage: string = 'Operation failed'
  ): Promise<T> => {
    try {
      console.log(`Making API call to: ${url}`); // Debug log
      
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // ✅ Ensure cookies are included
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      console.log(`API Response status: ${response.status}`); // Debug log

      const result = await response.json();
      console.log('API Response:', result); // Debug log
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (response.status === 429) {
          throw new Error(result.error || 'Rate limit exceeded. Please try again later.');
        }
        throw new Error(result.error || errorMessage);
      }

      if (!result.success) {
        throw new Error(result.error || errorMessage);
      }

      return result.data;
    } catch (err) {
      console.error(`API Error for ${url}:`, err); // Debug log
      throw err;
    }
  };

  const generateEmails = async (input: ColdEmailGenerationInput): Promise<GeneratedEmail[]> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Generating emails with input:', input); // Debug log
      
      const data = await handleApiCall<GeneratedEmail[]>(
        '/api/cold-email',
        {
          method: 'POST',
          body: JSON.stringify(input)
        },
        'Failed to generate emails'
      );

      message.success('Emails generated successfully!');
      return data;
    } catch (err) {
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
      console.log('Optimizing email:', { emailContent: emailContent.substring(0, 100), optimizationType }); // Debug log
      
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