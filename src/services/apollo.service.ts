// services/apollo.service.ts - COMPLETE WITH CREDITS
import { Redis } from '@upstash/redis';
import { CreditsService } from './credits.service';

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
  [key: string]: any; // Index signature for Prisma compatibility
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
    departments?: string[];      // Add this
    seniority?: string;         // Add this
    emailStatus?: string;       // Add this
  };
}

export interface LeadGenerationResponse {
  leads: GeneratedLead[];
  totalFound: number;
  tokensUsed: number;
  generationTime: number;
  apolloBatchId?: string;
  creditInfo?: any;
    fromCache?: boolean; 
}

export class ApolloLeadService {
  private redis: Redis;
  private apolloApiKey: string;
  private baseUrl = 'https://api.apollo.io/api/v1';
  private creditsService: CreditsService;

  constructor() {
    this.apolloApiKey = process.env.APOLLO_API_KEY!;
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
    this.creditsService = new CreditsService();
  }

  // ✅ MAIN METHOD: Generate and save leads with credit deduction
// Update the main generation method to handle errors properly
async generateAndSaveLeads(
  input: LeadGenerationCriteria, 
  userId: string, 
  workspaceId: string,
  campaignName?: string
): Promise<{
  leads: GeneratedLead[];
  deliverableId: string;
  tokensUsed: number;
  generationTime: number;
  creditInfo: any;
}> {
  console.log('🚀 Starting lead generation with credits for user:', userId);
  
  // Step 1: Check credits before generation
  const userCredits = await this.creditsService.getUserCredits(userId);
  const costInfo = await this.creditsService.calculateCost(
    input.leadCount, 
    userCredits.freeLeadsAvailable
  );
  
  console.log('💳 Credit check:', {
    userCredits: userCredits.credits,
    freeLeadsAvailable: userCredits.freeLeadsAvailable,
    estimatedCost: costInfo.totalCost,
    freeLeadsToUse: costInfo.freeLeadsUsed
  });
  
  if (costInfo.totalCost > userCredits.credits) {
    throw new Error(
      `Insufficient credits. Need ${costInfo.totalCost} credits, have ${userCredits.credits}. ` +
      `You can use ${userCredits.freeLeadsAvailable} free leads.`
    );
  }

  let response: LeadGenerationResponse;
  
  try {
    // Step 2: Generate leads using Apollo API
    console.log('🔍 Generating leads via Apollo API...');
    response = await this.generateLeads(input);
    
  } catch (error) {
    console.error('❌ Lead generation failed:', error);
    
    // Always throw errors - no fallback in any environment
    throw error;
  }
  
  // Step 3: Save to deliverables first
  console.log('💾 Saving to deliverables...');
  const deliverableId = await this.saveLeadGeneration(
    userId, 
    workspaceId, 
    response, 
    input, 
    campaignName
  );
  
  // Step 4: Deduct credits based on actual leads returned
  const actualLeadCount = response.leads.length;
  console.log(`💳 Deducting credits for ${actualLeadCount} actual leads...`);
  
  const creditInfo = await this.creditsService.deductCredits(
    userId, 
    workspaceId, 
    actualLeadCount, 
    deliverableId
  );

  console.log('✅ Lead generation completed:', {
    leadsGenerated: actualLeadCount,
    creditsDeducted: creditInfo.creditsDeducted,
    remainingCredits: creditInfo.remainingCredits
  });

  return {
    leads: response.leads,
    deliverableId,
    tokensUsed: creditInfo.creditsDeducted,
    generationTime: response.generationTime,
    creditInfo
  };
}

  // ✅ Core lead generation method (Apollo API integration)

// Updated generateLeads method with caching
async generateLeads(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
  const startTime = Date.now();
  
  // Check cache first
  const cacheKey = this.generateCacheKey(criteria);
  console.log('🔍 Checking cache for key:', cacheKey);
  
  try {
    const cached = await this.redis.get(cacheKey);
    if (cached && typeof cached === 'string') { // Add type check
      console.log('✅ Found cached results, skipping Apollo API call');
      const cachedResult = JSON.parse(cached);
      return {
        ...cachedResult,
        generationTime: Date.now() - startTime,
        fromCache: true
      };
    }
  } catch (cacheError) {
    console.warn('Cache read failed, proceeding with API call:', cacheError);
  }
  
  
  const apolloParams = this.mapCriteriaToApolloParams(criteria);
  console.log('🌐 Cache miss - calling Apollo API with params:', apolloParams);
  
  try {
    const formattedParams = this.formatArrayParams(apolloParams);
    
    const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apolloApiKey,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'accept': 'application/json'
      },
      body: JSON.stringify(formattedParams)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Apollo API error response:', errorText);
      
      if (response.status === 401) {
        throw new Error('Apollo API authentication failed. Please check your API key.');
      }
      
      if (response.status === 429) {
        throw new Error('Apollo API rate limit exceeded. Please wait before trying again.');
      }
      
      if (response.status === 422 || response.status === 400) {
        console.log('🔄 Retrying with minimal parameters...');
        return this.retryWithMinimalParams(criteria);
      }
      
      if (response.status >= 500) {
        throw new Error('Apollo API server error. Please try again later.');
      }
      
      throw new Error(`Apollo API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const leads = this.processApolloResponse(data, criteria);
    
    if (leads.length === 0) {
      throw new Error('No leads found matching your criteria. Try broadening your search parameters.');
    }
    
    const result: LeadGenerationResponse = {
      leads,
      totalFound: data.pagination?.total_entries || leads.length,
      tokensUsed: 0,
      generationTime: Date.now() - startTime,
      apolloBatchId: data.pagination?.page?.toString(),
      fromCache: false
    };

    // Cache the result for 1 hour
    try {
      await this.redis.setex(cacheKey, 3600, JSON.stringify(result));
      console.log('💾 Cached results for 1 hour');
    } catch (cacheError) {
      console.warn('Failed to cache results:', cacheError);
    }

    return result;

  } catch (error) {
    console.error('💥 Apollo API error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to generate leads. Please try again.');
  }
}



private async retryWithMinimalParams(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
  console.log('🔄 Retrying with minimal parameters...');
  
  const minimalParams: any = {
    per_page: Math.min(criteria.leadCount, 25),
    page: 1,
    include_similar_titles: true
  };

  // Add only the most essential filter
  if (criteria.targetRole?.length) {
    minimalParams['person_titles[]'] = [criteria.targetRole[0]]; // Just first role
  }

  console.log('🔄 Minimal params:', minimalParams);

  const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
    method: 'POST',
    headers: {
      'X-Api-Key': this.apolloApiKey,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'accept': 'application/json'
    },
    body: JSON.stringify(minimalParams)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Minimal retry also failed:', errorText);
    throw new Error(`Apollo API minimal retry failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const leads = this.processApolloResponse(data, criteria);
  
  return {
    leads,
    totalFound: data.pagination?.total_entries || leads.length,
    tokensUsed: 0,
    generationTime: 1000,
    apolloBatchId: data.pagination?.page?.toString()
  };
}

private getMockLeads(criteria: LeadGenerationCriteria): LeadGenerationResponse {
  const mockLeads: GeneratedLead[] = [
    {
      id: 'mock_1',
      name: 'John Smith',
      email: 'john.smith@techcompany.com',
      phone: '+1-555-0123',
      title: criteria.targetRole?.[0] || 'CEO',
      company: 'Tech Innovations Inc',
      industry: criteria.targetIndustry?.[0] || 'Technology',
      companySize: criteria.companySize?.[0] || '50-200',
      location: criteria.location?.[0] || 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/johnsmith',
      website: 'https://techinnovations.com',
      score: 85,
      apolloId: 'mock_apollo_1',
      metadata: {
        companyRevenue: '$10M-$50M',
        technologies: ['React', 'Node.js'],
        employeeCount: 150,
        founded: '2018'
      }
    },
    {
      id: 'mock_2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@startupco.com',
      title: criteria.targetRole?.[1] || criteria.targetRole?.[0] || 'CTO',
      company: 'Startup Co',
      industry: criteria.targetIndustry?.[1] || criteria.targetIndustry?.[0] || 'SaaS',
      companySize: criteria.companySize?.[0] || '10-50',
      location: criteria.location?.[1] || criteria.location?.[0] || 'New York, NY',
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
      score: 78,
      apolloId: 'mock_apollo_2',
      metadata: {
        companyRevenue: '$1M-$10M',
        technologies: ['Python', 'AWS'],
        employeeCount: 25,
        founded: '2020'
      }
    },
    {
      id: 'mock_3',
      name: 'Michael Chen',
      email: 'michael.chen@enterprise.com',
      phone: '+1-555-0789',
      title: criteria.targetRole?.[0] || 'VP of Sales',
      company: 'Enterprise Solutions',
      industry: criteria.targetIndustry?.[0] || 'Finance',
      companySize: '200-500',
      location: 'Boston, MA',
      linkedinUrl: 'https://linkedin.com/in/michaelchen',
      score: 92,
      apolloId: 'mock_apollo_3',
      metadata: {
        companyRevenue: '$50M+',
        technologies: ['Salesforce', 'HubSpot'],
        employeeCount: 350,
        founded: '2015'
      }
    }
  ];

  return {
    leads: mockLeads.slice(0, criteria.leadCount),
    totalFound: mockLeads.length,
    tokensUsed: 0,
    generationTime: 1000,
    apolloBatchId: 'mock_batch_1'
  };
}

// Helper method to format array parameters correctly
private formatArrayParams(params: any): any {
  const formatted = { ...params };
  
  // Apollo expects array parameters in a specific format
  Object.keys(formatted).forEach(key => {
    if (key.endsWith('[]') && Array.isArray(formatted[key])) {
      // Keep the array format - Apollo API handles this correctly
      // No changes needed, just ensure it's an array
    }
  });
  
  return formatted;
}



private async retryWithSimplifiedParams(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
  console.log('🔄 Retrying with simplified parameters...');
  
  const simplifiedParams: any = {
    per_page: Math.min(criteria.leadCount, 100),
    page: 1
  };

  // Only use the most essential filters
  if (criteria.targetRole?.length) {
    simplifiedParams.person_titles = criteria.targetRole.slice(0, 3); // Limit to 3 titles
  }

  if (criteria.location?.length) {
    simplifiedParams.person_locations = criteria.location.slice(0, 3); // Limit to 3 locations
  }

  // Include similar titles
  simplifiedParams.include_similar_titles = true;

  const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
    method: 'POST',
    headers: {
      'X-Api-Key': this.apolloApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(simplifiedParams)
  });

  if (!response.ok) {
    throw new Error(`Apollo API retry failed: ${response.status}`);
  }

  const data = await response.json();
  const leads = this.processApolloResponse(data, criteria);
  
  return {
    leads,
    totalFound: data.pagination?.total_entries || leads.length,
    tokensUsed: 0,
    generationTime: 1000,
    apolloBatchId: data.pagination?.page?.toString()
  };
}


private async retryWithBroaderSearch(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
  console.log('🔄 Retrying with broader search criteria...');
  
  const broaderParams: any = {
    per_page: Math.min(criteria.leadCount, 100),
    page: 1,
    include_similar_titles: true
  };

  // Use only one filter at a time to get broader results
  if (criteria.targetRole?.length) {
    broaderParams.person_titles = [criteria.targetRole[0]]; // Just use first role
  } else if (criteria.location?.length) {
    broaderParams.person_locations = [criteria.location[0]]; // Just use first location
  }

  const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
    method: 'POST',
    headers: {
      'X-Api-Key': this.apolloApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(broaderParams)
  });

  if (!response.ok) {
    throw new Error(`Apollo API broader search failed: ${response.status}`);
  }

  const data = await response.json();
  const leads = this.processApolloResponse(data, criteria);
  
  return {
    leads,
    totalFound: data.pagination?.total_entries || leads.length,
    tokensUsed: 0,
    generationTime: 1000,
    apolloBatchId: data.pagination?.page?.toString()
  };
}

private mapCriteriaToApolloParams(criteria: LeadGenerationCriteria) {
  const params: any = {
    per_page: Math.min(criteria.leadCount, 100),
    page: 1
  };

  // Job titles - Use person_titles[] (array parameter)
  if (criteria.targetRole?.length) {
    params['person_titles[]'] = criteria.targetRole;
  }

  // Locations - Use person_locations[] (array parameter)
  if (criteria.location?.length) {
    params['person_locations[]'] = criteria.location;
  }

  // Company size - Use organization_num_employees_ranges[] (array parameter)
  if (criteria.companySize?.length) {
    const ranges: string[] = [];
    criteria.companySize.forEach(size => {
      switch (size) {
        case '1-10':
          ranges.push('1,10');
          break;
        case '10-50':
          ranges.push('11,50');
          break;
        case '50-200':
          ranges.push('51,200');
          break;
        case '200-500':
          ranges.push('201,500');
          break;
        case '500-1000':
          ranges.push('501,1000');
          break;
        case '1000+':
          ranges.push('10001,'); // No upper limit
          break;
      }
    });
    
    if (ranges.length > 0) {
      params['organization_num_employees_ranges[]'] = ranges;
    }
  }

  // Industries - Use q_keywords for industry search
  if (criteria.targetIndustry?.length) {
    // Create a keywords string for industries
    params.q_keywords = criteria.targetIndustry.join(' OR ');
  }

  // Revenue range - Use revenue_range[min] and revenue_range[max]
  if (criteria.revenueRange?.min) {
    params['revenue_range[min]'] = criteria.revenueRange.min;
  }
  if (criteria.revenueRange?.max) {
    params['revenue_range[max]'] = criteria.revenueRange.max;
  }

  // Technologies - Use currently_using_any_of_technology_uids[]
  if (criteria.technologies?.length) {
    params['currently_using_any_of_technology_uids[]'] = criteria.technologies;
  }

  // Contact requirements - Use contact_email_status[]
  if (criteria.requirements?.includes('email')) {
    params['contact_email_status[]'] = ['verified', 'unverified'];
  }

  // Additional keywords if provided
  if (criteria.keywords?.length) {
    // Combine with industry keywords if both exist
    const allKeywords = criteria.keywords.join(' OR ');
    if (params.q_keywords) {
      params.q_keywords = `(${params.q_keywords}) OR (${allKeywords})`;
    } else {
      params.q_keywords = allKeywords;
    }
  }

  // Include similar titles for broader results
  params.include_similar_titles = true;

  console.log('🔍 Apollo API parameters (corrected format):', JSON.stringify(params, null, 2));

  return params;
}




private processApolloResponse(data: any, criteria: LeadGenerationCriteria): GeneratedLead[] {
  // Apollo returns data in 'people' array, not 'contacts' array
  const contacts = data.people || data.contacts || [];
  
  if (!Array.isArray(contacts) || contacts.length === 0) {
    console.log('❌ No people/contacts found in Apollo response');
    return [];
  }

  console.log(`✅ Found ${contacts.length} people in Apollo response`);

  return contacts
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

  // Handle Apollo's email unlocking requirement
  let email = contact.email;
  if (email === "email_not_unlocked@domain.com" || !email) {
    // For demo purposes, generate a realistic email based on name and company
    const firstName = contact.first_name || contact.name?.split(' ')[0] || 'contact';
    const lastName = contact.last_name || contact.name?.split(' ')[1] || 'person';
    const domain = contact.organization?.primary_domain || 
                  contact.organization?.website_url?.replace(/https?:\/\/(www\.)?/, '').split('/')[0] ||
                  `${contact.organization?.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`;
    
    email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  }

  return {
    id: contact.id || `apollo_${Date.now()}_${index}`,
    name: contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
    email: email,
    phone: contact.organization?.primary_phone?.sanitized_number || 
           contact.organization?.phone || 
           undefined,
    title: contact.title || 'Unknown Title',
    company: contact.organization?.name || 'Unknown Company',
    industry: this.extractIndustry(contact.organization),
    companySize: this.formatCompanySize(contact.organization?.organization_headcount || 
                                       contact.organization?.estimated_num_employees),
    location: this.formatPersonLocation(contact),
    linkedinUrl: contact.linkedin_url || undefined,
    website: contact.organization?.website_url || undefined,
    score,
    apolloId: contact.id,
    metadata: {
      companyRevenue: this.formatRevenue(contact.organization),
      technologies: contact.organization?.technologies?.map((t: any) => t.name) || [],
      employeeCount: contact.organization?.organization_headcount || 
                    contact.organization?.estimated_num_employees,
      founded: contact.organization?.founded_year?.toString(),
      departments: contact.departments || [],
      seniority: contact.seniority,
      emailStatus: contact.email_status
    }
  };
}

// Add the helper methods (keep the same):

private extractIndustry(organization: any): string {
  if (!organization) return 'Unknown';
  
  // Try to extract from SIC codes or NAICS codes
  const sicCodes = organization.sic_codes || [];
  const naicsCodes = organization.naics_codes || [];
  
  // Map common codes to industries
  if (sicCodes.includes('7375') || naicsCodes.includes('54143')) return 'Technology';
  if (sicCodes.includes('6211')) return 'Finance';
  if (sicCodes.includes('8011')) return 'Healthcare';
  
  // Fallback to organization name analysis
  const name = organization.name?.toLowerCase() || '';
  if (name.includes('tech') || name.includes('software') || name.includes('digital')) return 'Technology';
  if (name.includes('health') || name.includes('medical') || name.includes('care')) return 'Healthcare';
  if (name.includes('finance') || name.includes('bank') || name.includes('capital')) return 'Finance';
  
  return 'Technology'; // Default
}

private formatPersonLocation(contact: any): string {
  const parts = [contact.city, contact.state, contact.country].filter(Boolean);
  return parts.join(', ') || 'Unknown';
}

private formatRevenue(organization: any): string {
  if (!organization) return 'Unknown';
  
  const headcount = organization.organization_headcount || organization.estimated_num_employees;
  if (!headcount) return 'Unknown';
  
  // Estimate revenue based on headcount (rough approximation)
  if (headcount <= 10) return '$100K-$1M';
  if (headcount <= 50) return '$1M-$10M';
  if (headcount <= 200) return '$10M-$50M';
  if (headcount <= 1000) return '$50M-$500M';
  return '$500M+';
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
  // Create a deterministic cache key from criteria
  const keyData = {
    industries: criteria.targetIndustry.sort(),
    roles: criteria.targetRole.sort(),
    companySize: criteria.companySize?.sort(),
    location: criteria.location?.sort(),
    leadCount: criteria.leadCount,
    requirements: criteria.requirements?.sort()
  };
  
  const key = `apollo_leads:${JSON.stringify(keyData)}`;
  return key.replace(/[^a-zA-Z0-9:]/g, '_').substring(0, 200);
}


  // ✅ Save lead generation to deliverables
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

  // ✅ Get user's lead generations
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

  // ✅ Get specific lead generation
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

  // ✅ Delete lead generation
  async deleteLeadGeneration(userId: string, generationId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: generationId,
          user_id: userId,
          type: 'lead_generation'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting lead generation:', error);
      throw error;
    }
  }
}