// providers/tutorial-provider/TutorialProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TourProvider, useTour, StepType } from '@reactour/tour';
import { useTheme } from '../ThemeProvider';

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

// Tutorial steps configuration
const tutorialSteps: StepType[] = [
  {
    selector: '[data-tour="workspace-header"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Welcome to Your Workspace</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This is your workspace selector. You can create multiple workspaces to organize different projects or clients.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="navigation-menu"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Navigation Menu</h3>
        <p className="text-sm text-gray-900 dark:text-gray-300">
          Access all your tools, automations, and content from this sidebar. Click on any item to get started.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="sidebar-toggle"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Collapse Sidebar</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Toggle this button to expand or collapse the sidebar for more workspace.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="welcome-panel"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Dashboard Overview</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Your dashboard shows key metrics and quick stats about your workspace activities.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="quick-actions"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Quick Actions</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Start your most common tasks quickly with these action buttons.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="activity-feed"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Activity Feed</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Track all your recent activities, automations, and tool usage in real-time.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="recent-deliverables"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Recent Deliverables</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Access your latest deliverables and export or copy them as needed.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="running-automations"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Running Automations</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Monitor your active automations, agents, and workflows in progress.
        </p>
      </div>
    ),
  },
];

// Internal tutorial logic component
const TutorialLogic: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [isTutorialCompleted, setIsTutorialCompleted] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const { setIsOpen } = useTour();

  useEffect(() => {
    // Check localStorage after component mounts
    const tutorialCompleted = localStorage.getItem('tutorial-completed');
    const welcomeModalSeen = localStorage.getItem('welcome-modal-seen');
    
    setHasCheckedStorage(true);
    
    if (tutorialCompleted === 'true') {
      setIsTutorialCompleted(true);
    } else {
      setIsTutorialCompleted(false);
      
      // If no welcome modal has been seen, we'll let the modal handle the tour start
      // If welcome modal was seen but tour not completed, auto-start tour
      if (welcomeModalSeen === 'true' && !tutorialCompleted) {
        const timer = setTimeout(() => {
          console.log('Auto-starting tutorial for returning user');
          setIsOpen(true);
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [setIsOpen]);

  const startTutorial = () => {
    console.log('Starting tutorial manually');
    setIsOpen(true);
  };

  const skipTutorial = () => {
    console.log('Skipping tutorial');
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

interface TutorialProviderProps {
  children: React.ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const { theme } = useTheme();

  const tourStyles = {
    popover: (base: any) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: theme === 'dark'
        ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      color: theme === 'dark' ? '#f9fafb' : '#1f2937',
      maxWidth: '400px',
      zIndex: 10000,
    }),
    maskArea: (base: any) => ({
      ...base,
      rx: 8,
    }),
    badge: (base: any) => ({
      ...base,
      backgroundColor: '#6366f1',
      color: 'white',
      fontSize: '12px',
      fontWeight: '600',
    }),
    dot: (base: any, { current }: any) => ({
      ...base,
      backgroundColor: current ? '#6366f1' : theme === 'dark' ? '#374151' : '#d1d5db',
    }),
  };

  return (
    <TourProvider
      steps={tutorialSteps}
      styles={tourStyles}
      showBadge={true}
      showCloseButton={true}
      showNavigation={true}
      showDots={true}
      disableDotsNavigation={false}
      disableKeyboardNavigation={false}
      className="tour-popover"
      maskClassName="tour-mask"
      highlightedMaskClassName="tour-highlight"
      padding={{ mask: 10, popover: [10, 10] }}
      prevButton={({ setCurrentStep, currentStep }) => (
        <button
          onClick={() => setCurrentStep(Math.max(currentStep - 1, 0))}
          disabled={currentStep === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors mr-2
            ${currentStep === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
        >
          Previous
        </button>
      )}
      nextButton={({ setCurrentStep, currentStep, steps, setIsOpen }) => {
        const isLastStep = currentStep === steps!.length - 1;
        return (
          <button
            onClick={() => {
              if (isLastStep) {
                setIsOpen(false);
                localStorage.setItem('tutorial-completed', 'true');
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${isLastStep
                ? 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
              }`}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        );
      }}
      onClickClose={({ setIsOpen }) => {
        setIsOpen(false);
        localStorage.setItem('tutorial-completed', 'true');
      }}
      afterOpen={(target: Element | null) => {
        if (target) {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
        }
      }}
      beforeClose={() => {
        localStorage.setItem('tutorial-completed', 'true');
        return Promise.resolve();
      }}
    >
      <TutorialLogic>
        {children}
      </TutorialLogic>
    </TourProvider>
  );
};
