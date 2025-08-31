// app/ai-tools/page.tsx
"use client";
import React, { useState } from 'react';
import {
  SearchOutlined,
  StarOutlined,
  DollarOutlined,
  RocketOutlined,
  ExperimentOutlined,
  CodeOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  FileTextOutlined,
  ToolOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  LinkOutlined
} from '@ant-design/icons';
import {
  Card,
  Input,
  Select,
  Button,
  Typography,
  Space,
  Tag,
  Empty,
  Row,
  Col,
  Rate,
  Image,
  Modal,
  Divider,
  List,
  Tooltip,
  Alert
} from 'antd';
import { useTheme } from '../../providers/ThemeProvider';
import { AITool, aiTools } from './aitoolbank/aitoolbanks';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const AIToolsDashboard = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [selectedPricing, setSelectedPricing] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Extract unique categories and subcategories
  const categories = aiTools
    .map(tool => tool.category)
    .filter((value, index, self) => self.indexOf(value) === index);

  const subcategories = aiTools
    .map(tool => tool.subcategory)
    .filter((value, index, self) => self.indexOf(value) === index);

  // Filter tools based on search, category, subcategory, pricing, and favorites
  const filteredTools = aiTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'All' || tool.subcategory === selectedSubcategory;
    const matchesPricing = selectedPricing === 'All' || tool.pricing === selectedPricing;
    const matchesFavorites = !showFavoritesOnly || favorites.has(tool.id);
    return matchesSearch && matchesCategory && matchesSubcategory && matchesPricing && matchesFavorites;
  });

  // Sort tools by rating or name
  const sortedTools = [...filteredTools].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Language Models': return <FileTextOutlined />;
      case 'Content Generation': return <ExperimentOutlined />;
      case 'Sales & Marketing': return <RocketOutlined />;
      case 'Video & Visual': return <VideoCameraOutlined />;
      case 'Audio & Voice': return <AudioOutlined />;
      case 'Code & Development': return <CodeOutlined />;
      case 'Business & Productivity': return <ToolOutlined />;
      case 'UGC & Content': return <FileTextOutlined />;
      case 'Research & Analysis': return <ExperimentOutlined />;
      default: return <ToolOutlined />;
    }
  };

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'Free': return 'green';
      case 'Freemium': return 'blue';
      case 'Paid': return 'orange';
      case 'Enterprise': return 'purple';
      default: return 'default';
    }
  };
const getAffiliateStatusColor = (status: string) => {
  return 'green';
};

  const toggleFavorite = (toolId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(toolId)) {
      newFavorites.delete(toolId);
    } else {
      newFavorites.add(toolId);
    }
    setFavorites(newFavorites);
  };

  const handleToolClick = (tool: AITool) => {
    setSelectedTool(tool);
    setIsModalVisible(true);
  };

 const handleTryTool = (e: React.MouseEvent, tool: AITool) => {
  e.stopPropagation();
  // Use optional chaining to safely access affiliateLink
  if (tool.affiliateLink) {
    window.open(tool.affiliateLink, '_blank');
  } else {
    window.open(tool.url, '_blank');
  }
};

  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f5f5f5',
      padding: 24,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space align="center" size="middle">
          <div style={{
            background: 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)',
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ThunderboltOutlined style={{ fontSize: 24, color: 'white' }} />
          </div>
          <div>
            <Title
              level={2}
              style={{
                margin: 0,
                color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                fontWeight: 700
              }}
            >
              AI Tools Library
            </Title>
            <Text
              style={{
                color: theme === 'dark' ? '#9ca3af' : '#666666',
                fontSize: 16
              }}
            >
              Discover {aiTools.length}+ AI tools with affiliate programs
            </Text>
          </div>
        </Space>
      </div>

      {/* Search and Filters */}
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
          borderRadius: 12,
          boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Search
            placeholder="Search AI tools by name, description or tags..."
            allowClear
            enterButton={<Button type="primary" icon={<SearchOutlined />}>Search</Button>}
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ borderRadius: 8 }}
          />
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8, color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                  Category
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  suffixIcon={<FilterOutlined />}
                >
                  <Option value="All">All Categories</Option>
                  {categories.map(category => (
                    <Option key={category} value={category}>
                      <Space>
                        {getCategoryIcon(category)}
                        {category}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8, color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                  Subcategory
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={selectedSubcategory}
                  onChange={setSelectedSubcategory}
                  disabled={selectedCategory === 'All'}
                >
                  <Option value="All">All Subcategories</Option>
                  {subcategories
                    .filter(sub => selectedCategory === 'All' || aiTools.some(t => t.category === selectedCategory && t.subcategory === sub))
                    .map(subcategory => (
                      <Option key={subcategory} value={subcategory}>{subcategory}</Option>
                    ))}
                </Select>
              </div>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8, color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                  Pricing
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={selectedPricing}
                  onChange={setSelectedPricing}
                  suffixIcon={<DollarOutlined />}
                >
                  <Option value="All">All Pricing</Option>
                  <Option value="Free">Free</Option>
                  <Option value="Freemium">Freemium</Option>
                  <Option value="Paid">Paid</Option>
                  <Option value="Enterprise">Enterprise</Option>
                </Select>
              </div>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8, color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                  Sort & Filter
                </Text>
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    style={{ width: '60%' }}
                    value={sortBy}
                    onChange={setSortBy}
                  >
                    <Option value="rating">
                      <Space>
                        <StarOutlined />
                        Rating
                      </Space>
                    </Option>
                    <Option value="name">Name (A-Z)</Option>
                  </Select>
                  <Button
                    style={{ width: '40%' }}
                    type={showFavoritesOnly ? 'primary' : 'default'}
                    icon={<StarOutlined />}
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  >
                    Favs
                  </Button>
                </Space.Compact>
              </div>
            </Col>
          </Row>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">
              Showing {sortedTools.length} of {aiTools.length} AI tools
            </Text>
            <Button 
              type="link" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedSubcategory('All');
                setSelectedPricing('All');
                setShowFavoritesOnly(false);
              }}
            >
              Clear all filters
            </Button>
          </div>
        </Space>
      </Card>

      {/* Tools Grid */}
      {sortedTools.length > 0 ? (
        <Row gutter={[24, 24]}>
          {sortedTools.map(tool => {
            const displayedFeatures = tool.features.slice(0, 3);
            const remainingFeaturesCount = tool.features.length - 3;
            
            return (
              <Col key={tool.id} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  hoverable
                  onClick={() => handleToolClick(tool)}
                  style={{
                    height: '100%',
                    backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.06)'
                  }}
                  bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: 16 }}
                 // Replace the Card cover section with this updated version
cover={
  <div style={{ 
    height: 140, 
    overflow: 'hidden', 
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    background: theme === 'dark' ? '#1f2937' : '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  }}>
    <Image
      alt={tool.name}
      src={tool.imageUrl || 'https://via.placeholder.com/150?text=Logo'}
      fallback="https://via.placeholder.com/150?text=Logo"
      preview={false}
      style={{ 
        maxWidth: '80%', 
        maxHeight: '80%', 
        objectFit: 'contain' 
      }}
    />
    <div style={{ 
      position: 'absolute', 
      top: 12, 
      right: 12, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 8 
    }}>
      <Tag
        color={getPricingColor(tool.pricing)}
        style={{ margin: 0, fontWeight: 600 }}
      >
        {tool.pricing}
      </Tag>
      {tool.affiliateStatus?.includes('Active') && (
        <Tooltip title={tool.affiliateStatus}>
          <Tag
            color="green"
            style={{ margin: 0 }}
            icon={<CheckOutlined />}
          >
            Affiliate
          </Tag>
        </Tooltip>
      )}
    </div>
  </div>
}
                  actions={[
                    <div key={`actions-${tool.id}`} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '0 16px',
                      alignItems: 'center'
                    }}>
                      <Button
                        icon={<StarOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tool.id);
                        }}
                        type={favorites.has(tool.id) ? 'primary' : 'text'}
                        style={{
                          color: favorites.has(tool.id) ? '#ffc107' : undefined,
                        }}
                      />

<Button
  type="primary"
  onClick={(e) => handleTryTool(e, tool)}
  icon={tool.affiliateStatus?.includes('Active') ? <LinkOutlined /> : <RocketOutlined />}
  style={{
    backgroundColor: tool.affiliateStatus?.includes('Active') ? '#10b981' : '#3b82f6',
    borderColor: tool.affiliateStatus?.includes('Active') ? '#10b981' : '#3b82f6',
    fontWeight: 600
  }}
>
  {tool.affiliateStatus?.includes('Active') ? 'Get Link' : 'Try Tool'}
</Button>
                    </div>
                  ]}
                >
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: 12 }}>
                      <Text strong style={{ 
                        color: theme === 'dark' ? '#f9fafb' : '#1a1a1a', 
                        fontSize: 16,
                        display: 'block',
                        lineHeight: 1.4
                      }}>
                        {tool.name}
                      </Text>
                      <Paragraph
                        type="secondary"
                        ellipsis={{ rows: 2, expandable: false }}
                        style={{ 
                          marginBottom: 12,
                          fontSize: 13,
                          lineHeight: 1.4,
                          minHeight: 40
                        }}
                      >
                        {tool.description}
                      </Paragraph>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <Rate
                        disabled
                        defaultValue={tool.rating}
                        allowHalf
                        style={{ fontSize: 14 }}
                        character={<StarOutlined />}
                      />
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                        {tool.rating}/5
                      </Text>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Best For:</Text>
                      <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.4 }}>
                        {tool.useCase}
                      </Text>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Key Features:</Text>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {displayedFeatures.map((feature, index) => (
                          <Tag 
                            key={index} 
                            style={{ 
                              margin: 0, 
                              fontSize: 11,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: theme === 'dark' ? '#374151' : '#f3f4f6',
                              border: 'none',
                              color: theme === 'dark' ? '#d1d5db' : '#4b5563'
                            }}
                          >
                            {feature}
                          </Tag>
                        ))}
                        {remainingFeaturesCount > 0 && (
                          <Tag 
                            style={{ 
                              margin: 0, 
                              fontSize: 11,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: theme === 'dark' ? '#374151' : '#f3f4f6',
                              border: 'none',
                              color: theme === 'dark' ? '#d1d5db' : '#4b5563'
                            }}
                          >
                            +{remainingFeaturesCount}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary">
              No AI tools found. Try adjusting your search or filters.
            </Text>
          }
        >
          <Button
            type="primary"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedSubcategory('All');
              setSelectedPricing('All');
              setShowFavoritesOnly(false);
            }}
          >
            Reset Filters
          </Button>
        </Empty>
      )}

      {/* Tool Detail Modal */}
      <Modal
        title={selectedTool?.name}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="try" 
            type="primary" 
            onClick={(e) => selectedTool && handleTryTool(e, selectedTool)}
            icon={selectedTool?.affiliateStatus?.includes('Active') ? <LinkOutlined /> : <RocketOutlined />}
          >
            {selectedTool?.affiliateStatus?.includes('Active') ? 'Get Affiliate Link' : 'Visit Website'}
          </Button>
        ]}
        width={700}
        style={{ top: 20 }}
      >
        {selectedTool && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Image
                src={selectedTool.imageUrl || 'https://via.placeholder.com/150?text=Logo'}
                width={100}
                height={100}
                style={{ objectFit: 'contain', borderRadius: 8 }}
                fallback="https://via.placeholder.com/150?text=Logo"
              />
              <div style={{ flex: 1 }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Description: </Text>
                    <Text>{selectedTool.description}</Text>
                  </div>
                  <div>
                    <Text strong>Rating: </Text>
                    <Rate disabled defaultValue={selectedTool.rating} allowHalf style={{ fontSize: 14 }} />
                    <Text> ({selectedTool.rating}/5)</Text>
                  </div>
                  <div>
                    <Text strong>Pricing: </Text>
                    <Tag color={getPricingColor(selectedTool.pricing)}>
                      {selectedTool.pricing}
                    </Tag>
                  </div>

{selectedTool?.affiliateStatus?.includes('Active') && (
  <div>
    <Text strong>Affiliate Status: </Text>
    <Tag color="green">
      {selectedTool.affiliateStatus}
    </Tag>
  </div>
)}
                </Space>
              </div>
            </div>

            <Divider />

            <Row gutter={24}>
              <Col span={12}>
                <Title level={5}>Pros</Title>
                <List
                  size="small"
                  dataSource={selectedTool.pros}
                  renderItem={(item: string) => (
                    <List.Item>
                      <Text style={{ color: '#52c41a' }}>✓</Text>
                      <Text style={{ marginLeft: 8 }}>{item}</Text>
                    </List.Item>
                  )}
                />
              </Col>
              <Col span={12}>
                <Title level={5}>Cons</Title>
                <List
                  size="small"
                  dataSource={selectedTool.cons}
                  renderItem={(item: string) => (
                    <List.Item>
                      <Text style={{ color: '#ff4d4f' }}>✗</Text>
                      <Text style={{ marginLeft: 8 }}>{item}</Text>
                    </List.Item>
                  )}
                />
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Features</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {selectedTool.features.map((feature, index) => (
                <Tag key={index} color="blue">{feature}</Tag>
              ))}
            </div>

            <Title level={5}>Use Case</Title>
            <Text>{selectedTool.useCase}</Text>

            <Divider />

            <Title level={5}>Categories</Title>
            <Space>
              <Tag>{selectedTool.category}</Tag>
              <Tag>{selectedTool.subcategory}</Tag>
            </Space>

            <Divider />

            <Title level={5}>Tags</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedTool.tags.map((tag, index) => (
                <Tag key={index}>{tag}</Tag>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AIToolsDashboard;