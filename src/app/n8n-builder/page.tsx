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
  ArrowLeftOutlined,
  DeleteOutlined,
  ReloadOutlined,
  RocketOutlined,
  SettingOutlined,
  CopyOutlined
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
  message,
  Col,
  Statistic,
  Progress,
  ConfigProvider,
  Empty
} from 'antd';

import { useParsed } from "@refinedev/core";
import { useSearchParams } from "next/navigation";
import { useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import LoadingOverlay from './loadingOverlay';
import { useN8nWorkflowBuilder, useWorkflowExport, useIntegrationTemplates } from '../hooks/useN8nWorkflowBuilder';
import { N8nWorkflowInput, SavedWorkflow, ExportFormat, RequiredCredential } from '@/types/n8nWorkflowBuilder';
import { useTheme } from '../../providers/ThemeProvider';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// --- STYLING CONSTANTS ---
const MINT_COLOR = '#5CC49D';
const STEEL_COLOR = '#9DA2B3';
const SPACE_BG = '#0B0C10';
const GLASS_BG = 'rgba(255, 255, 255, 0.03)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.08)';

const N8nWorkflowCreator = () => {
  const [form] = Form.useForm();
  const [activeStep, setActiveStep] = useState(0);
  const { params } = useParsed();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const { theme } = useTheme();
  const isDark = true;

  const router = useRouter();
  const searchParams = useSearchParams();

  const workspaceId = (params?.workspaceId as string) || searchParams?.get('workspaceId') || undefined;
  
  const initialMode = (params?.mode as 'create' | 'list') || 
                     (searchParams?.get('mode') as 'create' | 'list') || 
                     'create';
                     
  const [triggerType, setTriggerType] = useState('schedule');
  const [customIntegrations, setCustomIntegrations] = useState<string[]>([]);
  const [isCustomIntegrationModalVisible, setIsCustomIntegrationModalVisible] = useState(false);
  const [newCustomIntegration, setNewCustomIntegration] = useState('');
  const [mode, setMode] = useState<'create' | 'list' | 'view'>(initialMode);
  const [currentWorkflow, setCurrentWorkflow] = useState<SavedWorkflow | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState("schedule");

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

  // Initialize form with default values
  useEffect(() => {
    form.setFieldValue('triggerType', 'schedule');
    setSelectedTrigger('schedule');
  }, [form]);

  const triggerTypes = [
    {
      value: 'schedule',
      label: 'Scheduled',
      description: 'Run at specific times or intervals',
      icon: <ClockCircleOutlined className="text-xl"/>,
      examples: ['Daily at 8 AM', 'Every hour', 'Monthly']
    },
    {
      value: 'webhook',
      label: 'Webhook',
      description: 'Triggered by an external HTTP request',
      icon: <ApiOutlined className="text-xl"/>,
      examples: ['Form submission', 'Payment received', 'Git push']
    },
    {
      value: 'event',
      label: 'Event',
      description: 'Triggered by system or app events',
      icon: <ThunderboltOutlined className="text-xl"/>,
      examples: ['New email', 'File uploaded', 'DB record created']
    }
  ];

  // Full integration options list from the working version
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
    console.log('Form Values on Submit:', values);
    
    // Get all form values
    const allValues = form.getFieldsValue(true);
    console.log('All Form Values (getFieldsValue):', allValues);
    
    // Debug each step's values
    console.log('Step 0 fields:', {
      workflowName: allValues.workflowName,
      workflowDescription: allValues.workflowDescription,
      additionalContext: allValues.additionalContext,
      workflowGoals: allValues.workflowGoals
    });
    
    console.log('Step 1 fields:', {
      triggerType: allValues.triggerType,
      scheduleDetails: allValues.scheduleDetails,
      webhookDetails: allValues.webhookDetails,
      eventDetails: allValues.eventDetails,
      triggerData: allValues.triggerData
    });
    
    console.log('Step 2 fields:', {
      integrations: allValues.integrations,
      actionDescription: allValues.actionDescription,
      specificRequirements: allValues.specificRequirements
    });
    
    const triggerTypeToUse = allValues.triggerType || selectedTrigger;
    
    // Validate required fields before submission
    if (!allValues.workflowName) {
      message.error('Workflow name is required');
      setActiveStep(0);
      return;
    }
    
    if (!allValues.actionDescription) {
      message.error('Action description is required');
      setActiveStep(2);
      return;
    }
    
    if (!allValues.integrations || allValues.integrations.length === 0) {
      message.error('At least one integration is required');
      setActiveStep(2);
      return;
    }
    
    // Validate trigger-specific required fields
    if (triggerTypeToUse === 'schedule' && !allValues.scheduleDetails) {
      message.error('Schedule details are required for scheduled workflows');
      setActiveStep(1);
      return;
    }
    
    if (triggerTypeToUse === 'webhook' && !allValues.webhookDetails) {
      message.error('Webhook details are required for webhook workflows');
      setActiveStep(1);
      return;
    }
    
    if (triggerTypeToUse === 'event' && !allValues.eventDetails) {
      message.error('Event details are required for event workflows');
      setActiveStep(1);
      return;
    }

    const workflowInput: N8nWorkflowInput = {
      workflowName: allValues.workflowName,
      workflowDescription: allValues.workflowDescription || '',
      triggerType: triggerTypeToUse as 'schedule' | 'webhook' | 'event',
      scheduleDetails: allValues.scheduleDetails,
      webhookDetails: allValues.webhookDetails,
      eventDetails: allValues.eventDetails,
      triggerData: allValues.triggerData,
      integrations: allValues.integrations || [],
      actionDescription: allValues.actionDescription,
      additionalContext: allValues.additionalContext,
      specificRequirements: allValues.specificRequirements || [],
      workflowGoals: allValues.workflowGoals || []
    };

    console.log('Processed Workflow Input:', workflowInput);

    try {
      const result = await generateWorkflow(workflowInput);
      console.log('🔍 Full result from generateWorkflow:', result);
      
      if (result) {
        console.log('🔍 result.workflow:', result.workflow);
        console.log('🔍 result.workflow.workflowConfig:', result.workflow.workflowConfig);
        
        const savedWorkflow: SavedWorkflow = {
          id: result.workflowId,
          title: result.workflow.workflowConfig?.name || workflowInput.workflowName,
          workflowName: result.workflow.workflowConfig?.name || workflowInput.workflowName,
          workflowDescription: workflowInput.workflowDescription || '',
          triggerType: workflowInput.triggerType,
          integrations: workflowInput.integrations,
          complexity: result.workflow.analysis?.complexity || 'moderate',
          nodeCount: result.workflow.analysis?.nodeCount || 0,
          status: 'draft' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          workflowConfig: result.workflow.workflowConfig || {},
          setupInstructions: result.workflow.setupInstructions || { steps: [], credentialSetup: [], testingGuidance: [], troubleshooting: [] },
          analysis: result.workflow.analysis || { nodeCount: 0, connectionCount: 0, complexity: 'moderate', estimatedExecutionTime: 30, potentialIssues: [], optimizationSuggestions: [], securityConsiderations: [], scalabilityNotes: [] },
          workspace: {
            id: workspaceId || 'default',
            name: 'Default Workspace'
          }
        };
        
        console.log('🔍 Created savedWorkflow:', savedWorkflow);
        
        setCurrentWorkflow(savedWorkflow);
        setActiveStep(3);
        console.log('🔍 Set activeStep to 3');
      } else {
        console.error('  No result returned from generateWorkflow');
      }
    } catch (error) {
      console.error('  Error generating workflow:', error);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
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

  // --- SUB-COMPONENTS ---

  // Workflow List Component
  const WorkflowList = () => {
    const columns = [
      {
        title: 'Name',
        dataIndex: 'workflowName',
        key: 'name',
        render: (text: string, record: any) => (
          <div>
            <div className="font-medium text-white">{text}</div>
            <div className="text-xs text-gray-500">{record.triggerType} trigger</div>
          </div>
        )
      },
      {
        title: 'Integrations',
        dataIndex: 'integrations',
        key: 'integrations',
        render: (integrations: string[]) => (
          <div className="flex flex-wrap gap-1">
            {integrations.slice(0, 3).map(integration => (
              <Tag key={integration} bordered={false} className="bg-white/10 text-gray-300 mr-0">{integration}</Tag>
            ))}
            {integrations.length > 3 && (
              <Tag bordered={false} className="bg-white/5 text-gray-500">+{integrations.length - 3} more</Tag>
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
            {complexity?.toUpperCase() || 'N/A'}
          </Tag>
        )
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Badge status={status === 'active' ? 'success' : 'default'} text={<span className="text-gray-400">{status?.toUpperCase() || 'DRAFT'}</span>} />
        )
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        key: 'created',
        render: (date: Date) => new Date(date).toLocaleDateString()
      },
      {
        title: '',
        key: 'actions',
        align: 'right' as const,
        render: (_: any, record: any) => (
          <Space>
            <Tooltip title="View">
              <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewWorkflow(record.id)} className="text-gray-400 hover:text-white"/>
            </Tooltip>
            <Tooltip title="Download JSON">
              <Button type="text" icon={<DownloadOutlined />} onClick={() => handleExportWorkflow(record.id, 'json')} className="text-gray-400 hover:text-white"/>
            </Tooltip>
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteWorkflow(record.id)} />
            </Tooltip>
          </Space>
        )
      }
    ];

    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={2} style={{ color: 'white', marginBottom: 0 }}>Your n8n Workflows</Title>
            <Text style={{ color: STEEL_COLOR }}>Manage and view your automated workflows</Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshWorkflows}
              loading={isLoading}
              className="border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
            >
              Refresh
            </Button>
            <Button
  type="primary"
  icon={<PlusOutlined />}
  size="large"
  onClick={() => {
    setMode('create');
    setActiveStep(0);
    form.resetFields();
    setCurrentWorkflow(null);
  }}
  style={{ 
    backgroundColor: MINT_COLOR, 
    borderColor: MINT_COLOR, 
    color: '#000', 
   
    fontFamily: "'Manrope', sans-serif"
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

        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
              <Statistic 
                title={<span style={{ color: STEEL_COLOR }}>Total Workflows</span>} 
                value={workflows.length} 
                prefix={<RocketOutlined style={{ color: MINT_COLOR }} />} 
                valueStyle={{ color: 'white' }} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
              <Statistic 
                title={<span style={{ color: STEEL_COLOR }}>Active Workflows</span>} 
                value={workflows.filter(w => w.status === 'active').length} 
                prefix={<CheckCircleOutlined style={{ color: MINT_COLOR }} />} 
                valueStyle={{ color: 'white' }} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
              <Statistic 
                title={<span style={{ color: STEEL_COLOR }}>Total Integrations</span>} 
                value={workflows.reduce((sum, w) => sum + w.integrations.length, 0)} 
                prefix={<DatabaseOutlined style={{ color: MINT_COLOR }} />} 
                valueStyle={{ color: 'white' }} 
              />
            </Card>
          </Col>
        </Row>

        <div style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
          <Table
            columns={columns}
            dataSource={workflows}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ color: STEEL_COLOR }}>Click the  Refresh button to see saved  workflows or create your first one!</span>}
                />
              )
            }}
          />
        </div>
      </div>
    );
  };

  // Workflow Viewer Component
  const WorkflowViewer = () => {
    if (!currentWorkflow) return null;

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button icon={<ArrowLeftOutlined />} onClick={() => setMode('list')} type="text" className="text-gray-400 hover:text-white">Back</Button>
          <div className="flex-1">
            <Title level={3} style={{ color: 'white', margin: 0 }}>{currentWorkflow.workflowName}</Title>
            <Text style={{ color: STEEL_COLOR }}>{currentWorkflow.workflowDescription}</Text>
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
                setSelectedTrigger(currentWorkflow.triggerType);
                setMode('create');
                setActiveStep(0);
              }}
              className="border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
            >
              Edit
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => handleExportWorkflow(currentWorkflow.id, 'json')} 
              ghost
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
            <Card bordered={false} style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }} className="h-full">
              <Tabs defaultActiveKey="1" items={[
                {
                  key: '1',
                  label: 'Visual Overview',
                  children: (
                    <div className="space-y-4">
                      <div>
                        <Text strong className="text-gray-400">Trigger Type: </Text>
                        <Tag color="blue">{currentWorkflow.triggerType}</Tag>
                      </div>
                      <div>
                        <Text strong className="text-gray-400">Complexity: </Text>
                        <Tag color={
                          currentWorkflow.complexity === 'simple' ? 'green' :
                          currentWorkflow.complexity === 'moderate' ? 'orange' : 'red'
                        }>
                          {currentWorkflow.complexity?.toUpperCase() || 'MODERATE'}
                        </Tag>
                      </div>
                      <div>
                        <Text strong className="text-gray-400">Nodes: </Text>
                        <Badge count={currentWorkflow.nodeCount} style={{ backgroundColor: MINT_COLOR }} />
                      </div>
                      <div>
                        <Text strong className="text-gray-400">Integrations:</Text>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {currentWorkflow.integrations.map(integration => (
                            <Tag key={integration} bordered={false} className="bg-white/10 text-gray-300">{integration}</Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  key: '2',
                  label: 'JSON Configuration',
                  children: (
                    <div className="relative group">
                      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Space>
                          <Button 
                            size="small" 
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(JSON.stringify(currentWorkflow.workflowConfig, null, 2))}
                          >
                            Copy
                          </Button>
                          <Button 
                            size="small" 
                            icon={<DownloadOutlined />}
                            onClick={() => handleExportWorkflow(currentWorkflow.id, 'json')}
                          >
                            Download
                          </Button>
                        </Space>
                      </div>
                      <div className="bg-[#1e1e1e] p-4 rounded-lg border border-white/10">
                        <pre className="text-xs font-mono text-gray-300 overflow-auto max-h-[500px] whitespace-pre-wrap">
                          {JSON.stringify(currentWorkflow.workflowConfig, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )
                },
                {
                  key: '3',
                  label: 'Setup Instructions',
                  children: (
                    <div className="space-y-4">
                      <Alert
                        message="Importing Your Workflow"
                        description={
                          <ol className="mt-2 text-gray-300">
                            {currentWorkflow.setupInstructions.steps.map((step: string, i: number) => (
                              <li key={i} className="mb-1">{step}</li>
                            ))}
                          </ol>
                        }
                        type="info"
                        showIcon
                        style={{ background: 'rgba(24, 144, 255, 0.1)', border: '1px solid rgba(24, 144, 255, 0.2)' }}
                      />

                      <Alert
                        message="Required Credentials"
                        description={
                          <div className="mt-2">
                            {currentWorkflow.setupInstructions?.credentialSetup && 
                             currentWorkflow.setupInstructions.credentialSetup.length > 0 ? (
                              currentWorkflow.setupInstructions.credentialSetup.map((cred: any, i: number) => {
                                const serviceName = cred.name || cred.service || cred.integration || `${currentWorkflow.integrations[i] || 'Service ' + (i + 1)}`;
                                const credType = cred.type || cred.credentialType || 'OAuth2/API Key';
                                const setupUrl = cred.setupLink || cred.setupUrl || cred.documentationUrl;
                                
                                return (
                                  <div key={i} className="mb-2">
                                    <Text strong className="text-white">{serviceName}</Text> <span className="text-xs text-gray-500">({credType})</span>
                                    <br />
                                    {setupUrl && setupUrl !== '#' ? (
                                      <a 
                                        href={setupUrl.startsWith('http') ? setupUrl : `https://docs.n8n.io/integrations/credentials/${serviceName.toLowerCase()}/`}
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-400 hover:text-blue-300"
                                      >
                                        Setup Guide →
                                      </a>
                                    ) : (
                                      <a 
                                        href={`https://docs.n8n.io/integrations/credentials/`}
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-400 hover:text-blue-300"
                                      >
                                        n8n Credentials Guide →
                                      </a>
                                    )}
                                    {cred.description && (
                                      <div className="text-sm text-gray-500 mt-1">
                                        {cred.description}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-gray-300">
                                Configure credentials for: {currentWorkflow.integrations.join(', ')}
                                <br />
                                <a 
                                  href="https://docs.n8n.io/integrations/credentials/"
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  View n8n Credentials Documentation →
                                </a>
                              </div>
                            )}
                          </div>
                        }
                        type="warning"
                        showIcon
                        style={{ background: 'rgba(250, 173, 20, 0.1)', border: '1px solid rgba(250, 173, 20, 0.2)' }}
                      />

                      <Alert
                        message="Need Help?"
                        description={
                          <div className="text-gray-300">
                            <p>Visit the <a href="https://docs.n8n.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">n8n documentation</a> for detailed guides</p>
                            <p>Or join the <a href="https://community.n8n.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">community forum</a> for support</p>
                          </div>
                        }
                        type="info"
                        showIcon
                        style={{ background: 'rgba(24, 144, 255, 0.1)', border: '1px solid rgba(24, 144, 255, 0.2)' }}
                      />
                    </div>
                  )
                }
              ]} />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title={<span className="text-white">Analysis & Metrics</span>} bordered={false} style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }} className="mb-4">
              <div className="space-y-6">
                <div>
                  <div className="text-xs text-gray-500 uppercase">Estimated Execution Time</div>
                  <div className="text-2xl text-white font-semibold">{currentWorkflow.analysis.estimatedExecutionTime}s</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-2">Security Level</div>
                  <Tag color={currentWorkflow.analysis.securityConsiderations?.length > 2 ? 'red' : 'green'}>
                    {currentWorkflow.analysis.securityConsiderations?.length > 2 ? 'HIGH RISK' : 'MEDIUM'}
                  </Tag>
                </div>
                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }}/>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-2">Potential Issues</div>
                  {currentWorkflow.analysis.potentialIssues?.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {currentWorkflow.analysis.potentialIssues.map((issue: string, i: number) => (
                        <li key={i} className="text-sm text-orange-400">• {issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <Text className="text-gray-500 text-sm">No issues detected</Text>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-2">Optimization Suggestions</div>
                  {currentWorkflow.analysis.optimizationSuggestions?.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {currentWorkflow.analysis.optimizationSuggestions.map((suggestion: string, i: number) => (
                        <li key={i} className="text-sm text-green-400">• {suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <Text className="text-gray-500 text-sm">Workflow is optimized</Text>
                  )}
                </div>
              </div>
            </Card>

            <Card title={<span className="text-white">Export Options</span>} bordered={false} style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
              <Space direction="vertical" className="w-full">
                <Button
                  block
                  onClick={() => handleExportWorkflow(currentWorkflow.id, 'json')}
                  className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                >
                  Download n8n JSON
                </Button>
                <Button
                  block
                  onClick={() => handleExportWorkflow(currentWorkflow.id, 'summary')}
                  className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                >
                  Download Summary
                </Button>
                <Button
                  block
                  onClick={() => handleExportWorkflow(currentWorkflow.id, 'setup-guide')}
                  className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                >
                  Download Setup Guide
                </Button>
                <Button
                  block
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(JSON.stringify(currentWorkflow.workflowConfig, null, 2))}
                  className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
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

  // --- MAIN RENDER ---

  if (mode === 'list') return (
    <ConfigProvider theme={{
      token: { fontFamily: 'Manrope, sans-serif', colorPrimary: MINT_COLOR, colorBgBase: SPACE_BG, colorTextBase: '#fff', colorBorder: GLASS_BORDER },
      components: { Table: { colorBgContainer: 'transparent', colorTextHeading: STEEL_COLOR } }
    }}>
      <div className="min-h-screen bg-[#0B0C10]">
        <WorkflowList />
      </div>
    </ConfigProvider>
  );

  if (mode === 'view') return (
    <ConfigProvider theme={{
      token: { fontFamily: 'Manrope, sans-serif', colorPrimary: MINT_COLOR, colorBgBase: SPACE_BG, colorTextBase: '#fff', colorBorder: GLASS_BORDER },
      components: { Tabs: { itemColor: STEEL_COLOR, itemSelectedColor: MINT_COLOR, itemHoverColor: '#fff' } }
    }}>
      <div className="min-h-screen bg-[#0B0C10]">
        <WorkflowViewer />
      </div>
    </ConfigProvider>
  );

  // Create Mode
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Manrope', sans-serif",
          colorPrimary: MINT_COLOR,
          colorBgBase: SPACE_BG,
          colorTextBase: '#ffffff',
          colorBorder: 'rgba(255,255,255,0.15)',
          borderRadius: 8,
        },
        components: {
          Input: {
            colorBgContainer: 'rgba(255,255,255,0.05)',
            colorBorder: 'transparent',
            activeBorderColor: MINT_COLOR,
            hoverBorderColor: 'rgba(255,255,255,0.2)',
          },
          Select: {
            colorBgContainer: 'rgba(255,255,255,0.05)',
            colorBorder: 'transparent',
            controlOutline: 'transparent',
          },
          Card: {
            colorBgContainer: GLASS_BG,
            colorBorderSecondary: GLASS_BORDER,
          },
          Steps: {
            colorText: STEEL_COLOR,
            colorTextDescription: '#666',
            colorPrimary: MINT_COLOR,
            colorSplit: 'rgba(255,255,255,0.1)'
          },
          Alert: {
            colorInfoBg: 'rgba(92, 196, 157, 0.1)',
            colorInfoBorder: 'rgba(92, 196, 157, 0.2)',
            colorText: '#fff'
          }
        }
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Manrope', sans-serif; }
        .ant-steps-item-process .ant-steps-item-icon { background: ${MINT_COLOR} !important; border-color: ${MINT_COLOR} !important; }
        .ant-steps-item-process .ant-steps-item-icon .ant-steps-icon { color: #000 !important; }
        .ant-steps-item-wait .ant-steps-item-icon { border-color: #444 !important; background: transparent !important; }
        .ant-steps-item-wait .ant-steps-item-icon > .ant-steps-icon { color: #666 !important; }
        .ant-steps-item-finish .ant-steps-item-icon { border-color: ${MINT_COLOR} !important; }
        .ant-steps-item-finish .ant-steps-item-icon > .ant-steps-icon { color: ${MINT_COLOR} !important; }
        .ant-card-bordered { border: 1px solid ${GLASS_BORDER}; }
        .ant-select-selector { border: 1px solid rgba(255,255,255,0.1) !important; }
      `}</style>

      <div className="min-h-screen bg-[#0B0C10] pb-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              type="text"
              className="text-gray-400 hover:text-white pl-0"
            >
              Back to Dashboard
            </Button>
            <Button 
              type="dashed"
              icon={<EyeOutlined />}
              onClick={() => setMode('list')}
              className="border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
            >
              View All Workflows
            </Button>
          </div>

          <div className="text-center mb-10">
            <LoadingOverlay visible={isGenerating} />
           <Title level={2} className="mb-2" style={{ 
  color: 'white', 
  fontFamily: "'Manrope', sans-serif",
  textAlign: 'center'
}}>
 arbitrageOS n8n Workflow Creator
</Title>
            <Text style={{ color: STEEL_COLOR, fontSize: '16px' }}>
              Design powerful automation workflows with AI assistance for your business processes
            </Text>
          </div>

          {generationError && (
            <Alert 
              message="Workflow Generation Error" 
              description={generationError} 
              type="error" 
              showIcon 
              closable 
              onClose={clearErrors} 
              className="mb-6" 
            />
          )}

          <Steps current={activeStep} className="mb-12">
            <Step title="Workflow Details" />
            <Step title="Trigger Setup" />
            <Step title="Integrations & Actions" />
            <Step title="Review & Export" />
          </Steps>

          <Form form={form} layout="vertical" onFinish={onFinish}>
            
            {/* STEP 0: DETAILS */}
            {activeStep === 0 && (
              <Card bordered={false} className="shadow-2xl">
                <Title level={4} style={{ color: 'white', marginBottom: 24 }}>Workflow Information</Title>
                
                <Form.Item 
                  name="workflowName" 
                  label="Workflow Name" 
                  rules={[{ required: true, message: 'Please name your workflow!' }]}
                  tooltip="A descriptive name helps identify this workflow later"
                >
                  <Input size="large" placeholder="e.g., Daily Sales Report, New Lead Notification" prefix={<RocketOutlined className="text-gray-600 mr-2"/>} />
                </Form.Item>

                <Form.Item name="workflowDescription" label="Workflow Description">
                  <TextArea 
                    rows={3} 
                    placeholder="Describe what the workflow should do in detail (e.g., goals, steps, logic)" 
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }} 
                  />
                </Form.Item>

                <Form.Item name="additionalContext" label="Additional Context (Optional)">
                  <TextArea 
                    rows={2} 
                    placeholder="Any specific requirements, constraints, or additional information" 
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }} 
                  />
                </Form.Item>

                <Form.Item name="workflowGoals" label="Workflow Goals (Optional)">
                  <Select
                    mode="tags"
                    placeholder="Add workflow goals (press Enter to add)"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <div className="flex justify-end mt-8">
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => {
                      form.validateFields(['workflowName'])
                        .then(() => setActiveStep(1))
                        .catch((info) => console.log('Validation failed:', info));
                    }}
                    style={{ backgroundColor: MINT_COLOR, borderColor: MINT_COLOR, color: '#000', fontWeight: 600, paddingLeft: 32, paddingRight: 32 }}
                  >
                    Next: Trigger Setup
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 1: TRIGGER */}
            {activeStep === 1 && (
              <Card bordered={false} className="shadow-2xl">
                <Title level={4} style={{ color: 'white', marginBottom: 8 }}>Workflow Trigger</Title>
                <Text style={{ color: STEEL_COLOR, display: 'block', marginBottom: 24 }}>
                  What event or schedule should kick off this workflow?
                </Text>

                <Form.Item
                  name="triggerType"
                  label="Trigger Type"
                  initialValue="schedule"
                  rules={[{ required: true, message: "Please select a trigger type!" }]}
                >
                  <Input type="hidden" value={selectedTrigger} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {triggerTypes.map((trigger) => (
                      <div
                        key={trigger.value}
                        onClick={() => {
                          setSelectedTrigger(trigger.value);
                          form.setFieldValue('triggerType', trigger.value);
                        }}
                        className={`cursor-pointer rounded-xl p-5 border transition-all duration-300 ${
                          selectedTrigger === trigger.value
                            ? 'bg-opacity-10'
                            : 'border-white/10 hover:border-white/30 bg-white/5'
                        }`}
                        style={{ 
                          borderColor: selectedTrigger === trigger.value ? MINT_COLOR : undefined,
                          backgroundColor: selectedTrigger === trigger.value ? 'rgba(92, 196, 157, 0.1)' : undefined
                        }}
                      >
                        <div className="mb-3" style={{ color: selectedTrigger === trigger.value ? MINT_COLOR : 'white' }}>{trigger.icon}</div>
                        <div className="font-bold text-white mb-1">{trigger.label}</div>
                        <div className="text-xs text-gray-400 mb-2">{trigger.description}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {trigger.examples.map((example, i) => (
                            <Tag key={i} color="blue" className="mb-1 text-xs">
                              {example}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Form.Item>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-6">
                  {selectedTrigger === "schedule" && (
                    <Form.Item
                      name="scheduleDetails"
                      label="Schedule Details"
                      rules={[{ required: true, message: "Please specify the schedule!" }]}
                    >
                      <Input placeholder="e.g., Every morning at 8 AM, Every 30 minutes" />
                    </Form.Item>
                  )}

                  {selectedTrigger === "webhook" && (
                    <Form.Item
                      name="webhookDetails"
                      label="Webhook Details"
                      rules={[{ required: true, message: "Please describe the webhook trigger!" }]}
                    >
                      <Input placeholder="e.g., When I receive an email with 'invoice' in the subject" />
                    </Form.Item>
                  )}

                  {selectedTrigger === "event" && (
                    <Form.Item
                      name="eventDetails"
                      label="Event Details"
                      rules={[{ required: true, message: "Please describe the event trigger!" }]}
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
                </div>

                <Alert
                  message="Next Step"
                  description="You will select the tools (integrations) and define the actions for your workflow on the next screen."
                  type="info"
                  showIcon
                  className="mb-4"
                />

                <div className="flex justify-between mt-8">
                  <Button size="large" onClick={() => setActiveStep(0)} type="text" className="text-gray-400 hover:text-white">Back</Button>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => setActiveStep(2)}
                    style={{ backgroundColor: MINT_COLOR, borderColor: MINT_COLOR, color: '#000', fontWeight: 600, paddingLeft: 32, paddingRight: 32 }}
                  >
                    Next: Integrations & Actions
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 2: INTEGRATIONS & ACTIONS */}
            {activeStep === 2 && (
              <Card bordered={false} className="shadow-2xl">
                <Title level={4} style={{ color: 'white', marginBottom: 24 }}>Workflow Actions</Title>

                <Form.Item
                  name="integrations"
                  label="Select Integrations"
                  rules={[{ required: true, message: 'Please select at least one integration!' }]}
                >
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Select tools/services to integrate"
                    dropdownRender={(menu) => (
                      <div className="bg-[#1f1f1f] border border-gray-700">
                        {menu}
                        <Divider style={{ margin: '4px 0', borderColor: '#333' }} />
                        <div 
                          className="p-2 cursor-pointer text-gray-400 hover:text-white" 
                          onClick={() => setIsCustomIntegrationModalVisible(true)}
                        >
                          <PlusOutlined /> Add custom integration
                        </div>
                      </div>
                    )}
                    options={allIntegrationOptions.map((option) => ({ value: option, label: option }))}
                  />
                </Form.Item>

                <Form.Item
                  name="actionDescription"
                  label="Action Details"
                  rules={[{ required: true, message: 'Please describe what should happen!' }]}
                  tooltip="Describe exactly what should happen when the workflow runs"
                >
                  <TextArea
                    rows={6}
                    placeholder="e.g., Send a Slack message to the #sales channel with the customer details, Create a new row in my Google Sheet with the order info, Generate a summary report and email it to me"
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }}
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

                <div className="flex justify-between mt-8">
                  <Button size="large" onClick={() => setActiveStep(1)} type="text" className="text-gray-400 hover:text-white">Back</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={isGenerating}
                    icon={!isGenerating && <ThunderboltOutlined />}
                    style={{ backgroundColor: MINT_COLOR, borderColor: MINT_COLOR, color: '#000', fontWeight: 600, paddingLeft: 32, paddingRight: 32 }}
                  >
                    {isGenerating ? 'Generating Workflow...' : 'Generate Workflow'}
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 3: REVIEW & EXPORT */}
            {activeStep === 3 && currentWorkflow && (
              <Card bordered={false} className="shadow-2xl">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
                    <CheckCircleOutlined style={{ fontSize: 32 }} />
                  </div>
                  <Title level={3} style={{ color: 'white' }}>🎉 Your n8n Workflow is Ready!</Title>
                  <Text style={{ color: STEEL_COLOR }}>
                    Generated {currentWorkflow.nodeCount} nodes with {currentWorkflow.integrations.length} integrations
                  </Text>
                </div>

                <div className="flex justify-center gap-4 mb-8">
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
                    style={{ backgroundColor: MINT_COLOR, borderColor: MINT_COLOR, color: '#000', fontWeight: 600 }}
                  >
                    Create Another
                  </Button>
                </div>

                <Tabs 
                  defaultActiveKey="1" 
                  centered
                  items={[
                    {
                      key: '1',
                      label: 'Workflow JSON',
                      children: (
                        <div className="relative group">
                          <div className="absolute top-2 right-2 z-10 flex gap-2">
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
                          </div>
                          <div className="bg-[#1e1e1e] p-6 rounded-lg border border-white/10">
                            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 overflow-x-auto max-h-96">
                              {JSON.stringify(currentWorkflow.workflowConfig, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )
                    },
                    {
                      key: '2',
                      label: 'Setup Instructions',
                      children: (
                        <div className="space-y-4">
                          <Alert
                            message="Importing Your Workflow"
                            description={
                              <ol className="mt-2 text-gray-300">
                                {currentWorkflow.setupInstructions.steps.map((step: string, i: number) => (
                                  <li key={i} className="mb-1">{step}</li>
                                ))}
                              </ol>
                            }
                            type="info"
                            showIcon
                            style={{ background: 'rgba(24, 144, 255, 0.1)', border: '1px solid rgba(24, 144, 255, 0.2)' }}
                          />

                          <Alert
                            message="Required Credentials"
                            description={
                              <div className="mt-2">
                                {currentWorkflow.setupInstructions?.credentialSetup && 
                                 currentWorkflow.setupInstructions.credentialSetup.length > 0 ? (
                                  currentWorkflow.setupInstructions.credentialSetup.map((cred: any, i: number) => {
                                    const serviceName = cred.name || cred.service || cred.integration || `${currentWorkflow.integrations[i] || 'Service ' + (i + 1)}`;
                                    const credType = cred.type || cred.credentialType || 'OAuth2/API Key';
                                    const setupUrl = cred.setupLink || cred.setupUrl || cred.documentationUrl;
                                    
                                    return (
                                      <div key={i} className="mb-2">
                                        <Text strong className="text-white">{serviceName}</Text> <span className="text-xs text-gray-500">({credType})</span>
                                        <br />
                                        {setupUrl && setupUrl !== '#' ? (
                                          <a 
                                            href={setupUrl.startsWith('http') ? setupUrl : `https://docs.n8n.io/integrations/credentials/${serviceName.toLowerCase()}/`}
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-blue-400 hover:text-blue-300"
                                          >
                                            Setup Guide →
                                          </a>
                                        ) : (
                                          <a 
                                            href={`https://docs.n8n.io/integrations/credentials/`}
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-blue-400 hover:text-blue-300"
                                          >
                                            n8n Credentials Guide →
                                          </a>
                                        )}
                                        {cred.description && (
                                          <div className="text-sm text-gray-500 mt-1">
                                            {cred.description}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-gray-300">
                                    Configure credentials for: {currentWorkflow.integrations.join(', ')}
                                    <br />
                                    <a 
                                      href="https://docs.n8n.io/integrations/credentials/"
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-blue-400 hover:text-blue-300"
                                    >
                                      View n8n Credentials Documentation →
                                    </a>
                                  </div>
                                )}
                              </div>
                            }
                            type="warning"
                            showIcon
                            style={{ background: 'rgba(250, 173, 20, 0.1)', border: '1px solid rgba(250, 173, 20, 0.2)' }}
                          />

                          <Alert
                            message="Need Help?"
                            description={
                              <div className="text-gray-300">
                                <p>Visit the <a href="https://docs.n8n.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">n8n documentation</a> for detailed guides</p>
                                <p>Or join the <a href="https://community.n8n.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">community forum</a> for support</p>
                              </div>
                            }
                            type="info"
                            showIcon
                            style={{ background: 'rgba(24, 144, 255, 0.1)', border: '1px solid rgba(24, 144, 255, 0.2)' }}
                          />
                        </div>
                      )
                    },
                    {
                      key: '3',
                      label: 'Analysis',
                      children: (
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={12}>
                            <Card title={<span className="text-white">Performance Metrics</span>} size="small" bordered={false} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <Text className="text-gray-400">Execution Time:</Text>
                                  <Text className="text-white">{currentWorkflow.analysis.estimatedExecutionTime}s</Text>
                                </div>
                                <div className="flex justify-between items-center">
                                  <Text className="text-gray-400">Complexity:</Text>
                                  <Tag color={
                                    currentWorkflow.complexity === 'simple' ? 'green' :
                                    currentWorkflow.complexity === 'moderate' ? 'orange' : 'red'
                                  }>
                                    {currentWorkflow.complexity?.toUpperCase() || 'MODERATE'}
                                  </Tag>
                                </div>
                                <div className="flex justify-between items-center">
                                  <Text className="text-gray-400">Node Count:</Text>
                                  <Badge count={currentWorkflow.nodeCount} style={{ backgroundColor: MINT_COLOR }} />
                                </div>
                                <div className="flex justify-between items-center">
                                  <Text className="text-gray-400">Connections:</Text>
                                  <Text className="text-white">{currentWorkflow.analysis.connectionCount || 0}</Text>
                                </div>
                              </div>
                            </Card>
                          </Col>
                          <Col xs={24} md={12}>
                            <Card title={<span className="text-white">Recommendations</span>} size="small" bordered={false} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div className="space-y-2">
                                {currentWorkflow.analysis.optimizationSuggestions?.slice(0, 3).map((suggestion: string, i: number) => (
                                  <div key={i} className="text-sm text-green-400">
                                    • {suggestion}
                                  </div>
                                ))}
                                {(!currentWorkflow.analysis.optimizationSuggestions || currentWorkflow.analysis.optimizationSuggestions.length === 0) && (
                                  <Text className="text-gray-500 text-sm">Workflow is optimized</Text>
                                )}
                              </div>
                            </Card>
                          </Col>
                        </Row>
                      )
                    }
                  ]}
                />
              </Card>
            )}
          </Form>

          <Modal
            title="Add Custom Integration"
            open={isCustomIntegrationModalVisible}
            onOk={addCustomIntegration}
            onCancel={() => setIsCustomIntegrationModalVisible(false)}
            styles={{ body: { background: SPACE_BG }, header: { background: SPACE_BG } }}
          >
            <Input
              placeholder="Enter custom integration name"
              value={newCustomIntegration}
              onChange={(e) => setNewCustomIntegration(e.target.value)}
              onPressEnter={addCustomIntegration}
              className="bg-white/5 border-gray-700 text-white"
            />
          </Modal>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default N8nWorkflowCreator;