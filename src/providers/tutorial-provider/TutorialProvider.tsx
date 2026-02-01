// providers/tutorial-provider/TutorialProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TourProvider, useTour, StepType, PopoverContentProps } from '@reactour/tour';
import { useTheme } from '../ThemeProvider';
import { Lightbulb, ChevronRight, ArrowRight, Check } from 'lucide-react';

// --- PREMIUM THEME CONSTANTS ---
const THEME = {
  colors: {
    bg: '#050505',
    surface: '#0A0A0B',
    surfaceHighlight: '#18181B',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.15)',
    textPrimary: '#EDEDED',
    textSecondary: '#A1A1AA',
    brand: '#5CC49D',
    brandText: '#000000',
    brandGlow: 'rgba(92, 196, 157, 0.25)',
    accent: '#A78BFA',
  },
  fonts: {
    main: "'Manrope', sans-serif",
  },
  shadows: {
    popover: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px -12px rgba(0,0,0,0.9), 0 0 80px -20px rgba(0,0,0,0.8)',
    button: '0 0 15px rgba(92, 196, 157, 0.15)',
  }
};

// --- CONTEXT SETUP ---
interface TutorialContextType {
  startTutorial: () => void;
  skipTutorial: () => void;
  isTutorialCompleted: boolean;
  setTutorialCompleted: (completed: boolean) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};

// --- UI COMPONENT: Step Header & Content ---
const StepHeader = ({ current, total, title }: { current: number; total: number; title: string }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '10px' 
    }}>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: 700, 
        textTransform: 'uppercase', 
        letterSpacing: '0.08em',
        color: THEME.colors.brand,
        background: 'rgba(92, 196, 157, 0.1)',
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px solid rgba(92, 196, 157, 0.2)'
      }}>
        Step {current} / {total}
      </span>
    </div>
    <h3 style={{
      fontSize: '18px',
      fontWeight: 700,
      color: THEME.colors.textPrimary,
      margin: 0,
      lineHeight: 1.3,
      letterSpacing: '-0.01em'
    }}>
      {title}
    </h3>
  </div>
);

const StepContent: React.FC<{ title: string; description: string; tip?: string }> = ({ title, description, tip }) => {
  const { currentStep, steps } = useTour();
  
  return (
    <div style={{ fontFamily: THEME.fonts.main }}>
      {/* Header */}
      <StepHeader current={currentStep + 1} total={steps.length} title={title} />
      
      {/* Description */}
      <p style={{
        fontSize: '14px',
        color: THEME.colors.textSecondary,
        lineHeight: 1.6,
        marginBottom: '20px',
        fontWeight: 400
      }}>
        {description}
      </p>

      {/* Premium Tip Card */}
      {tip && (
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '14px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${THEME.colors.border}`,
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ 
            color: THEME.colors.brand, 
            marginTop: '2px',
            filter: 'drop-shadow(0 0 8px rgba(92, 196, 157, 0.4))'
          }}>
            <Lightbulb size={16} strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: 700, 
              color: THEME.colors.brand, 
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Pro Tip
            </span>
            <p style={{
              fontSize: '13px',
              color: '#d4d4d8',
              margin: 0,
              lineHeight: 1.5
            }}>
              {tip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- DATA: Full Tutorial Steps Configuration ---
const tutorialSteps: StepType[] = [
  {
    selector: '[data-tour="workspace-header"]',
    content: (
      <StepContent
        title="Welcome to Arbitrage-OS"
        description="This is your workspace selector. Organize different projects or clients into separate workspaces for better management."
        tip="Create a workspace for each client to keep deliverables organized."
      />
    ),
  },
  {
    selector: '[data-tour="navigation-menu"]',
    content: (
      <StepContent
        title="Navigation Command Center"
        description="Your command center for all tools. The sidebar is organized into Strategy, Growth Engine, Agents, and Arbitrage AI."
        tip="Each section contains powerful tools designed for specific tasks."
      />
    ),
  },
  {
    selector: '[data-tour="sidebar-toggle"]',
    content: (
      <StepContent
        title="Focus Mode"
        description="Toggle this to expand or collapse the sidebar. Great for maximizing your workspace when working on detailed tasks."
      />
    ),
  },
  {
    selector: '[data-tour="welcome-panel"]',
    content: (
      <StepContent
        title="Dashboard Overview"
        description="Your central hub showing key metrics, recent activity, and quick access to important features."
      />
    ),
  },
  {
    selector: '[data-tour="quick-actions"]',
    content: (
      <StepContent
        title="Quick Actions"
        description="One-click access to your most common tasks. Launch the Ad Writer, create proposals, or start a new automation instantly."
        tip="These shortcuts save time on repetitive workflows."
      />
    ),
  },
  {
    selector: '[data-tour="activity-feed"]',
    content: (
      <StepContent
        title="Activity Feed"
        description="Track all your recent activities in real-time. See when automations complete, content is generated, or leads are captured."
      />
    ),
  },
  {
    selector: '[data-tour="recent-deliverables"]',
    content: (
      <StepContent
        title="Recent Deliverables"
        description="Access your latest generated content, proposals, and outputs. Export or copy them directly from here."
        tip="Click any deliverable to view, edit, or share it."
      />
    ),
  },
  {
    selector: '[data-tour="running-automations"]',
    content: (
      <StepContent
        title="Running Automations"
        description="Monitor your active automations, agents, and workflows. See progress, pause, or stop any running process."
      />
    ),
  },
  {
    selector: '[data-tour="strategy-section"]',
    content: (
      <StepContent
        title="Strategy Tools"
        description="Access powerful research and planning tools: Top 50 Niches, AI Tools directory, N8n Library, and the Prompt Directory."
        tip="Start here when entering a new market or planning campaigns."
      />
    ),
  },
  {
    selector: '[data-tour="growth-section"]',
    content: (
      <StepContent
        title="The Growth Engine"
        description="Your complete toolkit for growth: Ad Writer, Cold Email Writer, Proposal Generator, Lead Generation, and more."
        tip="The Growth Engine is the heart of Arbitrage-OS - master these tools!"
      />
    ),
  },
  {
    selector: '[data-tour="agents-section"]',
    content: (
      <StepContent
        title="AI Agents"
        description="Deploy autonomous AI agents to handle tasks. The Email Agent can manage outreach campaigns and follow up automatically."
        tip="Agents work 24/7 - set them up once and let them run."
      />
    ),
  },
  {
    selector: '[data-tour="automation-section"]',
    content: (
      <StepContent
        title="Arbitrage AI & Automation"
        description="The core intelligence of the platform. Set up complex automations that combine multiple tools and scale your operations."
        tip="Start with simple automations and gradually add complexity."
      />
    ),
  },
];

// --- LOGIC COMPONENT ---
const TutorialLogic: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTutorialCompleted, setIsTutorialCompleted] = useState(false);
  const { setIsOpen, setCurrentStep } = useTour();

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial-completed');
    const welcomeModalSeen = localStorage.getItem('welcome-modal-seen');

    if (tutorialCompleted === 'true') {
      setIsTutorialCompleted(true);
    } else {
      setIsTutorialCompleted(false);

      if (welcomeModalSeen === 'true' && !tutorialCompleted) {
        const timer = setTimeout(() => {
          setCurrentStep(0);
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [setIsOpen, setCurrentStep]);

  const startTutorial = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const skipTutorial = () => {
    setIsOpen(false);
    setIsTutorialCompleted(true);
    localStorage.setItem('tutorial-completed', 'true');
  };

  const setTutorialCompleted = (completed: boolean) => {
    setIsTutorialCompleted(completed);
    if (completed) {
      localStorage.setItem('tutorial-completed', 'true');
    } else {
      localStorage.removeItem('tutorial-completed');
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        startTutorial,
        skipTutorial,
        isTutorialCompleted,
        setTutorialCompleted,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

// --- CUSTOM NAVIGATION FOOTER ---
function CustomNavigation({ steps, currentStep, setIsOpen, setCurrentStep }: any) {
  const isLast = currentStep === steps.length - 1;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: `1px solid ${THEME.colors.border}`,
      pointerEvents: 'auto',
      position: 'relative',
      zIndex: 10001, // Ensure buttons are above all overlays
    }}>
      {/* Skip Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // ✅ Prevent event bubbling
          e.preventDefault();
          setIsOpen(false);
          localStorage.setItem('tutorial-completed', 'true');
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: THEME.colors.textSecondary,
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          padding: '8px 4px',
          transition: 'color 0.2s',
          fontFamily: THEME.fonts.main,
          pointerEvents: 'auto', // ✅ CRITICAL FIX
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = THEME.colors.textPrimary}
        onMouseLeave={(e) => e.currentTarget.style.color = THEME.colors.textSecondary}
      >
        Skip Tour
      </button>

      <div style={{ display: 'flex', gap: '12px', pointerEvents: 'auto' }}> {/* ✅ CRITICAL FIX */}
        {/* Previous Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // ✅ Prevent event bubbling
            e.preventDefault();
            setCurrentStep(Math.max(currentStep - 1, 0));
          }}
          disabled={currentStep === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'transparent',
            border: `1px solid ${currentStep === 0 ? 'transparent' : THEME.colors.border}`,
            color: currentStep === 0 ? 'rgba(255,255,255,0.1)' : THEME.colors.textPrimary,
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            pointerEvents: 'auto', // ✅ CRITICAL FIX
          }}
          onMouseEnter={(e) => {
            if (currentStep !== 0) {
              e.currentTarget.style.backgroundColor = THEME.colors.border;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>

        {/* Next/Finish Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // ✅ Prevent event bubbling
            e.preventDefault();
            if (isLast) {
              setIsOpen(false);
              localStorage.setItem('tutorial-completed', 'true');
            } else {
              setCurrentStep(currentStep + 1);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '42px',
            padding: '0 24px',
            borderRadius: '12px',
            background: isLast ? THEME.colors.brand : THEME.colors.surfaceHighlight,
            border: isLast ? 'none' : `1px solid ${THEME.colors.border}`,
            color: isLast ? THEME.colors.brandText : THEME.colors.textPrimary,
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: THEME.fonts.main,
            boxShadow: isLast ? THEME.shadows.button : 'none',
            pointerEvents: 'auto', // ✅ CRITICAL FIX
          }}
          onMouseEnter={(e) => {
            if (!isLast) {
              e.currentTarget.style.backgroundColor = THEME.colors.border;
              e.currentTarget.style.borderColor = THEME.colors.borderHover;
            } else {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLast) {
              e.currentTarget.style.backgroundColor = THEME.colors.surfaceHighlight;
              e.currentTarget.style.borderColor = THEME.colors.border;
            } else {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isLast ? 'Finish' : 'Next'}
          {isLast ? <Check size={16} strokeWidth={3} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}

// --- MAIN PROVIDER COMPONENT ---
interface TutorialProviderProps {
  children: React.ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const tourStyles = {
    popover: (base: any) => ({
      ...base,
      backgroundColor: 'rgba(10, 10, 11, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${THEME.colors.border}`,
      borderRadius: '20px',
      boxShadow: THEME.shadows.popover,
      color: THEME.colors.textPrimary,
      maxWidth: '420px',
      padding: '4px',
      zIndex: 10000,
      fontFamily: THEME.fonts.main,
      pointerEvents: 'auto', // ✅ CRITICAL FIX
    }),
    maskArea: (base: any) => ({ 
      ...base, 
      rx: 16,
      pointerEvents: 'none', // ✅ Disable clicks on highlighted element
    }),
    maskWrapper: (base: any) => ({ 
      ...base, 
      color: 'rgba(0, 0, 0, 0.7)',
      pointerEvents: 'none', // ✅ Let clicks pass through mask
    }),
    controls: (base: any) => ({ 
      ...base, 
      display: 'none' 
    }),
    close: (base: any) => ({
      ...base,
      right: '18px',
      top: '18px',
      color: THEME.colors.textSecondary,
      width: '12px',
      height: '12px',
      padding: '8px',
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: '50%',
      transition: 'all 0.2s',
      pointerEvents: 'auto', // ✅ CRITICAL FIX
    }),
  };

  const ContentWrapper = (props: PopoverContentProps) => {
    const { steps, currentStep, setCurrentStep, setIsOpen } = props;
    const stepContent = steps[currentStep]?.content;

    const renderedContent = typeof stepContent === 'function'
      ? null
      : stepContent;

    return (
      <div style={{ padding: '24px 24px 8px 24px', pointerEvents: 'auto' }}> {/* ✅ CRITICAL FIX */}
        {renderedContent}
        <CustomNavigation
          steps={steps}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          setIsOpen={setIsOpen}
        />
      </div>
    );
  };

  return (
    <TourProvider
      steps={tutorialSteps}
      styles={tourStyles}
      showBadge={false}
      showCloseButton={true}
      showNavigation={false}
      showDots={false}
      disableInteraction={false} // ✅ CHANGED: Allow interaction with popover
      className="arbitrage-tour-popover"
      maskClassName="arbitrage-tour-mask"
      ContentComponent={ContentWrapper}
      onClickClose={({ setIsOpen }) => {
        setIsOpen(false);
        localStorage.setItem('tutorial-completed', 'true');
      }}
      scrollSmooth={true}
      padding={{ mask: 10, popover: [10, 10] }}
    >
      <TutorialLogic>
        {children}
      </TutorialLogic>
    </TourProvider>
  );
};