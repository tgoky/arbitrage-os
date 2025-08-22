// services/coldEmail.service.ts - COMPLETE VERSION WITH DELIVERABLE STORAGE
import { OpenRouterClient } from '@/lib/openrouter';
import { ColdEmailGenerationInput, GeneratedEmail, ColdEmailResponse } from '@/types/coldEmail';
import { Redis } from '@upstash/redis';
import { ColdEmailOptimizationType} from '@/types/coldEmail';

// Type definition for template metadata
interface TemplateMetadata {
  subject?: string;
  category?: 'outreach' | 'follow_up' | 'introduction' | 'meeting' | 'demo';
  description?: string;
  variables?: string[];
  isPublic?: boolean;
}

// Type guard to check if metadata is a valid object
function isValidMetadata(metadata: any): metadata is TemplateMetadata {
  return metadata && typeof metadata === 'object';
}

export class ColdEmailService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  // ✅ NEW: Wrapper method that generates AND saves emails
  async generateAndSaveEmails(
    input: ColdEmailGenerationInput, 
    userId: string, 
    workspaceId: string
  ): Promise<{
    emails: GeneratedEmail[];
    deliverableId: string;
    tokensUsed: number;
    generationTime: number;
  }> {
    // Generate emails using existing method
    const response = await this.generateEmails(input);
    
    // Save to deliverables
    const deliverableId = await this.saveEmailGeneration(userId, workspaceId, response, input);
    
    return {
      ...response,
      deliverableId
    };
  }

  // ✅ NEW: Method to save email generation to deliverables table
  async saveEmailGeneration(
    userId: string, 
    workspaceId: string, 
    emailResponse: ColdEmailResponse, 
    input: ColdEmailGenerationInput
  ): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `Cold Emails - ${input.targetCompany || input.targetFirstName || 'Prospect'}`,
          content: JSON.stringify(emailResponse),
          type: 'cold_email_generation',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: {
            method: input.method,
            targetCompany: input.targetCompany,
            targetFirstName: input.targetFirstName,
            targetRole: input.targetRole,
            targetIndustry: input.targetIndustry,
            emailCount: emailResponse.emails.length,
            senderName: `${input.firstName} ${input.lastName}`,
            companyName: input.companyName,
            tone: input.tone,
            emailLength: input.emailLength,
            generatedAt: new Date().toISOString(),
            tokensUsed: emailResponse.tokensUsed,
            generationTime: emailResponse.generationTime
          },
          tags: [
            'cold-email',
            input.method,
            input.tone,
            input.targetIndustry || 'general',
            input.emailLength || 'medium'
          ].filter(Boolean)
        }
      });

      return deliverable.id;
    } catch (error) {
      console.error('Error saving email generation:', error);
      throw error;
    }
  }

  // ✅ NEW: Method to get user's email generations
  async getUserEmailGenerations(userId: string, workspaceId?: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'cold_email_generation'
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const generations = await prisma.deliverable.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          metadata: true,
          created_at: true,
          updated_at: true,
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return generations.map(gen => {
        const metadata = gen.metadata as any;
        
        return {
          id: gen.id,
          title: gen.title,
          method: metadata?.method,
          targetCompany: metadata?.targetCompany,
          targetFirstName: metadata?.targetFirstName,
          targetRole: metadata?.targetRole,
          targetIndustry: metadata?.targetIndustry,
          emailCount: metadata?.emailCount,
          senderName: metadata?.senderName,
          companyName: metadata?.companyName,
          tone: metadata?.tone,
          emailLength: metadata?.emailLength,
          tokensUsed: metadata?.tokensUsed,
          generationTime: metadata?.generationTime,
          createdAt: gen.created_at,
          updatedAt: gen.updated_at,
          workspace: gen.workspace
        };
      });
    } catch (error) {
      console.error('Error fetching email generations:', error);
      return [];
    }
  }

  // ✅ NEW: Method to get specific email generation
  async getEmailGeneration(userId: string, generationId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const generation = await prisma.deliverable.findFirst({
        where: {
          id: generationId,
          user_id: userId,
          type: 'cold_email_generation'
        },
        include: {
          workspace: true
        }
      });

      if (!generation) {
        return null;
      }

      return {
        id: generation.id,
        title: generation.title,
        emails: JSON.parse(generation.content),
        metadata: generation.metadata,
        createdAt: generation.created_at,
        updatedAt: generation.updated_at,
        workspace: generation.workspace
      };
    } catch (error) {
      console.error('Error retrieving email generation:', error);
      throw error;
    }
  }

  // ✅ NEW: Method to delete email generation
  async deleteEmailGeneration(userId: string, generationId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: generationId,
          user_id: userId,
          type: 'cold_email_generation'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting email generation:', error);
      throw error;
    }
  }

  // EXISTING METHODS (unchanged)
  async generateEmails(input: ColdEmailGenerationInput): Promise<ColdEmailResponse> {
    const startTime = Date.now();
    
    // ✅ Fix: Set defaults for optional fields
    const processedInput = {
      ...input,
      variations: input.variations || 1,
      generateFollowUps: input.generateFollowUps || false,
      followUpCount: input.followUpCount || 3,
      emailLength: input.emailLength || 'medium',
      quality: input.quality || 'balanced',
      creativity: input.creativity || 'moderate'
    };
    
    // Check cache first
    const cacheKey = this.generateCacheKey(processedInput);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    // Build comprehensive prompt
    const prompt = this.buildEmailPrompt(processedInput);
    
    // ✅ Fix: Use correct property name
    const emailPromises = Array.from({ length: processedInput.variations }, (_, i) => 
      this.generateEmailVariation(prompt, processedInput, i + 1)
    );
    
    const results = await Promise.all(emailPromises);
    
    // Calculate total tokens
    const tokensUsed = results.reduce((sum, r) => sum + r.tokensUsed, 0);
    
    const response: ColdEmailResponse = {
      emails: results.map(r => r.email),
      tokensUsed,
      generationTime: Date.now() - startTime
    };

    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(response), { ex: 3600 });
    
    return response;
  }

 private async generateEmailVariation(
  basePrompt: string,
  input: ColdEmailGenerationInput,
  variation: number
): Promise<{ email: GeneratedEmail; tokensUsed: number }> {
  const variationPrompt = `${basePrompt}\n\nGenerate email variation #${variation}. Make it unique while maintaining the core message.`;
  
  const response = await this.openRouterClient.complete({
    model: 'openai/gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert cold email copywriter. Generate personalized, high-converting cold emails that feel authentic and valuable to the recipient.`
      },
      {
        role: 'user',
        content: variationPrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });

  const parsedEmail = this.parseEmailResponse(response.content, input, variation, 1, 0);
  
  let totalTokensUsed = response.usage.total_tokens;

  if (input.generateFollowUps && variation === 1) { // Only generate follow-ups for first variation
  const followUps = await this.generateFollowUpSequence(
    parsedEmail, 
    input, 
    input.followUpCount || 3  // Add || 3 to provide default value
  );
  parsedEmail.followUpSequence = followUps.emails;
  totalTokensUsed += followUps.tokensUsed;
}

  return {
    email: parsedEmail,
    tokensUsed: totalTokensUsed
  };
}

private async generateFollowUpSequence(
  originalEmail: GeneratedEmail,
  input: ColdEmailGenerationInput,
  count: number
): Promise<{ emails: GeneratedEmail[]; tokensUsed: number }> {
  const followUps: GeneratedEmail[] = [];
  let totalTokens = 0;
  
  for (let sequenceIndex = 0; sequenceIndex < count; sequenceIndex++) {
    const followUpPrompt = this.buildFollowUpPrompt(originalEmail, input, sequenceIndex + 1);
    
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at writing follow-up emails that maintain engagement without being pushy.'
        },
        {
          role: 'user',
          content: followUpPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });
    
    const followUpEmail = this.parseEmailResponse(
      response.content, 
      input, 
      1, 
      sequenceIndex + 2,  // sequenceNumber (2, 3, 4...)
      (sequenceIndex + 1) * 3  // dayInterval (3, 6, 9 days...)
    );
    
    followUps.push(followUpEmail);
    totalTokens += response.usage.total_tokens;
  }
  
  return { emails: followUps, tokensUsed: totalTokens };
}

private buildFollowUpPrompt(originalEmail: GeneratedEmail, input: ColdEmailGenerationInput, followUpNumber: number): string {
  const strategies = [
    'Add value with a helpful resource or insight',
    'Create gentle urgency or mention limited availability', 
    'Use social proof or mention other clients\' success'
  ];
  
  const strategy = strategies[followUpNumber - 1] || 'Provide a final, soft ask';
  
  return `
Original email subject: ${originalEmail.subject}
Original email body: ${originalEmail.body}

Generate follow-up email #${followUpNumber} for ${input.targetFirstName || 'the prospect'}.

Strategy: ${strategy}
Tone: ${input.tone}
Wait time: ${followUpNumber * 3} days after previous email

Keep it shorter than the original, reference the previous email subtly, and ${strategy.toLowerCase()}.

Format as:
SUBJECT: [subject line]

BODY:
[email body]

SIGNATURE:
[signature]
  `;
}

  private buildEmailPrompt(input: ColdEmailGenerationInput): string {
    return `
    BUSINESS CONTEXT:
    - Company: ${input.companyName}
    - Sender: ${input.firstName} ${input.lastName}
    - Role: ${input.jobTitle}
    - Email: ${input.workEmail}
    - Website: ${input.companyWebsite || 'Not provided'}
    - Value Proposition: ${input.valueProposition}
    
    PROSPECT INFORMATION:
    - Name: ${input.targetFirstName || 'Prospect'}
    - Company: ${input.targetCompany || 'Their Company'}
    - Title: ${input.targetRole}
    - Industry: ${input.targetIndustry}
    - Pain Points: ${input.targetPainPoints?.join(', ') || 'Not specified'}
    - Goals: ${input.targetGoals?.join(', ') || 'Not specified'}
    
    EMAIL STRATEGY:
    - Method: ${input.method}
    - Tone: ${input.tone}
    - Length: ${input.emailLength || 'medium'}
    - Call to Action: ${input.callToAction || 'Schedule a call'}
    - Social Proof: ${input.socialProof || 'None'}
    - Unique Differentiator: ${input.uniqueDifferentiator || 'None'}
    - Personalization: ${input.personalizedElement || 'None'}
    
    REFERRAL CONTEXT:
    ${input.referrerFirstName ? `
    - Referrer: ${input.referrerFirstName} ${input.referrerLastName}
    - Referrer Role: ${input.referrerJobTitle}
    - Relationship: ${input.referrerRelationship}
    ` : '- No referral connection'}
    
    Generate a cold email that:
    1. Uses a personalized, attention-grabbing subject line
    2. Opens with genuine personalization about their company/role
    3. Quickly establishes relevance and credibility
    4. Addresses their specific pain point or goal
    5. Presents your solution/offer clearly
    6. Includes social proof if available
    7. Has a clear, specific call-to-action
    8. Keeps the tone ${input.tone} and feels authentic
    9. Is ${input.emailLength || 'medium'} length (${
      input.emailLength === 'short' ? '~100 words' :
      input.emailLength === 'long' ? '~250-300 words' :
      '~150-200 words'
    })
    
    Format your response as:
    SUBJECT: [subject line]
    
    BODY:
    [email body]
    
    SIGNATURE:
    Best regards,
    ${input.firstName} ${input.lastName}
    ${input.jobTitle}
    ${input.companyName}
    ${input.workEmail}
    ${input.phone ? `${input.phone}` : ''}
    ${input.linkedIn ? `${input.linkedIn}` : ''}
    `;
  }

  private parseEmailResponse(content: string, input: ColdEmailGenerationInput, variation: number, sequenceNumber?: number, dayInterval?: number ): GeneratedEmail {
    const lines = content.split('\n');
    let subject = '';
    let body = '';
    let signature = '';
    let currentSection = '';
    
    for (const line of lines) {
      if (line.startsWith('SUBJECT:')) {
        subject = line.replace('SUBJECT:', '').trim();
        currentSection = 'subject';
      } else if (line.startsWith('BODY:')) {
        currentSection = 'body';
      } else if (line.startsWith('SIGNATURE:')) {
        currentSection = 'signature';
      } else if (line.trim() && currentSection === 'body') {
        body += line + '\n';
      } else if (line.trim() && currentSection === 'signature') {
        signature += line + '\n';
      }
    }
    
    // Fallback signature if not generated
    if (!signature.trim()) {
      signature = `Best regards,
${input.firstName} ${input.lastName}
${input.jobTitle}
${input.companyName}
${input.workEmail}`;
    }
    
    return {
      subject: subject || `${input.method} opportunity for ${input.targetCompany || 'your company'}`,
      body: body.trim() || content,
      signature: signature.trim(),
      method: input.method,
      metadata: {
        targetIndustry: input.targetIndustry,
        targetRole: input.targetRole,
        generatedAt: new Date().toISOString(),
        variationIndex: variation,
        sequenceNumber: sequenceNumber || 1, 
         dayInterval: dayInterval || 0  
      }
    };
  }

  async optimizeEmail(emailContent: string, optimizationType: ColdEmailOptimizationType): Promise<{
    content: string;
    tokensUsed: number;
  }> {
    const optimizationPrompts: Record<ColdEmailOptimizationType, string> = {
      'personalization': 'Make this email more personalized and specific to the recipient',
      'value': 'Strengthen the value proposition and benefits',
      'urgency': 'Add appropriate urgency without being pushy',
      'social-proof': 'Incorporate more credibility and social proof',
      'clarity': 'Improve clarity and make the message more concise',
      'cta': 'Strengthen the call-to-action'
    };

    const prompt = optimizationPrompts[optimizationType];
    if (!prompt) {
      throw new Error(`Invalid optimization type: ${optimizationType}`);
    }

    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cold email optimization specialist.'
        },
        {
          role: 'user',
          content: `${prompt}:\n\n${emailContent}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    return {
      content: response.content,
      tokensUsed: response.usage.total_tokens
    };
  }

  private generateCacheKey(input: ColdEmailGenerationInput): string {
    const key = `cold_email:${input.companyName}:${input.targetCompany || 'prospect'}:${input.method}:${input.targetIndustry}`;
    return key.toLowerCase().replace(/[^a-z0-9:]/g, '_');
  }

  // TEMPLATE MANAGEMENT METHODS (unchanged)
  async getUserTemplates(userId: string, options?: {
    category?: 'outreach' | 'follow_up' | 'introduction' | 'meeting' | 'demo';
    includePublic?: boolean;
  }) {
    try {
      // Get user's workspace
      const workspace = await this.getUserWorkspace(userId);
      if (!workspace) return [];

      // Build where clause
      const whereClause: any = {
        OR: [
          { user_id: userId }, // User's own templates
        ]
      };

      // Include public templates if requested
      if (options?.includePublic) {
        whereClause.OR.push({ 
          AND: [
            { metadata: { path: ['isPublic'], equals: true } },
            { type: 'email_template' }
          ]
        });
      }

      // Add category filter if specified
      if (options?.category) {
        whereClause.AND = [
          { metadata: { path: ['category'], equals: options.category } }
        ];
      }

      const { prisma } = await import('@/lib/prisma');
      const templates = await prisma.deliverable.findMany({
        where: {
          ...whereClause,
          type: 'email_template'
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          metadata: true,
          tags: true,
          created_at: true,
          updated_at: true
        }
      });

      return templates.map(template => {
        // Safely parse metadata with type checking
        const metadata = isValidMetadata(template.metadata) 
          ? template.metadata as TemplateMetadata
          : {};

        return {
          id: template.id,
          name: template.title,
          subject: metadata.subject || '',
          body: template.content,
          category: metadata.category || 'outreach' as const,
          description: metadata.description || '',
          variables: metadata.variables || [],
          tags: template.tags,
          isPublic: metadata.isPublic || false,
          createdAt: template.created_at,
          updatedAt: template.updated_at
        };
      });

    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  async createTemplate(userId: string, templateData: {
    name: string;
    description?: string;
    subject: string;
    body: string;
    category: 'outreach' | 'follow_up' | 'introduction' | 'meeting' | 'demo';
    tags?: string[];
    variables?: string[];
    isPublic?: boolean;
  }) {
    try {
      // Get user's workspace
      const workspace = await this.getUserWorkspace(userId);
      if (!workspace) {
        throw new Error('No workspace found for user');
      }

      const { prisma } = await import('@/lib/prisma');
      const template = await prisma.deliverable.create({
        data: {
          title: templateData.name,
          content: templateData.body,
          type: 'email_template',
          user_id: userId,
          workspace_id: workspace.id,
          metadata: {
            subject: templateData.subject,
            category: templateData.category,
            description: templateData.description,
            variables: templateData.variables || [],
            isPublic: templateData.isPublic || false
          },
          tags: templateData.tags || []
        }
      });

      return {
        id: template.id,
        name: template.title,
        subject: templateData.subject,
        body: template.content,
        category: templateData.category,
        description: templateData.description,
        variables: templateData.variables || [],
        tags: template.tags,
        isPublic: templateData.isPublic || false,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      };

    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(userId: string, templateId: string, updateData: Partial<{
    name: string;
    description?: string;
    subject: string;
    body: string;
    category: 'outreach' | 'follow_up' | 'introduction' | 'meeting' | 'demo';
    tags?: string[];
    variables?: string[];
    isPublic?: boolean;
  }>) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      // First check if template exists and belongs to user
      const existingTemplate = await prisma.deliverable.findFirst({
        where: {
          id: templateId,
          user_id: userId,
          type: 'email_template'
        }
      });

      if (!existingTemplate) {
        return null;
      }

      // Build update data
      const updateFields: any = {};
      if (updateData.name) updateFields.title = updateData.name;
      if (updateData.body) updateFields.content = updateData.body;
      if (updateData.tags) updateFields.tags = updateData.tags;

      // Safely handle metadata update with proper typing
      const currentMetadata = isValidMetadata(existingTemplate.metadata) 
        ? existingTemplate.metadata as TemplateMetadata
        : {};
      
      const newMetadata: TemplateMetadata = { ...currentMetadata };
      
      if (updateData.subject !== undefined) newMetadata.subject = updateData.subject;
      if (updateData.category !== undefined) newMetadata.category = updateData.category;
      if (updateData.description !== undefined) newMetadata.description = updateData.description;
      if (updateData.variables !== undefined) newMetadata.variables = updateData.variables;
      if (updateData.isPublic !== undefined) newMetadata.isPublic = updateData.isPublic;

      updateFields.metadata = newMetadata;

      const template = await prisma.deliverable.update({
        where: { id: templateId },
        data: updateFields
      });

      // Safe metadata access for return value
      const returnMetadata = isValidMetadata(template.metadata) 
        ? template.metadata as TemplateMetadata
        : {};

      return {
        id: template.id,
        name: template.title,
        subject: returnMetadata.subject || '',
        body: template.content,
        category: returnMetadata.category || 'outreach' as const,
        description: returnMetadata.description || '',
        variables: returnMetadata.variables || [],
        tags: template.tags,
        isPublic: returnMetadata.isPublic || false,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      };

    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(userId: string, templateId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: templateId,
          user_id: userId,
          type: 'email_template'
        }
      });

      return result.count > 0;

    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  private async getUserWorkspace(userId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      let workspace = await prisma.workspace.findFirst({
        where: { user_id: userId }
      });

      if (!workspace) {
        // Create default workspace if none exists
        workspace = await prisma.workspace.create({
          data: {
            user_id: userId,
            name: 'Default Workspace',
            slug: 'default',
            description: 'Default workspace for email templates'
          }
        });
      }

      return workspace;
    } catch (error) {
      console.error('Error getting user workspace:', error);
      return null;
    }
  }
}