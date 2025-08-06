// app/tools/page.tsx
"use client";

import React, { useState } from 'react';
import { useList } from '@refinedev/core';
import { 
  SearchOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  NotificationOutlined,
  CopyOutlined,
  ToolOutlined,
  CloseOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Input, 
  Select, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  Divider, 
  Empty, 
  Modal, 
  Form, 
  Checkbox,
  Upload,
  Spin
} from 'antd';
import { useTheme } from '../../providers/ThemeProvider';

import { toolCategories } from './toolsdata/tools'
import { Tool } from './toolsdata/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;



const ToolsPage = () => {
  const { theme } = useTheme();
  const { data: clientsData } = useList({ resource: 'clients' });
  const clients = clientsData?.data || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClient, setSelectedClient] = useState<string>();
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');

  

  const filteredCategories = selectedCategory === 'all' 
    ? toolCategories 
    : toolCategories.filter(cat => cat.id === selectedCategory);

  const handleToolRun = (tool: Tool) => {
    setActiveTool(tool);
    setIsModalVisible(true);
  };

  const handleRunTool = async (values: any) => {
    setIsRunning(true);
    // Simulate API call
    setTimeout(() => {
      setOutput(`Generated output for ${activeTool?.name}:\n\nClient: ${selectedClient || 'None'}\n\nInputs:\n${JSON.stringify(values, null, 2)}`);
      setIsRunning(false);
    }, 2000);
  };

  const getCategoryColor = (color: string) => {
    return theme === 'dark' ? 
      {
        bg: `bg-${color}-900`,
        text: `text-${color}-300`,
        border: `border-${color}-700`
      } : {
        bg: `bg-${color}-100`,
        text: `text-${color}-600`,
        border: `border-${color}-300`
      };
  };

  return (
    <div style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: 24,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title 
          level={3} 
          style={{ 
            margin: 0,
            color: theme === 'dark' ? '#f9fafb' : '#1a1a1a'
          }}
        >
          Tools & Playbook
        </Title>
        <Text 
          style={{ 
            color: theme === 'dark' ? '#9ca3af' : '#666666'
          }}
        >
          Generate high-leverage content and strategic deliverables
        </Text>
      </div>

      {/* Client Selector */}
      <Card
        style={{ 
          marginBottom: 24,
          backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
          borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong style={{ color: theme === 'dark' ? '#e5e7eb' : '#333' }}>
              Selected Client
            </Text>
            <div style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
              {selectedClient ? clients.find(c => c.id === selectedClient)?.name : 'No client selected'}
            </div>
          </div>
          <Select
            placeholder="Select a client..."
            style={{ width: 250 }}
            value={selectedClient}
            onChange={setSelectedClient}
          >
            {clients.map(client => (
              <Option key={client.id} value={client.id}>{client.name}</Option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Search and Filter */}
      <Card
        style={{ 
          marginBottom: 24,
          backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
          borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
        }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <Input
            placeholder="Search tools..."
            prefix={<SearchOutlined />}
            style={{ flex: 1 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            placeholder="Filter by category"
            style={{ width: 200 }}
            value={selectedCategory}
            onChange={setSelectedCategory}
          >
            <Option value="all">All Categories</Option>
            {toolCategories.map(category => (
              <Option key={category.id} value={category.id}>{category.name}</Option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Tools List */}
      {filteredCategories.map(category => (
        <Card
          key={category.id}
          title={
            <Space>
              <div style={{ 
                padding: 8, 
                borderRadius: 6,
                backgroundColor: theme === 'dark' ? 
                  (category.color === 'blue' ? '#1e3a8a' : 
                   category.color === 'green' ? '#14532d' : 
                   '#581c87') : 
                  (category.color === 'blue' ? '#dbeafe' : 
                   category.color === 'green' ? '#dcfce7' : 
                   '#f3e8ff'),
                color: theme === 'dark' ? 
                  (category.color === 'blue' ? '#93c5fd' : 
                   category.color === 'green' ? '#86efac' : 
                   '#c4b5fd') : 
                  (category.color === 'blue' ? '#1d4ed8' : 
                   category.color === 'green' ? '#15803d' : 
                   '#7e22ce')
              }}>
                {category.icon}
              </div>
              <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
                {category.name}
              </Text>
            </Space>
          }
          style={{ 
            marginBottom: 24,
            backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
            borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
          }}
        >
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16
          }}>
            {category.tools
              .filter(tool => 
                tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.description.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(tool => (
                <Card
                  key={tool.id}
                  hoverable
                  style={{ 
                    backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
                    borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Text strong style={{ 
                      color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                      marginBottom: 8
                    }}>
                      {tool.name}
                    </Text>
                    <Text style={{ 
                      color: theme === 'dark' ? '#9ca3af' : '#666666',
                      marginBottom: 16
                    }}>
                      {tool.description}
                    </Text>
                    
                    <div style={{ marginTop: 'auto' }}>
                      <Divider style={{ 
                        borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
                        margin: '12px 0'
                      }} />
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Tag color={category.color}>{category.name}</Tag>
                        <Button 
                          type="primary" 
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleToolRun(tool)}
                        >
                          Run Tool
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </Card>
      ))}

      {/* Tool Modal */}
      <Modal
        title={
          <Space>
           <ToolOutlined style={{ 
  color: activeTool 
    ? filteredCategories.find(cat => cat.tools.some(t => t.id === activeTool.id))?.color === 'blue' 
      ? '#3b82f6' 
      : filteredCategories.find(cat => cat.tools.some(t => t.id === activeTool.id))?.color === 'green' 
        ? '#10b981' 
        : '#8b5cf6' 
    : '#9ca3af'
}} />

            <Text strong>{activeTool?.name || 'Tool'}</Text>
          </Space>
        }
        width={1000}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setOutput('');
        }}
        footer={null}
        closeIcon={<CloseOutlined />}
        styles={{
          body: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            padding: 24
          },
          header: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0'
          }
        }}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Input Panel */}
          <div style={{ flex: 1 }}>
            <Form
              layout="vertical"
              onFinish={handleRunTool}
              initialValues={{}}
            >
              <Card
                title="Inputs"
                style={{ 
                  marginBottom: 24,
                  backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                  borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
                }}
              >
                <Form.Item
                  label="Selected Client"
                  name="client"
                  initialValue={selectedClient}
                >
                  <Select
                    placeholder="Select a client..."
                    value={selectedClient}
                    onChange={setSelectedClient}
                  >
                    {clients.map(client => (
                      <Option key={client.id} value={client.id}>{client.name}</Option>
                    ))}
                  </Select>
                </Form.Item>

                {activeTool?.inputs.map(input => (
                  <Form.Item
                    key={input.name}
                    label={input.label}
                    name={input.name}
                    rules={[{ required: input.required, message: 'This field is required' }]}
                  >
                    {input.type === 'textarea' ? (
                      <TextArea rows={3} />
                    ) : input.type === 'select' ? (
                      <Select>
                        {input.options?.map(option => (
                          <Option key={option} value={option}>{option}</Option>
                        ))}
                      </Select>
                    ) : input.type === 'checkbox' ? (
                      <Checkbox.Group>
                        {input.options?.map(option => (
                          <Checkbox key={option} value={option}>{option}</Checkbox>
                        ))}
                      </Checkbox.Group>
                    ) : input.type === 'file' ? (
                      <Upload>
                        <Button icon={<CopyOutlined />}>Upload File</Button>
                      </Upload>
                    ) : (
                      <Input type={input.type} />
                    )}
                  </Form.Item>
                ))}

                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={isRunning}
                  icon={!isRunning ? <PlayCircleOutlined /> : undefined}
                  style={{ width: '100%' }}
                >
                  {isRunning ? 'Running...' : 'Run Tool'}
                </Button>
              </Card>
            </Form>
          </div>

          {/* Output Panel */}
          <div style={{ flex: 1 }}>
            <Card
              title="Output"
              style={{ 
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
                height: '100%'
              }}
            >
              {isRunning ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: 200
                }}>
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                </div>
              ) : output ? (
                <>
                  <div style={{ 
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                    padding: 16,
                    borderRadius: 6,
                    marginBottom: 16,
                    minHeight: 200
                  }}>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap',
                      color: theme === 'dark' ? '#e5e7eb' : '#333',
                      margin: 0
                    }}>
                      {output}
                    </pre>
                  </div>
                  <Space>
                    <Button icon={<CopyOutlined />}>Copy</Button>
                    <Button icon={<CopyOutlined />}>Export</Button>
                    <Button type="primary">Save to Client</Button>
                  </Space>
                </>
              ) : (
                <Empty
                  description="Run the tool to see output here"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ 
                    color: theme === 'dark' ? '#9ca3af' : '#666666',
                    marginTop: 40
                  }}
                />
              )}
            </Card>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ToolsPage;