// app/lead-generation/components.tsx
import React from 'react';
import { BuildOutlined, TeamOutlined, CreditCardOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { Lead, LeadCampaign } from './leads';
import { CampaignsTab, LeadsTab, CreditsTab, leadColumns } from './index';

interface ComponentsProps {
  campaigns: LeadCampaign[];
  leads: Lead[];
  handleStartCampaign: (campaignId: string) => void;
  handlePauseCampaign: (campaignId: string) => void;
  handleStopCampaign: (campaignId: string) => void;
  getStatusColor: (status: string) => string;
  credits: number;
  setIsModalVisible: (visible: boolean) => void;
  setIsCreditsModalVisible: (visible: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedIndustry: string;
  setSelectedIndustry: (industry: string) => void;
  selectedCompanySize: string;
  setSelectedCompanySize: (size: string) => void;
  filteredLeads: Lead[];
}

export const getItems = ({
  campaigns,
  leads,
  handleStartCampaign,
  handlePauseCampaign,
  handleStopCampaign,
  getStatusColor,
  credits,
  setIsModalVisible,
  setIsCreditsModalVisible,
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  selectedIndustry,
  setSelectedIndustry,
  selectedCompanySize,
  setSelectedCompanySize,
  filteredLeads,
}: ComponentsProps): TabsProps['items'] => [
  {
    key: 'campaigns',
    label: (
      <span>
        <BuildOutlined className="mr-1" />
        Campaigns
      </span>
    ),
    children: (
      <CampaignsTab
        campaigns={campaigns}
        handleStartCampaign={handleStartCampaign}
        handlePauseCampaign={handlePauseCampaign}
        handleStopCampaign={handleStopCampaign}
        getStatusColor={getStatusColor}
        setIsModalVisible={setIsModalVisible}
      />
    ),
  },
  {
    key: 'leads',
    label: (
      <span>
        <TeamOutlined className="mr-1" />
        Leads ({leads.length})
      </span>
    ),
    children: (
      <LeadsTab
        leads={leads}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedIndustry={selectedIndustry}
        setSelectedIndustry={setSelectedIndustry}
        selectedCompanySize={selectedCompanySize}
        setSelectedCompanySize={setSelectedCompanySize}
        filteredLeads={filteredLeads}
        leadColumns={leadColumns(getStatusColor)}
      />
    ),
  },
  {
    key: 'credits',
    label: (
      <span>
        <CreditCardOutlined className="mr-1" />
        Credits & Billing
      </span>
    ),
    children: (
      <CreditsTab
        credits={credits}
        setIsCreditsModalVisible={setIsCreditsModalVisible}
      />
    ),
  },
];