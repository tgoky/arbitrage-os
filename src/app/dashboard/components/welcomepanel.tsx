// app/dashboard/components/WelcomePanel.tsx
import React from 'react';
import { Button, Space, Typography } from 'antd';
import { useTheme } from '../../../providers/ThemeProvider';

const { Title, Text } = Typography;

interface WelcomePanelProps {
  clientsLength: number;
  agentsLength: number;
  workflowsLength: number;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({
  clientsLength,
  agentsLength,
  workflowsLength,
}) => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <div>
        <Title
          level={3}
          style={{
            margin: 0,
            color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
          }}
        >
          Welcome to ArbitrageOS
        </Title>
        <Text
          style={{
            color: theme === 'dark' ? '#9ca3af' : '#666666',
          }}
        >
          {clientsLength} clients • {agentsLength} active agents • {workflowsLength} workflows
        </Text>
      </div>
      <Space>
        <Button
          type="default"
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
  );
};

export default WelcomePanel;