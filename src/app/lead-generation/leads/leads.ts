// app/lead-generation/leads/leads.ts
export interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  description: string;
  logo: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  address?: string;
}

export interface LeadCampaign {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'draft';
  businessProfileId: string; // Reference to BusinessProfile
  targetIndustry: string[];
  targetRole: string[];
  companySize: string[];
  location: string[];
  keywords: string[];
  requirements: string[];
  dailyLimit: number;
  createdAt: Date;
  leadsGenerated: number;
  description?: string;
  outreachMethod: 'email' | 'linkedin' | 'both' | 'multi-channel';
  personalizationLevel: 'basic' | 'standard' | 'advanced' | 'hyper';
  startDate?: Date;
  endDate?: Date;
  technologies?: string[];
  revenueRange?: string;
  fundingStage?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  position: string;
  industry: string;
  companySize: string;
  location: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  lastContacted?: Date;
  notes?: string;
  campaignId: string;
  linkedinUrl?: string;
  website?: string;
  tags?: string[];
}

// Initial data for demonstration
export const initialBusinessProfiles: BusinessProfile[] = [
  {
    id: '1',
    name: 'TechFlow Solutions',
    industry: 'SaaS',
    size: '50-200',
    location: 'United States',
    website: 'techflow.example.com',
    description: 'Providing automation solutions for SaaS companies',
    logo: '/api/placeholder/80/80',
    email: 'contact@techflow.example.com',
    phone: '+1 (555) 123-4567',
    linkedin: 'linkedin.com/company/techflow',
    address: '123 Tech Street, San Francisco, CA'
  },
  {
    id: '2',
    name: 'Digital Growth Co',
    industry: 'Marketing',
    size: '10-50',
    location: 'United Kingdom',
    website: 'digitalgrowth.example.com',
    description: 'Growth hacking and digital marketing agency',
    logo: '/api/placeholder/80/80',
    email: 'hello@digitalgrowth.example.com',
    phone: '+44 20 1234 5678',
    linkedin: 'linkedin.com/company/digitalgrowth',
    address: '456 Digital Ave, London, UK'
  }
];

export const initialCampaigns: LeadCampaign[] = [
  {
    id: '1',
    name: 'Q3 SaaS Outreach',
    status: 'running',
    businessProfileId: '1',
    targetIndustry: ['Technology', 'SaaS'],
    targetRole: ['VP of Sales', 'CTO', 'CEO'],
    companySize: ['50-200', '200-500'],
    location: ['United States', 'Canada'],
    keywords: ['SaaS', 'cloud', 'automation'],
    requirements: ['email', 'linkedin'],
    dailyLimit: 50,
    createdAt: new Date('2023-07-15'),
    leadsGenerated: 234,
    outreachMethod: 'email',
    personalizationLevel: 'advanced'
  },
  {
    id: '2',
    name: 'Enterprise Solutions',
    status: 'paused',
    businessProfileId: '1',
    targetIndustry: ['Finance', 'Healthcare'],
    targetRole: ['IT Director', 'Operations Manager'],
    companySize: ['500-1000', '1000+'],
    location: ['Global'],
    keywords: ['enterprise', 'security', 'compliance'],
    requirements: ['email', 'phone', 'linkedin'],
    dailyLimit: 25,
    createdAt: new Date('2023-08-01'),
    leadsGenerated: 87,
    outreachMethod: 'multi-channel',
    personalizationLevel: 'standard'
  },
  {
    id: '3',
    name: 'Marketing Agencies',
    status: 'completed',
    businessProfileId: '2',
    targetIndustry: ['Marketing', 'Advertising'],
    targetRole: ['Marketing Director', 'CMO'],
    companySize: ['10-50', '50-200'],
    location: ['United States', 'United Kingdom'],
    keywords: ['digital marketing', 'growth', 'SEO'],
    requirements: ['email', 'linkedin'],
    dailyLimit: 75,
    createdAt: new Date('2023-06-10'),
    leadsGenerated: 512,
    outreachMethod: 'both',
    personalizationLevel: 'hyper'
  }
];

export const initialLeads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@techcompany.com',
    phone: '+1 (555) 987-6543',
    company: 'TechStart Inc',
    position: 'VP of Sales',
    industry: 'Technology',
    companySize: '50-200',
    location: 'San Francisco, CA',
    status: 'contacted',
    lastContacted: new Date('2023-08-20'),
    campaignId: '1',
    linkedinUrl: 'linkedin.com/in/sarahjohnson',
    tags: ['hot lead', 'decision maker']
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@cloudsolutions.com',
    company: 'CloudSolutions Ltd',
    position: 'CTO',
    industry: 'SaaS',
    companySize: '200-500',
    location: 'New York, NY',
    status: 'qualified',
    lastContacted: new Date('2023-08-18'),
    campaignId: '1',
    linkedinUrl: 'linkedin.com/in/michaelchen',
    tags: ['technical', 'budget approved']
  },
  {
    id: '3',
    name: 'Jessica Williams',
    email: 'jessica@digitalmarketing.com',
    phone: '+1 (555) 456-7890',
    company: 'Digital Marketing Pros',
    position: 'Marketing Director',
    industry: 'Marketing',
    companySize: '10-50',
    location: 'Austin, TX',
    status: 'converted',
    lastContacted: new Date('2023-08-15'),
    campaignId: '3',
    website: 'digitalmarketingpros.com',
    tags: ['converted', 'referred others']
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david@fintech.com',
    company: 'FinTech Innovations',
    position: 'CEO',
    industry: 'Finance',
    companySize: '50-200',
    location: 'Chicago, IL',
    status: 'new',
    campaignId: '2',
    linkedinUrl: 'linkedin.com/in/davidbrown',
    tags: ['executive', 'high value']
  },
  {
    id: '5',
    name: 'Emily Rodriguez',
    email: 'emily@healthtech.com',
    phone: '+1 (555) 123-7890',
    company: 'HealthTech Solutions',
    position: 'IT Director',
    industry: 'Healthcare',
    companySize: '200-500',
    location: 'Boston, MA',
    status: 'contacted',
    lastContacted: new Date('2023-08-19'),
    campaignId: '2',
    tags: ['interested', 'follow up needed']
  }
];