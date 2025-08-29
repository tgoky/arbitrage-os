import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Card, Typography, Grid, Statistic, Space, Spin, message } from 'antd';
import { 
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  RocketOutlined 
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext'; // Use the workspace context hook

const { Title } = Typography;
const { useBreakpoint } = Grid;

interface WelcomePanelProps {
  workspaceName: string;
  workspaceId?: string;
}

interface WorkItem {
  id: string;
  createdAt: string;
  status: 'processing' | 'completed' | 'failed' | 'in_progress' | 'pending' | 'done' | 'finished' | string;
  workspace_id?: string; // Add workspace_id to work items
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({
  workspaceName,
  workspaceId
}) => {
  const { theme } = useTheme();
  const screens = useBreakpoint();
  const { currentWorkspace, isWorkspaceReady, getWorkspaceScopedEndpoint } = useWorkspaceContext();
  
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

// In WelcomePanel.tsx, update fetchAllWorkItems:
const fetchAllWorkItems = useCallback(async (isRetry = false) => {
  // if (!isWorkspaceReady || !currentWorkspace || loading) {
  //   return;
  // }

  setLoading(true);
 try {
    const url = `${getWorkspaceScopedEndpoint('/api/dashboard/work-items')}&_t=${Date.now()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Workspace-Id': currentWorkspace.id,
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && Array.isArray(data.data?.items)) {
      setWorkItems(data.data.items);
           setLastFetchTime(new Date()); // Add this line
      setRetryCount(0); // Reset retry count on success
    }
    
  } catch (error) {
    console.error('Error fetching work items:', error);
    if (!isRetry && retryCount < 2) {
      setTimeout(() => fetchAllWorkItems(true), 2000);
      setRetryCount(prev => prev + 1);
    }
  } finally {
    setLoading(false);
  }
}, [currentWorkspace?.id, isWorkspaceReady]);


  const handleRetry = useCallback(async () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      setTimeout(() => {
        fetchAllWorkItems(true);
      }, delay);
    }
  }, [fetchAllWorkItems, retryCount]);

  useEffect(() => {
    let mounted = true;
     let timeoutId: NodeJS.Timeout;
    
   
  const loadData = async () => {
    if (mounted && isWorkspaceReady && currentWorkspace) {
      // Debounce the fetch call
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (mounted) {
          fetchAllWorkItems();
        }
      }, 300);
    }
  };

    loadData();

    // Listen for workspace changes
    const handleWorkspaceChange = () => {
      if (mounted) {
        setWorkItems([]);
        setError(null);
        setRetryCount(0);
        loadData();
      }
    };

    window.addEventListener('workspaceChanged', handleWorkspaceChange);

    return () => {
      mounted = false;
         clearTimeout(timeoutId);
    };
}, [currentWorkspace?.id]); 

  useEffect(() => {
    if (error && retryCount < 3 && !error.message.includes('Authentication')) {
      const timer = setTimeout(() => {
        handleRetry();
      }, 2000 * (retryCount + 1));
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, handleRetry]);

  const summaryStats = useMemo(() => {
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
        if (!item.createdAt) return false;
        
        const itemDate = new Date(item.createdAt);
        if (isNaN(itemDate.getTime())) return false;
        
        return itemDate >= thisMonth;
      } catch (err) {
        return false;
      }
    });
    
    const lastMonthItems = workItems.filter(item => {
      try {
        if (!item.createdAt) return false;
        const date = new Date(item.createdAt);
        if (isNaN(date.getTime())) return false;
        return date >= lastMonth && date < thisMonth;
      } catch {
        return false;
      }
    });
    
    const thisMonthGrowth = lastMonthItems.length > 0 
      ? Math.round(((thisMonthItems.length - lastMonthItems.length) / lastMonthItems.length) * 100)
      : thisMonthItems.length > 0 ? 100 : 0;

    const processingStatuses = ['processing', 'in_progress', 'pending', 'running', 'active'];
    const completedStatuses = ['completed', 'done', 'finished', 'success', 'complete'];
    
    const processingItems = workItems.filter(item => 
      processingStatuses.includes(item.status?.toLowerCase?.() || '')
    ).length;
    
    const completedItems = workItems.filter(item => 
      completedStatuses.includes(item.status?.toLowerCase?.() || '')
    ).length;

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

  // Show loading while workspace is loading
  if (!isWorkspaceReady || loading) {
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
              {!isWorkspaceReady ? 'Loading workspace...' : 'Loading statistics...'}
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
              Unable to load workspace statistics: {error.message}
            </p>
            <Button
              type="primary"
              onClick={() => {
                setRetryCount(0);
                setError(null);
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
            onClick={() => {
              setError(null);
              setRetryCount(0);
              fetchAllWorkItems();
            }}
            loading={loading}
            style={{
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#e5e7eb' : '#1a1a1a',
              borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
            }}
          >
            Refresh
          </Button>
          {lastFetchTime && (
            <span style={{ 
              fontSize: '12px', 
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280' 
            }}>
              Last updated: {lastFetchTime.toLocaleTimeString()}
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
        
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
          borderRadius: '4px',
          fontSize: '11px',
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Workspace: {currentWorkspace?.name || 'Unknown'} ({currentWorkspace?.id})</span>
          {workItems.length > 0 && (
            <span>Items loaded: {workItems.length}</span>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WelcomePanel;