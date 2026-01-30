// components/tutorials/TutorialButton.tsx
"use client";

import React, { useState } from 'react';
import { Tooltip } from 'antd';
import { HelpCircle, Sparkles } from 'lucide-react';
import { useTutorial } from '../../providers/tutorial-provider/TutorialProvider';

// Matches the premium theme from your TutorialProvider
const THEME = {
  colors: {
    surface: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#a1a1aa',
    textHover: '#ffffff',
    brand: '#5CC49D',
    brandGlow: 'rgba(92, 196, 157, 0.15)',
  },
  fonts: {
    main: "'Manrope', sans-serif",
  }
};

export const TutorialButton: React.FC = () => {
  const { startTutorial } = useTutorial();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip 
      title="Start interactive tour" 
      placement="bottomRight"
      color="#09090b"
      overlayStyle={{ fontFamily: THEME.fonts.main, fontSize: '12px' }}
    >
      <button
        onClick={startTutorial}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          // Layout
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '36px',
          padding: '0 12px',
          
          // Surface & Border (Glassmorphism)
          backgroundColor: isHovered ? THEME.colors.brandGlow : THEME.colors.surface,
          border: `1px solid ${isHovered ? 'rgba(92, 196, 157, 0.3)' : THEME.colors.border}`,
          borderRadius: '10px',
          outline: 'none',
          
          // Typography
          color: isHovered ? THEME.colors.brand : THEME.colors.text,
          fontFamily: THEME.fonts.main,
          fontSize: '13px',
          fontWeight: 600,
          
          // Effects
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(8px)',
          boxShadow: isHovered 
            ? '0 0 12px rgba(92, 196, 157, 0.1)' 
            : 'none',
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          transition: 'transform 0.2s ease',
          transform: isHovered ? 'rotate(-10deg)' : 'none'
        }}>
          {/* Switched to Lucide for consistency with Provider */}
          <HelpCircle size={16} strokeWidth={2.5} />
        </div>
        
        <span>Help & Tour</span>
        
        {/* Subtle decorative sparkle on hover */}
        <div style={{
          width: isHovered ? '14px' : '0',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          opacity: isHovered ? 1 : 0,
          display: 'flex',
          alignItems: 'center'
        }}>
           <Sparkles size={12} fill={THEME.colors.brand} strokeWidth={0} />
        </div>
      </button>
    </Tooltip>
  );
};