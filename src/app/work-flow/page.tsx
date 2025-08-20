// app/dashboard/workflows/page.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
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
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  SettingOutlined,
  RobotOutlined
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
  Row,
  Col,
  List,
  Avatar,
  Empty,
  Switch,
  InputNumber,
  message
} from 'antd';
import { useTheme } from '../../providers/ThemeProvider';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  triggerType: string;
  lastRun: Date | null;
  nextRun: Date | null;
  successRate: number;
  nodes: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowBuilderPage = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('builder');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock data for workflows
  useEffect(() => {
    setWorkflows([
      {
        id: '1',
        name: 'Daily Sales Report',
        description: 'Generates and sends daily sales reports to the team',
        status: 'active',
        triggerType: 'schedule',
        lastRun: new Date(Date.now() - 1000 * 60 * 60 * 2),
        nextRun: new Date(Date.now() + 1000 * 60 * 60 * 22),
        successRate: 95,
        nodes: 5,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      },
      {
        id: '2',
        name: 'Lead Enrichment',
        description: 'Enriches new leads with additional data from various sources',
        status: 'active',
        triggerType: 'webhook',
        lastRun: new Date(Date.now() - 1000 * 60 * 15),
        nextRun: null,
        successRate: 88,
        nodes: 8,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
      },
      {
        id: '3',
        name: 'Customer Onboarding',
        description: 'Automates the customer onboarding process',
        status: 'draft',
        triggerType: 'manual',
        lastRun: null,
        nextRun: null,
        successRate: 0,
        nodes: 6,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
      }
    ]);
  }, []);

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || workflow.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateWorkflow = (values: any) => {
    const newWorkflow: Workflow = {
      id: Math.random().toString(36).substring(7),
      name: values.name,
      description: values.description || '',
      status: 'draft',
      triggerType: values.triggerType || 'manual',
      lastRun: null,
      nextRun: null,
      successRate: 0,
      nodes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setWorkflows([...workflows, newWorkflow]);
    setIsCreateModalVisible(false);
    message.success('Workflow created successfully');
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this workflow?',
      content: 'This action cannot be undone.',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        setWorkflows(workflows.filter(w => w.id !== workflowId));
        message.success('Workflow deleted successfully');
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'draft': return 'orange';
      default: return 'default';
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'schedule': return <ClockCircleOutlined />;
      case 'webhook': return <ApiOutlined />;
      case 'manual': return <ThunderboltOutlined />;
      default: return <ThunderboltOutlined />;
    }
  };

  const cardStyle = {
 
    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
    borderRadius: 8,
  };

  return (
    <div style={{ 
  
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title 
              level={2} 
              style={{ 
                margin: 0,
                color: theme === 'dark' ? '#f9fafb' : '#1a1a1a'
              }}
            >
              <ThunderboltOutlined style={{ marginRight: 12 }} />
              Workflow Builder
            </Title>
            <Text 
              style={{ 
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}
            >
              Design and automate your business processes with visual workflows
            </Text>
          </div>
          <Space>
            <Button 
              icon={<UploadOutlined />}
              onClick={() => setIsImportModalVisible(true)}
            >
              Import
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
            >
              New Workflow
            </Button>
          </Space>
        </div>

        {/* Stats Overview */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  padding: 12, 
                  borderRadius: 8, 
                  backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                  marginRight: 12
                }}>
                  <ThunderboltOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Total Workflows</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>{workflows.length}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  padding: 12, 
                  borderRadius: 8, 
                  backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                  marginRight: 12
                }}>
                  <CheckCircleOutlined style={{ color: '#10b981', fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Active</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                    {workflows.filter(w => w.status === 'active').length}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  padding: 12, 
                  borderRadius: 8, 
                  backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                  marginRight: 12
                }}>
                  <ClockCircleOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Avg. Success</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                    {workflows.length > 0 
                      ? Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.filter(w => w.status === 'active').length) 
                      : 0}%
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  padding: 12, 
                  borderRadius: 8, 
                  backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                  marginRight: 12
                }}>
                  <DatabaseOutlined style={{ color: '#8b5cf6', fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Total Nodes</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                    {workflows.reduce((sum, w) => sum + w.nodes, 0)}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card
          style={cardStyle}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <div style={{ 
            display: 'flex', 
            gap: 16,
            flexDirection: window.innerWidth < 576 ? 'column' : 'row'
          }}>
            <Input
              placeholder="Search workflows..."
              prefix={<SearchOutlined style={{ color: theme === 'dark' ? '#9ca3af' : '#d1d5db' }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                flex: 1,
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                borderColor: theme === 'dark' ? '#374151' : '#d1d5db'
              }}
            />
            <Select
              placeholder="Filter by status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              suffixIcon={<FilterOutlined style={{ color: theme === 'dark' ? '#9ca3af' : '#d1d5db' }} />}
              style={{ 
                width: window.innerWidth < 576 ? '100%' : 150,
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                borderColor: theme === 'dark' ? '#374151' : '#d1d5db'
              }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="draft">Draft</Option>
            </Select>
          </div>
        </Card>
      </div>

      {/* Workflows List */}
      <Card
        style={cardStyle}
        title={`Workflows (${filteredWorkflows.length})`}
      >
        {filteredWorkflows.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={filteredWorkflows}
            renderItem={(workflow) => (
              <List.Item
                style={{
                  padding: '20px 0',
                  borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0'
                }}
                actions={[
                  <Button 
                    key="view" 
                    type="text" 
                    icon={<EyeOutlined />} 
                    onClick={() => setSelectedWorkflow(workflow)}
                    style={{ color: theme === 'dark' ? '#a78bfa' : '#6d28d9' }}
                  >
                    View
                  </Button>,
                  <Button 
                    key="edit" 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => setSelectedWorkflow(workflow)}
                    style={{ color: theme === 'dark' ? '#a78bfa' : '#6d28d9' }}
                  >
                    Edit
                  </Button>,
                  <Button 
                    key="delete" 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    style={{ color: theme === 'dark' ? '#f87171' : '#dc2626' }}
                  >
                    Delete
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ 
                        backgroundColor: theme === 'dark' ? '#4c1d95' : '#ede9fe',
                        color: theme === 'dark' ? '#a78bfa' : '#6d28d9'
                      }}
                      icon={getTriggerIcon(workflow.triggerType)}
                    />
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text 
                        strong 
                        style={{ 
                          color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                          fontSize: 16
                        }}
                      >
                        {workflow.name}
                      </Text>
                      <Tag color={getStatusColor(workflow.status)}>
                        {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                      </Tag>
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                        {workflow.description}
                      </Text>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Trigger: </Text>
                          <Tag>{workflow.triggerType}</Tag>
                        </div>
                        <div>
                          <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Nodes: </Text>
                          <Tag>{workflow.nodes}</Tag>
                        </div>
                        <div>
                          <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Success: </Text>
                          <Tag color={workflow.successRate > 90 ? 'green' : workflow.successRate > 70 ? 'orange' : 'red'}>
                            {workflow.successRate}%
                          </Tag>
                        </div>
                      </div>
                    </Space>
                  }
                />
                
                <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {workflow.lastRun && (
                    <div>
                      <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Last Run: </Text>
                      <Text style={{ fontSize: 14, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                        {workflow.lastRun.toLocaleDateString()} {workflow.lastRun.toLocaleTimeString()}
                      </Text>
                    </div>
                  )}
                  {workflow.nextRun && (
                    <div>
                      <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Next Run: </Text>
                      <Text style={{ fontSize: 14, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                        {workflow.nextRun.toLocaleDateString()} {workflow.nextRun.toLocaleTimeString()}
                      </Text>
                    </div>
                  )}
                  <div>
                    <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Updated: </Text>
                    <Text style={{ fontSize: 14, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                      {workflow.updatedAt.toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                No workflows found
              </Text>
            }
          >
            <Text style={{ 
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              marginBottom: 16
            }}>
              {searchTerm || selectedStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first workflow.'}
            </Text>
            {!searchTerm && selectedStatus === 'all' && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                Create New Workflow
              </Button>
            )}
          </Empty>
        )}
      </Card>

      {/* Create Workflow Modal */}
      <Modal
        title="Create New Workflow"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <WorkflowForm 
          onCancel={() => setIsCreateModalVisible(false)} 
          onSubmit={handleCreateWorkflow}
        />
      </Modal>

      {/* Import Workflow Modal */}
      <Modal
        title="Import Workflow"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: 24 }}>
            <Alert
              message="Import Options"
              description="You can import workflows from n8n JSON files or from other automation platforms."
              type="info"
              showIcon
            />
          </div>
          
          <div style={{ 
            border: `2px dashed ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
            borderRadius: 8,
            padding: 40,
            textAlign: 'center',
            marginBottom: 24,
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb'
          }}>
            <DownloadOutlined style={{ fontSize: 32, color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: 16 }} />
            <div style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: 16 }}>
              Drag and drop a workflow file here, or click to browse
            </div>
            <Button icon={<UploadOutlined />}>
              Browse Files
            </Button>
          </div>

          <Divider>Or</Divider>

          <Form layout="vertical">
            <Form.Item label="Paste JSON Configuration">
              <TextArea 
                rows={6} 
                placeholder="Paste your n8n workflow JSON here..."
                style={{ 
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                  color: theme === 'dark' ? '#f9fafb' : '#1a1a1a'
                }}
              />
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setIsImportModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary">
                  Import Workflow
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

// Workflow Form Component
const WorkflowForm = ({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: (values: any) => void }) => {
  const [form] = Form.useForm();
  const { theme } = useTheme();

  const onFinish = (values: any) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        triggerType: 'manual'
      }}
    >
      <Form.Item
        name="name"
        label="Workflow Name"
        rules={[{ required: true, message: 'Please enter workflow name' }]}
      >
        <Input placeholder="Enter workflow name" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea rows={3} placeholder="Describe what this workflow does" />
      </Form.Item>

      <Form.Item
        name="triggerType"
        label="Trigger Type"
        rules={[{ required: true, message: 'Please select trigger type' }]}
      >
        <Select>
          <Option value="manual">Manual</Option>
          <Option value="schedule">Scheduled</Option>
          <Option value="webhook">Webhook</Option>
          <Option value="event">Event</Option>
        </Select>
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Create Workflow
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default WorkflowBuilderPage;