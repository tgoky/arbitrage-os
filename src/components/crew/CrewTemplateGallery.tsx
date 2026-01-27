// app/components/CrewTemplateGallery.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Typography,
  Badge,
  Tabs,
  Empty,
  Spin,
  Rate,
  Divider,
  Avatar,
  message,
  Tooltip,
  Statistic,
  ConfigProvider,
  theme
} from 'antd';
import {
  SearchOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  BarChartOutlined,
  MailOutlined,
  CustomerServiceOutlined,
  GlobalOutlined,
  StarOutlined,
  StarFilled,
  PlayCircleOutlined,
  EyeOutlined,
  CopyOutlined,
  HeartOutlined,
  HeartFilled,
  DownloadOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_CARD = '#09090b'; // Slightly lighter than black for contrast
const BORDER_COLOR = '#27272a'; // Zinc-800
const TEXT_SECONDARY = '#a1a1aa'; // Zinc-400

interface CrewTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  agents: any[];
  tasks: any[];
  process: string;
  rating: number;
  reviews: number;
  downloads: number;
  isFavorite?: boolean;
  author?: string;
  tags: string[];
  thumbnail?: string;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CrewTemplateGalleryProps {
  workspaceId: string;
  onSelectTemplate: (template: CrewTemplate) => void;
  onUseTemplate: (template: CrewTemplate) => void;
}

export const CrewTemplateGallery: React.FC<CrewTemplateGalleryProps> = ({
  workspaceId,
  onSelectTemplate,
  onUseTemplate
}) => {
  const [templates, setTemplates] = useState<CrewTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CrewTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
  
  const [previewTemplate, setPreviewTemplate] = useState<CrewTemplate | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  // ==================== DATA LOADING ====================

  useEffect(() => {
    loadTemplates();
    loadFavorites();
  }, []);

  useEffect(() => {
    filterAndSortTemplates();
  }, [templates, selectedCategory, searchQuery, sortBy, difficultyFilter]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/agent-crews/templates?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      message.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await fetch(`/api/agent-crews/favorites?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.success) {
        setFavorites(new Set(data.favoriteIds));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  // ==================== FILTERING & SORTING ====================

  const filterAndSortTemplates = () => {
    let filtered = [...templates];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (difficultyFilter.length > 0) {
      filtered = filtered.filter(t => difficultyFilter.includes(t.difficulty));
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  // ==================== ACTIONS ====================

  const handleToggleFavorite = async (templateId: string) => {
    try {
      const isFavorite = favorites.has(templateId);
      const res = await fetch('/api/agent-crews/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, templateId })
      });

      if (res.ok) {
        const newFavorites = new Set(favorites);
        if (isFavorite) {
          newFavorites.delete(templateId);
        } else {
          newFavorites.add(templateId);
        }
        setFavorites(newFavorites);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handlePreview = (template: CrewTemplate) => {
    setPreviewTemplate(template);
  };

  const handleUseTemplate = async (template: CrewTemplate) => {
    try {
      await fetch(`/api/agent-crews/templates/${template.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });
    } catch (error) {
      console.error('Failed to track template usage:', error);
    }
    onUseTemplate(template);
    setPreviewTemplate(null);
  };

  const handleCloneTemplate = async (template: CrewTemplate) => {
    try {
      const res = await fetch('/api/agent-crews/templates/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, templateId: template.id })
      });

      const data = await res.json();
      if (data.success) {
        message.success('Template cloned to your workspace!');
      }
    } catch (error) {
      console.error('Failed to clone template:', error);
      message.error('Failed to clone template');
    }
  };

  // ==================== RENDER HELPERS ====================

  const categoryIcons: Record<string, any> = {
    content: <FileTextOutlined />,
    research: <SearchOutlined />,
    sales: <MailOutlined />,
    marketing: <GlobalOutlined />,
    data: <BarChartOutlined />,
    communication: <CustomerServiceOutlined />
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'green',
    intermediate: 'orange',
    advanced: 'red'
  };

  const categories = [
    { value: 'all', label: 'All Templates', count: templates.length },
    { value: 'content', label: 'Content Creation', count: templates.filter(t => t.category === 'content').length },
    { value: 'research', label: 'Research & Analysis', count: templates.filter(t => t.category === 'research').length },
    { value: 'sales', label: 'Sales & Outreach', count: templates.filter(t => t.category === 'sales').length },
    { value: 'marketing', label: 'Marketing', count: templates.filter(t => t.category === 'marketing').length },
    { value: 'data', label: 'Data Analysis', count: templates.filter(t => t.category === 'data').length },
    { value: 'communication', label: 'Communication', count: templates.filter(t => t.category === 'communication').length }
  ];

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: { colorPrimary: BRAND_GREEN, fontFamily: 'Manrope, sans-serif' },
        }}
      >
        <div style={{ textAlign: 'center', padding: '100px 0', background: DARK_BG, minHeight: '100vh' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text style={{ color: TEXT_SECONDARY }}>Loading templates...</Text>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: BRAND_GREEN,
          fontFamily: 'Manrope, sans-serif',
          colorBgContainer: SURFACE_CARD,
          colorBgElevated: '#18181b', // Zinc-900
          colorBorder: BORDER_COLOR,
          borderRadius: 8,
          colorText: '#ffffff',
          colorTextSecondary: TEXT_SECONDARY,
        },
        components: {
          Card: {
            headerBg: 'transparent',
            boxShadow: 'none',
          },
          Input: {
            colorBgContainer: '#000000',
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
            paddingBlock: 10,
          },
          Select: {
            colorBgContainer: '#000000',
            controlHeight: 42,
          },
          Button: {
            fontWeight: 600,
            defaultBg: 'transparent',
            defaultBorderColor: BORDER_COLOR,
          },
          Tabs: {
            itemActiveColor: BRAND_GREEN,
            itemHoverColor: BRAND_GREEN,
            inkBarColor: BRAND_GREEN,
            itemSelectedColor: BRAND_GREEN,
          },
          Tag: {
            colorBgContainer: 'rgba(255,255,255,0.05)',
            // defaultBorderColor: BORDER_COLOR,
          }
        }
      }}
    >
      <div style={{ 
        padding: '24px', 
        minHeight: '100vh', 
        backgroundColor: DARK_BG,
        fontFamily: 'Manrope, sans-serif',
        color: '#fff' 
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <Title level={2} style={{ color: '#fff', marginBottom: '8px', letterSpacing: '-0.5px' }}>
              {/* <ThunderboltOutlined style={{ color: BRAND_GREEN, marginRight: '12px' }} /> */}
              Arbitrage AI Auto Template Gallery
            </Title>
            <Text style={{ color: TEXT_SECONDARY, fontSize: '16px' }}>
              Browse {templates.length} pre-built agent crews ready to use immediately
            </Text>
          </div>

          {/* Featured Templates Carousel */}
          {templates.filter(t => t.featured).length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
                <StarFilled style={{ color: '#F59E0B' }} />
                <Title level={4} style={{ color: '#fff', margin: 0 }}>Featured Templates</Title>
              </div>
              
              <Row gutter={[24, 24]}>
                {templates.filter(t => t.featured).slice(0, 3).map(template => (
                  <Col xs={24} md={8} key={template.id}>
                    <Card
                      hoverable
                      style={{ 
                        border: `1px solid ${BORDER_COLOR}`,
                        overflow: 'hidden',
                        height: '100%'
                      }}
                      cover={
                        <div
                          style={{
                            height: '160px',
                            background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            color: BRAND_GREEN,
                            borderBottom: `1px solid ${BORDER_COLOR}`,
                            position: 'relative'
                          }}
                        >
                          {categoryIcons[template.category] || <RobotOutlined />}
                          <div style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: BRAND_GREEN,
                            color: '#000',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '800',
                            textTransform: 'uppercase'
                          }}>
                            Featured
                          </div>
                        </div>
                      }
                      onClick={() => handlePreview(template)}
                    >
                      <Title level={5} style={{ color: '#fff', marginBottom: '8px' }}>{template.name}</Title>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ color: TEXT_SECONDARY, marginBottom: '16px', minHeight: '44px' }}>
                        {template.description}
                      </Paragraph>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <StarFilled style={{ color: '#F59E0B', fontSize: '14px' }} />
                          <Text style={{ color: '#fff', fontWeight: 600 }}>{template.rating}</Text>
                          <Text style={{ color: TEXT_SECONDARY, fontSize: '12px' }}>({template.reviews})</Text>
                        </Space>
                        <Button type="text" style={{ color: BRAND_GREEN, padding: 0 }}>
                          View Details <EyeOutlined />
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Filters Bar */}
          <div style={{ 
            backgroundColor: SURFACE_CARD, 
            padding: '24px', 
            borderRadius: '12px', 
            border: `1px solid ${BORDER_COLOR}`,
            marginBottom: '32px'
          }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <Search
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  allowClear
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} lg={14}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    style={{ width: '180px' }}
                    options={[
                      { label: '🔥 Most Popular', value: 'popular' },
                      { label: '🆕 Recently Added', value: 'recent' },
                      { label: '⭐ Highest Rated', value: 'rating' }
                    ]}
                  />

                  <Select
                    mode="multiple"
                    placeholder="Difficulty"
                    value={difficultyFilter}
                    onChange={setDifficultyFilter}
                    style={{ minWidth: '160px', flex: 1 }}
                    maxTagCount="responsive"
                    options={[
                      { label: 'Beginner', value: 'beginner' },
                      { label: 'Intermediate', value: 'intermediate' },
                      { label: 'Advanced', value: 'advanced' }
                    ]}
                  />

                  {(searchQuery || difficultyFilter.length > 0) && (
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setDifficultyFilter([]);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          {/* Category Tabs */}
          <Tabs
            activeKey={selectedCategory}
            onChange={setSelectedCategory}
            style={{ marginBottom: '32px' }}
            tabBarStyle={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
          >
            {categories.map(cat => (
              <TabPane
                tab={
                  <Space>
                    {categoryIcons[cat.value]}
                    {cat.label}
                    <Badge 
                      count={cat.count} 
                      style={{ 
                        backgroundColor: selectedCategory === cat.value ? BRAND_GREEN : '#27272a', 
                        color: selectedCategory === cat.value ? '#000' : '#fff',
                        boxShadow: 'none'
                      }} 
                    />
                  </Space>
                }
                key={cat.value}
              />
            ))}
          </Tabs>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <Empty
              description={<span style={{ color: TEXT_SECONDARY }}>No templates found matching your criteria</span>}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '48px 0' }}
            />
          ) : (
            <Row gutter={[20, 20]}>
              {filteredTemplates.map(template => (
                <Col xs={24} sm={12} lg={8} xl={6} key={template.id}>
                  <Card
                    hoverable
                    style={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      backgroundColor: SURFACE_CARD,
                      border: `1px solid ${BORDER_COLOR}`,
                      transition: 'all 0.3s ease'
                    }}
                    bodyStyle={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}
                    actions={[
                      <Tooltip title={favorites.has(template.id) ? 'Remove from favorites' : 'Add to favorites'} key="favorite">
                        <Button
                          type="text"
                          icon={favorites.has(template.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined style={{ color: TEXT_SECONDARY }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(template.id);
                          }}
                        />
                      </Tooltip>,
                      <Tooltip title="Preview" key="preview">
                        <Button
                          type="text"
                          icon={<EyeOutlined style={{ color: TEXT_SECONDARY }} />}
                          onClick={() => handlePreview(template)}
                        />
                      </Tooltip>,
                      <Tooltip title="Use Template" key="use">
                        <Button
                          type="text"
                          icon={<PlayCircleOutlined style={{ color: BRAND_GREEN }} />}
                          onClick={() => handleUseTemplate(template)}
                          style={{ color: BRAND_GREEN, fontWeight: 600 }}
                        >
                          Use
                        </Button>
                      </Tooltip>
                    ]}
                  >
                    {/* Card Header */}
                    <div style={{ display: 'flex', alignItems: 'start', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${BORDER_COLOR}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          marginRight: '12px',
                          color: BRAND_GREEN,
                          flexShrink: 0
                        }}
                      >
                        {categoryIcons[template.category] || <RobotOutlined />}
                      </div>

                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <Title level={5} ellipsis={{ tooltip: template.name }} style={{ marginBottom: '4px', color: '#fff', fontSize: '15px' }}>
                          {template.name}
                        </Title>
                        <Space size={4} wrap style={{ rowGap: '4px' }}>
                          <Tag bordered={false} style={{ margin: 0, fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: TEXT_SECONDARY }}>{template.category}</Tag>
                          <Tag bordered={false} color={template.difficulty === 'beginner' ? 'success' : template.difficulty === 'intermediate' ? 'warning' : 'error'} style={{ margin: 0, fontSize: '10px' }}>
                            {template.difficulty}
                          </Tag>
                        </Space>
                      </div>
                    </div>

                    {/* Description */}
                    <Paragraph
                      ellipsis={{ rows: 3 }}
                      style={{ color: TEXT_SECONDARY, marginBottom: '20px', flex: 1, fontSize: '13px', lineHeight: '1.6' }}
                    >
                      {template.description}
                    </Paragraph>

                    {/* Stats */}
                    <div style={{ 
                      paddingTop: '16px', 
                      marginTop: 'auto', 
                      borderTop: `1px solid ${BORDER_COLOR}`,
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <Space size="small" style={{ color: TEXT_SECONDARY, fontSize: '12px' }}>
                         <DownloadOutlined /> {template.downloads}
                      </Space>
                      <Space size="small" style={{ color: TEXT_SECONDARY, fontSize: '12px' }}>
                         <TeamOutlined /> {template.agents.length} Agents
                      </Space>
                     <Space size="small" style={{ color: '#F59E0B', fontSize: '12px', fontWeight: 600 }}>
  <StarFilled /> {(template.rating || 0).toFixed(1)}
</Space>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Preview Modal */}
          <Modal
            title={null}
            open={!!previewTemplate}
            onCancel={() => setPreviewTemplate(null)}
            width={800}
            style={{ top: 40 }}
            styles={{
              content: {
                backgroundColor: '#18181b',
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: '12px',
                padding: 0,
                overflow: 'hidden'
              }
            }}
            footer={
              <div style={{ 
                padding: '16px 24px', 
                borderTop: `1px solid ${BORDER_COLOR}`,
                backgroundColor: SURFACE_CARD,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <Button
                  key="clone"
                  icon={<CopyOutlined />}
                  onClick={() => previewTemplate && handleCloneTemplate(previewTemplate)}
                  style={{ height: '40px' }}
                >
                  Clone to Workspace
                </Button>
                <Button
                  key="use"
                  type="primary"
                  icon={<PlayCircleOutlined style={{color: '#000'}}/>}
                  onClick={() => previewTemplate && handleUseTemplate(previewTemplate)}
                  style={{ 
                    backgroundColor: BRAND_GREEN, 
                    borderColor: BRAND_GREEN, 
                    color: '#000', 
                    height: '40px',
                    fontWeight: 700
                  }}
                >
                  Use This Template
                </Button>
              </div>
            }
          >
            {previewTemplate && (
              <div>
                {/* Modal Header Banner */}
                <div style={{ 
                  padding: '32px 32px 24px', 
                  background: 'linear-gradient(to bottom, #27272a 0%, #18181b 100%)',
                  borderBottom: `1px solid ${BORDER_COLOR}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '24px' }}>
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '16px',
                        background: SURFACE_CARD,
                        border: `1px solid ${BORDER_COLOR}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        color: BRAND_GREEN,
                        flexShrink: 0,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                      }}
                    >
                      {categoryIcons[previewTemplate.category] || <RobotOutlined />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <Title level={3} style={{ marginBottom: '8px', color: '#fff', marginTop: 0 }}>
                            {previewTemplate.name}
                          </Title>
                          <Space size={16} style={{ marginBottom: '12px' }}>
                            <Space size={4}>
                              <StarFilled style={{ color: '#F59E0B' }} />
                              <Text style={{ color: '#fff', fontWeight: 600 }}>{previewTemplate.rating}</Text>
                              <Text style={{ color: TEXT_SECONDARY }}>({previewTemplate.reviews} reviews)</Text>
                            </Space>
                            <Space size={4}>
                               <DownloadOutlined style={{ color: TEXT_SECONDARY }} />
                               <Text style={{ color: TEXT_SECONDARY }}>{previewTemplate.downloads} downloads</Text>
                            </Space>
                          </Space>
                        </div>
                        <Button
                          type="text"
                          icon={favorites.has(previewTemplate.id) ? <HeartFilled style={{ color: '#ff4d4f', fontSize: '20px' }} /> : <HeartOutlined style={{ color: TEXT_SECONDARY, fontSize: '20px' }} />}
                          onClick={() => handleToggleFavorite(previewTemplate.id)}
                        />
                      </div>

                      <Space wrap size={8}>
                        <Tag bordered={false} color={previewTemplate.difficulty === 'beginner' ? 'success' : previewTemplate.difficulty === 'intermediate' ? 'warning' : 'error'}>
                          {previewTemplate.difficulty.toUpperCase()}
                        </Tag>
                        <Tag bordered={false} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>{previewTemplate.category}</Tag>
                        {previewTemplate.featured && (
                          <Tag bordered={false} color={BRAND_GREEN} style={{ color: '#000', fontWeight: 700 }}>FEATURED</Tag>
                        )}
                      </Space>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '32px' }}>
                  <Row gutter={[32, 32]}>
                    <Col span={16}>
                       {/* Description */}
                      <div style={{ marginBottom: '32px' }}>
                        <Title level={5} style={{ color: '#fff', marginBottom: '12px' }}>Description</Title>
                        <Paragraph style={{ color: TEXT_SECONDARY, fontSize: '15px', lineHeight: '1.7' }}>
                          {previewTemplate.description}
                        </Paragraph>
                      </div>

                      {/* Agents */}
                      <div style={{ marginBottom: '32px' }}>
                        <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
                          Crew Agents ({previewTemplate.agents.length})
                        </Title>
                        <Space direction="vertical" style={{ width: '100%' }} size={12}>
                          {previewTemplate.agents.map((agent: any) => (
                            <div key={agent.id} style={{ 
                              padding: '16px', 
                              backgroundColor: SURFACE_CARD, 
                              borderRadius: '8px', 
                              border: `1px solid ${BORDER_COLOR}`,
                              display: 'flex',
                              alignItems: 'start',
                              gap: '16px'
                            }}>
                              <Avatar 
                                size={40} 
                                style={{ backgroundColor: 'rgba(92, 196, 157, 0.1)', color: BRAND_GREEN }}
                              >
                                {agent.avatar || <RobotOutlined />}
                              </Avatar>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <Text strong style={{ color: '#fff' }}>{agent.name}</Text>
                                  <Tag style={{ margin: 0, fontSize: '10px' }}>{agent.role}</Tag>
                                </div>
                                <Text style={{ color: TEXT_SECONDARY, fontSize: '13px', display: 'block' }}>
                                  <span style={{ color: BRAND_GREEN }}>Goal:</span> {agent.goal}
                                </Text>
                              </div>
                            </div>
                          ))}
                        </Space>
                      </div>

                      {/* Tasks */}
                      <div>
                        <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
                          Process Tasks ({previewTemplate.tasks.length})
                        </Title>
                        <div style={{ position: 'relative', paddingLeft: '16px' }}>
                            {/* Simple timeline line */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', backgroundColor: BORDER_COLOR }}></div>
                            
                            <Space direction="vertical" style={{ width: '100%' }} size={16}>
                              {previewTemplate.tasks.map((task: any, idx: number) => (
                                <div key={task.id} style={{ position: 'relative' }}>
                                   {/* Timeline dot */}
                                  <div style={{ 
                                    position: 'absolute', 
                                    left: '-21px', 
                                    top: '16px', 
                                    width: '12px', 
                                    height: '12px', 
                                    borderRadius: '50%', 
                                    backgroundColor: SURFACE_CARD,
                                    border: `2px solid ${BRAND_GREEN}` 
                                  }}></div>
                                  
                                  <div style={{ 
                                    padding: '16px', 
                                    backgroundColor: SURFACE_CARD, 
                                    borderRadius: '8px', 
                                    border: `1px solid ${BORDER_COLOR}` 
                                  }}>
                                    <Text strong style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
                                      {idx + 1}. {task.description.length > 80 ? task.description.substring(0, 80) + '...' : task.description}
                                    </Text>
                                    <div style={{ fontSize: '13px', color: TEXT_SECONDARY, padding: '8px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                                      <strong style={{ color: TEXT_SECONDARY }}>Output:</strong> {task.expectedOutput}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </Space>
                        </div>
                      </div>
                    </Col>
                    
                    <Col span={8}>
                        {/* Sidebar Stats */}
                        <div style={{ 
                          padding: '20px', 
                          backgroundColor: SURFACE_CARD, 
                          borderRadius: '12px', 
                          border: `1px solid ${BORDER_COLOR}` 
                        }}>
                          <Space direction="vertical" size={24} style={{ width: '100%' }}>
                            <Statistic
                              title={<span style={{ color: TEXT_SECONDARY, fontSize: '12px' }}>USAGE</span>}
                              value={previewTemplate.downloads}
                              valueStyle={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}
                              prefix={<DownloadOutlined style={{ color: BRAND_GREEN }} />}
                            />
                            <Divider style={{ margin: 0, borderColor: BORDER_COLOR }} />
                            <Statistic
                              title={<span style={{ color: TEXT_SECONDARY, fontSize: '12px' }}>PROCESS TYPE</span>}
                              value={previewTemplate.process === 'sequential' ? 'Sequential' : 'Hierarchical'}
                              valueStyle={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}
                              prefix={<ThunderboltOutlined style={{ color: BRAND_GREEN }} />}
                            />
                            <Divider style={{ margin: 0, borderColor: BORDER_COLOR }} />
                             <div>
                                <Text style={{ color: TEXT_SECONDARY, fontSize: '12px', display: 'block', marginBottom: '8px' }}>TAGS</Text>
                                <Space wrap size={[4, 8]}>
                                  {previewTemplate.tags.map(tag => (
                                    <Tag key={tag} bordered={false} style={{ margin: 0, backgroundColor: '#27272a', color: '#d4d4d8' }}>
                                      #{tag}
                                    </Tag>
                                  ))}
                                </Space>
                             </div>
                             <Divider style={{ margin: 0, borderColor: BORDER_COLOR }} />
                             <div style={{ fontSize: '12px', color: TEXT_SECONDARY }}>
                                <div>Created by <span style={{ color: '#fff' }}>{previewTemplate.author || 'System'}</span></div>
                                <div>Updated {new Date(previewTemplate.updatedAt).toLocaleDateString()}</div>
                             </div>
                          </Space>
                        </div>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </ConfigProvider>
  );
};