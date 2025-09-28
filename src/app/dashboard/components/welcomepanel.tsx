import React, { useState, useMemo, useCallback } from 'react';
import { Button, Card, Typography, Grid, Statistic, Space, Spin, message, Tag,
  Badge  } from 'antd';
import { 
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  RocketOutlined ,
    FolderOutlined, 
  FolderOpenOutlined, 

  FileDoneOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkItems } from '../../hooks/useDashboardData';

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
  
  // Use React Query for work items
  const {
    data: workItems = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt
  } = useWorkItems();

  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      setLastRefreshTime(new Date());
      message.success('Statistics refreshed successfully');
    } catch (err) {
      message.error('Failed to refresh statistics');
    }
  }, [refetch]);

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
      padding: screens.xs ? '12px' : '16px', // Reduced padding for slimmer look
      borderRadius: '12px',
    },
  });

  // Error state
  if (isError) {
    return (
      <div data-tour="welcome-panel" style={{ marginBottom: 20 }}>
        {/* Header with proper spacing */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: 12, // Reduced from 20
          paddingTop: 4, // Reduced from 8
          paddingBottom: 4 // Reduced from 8
        }}>
          <Title
            level={2}
            style={{
              margin: 0,
              color: theme === 'dark' ? '#f9fafb' : '#111827',
              fontWeight: 700,
              fontSize: screens.xs ? '18px' : '20px', // Reduced font size for slimmer look
              lineHeight: '1.2',
            }}
          >
            Welcome to {workspaceName} Arbitrage-OS
          </Title>
        </div>
        
        <Card
          styles={getParentCardStyles()}
          style={{ borderColor: theme === 'dark' ? '#374151' : '#E5E7EB' }}
        >
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: theme === 'dark' ? '#EF4444' : '#DC2626', marginBottom: 16 }}>
              Unable to load workspace statistics: {(error as Error)?.message  || 'Unknown error'}
            </p>
            <Button
              type="primary"
              onClick={handleRefresh}
              loading={isFetching}
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div data-tour="welcome-panel" style={{ marginBottom: 20 }}>
        {/* Header with proper spacing */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: 12, // Reduced from 20
          paddingTop: 4, // Reduced from 8
          paddingBottom: 4 // Reduced from 8
        }}>
          <Title
            level={2}
            style={{
              margin: 0,
              color: theme === 'dark' ? '#f9fafb' : '#111827',
              fontWeight: 700,
              fontSize: screens.xs ? '18px' : '20px', // Reduced font size for slimmer look
              lineHeight: '1.2',
            }}
          >
            Welcome to {workspaceName} Arbitrage-OS
          </Title>
        </div>
        
        <Card
          styles={getParentCardStyles()}
          style={{ borderColor: theme === 'dark' ? '#374151' : '#E5E7EB' }}
        >
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
              Loading workspace statistics...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div data-tour="welcome-panel" style={{ marginBottom: 20 }}>
      {/* Header with proper spacing and professional layout */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: screens.xs ? 'flex-start' : 'center', 
        marginBottom: 12, // Reduced from 20
        paddingTop: 4, // Reduced from 8
        paddingBottom: 4, // Reduced from 8
        flexDirection: screens.xs ? 'column' : 'row',
        gap: screens.xs ? '8px' : '12px', // Reduced gaps

      }}>
      <Title
  level={2}
  style={{
    margin: 0,
    color: theme === 'dark' ? '#f9fafb' : '#111827', // This sets the base color
    fontWeight: 700,
    fontSize: screens.xs ? '18px' : '20px',
    lineHeight: '1.2',
    flex: 1
  }}
>
  <span style={{ color: theme === 'dark' ? 'white' : '#111827' }}>
    <span style={{ 
      color: '#5CC49D',
      textShadow: '0 0 5px #5CC49D, 0 0 10px #5CC49D',
      animation: 'glow-pulse 2s ease-in-out infinite'
    }}>a</span>
    rb
    <span style={{ 
      color: '#5CC49D',
      textShadow: '0 0 5px #5CC49D, 0 0 10px #5CC49D',
      animation: 'glow-pulse 2s ease-in-out infinite'
    }}>i</span>
    trage
  </span>OS by{' '}
  <span style={{ color: theme === 'dark' ? 'white' : '#111827' }}>
    GrowAI
  </span>
</Title>
        
        {/* Refresh controls with better spacing */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          flexShrink: 0
        }}>
          <Button
            type="default"
            size={screens.xs ? 'small' : 'middle'}
            onClick={handleRefresh}
            loading={isFetching}
            style={{
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#e5e7eb' : '#1a1a1a',
              borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
              minWidth: '80px', // Ensure consistent button width
            }}
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          {(lastRefreshTime || dataUpdatedAt) && (
            <span style={{ 
              fontSize: '12px', 
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              whiteSpace: 'nowrap'
            }}>
              Last updated: {(lastRefreshTime || new Date(dataUpdatedAt)).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Main card with better internal spacing */}
      <Card
        styles={getParentCardStyles()}
        style={{
          borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        }}
      >
        {/* Statistics grid with proper spacing */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
            gap: screens.xs ? '8px' : '12px', // Reduced gap for slimmer look
            marginBottom: '12px', // Reduced margin below stats
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
                  fontSize: '16px', // Reduced from 18px for slimmer look
                  lineHeight: '1.2',
                  fontWeight: 600
                }}
                prefix={
                  <span style={{ color: stat.color, fontSize: '16px', marginRight: '6px' }}>
                    {stat.icon}
                  </span>
                }
              />
            </Card>
          ))}
        </div>
        
        {/* Footer info with better styling */}
   <div style={{ 
  marginTop: '16px', 
  padding: '12px 16px',
  backgroundColor: theme === 'dark' ? '#1F2937' : '#F3F4F6',
  borderRadius: '8px',
  fontSize: '12px',
  color: theme === 'dark' ? '#5CC49D' : '#6B7280',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  fontWeight: 'bold',
  border: theme === 'dark' ? 'none' : '1px solid #E5E7EB'
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <FolderOutlined style={{ 
      fontSize: '14px', 
      color: theme === 'dark' ? '#5CC49D' : '#5CC49D' 
    }} />
    <span>Workspace: {workspaceName}</span>
    {workspaceId && (
      <span style={{ 
        opacity: 0.8, 
        fontSize: '11px',
        fontFamily: 'monospace'
      }}>
        ({workspaceId})
      </span>
    )}
  </div>
  
  {workItems.length > 0 && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <FileDoneOutlined style={{ 
        fontSize: '14px', 
        color: theme === 'dark' ? '#5CC49D' : '#5CC49D' 
      }} />
      <span>{workItems.length} items</span>
    </div>
  )}
</div>
      </Card>
    </div>
  );
};

export default WelcomePanel;