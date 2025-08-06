// app/lead-generation/components/CreditsTab.tsx
import React from 'react';
import { CreditCardOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Card, Col, Progress, Row } from 'antd';
import { Typography } from 'antd';
import { CreditPackages } from './creditpackages';

interface CreditsTabProps {
  credits: number;
  setIsCreditsModalVisible: (visible: boolean) => void;
  onSelectPackage: (credits: number) => void;
}

const { Title, Text } = Typography;

export const CreditsTab: React.FC<CreditsTabProps> = ({ 
  credits, 
  setIsCreditsModalVisible,
  onSelectPackage 
}) => (
  <div className="space-y-6">
    <Row gutter={[24, 24]} align="stretch">
      <Col xs={24} lg={8}>
        <Card style={{ height: '100%' }}>
          <div className="flex justify-between items-center mb-4">
            <Title level={4} className="mb-0">
              Current Credits
            </Title>
            <CreditCardOutlined className="text-2xl text-blue-500" />
          </div>
          <div className="text-center">
            <Title level={2} className="mb-2">
              {credits.toLocaleString()}
            </Title>
            <Text type="secondary">
              Available for lead generation
            </Text>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <Text type="secondary">Cost per lead:</Text>
              <Text>~2-5 credits</Text>
            </div>
            <div className="flex justify-between text-sm">
              <Text type="secondary">Estimated leads:</Text>
              <Text>~200-500</Text>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card style={{ height: '100%' }}>
          <div className="flex justify-between items-center mb-4">
            <Title level={4} className="mb-0">
              Usage This Month
            </Title>
            <CreditCardOutlined className="text-2xl text-green-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <Text type="secondary">Credits Used</Text>
                <Text>770</Text>
              </div>
              <Progress percent={77} strokeColor="#52c41a" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <Text type="secondary">Leads Generated</Text>
                <Text>154</Text>
              </div>
              <Progress percent={62} strokeColor="#1890ff" />
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card style={{ height: '100%' }}>
          <div className="flex justify-between items-center mb-4">
            <Title level={4} className="mb-0">
              Quick Actions
            </Title>
            <CreditCardOutlined className="text-2xl text-purple-500" />
          </div>
          <div className="space-y-3">
            <Button
              block
              type="primary"
              icon={<CreditCardOutlined />}
              onClick={() => setIsCreditsModalVisible(true)}
            >
              Buy More Credits
            </Button>
            <Button block icon={<CreditCardOutlined />}>
              View Usage History
            </Button>
            <Button block icon={<MailOutlined />}>
              Contact Support
            </Button>
          </div>
        </Card>
      </Col>
    </Row>
    <CreditPackages onSelectPackage={onSelectPackage} />
  </div>
);