// app/dashboard/components/WelcomePanel.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Typography, Grid, Statistic, Space, Spin, message } from 'antd';
import { 
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  RocketOutlined 
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';

const { Title } = Typography;
const { useBreakpoint } = Grid;

interface WelcomePanelProps {
  workspaceName: string;
  workspaceId?: string;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({
  workspaceName,
  workspaceId
}) => {
  const { theme } = useTheme();
  const screens = useBreakpoint();
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch work items data (same logic as IntegratedWorkDashboard)
  const fetchAllWorkItems = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching work items for welcome panel...');
      const url = new URL('/api/dashboard/work-items', window.location.origin);
      if (workspaceId) {
        url.searchParams.append('workspaceId', workspaceId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch work items: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      if (data.success && Array.isArray(data.data?.items)) {
        console.log(`🎉 Successfully fetched ${data.data.items.length} work items for welcome panel`);
        setWorkItems(data.data.items);
      } else {
        throw new Error(data.error || 'Invalid response format from unified API');
      }
    } catch (error) {
      console.error('💥 Error fetching work items for welcome panel:', error);
      message.error('Failed to load work items');
      setWorkItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchAllWorkItems();
  }, [workspaceId]);

  // Calculate summary stats (same logic as IntegratedWorkDashboard)
  const summaryStats = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const thisMonthItems = workItems.filter(item => new Date(item.createdAt) >= thisMonth);
    const lastMonthItems = workItems.filter(item => {
      const date = new Date(item.createdAt);
      return date >= lastMonth && date < thisMonth;
    });
    
    const thisMonthGrowth = lastMonthItems.length > 0 
      ? Math.round(((thisMonthItems.length - lastMonthItems.length) / lastMonthItems.length) * 100)
      : 0;

    const processingItems = workItems.filter(item => item.status === 'processing').length;
    const completedItems = workItems.filter(item => item.status === 'completed').length;

    return [
      { 
        title: 'Total Generated', 
        value: workItems.length, 
        icon: <FileTextOutlined />, 
        color: '#1890ff', 
        growth: 12 
      },
      { 
        title: 'This Month', 
        value: thisMonthItems.length, 
        icon: <CalendarOutlined />, 
        color: '#52c41a', 
        growth: thisMonthGrowth 
      },
      { 
        title: 'In Progress', 
        value: processingItems, 
        icon: <BarChartOutlined />, 
        color: '#faad14', 
        growth: 0 
      },
      { 
        title: 'Completed', 
        value: completedItems, 
        icon: <RocketOutlined />, 
        color: '#13c2c2', 
        growth: 5 
      }
    ];
  }, [workItems]);

  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
      padding: screens.xs ? '8px' : '10px',
      borderRadius: '8px',
      minHeight: 'auto',
    },
  });

  const getParentCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
      padding: screens.xs ? '12px' : '16px',
      borderRadius: '12px',
    },
  });

  if (loading) {
    return (
      <div data-tour="welcome-panel" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title
            level={2}
            style={{
              margin: 0,
              color: theme === 'dark' ? '#f9fafb' : '#111827',
              fontWeight: 700,
              fontSize: '22px',
            }}
          >
            Welcome to {workspaceName} Arbitrage-OS !
          </Title>
        </div>
        <Card
          styles={getParentCardStyles()}
          style={{ borderColor: theme === 'dark' ? '#374151' : '#E5E7EB' }}
        >
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
              Loading your statistics...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div data-tour="welcome-panel" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title
          level={2}
          style={{
            margin: 0,
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            fontWeight: 700,
            fontSize: '22px',
          }}
        >
          Welcome to {workspaceName} Arbitrage-OS !
        </Title>
        <Space>
          <Button
            type="default"
            size="small"
            onClick={fetchAllWorkItems}
            loading={loading}
            style={{
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#e5e7eb' : '#1a1a1a',
              borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
            }}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Stats Overview Section */}
      <Card
        styles={getParentCardStyles()}
        style={{
          borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
            gap: screens.xs ? '8px' : '12px',
          }}
        >
          {summaryStats.map((stat, index) => (
            <Card key={index} styles={getCardStyles()} bordered={false}>
              <Statistic
                title={
                  <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '12px' }}>
                    {stat.title}
                  </span>
                }
                value={stat.value}
                valueStyle={{ 
                  color: theme === 'dark' ? '#F9FAFB' : '#111827', 
                  fontSize: '16px',
                  lineHeight: '1.2'
                }}
                prefix={
                  <span style={{ color: stat.color, fontSize: '14px', marginRight: '4px' }}>
                    {stat.icon}
                  </span>
                }
              />
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default WelcomePanel;