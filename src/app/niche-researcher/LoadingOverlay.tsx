// src/components/NicheResearchLoadingOverlay.tsx
import React, { useState, useEffect } from 'react';
import { Spin, Typography, Space, Progress } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

const nicheResearchLoadingTips = [
  'Analyzing your professional background...',
  'Evaluating market opportunities...',
  'Matching skills to niches...',
  'Assessing network advantages...',
  'Generating niche recommendations...',
  'Calculating financial projections...',
];

interface LoadingOverlayProps {
  visible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  const [currentTip, setCurrentTip] = useState(nicheResearchLoadingTips[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        return prev + 10;
      });
    }, 800);

    const tipInterval = setInterval(() => {
      setCurrentTip(nicheResearchLoadingTips[Math.floor(Math.random() * nicheResearchLoadingTips.length)]);
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
          indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />}
        />
        <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
          {currentTip}
        </Text>
        <Progress
          percent={progress}
          showInfo={false}
          style={{ width: 300 }}
          strokeColor="#1890ff"
        />
      </Space>
    </div>
  );
};

export default LoadingOverlay;