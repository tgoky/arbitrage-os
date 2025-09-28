// src/components/ModernLoadingOverlay.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { 
  CloseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const loadingTips = [
  'Crafting personalized subject lines...',
  'Optimizing email content for maximum impact...',
  'Analyzing your target audience...',
  'Generating compelling call-to-actions...',
  'Fine-tuning tone and style...',
  'Building follow-up sequence...',

];

interface LoadingOverlayProps {
  visible: boolean;
  onComplete?: () => void;
  onClose?: () => void;
  theme?: 'light' | 'dark';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  onComplete, 
  onClose,
  theme = 'light' 
}) => {
  const [currentTip, setCurrentTip] = useState(loadingTips[0]);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(visible);

  const loadingSteps = [
    { id: 'validation', name: 'Validating inputs', duration: 800 },
    { id: 'headline', name: 'Crafting headline', duration: 1200 },
    { id: 'pricing', name: 'Calculating nodes', duration: 1600 },
    { id: 'assets', name: 'Generating assets', duration: 2000 },
    { id: 'export', name: 'Preparing export', duration: 2400 },
    { id: 'final', name: 'Finalizing workflow', duration: 2800 },
  ];

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      setCompletedSteps([]);
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    
    const progressIncrements = [
      { target: 15, delay: 300 },
      { target: 35, delay: 800 },
      { target: 50, delay: 1200 },
      { target: 65, delay: 1800 },
      { target: 80, delay: 2400 },
      { target: 90, delay: 3000 },
      { target: 95, delay: 3500 },
      { target: 100, delay: 4000 },
    ];

    let currentIncrement = 0;
    const progressIntervals: NodeJS.Timeout[] = [];

    const startNextIncrement = () => {
      if (currentIncrement >= progressIncrements.length) {
        if (onComplete) onComplete();
        return;
      }

      const { target, delay } = progressIncrements[currentIncrement];
      const steps = target - progress;
      const stepSize = 1;
      const intervalTime = delay / steps;

      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= target) {
            clearInterval(interval);
            currentIncrement++;
            startNextIncrement();
            return prev;
          }
          return Math.min(prev + stepSize, target);
        });
      }, intervalTime);

      progressIntervals.push(interval);
    };

    startNextIncrement();

    const tipInterval = setInterval(() => {
      setCurrentTip(loadingTips[Math.floor(Math.random() * loadingTips.length)]);
    }, 2000);

    loadingSteps.forEach((step) => {
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, step.id]);
      }, step.duration);
    });

    return () => {
      progressIntervals.forEach(interval => clearInterval(interval));
      clearInterval(tipInterval);
    };
  }, [visible, onComplete]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!visible || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Premium Floating Loader - Theme Aware */}
      <div 
        className={`fixed bottom-8 right-8 rounded-2xl shadow-2xl backdrop-blur-md border p-5 z-50 pointer-events-auto min-w-96 ${
          isDark 
            ? 'bg-[#063f48] border-[#5CC49D]/20' 
            : 'bg-white border-gray-200/70'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Enhanced Animated Spinner */}
            <div className="relative">
              <div className={`animate-spin rounded-full h-5 w-5 border-2 ${
                isDark ? 'border-[#5CC49D]' : 'border-[#063f48]'
              } border-t-transparent`}></div>
              <div 
                className={`absolute inset-0 animate-spin rounded-full h-5 w-5 border-2 ${
                  isDark ? 'border-[#5CC49D]/20' : 'border-[#063f48]/20'
                } border-t-transparent`} 
                style={{ animationDirection: 'reverse', animationDuration: '3s' }} 
              />
            </div>
            
            <div className="flex flex-col">
              <span className={`text-sm font-semibold ${
                isDark ? 'text-white' : 'text-[#063f48]'
              }`}>
              Generating Email
              </span>
              <span className={`text-xs mt-0.5 ${
                isDark ? 'text-[#5CC49D]' : 'text-gray-600'
              }`}>
                {currentTip}
              </span>
            </div>
          </div>
          
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined className="text-xs" />}
            onClick={handleClose}
            className={`flex-shrink-0 ${
              isDark 
                ? 'text-[#5CC49D] hover:text-white hover:bg-[#5CC49D]/20' 
                : 'text-gray-500 hover:text-[#063f48] hover:bg-gray-100'
            }`}
          />
        </div>

        {/* Clean Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-xs font-medium ${
              isDark ? 'text-[#5CC49D]' : 'text-gray-600'
            }`}>
              Progress
            </span>
            <span className={`text-xs font-semibold ${
              isDark ? 'text-[#5CC49D]' : 'text-[#063f48]'
            }`}>
              {progress}%
            </span>
          </div>
          <div className={`relative h-1.5 rounded-full overflow-hidden ${
            isDark ? 'bg-[#5CC49D]/20' : 'bg-gray-200'
          }`}>
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out ${
                isDark ? 'bg-[#5CC49D]' : 'bg-[#063f48]'
              }`}
              style={{ width: `${progress}%` }}
            />
            {/* Subtle shine effect */}
            <div 
              className={`absolute top-0 left-0 h-full w-6 transform -skew-x-12 transition-all duration-1000 ${
                isDark ? 'bg-white/20' : 'bg-white/40'
              }`}
              style={{ 
                left: progress > 0 ? `${progress - 8}%` : '-8%',
                opacity: progress > 0 && progress < 100 ? 1 : 0
              }}
            />
          </div>
        </div>

        {/* Compact Progress Steps */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {loadingSteps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-1.5">
              <div className={`flex-shrink-0 w-3 h-3 rounded-full flex items-center justify-center ${
                completedSteps.includes(step.id)
                  ? isDark ? 'bg-[#5CC49D]' : 'bg-[#063f48]'
                  : isDark 
                    ? 'bg-[#5CC49D]/30' 
                    : 'bg-gray-300'
              }`}>
                {completedSteps.includes(step.id) && (
                  <CheckCircleOutlined className={`text-xs ${
                    isDark ? 'text-[#063f48]' : 'text-white'
                  }`} />
                )}
              </div>
              <span className={`text-[10px] truncate ${
                completedSteps.includes(step.id)
                  ? isDark 
                    ? 'text-[#5CC49D] font-medium' 
                    : 'text-[#063f48] font-medium'
                  : isDark 
                    ? 'text-[#5CC49D]/80' 
                    : 'text-gray-500'
              }`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>

        {/* Subtle Progress Dots */}
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                progress > (i + 1) * 30 
                  ? isDark ? 'bg-[#5CC49D]' : 'bg-[#063f48]'
                  : isDark ? 'bg-[#5CC49D]/30' : 'bg-gray-300'
              }`}
              style={{
                animation: progress < 100 ? `bounce 1.4s infinite ease-in-out` : 'none',
                animationDelay: `${i * 0.16}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;