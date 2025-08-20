// app/dashboard/components/WelcomePanel.tsx
import React from 'react';
import { Button, Card, Typography, Grid, Statistic, Space } from 'antd';
import { 
  TeamOutlined, 
  SettingOutlined, 
  BarChartOutlined, 
  FileTextOutlined 
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';

const { Title } = Typography;
const { useBreakpoint } = Grid;

interface WelcomePanelProps {
  clientsLength: number;
  agentsLength: number;
  workflowsLength: number;
  deliverablesLength: number;
  workspaceName: string;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({
  clientsLength,
  agentsLength,
  workflowsLength,
  deliverablesLength,
  workspaceName
}) => {
  const { theme } = useTheme();
  const screens = useBreakpoint();

  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
      padding: screens.xs ? '8px' : '10px', // Reduced padding
      borderRadius: '8px',
      minHeight: 'auto', // Remove fixed height
    },
  });

  const getParentCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
      padding: screens.xs ? '12px' : '16px', // Reduced padding
      borderRadius: '12px',
    },
  });

  return (
    <div data-tour="welcome-panel" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title
          level={2}
          style={{
            margin: 0,
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            fontWeight: 700,
            fontSize: '22px', // Slightly smaller title
          }}
        >
          Welcome to {workspaceName} Arbitrage-OS !
        </Title>
        <Space>
          <Button
            type="default"
            size="small" // Smaller button
            style={{
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#e5e7eb' : '#1a1a1a',
              borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
            }}
          >
            Clear Selection
          </Button>
        </Space>
      </div>

      {/* Stats Overview Section */}
      <Card
        styles={getParentCardStyles()}
        style={{
          borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        }}
        bodyStyle={{ padding: '12px' }} // Additional padding control
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
            gap: screens.xs ? '8px' : '12px', // Reduced gap
          }}
        >
          <Card styles={getCardStyles()} bordered={false}>
            <Statistic
              title={
                <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '12px' }}>
                  Total Clients
                </span>
              }
              value={clientsLength}
              valueStyle={{ 
                color: theme === 'dark' ? '#F9FAFB' : '#111827', 
                fontSize: '16px',
                lineHeight: '1.2' // Tighter line height
              }}
              prefix={<TeamOutlined style={{ color: '#3B82F6', fontSize: '14px', marginRight: '4px' }} />}
            />
          </Card>
          <Card styles={getCardStyles()} bordered={false}>
            <Statistic
              title={
                <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '12px' }}>
                  Active Agents
                </span>
              }
              value={agentsLength}
              valueStyle={{ 
                color: theme === 'dark' ? '#F9FAFB' : '#111827', 
                fontSize: '16px',
                lineHeight: '1.2'
              }}
              prefix={<SettingOutlined style={{ color: '#10B981', fontSize: '14px', marginRight: '4px' }} />}
            />
          </Card>
          <Card styles={getCardStyles()} bordered={false}>
            <Statistic
              title={
                <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '12px' }}>
                  Workflows
                </span>
              }
              value={workflowsLength}
              valueStyle={{ 
                color: theme === 'dark' ? '#F9FAFB' : '#111827', 
                fontSize: '16px',
                lineHeight: '1.2'
              }}
              prefix={<BarChartOutlined style={{ color: '#8B5CF6', fontSize: '14px', marginRight: '4px' }} />}
            />
          </Card>
          <Card styles={getCardStyles()} bordered={false}>
            <Statistic
              title={
                <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '12px' }}>
                  Deliverables
                </span>
              }
              value={deliverablesLength}
              valueStyle={{ 
                color: theme === 'dark' ? '#F9FAFB' : '#111827', 
                fontSize: '16px',
                lineHeight: '1.2'
              }}
              prefix={<FileTextOutlined style={{ color: '#F59E0B', fontSize: '14px', marginRight: '4px' }} />}
            />
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default WelcomePanel;