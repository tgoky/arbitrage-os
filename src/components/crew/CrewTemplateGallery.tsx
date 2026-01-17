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
    Statistic
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

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Difficulty filter
    if (difficultyFilter.length > 0) {
      filtered = filtered.filter(t => difficultyFilter.includes(t.difficulty));
    }

    // Sorting
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
        body: JSON.stringify({
          workspaceId,
          templateId
        })
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
    // Track usage
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
        body: JSON.stringify({
          workspaceId,
          templateId: template.id
        })
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
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text type="secondary">Loading templates...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2}>
          <ThunderboltOutlined style={{ color: '#5CC49D', marginRight: '12px' }} />
          Crew Template Gallery
        </Title>
        <Text type="secondary">
          Browse {templates.length} pre-built agent crews ready to use
        </Text>
      </div>

      {/* Featured Templates Carousel */}
      {templates.filter(t => t.featured).length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <Title level={4}>Featured Templates</Title>
          <Row gutter={[16, 16]}>
            {templates.filter(t => t.featured).slice(0, 3).map(template => (
              <Col xs={24} md={8} key={template.id}>
                <Card
                  hoverable
                  cover={
                    <div
                      style={{
                        height: '180px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '64px'
                      }}
                    >
                      {categoryIcons[template.category] || <RobotOutlined />}
                    </div>
                  }
                  onClick={() => handlePreview(template)}
                >
                  <Badge.Ribbon text="Featured" color="#5CC49D">
                    <div>
                      <Title level={5}>{template.name}</Title>
                      <Paragraph ellipsis={{ rows: 2 }}>
                        {template.description}
                      </Paragraph>
                      <Space>
                        <Rate disabled value={template.rating} style={{ fontSize: '14px' }} />
                        <Text type="secondary">({template.reviews})</Text>
                      </Space>
                    </div>
                  </Badge.Ribbon>
                </Card>
              </Col>
            ))}
          </Row>
          <Divider />
        </div>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Search */}
          <Search
            placeholder="Search templates by name, description, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            size="large"
            prefix={<SearchOutlined />}
            allowClear
          />

          {/* Filter Row */}
          <Space wrap style={{ width: '100%' }}>
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
              style={{ minWidth: '200px' }}
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
                Clear Filters
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      {/* Category Tabs */}
      <Tabs
        activeKey={selectedCategory}
        onChange={setSelectedCategory}
        style={{ marginBottom: '24px' }}
      >
        {categories.map(cat => (
          <TabPane
            tab={
              <Space>
                {categoryIcons[cat.value]}
                {cat.label}
                <Badge count={cat.count} style={{ backgroundColor: '#5CC49D' }} />
              </Space>
            }
            key={cat.value}
          />
        ))}
      </Tabs>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Empty
          description="No templates found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredTemplates.map(template => (
            <Col xs={24} sm={12} lg={8} key={template.id}>
              <Card
                hoverable
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                actions={[
                  <Tooltip title={favorites.has(template.id) ? 'Remove from favorites' : 'Add to favorites'} key="favorite">
                    <Button
                      type="text"
                      
                      icon={favorites.has(template.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(template.id);
                      }}
                    />
                  </Tooltip>,
                  <Tooltip title="Preview" key="preview">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreview(template)}
                    />
                  </Tooltip>,
                  <Tooltip title="Use Template" key="use">
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleUseTemplate(template)}
                      style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
                    >
                      Use
                    </Button>
                  </Tooltip>
                ]}
              >
                {/* Template Header */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        marginRight: '12px',
                        color: '#fff'
                      }}
                    >
                      {categoryIcons[template.category] || <RobotOutlined />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <Title level={5} style={{ marginBottom: '4px' }}>
                        {template.name}
                      </Title>
                      <Space size={4}>
                        <Tag color={difficultyColors[template.difficulty]}>
                          {template.difficulty}
                        </Tag>
                        <Tag>{template.category}</Tag>
                      </Space>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <Paragraph
                  ellipsis={{ rows: 3 }}
                  style={{ color: '#666', marginBottom: '16px', flex: 1 }}
                >
                  {template.description}
                </Paragraph>

                {/* Stats */}
                   <div style={{ marginBottom: '12px' }}>
                  <Space split={<Divider type="vertical" />} size="small">
                    <Tooltip title="Rating">
                      <Space size={4}>
                        <StarFilled style={{ color: '#faad14', fontSize: '14px' }} />
                        <Text style={{ fontSize: '13px' }}>
                          {template.rating != null ? template.rating.toFixed(1) : '0.0'}
                        </Text>
                      </Space>
                    </Tooltip>

                      <Tooltip title="Downloads">
                      <Space size={4}>
                        <DownloadOutlined style={{ fontSize: '14px' }} />
                        <Text style={{ fontSize: '13px' }}>
                          {template.downloads}
                        </Text>
                      </Space>
                    </Tooltip>
                    
                    <Tooltip title="Agents">
                      <Space size={4}>
                        <TeamOutlined style={{ fontSize: '14px' }} />
                        <Text style={{ fontSize: '13px' }}>
                          {template.agents.length}
                        </Text>
                      </Space>
                    </Tooltip>
                  </Space>
                </div>

                {/* Tags */}
               <div>
                  <Space wrap size={4}>
                    {template.tags && template.tags.length > 0 ? (
                      <>
                        {template.tags.slice(0, 3).map(tag => (
                          <Tag key={tag} style={{ fontSize: '11px', margin: 0 }}>
                            {tag}
                          </Tag>
                        ))}
                        {template.tags.length > 3 && (
                          <Tag style={{ fontSize: '11px', margin: 0 }}>
                            +{template.tags.length - 3}
                          </Tag>
                        )}
                      </>
                    ) : null}
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
        footer={[
          <Button
            key="clone"
            icon={<CopyOutlined />}
            onClick={() => {
              if (previewTemplate) {
                handleCloneTemplate(previewTemplate);
              }
            }}
          >
            Clone to Workspace
          </Button>,
          <Button
            key="use"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => {
              if (previewTemplate) {
                handleUseTemplate(previewTemplate);
              }
            }}
            style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
          >
            Use This Template
          </Button>
        ]}
      >
        {previewTemplate && (
          <div>
            {/* Modal Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    color: '#fff',
                    flexShrink: 0
                  }}
                >
                  {categoryIcons[previewTemplate.category] || <RobotOutlined />}
                </div>

                <div style={{ flex: 1 }}>
                  <Title level={3} style={{ marginBottom: '8px' }}>
                    {previewTemplate.name}
                  </Title>

                  <Space style={{ marginBottom: '8px' }}>
                    <Rate disabled value={previewTemplate.rating} />
                    <Text>({previewTemplate.reviews} reviews)</Text>
                  </Space>

                  <Space wrap>
                    <Tag color={difficultyColors[previewTemplate.difficulty]}>
                      {previewTemplate.difficulty}
                    </Tag>
                    <Tag>{previewTemplate.category}</Tag>
                    {previewTemplate.featured && (
                      <Tag color="#5CC49D">Featured</Tag>
                    )}
                  </Space>
                </div>

                <Button
                  type="text"
                  icon={favorites.has(previewTemplate.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                  onClick={() => handleToggleFavorite(previewTemplate.id)}
                  size="large"
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>Description</Title>
              <Paragraph>{previewTemplate.description}</Paragraph>
            </div>

            {/* Stats */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Downloads"
                    value={previewTemplate.downloads}
                    prefix={<DownloadOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Agents"
                    value={previewTemplate.agents.length}
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Tasks"
                    value={previewTemplate.tasks.length}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Agents */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>Agents ({previewTemplate.agents.length})</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                {previewTemplate.agents.map((agent: any) => (
                  <Card key={agent.id} size="small">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar size="large">
                        {agent.avatar || '🤖'}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Text strong>{agent.name}</Text>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {agent.role}
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          <strong>Goal:</strong> {agent.goal}
                        </div>
                      </div>
                      <Tag>{agent.tools?.length || 0} tools</Tag>
                    </div>
                  </Card>
                ))}
              </Space>
            </div>

            {/* Tasks */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>Tasks ({previewTemplate.tasks.length})</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                {previewTemplate.tasks.map((task: any, idx: number) => (
                  <Card key={task.id} size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>Task {idx + 1}: {task.description.substring(0, 100)}...</Text>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <strong>Expected Output:</strong> {task.expectedOutput}
                      </div>
                      {task.dependencies && task.dependencies.length > 0 && (
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Depends on: Task {previewTemplate.tasks.findIndex((t: any) => t.id === task.dependencies[0]) + 1}
                          </Text>
                        </div>
                      )}
                    </Space>
                  </Card>
                ))}
              </Space>
            </div>

            {/* Tags */}
            <div>
              <Title level={5}>Tags</Title>
              <Space wrap>
                {previewTemplate.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </div>

            {/* Author & Date */}
            {previewTemplate.author && (
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                <Space split={<Divider type="vertical" />}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Created by {previewTemplate.author}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Updated {new Date(previewTemplate.updatedAt).toLocaleDateString()}
                  </Text>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};