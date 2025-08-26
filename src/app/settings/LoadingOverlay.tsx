// src/components/LoadingOverlay.tsx
import React, { useState, useEffect } from 'react';
import { Spin, Typography, Space, Progress } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

const adLoadingTips = [
  'Crafting compelling ad headlines...',
  'Optimizing copy for maximum conversions...',
  'Analyzing your target audience...',
  'Generating powerful call-to-actions...',
  'Tailoring content for selected platforms...',
  'Building high-impact ad variations...',
];

interface LoadingOverlayProps {
  visible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  const [currentTip, setCurrentTip] = useState(adLoadingTips[0]);
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
      setCurrentTip(adLoadingTips[Math.floor(Math.random() * adLoadingTips.length)]);
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