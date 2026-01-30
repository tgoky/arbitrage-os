// components/tutorials/WelcomeTutorialModal.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { 
  Rocket, 
  Play, 
  PenTool, 
  Users, 
  Bot, 
  Zap, 
  X 
} from 'lucide-react';
import { useTutorial } from '../../providers/tutorial-provider/TutorialProvider';

// --- THEME CONSTANTS ---
const THEME = {
  colors: {
    bg: '#050505',
    surface: '#0A0A0B',
    surfaceHighlight: '#121214',
    border: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#EDEDED',
    textSecondary: '#A1A1AA',
    brand: '#5CC49D',
    brandText: '#000000',
    brandGlow: 'rgba(92, 196, 157, 0.25)',
  },
  fonts: {
    main: "'Manrope', sans-serif",
  }
};

// --- FEATURE LIST DATA ---
const FEATURES = [
  { icon: PenTool, label: 'Ad & Email Writer' },
  { icon: Users, label: 'Lead Generation' },
  { icon: Bot, label: 'AI Agents' },
  { icon: Zap, label: 'Automations' },
];

export const WelcomeTutorialModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { startTutorial, skipTutorial } = useTutorial();

  // Button Hover States
  const [skipHover, setSkipHover] = useState(false);
  const [startHover, setStartHover] = useState(false);

  useEffect(() => {
    const checkAndShowWelcome = () => {
      const hasSeenWelcome = localStorage.getItem('welcome-modal-seen');
      const tutorialCompleted = localStorage.getItem('tutorial-completed');

      if (!hasSeenWelcome && !tutorialCompleted) {
        setIsVisible(true);
      }
    };

    const timer = setTimeout(checkAndShowWelcome, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleStartTutorial = () => {
    setIsVisible(false);
    localStorage.setItem('welcome-modal-seen', 'true');
    setTimeout(() => startTutorial(), 300);
  };

  const handleSkipTutorial = () => {
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
      width={460}
      styles={{
        content: {
          backgroundColor: THEME.colors.bg,
          borderRadius: '24px',
          padding: '0',
          border: `1px solid ${THEME.colors.border}`,
          boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255,255,255,0.05)',
          overflow: 'hidden',
        },
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        },
      }}
      destroyOnClose={true}
    >
      <div style={{ fontFamily: THEME.fonts.main, position: 'relative' }}>
        
        {/* Subtle decorative background gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: `radial-gradient(circle at 50% -20%, ${THEME.colors.surfaceHighlight} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* --- HEADER SECTION --- */}
        <div style={{
          padding: '48px 32px 32px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Hero Icon */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            backgroundColor: 'rgba(92, 196, 157, 0.1)',
            border: '1px solid rgba(92, 196, 157, 0.2)',
            marginBottom: '24px',
            boxShadow: '0 0 40px -10px rgba(92, 196, 157, 0.3)',
          }}>
            <Rocket size={32} color={THEME.colors.brand} strokeWidth={2} />
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: THEME.colors.textPrimary,
            marginBottom: '12px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            Welcome to Arbitrage-OS
          </h2>

          <p style={{
            fontSize: '15px',
            color: THEME.colors.textSecondary,
            lineHeight: 1.6,
            maxWidth: '320px',
            margin: '0 auto',
          }}>
            Your AI-powered growth platform is ready. Take a quick tour to discover your new superpowers.
          </p>
        </div>

        {/* --- FEATURES GRID --- */}
        <div style={{
          padding: '24px 32px',
          backgroundColor: THEME.colors.surface,
          borderTop: `1px solid ${THEME.colors.border}`,
          borderBottom: `1px solid ${THEME.colors.border}`,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}>
            {FEATURES.map((feature, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: `1px solid ${THEME.colors.border}`,
              }}>
                <feature.icon size={18} color={THEME.colors.brand} />
                <span style={{
                  fontSize: '13px',
                  color: THEME.colors.textPrimary,
                  fontWeight: 500,
                  letterSpacing: '0.01em'
                }}>
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --- ACTIONS FOOTER --- */}
        <div style={{
          padding: '24px 32px 32px',
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          backgroundColor: THEME.colors.bg,
        }}>
          {/* Skip Button */}
          <button
            onClick={handleSkipTutorial}
            onMouseEnter={() => setSkipHover(true)}
            onMouseLeave={() => setSkipHover(false)}
            style={{
              flex: 1,
              height: '48px',
              backgroundColor: 'transparent',
              border: `1px solid ${skipHover ? THEME.colors.textSecondary : THEME.colors.border}`,
              borderRadius: '12px',
              color: skipHover ? THEME.colors.textPrimary : THEME.colors.textSecondary,
              fontFamily: THEME.fonts.main,
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Skip for now
          </button>

          {/* Start Button */}
          <button
            onClick={handleStartTutorial}
            onMouseEnter={() => setStartHover(true)}
            onMouseLeave={() => setStartHover(false)}
            style={{
              flex: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '48px',
              backgroundColor: THEME.colors.brand,
              border: 'none',
              borderRadius: '12px',
              color: THEME.colors.brandText,
              fontFamily: THEME.fonts.main,
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: startHover ? 0.9 : 1,
              boxShadow: '0 0 20px rgba(92, 196, 157, 0.25)',
            }}
          >
            <Play size={16} fill="currentColor" strokeWidth={0} />
            Start Tour
          </button>
        </div>
      </div>
    </Modal>
  );
};