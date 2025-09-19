// services/apollo.service.ts - FIXED VERSION WITH ROBUST ERROR HANDLING
import { Redis } from '@upstash/redis';
import { CreditsService } from './credits.service';

export interface LeadGenerationCriteria {
  targetIndustry: string[];
  targetRole: string[];
  companySize: string[];
  // Remove the old location field
  // location: string[];
  
  // Add the new separate location fields
  country?: string[];
  state?: string[];
  city?: string[];
  
  keywords?: string[];
  technologies?: string[];
  revenueRange?: {
    min?: number;
    max?: number;
  };
  leadCount: number;
  requirements?: string[];
  [key: string]: any;
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
  score: number;
  apolloId?: string;
  metadata?: {
    companyRevenue?: string;
    technologies?: string[];
    employeeCount?: number;
    founded?: string;
    departments?: string[];
    seniority?: string;
    emailStatus?: string;
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
      console.log('🔍 Generating leads via Apollo API...');
      response = await this.generateLeads(input);
      
    } catch (error) {
      console.error('❌ Lead generation failed:', error);
      throw error;
    }
    
    console.log('💾 Saving to deliverables...');
    const deliverableId = await this.saveLeadGeneration(
      userId, 
      workspaceId, 
      response, 
      input, 
      campaignName
    );
    
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

  // ✅ MAIN FIX: Robust lead generation with progressive fallback
  async generateLeads(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(criteria);
    console.log('🔍 Checking cache for key:', cacheKey);
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached && typeof cached === 'string') {
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
    
    // Progressive search strategy - start complex, fallback to simple
    const searchStrategies = [
      () => this.executeComplexSearch(criteria),
      () => this.executeSimplifiedSearch(criteria),
      () => this.executeMinimalSearch(criteria),
      () => this.executeBroadSearch(criteria)
    ];

    let lastError: Error | null = null;
    
    for (const [index, strategy] of searchStrategies.entries()) {
      try {
        console.log(`🎯 Trying search strategy ${index + 1}/${searchStrategies.length}`);
        const result = await strategy();
        
        if (result.leads.length > 0) {
          console.log(`✅ Strategy ${index + 1} succeeded with ${result.leads.length} leads`);
          
          // Cache successful results
          try {
            await this.redis.setex(cacheKey, 3600, JSON.stringify(result));
            console.log('💾 Cached results for 1 hour');
          } catch (cacheError) {
            console.warn('Failed to cache results:', cacheError);
          }
          
          return {
            ...result,
            generationTime: Date.now() - startTime,
            fromCache: false
          };
        }
        
        console.log(`⚠️ Strategy ${index + 1} returned no results, trying next...`);
        
      } catch (error) {
        console.error(`❌ Strategy ${index + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // If it's a rate limit or auth error, don't try other strategies
        if (error instanceof Error && 
           (error.message.includes('rate limit') || 
            error.message.includes('authentication') ||
            error.message.includes('401'))) {
          throw error;
        }
        
        continue;
      }
    }
    
    // If all strategies failed, throw the last error or a generic one
    throw lastError || new Error('All search strategies failed to find leads');
  }

  // Strategy 1: Complex search with all criteria
  private async executeComplexSearch(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
    console.log('🎯 Strategy 1: Complex search with all criteria');
    
    const params = this.buildComplexParams(criteria);
    return await this.callApolloAPI(params, criteria);
  }

  // Strategy 2: Simplified search with reduced criteria
private async executeSimplifiedSearch(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
  console.log('🎯 Strategy 2: Simplified search');
  
  const params: any = {
    per_page: Math.min(criteria.leadCount, 100),
    page: 1
  };

  // Use only primary criteria
  if (criteria.targetRole?.length) {
    params.person_titles = criteria.targetRole.slice(0, 3); // Limit to 3 roles
  }

  // ✅ UPDATED: Handle new location structure
  if (criteria.country?.length || criteria.state?.length || criteria.city?.length) {
    const locations = [];
    if (criteria.city?.length) locations.push(...criteria.city.slice(0, 2));
    if (criteria.state?.length) locations.push(...criteria.state.slice(0, 2));
    if (criteria.country?.length) locations.push(...criteria.country.slice(0, 2));
    
    if (locations.length > 0) {
      params.person_locations = locations.slice(0, 2); // Limit to 2 locations
    }
  }

  // Use industries as keywords instead of complex filters
  if (criteria.targetIndustry?.length) {
    params.q_keywords = criteria.targetIndustry.slice(0, 2).join(' OR ');
  }

  params.include_similar_titles = true;
  
  return await this.callApolloAPI(params, criteria);
}


  // Strategy 3: Minimal search with just one criteria
private async executeMinimalSearch(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
  console.log('🎯 Strategy 3: Minimal search');
  
  const params: any = {
    per_page: Math.min(criteria.leadCount, 100),
    page: 1,
    include_similar_titles: true
  };

  // Use only the most important single criterion
  if (criteria.targetRole?.length) {
    params.person_titles = [criteria.targetRole[0]];
  } else if (criteria.targetIndustry?.length) {
    params.q_keywords = criteria.targetIndustry[0];
  } else if (criteria.country?.length) {
    params.person_locations = [criteria.country[0]];
  } else if (criteria.state?.length) {
    params.person_locations = [criteria.state[0]];
  } else if (criteria.city?.length) {
    params.person_locations = [criteria.city[0]];
  }
  
  return await this.callApolloAPI(params, criteria);
}


  // Strategy 4: Very broad search for any professionals
  private async executeBroadSearch(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
    console.log('🎯 Strategy 4: Broad search fallback');
    
    const params: any = {
      per_page: Math.min(criteria.leadCount, 100),
      page: 1,
      include_similar_titles: true,
      // Just search for common executive titles
      person_titles: ['CEO', 'President', 'Director', 'Manager', 'VP']
    };
    
    return await this.callApolloAPI(params, criteria);
  }

  // ✅ FIXED: Build complex parameters with proper formatting
private buildComplexParams(criteria: LeadGenerationCriteria): any {
  const params: any = {
    per_page: Math.min(criteria.leadCount, 100),
    page: 1
  };

  // ✅ FIX 1: Proper array parameter formatting for Apollo API
  if (criteria.targetRole?.length) {
    // Apollo expects plain arrays, not array notation
    params.person_titles = criteria.targetRole.slice(0, 5); // Limit to prevent complexity
  }

  // ✅ NEW: Handle separate location fields (country, state, city)
  if (criteria.country?.length || criteria.state?.length || criteria.city?.length) {
    const locations = [];
    
    // Combine city, state, country into location strings
    if (criteria.city?.length) {
      criteria.city.forEach(city => {
        if (criteria.state?.length) {
          criteria.state.forEach(state => {
            locations.push(`${city}, ${state}`);
          });
        } else if (criteria.country?.length) {
          criteria.country.forEach(country => {
            locations.push(`${city}, ${country}`);
          });
        } else {
          locations.push(city);
        }
      });
    } else if (criteria.state?.length) {
      criteria.state.forEach(state => {
        if (criteria.country?.length) {
          criteria.country.forEach(country => {
            locations.push(`${state}, ${country}`);
          });
        } else {
          locations.push(state);
        }
      });
    } else if (criteria.country?.length) {
      locations.push(...criteria.country);
    }
    
    if (locations.length > 0) {
      params.person_locations = locations.slice(0, 4); // Limit to prevent complexity
    }
  }

  // ✅ FIX 2: Smart company size handling - avoid when multiple industries selected
  if (criteria.companySize?.length) {
    const industryCount = criteria.targetIndustry?.length || 0;
    const roleCount = criteria.targetRole?.length || 0;
    
    // Only apply company size filters if the search isn't already complex
    if (industryCount <= 2 && roleCount <= 2) {
      const ranges: string[] = [];
      criteria.companySize.slice(0, 2).forEach(size => { // Limit to 2 ranges when applying
        switch (size) {
          case '1-10':
            ranges.push('1,10');
            break;
          case '10-50':
          case '11-50':
            ranges.push('11,50');
            break;
          case '50-200':
          case '51-200':
            ranges.push('51,200');
            break;
          case '200-500':
          case '201-500':
            ranges.push('201,500');
            break;
          case '500-1000':
          case '501-1000':
            ranges.push('501,1000');
            break;
          case '1000+':
            ranges.push('1001,');
            break;
        }
      });
      
      if (ranges.length > 0) {
        params.organization_num_employees_ranges = ranges;
      }
    } else {
      console.log('🚫 Skipping company size filters due to complex search (multiple industries/roles)');
    }
  }

  // ✅ FIX 3: Smart industry handling
  if (criteria.targetIndustry?.length) {
    // For multiple industries, use keywords instead of complex filters
    if (criteria.targetIndustry.length === 1) {
      params.q_keywords = criteria.targetIndustry[0];
    } else {
      // Limit to top 3 industries and use OR logic
      const topIndustries = criteria.targetIndustry.slice(0, 3);
      params.q_keywords = topIndustries.join(' OR ');
    }
  }

  // ✅ FIX 4: Revenue range (only if specified)
  if (criteria.revenueRange?.min || criteria.revenueRange?.max) {
    if (criteria.revenueRange.min) {
      params.revenue_range_min = criteria.revenueRange.min;
    }
    if (criteria.revenueRange.max) {
      params.revenue_range_max = criteria.revenueRange.max;
    }
  }

  // ✅ FIX 5: Contact requirements
  if (criteria.requirements?.includes('email')) {
    params.contact_email_status = ['verified'];
  }

  // Additional keywords
  if (criteria.keywords?.length) {
    const keywordsStr = criteria.keywords.slice(0, 3).join(' OR ');
    if (params.q_keywords) {
      params.q_keywords = `(${params.q_keywords}) AND (${keywordsStr})`;
    } else {
      params.q_keywords = keywordsStr;
    }
  }

  params.include_similar_titles = true;

  console.log('🔧 Complex search parameters:', JSON.stringify(params, null, 2));
  return params;
}
  // ✅ FIXED: Centralized API call with better error handling
  private async callApolloAPI(params: any, criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
    console.log('🌐 Calling Apollo API with params:', JSON.stringify(params, null, 2));
    
    try {
      const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apolloApiKey,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'accept': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Apollo API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // Handle specific error types
        if (response.status === 401 || response.status === 403) {
          throw new Error('Apollo API authentication failed. Please check your API key.');
        }
        
        if (response.status === 429) {
          throw new Error('Apollo API rate limit exceeded. Please wait before trying again.');
        }
        
        if (response.status === 422 || response.status === 400) {
          // Parse error to get specific validation issues
          try {
            const errorData = JSON.parse(errorText);
            const errorMsg = errorData.message || errorData.error || 'Invalid parameters';
            throw new Error(`Apollo API validation error: ${errorMsg}`);
          } catch {
            throw new Error('Apollo API rejected the search parameters. Trying simpler search...');
          }
        }
        
        if (response.status >= 500) {
          throw new Error('Apollo API server error. Please try again later.');
        }
        
        throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Apollo API response structure:', {
        hasPeople: !!data.people,
        peopleCount: data.people?.length || 0,
        hasPagination: !!data.pagination,
        totalEntries: data.pagination?.total_entries
      });

      const leads = this.processApolloResponse(data, criteria);
      
      return {
        leads,
        totalFound: data.pagination?.total_entries || leads.length,
        tokensUsed: 0,
        generationTime: 1000,
        apolloBatchId: data.pagination?.page?.toString()
      };

    } catch (error) {
      console.error('💥 Apollo API call failed:', error);
      throw error;
    }
  }

  // ✅ IMPROVED: Response processing with better filtering
  private processApolloResponse(data: any, criteria: LeadGenerationCriteria): GeneratedLead[] {
    const contacts = data.people || data.contacts || [];
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      console.log('❌ No people/contacts found in Apollo response');
      return [];
    }

    console.log(`✅ Found ${contacts.length} people in Apollo response`);

    const processedLeads = contacts
      .filter((contact: any) => this.isValidContact(contact))
      .filter((contact: any) => this.filterByRequirements(contact, criteria))
      .map((contact: any, index: number) => this.formatLead(contact, index))
      .filter(Boolean)
      .filter((lead: GeneratedLead) => lead.name !== 'Unknown' && lead.company !== 'Unknown Company');

    console.log(`📋 After filtering: ${processedLeads.length} valid leads`);
    return processedLeads;
  }

  // ✅ NEW: Validate contact has minimum required data
  private isValidContact(contact: any): boolean {
    // Must have at least name or first_name, and either organization or title
    const hasName = contact.name || (contact.first_name && contact.last_name);
    const hasOrganization = contact.organization?.name;
    const hasTitle = contact.title;
    
    return !!(hasName && (hasOrganization || hasTitle));
  }

  private filterByRequirements(contact: any, criteria: LeadGenerationCriteria): boolean {
    if (!criteria.requirements?.length) return true;

    const requirements = criteria.requirements;
    
    if (requirements.includes('email') && !this.hasValidEmail(contact)) {
      return false;
    }

    if (requirements.includes('phone') && !this.hasValidPhone(contact)) {
      return false;
    }

    if (requirements.includes('linkedin') && !contact.linkedin_url) {
      return false;
    }

    return true;
  }

  private hasValidEmail(contact: any): boolean {
    return !!(contact.email && 
             contact.email !== "email_not_unlocked@domain.com" && 
             contact.email.includes('@'));
  }

  private hasValidPhone(contact: any): boolean {
    return !!(contact.phone_numbers?.length > 0 || 
             contact.organization?.primary_phone ||
             contact.organization?.phone);
  }

  // Keep existing formatLead, calculateLeadScore, and other helper methods unchanged...
  private formatLead(contact: any, index: number): GeneratedLead {
    const score = this.calculateLeadScore(contact);

    let email = contact.email;
    if (email === "email_not_unlocked@domain.com" || !email) {
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

  private calculateLeadScore(contact: any): number {
    let score = 50;

    if (contact.email && contact.email_status === 'verified') score += 20;
    else if (contact.email) score += 10;

    if (contact.phone_numbers?.length > 0) score += 15;
    if (contact.linkedin_url) score += 10;

    if (contact.title && /(?:ceo|cto|cfo|cmo|president|director|vp|vice president)/i.test(contact.title)) {
      score += 10;
    }

    const empCount = contact.organization?.estimated_num_employees;
    if (empCount) {
      if (empCount >= 100) score += 10;
      else if (empCount >= 50) score += 5;
    }

    if (contact.organization?.recent_news?.length > 0) score += 5;

    return Math.min(Math.max(score, 1), 100);
  }

  private extractIndustry(organization: any): string {
  if (!organization) return 'Unknown';
  
  const sicCodes = organization.sic_codes || [];
  const naicsCodes = organization.naics_codes || [];
  
  // Check for specific industry codes first
  const industryMapping = {
    // Technology
    '7375': 'Technology', '54143': 'Technology', '541511': 'Technology', '541512': 'Technology',
    '334': 'Technology', '5045': 'Technology', '7371': 'Technology', '7372': 'Technology',
    
    // Finance
    '6211': 'Finance', '522': 'Finance', '523': 'Finance', '524': 'Finance',
    '6021': 'Finance', '6022': 'Finance', '6035': 'Finance', '6141': 'Finance',
    
    // Healthcare
    '8011': 'Healthcare', '621': 'Healthcare', '622': 'Healthcare', '623': 'Healthcare',
    '8021': 'Healthcare', '8031': 'Healthcare', '8041': 'Healthcare', '8049': 'Healthcare',
    
    // Manufacturing
    '33': 'Manufacturing', '31': 'Manufacturing', '32': 'Manufacturing',
    '3011': 'Manufacturing', '3021': 'Manufacturing', '3531': 'Manufacturing',
    
    // Retail
    '44': 'Retail', '45': 'Retail', '5311': 'Retail', '5331': 'Retail',
    '5411': 'Retail', '5812': 'Retail',
    
    // Real Estate
    '531': 'Real Estate', '6531': 'Real Estate', '6552': 'Real Estate',
    
    // Professional Services
    '541': 'Professional Services', '7011': 'Professional Services',
    '8111': 'Professional Services', '8748': 'Professional Services',
    
    // Education
    '611': 'Education', '8211': 'Education', '8221': 'Education', '8222': 'Education',
    
    // Transportation
    '481': 'Transportation', '482': 'Transportation', '483': 'Transportation',
    '484': 'Transportation', '485': 'Transportation',
    
    // Energy
    '211': 'Energy', '213': 'Energy', '486': 'Energy', '221': 'Energy',
    
    // Media & Entertainment
    '512': 'Media & Entertainment', '515': 'Media & Entertainment', '518': 'Media & Entertainment',
    '7832': 'Media & Entertainment', '7833': 'Media & Entertainment'
  };

  // Check SIC codes
  for (const code of sicCodes) {
    const codeStr = code.toString();
    if (industryMapping[codeStr as keyof typeof industryMapping]) {
      return industryMapping[codeStr as keyof typeof industryMapping];
    }
    // Check partial matches for broader industry codes
    for (const [key, industry] of Object.entries(industryMapping)) {
      if (codeStr.startsWith(key) || key.startsWith(codeStr)) {
        return industry;
      }
    }
  }

  // Check NAICS codes
  for (const code of naicsCodes) {
    const codeStr = code.toString();
    if (industryMapping[codeStr as keyof typeof industryMapping]) {
      return industryMapping[codeStr as keyof typeof industryMapping];
    }
    // Check partial matches for broader industry codes
    for (const [key, industry] of Object.entries(industryMapping)) {
      if (codeStr.startsWith(key) || key.startsWith(codeStr)) {
        return industry;
      }
    }
  }
  
  // Enhanced keyword-based detection
  const name = organization.name?.toLowerCase() || '';
  const description = organization.description?.toLowerCase() || '';
  const combined = `${name} ${description}`;
  
  const keywordMapping = {
    'Technology': [
      'tech', 'software', 'digital', 'app', 'platform', 'saas', 'cloud', 'ai',
      'artificial intelligence', 'machine learning', 'data', 'analytics', 'cyber',
      'security', 'blockchain', 'fintech', 'edtech', 'healthtech', 'biotech',
      'semiconductor', 'hardware', 'electronics', 'computing', 'internet',
      'web', 'mobile', 'startup', 'innovation', 'automation'
    ],
    'Healthcare': [
      'health', 'medical', 'care', 'hospital', 'clinic', 'pharmaceutical',
      'pharma', 'biotech', 'biotechnology', 'medicine', 'therapy', 'treatment',
      'patient', 'doctor', 'nurse', 'wellness', 'fitness', 'dental', 'vision',
      'mental health', 'telehealth', 'medtech'
    ],
    'Finance': [
      'finance', 'financial', 'bank', 'banking', 'credit', 'loan', 'mortgage',
      'investment', 'capital', 'fund', 'venture', 'equity', 'trading', 'wealth',
      'insurance', 'fintech', 'payment', 'currency', 'accounting', 'tax'
    ],
    'Manufacturing': [
      'manufacturing', 'factory', 'production', 'industrial', 'assembly',
      'machinery', 'equipment', 'automotive', 'aerospace', 'steel', 'chemical',
      'plastic', 'textile', 'food processing', 'beverage', 'pharmaceutical manufacturing'
    ],
    'Retail': [
      'retail', 'store', 'shop', 'marketplace', 'ecommerce', 'e-commerce',
      'fashion', 'clothing', 'apparel', 'grocery', 'supermarket', 'department store',
      'boutique', 'outlet', 'consumer goods', 'merchandise'
    ],
    'Real Estate': [
      'real estate', 'property', 'realty', 'housing', 'residential', 'commercial',
      'construction', 'development', 'building', 'architecture', 'leasing'
    ],
    'Professional Services': [
      'consulting', 'advisory', 'legal', 'law', 'accounting', 'audit', 'marketing',
      'advertising', 'public relations', 'hr', 'human resources', 'recruitment',
      'staffing', 'talent', 'management consulting'
    ],
    'Education': [
      'education', 'school', 'university', 'college', 'academy', 'learning',
      'training', 'teaching', 'student', 'academic', 'educational', 'edtech'
    ],
    'Transportation': [
      'transport', 'transportation', 'logistics', 'shipping', 'delivery',
      'freight', 'trucking', 'airline', 'railroad', 'maritime', 'supply chain'
    ],
    'Energy': [
      'energy', 'oil', 'gas', 'petroleum', 'renewable', 'solar', 'wind',
      'electric', 'power', 'utility', 'nuclear', 'coal', 'hydroelectric'
    ],
    'Media & Entertainment': [
      'media', 'entertainment', 'broadcasting', 'television', 'radio', 'film',
      'movie', 'music', 'gaming', 'publishing', 'news', 'content', 'streaming'
    ],
    'Food & Beverage': [
      'food', 'beverage', 'restaurant', 'dining', 'catering', 'hospitality',
      'hotel', 'culinary', 'brewery', 'winery', 'cafe', 'bar'
    ],
    'Agriculture': [
      'agriculture', 'farming', 'farm', 'crop', 'livestock', 'agricultural',
      'organic', 'sustainable farming', 'agtech'
    ],
    'Government': [
      'government', 'federal', 'state', 'municipal', 'public sector', 'agency',
      'department', 'ministry', 'bureau', 'administration'
    ],
    'Non-Profit': [
      'non-profit', 'nonprofit', 'charity', 'foundation', 'ngo', 'association',
      'organization', 'social', 'community', 'volunteer'
    ]
  };
  
  // Check keywords with priority scoring
  const industryScores: { [key: string]: number } = {};
  
  for (const [industry, keywords] of Object.entries(keywordMapping)) {
    let score = 0;
    for (const keyword of keywords) {
      if (combined.includes(keyword)) {
        // Give higher score for exact matches in company name
        if (name.includes(keyword)) {
          score += 2;
        } else {
          score += 1;
        }
      }
    }
    if (score > 0) {
      industryScores[industry] = score;
    }
  }
  
  // Return the industry with the highest score
  if (Object.keys(industryScores).length > 0) {
    return Object.entries(industryScores)
      .sort(([,a], [,b]) => b - a)[0][0];
  }
  
  // If no matches found, try to infer from target criteria
  // This will use the original search criteria if available
  return 'Other';
}


  private formatPersonLocation(contact: any): string {
    const parts = [contact.city, contact.state, contact.country].filter(Boolean);
    return parts.join(', ') || 'Unknown';
  }

  private formatRevenue(organization: any): string {
    if (!organization) return 'Unknown';
    
    const headcount = organization.organization_headcount || organization.estimated_num_employees;
    if (!headcount) return 'Unknown';
    
    if (headcount <= 10) return '$100K-$1M';
    if (headcount <= 50) return '$1M-$10M';
    if (headcount <= 200) return '$10M-$50M';
    if (headcount <= 1000) return '$50M-$500M';
    return '$500M+';
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

 private generateCacheKey(criteria: LeadGenerationCriteria): string {
  const keyData = {
    industries: criteria.targetIndustry?.sort(),
    roles: criteria.targetRole?.sort(),
    companySize: criteria.companySize?.sort(),
    // ✅ UPDATED: Use new location fields
    country: criteria.country?.sort(),
    state: criteria.state?.sort(), 
    city: criteria.city?.sort(),
    leadCount: criteria.leadCount,
    requirements: criteria.requirements?.sort()
  };
  
  const key = `apollo_leads:${JSON.stringify(keyData)}`;
  return key.replace(/[^a-zA-Z0-9:]/g, '_').substring(0, 200);
}


  // Keep existing save/get/delete methods unchanged...
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
          content: true,
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

      console.log(`🔍 Found ${generations.length} generations in database`);
      
      return generations.map(gen => {
        const metadata = gen.metadata as any;
        
        let leadCount = metadata?.leadCount || 0;
        let totalFound = metadata?.totalFound || 0;
        let averageScore = metadata?.averageScore || 0;
        
        if (gen.content) {
          try {
            const parsedContent = JSON.parse(gen.content);
            if (parsedContent.leads && Array.isArray(parsedContent.leads)) {
              leadCount = parsedContent.leads.length;
              totalFound = parsedContent.totalFound || parsedContent.leads.length;
              
              if (parsedContent.leads.length > 0) {
                const totalScore = parsedContent.leads.reduce((sum: number, lead: any) => 
                  sum + (lead.score || 0), 0);
                averageScore = totalScore / parsedContent.leads.length;
              }
            }
          } catch (parseError) {
            console.warn(`Failed to parse content for generation ${gen.id}:`, parseError);
          }
        }
        
        return {
          id: gen.id,
          title: gen.title,
          content: gen.content,
          leadCount,
          totalFound,
          averageScore,
          criteria: metadata?.criteria || {},
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