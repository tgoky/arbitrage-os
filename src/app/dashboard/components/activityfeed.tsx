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
      padding: screens.xs ? '8px' : '12px',
    },
    header: {
      borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: '8px 12px',
    },
  });

  const getStatusIcon = (status: string) => {
    const iconStyle = {
      fontSize: 16,
      padding: 6,
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
          type="text"
          size="small"
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
                padding: '8px 0',
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              }}
              actions={[
                <Tag
                  key="status"
                  color={getStatusColor(item.status)}
                  style={{
                    marginRight: 0,
                    textTransform: 'capitalize',
                    fontSize: 12,
                    padding: '0 4px',
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
                      marginBottom: 2,
                      fontSize: 13,
                    }}
                  >
                    {item.action}
                  </Text>
                }
                description={
                  <Text
                    style={{
                      color: theme === 'dark' ? '#9ca3af' : '#666666',
                      fontSize: 12,
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
            padding: '16px 0',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          }}
        >
          <ClockCircleOutlined
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
            No recent activity
          </Text>
          <Button
            type="text"
            size="small"
            onClick={() => console.log('View activity')}
            style={{
              color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
              padding: 0,
              height: 'auto',
              fontSize: 12,
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