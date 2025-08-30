// src/components/OfferCreatorLoadingOverlay.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Progress, Typography, Button } from 'antd';
import { 
  LoadingOutlined, 
  MinusOutlined, 
  ExpandOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  CloseOutlined,
  FolderOutlined,
  SettingOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  DesktopOutlined,
  SaveOutlined,
  EditOutlined
} from '@ant-design/icons';

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
  onComplete?: () => void;
  onClose?: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, onComplete, onClose }) => {
  const [currentTip, setCurrentTip] = useState(offerCreatorLoadingTips[0]);
  const [progress, setProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [fileManagerPosition, setFileManagerPosition] = useState({ x: 100, y: 100 });
  const [settingsPosition, setSettingsPosition] = useState({ x: 300, y: 100 });

  const loadingSteps = [
    { id: 'validation', name: 'Validating inputs', duration: 800 },
    { id: 'headline', name: 'Crafting headline', duration: 1200 },
    { id: 'pricing', name: 'Calculating pricing', duration: 1600 },
    { id: 'assets', name: 'Generating assets', duration: 2000 },
    { id: 'export', name: 'Preparing export', duration: 2400 },
    { id: 'final', name: 'Finalizing offer', duration: 2800 },
  ];

  const fileManagerFiles = [
    { name: 'offer_draft.docx', icon: <FileTextOutlined />, size: '2.4MB', type: 'document' },
    { name: 'marketing_assets', icon: <FolderOutlined />, size: '15.7MB', type: 'folder' },
    { name: 'pricing_sheet.xlsx', icon: <FileTextOutlined />, size: '1.2MB', type: 'spreadsheet' },
    { name: 'brand_guidelines.pdf', icon: <FilePdfOutlined />, size: '8.9MB', type: 'document' },
    { name: 'product_images', icon: <FolderOutlined />, size: '32.1MB', type: 'folder' },
    { name: 'logo_final.png', icon: <FileImageOutlined />, size: '4.2MB', type: 'image' },
  ];

  const settingsOptions = [
    { name: 'Auto-save', value: 'Enabled', icon: <SaveOutlined /> },
    { name: 'Theme', value: 'Windows 98', icon: <DesktopOutlined /> },
    { name: 'Notifications', value: 'On', icon: <SettingOutlined /> },
    { name: 'Editor', value: 'Advanced', icon: <EditOutlined /> },
  ];

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      setCompletedSteps([]);
      setIsClosed(false);
      return;
    }

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
      setCurrentTip(offerCreatorLoadingTips[Math.floor(Math.random() * offerCreatorLoadingTips.length)]);
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
    setIsClosed(true);
    if (onClose) onClose();
  };

  if (!visible || isClosed) return null;

  const BrokenProgressBar = ({ percent }: { percent: number }) => {
    const totalSegments = 20;
    const filledSegments = Math.floor((percent / 100) * totalSegments);
    
    return (
      <div style={{
        display: 'flex',
        width: '100%',
        height: 16,
        backgroundColor: '#c0c0c0',
        border: '1px solid #808080',
        boxShadow: 'inset 1px 1px #fff, inset -1px -1px #0a0a0a',
        padding: 2,
        gap: 2
      }}>
        {Array.from({ length: totalSegments }).map((_, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              backgroundColor: index < filledSegments ? 
                (index < filledSegments - 2 ? '#000080' : '#008000') : 
                'transparent',
              border: index < filledSegments ? 'none' : '1px dotted #808080'
            }}
          />
        ))}
      </div>
    );
  };

  // Full File Manager Window
  const FileManagerWindow = () => (
    <div style={{
      position: 'fixed',
      top: fileManagerPosition.y,
      left: fileManagerPosition.x,
      width: 500,
      height: 400,
      background: '#c0c0c0',
      border: '2px solid #000',
      boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px grey, inset 2px 2px #fff',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        background: '#000080',
        color: '#fff',
        padding: '2px 4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'move'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOutlined style={{ fontSize: 14, color: '#fff' }} />
          <Text strong style={{ fontSize: 14, color: '#fff' }}>File Manager</Text>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <Button 
            style={{ 
              width: 20, 
              height: 20, 
              minWidth: 20, 
              padding: 0, 
              background: '#c0c0c0',
              border: '1px solid #000',
              boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
            }}
            icon={<MinusOutlined style={{ fontSize: 10 }} />} 
          />
          <Button 
            style={{ 
              width: 20, 
              height: 20, 
              minWidth: 20, 
              padding: 0, 
              background: '#c0c0c0',
              border: '1px solid #000',
              boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
            }}
            icon={<ExpandOutlined style={{ fontSize: 10 }} />} 
          />
          <Button 
            style={{ 
              width: 20, 
              height: 20, 
              minWidth: 20, 
              padding: 0, 
              background: '#c0c0c0',
              border: '1px solid #000',
              boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
            }}
            icon={<CloseOutlined style={{ fontSize: 10 }} />} 
            onClick={handleClose}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        background: '#c0c0c0',
        padding: '4px',
        borderBottom: '2px solid #808080',
        display: 'flex',
        gap: 4
      }}>
        <Button style={{ 
          padding: '2px 8px', 
          background: '#c0c0c0',
          border: '2px solid #808080',
          boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf',
          fontSize: 12
        }}>
          File
        </Button>
        <Button style={{ 
          padding: '2px 8px', 
          background: '#c0c0c0',
          border: '2px solid #808080',
          boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf',
          fontSize: 12
        }}>
          Edit
        </Button>
        <Button style={{ 
          padding: '2px 8px', 
          background: '#c0c0c0',
          border: '2px solid #808080',
          boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf',
          fontSize: 12
        }}>
          View
        </Button>
      </div>

      {/* Content Area */}
      <div style={{ 
        flex: 1, 
        padding: '8px',
        background: '#fff',
        margin: '4px',
        border: '2px solid #808080',
        boxShadow: 'inset 1px 1px #fff, inset -1px -1px #0a0a0a',
        overflow: 'auto'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
          {fileManagerFiles.map((file, index) => (
            <div key={index} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px',
              cursor: 'pointer',
              textAlign: 'center'
            }}>
              <div style={{
                width: 32,
                height: 32,
                background: '#c0c0c0',
                border: '2px solid #808080',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px'
              }}>
                {file.icon}
              </div>
              <span style={{ fontSize: 11, wordBreak: 'break-word' }}>{file.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        background: '#c0c0c0',
        padding: '2px 4px',
        borderTop: '2px solid #808080',
        fontSize: 11,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>6 objects</span>
        <span>127MB used</span>
      </div>
    </div>
  );

  // Full Settings Window
  const SettingsWindow = () => (
    <div style={{
      position: 'fixed',
      top: settingsPosition.y,
      left: settingsPosition.x,
      width: 400,
      height: 300,
      background: '#c0c0c0',
      border: '2px solid #000',
      boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px grey, inset 2px 2px #fff',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        background: '#000080',
        color: '#fff',
        padding: '2px 4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'move'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SettingOutlined style={{ fontSize: 14, color: '#fff' }} />
          <Text strong style={{ fontSize: 14, color: '#fff' }}>Settings</Text>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <Button 
            style={{ 
              width: 20, 
              height: 20, 
              minWidth: 20, 
              padding: 0, 
              background: '#c0c0c0',
              border: '1px solid #000',
              boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
            }}
            icon={<MinusOutlined style={{ fontSize: 10 }} />} 
          />
          <Button 
            style={{ 
              width: 20, 
              height: 20, 
              minWidth: 20, 
              padding: 0, 
              background: '#c0c0c0',
              border: '1px solid #000',
              boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
            }}
            icon={<ExpandOutlined style={{ fontSize: 10 }} />} 
          />
          <Button 
            style={{ 
              width: 20, 
              height: 20, 
              minWidth: 20, 
              padding: 0, 
              background: '#c0c0c0',
              border: '1px solid #000',
              boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
            }}
            icon={<CloseOutlined style={{ fontSize: 10 }} />} 
            onClick={handleClose}
          />
        </div>
      </div>

      {/* Content Area */}
      <div style={{ 
        flex: 1, 
        padding: '16px',
        background: '#fff',
        margin: '4px',
        border: '2px solid #808080',
        boxShadow: 'inset 1px 1px #fff, inset -1px -1px #0a0a0a'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {settingsOptions.map((option, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px',
              background: '#c0c0c0',
              border: '2px solid #808080'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {option.icon}
                <span style={{ fontSize: 12 }}>{option.name}</span>
              </div>
              <select style={{
                padding: '2px 4px',
                background: '#fff',
                border: '2px solid #808080',
                boxShadow: 'inset 1px 1px #fff, inset -1px -1px #0a0a0a',
                fontSize: 12
              }}>
                <option>{option.value}</option>
                <option>Disabled</option>
                <option>Basic</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div style={{
        padding: '8px',
        background: '#c0c0c0',
        borderTop: '2px solid #808080',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px'
      }}>
        <Button style={{ 
          padding: '4px 12px', 
          background: '#c0c0c0',
          border: '2px solid #808080',
          boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf',
          fontSize: 12
        }}>
          OK
        </Button>
        <Button style={{ 
          padding: '4px 12px', 
          background: '#c0c0c0',
          border: '2px solid #808080',
          boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf',
          fontSize: 12
        }}>
          Cancel
        </Button>
        <Button style={{ 
          padding: '4px 12px', 
          background: '#c0c0c0',
          border: '2px solid #808080',
          boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf',
          fontSize: 12
        }}>
          Apply
        </Button>
      </div>
    </div>
  );

  if (isMinimized) {
    return (
      <>
        <FileManagerWindow />
        <SettingsWindow />
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 300,
            background: '#c0c0c0',
            borderRadius: 0,
            padding: 4,
            boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px grey, inset 2px 2px #fff',
            border: '1px solid #000',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RocketOutlined style={{ color: '#000' }} />
              <Text strong style={{ fontSize: 12 }}>Generating Offers</Text>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              <Button 
                style={{ 
                  width: 20, 
                  height: 20, 
                  minWidth: 20, 
                  padding: 0, 
                  background: '#c0c0c0',
                  border: '1px solid #000',
                  boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
                }}
                icon={<ExpandOutlined style={{ fontSize: 10 }} />} 
                onClick={() => setIsMinimized(false)}
                size="small"
              />
              <Button 
                style={{ 
                  width: 20, 
                  height: 20, 
                  minWidth: 20, 
                  padding: 0, 
                  background: '#c0c0c0',
                  border: '1px solid #000',
                  boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
                }}
                icon={<CloseOutlined style={{ fontSize: 10 }} />} 
                onClick={handleClose}
                size="small"
              />
            </div>
          </div>
          <BrokenProgressBar percent={progress} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 10, color: '#000' }}>
              {currentTip}
            </Text>
            <Text style={{ fontSize: 10, color: '#000', fontWeight: 'bold' }}>
              {progress}%
            </Text>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FileManagerWindow />
      <SettingsWindow />
      
      <div
        style={{
          position: 'fixed',
          bottom: isMaximized ? 0 : 20,
          right: isMaximized ? 0 : 20,
          width: isMaximized ? '100%' : 400,
          height: isMaximized ? '100%' : 'auto',
          background: '#c0c0c0',
          borderRadius: 0,
          padding: 4,
          boxShadow: isMaximized ? 'none' : 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px grey, inset 2px 2px #fff',
          border: '1px solid #000',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
        aria-busy={visible}
        role="alert"
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: '#000080',
          color: '#fff',
          padding: '2px 4px',
          margin: -4,
          marginBottom: 4
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LoadingOutlined style={{ fontSize: 14, color: '#fff' }} spin />
            <Text strong style={{ fontSize: 14, color: '#fff' }}>Generating Signature Offers</Text>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <Button 
              style={{ 
                width: 20, 
                height: 20, 
                minWidth: 20, 
                padding: 0, 
                background: '#c0c0c0',
                border: '1px solid #000',
                boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
              }}
              icon={<MinusOutlined style={{ fontSize: 10 }} />} 
              onClick={() => setIsMinimized(true)}
            />
            <Button 
              style={{ 
                width: 20, 
                height: 20, 
                minWidth: 20, 
                padding: 0, 
                background: '#c0c0c0',
                border: '1px solid #000',
                boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
              }}
              icon={<ExpandOutlined style={{ fontSize: 10 }} />} 
              onClick={() => setIsMaximized(!isMaximized)}
            />
            <Button 
              style={{ 
                width: 20, 
                height: 20, 
                minWidth: 20, 
                padding: 0, 
                background: '#c0c0c0',
                border: '1px solid #000',
                boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
              }}
              icon={<CloseOutlined style={{ fontSize: 10 }} />} 
              onClick={handleClose}
            />
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: isMaximized ? 'column' : 'row', 
          alignItems: 'center', 
          gap: 8,
          flex: isMaximized ? 1 : 'none'
        }}>
          <div style={{ flex: isMaximized ? 'none' : 1, width: isMaximized ? '100%' : 'auto' }}>
            <BrokenProgressBar percent={progress} />
          </div>
          <Text strong style={{ fontSize: 12, color: '#000', minWidth: 40 }}>
            {progress}%
          </Text>
        </div>

        <div style={{ marginTop: 4, flex: isMaximized ? 1 : 'none' }}>
          <Text type="secondary" style={{ fontStyle: 'italic', fontSize: 12, color: '#000' }}>
            {currentTip}
          </Text>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMaximized ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: 8,
          flex: isMaximized ? 1 : 'none'
        }}>
          {loadingSteps.map((step) => (
            <div 
              key={step.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                opacity: completedSteps.includes(step.id) ? 0.7 : 1
              }}
            >
              {completedSteps.includes(step.id) ? (
                <CheckCircleOutlined style={{ color: '#008000', fontSize: 12 }} />
              ) : (
                <ClockCircleOutlined style={{ color: '#ff8c00', fontSize: 12 }} />
              )}
              <Text 
                style={{ 
                  fontSize: 12,
                  color: '#000',
                  textDecoration: completedSteps.includes(step.id) ? 'line-through' : 'none'
                }}
              >
                {step.name}
              </Text>
            </div>
          ))}
        </div>

        {!isMaximized && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: 4 
          }}>
            <Text type="secondary" style={{ fontSize: 10, color: '#000' }}>
              You can continue using the app while we generate your offers
            </Text>
          </div>
        )}
      </div>
    </>
  );
};

export default LoadingOverlay;