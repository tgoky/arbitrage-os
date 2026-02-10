// hooks/useColdEmail.ts - SIMPLIFIED VERSION (matching working pattern)
import { useState, useCallback } from 'react';
import { message } from 'antd';
import { 
  ColdEmailGenerationInput, 
  GeneratedEmail, 
  EmailTemplate, 
  ColdEmailOptimizationType 
} from '@/types/coldEmail';

import { useWorkspaceContext } from '../hooks/useWorkspaceContext';


export function useColdEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const { currentWorkspace } = useWorkspaceContext(); // ADD THIS

  // ✅ Simplified API call (same as pricing calculator)
// ✅ Enhanced handleApiCall with token refresh and better auth handling
const handleApiCall = async <T>(
  url: string, 
  options: RequestInit,
  errorMessage: string = 'Operation failed'
): Promise<T> => {
  try {
    console.log(`🚀 handleApiCall starting for: ${url}`);
    console.log(`🚀 Method: ${options.method}`);
    console.log(`🚀 Body preview:`, options.body?.toString().substring(0, 200));
    
    // ✅ Add Supabase client and token refresh
    let authHeaders = {};
    
    try {
      console.log('🔐 Setting up authentication...');
      const { supabaseBrowserClient } = await import('@/utils/supabase/client');

      console.log('🔐 Getting session...');
      const { data: { session }, error: sessionError } = await supabaseBrowserClient.auth.getSession();
      
      if (sessionError) {
        console.warn('⚠️ Session error:', sessionError);
      }
      
      if (session?.access_token) {
        authHeaders = {
          'Authorization': `Bearer ${session.access_token}`
        };
        console.log('✅ Added auth token');
      } else {
        console.warn('⚠️ No active session found');
      }
    } catch (authError) {
      console.warn('⚠️ Auth setup failed:', authError);
    }
    
    console.log('🌐 Making fetch request...');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers
      }
    });

    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response ok: ${response.ok}`);

    if (!response.ok) {
      console.error('❌ Response not ok');
      
      let errorData;
      try {
        const errorText = await response.text();
        console.log('📄 Error response text:', errorText);
        
        try {
          errorData = JSON.parse(errorText);
          console.log('📄 Parsed error:', errorData);
        } catch (parseError) {
          errorData = { error: errorText };
        }
      } catch (readError) {
        console.error('❌ Could not read error response:', readError);
        errorData = { error: 'Unknown error' };
      }
      
      if (response.status === 401) {
        throw new Error('Session expired. Please refresh the page and sign in again.');
      }
      
      throw new Error(errorData.error || errorMessage);
    }

    console.log('📄 Parsing response...');
    let data;
    try {
      const responseText = await response.text();
      console.log('📄 Response text length:', responseText.length);
      console.log('📄 Response preview:', responseText.substring(0, 500));
      
      data = JSON.parse(responseText);
      console.log('📄 Parsed data keys:', Object.keys(data));
      console.log('📄 Success flag:', data.success);
    } catch (parseError) {
      console.error('❌ Parse error:', parseError);
      throw new Error('Invalid response format from server');
    }
    
    if (!data.success) {
      console.error('❌ API returned success: false');
      console.error('❌ Error from API:', data.error);
      throw new Error(data.error || errorMessage);
    }

    console.log('✅ API call successful');
    console.log('✅ Returning data:', data.data);
    return data.data;
  } catch (err) {
    console.error(`💥 handleApiCall error:`, err);
    throw err;
  }
};

const generateEmails = useCallback(async (input: ColdEmailGenerationInput): Promise<GeneratedEmail[]> => {
  
   if (!currentWorkspace) {
      throw new Error('No workspace selected. Please access the cold email writer from within a workspace.');
    }
  
  
  setLoading(true);
  setError(null);
  
  try {
    console.log('🚀 generateEmails called with input:', input);
    console.log('🚀 Input keys:', Object.keys(input));
    console.log('🚀 Input firstName:', input.firstName);
    console.log('🚀 Input method:', input.method);
    // MODIFY REQUEST TO INCLUDE WORKSPACE ID
      const requestData = {
        ...input,
        workspaceId: currentWorkspace.id
      };
    
    const response = await handleApiCall<{
      generationId: string;
      emails: GeneratedEmail[];
    }>(
      '/api/cold-email',
      {
        method: 'POST',
         body: JSON.stringify(requestData) // Use modified data
      },
      'Failed to generate emails'
    );

    console.log('✅ handleApiCall returned successfully');
    console.log('✅ Response type:', typeof response);
    console.log('✅ Response:', response);
    console.log('✅ Response has emails:', !!response.emails);
    console.log('✅ Email count:', response.emails?.length || 0);

    // ✅ Extract emails from the nested response structure
    const emails = response.emails || [];
    
    if (emails.length === 0) {
      console.error('❌ No emails in response');
      throw new Error('No emails were generated');
    }

    console.log('✅ About to return emails:', emails);
    message.success('Emails generated successfully!');
    return emails;
  } catch (err) {
    console.error('❌ Generate emails error:', err);
    console.error('❌ Error type:', typeof err);
    console.error('❌ Error instanceof Error:', err instanceof Error);
    
    const errorMessage = err instanceof Error ? err.message : 'Generation failed';
    console.error('❌ Final error message:', errorMessage);
    
    setError(errorMessage);
    message.error(errorMessage);
    throw err;
  } finally {
    setLoading(false);
  }
}, [currentWorkspace]);


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
    
    // ADDED: Include current workspace ID
    if (currentWorkspace?.id) {
      params.set('workspaceId', currentWorkspace.id);
    }

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
    // ADDED: Include workspace ID in request body
    const requestData = {
      ...templateData,
      workspaceId: currentWorkspace?.id
    };
    
    const data = await handleApiCall<EmailTemplate>(
      '/api/cold-email/templates',
      {
        method: 'POST',
        body: JSON.stringify(requestData)
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
    const params = new URLSearchParams();
    if (currentWorkspace?.id) {
      params.set('workspaceId', currentWorkspace.id);
    }

    const url = `/api/cold-email/${generationId}${params.toString() ? `?${params.toString()}` : ''}`;
    
    return await handleApiCall<any>(
      url,
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