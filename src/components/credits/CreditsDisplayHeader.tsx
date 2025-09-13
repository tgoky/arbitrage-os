// components/CreditsDisplayHeader.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Statistic,
  Progress,
  Tooltip,
  Alert,
  message,
  Row,
  Col
} from 'antd';
import {
  CreditCardOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  PlusOutlined
} from '@ant-design/icons';
import CreditsPurchaseModal from './CreditsDisplayModal';

const { Title, Text } = Typography;

interface CreditsDisplayHeaderProps {
  onCreditsUpdate?: (newCredits: number) => void;
}

interface UserCredits {
  credits: number;
  freeLeadsUsed: number;
  freeLeadsAvailable: number;
  totalPurchased: number;
}

const CreditsDisplayHeader: React.FC<CreditsDisplayHeaderProps> = ({
  onCreditsUpdate
}) => {
  const [credits, setCredits] = useState<UserCredits>({
    credits: 0,
    freeLeadsUsed: 0,
    freeLeadsAvailable: 0,
    totalPurchased: 0
  });
  const [loading, setLoading] = useState(true);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/credits');
      const data = await response.json();
      
      if (data.success) {
        setCredits(data.data);
        onCreditsUpdate?.(data.data.credits);
      } else {
        message.error('Failed to load credits');
      }
    } catch (error) {
      console.error('Failed to load credits:', error);
      message.error('Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseComplete = (newBalance: number) => {
    setCredits(prev => ({
      ...prev,
      credits: newBalance
    }));
    onCreditsUpdate?.(newBalance);
    loadCredits(); // Refresh full data
  };

  const isLowCredits = credits.credits < 100;
  const isCriticalCredits = credits.credits < 10;

  return (
    <>
      <Card className="mb-4 border-0" bodyStyle={{ padding: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          {/* Main Credits Display */}
          <Col xs={24} sm={8} md={6}>
            <div className="text-center h-full p-3 rounded-lg border border-gray-200">
              <div className="flex justify-center items-center mb-1">
                <ThunderboltOutlined className="text-blue-500 mr-1 text-md" />
                <Text strong className="text-sm">Available Credits</Text>
              </div>
              <Statistic
                value={credits.credits}
                loading={loading}
                valueStyle={{ 
                  color: isCriticalCredits ? '#ff4d4f' : isLowCredits ? '#faad14' : '#52c41a',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
                className="mb-1"
              />
              {credits.totalPurchased > 0 && (
                <Text type="secondary" className="text-xs">
                  {credits.totalPurchased.toLocaleString()} purchased
                </Text>
              )}
            </div>
          </Col>

          {/* Free Leads Display */}
          <Col xs={24} sm={8} md={6}>
            <div className="text-center h-full p-3  rounded-lg border border-gray-200">
              <div className="flex justify-center items-center mb-1">
                <GiftOutlined className="text-green-500 mr-1 text-md" />
                <Text strong className="text-sm">Free Leads:  {credits.freeLeadsAvailable} available</Text>
              </div>
          
              <div className="flex justify-center mb-1">
                <Progress
                  percent={((credits.freeLeadsAvailable) / 5) * 100}
                  size="small"
                  showInfo={false}
                  strokeColor="#52c41a"
                  style={{ width: '70px' }}
                />
              </div>
              <Text type="secondary" className="text-xs">
                {credits.freeLeadsUsed}/5 used
              </Text>
            </div>
          </Col>

          {/* Cost Info */}
          <Col xs={24} sm={8} md={6}>
            <div className="text-center h-full p-3 rounded-lg border border-gray-200">
              <div className="flex justify-center items-center mb-1">
                <InfoCircleOutlined className="text-blue-500 mr-1 text-md" />
                <Text strong className="text-sm">Cost per Lead: 1 credit</Text>
              </div>

              <div className="text-xs text-gray-500">
                <div>Free leads first</div>
                <div>Then 1 credit each</div>
              </div>
            </div>
          </Col>

          {/* Action Buttons */}
          <Col xs={24} sm={24} md={6}>
            <div className="text-center h-full flex flex-col justify-center items-center md:items-end">
              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                onClick={() => setPurchaseModalVisible(true)}
                className="bg-darkGreen border-0 mb-2 w-full md:w-auto"
              >
                Buy Credits
              </Button>
              
              {(isLowCredits || credits.freeLeadsAvailable > 0) && (
                <div className="flex flex-col space-y-1 w-full md:w-auto">
                  {credits.freeLeadsAvailable > 0 && (
                    <Tag color="green" className="w-full md:w-auto justify-center text-xs py-1">
                      <GiftOutlined /> {credits.freeLeadsAvailable} free leads
                    </Tag>
                  )}
                  {isLowCredits && (
                    <Tag 
                      color={isCriticalCredits ? "red" : "orange"} 
                      className="w-full md:w-auto justify-center text-xs py-1"
                    >
                      {isCriticalCredits ? "Critical" : "Low"} credits
                    </Tag>
                  )}
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* Warning Alerts - Slimmer version */}
        {credits.freeLeadsAvailable === 0 && isCriticalCredits && (
          <Alert
            type="error"
            className="mt-3 py-2"
            message={
              <span className="text-sm">
                Out of free leads and low credits ({credits.credits} remaining). 
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => setPurchaseModalVisible(true)}
                  className="p-0 ml-1 text-sm"
                >
                  Buy credits now
                </Button>
              </span>
            }
            showIcon
          />
        )}
        
        {credits.freeLeadsAvailable === 0 && isLowCredits && !isCriticalCredits && (
          <Alert
            type="warning"
            className="mt-3 py-2"
            message={
              <span className="text-sm">
                Free leads exhausted. {credits.credits} credits remaining.
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => setPurchaseModalVisible(true)}
                  className="p-0 ml-1 text-sm"
                >
                  Buy more
                </Button>
              </span>
            }
            showIcon
            closable
          />
        )}
        
        {credits.freeLeadsAvailable > 0 && credits.credits === 0 && (
          <Alert
            type="info"
            className="mt-3 py-2"
            message={
              <span className="text-sm">
                Welcome! {credits.freeLeadsAvailable} free leads available.
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => setPurchaseModalVisible(true)}
                  className="p-0 ml-1 text-sm"
                >
                  View packages
                </Button>
              </span>
            }
            showIcon
            closable
          />
        )}
      </Card>

      <CreditsPurchaseModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        onPurchaseComplete={handlePurchaseComplete}
        currentCredits={credits.credits}
      />
    </>
  );
};

export default CreditsDisplayHeader;