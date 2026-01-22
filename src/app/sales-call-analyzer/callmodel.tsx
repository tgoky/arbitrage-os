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
  PlusOutlined,
  UserOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { useGo } from "@refinedev/core";
import { PhoneForwardedIcon } from 'lucide-react';

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
      key: 'transcript',
      title: 'Native Call Analysis',
      description: 'Paste or upload a text transcript for analysis',
      icon: <PhoneForwardedIcon className="text-2xl text-green-500" />,
      badge: 'basic',
      badgeColor: 'bg-blue-500',
      action: () => {
        go({ to: "/sales-call-analyzer/review-recording" });
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
      width={600}
      className="new-call-modal"
    >
      <div className="mb-6">
        <Text type="secondary">
          Choose how you would like to analyze your sales call.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4">
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
                    <span>Text analysis</span>
                    <span>Instant results</span>
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
      <div className="mt-6 p-4 rounded-lg">
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
