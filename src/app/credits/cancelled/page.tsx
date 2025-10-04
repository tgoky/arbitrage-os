// app/credits/cancelled/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../providers/ThemeProvider';
import { 
  Button, 
  Card, 
  Typography, 
  Space, 
  Avatar, 
  Dropdown, 
  Row,
  Col,
  Result
} from 'antd';
import { 
  CloseCircleFilled,
  ShoppingCartOutlined,
  HomeOutlined,
  CreditCardOutlined,
  BellOutlined,
  DownOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

const CancelledPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      if (data.success) {
        setUserProfile(data.data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const displayName = userProfile?.name || userProfile?.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  const userMenuItems = [
    { key: 'profile', label: 'Profile' },
    { key: 'settings', label: 'Settings' },
    { key: 'logout', label: 'Logout' }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#f9fafb' 
    }}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-[#181919] border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-2`}>
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <img
              src={theme === 'dark' ? "/aoswhite.png" : "/aosblack.png"}
              alt="ArbitrageOS Logo"
              style={{ 
                height: '140px',
                width: 'auto',
                objectFit: 'contain',
                marginRight: '16px'
              }}
            />
          </div>
          
          <div className="flex-1 text-center">
            <Title level={4} className="mb-0" style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
              Payment Cancelled
            </Title>
          </div>

          <Space size="middle">
            <Button 
              type="text" 
              icon={<BellOutlined />} 
              style={{
                color: theme === 'dark' ? '#fff' : '#000'
              }}
            />
            
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <Button type="text" className="flex items-center gap-2">
                <Avatar 
                  size="small" 
                  style={{ backgroundColor: '#1890ff' }}
                  icon={<UserOutlined />}
                >
                  {userInitial}
                </Avatar>
                <div className="flex flex-col items-start">
                  <Text 
                    style={{ 
                      color: theme === 'dark' ? '#fff' : '#000',
                      fontSize: '12px',
                      lineHeight: 1.2
                    }}
                  >
                    {displayName}
                  </Text>
                </div>
                <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-4xl">
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} lg={16}>
              <Card bodyStyle={{ padding: '40px' }}>
                <Result
                  status="warning"
                  icon={<CloseCircleFilled style={{ color: '#faad14' }} />}
                  title="Payment Cancelled"
                  subTitle="You cancelled the payment process. No charges were made to your account."
                  extra={[
                    <Button 
                      type="primary" 
                      key="retry" 
                      icon={<ShoppingCartOutlined />}
                      onClick={() => router.push('/credits')}
                      size="large"
                      style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
                    >
                      Purchase Credits
                    </Button>,
                    <Button 
                      key="dashboard" 
                      onClick={() => router.push('/lead-generation')}
                      size="large"
                    >
                      Back to Dashboard
                    </Button>,
                  ]}
                />
                
                <div className="text-center mt-8">
                  <Text type="secondary">
                    You can purchase credits anytime to continue generating leads with arbitrageOS.
                  </Text>
                </div>
              </Card>
            </Col>

            {/* Additional Information Cards */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" size={16} className="w-full">
                {/* Why Credits Card */}
                <Card 
                  size="small" 
                  title="Why Purchase Credits?" 
                  bodyStyle={{ padding: '16px' }}
                >
                  <Space direction="vertical" size={12} className="w-full">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CreditCardOutlined className="text-blue-600 text-xs" />
                      </div>
                      <Text className="text-sm">
                        Generate unlimited leads with AI-powered tools
                      </Text>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CreditCardOutlined className="text-green-600 text-xs" />
                      </div>
                      <Text className="text-sm">
                        Access premium features and higher quality data
                      </Text>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CreditCardOutlined className="text-purple-600 text-xs" />
                      </div>
                      <Text className="text-sm">
                        Scale your arbitrage business efficiently
                      </Text>
                    </div>
                  </Space>
                </Card>

                {/* Next Steps Card */}
                <Card 
                  size="small" 
                  title="What's Next?" 
                  bodyStyle={{ padding: '16px' }}
                >
                  <Space direction="vertical" size={12} className="w-full">
                    <div className="flex items-center justify-between">
                      <Text className="text-sm">Try free leads first</Text>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Text className="text-sm">Explore credit packages</Text>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Text className="text-sm">Contact support</Text>
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                  </Space>
                </Card>

                {/* Quick Action Card */}
                <Card 
                  hoverable
                  size="small" 
                  bodyStyle={{ 
                    padding: '20px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '1px solid #fbbf24'
                  }}
                  onClick={() => router.push('/credits')}
                >
                  <ShoppingCartOutlined style={{ fontSize: '24px', color: '#d97706', marginBottom: '8px' }} />
                  <Title level={5} className="mb-1" style={{ color: '#92400e' }}>
                    Ready to Continue?
                  </Title>
                  <Text className="text-sm" style={{ color: '#92400e' }}>
                    Return to credits page to explore packages
                  </Text>
                </Card>
              </Space>
            </Col>
          </Row>
        </div>
      </main>

      {/* Footer */}
      <footer className={`${theme === 'dark' ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} border-t px-6 py-2`}>
        <div className="flex items-center justify-center">
          <Text type="secondary" className="text-xs">
            <span style={{ color: '#5CC49D' }}>arbitrage</span>OS by{' '}
            <span style={{ color: '#5CC49D' }}>GrowAI</span>
            {' '}© 2025 • Automate & Grow
          </Text>
        </div>
      </footer>
    </div>
  );
};

export default CancelledPage;