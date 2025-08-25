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
  PlayCircleOutlined,
  PlusOutlined
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
  Tabs,
  Modal,
  List
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
const [customIntegrations, setCustomIntegrations] = useState<string[]>([]);
  const [isCustomIntegrationModalVisible, setIsCustomIntegrationModalVisible] = useState(false);
  const [newCustomIntegration, setNewCustomIntegration] = useState('');

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
    // Messaging & Chat
    'Slack',
    'Discord',
    'Telegram',
    'Microsoft Teams',
    'Mattermost',
    'Rocket.Chat',
    'WhatsApp Business (Cloud API)',

    // Email & Marketing Automation
    'Gmail',
    'Microsoft Outlook 365',
    'IMAP Email',
    'SMTP',
    'SendGrid',
    'Mailgun',
    'Postmark',
    'Amazon SES',
    'Mailchimp',
    'Klaviyo',
    'ActiveCampaign',
    'Campaign Monitor',
    'ConvertKit',
    'Drip',

    // CRM & Sales
    'HubSpot',
    'Pipedrive',
    'Salesforce',
    'Zoho CRM',
    'Close',
    'Copper',
    'Freshsales Suite',
    'Keap / Infusionsoft',
    'Zendesk Sell (Base)',

    // Project & Work Management / Docs
    'Asana',
    'Trello',
    'ClickUp',
    'Jira',
    'Linear',
    'Notion',
    'Coda',
    'Basecamp',
    'Smartsheet',
    'Todoist',
    'Wrike',
    'Google Docs',
    'Google Slides',

    // Support & CX
    'Zendesk',
    'Freshdesk',
    'Intercom',
    'Help Scout',
    'Front',
    'Gorgias',
    'Zoho Desk',
    'LiveChat',
    'Drift',
    'Crisp',

    // Forms & Surveys
    'Typeform',
    'Jotform',
    'Formstack',
    'SurveyMonkey',
    'Tally (community)',
    'Google Forms (via Apps Script/API or community node)',

    // Calendars & Scheduling / Meetings
    'Google Calendar',
    'Microsoft Outlook Calendar',
    'Calendly',
    'Cal.com',
    'Zoom',
    'Google Meet (via Calendar events)',

    // Files, Storage & Transfer
    'Google Drive',
    'Dropbox',
    'Box',
    'OneDrive',
    'SharePoint',
    'Amazon S3',
    'Google Cloud Storage',
    'Azure Blob Storage',
    'FTP',
    'SFTP',
    'WebDAV',

    // Databases & Data Warehouses
    'PostgreSQL',
    'MySQL',
    'MariaDB',
    'Microsoft SQL Server',
    'SQLite',
    'MongoDB',
    'Redis',
    'CouchDB',
    'Elasticsearch',
    'Snowflake',
    'BigQuery',
    'Redshift',
    'Firestore',
    'Firebase Realtime Database',
    'Supabase',

    // Cloud, DevOps & Monitoring
    'GitHub',
    'GitLab',
    'Bitbucket',
    'Jenkins',
    'Cloudflare',
    'AWS (Lambda, SQS, SNS, SES, S3)',
    'Google Cloud Pub/Sub',
    'Azure DevOps',
    'Datadog',
    'PagerDuty',
    'Opsgenie',
    'UptimeRobot',
    'Statuspage',

    // Payments, Billing & Accounting
    'Stripe',
    'PayPal',
    'Square',
    'Paddle',
    'Chargebee',
    'Recurly',
    'Braintree',
    'QuickBooks Online',
    'Xero',
    'FreshBooks',
    'Zoho Books',

    // E-commerce, Shipping & Fulfillment
    'Shopify',
    'WooCommerce',
    'BigCommerce',
    'Magento 2',
    'Shippo',
    'ShipStation',
    'EasyPost',

    // Social, Media & Ads
    'Facebook Graph / Pages',
    'Facebook Lead Ads',
    'Instagram Graph',
    'X (Twitter)',
    'YouTube',
    'LinkedIn (limited API; community)',
    'Reddit',
    'Pinterest (community)',
    'RSS Feed Read',

    // Telephony & SMS
    'Twilio',
    'Vonage (Nexmo)',
    'MessageBird',
    'Telnyx',
    'Plivo',
    'RingCentral',

    // eSign & Docs
    'DocuSign',
    'Dropbox Sign (HelloSign)',
    'PandaDoc',
    'Adobe Acrobat Sign',

    // AI / NLP / Speech / Vision
    'OpenAI',
    'Azure OpenAI',
    'Google Vertex/PaLM (Google AI Studio)',
    'Hugging Face',
    'Replicate',
    'Stability AI',
    'Cohere',
    'AssemblyAI',
    'Deepgram',
    'AWS Textract / Comprehend / Polly',
    'Google Cloud Vision / NLP',
    'Microsoft Cognitive Services (Vision/Speech)',

    // Maps & Location
    'Google Maps Platform',
    'Mapbox',

    // Generic / Catch-All
    'HTTP Request (Custom API)',
    'Webhook (Trigger)',
    'GraphQL',
    'Spreadsheet File (CSV/XLSX reader)',
    'HTML Extract / Markdown / XML (parsers)',

    // Additional from original list
    'Google Sheets',
    'Zapier',
    'Airtable'
  ];

  const addCustomIntegration = () => {
    if (newCustomIntegration.trim() !== '') {
      setCustomIntegrations([...customIntegrations, newCustomIntegration]);
      setNewCustomIntegration('');
      setIsCustomIntegrationModalVisible(false);
    }
  };

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
      "type": "n8n-nodes-base.${integration.toLowerCase().replace(/\s+/g, '-')}",
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

  const getRequiredCredentials = (integrations: string[]) => {
    if (!integrations || integrations.length === 0) return [];
    
    return integrations.map(integration => ({
      name: integration,
      type: getCredentialType(integration),
      setupLink: getSetupLink(integration)
    }));
  };

  const getCredentialType = (integration: string) => {
    // Simplified mapping - in a real app, this would be more comprehensive

  // Simplified mapping - in a real app, this would be more comprehensive
  const credentialTypes: { [key: string]: string } = {
    'Slack': 'OAuth2',
    'Gmail': 'OAuth2',
    'Google Sheets': 'OAuth2',
    'Google Drive': 'OAuth2',
    'Google Calendar': 'OAuth2',
    'Microsoft Outlook 365': 'OAuth2',
    'Microsoft Outlook Calendar': 'OAuth2',
    'GitHub': 'OAuth2',
    'Salesforce': 'OAuth2',
    'Shopify': 'OAuth2',
    'Facebook Graph / Pages': 'OAuth2',
    'Twitter': 'OAuth2',
    'Discord': 'Bot Token',
    'Telegram': 'Bot Token',
    'MySQL': 'Database Credentials',
    'PostgreSQL': 'Database Credentials',
    'MongoDB': 'Database Credentials',
    'Redis': 'Database Credentials',
    'Stripe': 'API Key',
    'PayPal': 'API Key',
    'Twilio': 'API Key',
    'SendGrid': 'API Key',
    'Mailgun': 'API Key',
    'OpenAI': 'API Key',
    'AWS (Lambda, SQS, SNS, SES, S3)': 'AWS Credentials',
  };

  return credentialTypes[integration] || 'API Key / Token';
};

  const getSetupLink = (integration: string) => {
    // Simplified mapping - in a real app, this would be more comprehensive

  // Simplified mapping - in a real app, this would be more comprehensive
  const setupLinks: { [key: string]: string } = {
    'Slack': 'https://docs.n8n.io/integrations/builtin/credentials/slack/',
    'Gmail': 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
    'Google Sheets': 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
    'Google Drive': 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
    'Google Calendar': 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
    'Microsoft Outlook 365': 'https://docs.n8n.io/integrations/builtin/credentials/microsoft/oauth-single-service/',
    'Microsoft Outlook Calendar': 'https://docs.n8n.io/integrations/builtin/credentials/microsoft/oauth-single-service/',
    'GitHub': 'https://docs.n8n.io/integrations/builtin/credentials/github/',
    'Salesforce': 'https://docs.n8n.io/integrations/builtin/credentials/salesforce/',
    'Shopify': 'https://docs.n8n.io/integrations/builtin/credentials/shopify/',
    'Facebook Graph / Pages': 'https://docs.n8n.io/integrations/builtin/credentials/facebook/',
    'Twitter': 'https://docs.n8n.io/integrations/builtin/credentials/twitter/',
    'Discord': 'https://docs.n8n.io/integrations/builtin/credentials/discord/',
    'Telegram': 'https://docs.n8n.io/integrations/builtin/credentials/telegram/',
    'MySQL': 'https://docs.n8n.io/integrations/builtin/credentials/mysql/',
    'PostgreSQL': 'https://docs.n8n.io/integrations/builtin/credentials/postgres/',
    'MongoDB': 'https://docs.n8n.io/integrations/builtin/credentials/mongodb/',
    'Redis': 'https://docs.n8n.io/integrations/builtin/credentials/redis/',
    'Stripe': 'https://docs.n8n.io/integrations/builtin/credentials/stripe/',
    'PayPal': 'https://docs.n8n.io/integrations/builtin/credentials/paypal/',
    'Twilio': 'https://docs.n8n.io/integrations/builtin/credentials/twilio/',
    'SendGrid': 'https://docs.n8n.io/integrations/builtin/credentials/sendgrid/',
    'Mailgun': 'https://docs.n8n.io/integrations/builtin/credentials/mailgun/',
    'OpenAI': 'https://docs.n8n.io/integrations/builtin/credentials/openai/',
    'AWS (Lambda, SQS, SNS, SES, S3)': 'https://docs.n8n.io/integrations/builtin/credentials/aws/',
  };

  return setupLinks[integration] || 'https://docs.n8n.io/integrations/builtin/credentials/';
};

  const allIntegrationOptions = [...integrationOptions, ...customIntegrations];
  const selectedIntegrations = form.getFieldValue('integrations') || [];
  const requiredCredentials = getRequiredCredentials(selectedIntegrations);

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
                dropdownRender={menu => (
                  <div>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <div 
                      style={{ padding: '8px', cursor: 'pointer' }}
                      onClick={() => setIsCustomIntegrationModalVisible(true)}
                    >
                      <PlusOutlined /> Add custom integration
                    </div>
                  </div>
                )}
                options={allIntegrationOptions.map(option => ({ value: option, label: option }))}
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
              <TabPane tab="Workflow JSON" key="1">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 overflow-x-auto">
                    {generatedWorkflow}
                  </pre>
                </div>
              </TabPane>
              <TabPane tab="Setup Instructions" key="2">
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
              <TabPane tab="Required Credentials" key="3">
                <div className="space-y-4">
                  <Alert
                    message="Credentials Setup"
                    description="Before your workflow can run, you need to set up the following credentials in n8n:"
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                  
                  {requiredCredentials.length > 0 ? (
                    <List
                      itemLayout="horizontal"
                      dataSource={requiredCredentials}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta
                            title={item.name}
                            description={
                              <div>
                                <p>Type: {item.type}</p>
                                <p>
                                  Setup Guide:{" "}
                                  <a href={item.setupLink} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                                    Documentation
                                  </a>
                                </p>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Alert
                      message="No Credentials Required"
                      description="This workflow doesn't require any external credentials to be set up."
                      type="info"
                      showIcon
                    />
                  )}
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

      <Modal
        title="Add Custom Integration"
        open={isCustomIntegrationModalVisible}
        onOk={addCustomIntegration}
        onCancel={() => setIsCustomIntegrationModalVisible(false)}
      >
        <Input
          placeholder="Enter custom integration name"
          value={newCustomIntegration}
          onChange={(e) => setNewCustomIntegration(e.target.value)}
          onPressEnter={addCustomIntegration}
        />
      </Modal>
    </div>
  );
};

export default N8nWorkflowCreator;