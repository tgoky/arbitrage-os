// services/coldEmail.service.ts
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

  async generateEmails(input: ColdEmailGenerationInput): Promise<ColdEmailResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(input);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    // Build comprehensive prompt
    const prompt = this.buildEmailPrompt(input);
    
    // Generate multiple email variations
    const emailPromises = Array.from({ length: input.numberOfVariations }, (_, i) => 
      this.generateEmailVariation(prompt, input, i + 1)
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
      model: 'anthropic/claude-3-sonnet',
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

    const parsedEmail = this.parseEmailResponse(response.content, input, variation);
    
    return {
      email: parsedEmail,
      tokensUsed: response.usage.total_tokens
    };
  }

  private buildEmailPrompt(input: ColdEmailGenerationInput): string {
    return `
    BUSINESS CONTEXT:
    - Company: ${input.businessName}
    - Industry: ${input.industry}
    - Value Proposition: ${input.valueProposition}
    - Offer: ${input.offer}
    
    PROSPECT INFORMATION:
    - Name: ${input.prospectName}
    - Company: ${input.prospectCompany}
    - Title: ${input.prospectTitle}
    - Industry: ${input.prospectIndustry || 'Not specified'}
    - Pain Point: ${input.prospectPainPoint}
    
    EMAIL STRATEGY:
    - Method: ${input.method}
    - Tone: ${input.tone}
    - Purpose: ${input.purpose}
    - Call to Action: ${input.cta}
    - Mutual Connection: ${input.mutualConnection || 'None'}
    - Case Study: ${input.caseStudy || 'None'}
    - Social Proof: ${input.socialProof || 'None'}
    
    Generate a cold email that:
    1. Uses a personalized, attention-grabbing subject line
    2. Opens with genuine personalization about their company/role
    3. Quickly establishes relevance and credibility
    4. Addresses their specific pain point
    5. Presents your solution/offer clearly
    6. Includes social proof if available
    7. Has a clear, specific call-to-action
    8. Keeps the tone ${input.tone} and feels authentic
    9. Is concise and easy to scan (150-200 words max)
    
    Format your response as:
    SUBJECT: [subject line]
    
    BODY:
    [email body]
    `;
  }

  private parseEmailResponse(content: string, input: ColdEmailGenerationInput, variation: number): GeneratedEmail {
    const lines = content.split('\n');
    let subject = '';
    let body = '';
    let isBody = false;
    
    for (const line of lines) {
      if (line.startsWith('SUBJECT:')) {
        subject = line.replace('SUBJECT:', '').trim();
      } else if (line.startsWith('BODY:')) {
        isBody = true;
      } else if (isBody && line.trim()) {
        body += line + '\n';
      }
    }
    
    return {
      subject: subject || `${input.purpose} opportunity for ${input.prospectCompany}`,
      body: body.trim() || content,
      variation,
      tone: input.tone,
      purpose: input.purpose
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
      model: 'anthropic/claude-3-haiku',
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
    const key = `cold_email:${input.businessName}:${input.prospectCompany}:${input.method}:${input.purpose}`;
    return key.toLowerCase().replace(/\s+/g, '_');
  }

  // Template Management Methods
// Updated getUserTemplates method with proper typing
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

// Updated updateTemplate method with proper typing
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