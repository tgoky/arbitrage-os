// app/dashboard/components/StatsOverview.tsx
import React from 'react';
import { Card, Statistic, Grid } from 'antd';
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
    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    padding: '24px',
    borderRadius: '12px', // You can adjust the value
  },
  header: {
    borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
  },
});

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
        gap: 24,
      }}
    >
      <Card styles={getCardStyles()}>
        <Statistic
          title="Total Clients"
          value={clientsLength}
          prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
        />
      </Card>
      <Card styles={getCardStyles()}>
        <Statistic
          title="Active Agents"
          value={agentsLength}
          prefix={<SettingOutlined style={{ color: '#52c41a' }} />}
        />
      </Card>
      <Card styles={getCardStyles()}>
        <Statistic
          title="Workflows"
          value={workflowsLength}
          prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
        />
      </Card>
      <Card styles={getCardStyles()}>
        <Statistic
          title="Deliverables"
          value={deliverablesLength}
          prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
        />
      </Card>
    </div>
  );
};

export default StatsOverview;