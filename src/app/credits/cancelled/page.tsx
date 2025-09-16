// app/credits/cancelled/page.tsx
"use client";
import React from 'react';
import { Card, Button, Typography, Space, Result } from 'antd';
import { CloseCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../providers/ThemeProvider';

const { Title, Text } = Typography;

const CancelledPage = () => {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <div style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: 24,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Card style={{ maxWidth: 600, width: '100%' }}>
        <Result
          status="warning"
          title="Payment Cancelled"
          subTitle="You cancelled the payment process. No charges were made to your account."
          icon={<CloseCircleOutlined style={{ color: '#faad14' }} />}
          extra={[
            <Button 
              type="primary" 
              key="retry" 
              icon={<ShoppingCartOutlined />}
              onClick={() => router.push('/lead-generation')}
              size="large"
            >
              Try Again
            </Button>,
            <Button 
              key="dashboard" 
              onClick={() => router.push('/lead-generation')}
            >
              Back to Dashboard
            </Button>,
          ]}
        />
        
        <div className="text-center mt-6">
          <Text type="secondary">
            You can purchase credits anytime to continue generating leads.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default CancelledPage;