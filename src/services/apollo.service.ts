// services/apollo.service.ts
import { Redis } from '@upstash/redis';

export interface LeadGenerationCriteria {
  targetIndustry: string[];
  targetRole: string[];
  companySize: string[];
  location: string[];
  keywords?: string[];
  technologies?: string[];
  revenueRange?: {
    min?: number;
    max?: number;
  };
  leadCount: number;
  requirements?: string[]; // ['email', 'phone', 'linkedin']
  [key: string]: any; // Add index signature for Prisma compatibility
}

export interface GeneratedLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title: string;
  company: string;
  industry: string;
  companySize?: string;
  location: string;
  linkedinUrl?: string;
  website?: string;
  score: number; // Lead quality score (1-100)
  apolloId?: string;
  metadata?: {
    companyRevenue?: string;
    technologies?: string[];
    employeeCount?: number;
    founded?: string;
  };
}

export interface LeadGenerationResponse {
  leads: GeneratedLead[];
  totalFound: number;
  tokensUsed: number;
  generationTime: number;
  apolloBatchId?: string;
}

export class ApolloLeadService {
  private redis: Redis;
  private apolloApiKey: string;
  private baseUrl = 'https://api.apollo.io/api/v1';

  constructor() {
    this.apolloApiKey = process.env.APOLLO_API_KEY!;
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  async generateLeads(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(criteria);
    const cached = await this.redis.get(cacheKey);
    
    if (cached && typeof cached === 'string') {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Invalid cached data, proceeding with fresh request');
      }
    }

    // Map criteria to Apollo API parameters
    const apolloParams = this.mapCriteriaToApolloParams(criteria);
    
    try {
      const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apolloApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apolloParams)
      });

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process and format leads
      const leads = this.processApolloResponse(data, criteria);
      
      const result: LeadGenerationResponse = {
        leads,
        totalFound: data.pagination?.total_entries || leads.length,
        tokensUsed: 0, // Apollo doesn't use tokens, but we track API calls
        generationTime: Date.now() - startTime,
        apolloBatchId: data.pagination?.page?.toString()
      };

      // Cache for 2 hours
      await this.redis.set(cacheKey, JSON.stringify(result), { ex: 7200 });
      
      return result;

    } catch (error) {
      console.error('Apollo API error:', error);
      throw new Error(`Failed to generate leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapCriteriaToApolloParams(criteria: LeadGenerationCriteria) {
    const params: any = {
      per_page: Math.min(criteria.leadCount, 100), // Apollo max per page
      page: 1
    };

    // Job titles
    if (criteria.targetRole?.length) {
      params.person_titles = criteria.targetRole;
    }

    // Industries (map to company industry, not person)
    if (criteria.targetIndustry?.length) {
      // Apollo doesn't have direct industry filter, use keywords instead
      params.q_keywords = criteria.targetIndustry.join(' OR ');
    }

    // Locations
    if (criteria.location?.length) {
      params.person_locations = criteria.location;
    }

    // Company size mapping
    if (criteria.companySize?.length) {
      params.organization_num_employees_ranges = criteria.companySize.map(size => {
        switch (size) {
          case '1-10': return '1,10';
          case '10-50': return '11,50';
          case '50-200': return '51,200';
          case '200-500': return '201,500';
          case '500-1000': return '501,1000';
          case '1000+': return '1001,10000';
          default: return size.replace('-', ',');
        }
      });
    }

    // Revenue range
    if (criteria.revenueRange?.min || criteria.revenueRange?.max) {
      if (criteria.revenueRange.min) {
        params['revenue_range[min]'] = criteria.revenueRange.min;
      }
      if (criteria.revenueRange.max) {
        params['revenue_range[max]'] = criteria.revenueRange.max;
      }
    }

    // Technologies
    if (criteria.technologies?.length) {
      params.currently_using_any_of_technology_uids = criteria.technologies.map(tech => 
        tech.toLowerCase().replace(/[^a-z0-9]/g, '_')
      );
    }

    // Contact requirements
    if (criteria.requirements?.includes('email')) {
      params.contact_email_status = ['verified', 'unverified'];
    }

    // Include similar titles for broader matching
    params.include_similar_titles = true;

    return params;
  }

  private processApolloResponse(data: any, criteria: LeadGenerationCriteria): GeneratedLead[] {
    if (!data.contacts || !Array.isArray(data.contacts)) {
      return [];
    }

    return data.contacts
      .filter((contact: any) => this.filterByRequirements(contact, criteria))
      .map((contact: any, index: number) => this.formatLead(contact, index))
      .filter(Boolean);
  }

  private filterByRequirements(contact: any, criteria: LeadGenerationCriteria): boolean {
    if (!criteria.requirements?.length) return true;

    const requirements = criteria.requirements;
    
    // Check email requirement
    if (requirements.includes('email') && !contact.email) {
      return false;
    }

    // Check phone requirement
    if (requirements.includes('phone') && (!contact.phone_numbers || contact.phone_numbers.length === 0)) {
      return false;
    }

    // Check LinkedIn requirement
    if (requirements.includes('linkedin') && !contact.linkedin_url) {
      return false;
    }

    return true;
  }

  private formatLead(contact: any, index: number): GeneratedLead {
    // Calculate lead score based on data completeness and quality
    const score = this.calculateLeadScore(contact);

    return {
      id: contact.id || `apollo_${Date.now()}_${index}`,
      name: contact.name || 'Unknown',
      email: contact.email || undefined,
      phone: contact.phone_numbers?.[0]?.raw_number || undefined,
      title: contact.title || 'Unknown Title',
      company: contact.organization?.name || 'Unknown Company',
      industry: contact.organization?.industry || 'Unknown',
      companySize: this.formatCompanySize(contact.organization?.estimated_num_employees),
      location: this.formatLocation(contact),
      linkedinUrl: contact.linkedin_url || undefined,
      website: contact.organization?.website_url || undefined,
      score,
      apolloId: contact.id,
      metadata: {
        companyRevenue: contact.organization?.estimated_annual_revenue,
        technologies: contact.organization?.technologies?.map((t: any) => t.name) || [],
        employeeCount: contact.organization?.estimated_num_employees,
        founded: contact.organization?.founded_year?.toString()
      }
    };
  }

  private calculateLeadScore(contact: any): number {
    let score = 50; // Base score

    // Email verified (+20)
    if (contact.email && contact.email_status === 'verified') score += 20;
    // Email exists but unverified (+10)
    else if (contact.email) score += 10;

    // Phone number exists (+15)
    if (contact.phone_numbers?.length > 0) score += 15;

    // LinkedIn profile (+10)
    if (contact.linkedin_url) score += 10;

    // Senior role (+10)
    if (contact.title && /(?:ceo|cto|cfo|cmo|president|director|vp|vice president)/i.test(contact.title)) {
      score += 10;
    }

    // Company size bonus
    const empCount = contact.organization?.estimated_num_employees;
    if (empCount) {
      if (empCount >= 100) score += 10;
      else if (empCount >= 50) score += 5;
    }

    // Recent activity or hiring (+5)
    if (contact.organization?.recent_news?.length > 0) score += 5;

    return Math.min(Math.max(score, 1), 100);
  }

  private formatCompanySize(empCount?: number): string {
    if (!empCount) return 'Unknown';
    
    if (empCount <= 10) return '1-10';
    if (empCount <= 50) return '11-50';
    if (empCount <= 200) return '51-200';
    if (empCount <= 500) return '201-500';
    if (empCount <= 1000) return '501-1000';
    return '1000+';
  }

  private formatLocation(contact: any): string {
    const parts = [contact.city, contact.state, contact.country].filter(Boolean);
    return parts.join(', ') || 'Unknown';
  }

  private generateCacheKey(criteria: LeadGenerationCriteria): string {
    const key = `apollo_leads:${JSON.stringify(criteria)}`;
    return key.replace(/[^a-zA-Z0-9:]/g, '_').substring(0, 200);
  }

  // Save lead generation to deliverables
  async saveLeadGeneration(
    userId: string,
    workspaceId: string,
    response: LeadGenerationResponse,
    criteria: LeadGenerationCriteria,
    campaignName?: string
  ): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: campaignName || `Lead Generation - ${criteria.targetIndustry.join(', ')}`,
          content: JSON.stringify(response),
          type: 'lead_generation',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: {
            criteria,
            leadCount: response.leads.length,
            totalFound: response.totalFound,
            generatedAt: new Date().toISOString(),
            apolloBatchId: response.apolloBatchId,
            generationTime: response.generationTime,
            averageScore: response.leads.reduce((sum, lead) => sum + lead.score, 0) / response.leads.length
          },
          tags: [
            'lead-generation',
            'apollo',
            ...criteria.targetIndustry,
            ...criteria.targetRole
          ].filter(Boolean)
        }
      });

      return deliverable.id;
    } catch (error) {
      console.error('Error saving lead generation:', error);
      throw error;
    }
  }

  // Get user's lead generations
  async getUserLeadGenerations(userId: string, workspaceId?: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'lead_generation'
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
          leadCount: metadata?.leadCount || 0,
          totalFound: metadata?.totalFound || 0,
          averageScore: metadata?.averageScore || 0,
          criteria: metadata?.criteria,
          generatedAt: metadata?.generatedAt,
          generationTime: metadata?.generationTime,
          createdAt: gen.created_at,
          updatedAt: gen.updated_at,
          workspace: gen.workspace
        };
      });
    } catch (error) {
      console.error('Error fetching lead generations:', error);
      return [];
    }
  }

  // Get specific lead generation
  async getLeadGeneration(userId: string, generationId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const generation = await prisma.deliverable.findFirst({
        where: {
          id: generationId,
          user_id: userId,
          type: 'lead_generation'
        },
        include: {
          workspace: true
        }
      });

      if (!generation) {
        return null;
      }

      const response: LeadGenerationResponse = JSON.parse(generation.content);

      return {
        id: generation.id,
        title: generation.title,
        leads: response.leads,
        metadata: generation.metadata,
        createdAt: generation.created_at,
        updatedAt: generation.updated_at,
        workspace: generation.workspace
      };
    } catch (error) {
      console.error('Error retrieving lead generation:', error);
      throw error;
    }
  }
}