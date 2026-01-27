// app/components/ToolsPanel.tsx
"use client";

import { useState, useEffect } from 'react';
import {
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
  Modal,
  Form,
  Select,
  message,
  ConfigProvider,
  theme as antTheme
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ApiOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  CodeOutlined,
  MessageOutlined,
  CalendarOutlined,
  TeamOutlined,
  ToolOutlined,
  StarOutlined,
  StarFilled,
  RobotOutlined,
  ShoppingOutlined,
  LineChartOutlined,
  FileSearchOutlined,
  LinkOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  ChromeOutlined,
  CameraOutlined,
  MailOutlined,
  SlackOutlined,
  MobileOutlined,
  GithubOutlined,
  CreditCardOutlined,
  CloudServerOutlined,
  PartitionOutlined,
  RightOutlined
} from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_CARD = '#09090b';
const BORDER_COLOR = '#27272a';
const TEXT_SECONDARY = '#a1a1aa';
const TEXT_PRIMARY = '#ffffff';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: React.ReactNode; // Changed to ReactNode for real icons
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
    'ai_ml',
    'search',
    'communication'
  ]);

  const [customToolForm] = Form.useForm();

  // --- FONT INJECTION ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // ==================== TOOL CATEGORIES ====================

  const categories = [
    {
      key: 'ai_ml',
      label: 'AI & Machine Learning',
      icon: <RobotOutlined style={{ color: '#8b5cf6' }} />, // Violet
      description: 'AI models, LLMs, computer vision'
    },
    {
      key: 'database',
      label: 'Database & Data',
      icon: <DatabaseOutlined style={{ color: '#3b82f6' }} />, // Blue
      description: 'SQL, NoSQL, data manipulation'
    },
    {
      key: 'file',
      label: 'File & Document',
      icon: <FileTextOutlined style={{ color: '#f59e0b' }} />, // Amber
      description: 'Process files and documents'
    },
    {
      key: 'integration',
      label: 'Integrations',
      icon: <ApiOutlined style={{ color: '#10b981' }} />, // Emerald
      description: 'Third-party APIs and services'
    },
    {
      key: 'search',
      label: 'Search & Research',
      icon: <FileSearchOutlined style={{ color: '#06b6d4' }} />, // Cyan
      description: 'Web search, information retrieval'
    },
    {
      key: 'web_scraping',
      label: 'Web Scraping',
      icon: <GlobalOutlined style={{ color: '#ec4899' }} />, // Pink
      description: 'Scrape websites, browser automation'
    },
    {
      key: 'communication',
      label: 'Communication',
      icon: <MessageOutlined style={{ color: '#6366f1' }} />, // Indigo
      description: 'Email, Slack, SMS, notifications'
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: <CalendarOutlined style={{ color: '#eab308' }} />, // Yellow
      description: 'Scheduling and events'
    },
    {
      key: 'crm',
      label: 'CRM & Sales',
      icon: <TeamOutlined style={{ color: '#ef4444' }} />, // Red
      description: 'Customer relationship management'
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: <LineChartOutlined style={{ color: '#0ea5e9' }} />, // Sky
      description: 'Data analysis and visualization'
    },
    {
      key: 'ecommerce',
      label: 'E-commerce',
      icon: <ShoppingOutlined style={{ color: '#f97316' }} />, // Orange
      description: 'Online store integrations'
    },
    {
      key: 'automation',
      label: 'Automation',
      icon: <ThunderboltOutlined style={{ color: BRAND_GREEN }} />,
      description: 'Workflow automation tools'
    },
    {
      key: 'custom',
      label: 'Custom Tools',
      icon: <CodeOutlined style={{ color: '#a1a1aa' }} />, // Zinc
      description: 'User-defined custom tools'
    },
    {
      key: 'uncategorized',
      label: 'Uncategorized',
      icon: <ToolOutlined style={{ color: '#71717a' }} />,
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
      icon: <RobotOutlined />,
      authentication: 'api_key',
      isPremium: true,
      isPopular: true,
      provider: 'OpenAI'
    },
    {
      id: 'anthropic_claude',
      name: 'Anthropic Claude',
      description: 'Use Claude AI for text generation',
      category: 'ai_ml',
      icon: <RobotOutlined />,
      authentication: 'api_key',
      isPremium: true,
      isPopular: true,
      provider: 'Anthropic'
    },
    {
      id: 'image_generation',
      name: 'Image Generation',
      description: 'Generate images with DALL-E',
      category: 'ai_ml',
      icon: <CameraOutlined />,
      authentication: 'api_key',
      isPremium: true,
      provider: 'OpenAI'
    },

    // Database & Data
    {
      id: 'database_query',
      name: 'Database Query',
      description: 'Query workspace database',
      category: 'database',
      icon: <DatabaseOutlined />,
      authentication: 'none',
      isPopular: true
    },
    {
      id: 'sql_execute',
      name: 'Execute SQL',
      description: 'Run raw SQL queries',
      category: 'database',
      icon: <CodeOutlined />,
      authentication: 'none'
    },

    // File & Document
    {
      id: 'read_file',
      name: 'Read File',
      description: 'Read file contents from storage',
      category: 'file',
      icon: <FileTextOutlined />,
      authentication: 'none',
      isPopular: true
    },
    {
      id: 'write_file',
      name: 'Write File',
      description: 'Write content to file',
      category: 'file',
      icon: <FileTextOutlined />,
      authentication: 'none',
      isPopular: true
    },
    {
      id: 'pdf_extract',
      name: 'PDF Text Extract',
      description: 'Extract text from PDF files',
      category: 'file',
      icon: <FilePdfOutlined />,
      authentication: 'none'
    },
    {
      id: 'docx_create',
      name: 'Create Word Doc',
      description: 'Generate Word documents',
      category: 'file',
      icon: <FileWordOutlined />,
      authentication: 'none'
    },
    {
      id: 'excel_create',
      name: 'Create Excel',
      description: 'Generate Excel spreadsheets',
      category: 'file',
      icon: <FileExcelOutlined />,
      authentication: 'none'
    },

    // Search & Research
    {
      id: 'web_search',
      name: 'Web Search',
      description: 'Search the web for information',
      category: 'search',
      icon: <SearchOutlined />,
      authentication: 'api_key',
      isPopular: true,
      isPremium: true,
      provider: 'Google'
    },
    {
      id: 'news_search',
      name: 'News Search',
      description: 'Search latest news articles',
      category: 'search',
      icon: <GlobalOutlined />,
      authentication: 'api_key',
      provider: 'NewsAPI'
    },

    // Web Scraping
    {
      id: 'web_scrape',
      name: 'Web Scraper',
      description: 'Scrape content from any website',
      category: 'web_scraping',
      icon: <LinkOutlined />,
      authentication: 'none',
      isPopular: true
    },
    {
      id: 'browser_automation',
      name: 'Browser Automation',
      description: 'Automate browser actions',
      category: 'web_scraping',
      icon: <ChromeOutlined />,
      authentication: 'none'
    },

    // Communication
    {
      id: 'send_email',
      name: 'Send Email',
      description: 'Send emails via workspace',
      category: 'communication',
      icon: <MailOutlined />,
      authentication: 'oauth',
      isPopular: true,
      provider: 'Gmail'
    },
    {
      id: 'slack_message',
      name: 'Send Slack',
      description: 'Send messages to channels',
      category: 'communication',
      icon: <SlackOutlined />,
      authentication: 'oauth',
      isPopular: true,
      provider: 'Slack'
    },
    {
      id: 'send_sms',
      name: 'Send SMS',
      description: 'Send SMS via Twilio',
      category: 'communication',
      icon: <MobileOutlined />,
      authentication: 'api_key',
      isPremium: true,
      provider: 'Twilio'
    },

    // Integrations
    {
      id: 'google_sheets',
      name: 'Google Sheets',
      description: 'Read/write Google Sheets',
      category: 'integration',
      icon: <FileExcelOutlined />,
      authentication: 'oauth',
      isPopular: true,
      provider: 'Google'
    },
    {
      id: 'github',
      name: 'GitHub API',
      description: 'Interact with repositories',
      category: 'integration',
      icon: <GithubOutlined />,
      authentication: 'oauth',
      provider: 'GitHub'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing',
      category: 'integration',
      icon: <CreditCardOutlined />,
      authentication: 'api_key',
      isPremium: true,
      provider: 'Stripe'
    },

    // Calendar
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      description: 'Manage events',
      category: 'calendar',
      icon: <CalendarOutlined />,
      authentication: 'oauth',
      isPopular: true,
      provider: 'Google'
    },

    // CRM
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Interact with Salesforce CRM',
      category: 'crm',
      icon: <CloudServerOutlined />,
      authentication: 'oauth',
      isPremium: true,
      provider: 'Salesforce'
    },

    // Automation
    {
      id: 'http_request',
      name: 'HTTP Request',
      description: 'Make HTTP requests',
      category: 'automation',
      icon: <GlobalOutlined />,
      authentication: 'none',
      isPopular: true
    },
    {
      id: 'webhook_trigger',
      name: 'Webhook',
      description: 'Trigger via webhook',
      category: 'automation',
      icon: <LinkOutlined />,
      authentication: 'none'
    },
    {
      id: 'conditional',
      name: 'Conditional',
      description: 'If/else logic',
      category: 'automation',
      icon: <PartitionOutlined />,
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
      // Load custom tools
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
          border: isSelected ? `1px solid ${BRAND_GREEN}` : `1px solid ${BORDER_COLOR}`,
          backgroundColor: isSelected ? 'rgba(92, 196, 157, 0.05)' : SURFACE_CARD,
          transition: 'all 0.2s ease',
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
          {/* Icon */}
          <div style={{ 
            fontSize: '18px', 
            flexShrink: 0, 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: isSelected ? BRAND_GREEN : 'rgba(255,255,255,0.05)',
            color: isSelected ? '#000' : '#fff',
            borderRadius: '6px'
          }}>
            {tool.icon || <ToolOutlined />}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Text strong style={{ fontSize: '13px', color: '#fff' }}>
                {tool.name}
              </Text>

              {tool.isPremium && (
                <Tag color="gold" bordered={false} style={{ fontSize: '9px', padding: '0 4px', margin: 0, lineHeight: '16px' }}>
                  PREMIUM
                </Tag>
              )}
            </div>

            <Paragraph
              ellipsis={{ rows: 2 }}
              style={{ fontSize: '12px', color: TEXT_SECONDARY, marginBottom: '4px', lineHeight: '1.4' }}
            >
              {tool.description}
            </Paragraph>

            {tool.provider && (
              <Text style={{ fontSize: '10px', color: '#666' }}>
                by {tool.provider}
              </Text>
            )}
          </div>

          {/* Actions */}
          <div style={{ flexShrink: 0 }}>
            <Button
              type="text"
              size="small"
              icon={isFavorite ? <StarFilled style={{ color: '#F59E0B' }} /> : <StarOutlined style={{ color: TEXT_SECONDARY }} />}
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
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: {
          colorPrimary: BRAND_GREEN,
          fontFamily: 'Manrope, sans-serif',
          colorBgContainer: SURFACE_CARD,
          colorBorder: BORDER_COLOR,
          colorText: TEXT_PRIMARY,
          colorTextSecondary: TEXT_SECONDARY,
          borderRadius: 6,
        },
        components: {
          Input: {
            colorBgContainer: '#000000',
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
          },
          Button: {
            fontWeight: 600,
          },
          Collapse: {
            contentBg: DARK_BG,
            headerBg: 'transparent',
          }
        }
      }}
    >
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: DARK_BG,
        borderRight: `1px solid ${BORDER_COLOR}`
      }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${BORDER_COLOR}` }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ToolOutlined style={{ color: BRAND_GREEN }} />
              <Title level={5} style={{ margin: 0, color: '#fff', fontSize: '15px' }}>
                Toolbox
              </Title>
              <Badge count={filteredTools.length} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>

            <Button
              type="default"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setShowCustomToolModal(true)}
              style={{ fontSize: '12px' }}
            >
              Add Custom
            </Button>
          </Space>

          {/* Search */}
          <Input
            placeholder="Find a tool..."
            prefix={<SearchOutlined style={{ color: TEXT_SECONDARY }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ borderRadius: '6px' }}
          />
        </div>

        {/* Tools List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', scrollbarWidth: 'thin' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : filteredTools.length === 0 ? (
            <Empty
              description={<span style={{ color: TEXT_SECONDARY }}>No tools found</span>}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: '40px' }}
            />
          ) : (
            <Collapse
              activeKey={expandedCategories}
              onChange={(keys) => setExpandedCategories(keys as string[])}
              bordered={false}
              expandIcon={({ isActive }) => <RightOutlined rotate={isActive ? 90 : 0} style={{ fontSize: '10px', color: TEXT_SECONDARY }} />}
              expandIconPosition="start"
              style={{ backgroundColor: 'transparent' }}
            >
              {categories.map(category => {
                const categoryTools = getToolsByCategory(category.key);

                if (categoryTools.length === 0) return null;

                return (
                  <Panel
                    key={category.key}
                    header={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                        {category.icon}
                        <Text strong style={{ fontSize: '13px', color: '#fff' }}>
                          {category.label}
                        </Text>
                        <span style={{ fontSize: '11px', color: TEXT_SECONDARY, marginLeft: 'auto' }}>
                          {categoryTools.length}
                        </span>
                      </div>
                    }
                    style={{ borderBottom: 'none', marginBottom: '4px' }}
                  >
                    <div style={{ paddingLeft: '4px' }}>
                       {categoryTools.map(renderToolCard)}
                    </div>
                  </Panel>
                );
              })}
            </Collapse>
          )}
        </div>

        {/* Custom Tool Modal */}
        <Modal
          title={<span style={{ fontFamily: 'Manrope' }}>Create Custom Tool</span>}
          open={showCustomToolModal}
          onCancel={() => setShowCustomToolModal(false)}
          onOk={handleCreateCustomTool}
          width={520}
          okButtonProps={{ style: { backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' } }}
        >
          <Form form={customToolForm} layout="vertical" style={{ marginTop: '20px' }}>
            <Form.Item
              name="name"
              label="Tool Name"
              rules={[{ required: true, message: 'Please enter tool name' }]}
            >
              <Input placeholder="e.g., Internal API Integration" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Describe what this tool does and when agents should use it."
              />
            </Form.Item>

            <Form.Item
              name="authentication"
              label="Authentication Type"
              initialValue="none"
            >
              <Select
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'API Key (Header)', value: 'api_key' },
                  { label: 'OAuth 2.0', value: 'oauth' },
                  { label: 'Basic Auth', value: 'basic' }
                ]}
              />
            </Form.Item>

            <Form.Item
              name="endpoint"
              label="API Endpoint"
              tooltip="The base URL for API requests"
            >
              <Input prefix={<GlobalOutlined style={{ color: TEXT_SECONDARY }} />} placeholder="https://api.example.com/v1" />
            </Form.Item>

            <Form.Item
              name="provider"
              label="Provider Name"
            >
              <Input prefix={<CodeOutlined style={{ color: TEXT_SECONDARY }} />} placeholder="e.g., Company Service" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};