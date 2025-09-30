// app/dashboard/components/RecentDeliverables.tsx
import React from 'react';
import { Card, List, Button, Typography, Grid, Tag, Spin , } from 'antd';
import { 
  FileTextOutlined,
  PhoneOutlined,
  RocketOutlined,
  DollarCircleOutlined,
  BulbOutlined,
  MailOutlined,
  EditOutlined,
  TagOutlined,
  CalendarOutlined,
  EyeOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext';
import { useWorkItems, WorkItem } from '../../hooks/useDashboardData';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface RecentDeliverablesProps {
  deliverables?: any[];
  workspaceId?: string;
  maxItems?: number;
}

const RecentDeliverables: React.FC<RecentDeliverablesProps> = ({ 
  deliverables = [], 
  workspaceId,
  maxItems = 6 
}) => {
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  
  // Use React Query for work items instead of separate API call
  const {
    data: workItems = [],
    isLoading,
    isError,
    error,
    refetch
  } = useWorkItems(maxItems);

  // Get icon for work type
  const getTypeIcon = (type: WorkItem['type']) => {
    const icons: Record<WorkItem['type'], React.JSX.Element> = {
      'sales-call': <PhoneOutlined />,
      'growth-plan': <RocketOutlined />,
      'pricing-calc': <DollarCircleOutlined />,
      'niche-research': <BulbOutlined />,
      'cold-email': <MailOutlined />,
      'offer-creator': <EditOutlined />,
      'ad-writer': <TagOutlined />,
      'n8n-workflow': <FileTextOutlined />,
         'proposal': <FileTextOutlined />,           // ✅ ADD THIS
    'lead-generation': <TeamOutlined />  
    };
    return icons[type] || <FileTextOutlined />;
  };

  // Get type color
  const getTypeColor = (type: WorkItem['type']) => {
    const colors: Record<WorkItem['type'], string> = {
      'sales-call': '#722ed1',
      'growth-plan': '#1890ff',
      'pricing-calc': '#52c41a',
      'niche-research': '#fa8c16',
      'cold-email': '#eb2f96',
      'offer-creator': '#13c2c2',
      'ad-writer': '#faad14',
      'n8n-workflow': '#fa541c',
         'proposal': '#9254de',            
    'lead-generation': '#52c41a'  
    };
    return colors[type] || '#666';
  };

  // Get type display name
  const getTypeName = (type: WorkItem['type']) => {
    const names: Record<WorkItem['type'], string> = {
      'sales-call': 'Call Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calc',
      'niche-research': 'Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offers',
      'ad-writer': 'Ads',
      'n8n-workflow': 'Workflow',
        'proposal': 'Proposal',                
    'lead-generation': 'Lead Generation'  
    };
    return names[type] || type;
  };

  // Handle view action with workspace context
  const handleView = (item: WorkItem) => {
    if (!currentWorkspace) return;
    
    // Navigate to submissions page with filter
    window.location.href = `/submissions?type=${item.type}&id=${item.rawData.id}`;
  };

  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: screens.xs ? '8px' : '12px',
    },
    header: {
      borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: '8px 12px',
    },
  });

  // Don't render until workspace is ready
  if (!isWorkspaceReady) {
    return (
      <Card
        data-tour="recent-deliverables"
        title="Recent Deliverables"
        styles={getCardStyles()}
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
        }}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Spin size="small" />
          <Text
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              display: 'block',
              marginTop: 8,
              fontSize: 12,
            }}
          >
            Loading workspace...
          </Text>
        </div>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card
        data-tour="recent-deliverables"
        title="Recent Deliverables"
        styles={getCardStyles()}
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
        }}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Text
            style={{
              color: theme === 'dark' ? '#ef4444' : '#dc2626',
              display: 'block',
              marginBottom: 8,
              fontSize: 12,
            }}
          >
      Failed to load deliverables: {(error as Error)?.message || 'Unknown error'}
          </Text>
          <Button
            type="text"
            size="small"
            onClick={() => refetch()}
            style={{
              color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
              padding: 0,
              height: 'auto',
              fontSize: 12,
            }}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      data-tour="recent-deliverables"
      title="Recent Deliverables"
      styles={getCardStyles()}
      style={{
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      bodyStyle={{
        flex: 1,
        overflow: 'hidden',
        padding: 0,
      }}
      extra={
        <Button
          type="text"
          size="small"
          onClick={() => window.location.href = `/submissions`}
          style={{
            color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
            padding: 0,
            height: 'auto',
          }}
        >
          View All
        </Button>
      }
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Spin size="small" />
          <Text
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              display: 'block',
              marginTop: 8,
              fontSize: 12,
            }}
          >
            Loading your recent work...
          </Text>
        </div>
      ) : workItems.length > 0 ? (
        <div
          style={{
            height: 'calc(100% - 0px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0 12px',
            // Custom scrollbar styles
            scrollbarWidth: 'thin',
            scrollbarColor: theme === 'dark' ? '#374151 transparent' : '#d1d5db transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.overflowY = 'scroll';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.overflowY = 'auto';
          }}
        >
          <style>
            {`
              /* Webkit scrollbar styles */
              .deliverables-scroll::-webkit-scrollbar {
                width: 6px;
              }
              
              .deliverables-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              
              .deliverables-scroll::-webkit-scrollbar-thumb {
                background-color: ${theme === 'dark' ? '#374151' : '#d1d5db'};
                border-radius: 3px;
                transition: background-color 0.2s;
              }
              
              .deliverables-scroll::-webkit-scrollbar-thumb:hover {
                background-color: ${theme === 'dark' ? '#4b5563' : '#9ca3af'};
              }
              
              .deliverables-scroll {
                scrollbar-width: thin;
                scrollbar-color: ${theme === 'dark' ? '#374151 transparent' : '#d1d5db transparent'};
              }
            `}
          </style>
          <List
            className="deliverables-scroll"
            itemLayout="horizontal"
            dataSource={workItems.slice(0, maxItems)}
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
            }}
            renderItem={(item) => (
              <List.Item
                style={{
                  borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
                  padding: '8px 0',
                  backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                }}
                actions={[
                  <Button
                    type="text"
                    size="small"
                    key="view"
                    icon={<EyeOutlined />}
                    onClick={() => handleView(item)}
                    style={{
                      color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                      padding: '0 4px',
                      height: 'auto',
                      fontSize: 12,
                    }}
                  >
                    View
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: getTypeColor(item.type) + '15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getTypeColor(item.type),
                        fontSize: 14,
                      }}
                    >
                      {getTypeIcon(item.type)}
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Text
                        strong
                        style={{
                          color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                          fontSize: 13,
                        }}
                      >
                        {item.title}
                      </Text>
                      <Tag 
                        color={getTypeColor(item.type)} 
                        style={{ fontSize: 10, lineHeight: 1.2, padding: '0 4px' }}
                      >
                        {getTypeName(item.type)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Text
                        style={{
                          color: theme === 'dark' ? '#9ca3af' : '#666666',
                          fontSize: 12,
                          display: 'block',
                          marginBottom: 2,
                        }}
                      >
                        {item.subtitle}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: theme === 'dark' ? '#6b7280' : '#999', fontSize: 10 }}>
                          <CalendarOutlined /> {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                        
                        {/* Type-specific metadata */}
                        {item.type === 'pricing-calc' && item.metadata.hourlyRate && (
                          <Tag color="green" style={{ fontSize: 9 }}>${item.metadata.hourlyRate}/hr</Tag>
                        )}
                        {item.type === 'cold-email' && item.metadata.emailCount && (
                          <Tag style={{ fontSize: 9 }}>{item.metadata.emailCount} emails</Tag>
                        )}
                        {item.type === 'growth-plan' && item.metadata.strategies && (
                          <Tag style={{ fontSize: 9 }}>{item.metadata.strategies} strategies</Tag>
                        )}
                        {item.type === 'offer-creator' && item.metadata.packages && (
                          <Tag style={{ fontSize: 9 }}>{item.metadata.packages} packages</Tag>
                        )}

                        {item.type === 'proposal' && item.metadata.winProbability && (
  <Tag color="green" style={{ fontSize: 9 }}>
    {item.metadata.winProbability}% win
  </Tag>
)}
{item.type === 'lead-generation' && item.metadata.leadCount && (
  <Tag color="blue" style={{ fontSize: 9 }}>
    {item.metadata.leadCount} leads
  </Tag>
)}
                        
                        {/* Workspace indicator */}
                        {currentWorkspace && (
                          <Tag color="blue" style={{ fontSize: 9 }}>
                            {currentWorkspace.name}
                          </Tag>
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '16px 0',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          }}
        >
          <RocketOutlined
            style={{
              fontSize: 32,
              color: theme === 'dark' ? '#4b5563' : '#d1d5db',
              marginBottom: 8,
            }}
          />
          <Text
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              display: 'block',
              marginBottom: 4,
              fontSize: 12,
            }}
          >
            No AI work generated yet in {currentWorkspace?.name}
          </Text>
          <Button
            type="text"
            size="small"
            onClick={() => window.location.href = `/dashboard/${currentWorkspace?.slug}/tools`}
            style={{
              color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
              padding: 0,
              height: 'auto',
              fontSize: 12,
            }}
          >
            Start using AI tools
          </Button>
        </div>
      )}
    </Card>
  );
};

export default RecentDeliverables;