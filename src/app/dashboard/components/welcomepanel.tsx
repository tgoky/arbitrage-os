// app/dashboard/components/WelcomePanel.tsx
import React from 'react';
import { Button, Card, Col, Row, Space, Typography } from 'antd';
import { useTheme } from '../../../providers/ThemeProvider';

const { Title, Text } = Typography;

interface WelcomePanelProps {
  clientsLength: number;
  agentsLength: number;
  workflowsLength: number;
    workspaceName: string; // 👈 Add this line
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({
  clientsLength,
  agentsLength,
  workflowsLength,
  workspaceName
}) => {
  const { theme } = useTheme();

  const cardStyle = {
    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
    borderRadius: 8,
    padding: '12px 16px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  };

  const metricValueStyle = {
    fontSize: '18px',
    fontWeight: 600,
    color: theme === 'dark' ? '#f9fafb' : '#111827',
    lineHeight: 1.25,
  };

  const metricLabelStyle = {
    fontSize: '14px',
    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
  };

  return (
    <div   data-tour="welcome-panel" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title
          level={2}
          style={{
            margin: 0,
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            fontWeight: 700,
            fontSize: '24px',
          }}
        >
          Welcome to {workspaceName} Arbitrage-OS !{/* 👈 Use it here */}
        </Title>
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

      <Row gutter={16}>
        <Col span={8}>
          <Card bordered={true} style={cardStyle} bodyStyle={{ padding: 0 }}>
            <Text style={metricValueStyle}>{clientsLength}</Text>
            <div style={metricLabelStyle}>Clients</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={true} style={cardStyle} bodyStyle={{ padding: 0 }}>
            <Text style={metricValueStyle}>{agentsLength}</Text>
            <div style={metricLabelStyle}>Active Agents</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={true} style={cardStyle} bodyStyle={{ padding: 0 }}>
            <Text style={metricValueStyle}>{workflowsLength}</Text>
            <div style={metricLabelStyle}>Workflows</div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WelcomePanel;