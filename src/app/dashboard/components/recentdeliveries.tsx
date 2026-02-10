// app/dashboard/components/RecentDeliverables.tsx
import React from 'react';
import { Card, List, Button, Typography, Grid, Tag, Spin, Space } from 'antd';
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
  TeamOutlined,
  ArrowRightOutlined,
  FolderOpenOutlined,
  FileDoneOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext';
import { useWorkItems, WorkItem } from '../../hooks/useDashboardData';

import { ConfigProvider } from "antd";

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
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  
  const {
    data: workItems = [],
    isLoading,
    isError,
    error,
    refetch
  } = useWorkItems(maxItems);

  // --- Styling Constants ---
  const isDark = theme === 'dark';
  const fontFamily = "'Manrope', sans-serif";
  const backgroundColor = isDark ? '#000000' : '#ffffff';
  const borderColor = isDark ? '#262626' : '#f0f0f0';

  // --- Helpers ---
  const getToolConfig = (type: WorkItem['type']) => {
    const config: Record<string, { icon: React.ReactElement; color: string; bg: string }> = {
      'sales-call': { icon: <PhoneOutlined />, color: '#722ed1', bg: '#f9f0ff' },
      'growth-plan': { icon: <RocketOutlined />, color: '#1890ff', bg: '#e6f7ff' },
      'pricing-calc': { icon: <DollarCircleOutlined />, color: '#52c41a', bg: '#f6ffed' },
      'niche-research': { icon: <BulbOutlined />, color: '#fa8c16', bg: '#fff7e6' },
      'cold-email': { icon: <MailOutlined />, color: '#eb2f96', bg: '#fff0f6' },
      'offer-creator': { icon: <EditOutlined />, color: '#13c2c2', bg: '#e6fffb' },
      'ad-writer': { icon: <TagOutlined />, color: '#faad14', bg: '#fffbe6' },
      'n8n-workflow': { icon: <FileTextOutlined />, color: '#fa541c', bg: '#fff2e8' },
      'proposal': { icon: <FileDoneOutlined />, color: '#9254de', bg: '#f9f0ff' },
      'lead-generation': { icon: <TeamOutlined />, color: '#52c41a', bg: '#f6ffed' },
    };
    return config[type] || { icon: <FileTextOutlined />, color: '#666', bg: '#f5f5f5' };
  };

  const getTypeName = (type: WorkItem['type']) => {
    const names: Record<string, string> = {
      'sales-call': 'Call Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calc',
      'niche-research': 'Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offers',
      'ad-writer': 'Ads',
      'n8n-workflow': 'Workflow',
      'proposal': 'Proposal',
      'lead-generation': 'Leads'
    };
    return names[type] || type;
  };

  const getToolRoute = (type: WorkItem['type']): string => {
    const routes: Record<string, string> = {
      'sales-call': 'sales-call-analyzer',
      'growth-plan': 'growth-plans',
      'pricing-calc': 'pricing-calculator',
      'niche-research': 'niche-research',
      'cold-email': 'cold-email',
      'offer-creator': 'offer-creator',
      'ad-writer': 'ad-writer',
      'n8n-workflow': 'n8n-builder',
      'proposal': 'proposal-creator',
      'lead-generation': 'lead-generation',
    };
    return routes[type] || type;
  };

  const handleView = (item: WorkItem) => {
    if (!currentWorkspace) return;
    const deliverableId = item.metadata?.deliverableId || item.rawData?.id;
    if (deliverableId) {
      router.push(`/dashboard/${currentWorkspace.slug}/${getToolRoute(item.type)}/${deliverableId}`);
    }
  };

  const getMainCardStyles = () => ({
    header: {
      backgroundColor: backgroundColor,
      borderBottom: `1px solid ${borderColor}`,
      padding: '16px 24px',
    },
    body: {
      backgroundColor: backgroundColor,
      padding: 0,
      height: '380px', // Fixed height to match Activity Feed
      overflow: 'hidden',
    },
  });

  // --- Render Metadata Pills ---
  const renderMetadataPill = (label: string | number, colorType: 'default' | 'success' | 'blue' = 'default') => {
    let color = isDark ? '#9ca3af' : '#6b7280';
    let bg = isDark ? '#141414' : '#f3f4f6';

    if (colorType === 'success') {
      color = '#52c41a';
      bg = isDark ? 'rgba(82, 196, 26, 0.1)' : '#f6ffed';
    } else if (colorType === 'blue') {
      color = '#1890ff';
      bg = isDark ? 'rgba(24, 144, 255, 0.1)' : '#e6f7ff';
    }

    return (
      <span style={{
        backgroundColor: bg,
        color: color,
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: '6px',
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: fontFamily,
        fontWeight: 500,
        lineHeight: '1.4'
      }}>
        {label}
      </span>
    );
  };

  // --- Loading State ---
  if (!isWorkspaceReady) {
    return (
      <Card
        title="Recent Deliverables"
        styles={getMainCardStyles()}
        style={{ borderRadius: '16px', border: `1px solid ${borderColor}`, backgroundColor }}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>

          <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
       <Spin size="large" />
</ConfigProvider>

   
          <Text style={{ display: 'block', marginTop: 16, color: isDark ? '#6b7280' : '#999', fontFamily }}>
            Loading workspace...
          </Text>
        </div>
      </Card>
    );
  }

  // --- Error State ---
  if (isError) {
    return (
      <Card
        styles={getMainCardStyles()}
        style={{ borderRadius: '16px', border: `1px solid ${borderColor}`, backgroundColor }}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="danger" style={{ fontFamily }}>Failed to load deliverables</Text>
          <br />
          <Button type="link" onClick={() => refetch()} style={{ fontFamily }}>Retry</Button>
        </div>
      </Card>
    );
  }

  // --- Main Render ---
  return (
    <Card
      data-tour="recent-deliverables"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: fontFamily }}>
           <div style={{
             backgroundColor: isDark ? 'rgba(114, 46, 209, 0.2)' : '#f9f0ff',
             padding: '6px',
             borderRadius: '8px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center'
          }}>
            <FolderOpenOutlined style={{ color: '#722ed1', fontSize: '16px' }} />
          </div>
          <Text strong style={{ 
            fontSize: '14px', 
            color: isDark ? '#f3f4f6' : '#111827', 
            letterSpacing: '-0.01em',
            fontFamily: fontFamily 
          }}>
            RECENT DELIVERABLES
          </Text>
        </div>
      }
      extra={
        <Button
          type="text"
          size="small"
          onClick={() => window.location.href = `/submissions`}
          style={{
            color: '#722ed1', // Purple accent for this card
            fontWeight: 600,
            fontFamily: fontFamily,
            fontSize: '13px',
            backgroundColor: isDark ? 'rgba(114, 46, 209, 0.1)' : 'rgba(114, 46, 209, 0.05)',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          View All <ArrowRightOutlined style={{ fontSize: 10 }} />
        </Button>
      }
      styles={getMainCardStyles()}
      style={{
        borderRadius: '16px',
        border: `1px solid ${borderColor}`,
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.8)' : '0 4px 20px rgba(0,0,0,0.03)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: fontFamily,
        backgroundColor: backgroundColor
      }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          

          <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
       <Spin size="large" />

</ConfigProvider>
     
          <Text style={{ display: 'block', marginTop: 16, color: isDark ? '#6b7280' : '#999', fontFamily }}>
            Fetching recent work...
          </Text>
        </div>
      ) : workItems.length > 0 ? (
        <div
          className="custom-scrollbar"
          style={{
            height: '100%',
            overflowY: 'auto',
            padding: '0 16px',
          }}
        >
          {/* Scrollbar Styles */}
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
            dataSource={workItems.slice(0, maxItems)}
            split={false}
            renderItem={(item) => {
              const toolConfig = getToolConfig(item.type);
              
              return (
                <List.Item
                  style={{
                    padding: '16px 8px',
                    borderBottom: `1px dashed ${borderColor}`,
                    transition: 'all 0.2s',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleView(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? '#141414' : '#fafafa';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                  actions={[
                    <Button
                      type="text"
                      size="small"
                      key="view"
                      icon={<EyeOutlined />}
                      style={{
                        color: isDark ? '#6b7280' : '#999',
                        fontSize: 14,
                      }}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: '12px',
                          backgroundColor: isDark ? `${toolConfig.color}20` : toolConfig.bg,
                          border: `1px solid ${toolConfig.color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: toolConfig.color,
                          fontSize: 18,
                        }}>
                          {toolConfig.icon}
                        </div>
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ 
                          color: isDark ? '#f3f4f6' : '#111827', 
                          fontSize: '14px', 
                          fontFamily: fontFamily 
                        }}>
                          {item.title}
                        </Text>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ 
                             color: toolConfig.color, 
                             fontSize: 11, 
                             fontWeight: 600, 
                             fontFamily: fontFamily,
                             textTransform: 'uppercase',
                             letterSpacing: '0.05em'
                          }}>
                            {getTypeName(item.type)}
                          </span>
                          <span style={{ color: isDark ? '#4b5563' : '#d1d5db' }}>•</span>
                          <Text style={{ color: isDark ? '#9ca3af' : '#666', fontSize: 11, fontFamily }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </div>
                        
                        {/* Dynamic Metadata Section */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          {item.type === 'pricing-calc' && item.metadata.hourlyRate && 
                            renderMetadataPill(`$${item.metadata.hourlyRate}/hr`, 'success')}
                          
                          {item.type === 'cold-email' && item.metadata.emailCount && 
                            renderMetadataPill(`${item.metadata.emailCount} emails`)}
                          
                          {item.type === 'growth-plan' && item.metadata.strategies && 
                            renderMetadataPill(`${item.metadata.strategies} strategies`)}
                          
                          {item.type === 'offer-creator' && item.metadata.packages && 
                            renderMetadataPill(`${item.metadata.packages} packages`)}

                          {item.type === 'proposal' && item.metadata.winProbability && 
                            renderMetadataPill(`${item.metadata.winProbability}% win prob`, 'success')}
                          
                          {item.type === 'lead-generation' && item.metadata.leadCount && 
                            renderMetadataPill(`${item.metadata.leadCount} leads`, 'blue')}
                        </div>
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
          <RocketOutlined style={{ fontSize: 48, opacity: 0.5 }} />
          <div style={{ textAlign: 'center' }}>
            <Text style={{ display: 'block', color: isDark ? '#9ca3af' : '#6b7280', fontFamily: fontFamily, fontWeight: 500 }}>
              No deliverables yet
            </Text>
            <Button
              type="text"
              size="small"
              onClick={() => window.location.href = `/dashboard/${currentWorkspace?.slug}/tools`}
              style={{
                color: '#722ed1',
                fontFamily: fontFamily,
                marginTop: 8
              }}
            >
              Start using AI tools
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RecentDeliverables;