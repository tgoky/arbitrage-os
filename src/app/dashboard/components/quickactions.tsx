// app/dashboard/components/QuickStartActions.tsx
"use client"; // Ensure it's a client component for useRouter
import React from 'react';
import { Card, Avatar, Space, Typography, Grid, Button } from 'antd';
import { PlusOutlined, PlayCircleOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { useRouter } from 'next/navigation'; // Import useRouter from next/navigation for App Router

const { Text } = Typography;
const { useBreakpoint } = Grid;

const QuickStartActions: React.FC = () => {
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const router = useRouter(); // Initialize the router

  const getMainCardStyles = () => ({
    header: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
    },
    body: {
      backgroundColor: theme === 'dark' ? '#073c59' : '#ffffff', // Kept the blue body for the main card
      padding: '16px',
    },
  });

  const getActionCardStyles = () => {
    const baseBorderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
    const hoverBorderColor = theme === 'dark' ? '#4b5563' : '#d1d5db';
    const hoverBgColor = theme === 'dark' ? '#1f2937' : '#f3f4f6';
    return {
      body: {
        padding: '16px',
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff', // Card background
        borderRadius: '8px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${baseBorderColor}`,
      },
      hover: {
        borderColor: hoverBorderColor,
        backgroundColor: hoverBgColor,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }
    };
  };

  const avatarColors = [
    { bg: theme === 'dark' ? '#1f2937' : '#e6f7ff', color: theme === 'dark' ? '#a78bfa' : '#1890ff' },
    { bg: theme === 'dark' ? '#1f2937' : '#f6ffed', color: theme === 'dark' ? '#86efac' : '#52c41a' },
    { bg: theme === 'dark' ? '#1f2937' : '#f9f0ff', color: theme === 'dark' ? '#d8b4fe' : '#722ed1' },
    { bg: theme === 'dark' ? '#1f2937' : '#fff7e6', color: theme === 'dark' ? '#fdba74' : '#fa8c16' },
  ];

  // Define the actions with their navigation paths
  const actions = [
    { 
      icon: <PlusOutlined />, 
      title: 'Create New Client', 
      description: 'Add a new client profile',
      path: '/client-profiles' // <-- Adjust this path to your actual client profile route
    },
    { 
      icon: <PlayCircleOutlined />, 
      title: 'Launch Tool', 
      description: 'Run gen tools',
      path: '/tools-playbook' // <-- Example path, adjust as needed
    },
    { 
      icon: <SettingOutlined />, 
      title: 'Run Workflow', 
      description: 'Execute auto workflows',
      path: '/workflows' // <-- Example path, adjust as needed
    },
    { 
      icon: <TeamOutlined />, 
      title: 'Deploy Agent', 
      description: 'Deploy AI agents',
      path: '/agents' // <-- Example path, adjust as needed
    },
  ];

  const handleCardClick = (path: string) => {
    // Use router.push to navigate to the specified path
    router.push(path);
  };

  return (
    <Card
    data-tour="quick-actions"
      title={
        <Text strong style={{ fontSize: '18px', color: theme === 'dark' ? '#f9fafb' : '#111827' }}>
          Quick Start Actions
        </Text>
      }
      styles={getMainCardStyles()}
      style={{ 
        marginBottom: 24, 
        borderRadius: '8px', 
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
      }}
      extra={
        <Button 
          type="link" 
          style={{ color: theme === 'dark' ? '#a78bfa' : '#1890ff', fontWeight: 500 }}
          onClick={() => router.push('/dashboard')} // Example: View All could go to main dashboard or actions list
        >
          View All
        </Button>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : screens.md ? 'repeat(2, 1fr)' : '1fr',
          gap: '16px',
        }}
      >
        {actions.map((action, index) => (
          <Card
            key={index}
            hoverable // Optional: keep hoverable for visual feedback
            onClick={() => handleCardClick(action.path)} // <-- Updated onClick handler
            styles={getActionCardStyles()}
            style={{
              borderRadius: '8px',
              cursor: 'pointer', // Ensure cursor indicates it's clickable
            }}
          >
            <Space size="middle" align="start">
              <Avatar
                icon={action.icon}
                size="default"
                style={{
                  backgroundColor: avatarColors[index].bg,
                  color: avatarColors[index].color,
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              />
              <div>
                <Text
                  strong
                  style={{
                    display: 'block',
                    color: theme === 'dark' ? '#f9fafb' : '#111827',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    marginBottom: '4px',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {action.title}
                </Text>
                <Text
                  style={{
                    color: theme === 'dark' ? '#9ca3af' : '#20242d',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {action.description}
                </Text>
              </div>
            </Space>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default QuickStartActions;