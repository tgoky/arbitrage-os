// app/lead-generation/components/CampaignsTab.tsx
import React from 'react';
import { BuildOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Row, Space, Tag} from 'antd';
import { LeadCampaign } from '../leads/leads';
import { Typography } from 'antd';

interface CampaignsTabProps {
  campaigns: LeadCampaign[];
  handleStartCampaign: (campaignId: string) => void;
  handlePauseCampaign: (campaignId: string) => void;
  handleStopCampaign: (campaignId: string) => void;
  getStatusColor: (status: string) => string;
  setIsModalVisible: (visible: boolean) => void;
}




const { Title, Text } = Typography;

export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  campaigns,
  handleStartCampaign,
  handlePauseCampaign,
  handleStopCampaign,
  getStatusColor,
  setIsModalVisible,
}) => (
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
        onClick={() => setIsModalVisible(true)}
      >
        New Campaign
      </Button>
    </div>

    <Row gutter={[24, 24]}>
      {campaigns.map((campaign) => (
        <Col key={campaign.id} xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span>{campaign.name}</span>
                <Tag color={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Tag>
              </div>
            }
            extra={<Text type="secondary">For: {campaign.businessName}</Text>}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Text type="secondary">Target Role</Text>
                <div className="font-medium">{campaign.targetRole}</div>
              </div>
              <div>
                <Text type="secondary">Industry</Text>
                <div className="font-medium">{campaign.targetIndustry}</div>
              </div>
              <div>
                <Text type="secondary">Company Size</Text>
                <div className="font-medium">{campaign.targetCompanySize}</div>
              </div>
              <div>
                <Text type="secondary">Location</Text>
                <div className="font-medium">{campaign.targetLocation}</div>
              </div>
            </div>

            <div className="mb-4">
              <Text type="secondary">Keywords:</Text>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.keywords.map((keyword, index) => (
                  <Tag key={index}>{keyword}</Tag>
                ))}
              </div>
            </div>

            <Divider className="my-4" />

            <div className="grid grid-cols-4 gap-4 mb-4 text-center">
              <div>
                <Text type="secondary">Leads Found</Text>
                <div className="text-lg font-medium">{campaign.leadsFound}</div>
              </div>
              <div>
                <Text type="secondary">Contacted</Text>
                <div className="text-lg font-medium text-blue-500">{campaign.leadsContacted}</div>
              </div>
              <div>
                <Text type="secondary">Qualified</Text>
                <div className="text-lg font-medium text-green-500">{campaign.leadsQualified}</div>
              </div>
              <div>
                <Text type="secondary">Credits Used</Text>
                <div className="text-lg font-medium">{campaign.creditsUsed}</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Text type="secondary">Last run: {campaign.lastRun}</Text>
              <Space>
                {campaign.status === 'draft' && (
                  <Button
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleStartCampaign(campaign.id)}
                  >
                    Start
                  </Button>
                )}
                {campaign.status === 'running' && (
                  <>
                    <Button
                      icon={<PauseCircleOutlined />}
                      onClick={() => handlePauseCampaign(campaign.id)}
                    >
                      Pause
                    </Button>
                    <Button
                      icon={<StopOutlined />}
                      onClick={() => handleStopCampaign(campaign.id)}
                    >
                      Stop
                    </Button>
                  </>
                )}
                {campaign.status === 'paused' && (
                  <Button
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
      ))}
    </Row>
  </div>
);