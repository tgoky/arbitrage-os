"use client";

import React, { useState } from 'react';
import {
  Modal,
  Card,
  Button,
  Typography,
  Space,
  message,
  ConfigProvider,
  theme
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { useGo } from "@refinedev/core";
import { PhoneForwardedIcon } from 'lucide-react';

const { Title, Text } = Typography;

// Color constants (matching the main page)
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#0f172a';
const SURFACE_BG = '#000000';
const SURFACE_LIGHTER = '#000000';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const BORDER_COLOR = '#334155';

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
      icon: <PhoneForwardedIcon className="text-2xl" style={{ color: BRAND_GREEN }} />, // Updated to BRAND_GREEN
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
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          fontFamily: 'Manrope, sans-serif',
          colorPrimary: BRAND_GREEN,
          borderRadius: 8,
          colorTextHeading: TEXT_PRIMARY,
          colorText: TEXT_SECONDARY,
          colorBgContainer: SURFACE_BG,
          colorBgElevated: SURFACE_BG,
          colorBorder: BORDER_COLOR,
        },
        components: {
          Modal: {
            contentBg: SURFACE_BG,
            headerBg: SURFACE_BG,
            titleColor: TEXT_PRIMARY,
          },
          Button: {
            colorPrimary: BRAND_GREEN,
            algorithm: true,
            fontWeight: 600,
            colorTextLightSolid: '#000000',
            defaultBorderColor: SPACE_COLOR,
            defaultColor: TEXT_SECONDARY,
            defaultBg: SURFACE_BG,
          },
          Card: {
            colorBgContainer: SURFACE_BG,
            colorTextHeading: TEXT_PRIMARY,
            colorBorder: BORDER_COLOR,
          }
        }
      }}
    >
      <Modal
        title={
          <div className="flex items-center" style={{ color: TEXT_PRIMARY }}>
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
          <Text type="secondary" style={{ color: TEXT_SECONDARY }}>
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
              styles={{
                body: { 
                  background: SURFACE_BG,
                  color: TEXT_PRIMARY 
                }
              }}
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
                    <Title level={5} className="mb-2" style={{ color: TEXT_PRIMARY }}>
                      {option.title}
                    </Title>
                    <Text type="secondary" className="text-sm" style={{ color: TEXT_SECONDARY }}>
                      {option.description}
                    </Text>
                  </div>
                </div>

                {/* Quick action indicators */}
                <div className="mt-4 pt-3 border-t" style={{ borderColor: BORDER_COLOR }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs" style={{ color: TEXT_SECONDARY }}>
                      <span>Text analysis</span>
                      <span>Instant results</span>
                    </div>
                    
                    <Button 
                      type="text" 
                      size="small"
                      className="opacity-60 hover:opacity-100"
                      style={{ color: BRAND_GREEN }}
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
        <div className="mt-6 p-4 rounded-lg" style={{ background: SURFACE_LIGHTER }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">95%</div>
              <div className="text-sm" style={{ color: TEXT_SECONDARY }}>Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">2-5min</div>
              <div className="text-sm" style={{ color: TEXT_SECONDARY }}>Processing</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: BRAND_GREEN }}>15+</div> {/* Updated purple to BRAND_GREEN */}
              <div className="text-sm" style={{ color: TEXT_SECONDARY }}>Insights</div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Button 
            type="text" 
            onClick={onClose}
            style={{ color: TEXT_SECONDARY }}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Custom CSS for hover effects */}
      <style jsx global>{`
        .new-call-modal .ant-card-hoverable:hover {
          border-color: ${BRAND_GREEN} !important;
        }
        
        .new-call-modal .ant-card-body {
          background: ${SURFACE_BG} !important;
          color: ${TEXT_PRIMARY} !important;
        }
        
        .new-call-modal .ant-btn:hover {
          color: ${BRAND_GREEN} !important;
        }
      `}</style>
    </ConfigProvider>
  );
}