// components/CreditsPurchaseModal.tsx
"use client";
import React, { useState } from 'react';
import {
  Modal,
  Card,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Statistic,
  Alert,
  Spin,
  message
} from 'antd';
import {
  CreditCardOutlined,
  CheckCircleOutlined,
  StarOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface CreditsPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseComplete?: (newBalance: number) => void;
  currentCredits?: number;
  requiredCredits?: number;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  features: string[];
}

const CreditsPurchaseModal: React.FC<CreditsPurchaseModalProps> = ({
  visible,
  onClose,
  onPurchaseComplete,
  currentCredits = 0,
  requiredCredits = 0
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);

  // Load packages when modal opens
  React.useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    try {
      const response = await fetch('/api/credits/packages');
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.data);
        // Auto-select popular package
        const popularPackage = data.data.find((pkg: CreditPackage) => pkg.popular);
        if (popularPackage) {
          setSelectedPackage(popularPackage.id);
        }
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
      message.error('Failed to load credit packages');
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      message.error('Please select a package');
      return;
    }

    setLoading(true);
    
    try {
      // In a real implementation, you would integrate with Stripe here
      // For now, we'll simulate a successful purchase
      const mockPaymentIntentId = `pi_mock_${Date.now()}`;
      
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage,
          paymentIntentId: mockPaymentIntentId,
          // You would include real Stripe payment data here
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success(`Successfully purchased ${data.data.creditsAdded} credits!`);
        onPurchaseComplete?.(data.data.newBalance);
        onClose();
      } else {
        throw new Error(data.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      message.error(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);

  return (
    <Modal
      title={
        <Space>
          <CreditCardOutlined />
          <span>Purchase Credits</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <div className="space-y-6">
        {requiredCredits > currentCredits && (
          <Alert
            type="info"
            message={`You need ${requiredCredits} credits but only have ${currentCredits}. Purchase more credits to continue.`}
            showIcon
          />
        )}

        <Row gutter={24}>
          <Col span={16}>
            <Title level={4}>Choose a Credit Package</Title>
            <div className="space-y-4">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`cursor-pointer transition-all ${
                    selectedPackage === pkg.id 
                      ? 'border-blue-500 shadow-md' 
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                  extra={
                    pkg.popular && (
                      <Tag color="gold" icon={<StarOutlined />}>
                        Popular
                      </Tag>
                    )
                  }
                >
                  <Row align="middle">
                    <Col span={8}>
                      <Title level={5} className="mb-1">
                        {pkg.name}
                      </Title>
                      <Text className="text-3xl font-bold text-blue-600">
                        ${pkg.price}
                      </Text>
                    </Col>
                    <Col span={8} className="text-center">
                      <Statistic
                        title="Credits"
                        value={pkg.credits.toLocaleString()}
                        prefix={<ThunderboltOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <div className="space-y-1">
                        {pkg.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <CheckCircleOutlined className="text-green-500 mr-2" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          </Col>

          <Col span={8}>
            <Card title="Order Summary" className="sticky top-4">
              {selectedPkg ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Text>Package:</Text>
                    <Text strong>{selectedPkg.name}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Credits:</Text>
                    <Text strong>{selectedPkg.credits.toLocaleString()}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Current Balance:</Text>
                    <Text>{currentCredits.toLocaleString()}</Text>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <Text strong>New Balance:</Text>
                    <Text strong className="text-green-600">
                      {(currentCredits + selectedPkg.credits).toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex justify-between text-lg">
                    <Text strong>Total:</Text>
                    <Text strong className="text-2xl">${selectedPkg.price}</Text>
                  </div>
                  
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={loading}
                    onClick={handlePurchase}
                    icon={<CreditCardOutlined />}
                  >
                    {loading ? 'Processing...' : `Purchase for $${selectedPkg.price}`}
                  </Button>
                  
                  <Text type="secondary" className="text-xs block text-center">
                    🔒 Secure payment processing with Stripe
                  </Text>
                </div>
              ) : (
                <Text type="secondary">Select a package to see order summary</Text>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default CreditsPurchaseModal;