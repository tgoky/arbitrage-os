// app/dashboard/components/ActivityFeed.tsx
import React, { useMemo } from 'react';
import { Card, List, Tag, Typography, Button, Grid, Spin, Badge, Space, Tooltip } from 'antd';
import { 
  CheckCircleFilled, 
  ClockCircleFilled, 
  CloseCircleFilled, 
  PlayCircleFilled,
  PhoneOutlined,
  RocketOutlined,
  DollarOutlined,
  BulbOutlined,
  MailOutlined,
  EditOutlined,
  TagOutlined,
  PartitionOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  ReloadOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext';
import { useWorkItems, WorkItem } from '../../hooks/useDashboardData';

import { ConfigProvider } from "antd";

const { Text } = Typography;
const { useBreakpoint } = Grid;

// --- Types ---
type ToolType = 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' | 'ad-writer' | 'n8n-workflow' | 'proposal' | 'lead-generation';
type ActivityStatus = 'completed' | 'processing' | 'failed' | 'queued';

interface EnhancedActivity {
  id: string;
  type: 'tool-usage' | 'generation' | 'analysis' | 'optimization' | 'export' | 'collaboration';
  toolType: ToolType;
  action: string;
  user: string;
  target?: string;
  status: ActivityStatus;
  timestamp: Date;
  metadata: {
    duration?: string;
    tokensUsed?: number;
    confidence?: number;
    outputSize?: string;
    performance?: number;
    collaborators?: string[];
    priority?: 'high' | 'medium' | 'low';
    progress?: number;
  };
}

interface ActivityFeedProps {
  recentActivity?: any[];
  workspaceId?: string;
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  workspaceId,
  maxItems = 10 
}) => {
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  
  const {
    data: workItems = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useWorkItems(maxItems);

  // --- Styling Constants ---
  const isDark = theme === 'dark';
  const fontFamily = "'Manrope', sans-serif";
  
  // ✅ CHANGED: Pure black background for dark mode
  const backgroundColor = isDark ? '#000000' : '#ffffff';
  const borderColor = isDark ? '#262626' : '#f0f0f0'; // Subtle border for black bg

  // --- Transformer ---
  const transformWorkItemToActivity = (item: WorkItem): EnhancedActivity | null => {
    try {
      let action = 'Generated item';
      let metadata: EnhancedActivity['metadata'] = {};
      let user = 'AI Assistant';

      // Map item type to activity details
      switch (item.type) {
        case 'sales-call':
          action = 'Analyzed sales call';
          user = 'Sales AI';
          metadata = {
            duration: item.metadata?.duration || '5m 12s',
            confidence: item.metadata?.score || 88,
            tokensUsed: item.metadata?.tokensUsed || 1240,
            performance: item.metadata?.sentiment === 'positive' ? 85 : 65
          };
          break;
        case 'growth-plan':
          action = 'Generated growth strategy';
          user = 'Strategy AI';
          metadata = {
            duration: '45s',
            tokensUsed: 3500,
            outputSize: `${item.metadata?.strategies || 5} strategies`,
            priority: 'high'
          };
          break;
        case 'pricing-calc':
          action = 'Calculated project pricing';
          user = 'Pricing AI';
          metadata = {
            duration: '10s',
            outputSize: `$${item.metadata?.recommendedRetainer?.toLocaleString() || '0'}`,
            performance: 92
          };
          break;
        case 'proposal':
          action = 'Generated proposal';
          user = 'Proposal AI';
          metadata = {
            duration: '1m 20s',
            outputSize: `$${item.metadata?.totalValue?.toLocaleString() || '0'}`,
            confidence: 85,
            priority: 'high'
          };
          break;
        case 'lead-generation':
          action = 'Scraped leads list';
          user = 'Apollo AI';
          metadata = {
            outputSize: `${item.metadata?.leadCount || 25} leads`,
            confidence: 90,
            priority: 'medium'
          };
          break;
        default:
          action = `Processed ${item.type.replace('-', ' ')}`;
          user = 'AI Assistant';
          metadata = {
             tokensUsed: Math.floor(Math.random() * 1000) + 500
          };
      }

      return {
        id: `activity-${item.id}`,
        type: 'generation' as const,
        toolType: item.type as ToolType,
        action,
        user,
        target: item.subtitle || item.title,
        status: (item.status as ActivityStatus) || 'completed',
        timestamp: new Date(item.createdAt),
        metadata
      };

    } catch (error) {
      console.error('Error transforming work item to activity:', error);
      return null;
    }
  };

  const activities = useMemo(() => {
    return workItems.map(item => transformWorkItemToActivity(item)).filter(Boolean) as EnhancedActivity[];
  }, [workItems]);

  // --- Styles & Helpers ---

  const getMainCardStyles = () => ({
    header: {
      backgroundColor: backgroundColor,
      borderBottom: `1px solid ${borderColor}`,
      padding: '16px 24px',
    },
    body: {
      backgroundColor: backgroundColor,
      padding: 0, 
      height: '380px', 
      overflow: 'hidden',
    },
  });

  const getToolConfig = (toolType: ToolType) => {
    const config: Record<ToolType, { icon: React.ReactElement; color: string; bg: string }> = {
      'sales-call': { icon: <PhoneOutlined />, color: '#722ed1', bg: '#f9f0ff' },
      'growth-plan': { icon: <RocketOutlined />, color: '#1890ff', bg: '#e6f7ff' },
      'pricing-calc': { icon: <DollarOutlined />, color: '#52c41a', bg: '#f6ffed' },
      'niche-research': { icon: <BulbOutlined />, color: '#fa8c16', bg: '#fff7e6' },
      'cold-email': { icon: <MailOutlined />, color: '#eb2f96', bg: '#fff0f6' },
      'offer-creator': { icon: <EditOutlined />, color: '#13c2c2', bg: '#e6fffb' },
      'ad-writer': { icon: <TagOutlined />, color: '#faad14', bg: '#fffbe6' },
      'n8n-workflow': { icon: <PartitionOutlined />, color: '#fa541c', bg: '#fff2e8' },
      'proposal': { icon: <FileTextOutlined />, color: '#9254de', bg: '#f9f0ff' },
      'lead-generation': { icon: <UserOutlined />, color: '#52c41a', bg: '#f6ffed' },
    };
    return config[toolType] || { icon: <ThunderboltOutlined />, color: '#666', bg: '#f5f5f5' };
  };

  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'completed': return <CheckCircleFilled style={{ color: '#52c41a' }} />;
      case 'processing': return <ClockCircleFilled style={{ color: '#1890ff' }} />;
      case 'failed': return <CloseCircleFilled style={{ color: '#ff4d4f' }} />;
      case 'queued': return <PlayCircleFilled style={{ color: '#faad14' }} />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const diff = (new Date().getTime() - timestamp.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // --- Rendering Metadata ---
  const renderMetadata = (activity: EnhancedActivity) => {
    const { metadata } = activity;
    
    const pillStyle = {
      backgroundColor: isDark ? '#141414' : '#f3f4f6', // Very dark grey pill for black bg
      color: isDark ? '#9ca3af' : '#6b7280',
      fontSize: '10px',
      padding: '2px 8px',
      borderRadius: '6px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontFamily: fontFamily,
      fontWeight: 500,
    };

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {metadata.duration && (
          <span style={pillStyle}>
            <ClockCircleFilled style={{ fontSize: 9 }} /> {metadata.duration}
          </span>
        )}
        {metadata.tokensUsed && (
          <span style={pillStyle}>
            ⚡ {metadata.tokensUsed.toLocaleString()} tokens
          </span>
        )}
        {metadata.confidence && (
          <span style={pillStyle}>
            🎯 {metadata.confidence}% score
          </span>
        )}
        {metadata.outputSize && (
          <span style={pillStyle}>
            📄 {metadata.outputSize}
          </span>
        )}
      </div>
    );
  };

  // --- Loading State ---
  if (!isWorkspaceReady || (isLoading && !activities.length)) {
    return (
      <Card
        title="Activity Feed"
        styles={getMainCardStyles()}
        style={{ 
          borderRadius: '16px', 
          border: `1px solid ${borderColor}`,
          backgroundColor: backgroundColor 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>

          <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
         <Spin size="large" />
</ConfigProvider>

 
          <Text style={{ fontFamily: fontFamily, color: isDark ? '#6b7280' : '#9ca3af' }}>Loading activities...</Text>
        </div>
      </Card>
    );
  }

  // --- Error State ---
  if (isError) {
    return (
      <Card
        styles={getMainCardStyles()}
        style={{ 
          borderRadius: '16px', 
          border: `1px solid ${borderColor}`,
          backgroundColor: backgroundColor 
        }}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="danger" style={{ fontFamily: fontFamily }}>Unable to load activity feed</Text>
          <br />
          <Button type="link" onClick={() => refetch()} style={{ fontFamily: fontFamily }}>Try Again</Button>
        </div>
      </Card>
    );
  }

  // --- Main Render ---
  return (
    <Card
      data-tour="activity-feed"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: fontFamily }}>
          <div style={{
             backgroundColor: isDark ? 'rgba(24, 144, 255, 0.2)' : '#e6f7ff',
             padding: '6px',
             borderRadius: '8px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center'
          }}>
            <HistoryOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
          </div>
          <Text strong style={{ 
            fontSize: '14px', 
            color: isDark ? '#f3f4f6' : '#111827', 
            letterSpacing: '-0.01em',
            fontFamily: fontFamily 
          }}>
            RECENT ACTIVITY
          </Text>
          {activities.some(a => a.status === 'processing') && (
            <Badge status="processing" style={{ marginLeft: 8 }} />
          )}
        </div>
      }
      extra={
        <Button 
          type="text" 
          icon={<ReloadOutlined />}
          loading={isFetching}
          onClick={() => refetch()}
          style={{ 
            color: '#52c41a', 
            fontWeight: 600,
            fontFamily: fontFamily,
            fontSize: '13px',
            backgroundColor: isDark ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.05)',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          Refresh
        </Button>
      }
      styles={getMainCardStyles()}
      style={{
        borderRadius: '16px',
        border: `1px solid ${borderColor}`,
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.8)' : '0 4px 20px rgba(0,0,0,0.03)',
        overflow: 'hidden',
        height: '100%',
        fontFamily: fontFamily,
        backgroundColor: backgroundColor
      }}
    >
      {activities.length > 0 ? (
        <div
          className="custom-scrollbar"
          style={{
            height: '100%',
            overflowY: 'auto',
            padding: '0 16px',
          }}
        >
          {/* Inject scrollbar styles scoped to this component */}
          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: ${isDark ? '#333' : '#e5e7eb'};
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: ${isDark ? '#555' : '#d1d5db'};
            }
          `}</style>

          <List
            itemLayout="horizontal"
            dataSource={activities}
            split={false} 
            renderItem={(activity) => {
              const toolConfig = getToolConfig(activity.toolType);
              
              return (
                <List.Item
                  style={{
                    padding: '16px 8px',
                    borderBottom: `1px dashed ${borderColor}`,
                    transition: 'background-color 0.2s',
                    cursor: 'default',
                    // Transparent so black card bg shows through
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    // Subtle hover effect
                    e.currentTarget.style.backgroundColor = isDark ? '#141414' : '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  actions={[
                    <div key="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <Text style={{ 
                        fontSize: '11px', 
                        color: isDark ? '#9ca3af' : '#999', 
                        fontFamily: fontFamily 
                      }}>
                        {formatTimeAgo(activity.timestamp)}
                      </Text>
                      {activity.status === 'processing' ? (
                         <Tag bordered={false} color="blue" style={{ margin: 0, borderRadius: 10, fontSize: 10 }}>Processing</Tag>
                      ) : (
                        <div style={{ fontSize: 14 }}>{getStatusIcon(activity.status)}</div>
                      )}
                    </div>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: '12px',
                          backgroundColor: isDark 
                            ? `${toolConfig.color}20` 
                            : toolConfig.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: toolConfig.color,
                          fontSize: 18,
                          border: `1px solid ${toolConfig.color}30`
                        }}>
                          {toolConfig.icon}
                        </div>
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text strong style={{ 
                          color: isDark ? '#f3f4f6' : '#111827', 
                          fontSize: '14px', 
                          fontFamily: fontFamily 
                        }}>
                          {activity.action}
                        </Text>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ 
                          color: isDark ? '#9ca3af' : '#6b7280', 
                          fontSize: '12px',
                          marginBottom: 4,
                          fontFamily: fontFamily
                        }}>
                          {activity.target || `New ${activity.toolType}`} • <span style={{ color: toolConfig.color }}>{activity.user}</span>
                        </div>
                        {renderMetadata(activity)}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>
      ) : (
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 12,
          color: isDark ? '#4b5563' : '#d1d5db'
        }}>
          <ThunderboltOutlined style={{ fontSize: 48, opacity: 0.5 }} />
          <div style={{ textAlign: 'center' }}>
            <Text style={{ display: 'block', color: isDark ? '#9ca3af' : '#6b7280', fontFamily: fontFamily, fontWeight: 500 }}>
              No recent activity
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', fontFamily: fontFamily }}>
              Generate content to see it appear here
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ActivityFeed;