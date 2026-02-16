// app/credits/success/page.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '../../../providers/ThemeProvider';
import { 
  Button, 
  Card, 
  Modal, 
  Typography, 
  Space, 
  Avatar, 
  Dropdown, 
  Row,
  Col,
  Statistic,
  Result,
  Progress,
  Tag
} from 'antd';
import { 
  CheckCircleFilled,
  ArrowLeftOutlined,
  CreditCardOutlined,
  ThunderboltOutlined,
  HomeOutlined,
  HistoryOutlined,
  LoadingOutlined,
  CloseCircleFilled,
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

const SuccessPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setError('No session ID provided');
      setLoading(false);
    }
    loadUserProfile();
  }, [sessionId]);

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

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/credits/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment verification failed');
      }

      console.log('  Payment verified:', data.data);
      
      setPurchaseDetails({
        verified: true,
        sessionId,
        packageName: data.data.purchase.packageName,
        credits: data.data.purchase.credits,
        newBalance: data.data.userCredits.currentBalance,
        amountPaid: data.data.session.amountTotal / 100, // Convert from cents
        purchaseDate: new Date(data.data.purchase.timestamp).toLocaleDateString(),
        timestamp: data.data.purchase.timestamp
      });
      
      setLoading(false);
      
    } catch (error) {
      console.error('Payment verification error:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify payment');
      setLoading(false);
    }
  };

  const displayName = userProfile?.name || userProfile?.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  const userMenuItems = [
    { key: 'profile', label: 'Profile' },
    { key: 'settings', label: 'Settings' },
    { key: 'logout', label: 'Logout' }
  ];

  // Loading state
  if (loading) {
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
                Processing Payment
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
          <Card className="w-full max-w-md text-center" bodyStyle={{ padding: '40px' }}>
            <div className="flex justify-center mb-6">
              <LoadingOutlined style={{ fontSize: 48, color: '#5CC49D' }} spin />
            </div>
            
            <Title level={3} className="mb-2">Verifying Your Payment</Title>
            <Text type="secondary" className="mb-6 block">
              This will only take a moment...
            </Text>
            
            <Progress 
              percent={100}
              strokeColor="#5CC49D"
              trailColor={theme === 'dark' ? '#374151' : '#f0f0f0'}
              status="active"
              showInfo={false}
            />
          </Card>
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
  }

  // Error state
  if (error) {
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
                Payment Error
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
          <Card className="w-full max-w-md" bodyStyle={{ padding: '40px' }}>
            <Result
              status="error"
              title="Payment Verification Failed"
              subTitle={error}
              extra={[
                <Button 
                  key="back" 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push('/credits')}
                >
                  Back to Credits
                </Button>,
                <Button 
                  key="dashboard" 
                  type="primary"
                  onClick={() => router.push('/lead-generation')}
                >
                  Continue to Dashboard
                </Button>,
              ]}
            >
              <div className="text-center">
                <Text type="secondary">
                  Please contact support if you believe this is an error.
                </Text>
                {sessionId && (
                  <div className="mt-4 p-3  rounded-lg">
                    <Text type="secondary" className="text-xs block mb-1">Session ID:</Text>
                    <code className="text-xs break-all">{sessionId}</code>
                  </div>
                )}
              </div>
            </Result>
          </Card>
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
  }

  // Success state
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
              Payment Successful
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
      <main className="flex-1 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Success Result */}
          <Card className="mb-6" bodyStyle={{ padding: '40px' }}>
            <Result
              icon={<CheckCircleFilled style={{ color: '#52c41a' }} />}
              title="Payment Successful!"
              subTitle="Thank you for your purchase. Your credits have been added to your account."
              extra={[
                <Button 
                  key="generate" 
                  type="primary" 
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={() => router.push('/lead-generation')}
                  style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
                >
                  Start Generating Leads
                </Button>,
                <Button 
                  key="history" 
                  size="large"
                  icon={<HistoryOutlined />}
                  onClick={() => router.push('/credits')}
                >
                  View Credit History
                </Button>,
              ]}
            />
          </Card>

          {/* Purchase Details */}
          {purchaseDetails && (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Purchase Details" bodyStyle={{ padding: '24px' }}>
                  <Space direction="vertical" size="large" className="w-full">
                    <div className="flex items-center justify-between">
                      <Text strong>Package:</Text>
                      <Tag color="blue">{purchaseDetails.packageName}</Tag>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Text strong>Amount Paid:</Text>
                      <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                        ${purchaseDetails.amountPaid.toFixed(2)}
                      </Text>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Text strong>Purchase Date:</Text>
                      <Text>{purchaseDetails.purchaseDate}</Text>
                    </div>
                    
                    {sessionId && (
                      <div>
                        <Text strong className="block mb-2">Session ID:</Text>
                        <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                          {sessionId}
                        </code>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="Credit Balance" bodyStyle={{ padding: '24px' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="Credits Added"
                        value={purchaseDetails.credits}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<ThunderboltOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="New Balance"
                        value={purchaseDetails.newBalance}
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<CreditCardOutlined />}
                      />
                    </Col>
                  </Row>
                  
                  <div className="mt-4 p-3  border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleFilled style={{ color: '#52c41a', marginRight: '8px' }} />
                      <Text type="secondary" className="text-sm">
                        Your credits are ready to use immediately
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          )}

          {/* Quick Actions */}
          <Card title="Quick Actions" className="mt-6" bodyStyle={{ padding: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card 
                  hoverable 
                  size="small" 
                  onClick={() => router.push('/lead-generation')}
                  bodyStyle={{ textAlign: 'center', padding: '20px' }}
                >
                  <ThunderboltOutlined style={{ fontSize: '24px', color: '#5CC49D', marginBottom: '8px' }} />
                  <Title level={5} className="mb-1">Generate Leads</Title>
                  <Text type="secondary" className="text-sm">
                    Start using your new credits
                  </Text>
                </Card>
              </Col>
              
              <Col xs={24} sm={8}>
                <Card 
                  hoverable 
                  size="small" 
                  onClick={() => router.push('/credits')}
                  bodyStyle={{ textAlign: 'center', padding: '20px' }}
                >
                  <HistoryOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                  <Title level={5} className="mb-1">View History</Title>
                  <Text type="secondary" className="text-sm">
                    Check your transaction history
                  </Text>
                </Card>
              </Col>
              
              <Col xs={24} sm={8}>
                <Card 
                  hoverable 
                  size="small" 
                  onClick={() => router.push('/')}
                  bodyStyle={{ textAlign: 'center', padding: '20px' }}
                >
                  <HomeOutlined style={{ fontSize: '24px', color: '#fa8c16', marginBottom: '8px' }} />
                  <Title level={5} className="mb-1">Dashboard</Title>
                  <Text type="secondary" className="text-sm">
                    Return to homepage
                  </Text>
                </Card>
              </Col>
            </Row>
          </Card>
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

export default SuccessPage;