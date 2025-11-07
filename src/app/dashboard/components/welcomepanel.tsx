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
  ToolOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkItems } from '../../hooks/useDashboardData';

 import { NotificationBell } from '../../../components/notification/NotificationBell';

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
        { title: 'This Month', value: 0, icon: <CalendarOutlined />, color: '#52c41a', growth: 0 },
        { title: 'Most Recent Tool', value: 'None', icon: <ToolOutlined />, color: '#1890ff', isText: true },
        { title: 'Last Used', value: 'N/A', icon: <ClockCircleOutlined />, color: '#faad14', isText: true },
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

    // Get most recent item
    const sortedItems = [...workItems].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    const mostRecentItem = sortedItems[0];

    // Tool display names
    const toolNames: Record<string, string> = {
      'sales-call': 'Sales Call',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calc',
      'niche-research': 'Niche Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offer Creator',
      'ad-writer': 'Ad Writer',
      'n8n-workflow': 'Workflow',
      'proposal': 'Proposal',
      'lead-generation': 'Lead Gen'
    };

    const recentToolName = mostRecentItem ? toolNames[mostRecentItem.type] || 'Tool' : 'None';
    const recentToolTime = mostRecentItem?.createdAt || null;
    
    // Calculate relative time
    let relativeTime = 'N/A';
    if (recentToolTime) {
      const itemDate = new Date(recentToolTime);
      const diffMs = now.getTime() - itemDate.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) relativeTime = 'Just now';
      else if (diffMins < 60) relativeTime = `${diffMins}m ago`;
      else if (diffHours < 24) relativeTime = `${diffHours}h ago`;
      else if (diffDays === 1) relativeTime = 'Yesterday';
      else relativeTime = `${diffDays}d ago`;
    }

    return [
      { 
        title: 'This Month', 
        value: thisMonthItems.length, 
        icon: <CalendarOutlined />, 
        color: '#52c41a', 
        growth: thisMonthGrowth 
      },
      { 
        title: 'Most Recent Tool', 
        value: recentToolName, 
        icon: <ToolOutlined />, 
        color: '#1890ff',
        isText: true
      },
      { 
        title: 'Last Used', 
        value: relativeTime, 
        icon: <ClockCircleOutlined />, 
        color: '#faad14',
        isText: true
      },
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
         paddingLeft: screens.xs ? '8px' : '20px', // Responsive padding
  paddingRight: screens.xs ? '8px' : '20px', // Balance on right side
        flexDirection: screens.xs ? 'column' : 'row',
        gap: screens.xs ? '8px' : '12px', // Reduced gaps

      }}>
    <Title
  level={2}
  style={{
    margin: 0,
    color: theme === 'dark' ? '#f9fafb' : '#111827',
    fontWeight: 600,
    fontSize: screens.xs ? '11px' : '14px',
    letterSpacing: '0.12em',
    lineHeight: '1.3',
    textTransform: 'uppercase',
  }}
>
  <span style={{ color: theme === 'dark' ? 'white' : '#111827' }}>
    <span
      style={{
        color: '#5CC49D',
        textShadow: '0 0 4px #5CC49D',
        animation: 'glow-pulse 3s ease-in-out infinite',
      }}
    >
      a
    </span>
    rb
    <span
      style={{
        color: '#5CC49D',
        textShadow: '0 0 4px #5CC49D',
        animation: 'glow-pulse 3s ease-in-out infinite',
      }}
    >
      i
    </span>
    trageOS <span style={{ opacity: 0.7 }}>by</span>{' '}
    <span style={{ color: theme === 'dark' ? '#fff' : '#111827' }}>GrowAI</span>
  </span>
</Title>

        
        {/* Refresh controls with better spacing */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          flexShrink: 0
        }}>

             <NotificationBell />
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
  <Tag 
    color={theme === 'dark' ? 'default' : 'default'}
    style={{
      fontSize: '12px',
      padding: '4px 12px',
      borderRadius: '6px',
      backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
      borderColor: theme === 'dark' ? '#374151' : '#D1D5DB',
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
      margin: 0
    }}
  >
    Last updated: {(lastRefreshTime || new Date(dataUpdatedAt)).toLocaleTimeString()}
  </Tag>
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
        {/* Statistics grid with proper spacing - NOW 3 COLUMNS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: screens.lg ? 'repeat(3, 1fr)' : screens.md ? 'repeat(3, 1fr)' : '1fr',
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
                  fontSize: stat.isText ? '14px' : '16px', // Smaller font for text values
                  lineHeight: '1.2',
                  fontWeight: stat.isText ? 500 : 600
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
  <div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    letterSpacing: '0.12em',    
    textTransform: 'uppercase', 
    fontWeight: 600,           
    fontSize: '9px',          
    color: theme === 'dark' ? '#f9fafb' : '#111827',
  }}
>
  <FolderOutlined
    style={{
      fontSize: '13px',
      color: '#5CC49D',     
    }}
  />
  <span style={{ fontWeight: 600 }}>
    Workspace:
    <span
      style={{
        marginLeft: 4,
        color: theme === 'dark' ? '#e5e7eb' : '#374151',
      }}
    >
      {workspaceName}
    </span>
  </span>

  {workspaceId && (
    <span
      style={{
        opacity: 0.6,
        fontSize: '9px',
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
      }}
    >
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