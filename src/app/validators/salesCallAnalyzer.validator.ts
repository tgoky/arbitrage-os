// validators/salesCallAnalyzer.validator.ts
import { z } from 'zod';

const salesCallInputSchema = z.object({
  // Basic Call Information
  title: z.string()
    .min(1, 'Call title is required')
    .max(255, 'Title is too long'),
  
  callType: z.enum(['discovery', 'interview', 'sales', 'podcast'], {
    message: 'Call type is required'
  }),

  scheduledDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  actualDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  
  // Recording/Transcript Input
  transcript: z.string()
    .min(50, 'Transcript must be at least 50 characters for meaningful analysis')
    .max(100000, 'Transcript is too long'),
  
  // Prospect Information
  prospectName: z.string()
    .max(100, 'Prospect name is too long')
    .optional(),
  
  prospectTitle: z.string()
    .max(100, 'Prospect title is too long')
    .optional(),
  
  prospectEmail: z.string()
    .email('Invalid email format')
    .or(z.literal(''))
    .optional(),

  prospectLinkedin: z.string()
    .url('Invalid LinkedIn URL')
    .or(z.literal(''))
    .optional(),
  
  // Company Information
  companyName: z.string()
    .max(100, 'Company name is too long')
    .optional(),
  
  companyWebsite: z.string()
    .url('Invalid website URL')
    .or(z.literal(''))
    .optional(),
  
  companyIndustry: z.string()
    .max(50, 'Industry name is too long')
    .optional(),
  
  companyHeadcount: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .optional(),
  
  companyRevenue: z.enum(['0-1M', '1M-10M', '10M-50M', '50M-100M', '100M+'])
    .optional(),
  
  companyLocation: z.string()
    .max(100, 'Location is too long')
    .optional(),
  
  companyLinkedin: z.string()
    .url('Invalid LinkedIn URL')
    .or(z.literal(''))
    .optional(),
  
  // Additional Context
  additionalContext: z.string()
    .max(2000, 'Additional context is too long')
    .optional(),
  
  specificQuestions: z.array(z.string().max(200))
    .max(10, 'Too many specific questions')
    .optional(),
  
  analysisGoals: z.array(z.string().max(100))
    .max(5, 'Too many analysis goals')
    .optional()
});


export function validateSalesCallInput(data: any, partial = false): 
  | { success: true; data: z.infer<typeof salesCallInputSchema> }
  | { success: false; errors: any[] } {
  
  console.log('🔍 Validating sales call input...');
  console.log('📦 Input keys:', Object.keys(data || {}));
  console.log('📦 Has transcript:', !!data?.transcript);
  console.log('📦 Transcript length:', data?.transcript?.length);
  console.log('📦 Call type:', data?.callType);
  console.log('📦 Has title:', !!data?.title);
  console.log('📦 Partial validation:', partial);
  
  try {
    const schema = partial ? salesCallInputSchema.partial() : salesCallInputSchema;
    
    console.log('🔍 Running Zod validation...');
    const validated = schema.parse(data);
    
    console.log('✅ Validation passed');
    console.log('✅ Validated data keys:', Object.keys(validated));
    
    // ✅ FIX: Safe transcript length logging
    if (validated.transcript) {
      console.log('✅ Validated transcript length:', validated.transcript.length);
    } else {
      console.log('⚠️ No transcript in validated data (partial mode)');
    }
    
    return { 
      success: true, 
      data: validated as z.infer<typeof salesCallInputSchema> 
    };
    
  } catch (error) {
    console.error('❌ Validation failed');
    
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation errors:', error.issues);
      console.error('❌ Error details:', JSON.stringify(error.issues, null, 2));
      
      // Log specific transcript errors
      const transcriptErrors = error.issues.filter(issue => 
        issue.path.includes('transcript')
      );
      
      if (transcriptErrors.length > 0) {
        console.error('❌ TRANSCRIPT VALIDATION ERRORS:', transcriptErrors);
        console.error('❌ Received transcript:', {
          exists: !!data?.transcript,
          type: typeof data?.transcript,
          length: data?.transcript?.length,
          preview: data?.transcript?.substring(0, 100)
        });
      }
      
      return { success: false, errors: error.issues };
    }
    
    console.error('❌ Unknown validation error:', error);
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}



// Business logic validation
export function validateCallBusinessRules(data: z.infer<typeof salesCallInputSchema>): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
  insights: {
    completeness: 'minimal' | 'basic' | 'comprehensive';
    analysisComplexity: 'simple' | 'moderate' | 'complex';
    dataQuality: 'poor' | 'good' | 'excellent';
    expectedAccuracy: number; // 0-100
  };
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let completenessScore = 0;
  let qualityScore = 0;

  // Check basic information completeness
  if (data.title) completenessScore += 1;
  if (data.prospectName) completenessScore += 1;
  if (data.companyName) completenessScore += 1;
  if (data.companyIndustry) completenessScore += 1;
  if (data.actualDate) completenessScore += 1;
  
  // Check transcript quality - FIX: Uncomment and update this line
  const transcriptLength = data.transcript.length; // Since transcript is now required, no need for optional chaining

  if (transcriptLength < 100) {
    warnings.push('Transcript is very short - analysis may be limited');
    qualityScore += 1;
  } else if (transcriptLength < 500) {
    warnings.push('Short transcript - consider providing more content for better analysis');
    qualityScore += 2;
  } else if (transcriptLength > 1000) {
    qualityScore += 4;
  } else {
    qualityScore += 3;
  }

  // Company information completeness
  const companyFields = [data.companyWebsite, data.companyIndustry, data.companyHeadcount, data.companyRevenue, data.companyLocation];
  const companyCompleteness = companyFields.filter(Boolean).length;
  
  if (companyCompleteness < 2) {
    recommendations.push('Add more company information for better context analysis');
  }

  // Prospect information completeness
  const prospectFields = [data.prospectName, data.prospectTitle, data.prospectEmail];
  const prospectCompleteness = prospectFields.filter(Boolean).length;
  
  if (prospectCompleteness < 2) {
    recommendations.push('Add more prospect information for personalized insights');
  }

  // Analysis goals and context
  if (!data.additionalContext && (!data.specificQuestions || data.specificQuestions.length === 0)) {
    recommendations.push('Provide specific questions or context for more targeted analysis');
  }

  if (data.analysisGoals && data.analysisGoals.length > 0) {
    completenessScore += 2;
    recommendations.push('Clear analysis goals will help generate more relevant insights');
  }

  // Call type specific validations
  switch (data.callType) {
    case 'sales':
      if (!data.companyHeadcount) {
        recommendations.push('Company size helps tailor discovery questions analysis');
      }
      break;
    
    case 'interview':
      if (!data.additionalContext) {
        recommendations.push('Context about interview goals improves analysis quality');
      }
      break;
    
    case 'podcast':
      if (!data.analysisGoals) {
        recommendations.push('Define podcast goals for content quality analysis');
      }
      break;
  }

  // Determine completeness level
  let completeness: 'minimal' | 'basic' | 'comprehensive';
  if (completenessScore <= 3) {
    completeness = 'minimal';
    warnings.push('Limited information provided - analysis will be basic');
  } else if (completenessScore <= 6) {
    completeness = 'basic';
  } else {
    completeness = 'comprehensive';
  }

  // Determine analysis complexity
  let analysisComplexity: 'simple' | 'moderate' | 'complex';
  const complexityFactors = [
    data.specificQuestions?.length || 0,
    data.analysisGoals?.length || 0,
    transcriptLength > 2000 ? 1 : 0,
    companyCompleteness,
    prospectCompleteness
  ];
  
  const complexityScore = complexityFactors.reduce((sum, factor) => sum + factor, 0);
  
  if (complexityScore <= 3) {
    analysisComplexity = 'simple';
  } else if (complexityScore <= 7) {
    analysisComplexity = 'moderate';
  } else {
    analysisComplexity = 'complex';
  }

  // Determine data quality
  let dataQuality: 'poor' | 'good' | 'excellent';
  if (qualityScore <= 2) {
    dataQuality = 'poor';
  } else if (qualityScore <= 3) {
    dataQuality = 'good';
  } else {
    dataQuality = 'excellent';
  }

  // Calculate expected accuracy
  const accuracyFactors = [
    transcriptLength > 500 ? 25 : transcriptLength > 200 ? 15 : 5,
    completenessScore * 5,
    qualityScore * 10,
    data.additionalContext ? 10 : 0,
    (data.specificQuestions?.length || 0) * 3
  ];
  
  const expectedAccuracy = Math.min(95, accuracyFactors.reduce((sum, factor) => sum + factor, 40));

  // Additional recommendations based on call type and data
  if (data.callType === 'sales' && !data.companyRevenue) {
    recommendations.push('Company revenue range helps assess fit and pricing strategy');
  }

  if (transcriptLength > 5000) {
    recommendations.push('Very long transcript - consider breaking into segments for detailed analysis');
  }

  if (data.scheduledDate && data.actualDate) {
    const scheduled = new Date(data.scheduledDate);
    const actual = new Date(data.actualDate);
    const diff = Math.abs(actual.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diff > 7) {
      warnings.push('Significant delay between scheduled and actual date - may affect context');
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    recommendations,
    insights: {
      completeness,
      analysisComplexity,
      dataQuality,
      expectedAccuracy: Math.round(expectedAccuracy)
    }
  };
}

// Helper function to extract call insights
export function extractCallInsights(data: z.infer<typeof salesCallInputSchema>) {
  const insights = {
    context: {
      hasProspectInfo: !!(data.prospectName && data.prospectTitle),
      hasCompanyInfo: !!(data.companyName && data.companyIndustry),
      hasGoals: !!(data.analysisGoals && data.analysisGoals.length > 0),
      hasQuestions: !!(data.specificQuestions && data.specificQuestions.length > 0),
      transcriptLength: data.transcript.length // Remove optional chaining
    },
    completeness: {
      prospect: [data.prospectName, data.prospectTitle, data.prospectEmail, data.prospectLinkedin].filter(Boolean).length,
      company: [data.companyName, data.companyWebsite, data.companyIndustry, data.companyHeadcount, data.companyRevenue, data.companyLocation].filter(Boolean).length,
      context: [data.additionalContext, data.specificQuestions, data.analysisGoals].filter(x => x && (Array.isArray(x) ? x.length > 0 : true)).length
    },
    recommendations: {
      shouldAnalyze: data.transcript.length >= 50, // Remove optional chaining
      needsMoreInfo: [data.prospectName, data.companyName, data.transcript].filter(Boolean).length < 2,
      goodForAnalysis: data.transcript.length > 200 && data.prospectName && data.companyName,
      complexAnalysisPossible: data.transcript.length > 1000 && data.additionalContext && (data.specificQuestions?.length || 0) > 0
    }
  };

  return insights;
}


// Type exports
export type SalesCallInput = z.infer<typeof salesCallInputSchema>;