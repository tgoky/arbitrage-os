// types/proposalCreator.ts - ALIGNED WITH SIMPLIFIED FRONTEND

export interface ClientInformation {
  legalName: string;
  stateOfIncorporation?: string;
  entityType?: 'corporation' | 'llc' | 'partnership' | 'sole-proprietorship';
  address?: string;
  signatoryName?: string;
  signatoryTitle?: string;
}

export interface ServiceProvider {
  name?: string;
  address?: string;
  signatoryName?: string;
  signatoryTitle?: string;
}

export interface ProjectScope {
  description: string;
  scopeOfServices?: string;
  timeline?: string;
  fees?: string;
  serviceProviderResponsibilities?: string;
  clientResponsibilities?: string;
  acceptanceCriteria?: string;
  additionalTerms?: string;
}

export interface PricingStructure {
  totalAmount: number;
}

export interface ProposalTerms {
  governingLaw?: string;
  intellectualProperty?: 'client-owns' | 'service-provider-owns' | 'shared' | 'work-for-hire';
}

// MAIN INPUT - matches frontend exactly
export interface ProposalInput {
  serviceProvider: ServiceProvider;
  clientInfo: ClientInformation;
  projectScope: ProjectScope;
  effectiveDate?: string;
  workspaceId: string;
  userId?: string;
}

// Contract output structure
export interface ContractTemplates {
  serviceAgreement: string;
  statementOfWork: string;
}

// Generated proposal structure - simplified
export interface GeneratedProposal {
  contractTemplates: ContractTemplates;
  metadata?: {
    tokensUsed?: number;
    model?: string;
    generatedAt?: string;
  };
}

// Complete package returned to frontend
export interface ProposalPackage {
  contracts: ContractTemplates;
  tokensUsed: number;
  generationTime: number;
  originalInput: ProposalInput;
}

// Saved proposal in database
export interface SavedProposal {
  id: string;
  title: string;
  clientName: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
  proposalData: ProposalPackage;
  metadata: {
    version: string;
    industry?: string;
  };
  workspace?: any;
}

// API Response types
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    proposalId?: string;
    saved?: boolean;
    tokensUsed?: number;
    generationTime?: number;
    [key: string]: any;
  };
}

export interface ApiResponseOptional<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta?: {
    [key: string]: any;
  };
}