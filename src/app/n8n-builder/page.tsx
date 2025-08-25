"use client";

import React, { useState, useEffect } from 'react';
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
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
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
  List,
  Table,
  Spin,
  Row,
  Col,
  Statistic,
  Progress
} from 'antd';
import { useN8nWorkflowBuilder, useWorkflowExport, useIntegrationTemplates } from '../hooks/useN8nWorkflowBuilder';
import { N8nWorkflowInput, SavedWorkflow, ExportFormat, RequiredCredential } from '@/types/n8nWorkflowBuilder';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface N8nWorkflowCreatorProps {
  workspaceId?: string;
  initialMode?: 'create' | 'list';
}

const N8nWorkflowCreator: React.FC<N8nWorkflowCreatorProps> = ({ 
  workspaceId,
  initialMode = 'create' 
}) => {
  const [form] = Form.useForm();
  const [activeStep, setActiveStep] = useState(0);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState('schedule');
  const [customIntegrations, setCustomIntegrations] = useState<string[]>([]);
  const [isCustomIntegrationModalVisible, setIsCustomIntegrationModalVisible] = useState(false);
  const [newCustomIntegration, setNewCustomIntegration] = useState('');
  const [mode, setMode] = useState<'create' | 'list' | 'view'>(initialMode);
  const [currentWorkflow, setCurrentWorkflow] = useState<SavedWorkflow | null>(null);

  // Hooks
  const {
    generateWorkflow,
    isGenerating,
    generationError,
    workflows,
    getWorkflow,
    updateWorkflow,
    deleteWorkflow,
    exportWorkflow,
    loadWorkflows,
    isLoading,
    loadError,
    selectedWorkflow,
    setSelectedWorkflow,
    clearErrors,
    refreshWorkflows
  } = useN8nWorkflowBuilder(workspaceId);

  const { downloadWorkflow, copyToClipboard } = useWorkflowExport();
  const { templates } = useIntegrationTemplates();

  // Load workflows on component mount
  useEffect(() => {
    if (workspaceId) {
      loadWorkflows(workspaceId);
    }
  }, [workspaceId, loadWorkflows]);

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
    'Slack', 'Discord', 'Telegram', 'Microsoft Teams', 'Mattermost', 'Rocket.Chat', 'WhatsApp Business (Cloud API)',
    // Email & Marketing Automation  
    'Gmail', 'Microsoft Outlook 365', 'IMAP Email', 'SMTP', 'SendGrid', 'Mailgun', 'Postmark', 'Amazon SES',
    'Mailchimp', 'Klaviyo', 'ActiveCampaign', 'Campaign Monitor', 'ConvertKit', 'Drip',
    // CRM & Sales
    'HubSpot', 'Pipedrive', 'Salesforce', 'Zoho CRM', 'Close', 'Copper', 'Freshsales Suite', 'Keap / Infusionsoft', 'Zendesk Sell (Base)',
    // Project & Work Management / Docs
    'Asana', 'Trello', 'ClickUp', 'Jira', 'Linear', 'Notion', 'Coda', 'Basecamp', 'Smartsheet', 'Todoist', 'Wrike', 'Google Docs', 'Google Slides',
    // Support & CX
    'Zendesk', 'Freshdesk', 'Intercom', 'Help Scout', 'Front', 'Gorgias', 'Zoho Desk', 'LiveChat', 'Drift', 'Crisp',
    // Forms & Surveys
    'Typeform', 'Jotform', 'Formstack', 'SurveyMonkey', 'Tally (community)', 'Google Forms (via Apps Script/API or community node)',
    // Files, Storage & Transfer
    'Google Drive', 'Dropbox', 'Box', 'OneDrive', 'SharePoint', 'Amazon S3', 'Google Cloud Storage', 'Azure Blob Storage', 'FTP', 'SFTP', 'WebDAV',
    // Databases & Data Warehouses
    'PostgreSQL', 'MySQL', 'MariaDB', 'Microsoft SQL Server', 'SQLite', 'MongoDB', 'Redis', 'CouchDB', 'Elasticsearch',
    'Snowflake', 'BigQuery', 'Redshift', 'Firestore', 'Firebase Realtime Database', 'Supabase',
    // Cloud, DevOps & Monitoring
    'GitHub', 'GitLab', 'Bitbucket', 'Jenkins', 'Cloudflare', 'AWS (Lambda, SQS, SNS, SES, S3)', 'Google Cloud Pub/Sub', 'Azure DevOps',
    'Datadog', 'PagerDuty', 'Opsgenie', 'UptimeRobot', 'Statuspage',
    // Payments & E-commerce
    'Stripe', 'PayPal', 'Square', 'Paddle', 'Shopify', 'WooCommerce', 'BigCommerce',
    // Others
    'Google Sheets', 'Google Calendar', 'Calendly', 'Zoom', 'Twilio', 'OpenAI', 'HTTP Request (Custom API)'
  ];

  const addCustomIntegration = () => {
    if (newCustomIntegration.trim() !== '') {
      setCustomIntegrations([...customIntegrations, newCustomIntegration]);
      setNewCustomIntegration('');
      setIsCustomIntegrationModalVisible(false);
    }
  };

  const onFinish = async (values: any) => {
    const workflowInput: N8nWorkflowInput = {
      workflowName: values.workflowName,
      workflowDescription: values.workflowDescription,
      triggerType: triggerType as 'schedule' | 'webhook' | 'event',
      scheduleDetails: values.scheduleDetails,
      webhookDetails: values.webhookDetails,
      eventDetails: values.eventDetails,
      triggerData: values.triggerData,
      integrations: values.integrations,
      actionDescription: values.actionDescription,
      additionalContext: values.additionalContext,
      specificRequirements: values.specificRequirements,
      workflowGoals: values.workflowGoals
    };

    const result = await generateWorkflow(workflowInput);
    
    if (result) {
      setCurrentWorkflow({
        id: result.workflowId,
        title: `n8n Workflow - ${workflowInput.workflowName}`,
        workflowName: workflowInput.workflowName,
        workflowDescription: workflowInput.workflowDescription,
        triggerType: workflowInput.triggerType,
        integrations: workflowInput.integrations,
        complexity: result.workflow.analysis.complexity,
        nodeCount: result.workflow.analysis.nodeCount,
        status: 'draft',
        workflowConfig: result.workflow.workflowConfig,
        analysis: result.workflow.analysis,
        setupInstructions: result.workflow.setupInstructions,
        createdAt: new Date(),
        updatedAt: new Date(),
        workspace: { id: workspaceId || '', name: 'Default Workspace' }
      });
      setActiveStep(3); // Jump to results
      refreshWorkflows(); // Refresh the list
    }
  };

  const handleViewWorkflow = async (workflowId: string) => {
    const workflow = await getWorkflow(workflowId);
    if (workflow) {
      setCurrentWorkflow(workflow);
      setSelectedWorkflow(workflow);
      setMode('view');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    Modal.confirm({
      title: 'Delete Workflow',
      content: 'Are you sure you want to delete this workflow? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        const success = await deleteWorkflow(workflowId);
        if (success && currentWorkflow?.id === workflowId) {
          setCurrentWorkflow(null);
          setMode('list');
        }
      }
    });
  };

  const handleExportWorkflow = async (workflowId: string, format: ExportFormat) => {
    const content = await exportWorkflow(workflowId, format);
    if (content && currentWorkflow) {
      downloadWorkflow(currentWorkflow.workflowName, content, format);
    }
  };

  const allIntegrationOptions = [...integrationOptions, ...customIntegrations];

  // Workflow List Component
  const WorkflowList = () => {
    const columns = [
      {
        title: 'Name',
        dataIndex: 'workflowName',
        key: 'name',
        render: (text: string, record: any) => (
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-sm text-gray-500">{record.triggerType} trigger</div>
          </div>
        )
      },
      {
        title: 'Integrations',
        dataIndex: 'integrations',
        key: 'integrations',
        render: (integrations: string[]) => (
          <div>
            {integrations.slice(0, 3).map(integration => (
              <Tag key={integration} className="mb-1">{integration}</Tag>
            ))}
            {integrations.length > 3 && (
              <Tag>+{integrations.length - 3} more</Tag>
            )}
          </div>
        )
      },
      {
        title: 'Complexity',
        dataIndex: 'complexity',
        key: 'complexity',
        render: (complexity: string) => (
          <Tag color={
            complexity === 'simple' ? 'green' : 
            complexity === 'moderate' ? 'orange' : 'red'
          }>
            {complexity.toUpperCase()}
          </Tag>
        )
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={status === 'active' ? 'green' : 'default'}>
            {status.toUpperCase()}
          </Tag>
        )
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        key: 'created',
        render: (date: Date) => new Date(date).toLocaleDateString()
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: any) => (
          <Space>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewWorkflow(record.id)}
            />
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleExportWorkflow(record.id, 'json')}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteWorkflow(record.id)}
            />
          </Space>
        )
      }
    ];

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={3}>Your n8n Workflows</Title>
            <Text type="secondary">Manage and view your automated workflows</Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshWorkflows}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setMode('create');
                setActiveStep(0);
                form.resetFields();
                setCurrentWorkflow(null);
              }}
            >
              Create Workflow
            </Button>
          </Space>
        </div>

        {loadError && (
          <Alert
            message="Error Loading Workflows"
            description={loadError}
            type="error"
            closable
            onClose={clearErrors}
            className="mb-4"
          />
        )}

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Workflows"
                value={workflows.length}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Active Workflows"
                value={workflows.filter(w => w.status === 'active').length}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Integrations"
                value={workflows.reduce((sum, w) => sum + w.integrations.length, 0)}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={workflows}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    );
  };

  // Workflow Viewer Component
  const WorkflowViewer = () => {
    if (!currentWorkflow) return null;

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button
              type="text"
              onClick={() => setMode('list')}
              className="mb-2"
            >
              ← Back to Workflows
            </Button>
            <Title level={3}>{currentWorkflow.workflowName}</Title>
            <Text type="secondary">{currentWorkflow.workflowDescription}</Text>
          </div>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                // Pre-populate form with current workflow data
                form.setFieldsValue({
                  workflowName: currentWorkflow.workflowName,
                  workflowDescription: currentWorkflow.workflowDescription,
                  integrations: currentWorkflow.integrations,
                });
                setTriggerType(currentWorkflow.triggerType);
                setMode('create');
                setActiveStep(0);
              }}
            >
              Edit
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExportWorkflow(currentWorkflow.id, 'json')}
            >
              Download JSON
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteWorkflow(currentWorkflow.id)}
            >
              Delete
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title="Workflow Configuration" className="mb-4">
              <Tabs defaultActiveKey="1">
                <TabPane tab="Visual Overview" key="1">
                  <div className="space-y-4">
                    <div>
                      <Text strong>Trigger Type: </Text>
                      <Tag color="blue">{currentWorkflow.triggerType}</Tag>
                    </div>
                    <div>
                      <Text strong>Complexity: </Text>
                      <Tag color={
                        currentWorkflow.complexity === 'simple' ? 'green' :
                        currentWorkflow.complexity === 'moderate' ? 'orange' : 'red'
                      }>
                        {currentWorkflow.complexity.toUpperCase()}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>Nodes: </Text>
                      <Badge count={currentWorkflow.nodeCount} />
                    </div>
                    <div>
                      <Text strong>Integrations:</Text>
                      <div className="mt-2">
                        {currentWorkflow.integrations.map(integration => (
                          <Tag key={integration} className="mb-1">{integration}</Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabPane>
                <TabPane tab="JSON Configuration" key="2">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
                      {JSON.stringify(currentWorkflow.workflowConfig, null, 2)}
                    </pre>
                  </div>
                </TabPane>
                <TabPane tab="Setup Instructions" key="3">
                  <div className="space-y-4">
                    <Alert
                      message="Setup Steps"
                      description={
                        <ol className="mt-2">
                          {currentWorkflow.setupInstructions.steps.map((step: string, i: number)  => (
                            <li key={i} className="mb-1">{step}</li>
                          ))}
                        </ol>
                      }
                      type="info"
                    />
                    <Alert
                      message="Required Credentials"
                      description={
                        <div className="mt-2">
                          {currentWorkflow.setupInstructions.credentialSetup.map((cred: RequiredCredential, i: number) => (
                            <div key={i} className="mb-2">
                              <Text strong>{cred.name}</Text> ({cred.type})
                              <br />
                              <a href={cred.setupLink} target="_blank" rel="noopener noreferrer">
                                Setup Guide →
                              </a>
                            </div>
                          ))}
                        </div>
                      }
                      type="warning"
                    />
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Analysis & Metrics" className="mb-4">
              <div className="space-y-4">
                <div>
                  <Text type="secondary">Estimated Execution Time</Text>
                  <div className="text-lg font-medium">
                    {currentWorkflow.analysis.estimatedExecutionTime}s
                  </div>
                </div>
                <div>
                  <Text type="secondary">Security Level</Text>
                  <div>
                    <Tag color={currentWorkflow.analysis.securityConsiderations.length > 2 ? 'red' : 'green'}>
                      {currentWorkflow.analysis.securityConsiderations.length > 2 ? 'HIGH' : 'MEDIUM'}
                    </Tag>
                  </div>
                </div>
                <Divider />
                <div>
                  <Text type="secondary">Potential Issues</Text>
                  <ul className="mt-2">
                    {currentWorkflow.analysis.potentialIssues.map((issue, i) => (
                      <li key={i} className="text-sm text-orange-600">{issue}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Text type="secondary">Optimization Suggestions</Text>
                  <ul className="mt-2">
                    {currentWorkflow.analysis.optimizationSuggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-green-600">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            <Card title="Export Options">
              <Space direction="vertical" className="w-full">
                <Button
                  block
                  onClick={() => handleExportWorkflow(currentWorkflow.id, 'json')}
                >
                  Download n8n JSON
                </Button>
                <Button
                  block
                  onClick={() => handleExportWorkflow(currentWorkflow.id, 'summary')}
                >
                  Download Summary
                </Button>
                <Button
                  block
                  onClick={() => handleExportWorkflow(currentWorkflow.id, 'setup-guide')}
                >
                  Download Setup Guide
                </Button>
                <Button
                  block
                  onClick={() => copyToClipboard(JSON.stringify(currentWorkflow.workflowConfig, null, 2))}
                >
                  Copy JSON to Clipboard
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Main Create Workflow Component
  const CreateWorkflow = () => (
    <div>
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <ThunderboltOutlined className="mr-2" />
          n8n Workflow Creator
        </Title>
        <Text type="secondary" className="text-lg">
          Design powerful automation workflows with AI assistance for your business processes
        </Text>
      </div>

      {generationError && (
        <Alert
          message="Workflow Generation Error"
          description={generationError}
          type="error"
          closable
          onClose={clearErrors}
          className="mb-6"
        />
      )}

      <Steps current={activeStep} className="mb-8">
        <Step title="Workflow Details" />
        <Step title="Trigger Setup" />
        <Step title="Actions" />
        <Step title="Review & Export" />
      </Steps>

      <Form form={form} layout="vertical" onFinish={onFinish}>
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

            <Form.Item name="workflowDescription" label="Workflow Description">
              <TextArea 
                rows={3} 
                placeholder="Describe what the workflow should do in detail (e.g., goals, steps, logic)"
                onChange={(e) => setWorkflowDescription(e.target.value)}
              />
            </Form.Item>

            <Form.Item name="additionalContext" label="Additional Context (Optional)">
              <TextArea 
                rows={2} 
                placeholder="Any specific requirements, constraints, or additional information"
              />
            </Form.Item>

            <Form.Item name="workflowGoals" label="Workflow Goals (Optional)">
              <Select
                mode="tags"
                placeholder="Add workflow goals (press Enter to add)"
                style={{ width: '100%' }}
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

            <Form.Item name="triggerType" initialValue="schedule">
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
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button type="primary" onClick={() => setActiveStep(2)}>
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
              tooltip="Describe exactly what should happen when the workflow runs"
            >
              <TextArea 
                rows={4} 
                placeholder="e.g., Send a Slack message to the #sales channel with the customer details, Create a new row in my Google Sheet with the order info, Generate a summary report and email it to me"
              />
            </Form.Item>

            <Form.Item name="specificRequirements" label="Specific Requirements (Optional)">
              <Select
                mode="tags"
                placeholder="Add any specific requirements (press Enter to add)"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Alert
              message="AI Generation"
              description="Your workflow will be generated with proper n8n nodes, connections, and configurations. You'll be able to fine-tune settings after export."
              type="info"
              showIcon
              className="mb-4"
            />

            <div className="flex justify-between mt-4">
              <Button onClick={() => setActiveStep(1)}>Back</Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={isGenerating}
                icon={isGenerating ? undefined : <ThunderboltOutlined />}
              >
                {isGenerating ? 'Generating Workflow...' : 'Generate Workflow'}
              </Button>
            </div>
          </Card>
        )}

        {activeStep === 3 && currentWorkflow && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <div>
                <Title level={4}>🎉 Your n8n Workflow is Ready!</Title>
                <Text type="secondary">
                  Generated {currentWorkflow.nodeCount} nodes with {currentWorkflow.integrations.length} integrations
                </Text>
              </div>
              <Space>
                <Button onClick={() => setMode('list')}>
                  View All Workflows
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => {
                    setActiveStep(0);
                    setCurrentWorkflow(null);
                    form.resetFields();
                  }}
                >
                  Create Another
                </Button>
              </Space>
            </div>

            <Tabs defaultActiveKey="1">
              <TabPane tab="Workflow JSON" key="1">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <Text strong>n8n Workflow Configuration</Text>
                    <Space>
                      <Button 
                        size="small"
                        onClick={() => copyToClipboard(JSON.stringify(currentWorkflow.workflowConfig, null, 2))}
                      >
                        Copy
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => handleExportWorkflow(currentWorkflow.id, 'json')}
                      >
                        Download
                      </Button>
                    </Space>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 overflow-x-auto max-h-96">
                    {JSON.stringify(currentWorkflow.workflowConfig, null, 2)}
                  </pre>
                </div>
              </TabPane>
              
              <TabPane tab="Setup Instructions" key="2">
                <div className="space-y-4">
                  <Alert
                    message="Importing Your Workflow"
                    description={
                      <ol className="mt-2">
                        {currentWorkflow.setupInstructions.steps.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    }
                    type="info"
                    showIcon
                  />

                  <Alert
                    message="Required Credentials"
                    description={
                      <div className="mt-2">
                        {currentWorkflow.setupInstructions.credentialSetup.map((cred: RequiredCredential, i: number) => (
                          <div key={i} className="mb-2">
                            <Text strong>{cred.name}</Text> ({cred.type})
                            <br />
                            <a href={cred.setupLink} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                              Setup Guide →
                            </a>
                          </div>
                        ))}
                      </div>
                    }
                    type="warning"
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

              <TabPane tab="Analysis" key="3">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card title="Performance Metrics" size="small">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Text type="secondary">Execution Time:</Text>
                          <Text>{currentWorkflow.analysis.estimatedExecutionTime}s</Text>
                        </div>
                        <div className="flex justify-between">
                          <Text type="secondary">Complexity:</Text>
                          <Tag color={
                            currentWorkflow.complexity === 'simple' ? 'green' :
                            currentWorkflow.complexity === 'moderate' ? 'orange' : 'red'
                          }>
                            {currentWorkflow.complexity.toUpperCase()}
                          </Tag>
                        </div>
                        <div className="flex justify-between">
                          <Text type="secondary">Node Count:</Text>
                          <Badge count={currentWorkflow.nodeCount} />
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="Recommendations" size="small">
                      <div className="space-y-2">
                        {currentWorkflow.analysis.optimizationSuggestions.slice(0, 3).map((suggestion, i) => (
                          <div key={i} className="text-sm text-green-600">
                            • {suggestion}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
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

  // Main Render
  if (mode === 'list') {
    return <WorkflowList />;
  }

  if (mode === 'view') {
    return <WorkflowViewer />;
  }

  return <CreateWorkflow />;
};

export default N8nWorkflowCreator;