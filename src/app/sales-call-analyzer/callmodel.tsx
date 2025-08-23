// components/NewCallModal.tsx
"use client";

import React, { useState } from 'react';
import {
  Modal,
  Card,
  Button,
  Typography,
  Space,
  message
} from 'antd';
import {
  PhoneOutlined,
  UploadOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  UserOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { useGo } from "@refinedev/core";

const { Title, Text } = Typography;

interface NewCallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NewCallModal({ visible, onClose }: NewCallModalProps) {
  const go = useGo();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const callOptions = [
    {
      key: 'live',
      title: 'Join a live call',
      description: 'Get real-time AI assistance during your call',
      icon: <PhoneOutlined className="text-2xl text-blue-500" />,
      badge: 'Live',
      badgeColor: 'bg-green-500',
      action: () => {
        message.info('Live call feature coming soon!');
        onClose();
      }
    },
    {
      key: 'upload',
      title: 'Review an existing call recording',
      description: 'Upload audio/video to get detailed analysis',
      icon: <UploadOutlined className="text-2xl text-purple-500" />,
      action: () => {
        go({ to: "/sales-call-analyzer/review-recording" });
        onClose();
      }
    },
    {
      key: 'transcript',
      title: 'Analyze a transcript',
      description: 'Paste or upload a text transcript for analysis',
      icon: <EditOutlined className="text-2xl text-orange-500" />,
      action: () => {
        go({ to: "/sales-call-analyzer/review-recording" });
        onClose();
      }
    },
    {
      key: 'meeting',
      title: 'Connect meeting platform',
      description: 'Auto-analyze calls from Zoom, Teams, or Meet',
      icon: <LinkOutlined className="text-2xl text-green-500" />,
      badge: 'Pro',
      badgeColor: 'bg-blue-500',
      action: () => {
        message.info('Meeting platform integration coming soon!');
        onClose();
      }
    }
  ];

  const handleCardClick = (option: any) => {
    setSelectedOption(option.key);
    option.action();
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <PlusOutlined className="mr-2" />
          <span>New Call Analysis</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="new-call-modal"
    >
      <div className="mb-6">
        <Text type="secondary">
          Choose how you will like to analyze your sales call. You can join live calls, 
          upload recordings, or analyze transcripts.
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {callOptions.map((option) => (
          <Card
            key={option.key}
            hoverable
            className={`border-2 transition-all duration-200 cursor-pointer ${
              selectedOption === option.key 
                ? 'border-blue-500 shadow-lg' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handleCardClick(option)}
          >
            <div className="relative">
              {option.badge && (
                <div className={`absolute top-0 right-0 -mt-2 -mr-2 px-2 py-1 ${option.badgeColor} text-white text-xs rounded-full`}>
                  {option.badge}
                </div>
              )}
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {option.icon}
                </div>
                
                <div className="flex-grow">
                  <Title level={5} className="mb-2">
                    {option.title}
                  </Title>
                  <Text type="secondary" className="text-sm">
                    {option.description}
                  </Text>
                </div>
              </div>

              {/* Quick action indicators */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {option.key === 'live' && (
                      <>
                        <span className="flex items-center">
                          <SoundOutlined className="mr-1" /> Real-time
                        </span>
                        <span className="flex items-center">
                          <UserOutlined className="mr-1" /> Live coaching
                        </span>
                      </>
                    )}
                    {option.key === 'upload' && (
                      <>
                        <span>MP3, WAV, MP4</span>
                        <span>Up to 25MB</span>
                      </>
                    )}
                    {option.key === 'transcript' && (
                      <>
                        <span>Text analysis</span>
                        <span>Instant results</span>
                      </>
                    )}
                    {option.key === 'meeting' && (
                      <>
                        <span>Auto-sync</span>
                        <span>Zoom, Teams, Meet</span>
                      </>
                    )}
                  </div>
                  
                  <Button 
                    type="text" 
                    size="small"
                    className="opacity-60 hover:opacity-100"
                  >
                    Select →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">95%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">2-5min</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">15+</div>
            <div className="text-sm text-gray-600">Insights</div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Button type="text" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}