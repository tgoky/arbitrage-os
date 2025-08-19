// src/components/GrowthPlanLoadingOverlay.tsx
import React, { useState, useEffect } from 'react';
import { Spin, Typography, Space, Progress } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

const growthPlanLoadingTips = [
  'Analyzing industry trends...',
  'Crafting strategic roadmap...',
  'Optimizing growth projections...',
  'Building KPI targets...',
  'Evaluating channel allocations...',
  'Generating actionable insights...',
];

interface LoadingOverlayProps {
  visible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  const [currentTip, setCurrentTip] = useState(growthPlanLoadingTips[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        return prev + 10;
      });
    }, 800);

    // Rotate tips
    const tipInterval = setInterval(() => {
      setCurrentTip(growthPlanLoadingTips[Math.floor(Math.random() * growthPlanLoadingTips.length)]);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      aria-busy={visible}
      role="alert"
    >
      <Space direction="vertical" align="center" size="large">
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 48, color: '#722ed1' }} spin />}
        />
        <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
          {currentTip}
        </Text>
        <Progress
          percent={progress}
          showInfo={false}
          style={{ width: 300 }}
          strokeColor="#722ed1"
        />
      </Space>
    </div>
  );
};

export default LoadingOverlay;