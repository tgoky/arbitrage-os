"use client";

import React, { useState } from 'react';
import {
  SaveOutlined,
  EditOutlined,
  InfoCircleOutlined,
  SoundOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  InputNumber,
  Select,
  Typography,
  Space,
  Divider,
  Alert,
  Switch,
  message,
  ConfigProvider,
  theme
} from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

// Color constants (matching the main page)
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#0f172a';
const SURFACE_BG = '#1e293b';
const SURFACE_LIGHTER = '#334155';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const BORDER_COLOR = '#334155';

export default function SalesCallSettingsPage() {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('organization');

  const frameworks = [
    { name: 'Discovery Call Framework', key: 'discovery', status: 'Default framework active' },
    { name: 'Interview Call Framework', key: 'interview', status: 'Default framework active' },
    { name: 'Sales Call Framework', key: 'sales', status: 'Default framework active' },
    { name: 'Podcast Call Framework', key: 'podcast', status: 'Default framework active' },
    { name: 'Real-time Coaching', key: 'coaching', status: 'Default framework active' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
  ];

  const onFinish = (values: any) => {
    setIsLoading(true);
    console.log('Saved settings:', values);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      message.success('Settings saved successfully');
    }, 1500);
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
          Button: {
            colorPrimary: BRAND_GREEN,
            algorithm: true,
            fontWeight: 600,
            colorTextLightSolid: '#000000',
            defaultBorderColor: SPACE_COLOR,
            defaultColor: TEXT_SECONDARY,
            defaultBg: SURFACE_BG,
          },
          Input: {
            paddingBlock: 10,
            // borderColor: SURFACE_LIGHTER,
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
          },
          InputNumber: {
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
            // borderColor: SURFACE_LIGHTER,
            hoverBorderColor: BRAND_GREEN,
            activeBorderColor: BRAND_GREEN,
          },
          Select: {
            controlHeight: 44,
            colorPrimary: BRAND_GREEN,
            optionSelectedBg: SURFACE_LIGHTER,
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
          },
          Card: {
            headerBg: SURFACE_BG,
            colorBgContainer: SURFACE_BG,
            colorTextHeading: TEXT_PRIMARY,
            colorBorder: BORDER_COLOR,
          },
          Switch: {
            colorPrimary: BRAND_GREEN,
            colorPrimaryHover: '#4cb08d',
          },
          Form: {
            labelColor: TEXT_SECONDARY,
          }
        }
      }}
    >
      <div className="min-h-screen bg-gray-900 font-manrope">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-700 mb-2 inline-block">
                <span className="text-[13px] font-bold tracking-widest uppercase text-gray-100">
                  <span style={{ color: BRAND_GREEN }}>a</span>rb<span style={{ color: BRAND_GREEN }}>i</span>trageOS
                </span>
              </div>
              <Title level={1} style={{ marginBottom: 8, fontSize: '28px', fontWeight: 800, color: TEXT_PRIMARY }}>
                Sales Call Analysis Settings
              </Title>
              <Text style={{ color: TEXT_SECONDARY }}>
                Customize how your sales calls are analyzed and transcribed
              </Text>
            </div>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isLoading}
              onClick={() => form.submit()}
              style={{
                backgroundColor: BRAND_GREEN,
                borderColor: BRAND_GREEN,
                color: '#000000',
                fontWeight: '600'
              }}
            >
              Save Settings
            </Button>
          </div>

          <div className="mb-8">
            <div className="flex space-x-4 border-b border-gray-700">
              <Button
                type="text"
                onClick={() => setActiveTab('organization')}
                className={`pb-3 px-1 transition-all ${
                  activeTab === 'organization' 
                    ? 'border-b-2 text-white' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                style={{
                  borderBottomColor: activeTab === 'organization' ? BRAND_GREEN : 'transparent'
                }}
              >
                Organization Settings
              </Button>
              <Button
                type="text"
                onClick={() => setActiveTab('personal')}
                className={`pb-3 px-1 transition-all ${
                  activeTab === 'personal' 
                    ? 'border-b-2 text-white' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                style={{
                  borderBottomColor: activeTab === 'personal' ? BRAND_GREEN : 'transparent'
                }}
              >
                Personal Preferences
              </Button>
            </div>
          </div>

          {activeTab === 'organization' && (
            <Card className="mb-6 border border-gray-700" style={{ background: SURFACE_BG }}>
              <Title level={4} className="mb-4" style={{ color: TEXT_PRIMARY }}>
                Customize the evaluation frameworks used across your organization
              </Title>
              <Text style={{ color: TEXT_SECONDARY }} className="block mb-6">
                These settings affect all team members.
              </Text>

              <div className="space-y-4">
                {frameworks.map((framework) => (
                  <Card 
                    key={framework.key} 
                    className="border border-gray-700 hover:border-green-500 transition-all duration-200"
                    style={{ background: SURFACE_LIGHTER }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <Text strong style={{ color: TEXT_PRIMARY }}>{framework.name}</Text>
                        <div className="text-sm" style={{ color: TEXT_SECONDARY }}>{framework.status}</div>
                      </div>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => message.info(`Edit ${framework.name} clicked`)}
                        style={{ color: BRAND_GREEN }}
                      >
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'personal' && (
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                silenceThreshold: 1.2,
                language: 'en',
                realtimeProcessing: true,
                speakerIdentification: true
              }}
              onFinish={onFinish}
            >
              <Card className="mb-6 border border-gray-700" style={{ background: SURFACE_BG }}>
                <Title level={4} className="mb-4" style={{ color: TEXT_PRIMARY }}>
                  Configure your personal transcription settings for sales calls
                </Title>

                <Form.Item
                  label={
                    <div className="flex items-center" style={{ color: TEXT_SECONDARY }}>
                      <SoundOutlined className="mr-2" style={{ color: BRAND_GREEN }} />
                      <span>Silence Threshold (seconds)</span>
                    </div>
                  }
                  name="silenceThreshold"
                  tooltip="How long to wait for silence before processing speech. Increase if the AI interrupts speakers too often. Decrease if the AI is too slow to respond."
                >
                  <InputNumber
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <div className="flex items-center" style={{ color: TEXT_SECONDARY }}>
                      <GlobalOutlined className="mr-2" style={{ color: BRAND_GREEN }} />
                      <span>Default Language</span>
                    </div>
                  }
                  name="language"
                  tooltip="Primary language for transcription and analysis"
                >
                  <Select className="w-full">
                    {languages.map(lang => (
                      <Option key={lang.value} value={lang.value}>
                        {lang.label} {lang.value === 'en' && '(Default)'}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label={<span style={{ color: TEXT_SECONDARY }}>Real-time Processing</span>}
                  name="realtimeProcessing"
                  valuePropName="checked"
                  tooltip="Enable for live transcription during calls. Disable to only process after call completion."
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  label={<span style={{ color: TEXT_SECONDARY }}>Speaker Identification</span>}
                  name="speakerIdentification"
                  valuePropName="checked"
                  tooltip="Enable to automatically detect different speakers in the conversation"
                >
                  <Switch defaultChecked />
                </Form.Item>
              </Card>

              <Alert
                message="Changes to personal preferences will apply to all new calls"
                type="info"
                showIcon
                icon={<InfoCircleOutlined style={{ color: BRAND_GREEN }} />}
                className="mb-6 bg-blue-900/20 border-blue-800"
                style={{
                  backgroundColor: 'rgba(92, 196, 157, 0.1)',
                  borderColor: 'rgba(92, 196, 157, 0.3)',
                  color: TEXT_SECONDARY
                }}
              />
            </Form>
          )}

          <Divider style={{ borderColor: BORDER_COLOR }} />

          <div className="flex justify-between">
            <Button 
              type="text" 
              danger
              style={{ color: '#f87171' }}
            >
              Reset to Defaults
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isLoading}
              onClick={() => form.submit()}
              style={{
                backgroundColor: BRAND_GREEN,
                borderColor: BRAND_GREEN,
                color: '#000000',
                fontWeight: '600'
              }}
            >
              Save All Changes
            </Button>
          </div>
        </div>

        {/* Custom CSS for hover effects */}
        <style jsx global>{`
          .ant-input:hover, .ant-input:focus {
            border-color: ${BRAND_GREEN} !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-input-number:hover, .ant-input-number-focused {
            border-color: ${BRAND_GREEN} !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-selector:hover, .ant-select-focused .ant-select-selector {
            border-color: ${BRAND_GREEN} !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
            background-color: rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
            background-color: rgba(92, 196, 157, 0.2) !important;
            color: ${BRAND_GREEN} !important;
          }
          
          .ant-btn:hover, .ant-btn:focus {
            border-color: ${BRAND_GREEN} !important;
            color: ${BRAND_GREEN} !important;
          }
          
          .ant-btn-primary:hover, .ant-btn-primary:focus {
            background: #4cb08d !important;
            border-color: #4cb08d !important;
            color: #000 !important;
          }
          
          .ant-card-hoverable:hover {
            border-color: ${BRAND_GREEN} !important;
          }
          
          .ant-form-item-label > label {
            color: ${TEXT_SECONDARY} !important;
          }
          
          .ant-alert-info {
            background-color: rgba(92, 196, 157, 0.1) !important;
            border-color: rgba(92, 196, 157, 0.3) !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}