// app/dashboard/agents/page.tsx
"use client";

import React, { useState } from 'react';
import { useList, useOne } from '@refinedev/core';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  RocketOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Grid, 
  Typography, 
  Space, 
  Avatar, 
  List, 
  Input, 
  Select, 
  Empty,
  Progress,
  Statistic,
  Row,
  Col,
  Badge,
  Modal,
  Form,
  InputNumber,
  Switch
} from 'antd';
import { useTheme } from '../../providers/ThemeProvider';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Option } = Select;
const { TextArea } = Input;

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  description: string;
  assignedClient: string;
  progress: number;
  lastRun: Date;
  nextRun: Date;
  successRate: number;
  avgRunTime: string;
  tasksCompleted: number;
  totalTasks: number;
}

const AgentWorkflowPage = () => {
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Mock data - replace with your actual API calls
  const agentsData: Agent[] = [
    {
      id: '1',
      name: 'Lead Qualification Bot',
      type: 'automation',
      status: 'active',
      description: 'Automatically qualifies leads based on predefined criteria and scoring',
      assignedClient: 'TechStart Inc',
      progress: 75,
      lastRun: new Date(Date.now() - 1000 * 60 * 30),
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 2),
      successRate: 92,
      avgRunTime: '45 min',
      tasksCompleted: 23,
      totalTasks: 30
    },
    {
      id: '2',
      name: 'Content Research Agent',
      type: 'research',
      status: 'active',
      description: 'Gathers and analyzes content trends for targeted marketing',
      assignedClient: 'GrowthCo',
      progress: 40,
      lastRun: new Date(Date.now() - 1000 * 60 * 120),
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 4),
      successRate: 88,
      avgRunTime: '2h 15min',
      tasksCompleted: 8,
      totalTasks: 20
    },
    {
      id: '3',
      name: 'Customer Support Analyzer',
      type: 'analysis',
      status: 'paused',
      description: 'Analyzes support tickets and suggests improvements',
      assignedClient: 'ScaleUp Agency',
      progress: 20,
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24),
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24),
      successRate: 95,
      avgRunTime: '1h 30min',
      tasksCompleted: 4,
      totalTasks: 20
    },
    {
      id: '4',
      name: 'Social Media Scheduler',
      type: 'automation',
      status: 'completed',
      description: 'Automatically schedules and posts content across social platforms',
      assignedClient: 'InnovateCorp',
      progress: 100,
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 2),
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24),
      successRate: 98,
      avgRunTime: '25 min',
      tasksCompleted: 15,
      totalTasks: 15
    },
    {
      id: '5',
      name: 'SEO Optimization Agent',
      type: 'optimization',
      status: 'error',
      description: 'Analyzes and suggests SEO improvements for client websites',
      assignedClient: 'DigitalBoost',
      progress: 15,
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 6),
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 12),
      successRate: 82,
      avgRunTime: '3h 10min',
      tasksCompleted: 3,
      totalTasks: 20
    }
  ];

  const filteredAgents = agentsData.filter(agent => {
    const matchesStatus = selectedStatus === 'all' || agent.status === selectedStatus;
    const matchesType = selectedType === 'all' || agent.type === selectedType;
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.assignedClient.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'paused': return 'orange';
      case 'completed': return 'blue';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'automation': return <RocketOutlined />;
      case 'research': return <BarChartOutlined />;
      case 'analysis': return <TeamOutlined />;
      case 'optimization': return <SyncOutlined />;
      default: return <TeamOutlined />;
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setIsEditModalVisible(true);
  };

  const handleCreateAgent = () => {
    setIsCreateModalVisible(true);
  };

  const handleDeleteAgent = (agentId: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this agent?',
      content: 'This action cannot be undone.',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        // Handle delete logic here
        console.log('Deleting agent:', agentId);
      },
    });
  };

  const handleToggleStatus = (agent: Agent) => {
    // Handle status toggle logic here
    console.log('Toggling status for agent:', agent.id);
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
      {/* Header */}
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
              Agent Workflows
            </Title>
            <Text 
              style={{ 
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}
            >
              Manage and monitor your automated agents and workflows
            </Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateAgent}
            style={{
              backgroundColor: theme === 'dark' ? '#6d28d9' : '#6d28d9',
              borderColor: theme === 'dark' ? '#7c3aed' : '#6d28d9'
            }}
          >
            New Agent
          </Button>
        </div>

        {/* Stats Overview */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle}>
              <Statistic
                title="Total Agents"
                value={agentsData.length}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle}>
              <Statistic
                title="Active"
                value={agentsData.filter(a => a.status === 'active').length}
                valueStyle={{ color: '#52c41a' }}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle}>
              <Statistic
                title="Completed"
                value={agentsData.filter(a => a.status === 'completed').length}
                valueStyle={{ color: '#1890ff' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle}>
              <Statistic
                title="Avg. Success Rate"
                value={Math.round(agentsData.reduce((sum, a) => sum + a.successRate, 0) / agentsData.length)}
                suffix="%"
                valueStyle={{ color: '#faad14' }}
                prefix={<BarChartOutlined />}
              />
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
            flexDirection: screens.xs ? 'column' : 'row'
          }}>
            <Input
              placeholder="Search agents..."
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
                width: screens.xs ? '100%' : 150,
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                borderColor: theme === 'dark' ? '#374151' : '#d1d5db'
              }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="paused">Paused</Option>
              <Option value="completed">Completed</Option>
              <Option value="error">Error</Option>
            </Select>
            <Select
              placeholder="Filter by type"
              value={selectedType}
              onChange={setSelectedType}
              suffixIcon={<FilterOutlined style={{ color: theme === 'dark' ? '#9ca3af' : '#d1d5db' }} />}
              style={{ 
                width: screens.xs ? '100%' : 150,
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                borderColor: theme === 'dark' ? '#374151' : '#d1d5db'
              }}
            >
              <Option value="all">All Types</Option>
              <Option value="automation">Automation</Option>
              <Option value="research">Research</Option>
              <Option value="analysis">Analysis</Option>
              <Option value="optimization">Optimization</Option>
            </Select>
          </div>
        </Card>
      </div>

      {/* Agents List */}
      <Card
        style={cardStyle}
        title={`Agents (${filteredAgents.length})`}
      >
        {filteredAgents.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={filteredAgents}
            renderItem={(agent) => (
              <List.Item
                style={{
                  padding: '20px 0',
                  borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0'
                }}
                actions={[
                  <Button 
                    key="toggle" 
                    type="text" 
                    icon={agent.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
                    onClick={() => handleToggleStatus(agent)}
                    style={{ color: theme === 'dark' ? '#a78bfa' : '#6d28d9' }}
                  >
                    {agent.status === 'active' ? 'Pause' : 'Start'}
                  </Button>,
                  <Button 
                    key="edit" 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => handleEditAgent(agent)}
                    style={{ color: theme === 'dark' ? '#a78bfa' : '#6d28d9' }}
                  >
                    Edit
                  </Button>,
                  <Button 
                    key="delete" 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDeleteAgent(agent.id)}
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
                      icon={getTypeIcon(agent.type)}
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
                        {agent.name}
                      </Text>
                      <Tag color={getStatusColor(agent.status)}>
                        {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                      </Tag>
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                        {agent.description}
                      </Text>
                      <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666', fontSize: 14 }}>
                        Client: {agent.assignedClient}
                      </Text>
                    </Space>
                  }
                />
                
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                      Progress: {agent.tasksCompleted}/{agent.totalTasks} tasks
                    </Text>
                    <Text style={{ fontSize: 14, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                      {agent.progress}%
                    </Text>
                  </div>
                  <Progress 
                    percent={agent.progress} 
                    status={agent.status === 'completed' ? 'success' : agent.status === 'error' ? 'exception' : 'active'}
                    strokeColor={
                      agent.status === 'completed' ? '#52c41a' : 
                      agent.status === 'error' ? '#ff4d4f' : 
                      theme === 'dark' ? '#a78bfa' : '#6d28d9'
                    }
                  />
                </div>
                
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col xs={12} sm={6}>
                    <div>
                      <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Success Rate</Text>
                      <div style={{ fontSize: 16, fontWeight: 600, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                        {agent.successRate}%
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div>
                      <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Avg. Runtime</Text>
                      <div style={{ fontSize: 16, fontWeight: 600, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                        {agent.avgRunTime}
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div>
                      <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Last Run</Text>
                      <div style={{ fontSize: 14, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                        {agent.lastRun.toLocaleDateString()} {agent.lastRun.toLocaleTimeString()}
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div>
                      <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#666666' }}>Next Run</Text>
                      <div style={{ fontSize: 14, color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                        {agent.nextRun.toLocaleDateString()} {agent.nextRun.toLocaleTimeString()}
                      </div>
                    </div>
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
                No agents found
              </Text>
            }
          >
            <Text style={{ 
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              marginBottom: 16
            }}>
              {searchTerm || selectedStatus !== 'all' || selectedType !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first agent.'}
            </Text>
            {!searchTerm && selectedStatus === 'all' && selectedType === 'all' && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateAgent}
              >
                Create New Agent
              </Button>
            )}
          </Empty>
        )}
      </Card>

      {/* Create Agent Modal */}
      <Modal
        title="Create New Agent"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <AgentForm onCancel={() => setIsCreateModalVisible(false)} />
      </Modal>

      {/* Edit Agent Modal */}
      <Modal
        title="Edit Agent"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <AgentForm 
          agent={editingAgent} 
          onCancel={() => setIsEditModalVisible(false)} 
        />
      </Modal>
    </div>
  );
};

// Agent Form Component
const AgentForm = ({ agent, onCancel }: { agent?: Agent | null, onCancel: () => void }) => {
  const [form] = Form.useForm();
  const { theme } = useTheme();

  const onFinish = (values: any) => {
    console.log('Form values:', values);
    // Handle form submission here
    onCancel();
  };

  React.useEffect(() => {
    if (agent) {
      form.setFieldsValue({
        name: agent.name,
        type: agent.type,
        description: agent.description,
        assignedClient: agent.assignedClient,
        successRate: agent.successRate,
        avgRunTime: agent.avgRunTime,
      });
    }
  }, [agent, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        type: 'automation',
        status: 'active'
      }}
    >
      <Form.Item
        name="name"
        label="Agent Name"
        rules={[{ required: true, message: 'Please enter agent name' }]}
      >
        <Input placeholder="Enter agent name" />
      </Form.Item>

      <Form.Item
        name="type"
        label="Agent Type"
        rules={[{ required: true, message: 'Please select agent type' }]}
      >
        <Select>
          <Option value="automation">Automation</Option>
          <Option value="research">Research</Option>
          <Option value="analysis">Analysis</Option>
          <Option value="optimization">Optimization</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea rows={3} placeholder="Describe what this agent does" />
      </Form.Item>

      <Form.Item
        name="assignedClient"
        label="Assigned Client"
      >
        <Input placeholder="Enter client name" />
      </Form.Item>

      <Form.Item
        name="successRate"
        label="Success Rate (%)"
      >
        <InputNumber min={0} max={100} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="avgRunTime"
        label="Average Run Time"
      >
        <Input placeholder="e.g., 45 min, 2h 15min" />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        valuePropName="checked"
      >
        <Switch 
          checkedChildren="Active" 
          unCheckedChildren="Paused" 
          defaultChecked 
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            {agent ? 'Update Agent' : 'Create Agent'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default AgentWorkflowPage;