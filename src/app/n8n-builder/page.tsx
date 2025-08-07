"use client";

import React, { useState } from 'react';
import { 
  ThunderboltOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ApiOutlined,
  SaveOutlined,
  ShareAltOutlined,
  CodeOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Card, 
  Form, 
  Input, 
  Select, 
  Typography, 
  Divider, 
  Steps,
  Space,
  Tag,
  Alert,
  Collapse,
  Popover,
  Tooltip,
  Badge,
  Tabs
} from 'antd';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const N8nWorkflowCreator = () => {
  const [form] = Form.useForm();
  const [activeStep, setActiveStep] = useState(0);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState('schedule');
  const [generatedWorkflow, setGeneratedWorkflow] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const triggerTypes = [
    {
      value: 'schedule',
      label: 'Scheduled',
      description: 'Run at specific times or intervals',
      icon: <ClockCircleOutlined />,
      examples: ['Daily at 8 AM', 'Every hour', 'On the 1st of each month']
    },
    {
      value: 'webhook',
      label: 'Webhook',
      description: 'Triggered by an external HTTP request',
      icon: <ApiOutlined />,
      examples: ['When form is submitted', 'When payment is received', 'When GitHub event occurs']
    },
    {
      value: 'event',
      label: 'Event',
      description: 'Triggered by system or app events',
      icon: <ThunderboltOutlined />,
      examples: ['New email received', 'File uploaded to folder', 'Database record created']
    }
  ];

  const integrationOptions = [
    'Slack',
    'Google Sheets',
    'Gmail',
    'Shopify',
    'Notion',
    'OpenAI',
    'Zapier',
    'Airtable',
    'Twitter',
    'Discord',
    'MySQL',
    'PostgreSQL'
  ];

  const onFinish = (values: any) => {
    setIsGenerating(true);
    
    // Simulate workflow generation
    setTimeout(() => {
      const workflow = generateWorkflowConfig(values);
      setGeneratedWorkflow(workflow);
      setIsGenerating(false);
      setActiveStep(3); // Jump to results
    }, 2000);
  };

  const generateWorkflowConfig = (data: any) => {
    let config = `{
  "name": "${data.workflowName || 'Untitled Workflow'}",
  "nodes": [
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.${data.triggerType}",
      "typeVersion": 1,
      "position": [250, 300]
    }`;

    if (data.integrations && data.integrations.length > 0) {
      data.integrations.forEach((integration: string, index: number) => {
        config += `,
    {
      "parameters": {},
      "name": "${integration}",
      "type": "n8n-nodes-base.${integration.toLowerCase().replace(' ', '')}",
      "typeVersion": 1,
      "position": [${450 + (index * 200)}, 300]
    }`;
      });
    }

    config += `
  ],
  "connections": {},
  "active": false,
  "settings": {},
  "id": "${Math.random().toString(36).substring(2, 9)}"
}`;

    return config;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <ThunderboltOutlined className="mr-2" />
          n8n Workflow Creator
        </Title>
        <Text type="secondary" className="text-lg">
          Design powerful automation workflows with AI assistance for your business processes
        </Text>
      </div>

      <Steps current={activeStep} className="mb-8">
        <Step title="Workflow Details" />
        <Step title="Trigger Setup" />
        <Step title="Actions" />
        <Step title="Review & Export" />
      </Steps>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        {activeStep === 0 && (
          <Card className="mb-6">
            <Title level={4} className="mb-4">Workflow Information</Title>
            
            <Form.Item
              name="workflowName"
              label="Workflow Name"
              rules={[{ required: true, message: 'Please name your workflow!' }]}
              tooltip="A descriptive name helps identify this workflow later"
            >
              <Input 
                placeholder="e.g., Daily Sales Report, New Lead Notification" 
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </Form.Item>

            <Form.Item
              name="workflowDescription"
              label="Workflow Description"
            >
              <TextArea 
                rows={3} 
                placeholder="Describe what the workflow should do in detail (e.g., goals, steps, logic)"
                onChange={(e) => setWorkflowDescription(e.target.value)}
              />
            </Form.Item>

            <div className="flex justify-end mt-4">
              <Button 
                type="primary" 
                onClick={() => setActiveStep(1)}
                disabled={!workflowName}
              >
                Next: Trigger Setup
              </Button>
            </div>
          </Card>
        )}

        {activeStep === 1 && (
          <Card className="mb-6">
            <Title level={4} className="mb-4">Workflow Trigger</Title>
            <Text type="secondary" className="block mb-4">
              What event or schedule should kick off this workflow?
            </Text>

            <Form.Item
              name="triggerType"
              initialValue="schedule"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {triggerTypes.map((trigger) => (
                  <Card
                    key={trigger.value}
                    hoverable
                    onClick={() => setTriggerType(trigger.value)}
                    className={`cursor-pointer ${triggerType === trigger.value ? 'border-blue-500 border-2' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="p-2 bg-blue-50 rounded-full mr-3">
                        {trigger.icon}
                      </div>
                      <div>
                        <div className="font-medium">{trigger.label}</div>
                        <div className="text-gray-500 text-sm mb-2">{trigger.description}</div>
                        <div className="mt-2">
                          {trigger.examples.map((example, i) => (
                            <Tag key={i} color="blue" className="mb-1">{example}</Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Form.Item>

            {triggerType === 'schedule' && (
              <Form.Item
                name="scheduleDetails"
                label="Schedule Details"
                rules={[{ required: true, message: 'Please specify the schedule!' }]}
              >
                <Input placeholder="e.g., Every morning at 8 AM, Every 30 minutes" />
              </Form.Item>
            )}

            {triggerType === 'webhook' && (
              <Form.Item
                name="webhookDetails"
                label="Webhook Details"
                rules={[{ required: true, message: 'Please describe the webhook trigger!' }]}
              >
                <Input placeholder="e.g., When I receive an email with 'invoice' in the subject" />
              </Form.Item>
            )}

            {triggerType === 'event' && (
              <Form.Item
                name="eventDetails"
                label="Event Details"
                rules={[{ required: true, message: 'Please describe the event trigger!' }]}
              >
                <Input placeholder="e.g., When someone fills out my contact form" />
              </Form.Item>
            )}

            <Form.Item
              name="triggerData"
              label="Available Trigger Data"
              tooltip="What specific details or data does the workflow have access to when it begins?"
            >
              <TextArea 
                rows={3} 
                placeholder="e.g., The email subject and sender, The customer name and email from the form, The order details from Shopify"
              />
            </Form.Item>

            <div className="flex justify-between mt-4">
              <Button onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button 
                type="primary" 
                onClick={() => setActiveStep(2)}
              >
                Next: Actions
              </Button>
            </div>
          </Card>
        )}

        {activeStep === 2 && (
          <Card className="mb-6">
            <Title level={4} className="mb-4">Workflow Actions</Title>
            
            <Form.Item
              name="integrations"
              label="Select Integrations"
              rules={[{ required: true, message: 'Please select at least one integration!' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select tools/services to integrate"
                options={integrationOptions.map(option => ({ value: option, label: option }))}
              />
            </Form.Item>

            <Form.Item
              name="actionDescription"
              label="Action Details"
              rules={[{ required: true, message: 'Please describe what should happen!' }]}
              tooltip="Describe exactly what should happen when the workflow finishes successfully"
            >
              <TextArea 
                rows={4} 
                placeholder="e.g., Send a Slack message to the #sales channel with the customer details, Create a new row in my Google Sheet with the order info, Generate a summary report and email it to me"
              />
            </Form.Item>

            <Alert
              message="Advanced Configuration"
              description="You'll be able to fine-tune each integration's settings after exporting the workflow."
              type="info"
              showIcon
              className="mb-4"
            />

            <div className="flex justify-between mt-4">
              <Button onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={isGenerating}
              >
                Generate Workflow
              </Button>
            </div>
          </Card>
        )}

        {activeStep === 3 && generatedWorkflow && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>Your n8n Workflow Configuration</Title>
              <Space>
                <Button 
                  icon={<SaveOutlined />}
                  onClick={() => {
                    const blob = new Blob([generatedWorkflow], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${workflowName || 'n8n-workflow'}.json`;
                    a.click();
                  }}
                >
                  Save as JSON
                </Button>
                <Button 
                  type="primary" 
                  icon={<ShareAltOutlined />}
                  onClick={() => navigator.clipboard.writeText(generatedWorkflow)}
                >
                  Copy Configuration
                </Button>
              </Space>
            </div>

            <Tabs defaultActiveKey="1">
              <TabPane tab="Configuration" key="1">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 overflow-x-auto">
                    {generatedWorkflow}
                  </pre>
                </div>
              </TabPane>
              <TabPane tab="Next Steps" key="2">
                <div className="space-y-4">
                  <Alert
                    message="Importing Your Workflow"
                    description={
                      <div>
                        <p>1. Go to your n8n dashboard</p>
                        <p>2. Click Workflows then New</p>
                        <p>3. Select Import from JSON and paste this configuration</p>
                      </div>
                    }
                    type="info"
                    showIcon
                  />

                  <Alert
                    message="Testing Your Workflow"
                    description={
                      <div>
                        <p>1. After importing, click the Execute Workflow button</p>
                        <p>2. Check each node for proper configuration</p>
                        <p>3. Activate the workflow when ready</p>
                      </div>
                    }
                    type="info"
                    showIcon
                  />

                  <Alert
                    message="Need Help?"
                    description={
                      <div>
                        <p>Visit the <a href="https://docs.n8n.io" target="_blank" rel="noopener noreferrer" className="text-blue-500">n8n documentation</a> for detailed guides</p>
                        <p>Or join the <a href="https://community.n8n.io" target="_blank" rel="noopener noreferrer" className="text-blue-500">community forum</a> for support</p>
                      </div>
                    }
                    type="info"
                    showIcon
                  />
                </div>
              </TabPane>
            </Tabs>

            <Divider />

            <div className="text-center">
              <Button 
                type="primary" 
                onClick={() => {
                  setActiveStep(0);
                  setGeneratedWorkflow('');
                }}
              >
                Create Another Workflow
              </Button>
            </div>
          </Card>
        )}
      </Form>
    </div>
  );
};

export default N8nWorkflowCreator;