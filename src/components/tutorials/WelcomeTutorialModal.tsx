// Updated WelcomeTutorialModal component
// components/WelcomeTutorialModal.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Button, Typography } from 'antd';
import { RocketOutlined, BookOutlined } from '@ant-design/icons';
import { useTutorial } from '../../providers/tutorial-provider/TutorialProvider';
import { useTheme } from '../../providers/ThemeProvider';

const { Title, Paragraph } = Typography;

export const WelcomeTutorialModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { startTutorial, skipTutorial } = useTutorial();
  const { theme } = useTheme();

  useEffect(() => {
    // Check localStorage after a brief delay to ensure everything is loaded
    const checkAndShowWelcome = () => {
      const hasSeenWelcome = localStorage.getItem('welcome-modal-seen');
      const tutorialCompleted = localStorage.getItem('tutorial-completed');
      
      console.log('Welcome modal check:', { hasSeenWelcome, tutorialCompleted });
      
      // Show welcome modal for completely new users
      if (!hasSeenWelcome && !tutorialCompleted) {
        console.log('Showing welcome modal for new user');
        setIsVisible(true);
      }
    };

    // Small delay to ensure the page is fully loaded
    const timer = setTimeout(checkAndShowWelcome, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleStartTutorial = () => {
    console.log('User clicked start tutorial from welcome modal');
    setIsVisible(false);
    localStorage.setItem('welcome-modal-seen', 'true');
    
    // Start tutorial after modal closes
    setTimeout(() => {
      startTutorial();
    }, 300);
  };

  const handleSkipTutorial = () => {
    console.log('User skipped tutorial from welcome modal');
    setIsVisible(false);
    localStorage.setItem('welcome-modal-seen', 'true');
    skipTutorial();
  };

  if (!isVisible) return null;

  return (
    <Modal
      open={isVisible}
      onCancel={handleSkipTutorial}
      footer={null}
      centered
      closable={false}
      width={500}
      style={{
        borderRadius: '16px',
      }}
      styles={{
        content: {
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          borderRadius: '16px',
          padding: '0',
        },
      }}
      maskStyle={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      }}
      destroyOnClose={true}
    >
      <div 
        className="text-center p-8"
        style={{
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        }}
      >
        <div className="mb-6">
          <RocketOutlined 
            style={{ 
              fontSize: '48px', 
              color: theme === 'dark' ? '#a78bfa' : '#6d28d9' 
            }} 
          />
        </div>
        
        <Title 
          level={2} 
          style={{ 
            color: theme === 'dark' ? '#f9fafb' : '#1f2937',
            marginBottom: '16px',
            fontWeight: 'bold',
          }}
        >
          Welcome to Arbitrage-OS!
        </Title>
        
        <Paragraph 
          style={{ 
            color: theme === 'dark' ? '#d1d5db' : '#6b7280',
            fontSize: '16px',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}
        >
          Ready to explore all the powerful features? Take a quick tour to learn how everything works, 
          or jump right in and explore on your own.
        </Paragraph>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button
            size="large"
            onClick={handleSkipTutorial}
            style={{
              backgroundColor: 'transparent',
              borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
              color: theme === 'dark' ? '#d1d5db' : '#6b7280',
              height: '44px',
              paddingLeft: '24px',
              paddingRight: '24px',
            }}
          >
            Skip for now
          </Button>
          
          <Button
            type="primary"
            size="large"
            icon={<BookOutlined />}
            onClick={handleStartTutorial}
            style={{
              backgroundColor: theme === 'dark' ? '#6366f1' : '#6366f1',
              borderColor: theme === 'dark' ? '#6366f1' : '#6366f1',
              height: '44px',
              paddingLeft: '24px',
              paddingRight: '24px',
            }}
          >
            Start Tutorial
          </Button>
        </div>
      </div>
    </Modal>
  );
};
