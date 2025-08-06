// app/lead-generation/components/CreditPackages.tsx
import React from 'react';
import { Button, Card, Col, Row, Tag, Typography } from 'antd';

const { Title, Text } = Typography;

interface CreditPackage {
  credits: number;
  price: number;
  title: string;
  popular?: boolean;
  features: string[];
}

export interface CreditPackagesProps {
  onSelectPackage: (credits: number) => void;
}

export const CreditPackages: React.FC<CreditPackagesProps> = ({ onSelectPackage }) => {
  const packages: CreditPackage[] = [
    {
      title: 'Starter',
      credits: 1000,
      price: 99,
      features: [
        '~200-500 leads',
        'Basic targeting',
        'Email support'
      ]
    },
    {
      title: 'Professional',
      credits: 5000,
      price: 299,
      popular: true,
      features: [
        '~1,000-2,500 leads',
        'Advanced targeting',
        'Priority support',
        'Analytics dashboard'
      ]
    },
    {
      title: 'Enterprise',
      credits: 15000,
      price: 799,
      features: [
        '~3,000-7,500 leads',
        'Custom targeting',
        'Dedicated support',
        'API access',
        'Custom integrations'
      ]
    }
  ];

  return (
    <Card>
      <Title level={4} className="mb-6">
        Credit Packages
      </Title>
      <Row gutter={[24, 24]}>
        {packages.map((pkg) => (
          <Col key={pkg.title} xs={24} md={8}>
            <Card 
              className={`h-full ${pkg.popular ? 'border-2 border-blue-500' : 'border border-gray-200 dark:border-gray-700'}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-0 right-0 text-center">
                  <Tag color="blue" className="mx-auto">
                    Most Popular
                  </Tag>
                </div>
              )}
              <div className="text-center">
                <Title level={4} className="mb-2">
                  {pkg.title}
                </Title>
                <Title level={2} className="my-2">
                  ${pkg.price}
                </Title>
                <Text type="secondary" className="block mb-4">
                  {pkg.credits.toLocaleString()} Credits
                </Text>
                <ul className="text-sm space-y-2 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <Button 
                  block 
                  type={pkg.popular ? 'primary' : 'default'}
                  onClick={() => onSelectPackage(pkg.credits)}
                >
                  Choose Plan
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};