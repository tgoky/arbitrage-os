// app/components/ToolsPanel.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Drawer,
  Input,
  Collapse,
  Card,
  Space,
  Badge,
  Typography,
  Tag,
  Button,
  Tooltip,
  Empty,
  Spin,
  Divider,
  Modal,
  Form,
  Select,
  message
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  ApiOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  CodeOutlined,
  MailOutlined,
  MessageOutlined,
  CalendarOutlined,
  TeamOutlined,
  ToolOutlined,
  SettingOutlined,
  StarOutlined,
  StarFilled,
  RobotOutlined,
  CloudOutlined,
  ShoppingOutlined,
  LineChartOutlined,
  BulbOutlined
} from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  parameters?: ToolParameter[];
  authentication?: 'none' | 'api_key' | 'oauth';
  isPremium?: boolean;
  isCustom?: boolean;
  isPopular?: boolean;
  provider?: string;
  documentation?: string;
}

interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

interface ToolsPanelProps {
  workspaceId: string;
  onSelectTool: (tool: Tool) => void;
  selectedTools?: string[];
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  workspaceId,
  onSelectTool,
  selectedTools = []
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showCustomToolModal, setShowCustomToolModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'AI & Machine Learning',
    'Search & Research',
    'Communication'
  ]);

  const [customToolForm] = Form.useForm();

  // ==================== TOOL CATEGORIES ====================

  const categories = [
    {
      key: 'ai_ml',
      label: 'AI & Machine Learning',
      icon: <RobotOutlined style={{ color: '#722ed1' }} />,
      description: 'AI models, LLMs, computer vision, NLP'
    },
    {
      key: 'database',
      label: 'Database & Data',
      icon: <DatabaseOutlined style={{ color: '#1890ff' }} />,
      description: 'SQL, NoSQL, data querying and manipulation'
    },
    {
      key: 'file',
      label: 'File & Document',
      icon: <FileTextOutlined style={{ color: '#fa8c16' }} />,
      description: 'Read, write, process files and documents'
    },
    {
      key: 'integration',
      label: 'Integrations',
      icon: <ApiOutlined style={{ color: '#52c41a' }} />,
      description: 'Third-party APIs and services'
    },
    {
      key: 'search',
      label: 'Search & Research',
      icon: <SearchOutlined style={{ color: '#13c2c2' }} />,
      description: 'Web search, research, information retrieval'
    },
    {
      key: 'web_scraping',
      label: 'Web Scraping & Browsing',
      icon: <GlobalOutlined style={{ color: '#eb2f96' }} />,
      description: 'Scrape websites, browser automation'
    },
    {
      key: 'communication',
      label: 'Communication',
      icon: <MessageOutlined style={{ color: '#2f54eb' }} />,
      description: 'Email, Slack, SMS, notifications'
    },
    {
      key: 'calendar',
      label: 'Calendar & Scheduling',
      icon: <CalendarOutlined style={{ color: '#faad14' }} />,
      description: 'Calendar management, scheduling'
    },
    {
      key: 'crm',
      label: 'CRM & Sales',
      icon: <TeamOutlined style={{ color: '#f5222d' }} />,
      description: 'Customer relationship management'
    },
    {
      key: 'analytics',
      label: 'Analytics & Reporting',
      icon: <LineChartOutlined style={{ color: '#1890ff' }} />,
      description: 'Data analysis and visualization'
    },
    {
      key: 'ecommerce',
      label: 'E-commerce',
      icon: <ShoppingOutlined style={{ color: '#fa541c' }} />,
      description: 'Online store integrations'
    },
    {
      key: 'automation',
      label: 'Automation & Workflows',
      icon: <ThunderboltOutlined style={{ color: '#5CC49D' }} />,
      description: 'Workflow automation tools'
    },
    {
      key: 'custom',
      label: 'Custom Tools',
      icon: <CodeOutlined style={{ color: '#8c8c8c' }} />,
      description: 'User-defined custom tools'
    },
    {
      key: 'uncategorized',
      label: 'Uncategorized',
      icon: <ToolOutlined style={{ color: '#d9d9d9' }} />,
      description: 'Other tools'
    }
  ];

  // ==================== BUILT-IN TOOLS ====================

  const builtInTools: Tool[] = [
    // AI & Machine Learning
    {
      id: 'openai_completion',
      name: 'OpenAI Completion',
      description: 'Generate text using GPT models',
      category: 'ai_ml',
      icon: '🤖',
      authentication: 'api_key',
      isPremium: true,
      isPopular: true,
      provider: 'OpenAI',
      parameters: [
        { name: 'prompt', type: 'string', description: 'Input prompt', required: true },
        { name: 'model', type: 'string', description: 'Model name', required: false, default: 'gpt-4' },
        { name: 'temperature', type: 'number', description: 'Randomness', required: false, default: 0.7 }
      ]
    },
    {
      id: 'anthropic_claude',
      name: 'Anthropic Claude',
      description: 'Use Claude AI for text generation',
      category: 'ai_ml',
      icon: '🧠',
      authentication: 'api_key',
      isPremium: true,
      isPopular: true,
      provider: 'Anthropic'
    },
    {
      id: 'image_generation',
      name: 'Image Generation',
      description: 'Generate images with DALL-E or Stable Diffusion',
      category: 'ai_ml',
      icon: '🎨',
      authentication: 'api_key',
      isPremium: true,
      provider: 'OpenAI'
    },
    {
      id: 'text_to_speech',
      name: 'Text to Speech',
      description: 'Convert text to natural speech',
      category: 'ai_ml',
      icon: '🔊',
      authentication: 'api_key'
    },
    {
      id: 'sentiment_analysis',
      name: 'Sentiment Analysis',
      description: 'Analyze text sentiment and emotions',
      category: 'ai_ml',
      icon: '😊',
      authentication: 'none'
    },

    // Database & Data
    {
      id: 'database_query',
      name: 'Database Query',
      description: 'Query workspace database (Postgres/Prisma)',
      category: 'database',
      icon: '🗄️',
      authentication: 'none',
      isPopular: true,
      parameters: [
        { name: 'model', type: 'string', description: 'Database model', required: true },
        { name: 'operation', type: 'string', description: 'findMany, findUnique, create, update', required: true }
      ]
    },
    {
      id: 'sql_execute',
      name: 'Execute SQL',
      description: 'Run raw SQL queries',
      category: 'database',
      icon: '📊',
      authentication: 'none'
    },
    {
      id: 'csv_parse',
      name: 'CSV Parser',
      description: 'Parse and manipulate CSV data',
      category: 'database',
      icon: '📋',
      authentication: 'none'
    },
    {
      id: 'json_transform',
      name: 'JSON Transform',
      description: 'Transform and manipulate JSON data',
      category: 'database',
      icon: '🔄',
      authentication: 'none'
    },

    // File & Document
    {
      id: 'read_file',
      name: 'Read File',
      description: 'Read file contents from storage',
      category: 'file',
      icon: '📖',
      authentication: 'none',
      isPopular: true
    },
    {
      id: 'write_file',
      name: 'Write File',
      description: 'Write content to file',
      category: 'file',
      icon: '✍️',
      authentication: 'none',
      isPopular: true
    },
    {
      id: 'pdf_extract',
      name: 'PDF Text Extract',
      description: 'Extract text from PDF files',
      category: 'file',
      icon: '📄',
      authentication: 'none'
    },
    {
      id: 'docx_create',
      name: 'Create Word Document',
      description: 'Generate Word documents',
      category: 'file',
      icon: '📝',
      authentication: 'none'
    },
    {
      id: 'excel_create',
      name: 'Create Excel',
      description: 'Generate Excel spreadsheets',
      category: 'file',
      icon: '📊',
      authentication: 'none'
    },

    // Search & Research
    {
      id: 'web_search',
      name: 'Web Search',
      description: 'Search the web for information',
      category: 'search',
      icon: '🔍',
      authentication: 'api_key',
      isPopular: true,
      isPremium: true,
      provider: 'Google/Bing'
    },
    {
      id: 'arxiv_search',
      name: 'arXiv Search',
      description: 'Search academic papers on arXiv',
      category: 'search',
      icon: '🎓',
      authentication: 'none'
    },
    {
      id: 'wikipedia_search',
      name: 'Wikipedia Search',
      description: 'Search Wikipedia articles',
      category: 'search',
      icon: '📚',
      authentication: 'none'
    },
    {
      id: 'news_search',
      name: 'News Search',
      description: 'Search latest news articles',
      category: 'search',
      icon: '📰',
      authentication: 'api_key',
      provider: 'NewsAPI'
    },

    // Web Scraping
    {
      id: 'web_scrape',
      name: 'Web Scraper',
      description: 'Scrape content from any website',
      category: 'web_scraping',
      icon: '🕷️',
      authentication: 'none',
      isPopular: true
    },
    {
      id: 'browser_automation',
      name: 'Browser Automation',
      description: 'Automate browser actions with Puppeteer',
      category: 'web_scraping',
      icon: '🌐',
      authentication: 'none'
    },
    {
      id: 'screenshot',
      name: 'Website Screenshot',
      description: 'Capture website screenshots',
      category: 'web_scraping',
      icon: '📸',
      authentication: 'none'
    },

    // Communication
    {
      id: 'send_email',
      name: 'Send Email',
      description: 'Send emails via workspace email accounts',
      category: 'communication',
      icon: '📧',
      authentication: 'oauth',
      isPopular: true,
      provider: 'Gmail/Outlook'
    },
    {
      id: 'slack_message',
      name: 'Send Slack Message',
      description: 'Send messages to Slack channels',
      category: 'communication',
      icon: '💬',
      authentication: 'oauth',
      isPopular: true,
      provider: 'Slack'
    },
    {
      id: 'send_sms',
      name: 'Send SMS',
      description: 'Send SMS via Twilio',
      category: 'communication',
      icon: '📱',
      authentication: 'api_key',
      isPremium: true,
      provider: 'Twilio'
    },
    {
      id: 'discord_webhook',
      name: 'Discord Webhook',
      description: 'Send messages to Discord',
      category: 'communication',
      icon: '🎮',
      authentication: 'api_key',
      provider: 'Discord'
    },
    {
      id: 'telegram_bot',
      name: 'Telegram Bot',
      description: 'Send messages via Telegram bot',
      category: 'communication',
      icon: '✈️',
      authentication: 'api_key',
      provider: 'Telegram'
    },

    // Integrations
    {
      id: 'google_sheets',
      name: 'Google Sheets',
      description: 'Read/write Google Sheets',
      category: 'integration',
      icon: '📊',
      authentication: 'oauth',
      isPopular: true,
      provider: 'Google'
    },
    {
      id: 'airtable',
      name: 'Airtable',
      description: 'Interact with Airtable bases',
      category: 'integration',
      icon: '🗂️',
      authentication: 'api_key',
      provider: 'Airtable'
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Read/write Notion pages',
      category: 'integration',
      icon: '📝',
      authentication: 'oauth',
      isPopular: true,
      provider: 'Notion'
    },
    {
      id: 'github',
      name: 'GitHub API',
      description: 'Interact with GitHub repositories',
      category: 'integration',
      icon: '🐙',
      authentication: 'oauth',
      provider: 'GitHub'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing with Stripe',
      category: 'integration',
      icon: '💳',
      authentication: 'api_key',
      isPremium: true,
      provider: 'Stripe'
    },

    // Calendar
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      description: 'Manage Google Calendar events',
      category: 'calendar',
      icon: '📅',
      authentication: 'oauth',
      isPopular: true,
      provider: 'Google'
    },
    {
      id: 'calendly',
      name: 'Calendly',
      description: 'Schedule meetings with Calendly',
      category: 'calendar',
      icon: '🗓️',
      authentication: 'api_key',
      provider: 'Calendly'
    },

    // CRM
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      description: 'Manage HubSpot contacts and deals',
      category: 'crm',
      icon: '🎯',
      authentication: 'api_key',
      isPopular: true,
      provider: 'HubSpot'
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Interact with Salesforce CRM',
      category: 'crm',
      icon: '☁️',
      authentication: 'oauth',
      isPremium: true,
      provider: 'Salesforce'
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      description: 'Manage Pipedrive deals',
      category: 'crm',
      icon: '📈',
      authentication: 'api_key',
      provider: 'Pipedrive'
    },

    // Analytics
    {
      id: 'google_analytics',
      name: 'Google Analytics',
      description: 'Get website analytics data',
      category: 'analytics',
      icon: '📊',
      authentication: 'oauth',
      provider: 'Google'
    },
    {
      id: 'mixpanel',
      name: 'Mixpanel',
      description: 'Track user analytics',
      category: 'analytics',
      icon: '📈',
      authentication: 'api_key',
      provider: 'Mixpanel'
    },

    // E-commerce
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Manage Shopify store',
      category: 'ecommerce',
      icon: '🛒',
      authentication: 'api_key',
      isPopular: true,
      provider: 'Shopify'
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      description: 'Manage WooCommerce products',
      category: 'ecommerce',
      icon: '🛍️',
      authentication: 'api_key',
      provider: 'WooCommerce'
    },

    // Automation
    {
      id: 'http_request',
      name: 'HTTP Request',
      description: 'Make HTTP requests to any API',
      category: 'automation',
      icon: '🌐',
      authentication: 'none',
      isPopular: true
    },
    {
      id: 'webhook_trigger',
      name: 'Webhook',
      description: 'Trigger workflows via webhook',
      category: 'automation',
      icon: '🔗',
      authentication: 'none'
    },
    {
      id: 'delay',
      name: 'Delay/Wait',
      description: 'Add delays to workflow',
      category: 'automation',
      icon: '⏱️',
      authentication: 'none'
    },
    {
      id: 'conditional',
      name: 'Conditional Logic',
      description: 'If/else conditional branching',
      category: 'automation',
      icon: '🔀',
      authentication: 'none'
    }
  ];

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    loadTools();
    loadFavorites();
  }, []);

  useEffect(() => {
    filterTools();
  }, [tools, searchQuery]);

  const loadTools = async () => {
    try {
      setIsLoading(true);

      // Load built-in tools
      let allTools = [...builtInTools];

      // Load custom tools from database
      const res = await fetch(`/api/agent-tools/custom?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.tools) {
          allTools = [...allTools, ...data.tools];
        }
      }

      setTools(allTools);
      setFilteredTools(allTools);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await fetch(`/api/agent-tools/favorites?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFavorites(new Set(data.favoriteIds));
        }
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  // ==================== FILTERING ====================

  const filterTools = () => {
    if (!searchQuery.trim()) {
      setFilteredTools(tools);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tools.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query) ||
      tool.provider?.toLowerCase().includes(query)
    );

    setFilteredTools(filtered);
  };

  // ==================== ACTIONS ====================

  const handleToggleFavorite = async (toolId: string) => {
    try {
      const isFavorite = favorites.has(toolId);

      const res = await fetch('/api/agent-tools/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, toolId })
      });

      if (res.ok) {
        const newFavorites = new Set(favorites);
        if (isFavorite) {
          newFavorites.delete(toolId);
        } else {
          newFavorites.add(toolId);
        }
        setFavorites(newFavorites);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleCreateCustomTool = async () => {
    try {
      const values = await customToolForm.validateFields();

      const res = await fetch('/api/agent-tools/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          ...values,
          category: 'custom',
          isCustom: true
        })
      });

      if (res.ok) {
        message.success('Custom tool created!');
        setShowCustomToolModal(false);
        customToolForm.resetFields();
        loadTools();
      }
    } catch (error) {
      console.error('Failed to create custom tool:', error);
      message.error('Failed to create tool');
    }
  };

  // ==================== RENDER HELPERS ====================

  const getToolsByCategory = (categoryKey: string): Tool[] => {
    return filteredTools.filter(tool => tool.category === categoryKey);
  };

  const renderToolCard = (tool: Tool) => {
    const isSelected = selectedTools.includes(tool.id);
    const isFavorite = favorites.has(tool.id);

    return (
      <Card
        key={tool.id}
        size="small"
        hoverable
        onClick={() => onSelectTool(tool)}
        style={{
          marginBottom: '8px',
          cursor: 'pointer',
          border: isSelected ? '2px solid #5CC49D' : undefined,
          backgroundColor: isSelected ? '#f6ffed' : undefined
        }}
      >
        <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
          {/* Icon */}
          <div style={{ fontSize: '20px', flexShrink: 0 }}>
            {tool.icon || '🔧'}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Text strong style={{ fontSize: '13px' }}>
                {tool.name}
              </Text>

              {tool.isPremium && (
                <Tag color="gold" style={{ fontSize: '10px', padding: '0 4px' }}>
                  Premium
                </Tag>
              )}

              {tool.isPopular && (
                <Tooltip title="Popular">
                  <StarFilled style={{ fontSize: '10px', color: '#faad14' }} />
                </Tooltip>
              )}
            </div>

            <Paragraph
              ellipsis={{ rows: 2 }}
              style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}
            >
              {tool.description}
            </Paragraph>

            {tool.provider && (
              <Text type="secondary" style={{ fontSize: '10px' }}>
                by {tool.provider}
              </Text>
            )}
          </div>

          {/* Actions */}
          <div style={{ flexShrink: 0 }}>
            <Button
              type="text"
              size="small"
              icon={isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(tool.id);
              }}
            />
          </div>
        </div>
      </Card>
    );
  };

  // ==================== RENDER ====================

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: '12px' }}>
          <Title level={5} style={{ margin: 0 }}>
            <ToolOutlined /> Tools
          </Title>

          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setShowCustomToolModal(true)}
            style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
          >
            Custom
          </Button>
        </Space>

        {/* Search */}
        <Input
          placeholder="Search tools..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />

        <div style={{ marginTop: '8px' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {filteredTools.length} tools available
          </Text>
        </div>
      </div>

      {/* Tools List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : filteredTools.length === 0 ? (
          <Empty
            description="No tools found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Collapse
            activeKey={expandedCategories}
            onChange={(keys) => setExpandedCategories(keys as string[])}
            bordered={false}
            expandIconPosition="end"
          >
            {categories.map(category => {
              const categoryTools = getToolsByCategory(category.key);

              if (categoryTools.length === 0) return null;

              return (
                <Panel
                  key={category.label}
                  header={
                    <Space>
                      {category.icon}
                      <Text strong style={{ fontSize: '13px' }}>
                        {category.label}
                      </Text>
                      <Badge
                        count={categoryTools.length}
                        style={{ backgroundColor: '#5CC49D' }}
                      />
                    </Space>
                  }
                  extra={
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {category.description}
                    </Text>
                  }
                >
                  {categoryTools.map(renderToolCard)}
                </Panel>
              );
            })}
          </Collapse>
        )}
      </div>

      {/* Custom Tool Modal */}
      <Modal
        title="Create Custom Tool"
        open={showCustomToolModal}
        onCancel={() => setShowCustomToolModal(false)}
        onOk={handleCreateCustomTool}
        width={600}
      >
        <Form form={customToolForm} layout="vertical">
          <Form.Item
            name="name"
            label="Tool Name"
            rules={[{ required: true, message: 'Please enter tool name' }]}
          >
            <Input placeholder="e.g., Custom API Integration" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="What does this tool do?"
            />
          </Form.Item>

          <Form.Item
            name="icon"
            label="Icon (Emoji)"
          >
            <Input placeholder="e.g., 🔧" maxLength={2} />
          </Form.Item>

          <Form.Item
            name="authentication"
            label="Authentication"
            initialValue="none"
          >
            <Select
              options={[
                { label: 'None', value: 'none' },
                { label: 'API Key', value: 'api_key' },
                { label: 'OAuth', value: 'oauth' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="endpoint"
            label="API Endpoint (Optional)"
          >
            <Input placeholder="https://api.example.com/endpoint" />
          </Form.Item>

          <Form.Item
            name="provider"
            label="Provider (Optional)"
          >
            <Input placeholder="e.g., My Custom Service" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};