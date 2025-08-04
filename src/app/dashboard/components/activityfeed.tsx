// app/dashboard/components/ActivityFeed.tsx
import React from 'react';
import { Card, List, Tag, Typography, Button, Grid } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { ActivityItem } from './types';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface ActivityFeedProps {
  recentActivity: ActivityItem[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ recentActivity }) => {
  const screens = useBreakpoint();
  const { theme } = useTheme();

  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: screens.xs ? '16px' : '24px',
    },
    header: {
      borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    },
  });

  const getStatusIcon = (status: string) => {
    const iconStyle = {
      fontSize: 20,
      padding: 8,
      borderRadius: 4,
      backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
    };

    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'running':
        return <ClockCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#f5222d' }} />;
      case 'created':
        return <PlayCircleOutlined style={{ ...iconStyle, color: theme === 'dark' ? '#a78bfa' : '#6d28d9' }} />;
      default:
        return <ClockCircleOutlined style={{ ...iconStyle, color: '#d9d9d9' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'running':
        return 'blue';
      case 'failed':
        return 'red';
      case 'created':
        return 'purple';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <Card
      title="Activity Feed"
      styles={getCardStyles()}
      style={{
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      }}
      extra={
        <Button
          type="link"
          style={{
            color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
            backgroundColor: 'transparent',
          }}
        >
          View All
        </Button>
      }
    >
      {recentActivity.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={recentActivity}
          style={{
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
            borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
          }}
          renderItem={(item) => (
            <List.Item
              style={{
                borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
                padding: '12px 0',
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              }}
              actions={[
                <Tag
                  key="status"
                  color={getStatusColor(item.status)}
                  style={{
                    marginRight: 0,
                    textTransform: 'capitalize',
                  }}
                >
                  {item.status}
                </Tag>,
              ]}
            >
              <List.Item.Meta
                avatar={getStatusIcon(item.status)}
                title={
                  <Text
                    strong
                    style={{
                      color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                      marginBottom: 4,
                    }}
                  >
                    {item.action}
                  </Text>
                }
                description={
                  <Text
                    style={{
                      color: theme === 'dark' ? '#9ca3af' : '#666666',
                      fontSize: 14,
                    }}
                  >
                    {item.client} • {formatTimeAgo(item.timestamp)}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 0',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          }}
        >
          <ClockCircleOutlined
            style={{
              fontSize: 48,
              color: theme === 'dark' ? '#4b5563' : '#d1d5db',
              marginBottom: 16,
            }}
          />
          <Text
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              display: 'block',
              marginBottom: 8,
            }}
          >
            No recent activity
          </Text>
          <Button
            type="link"
            onClick={() => console.log('View activity')}
            style={{
              color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
              padding: '0 8px',
            }}
          >
            View activity history
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ActivityFeed;