// src/components/OfferCreatorLoadingOverlay.tsx
import React, { useState, useEffect } from 'react';
import { Spin, Typography, Space, Progress } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

const offerCreatorLoadingTips = [
  'Crafting your offer headline...',
  'Calculating discount values...',
  'Generating marketing assets...',
  'Analyzing industry benchmarks...',
  'Optimizing call-to-action...',
  'Preparing export file...',
  'Fetching saved offers...',
  'Loading offer templates...',
];

interface LoadingOverlayProps {
  visible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  const [currentTip, setCurrentTip] = useState(offerCreatorLoadingTips[0]);
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
      setCurrentTip(offerCreatorLoadingTips[Math.floor(Math.random() * offerCreatorLoadingTips.length)]);
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
          indicator={<LoadingOutlined style={{ fontSize: 48, color: '#3f8600' }} spin />}
        />
        <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
          {currentTip}
        </Text>
        <Progress
          percent={progress}
          showInfo={false}
          style={{ width: 300 }}
          strokeColor="#3f8600"
        />
      </Space>
    </div>
  );
};

export default LoadingOverlay;