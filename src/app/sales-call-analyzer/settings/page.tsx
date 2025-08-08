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
  message
} from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

// Remove the named export and make this the default component
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3}>Sales Call Analysis Settings</Title>
          <Text type="secondary">Customize how your sales calls are analyzed and transcribed</Text>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={isLoading}
          onClick={() => form.submit()}
        >
          Save Settings
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <Button
            type="text"
            onClick={() => setActiveTab('organization')}
            className={activeTab === 'organization' ? 'border-b-2 border-blue-500' : ''}
          >
            Organization Settings
          </Button>
          <Button
            type="text"
            onClick={() => setActiveTab('personal')}
            className={activeTab === 'personal' ? 'border-b-2 border-blue-500' : ''}
          >
            Personal Preferences
          </Button>
        </div>
      </div>

      {activeTab === 'organization' && (
        <Card className="mb-6">
          <Title level={5} className="mb-4">
            Customize the evaluation frameworks used across your organization
          </Title>
          <Text type="secondary" className="block mb-6">
            These settings affect all team members.
          </Text>

          <div className="space-y-4">
            {frameworks.map((framework) => (
              <Card key={framework.key} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <Text strong>{framework.name}</Text>
                    <div className="text-sm text-gray-500">{framework.status}</div>
                  </div>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => message.info(`Edit ${framework.name} clicked`)}
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
            realtimeProcessing: true
          }}
          onFinish={onFinish}
        >
          <Card className="mb-6">
            <Title level={5} className="mb-4">
              Configure your personal transcription settings for sales calls
            </Title>

            <Form.Item
              label={
                <div className="flex items-center">
                  <SoundOutlined className="mr-2" />
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
                <div className="flex items-center">
                  <GlobalOutlined className="mr-2" />
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
              label="Real-time Processing"
              name="realtimeProcessing"
              valuePropName="checked"
              tooltip="Enable for live transcription during calls. Disable to only process after call completion."
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Speaker Identification"
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
            icon={<InfoCircleOutlined />}
            className="mb-6"
          />
        </Form>
      )}

      <Divider />

      <div className="flex justify-between">
        <Button type="text" danger>
          Reset to Defaults
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={isLoading}
          onClick={() => form.submit()}
        >
          Save All Changes
        </Button>
      </div>
    </div>
  );
}