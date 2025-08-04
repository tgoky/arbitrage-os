// app/dashboard/components/StatsOverview.tsx
import React from 'react';
import { Card, Statistic, Grid, Space } from 'antd';
import { TeamOutlined, SettingOutlined, BarChartOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';

const { useBreakpoint } = Grid;

interface StatsOverviewProps {
  clientsLength: number;
  agentsLength: number;
  workflowsLength: number;
  deliverablesLength: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
  clientsLength,
  agentsLength,
  workflowsLength,
  deliverablesLength,
}) => {
  const screens = useBreakpoint();
  const { theme } = useTheme();

  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
      padding: screens.xs ? '12px' : '16px',
      borderRadius: '8px',
    },
    header: {
      borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
      backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
    },
  });

  const getParentCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
      padding: screens.xs ? '16px' : '24px',
      borderRadius: '12px',
    },
  });

  return (
    <Card
      styles={getParentCardStyles()}
      style={{
        borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
          gap: screens.xs ? '12px' : '16px',
        }}
      >
        <Card styles={getCardStyles()} bordered={false}>
          <Statistic
            title={
              <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '14px' }}>
                Total Clients
              </span>
            }
            value={clientsLength}
            valueStyle={{ color: theme === 'dark' ? '#F9FAFB' : '#111827', fontSize: '20px' }}
            prefix={<TeamOutlined style={{ color: '#3B82F6', fontSize: '18px' }} />}
          />
        </Card>
        <Card styles={getCardStyles()} bordered={false}>
          <Statistic
            title={
              <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '14px' }}>
                Active Agents
              </span>
            }
            value={agentsLength}
            valueStyle={{ color: theme === 'dark' ? '#F9FAFB' : '#111827', fontSize: '20px' }}
            prefix={<SettingOutlined style={{ color: '#10B981', fontSize: '18px' }} />}
          />
        </Card>
        <Card styles={getCardStyles()} bordered={false}>
          <Statistic
            title={
              <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '14px' }}>
                Workflows
              </span>
            }
            value={workflowsLength}
            valueStyle={{ color: theme === 'dark' ? '#F9FAFB' : '#111827', fontSize: '20px' }}
            prefix={<BarChartOutlined style={{ color: '#8B5CF6', fontSize: '18px' }} />}
          />
        </Card>
        <Card styles={getCardStyles()} bordered={false}>
          <Statistic
            title={
              <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '14px' }}>
                Deliverables
              </span>
            }
            value={deliverablesLength}
            valueStyle={{ color: theme === 'dark' ? '#F9FAFB' : '#111827', fontSize: '20px' }}
            prefix={<FileTextOutlined style={{ color: '#F59E0B', fontSize: '18px' }} />}
          />
        </Card>
      </div>
    </Card>
  );
};

export default StatsOverview;