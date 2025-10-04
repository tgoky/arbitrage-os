// app/credits/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers/ThemeProvider';
import CreditsPurchaseModal from '../../components/credits/CreditsDisplayModal';
import { 
  Button, 
  Card, 
  Input, 
  Modal, 
  Typography, 
  Progress, 
  Space, 
  Avatar, 
  Dropdown, 
  Badge,
  Row,
  Col,
  Empty,
  Popover,
  List,
  Select,
  Statistic
} from 'antd';
import { 
  CreditCardOutlined, 
  ThunderboltOutlined, 
  GiftOutlined, 
  HistoryOutlined, 
  DownloadOutlined, 
  ShoppingCartOutlined, 
  InfoCircleOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  BellOutlined,
  DownOutlined,
  RiseOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
  reference_id?: string;
  metadata?: any;
  workspace?: {
    name: string;
    slug: string;
  };
}

interface UserCredits {
  credits: number;
  freeLeadsUsed: number;
  freeLeadsAvailable: number;
  totalPurchased: number;
}

interface UsageStats {
  creditsUsed: number;
  freeLeadsUsed: number;
  generationsCount: number;
  totalLeadsGenerated: number;
  timeframe: string;
}

interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

const CreditsHistoryPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [userCredits, setUserCredits] = useState<UserCredits>({
    credits: 0,
    freeLeadsUsed: 0,
    freeLeadsAvailable: 0,
    totalPurchased: 0
  });
  const [usageStats, setUsageStats] = useState<UsageStats>({
    creditsUsed: 0,
    freeLeadsUsed: 0,
    generationsCount: 0,
    totalLeadsGenerated: 0,
    timeframe: 'month'
  });
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadData();
    loadUserProfile();
  }, [timeframe]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user credits
      const creditsResponse = await fetch('/api/user/credits');
      const creditsData = await creditsResponse.json();
      
      if (creditsData.success) {
        setUserCredits(creditsData.data);
      }

      // Load transaction history
      const historyResponse = await fetch(`/api/user/credits/history?timeframe=${timeframe}`);
      const historyData = await historyResponse.json();
      
      if (historyData.success) {
        setTransactions(historyData.data.transactions || []);
        setUsageStats(historyData.data.stats || usageStats);
      }
      
    } catch (error) {
      console.error('Failed to load credits data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handlePurchaseComplete = (newBalance: number) => {
    setUserCredits(prev => ({ ...prev, credits: newBalance }));
    loadData(); // Refresh all data
  };

  const handleExportHistory = () => {
    if (transactions.length === 0) return;
    
    const csvHeaders = ['Date', 'Type', 'Amount', 'Description', 'Reference ID'];
    const csvRows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleDateString(),
      tx.transaction_type,
      tx.amount.toString(),
      tx.description,
      tx.reference_id || ''
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `credits_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return '#52c41a'; // Green
      case 'usage': return '#1890ff'; // Blue
      case 'free_usage': return '#fa8c16'; // Orange
      case 'refund': return '#722ed1'; // Purple
      case 'bonus': return '#faad14'; // Gold
      default: return '#8c8c8c'; // Gray
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <CreditCardOutlined style={{ color: getTransactionTypeColor(type) }} />;
      case 'usage': return <ThunderboltOutlined style={{ color: getTransactionTypeColor(type) }} />;
      case 'free_usage': return <GiftOutlined style={{ color: getTransactionTypeColor(type) }} />;
      default: return <HistoryOutlined style={{ color: getTransactionTypeColor(type) }} />;
    }
  };

  const formatAmount = (amount: number) => {
    return (
      <span style={{ 
        color: amount > 0 ? '#52c41a' : amount < 0 ? '#ff4d4f' : '#666',
        fontWeight: 'bold'
      }}>
        {amount > 0 ? '+' : ''}{amount}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(tx => 
    transactionType === 'all' || tx.transaction_type === transactionType
  );

  const displayName = userProfile?.name || userProfile?.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  const userMenuItems = [
    { key: 'profile', label: 'Profile' },
    { key: 'settings', label: 'Settings' },
    { key: 'logout', label: 'Logout' }
  ];

  return (
    <div className="min-h-screen w-full" style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#f9fafb' 
    }}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-[#181919] border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-2`}>
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
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

          {/* Page Title */}
          <div className="flex-1 text-center">
            <Title level={4} className="mb-0" style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
              Credits & History
            </Title>
          </div>

          {/* User Menu */}
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
                {userProfile?.avatar ? (
                  <Avatar 
                    size="small" 
                    src={userProfile.avatar}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                ) : (
                  <Avatar 
                    size="small" 
                    style={{ backgroundColor: '#1890ff' }}
                  >
                    {userInitial}
                  </Avatar>
                )}
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
                  {userProfile?.email && (
                    <Text 
                      style={{ 
                        color: theme === 'dark' ? '#9ca3af' : '#666',
                        fontSize: '10px',
                        lineHeight: 1.2
                      }}
                    >
                      {userProfile.email.length > 20 
                        ? `${userProfile.email.substring(0, 20)}...` 
                        : userProfile.email
                      }
                    </Text>
                  )}
                </div>
                <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 py-6">
        {/* Header Section */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Title level={3} className="mb-1" style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
              Credits Management
            </Title>
            <Text type="secondary" className="text-sm">
              Manage your credits, view transaction history, and track usage
            </Text>
          </div>
          
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Back
            </Button>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setPurchaseModalVisible(true)}
              style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
            >
              Buy Credits
            </Button>
          </Space>
        </div>

        {/* Credit Balance Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small" 
              className="h-full" 
              bodyStyle={{ padding: '16px' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <Text type="secondary" className="text-xs block mb-1">Available Credits</Text>
                  <Title level={3} className="mb-0" style={{ marginBottom: 0, color: '#52c41a' }}>
                    {userCredits.credits}
                  </Title>
                  <Progress 
                    percent={100}
                    strokeColor="#52c41a"
                    trailColor={theme === 'dark' ? '#374151' : '#f0f0f0'}
                    size="small"
                    showInfo={false}
                    className="mt-2"
                  />
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ThunderboltOutlined className="text-green-600 text-lg" />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small" 
              className="h-full" 
              bodyStyle={{ padding: '16px' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <Text type="secondary" className="text-xs block mb-1">Free Leads Remaining</Text>
                  <Title level={3} className="mb-0" style={{ marginBottom: 0, color: '#1890ff' }}>
                    {userCredits.freeLeadsAvailable}<span className="text-sm font-normal">/5</span>
                  </Title>
                  <Progress 
                    percent={(userCredits.freeLeadsAvailable / 5) * 100}
                    strokeColor="#1890ff"
                    trailColor={theme === 'dark' ? '#374151' : '#f0f0f0'}
                    size="small"
                    showInfo={false}
                    className="mt-2"
                  />
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <GiftOutlined className="text-blue-600 text-lg" />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small" 
              className="h-full" 
              bodyStyle={{ padding: '16px' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <Text type="secondary" className="text-xs block mb-1">Total Purchased</Text>
                  <Title level={3} className="mb-0" style={{ marginBottom: 0, color: '#722ed1' }}>
                    {userCredits.totalPurchased}
                  </Title>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCardOutlined className="text-purple-600 text-lg" />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small" 
              className="h-full" 
              bodyStyle={{ padding: '16px' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <Text type="secondary" className="text-xs block mb-1">Leads Generated</Text>
                  <Title level={3} className="mb-0" style={{ marginBottom: 0, color: '#eb2f96' }}>
                    {usageStats.totalLeadsGenerated}
                  </Title>
                  <Text type="secondary" className="text-xs block mt-1">
                    This {timeframe}
                  </Text>
                </div>
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <RiseOutlined className="text-pink-600 text-lg" />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Usage Statistics */}
        <Card className="mb-6" bodyStyle={{ padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <InfoCircleOutlined className="text-white text-sm" />
              </div>
              <Title level={4} className="mb-0">Usage Statistics</Title>
            </div>
            
            <Select 
              value={timeframe}
              onChange={(value) => setTimeframe(value)}
              style={{ width: 120 }}
            >
              <Option value="week">This Week</Option>
              <Option value="month">This Month</Option>
              <Option value="all">All Time</Option>
            </Select>
          </div>
          
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <div className="text-center">
                <Statistic
                  value={usageStats.creditsUsed}
                  valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
                />
                <Text type="secondary" className="text-sm">Credits Used</Text>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="text-center">
                <Statistic
                  value={usageStats.freeLeadsUsed}
                  valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                />
                <Text type="secondary" className="text-sm">Free Leads Used</Text>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="text-center">
                <Statistic
                  value={usageStats.generationsCount}
                  valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                />
                <Text type="secondary" className="text-sm">Generations</Text>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="text-center">
                <Statistic
                  value={usageStats.totalLeadsGenerated}
                  valueStyle={{ color: '#722ed1', fontSize: '24px' }}
                />
                <Text type="secondary" className="text-sm">Total Leads</Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Transaction History */}
        <Card bodyStyle={{ padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <HistoryOutlined className="text-white text-sm" />
              </div>
              <Title level={4} className="mb-0">Transaction History</Title>
            </div>
            
            <Space>
              <Select 
                value={transactionType}
                onChange={setTransactionType}
                style={{ width: 140 }}
              >
                <Option value="all">All Types</Option>
                <Option value="purchase">Purchases</Option>
                <Option value="usage">Usage</Option>
                <Option value="free_usage">Free Usage</Option>
              </Select>
              
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportHistory}
                disabled={filteredTransactions.length === 0}
              >
                Export CSV
              </Button>
            </Space>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <LoadingOutlined style={{ fontSize: 24, color: '#5CC49D' }} spin />
              </div>
              <Text type="secondary">Loading transactions...</Text>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className={`grid grid-cols-12 gap-4 p-4 font-semibold text-sm ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="col-span-3">Date</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Reference</div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className={`grid grid-cols-12 gap-4 p-4 border-b ${
                      theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
                    } transition-colors duration-150 items-center`}
                  >
                    <div className="col-span-3">
                      <div className="font-medium">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-center gap-2">
                      {getTransactionIcon(tx.transaction_type)}
                      <span className="capitalize">
                        {tx.transaction_type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="col-span-2 text-right">
                      <div className="font-semibold">
                        {formatAmount(tx.amount)}
                      </div>
                      {tx.transaction_type === 'free_usage' && (
                        <div className="text-xs text-gray-500">(Free)</div>
                      )}
                    </div>
                    
                    <div className="col-span-3">
                      <div className="font-medium truncate">{tx.description}</div>
                      {tx.workspace && (
                        <div className="text-xs text-gray-500 truncate">
                          Workspace: {tx.workspace.name}
                        </div>
                      )}
                    </div>
                    
                    <div className="col-span-2">
                      {tx.reference_id ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {tx.reference_id.substring(0, 12)}...
                        </code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Title level={4} className="mb-2">No transactions found</Title>
                    <Text type="secondary" className="text-sm">
                      {transactionType !== 'all' 
                        ? `No ${transactionType.replace('_', ' ')} transactions in this period`
                        : 'No transactions recorded yet'
                      }
                    </Text>
                  </div>
                }
              >
                <Button 
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => setPurchaseModalVisible(true)}
                  style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
                >
                  Make Your First Purchase
                </Button>
              </Empty>
            </div>
          )}
        </Card>
      </main>

      {/* Footer */}
      <footer className={`${theme === 'dark' ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} border-t mt-auto px-6 py-2`}>
        <div className="flex items-center justify-center">
          <Text type="secondary" className="text-xs">
            <span style={{ color: '#5CC49D' }}>arbitrage</span>OS by{' '}
            <span style={{ color: '#5CC49D' }}>GrowAI</span>
            {' '}© 2025 • Automate & Grow
          </Text>
        </div>
      </footer>

      <CreditsPurchaseModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        onPurchaseComplete={handlePurchaseComplete}
        currentCredits={userCredits.credits}
      />
    </div>
  );
};

export default CreditsHistoryPage;