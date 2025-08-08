
// components/TutorialButton.tsx
"use client";

import React from 'react';
import { Button } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useTutorial } from '../../providers/tutorial-provider/TutorialProvider';
import { useTheme } from '../../providers/ThemeProvider';

export const TutorialButton: React.FC = () => {
  const { startTutorial } = useTutorial();
  const { theme } = useTheme();

  return (
    <Button
      type="text"
      icon={<QuestionCircleOutlined />}
      onClick={startTutorial}
      className="tutorial-trigger-btn"
      style={{
        color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
        border: 'none',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
      title="Start Tutorial"
    >
      Help
    </Button>
  );
};