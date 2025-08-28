import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

interface WorkItem {
  id: string;
  createdAt: string;
  status: 'processing' | 'completed' | 'failed' | string;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({
  workspaceName,
  workspaceId
}) => {
  const { theme } = useTheme();
  const screens = useBreakpoint();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null); // Changed from string | null to Error | null
  const [retryCount, setRetryCount] = useState(0);

  const fetchAllWorkItems = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('🔄 Fetching work items for welcome panel...', { workspaceId, retryCount });
      
      const url = new URL('/api/dashboard/work-items', window.location.origin);
      if (workspaceId) {
        url.searchParams.append('workspaceId', workspaceId);
      }
      
      url.searchParams.append('_t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('authToken') && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        },
        cache: 'no-cache'
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 API Response data:', data);

      if (data.success && Array.isArray(data.data?.items)) {
        console.log(`🎉 Successfully fetched ${data.data.items.length} work items for welcome panel`);
        setWorkItems(data.data.items);
        setRetryCount(0);
      } else if (data.data?.items === undefined || data.data?.items === null) {
        console.warn('⚠️ No items found in response, setting empty array');
        setWorkItems([]);
      } else {
        throw new Error(data.error || 'Invalid response format from unified API');
      }
    } catch (error) {
      console.error('💥 Error fetching work items for welcome panel:', error);
      // Ensure error is always an Error object
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);
      
      // Don't show error message for auth issues, let parent handle redirect
      if (!errorObj.message.includes('Authentication')) {
        message.error(`Failed to load work items: ${errorObj.message}`);
      }
      
      setWorkItems([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, retryCount]);

  const handleRetry = useCallback(async () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        fetchAllWorkItems(true);
      }, 1000 * (retryCount + 1));
    }
  }, [fetchAllWorkItems, retryCount]);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await fetchAllWorkItems();
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [fetchAllWorkItems]);

  useEffect(() => {
    if (error && retryCount < 3 && !error.message.includes('Authentication')) {
      const timer = setTimeout(() => {
        handleRetry();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, handleRetry]);

  const summaryStats = useMemo(() => {
    console.log('🧮 Calculating stats with', workItems.length, 'items');
    
    if (!Array.isArray(workItems) || workItems.length === 0) {
      return [
        { title: 'Total Generated', value: 0, icon: <FileTextOutlined />, color: '#1890ff', growth: 0 },
        { title: 'This Month', value: 0, icon: <CalendarOutlined />, color: '#52c41a', growth: 0 },
        { title: 'In Progress', value: 0, icon: <BarChartOutlined />, color: '#faad14', growth: 0 },
        { title: 'Completed', value: 0, icon: <RocketOutlined />, color: '#13c2c2', growth: 0 }
      ];
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const thisMonthItems = workItems.filter(item => {
      try {
        return item.createdAt && new Date(item.createdAt) >= thisMonth;
      } catch {
        return false;
      }
    });
    
    const lastMonthItems = workItems.filter(item => {
      try {
        const date = new Date(item.createdAt);
        return date >= lastMonth && date < thisMonth;
      } catch {
        return false;
      }
    });
    
    const thisMonthGrowth = lastMonthItems.length > 0 
      ? Math.round(((thisMonthItems.length - lastMonthItems.length) / lastMonthItems.length) * 100)
      : 0;

    const processingItems = workItems.filter(item => 
      item.status === 'processing' || item.status === 'in_progress' || item.status === 'pending'
    ).length;
    
    const completedItems = workItems.filter(item => 
      item.status === 'completed' || item.status === 'done' || item.status === 'finished'
    ).length;

    const stats = [
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

    console.log('📈 Calculated stats:', stats);
    return stats;
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
            {retryCount > 0 && (
              <p style={{ marginTop: 8, color: theme === 'dark' ? '#FEF3C7' : '#D97706', fontSize: '12px' }}>
                Retry attempt {retryCount}/3
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (error && retryCount >= 3) {
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
            <p style={{ color: theme === 'dark' ? '#EF4444' : '#DC2626', marginBottom: 16 }}>
              Unable to load statistics: {error.message}
            </p>
            <Button
              type="primary"
              onClick={() => {
                setRetryCount(0);
                fetchAllWorkItems();
              }}
            >
              Retry
            </Button>
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
            onClick={() => fetchAllWorkItems()}
            loading={loading}
            style={{
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#e5e7eb' : '#1a1a1a',
              borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
            }}
          >
            Refresh
          </Button>
          {workItems.length > 0 && (
            <span style={{ 
              fontSize: '12px', 
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280' 
            }}>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          )}
        </Space>
      </div>

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
        
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            marginTop: '12px', 
            padding: '8px', 
            backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
            borderRadius: '4px',
            fontSize: '11px',
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
          }}>
             Workspace: {workspaceId || 'default'} | 
          </div>
        )}
      </Card>
    </div>
  );
};

export default WelcomePanel;