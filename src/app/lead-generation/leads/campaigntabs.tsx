import React from 'react';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StopOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Divider, Row, Space, Tag, Progress, Tooltip } from 'antd';
import { LeadCampaign } from '../leads/leads';
import { Typography } from 'antd';
import { useRouter } from 'next/navigation';

interface CampaignsTabProps {
  campaigns: LeadCampaign[];
  businessProfiles?: any[]; // Make optional with default value
  handleStartCampaign: (campaignId: string) => void;
  handlePauseCampaign: (campaignId: string) => void;
  handleStopCampaign: (campaignId: string) => void;
  getStatusColor: (status: string) => string;
  setIsModalVisible: (visible: boolean) => void;
}

const { Title, Text } = Typography;

export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  
  campaigns,
  businessProfiles = [], // Default to empty array
  handleStartCampaign,
  handlePauseCampaign,
  handleStopCampaign,
  getStatusColor,
  setIsModalVisible,
}) => {
  const router = useRouter();

  const getBusinessProfileName = (businessProfileId: string) => {
    if (!Array.isArray(businessProfiles)) {
      return 'Unknown Business';
    }
    const profile = businessProfiles.find(profile => profile.id === businessProfileId);
    return profile ? profile.name : 'Unknown Business';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  

  const getProgressPercent = (campaign: LeadCampaign) => {
    const created = new Date(campaign.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.min(diffDays * 5, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={4} className="mb-1">
            Lead Generation Campaigns
          </Title>
          <Text type="secondary">
            Manage your automated lead finding campaigns
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => router.push('/lead-generation/create')}
        >
          New Campaign
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {campaigns.map((campaign) => {
          const businessProfile = Array.isArray(businessProfiles)
            ? businessProfiles.find(profile => profile.id === campaign.businessProfileId)
            : null;
          
          return (
            <Col key={campaign.id} xs={24} lg={12} xl={8}>
              <Card
                title={
                  <div className="flex items-center justify-between">
                    <span className="truncate">{campaign.name}</span>
                    <Tag color={getStatusColor(campaign.status)}>
                      {campaign.status.toUpperCase()}
                    </Tag>
                  </div>
                }
                extra={
                  <Tooltip title="View campaign details">
                    <Button 
                      type="text" 
                      icon={<EyeOutlined />} 
                      size="small"
                    />
                  </Tooltip>
                }
              >
                <div className="mb-3">
                  <Text type="secondary">Business: </Text>
                  <Text strong>{getBusinessProfileName(campaign.businessProfileId)}</Text>
                </div>

                {/* Rest of the component remains unchanged */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <Text type="secondary">Target Roles</Text>
                    <div className="font-medium truncate">
                      {campaign.targetRole.slice(0, 2).join(', ')}
                      {campaign.targetRole.length > 2 && '...'}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">Industries</Text>
                    <div className="font-medium truncate">
                      {campaign.targetIndustry.slice(0, 2).join(', ')}
                      {campaign.targetIndustry.length > 2 && '...'}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">Company Sizes</Text>
                    <div className="font-medium truncate">
                      {campaign.companySize.slice(0, 2).join(', ')}
                      {campaign.companySize.length > 2 && '...'}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">Locations</Text>
                    <div className="font-medium truncate">
                      {campaign.location.slice(0, 2).join(', ')}
                      {campaign.location.length > 2 && '...'}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <Text type="secondary">Keywords:</Text>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {campaign.keywords.slice(0, 3).map((keyword, index) => (
                      <Tag key={index}>{keyword}</Tag>
                    ))}
                    {campaign.keywords.length > 3 && (
                      <Tag>+{campaign.keywords.length - 3} more</Tag>
                    )}
                  </div>
                </div>

                <Divider className="my-3" />

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <Text type="secondary">Progress</Text>
                    <Text type="secondary">{campaign.leadsGenerated} leads</Text>
                  </div>
                  <Progress 
                    percent={getProgressPercent(campaign)} 
                    size="small" 
                    showInfo={false}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                  <div>
                    <div className="font-medium">{campaign.dailyLimit}/day</div>
                    <Text type="secondary">Limit</Text>
                  </div>
                  <div>
                    <div className="font-medium text-blue-500">
                      {campaign.outreachMethod}
                    </div>
                    <Text type="secondary">Method</Text>
                  </div>
                  <div>
                    <div className="font-medium text-green-500">
                      {campaign.personalizationLevel}
                    </div>
                    <Text type="secondary">Personalization</Text>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Text type="secondary" className="text-xs">
                    Created: {formatDate(campaign.createdAt)}
                  </Text>
                  <Space>
                    {campaign.status === 'draft' && (
                      <Button
                        size="small"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartCampaign(campaign.id)}
                      >
                        Start
                      </Button>
                    )}
                    {campaign.status === 'running' && (
                      <>
                        <Button
                          size="small"
                          icon={<PauseCircleOutlined />}
                          onClick={() => handlePauseCampaign(campaign.id)}
                        >
                          Pause
                        </Button>
                        <Button
                          size="small"
                          icon={<StopOutlined />}
                          onClick={() => handleStopCampaign(campaign.id)}
                        >
                          Stop
                        </Button>
                      </>
                    )}
                    {campaign.status === 'paused' && (
                      <Button
                        size="small"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartCampaign(campaign.id)}
                      >
                        Resume
                      </Button>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4"></div>
          <Title level={4}>No campaigns yet</Title>
          <Text type="secondary" className="mb-6 block">
            Create your first campaign to start generating leads
          </Text>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={() => router.push('/lead-generation/campaigns/create')}
          >
            Create Your First Campaign
          </Button>
        </div>
      )}
    </div>
  );
};