// components/CreditsPurchaseModal.tsx - FULLY CORRECTED
"use client";
import React, { useState, useEffect } from 'react';
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
  ThunderboltOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';

import { ConfigProvider } from "antd";

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
  stripePriceId: string;
  popular?: boolean;
  features: string[];
}

// Initialize Stripe with error handling
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

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
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load packages when modal opens
  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/credits/packages');
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.data);
        // Auto-select popular package or first package that meets requirements
        const popularPackage = data.data.find((pkg: CreditPackage) => pkg.popular);
        const sufficientPackage = data.data.find((pkg: CreditPackage) => 
          pkg.credits >= requiredCredits
        );
        
        if (sufficientPackage) {
          setSelectedPackage(sufficientPackage.id);
        } else if (popularPackage) {
          setSelectedPackage(popularPackage.id);
        } else if (data.data.length > 0) {
          setSelectedPackage(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
      message.error('Failed to load credit packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      message.error('Please select a package');
      return;
    }

    setProcessingPayment(true);
    
    try {
      console.log('🛒 Starting purchase for package:', selectedPackage);
      
      // Create checkout session
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      console.log('  Checkout session created:', data.data.sessionId);
      console.log('  Checkout URL:', data.data.url);

      // Direct redirect to Stripe checkout URL instead of using Stripe JS
      if (data.data.url) {
        console.log('🔄 Redirecting directly to Stripe checkout URL...');
        window.location.href = data.data.url;
        return;
      }

      // Fallback to Stripe JS method
      if (!stripePromise) {
        throw new Error('Payment system not configured and no direct URL available');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      console.log('🔍 About to redirect to checkout with session:', data.data.sessionId);

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.data.sessionId,
      });

      if (error) {
        console.error('🚨 Stripe redirect error:', error);
        throw new Error(error.message || 'Checkout redirection failed');
      }

    } catch (error) {
      console.error('Purchase error:', error);
      message.error(error instanceof Error ? error.message : 'Purchase failed');
      setProcessingPayment(false);
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
      onCancel={() => {
        if (!processingPayment) {
          onClose();
        }
      }}
      footer={null}
      width={800}
      centered
      closable={!processingPayment}
      maskClosable={!processingPayment}
    >
      <div className="space-y-6">
        {requiredCredits > currentCredits && (
          <Alert
            type="info"
            message={`You need at least ${requiredCredits} credits but only have ${currentCredits}. Purchase more credits to continue.`}
            showIcon
          />
        )}

        {processingPayment && (
          <Alert
            type="info"
            message={
              <div className="flex items-center">
                <LoadingOutlined className="mr-2" />
                <span>Redirecting to secure payment checkout...</span>
              </div>
            }
            showIcon
          />
        )}

        <Row gutter={24}>
          <Col span={16}>
            <Title level={4}>Choose a Credit Package</Title>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">

                  <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
     <Spin size="large" />
</ConfigProvider>

             
                </div>
              ) : (
                packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`cursor-pointer transition-all ${
                      selectedPackage === pkg.id 
                        ? 'border-blue-500 shadow-md' 
                        : 'hover:border-gray-400'
                    } ${processingPayment ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => !processingPayment && setSelectedPackage(pkg.id)}
                    extra={
                      <Space>
                        {pkg.popular && (
                          <Tag color="gold" icon={<StarOutlined />}>
                            Popular
                          </Tag>
                        )}
                        {requiredCredits > 0 && pkg.credits >= requiredCredits && (
                          <Tag color="green">
                            ✓ Sufficient
                          </Tag>
                        )}
                      </Space>
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
                        <Text type="secondary" className="text-xs">
                          ${(pkg.price / pkg.credits).toFixed(3)} per credit
                        </Text>
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
                ))
              )}
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
                    loading={processingPayment}
                    onClick={handlePurchase}
                    disabled={loading || processingPayment || !selectedPkg}
                    icon={<CreditCardOutlined />}
                  >
                    {processingPayment ? 'Redirecting...' : `Purchase for $${selectedPkg.price}`}
                  </Button>
                  
                  <Text type="secondary" className="text-xs block text-center">
                    🔒 Secure payment processing with Stripe
                  </Text>
                </div>
              ) : (
                <div className="text-center py-8">
                  {loading ? (

                    <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
  <Spin size="small" />
</ConfigProvider>
                  
                  ) : (
                    <Text type="secondary">Select a package to see order summary</Text>
                  )}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default CreditsPurchaseModal;