

import React, { useState } from 'react';

// Define interfaces
export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone?: string;
  linkedin: string;
  location: string;
  industry: string;
  companySize: string;
  revenue: string;
  technology: string[];
  lastActivity: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
}

export interface LeadCampaign {
  id: string;
  name: string;
  businessId: string;
  businessName: string;
  targetIndustry: string;
  targetRole: string;
  targetCompanySize: string;
  targetLocation: string;
  keywords: string[];
  filters: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasLinkedIn: boolean;
    companySize: string[];
    revenue: string[];
    technology: string[];
  };
  status: 'draft' | 'running' | 'paused' | 'completed';
  leadsFound: number;
  leadsContacted: number;
  leadsQualified: number;
  creditsUsed: number;
  createdAt: string;
  lastRun: string;
}

// Sample data
export const initialCampaigns: LeadCampaign[] = [
  {
    id: '1',
    name: 'SaaS Sales Campaign',
    businessId: '1',
    businessName: 'TechFlow Solutions',
    targetIndustry: 'Technology',
    targetRole: 'VP of Sales',
    targetCompanySize: '50-200',
    targetLocation: 'United States',
    keywords: ['SaaS', 'sales automation', 'CRM'],
    filters: {
      hasEmail: true,
      hasPhone: true,
      hasLinkedIn: true,
      companySize: ['50-200', '200-500'],
      revenue: ['$1M-$10M', '$10M-$50M'],
      technology: ['Salesforce', 'HubSpot', 'Pipedrive']
    },
    status: 'running',
    leadsFound: 247,
    leadsContacted: 89,
    leadsQualified: 23,
    creditsUsed: 450,
    createdAt: '2024-01-15',
    lastRun: '2024-01-20'
  },
  {
    id: '2',
    name: 'Marketing Agency Outreach',
    businessId: '2',
    businessName: 'Digital Growth Co',
    targetIndustry: 'Marketing',
    targetRole: 'Marketing Director',
    targetCompanySize: '10-50',
    targetLocation: 'United States',
    keywords: ['digital marketing', 'SEO', 'content marketing'],
    filters: {
      hasEmail: true,
      hasPhone: false,
      hasLinkedIn: true,
      companySize: ['10-50', '50-200'],
      revenue: ['$100K-$1M', '$1M-$10M'],
      technology: ['Google Analytics', 'Mailchimp', 'WordPress']
    },
    status: 'paused',
    leadsFound: 156,
    leadsContacted: 45,
    leadsQualified: 12,
    creditsUsed: 320,
    createdAt: '2024-01-10',
    lastRun: '2024-01-18'
  }
];

export const initialLeads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    title: 'VP of Sales',
    company: 'TechFlow Solutions',
    email: 'sarah.johnson@techflow.com',
    phone: '+1 (555) 123-4567',
    linkedin: 'linkedin.com/in/sarahjohnson',
    location: 'San Francisco, CA',
    industry: 'Technology',
    companySize: '50-200',
    revenue: '$10M-$50M',
    technology: ['Salesforce', 'HubSpot', 'Slack'],
    lastActivity: '2024-01-20',
    score: 85,
    status: 'qualified'
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'Marketing Director',
    company: 'Digital Growth Co',
    email: 'michael.chen@digitalgrowth.com',
    phone: '+1 (555) 987-6543',
    linkedin: 'linkedin.com/in/michaelchen',
    location: 'New York, NY',
    industry: 'Marketing',
    companySize: '10-50',
    revenue: '$1M-$10M',
    technology: ['Google Analytics', 'Mailchimp', 'WordPress'],
    lastActivity: '2024-01-19',
    score: 72,
    status: 'contacted'
  }
];

