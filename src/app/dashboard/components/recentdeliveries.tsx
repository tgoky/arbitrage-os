// app/dashboard/components/RecentDeliverables.tsx
import React from 'react';
import { Card, List, Button, Typography, Grid } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { Deliverable } from './types';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface RecentDeliverablesProps {
  deliverables: Deliverable[];
}

const RecentDeliverables: React.FC<RecentDeliverablesProps> = ({ deliverables }) => {
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

  return (
    <Card
      title="Recent Deliverables"
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
      {deliverables.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={deliverables}
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
                  key="copy"
                  style={{
                    color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                    padding: '0 4px',
                    height: 'auto',
                    fontSize: 12,
                  }}
                >
                  Copy
                </Button>,
                <Button
                  type="text"
                  size="small"
                  key="export"
                  style={{
                    color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                    padding: '0 4px',
                    height: 'auto',
                    fontSize: 12,
                  }}
                >
                  Export
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <FileTextOutlined
                    style={{
                      color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                      fontSize: 16,
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                      padding: 6,
                      borderRadius: 4,
                    }}
                  />
                }
                title={
                  <Text
                    strong
                    style={{
                      color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                      marginBottom: 2,
                      fontSize: 13,
                    }}
                  >
                    {item.title}
                  </Text>
                }
                description={
                  <Text
                    style={{
                      color: theme === 'dark' ? '#9ca3af' : '#666666',
                      fontSize: 12,
                    }}
                  >
                    {item.clientId}
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
          <FileTextOutlined
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
            No deliverables yet
          </Text>
          <Button
            type="text"
            size="small"
            onClick={() => console.log('Create deliverable')}
            style={{
              color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
              padding: 0,
              height: 'auto',
              fontSize: 12,
            }}
          >
            Create your first deliverable
          </Button>
        </div>
      )}
    </Card>
  );
};

export default RecentDeliverables;