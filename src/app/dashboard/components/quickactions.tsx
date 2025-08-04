// app/dashboard/components/QuickStartActions.tsx
import React from 'react';
import { Card, Avatar, Space, Typography, Grid, Button } from 'antd';
import { PlusOutlined, PlayCircleOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const QuickStartActions: React.FC = () => {
  const screens = useBreakpoint();
  const { theme } = useTheme();

  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: '16px',
    },
  });

  return (
    <Card
      title="Quick Start Actions"
      styles={getCardStyles()}
      style={{ marginBottom: 24 }}
      extra={<Button type="link">View All</Button>}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
          gap: 16,
        }}
      >
        <Card
          hoverable
          onClick={() => console.log('Create New Client')}
          styles={getCardStyles()}
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
            borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
          }}
        >
          <Space>
            <Avatar
              icon={<PlusOutlined />}
              style={{
                backgroundColor: theme === 'dark' ? '#1f2937' : '#e6f7ff',
                color: theme === 'dark' ? '#a78bfa' : '#1890ff',
              }}
            />
            <div>
              <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                Create New Client
              </Text>
              <br />
              <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                Add a new client profile
              </Text>
            </div>
          </Space>
        </Card>

        <Card
          hoverable
          onClick={() => console.log('Launch Tool')}
          styles={getCardStyles()}
          style={{
            textAlign: 'left',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
            borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
          }}
        >
          <Space>
            <Avatar icon={<PlayCircleOutlined />} style={{ backgroundColor: '#f6ffed', color: '#52c41a' }} />
            <div>
              <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                Launch Tool
              </Text>
              <br />
              <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                Run content generation tools
              </Text>
            </div>
          </Space>
        </Card>

        <Card
          hoverable
          onClick={() => console.log('Run Workflow')}
          styles={getCardStyles()}
          style={{
            textAlign: 'left',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
            borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
          }}
        >
          <Space>
            <Avatar icon={<SettingOutlined />} style={{ backgroundColor: '#f9f0ff', color: '#722ed1' }} />
            <div>
              <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                Run Workflow
              </Text>
              <br />
              <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                Execute automation workflows
              </Text>
            </div>
          </Space>
        </Card>

        <Card
          hoverable
          onClick={() => console.log('Deploy Agent')}
          styles={getCardStyles()}
          style={{
            textAlign: 'left',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
            borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
          }}
        >
          <Space>
            <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#fff7e6', color: '#fa8c16' }} />
            <div>
              <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                Deploy Agent
              </Text>
              <br />
              <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                Deploy AI agents
              </Text>
            </div>
          </Space>
        </Card>
      </div>
    </Card>
  );
};

export default QuickStartActions;