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
  PlusOutlined
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
  Row,
  Col,
  Rate,
  Avatar,
  Image
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

  // Fix for Set iteration (using filter approach for compatibility)
  const categories = aiTools
    .map(tool => tool.category)
    .filter((value, index, self) => self.indexOf(value) === index);

  const subcategories = aiTools
    .map(tool => tool.subcategory)
    .filter((value, index, self) => self.indexOf(value) === index);

  
// Modify your filteredTools logic to include favorites filter
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

  const toggleFavorite = (toolId: string) => {
  const newFavorites = new Set(favorites);
  if (newFavorites.has(toolId)) {
    newFavorites.delete(toolId);
  } else {
    newFavorites.add(toolId);
  }
  setFavorites(newFavorites);
};

  // Function to get a placeholder image URL based on category or a default one
  // You might want to replace this with actual image URLs from your data source
  const getToolImageUrl = (tool: AITool): string => {
    // Example mapping - replace with your logic or actual image URLs
    const categoryImageMap: Record<string, string> = {
      'Language Models': 'https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png', // Placeholder AI Brain
      'Video & Visual': 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png', // Placeholder Video
      'Audio & Voice': 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png', // Placeholder Audio
      'Code & Development': 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IO%2402/ssdd.jpg', // Placeholder Code
      // Add more mappings as needed
    };

    // Try to get image based on category first
    const categoryImage = categoryImageMap[tool.category];
    if (categoryImage) {
      return categoryImage;
    }

    // Fallback: Try subcategory
    const subcategoryImageMap: Record<string, string> = {
        'AI Assistants': 'https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png', // Placeholder AI Brain
        'Image Generation': 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png', // Placeholder Video
        'Voice Synthesis': 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png', // Placeholder Audio
        'Code Generation': 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IO%2402/ssdd.jpg', // Placeholder Code
         // Add more mappings as needed
    };
    const subcategoryImage = subcategoryImageMap[tool.subcategory];
    if (subcategoryImage) {
        return subcategoryImage;
    }

    // Default placeholder image if no specific one found
    return 'https://gw.alipayobjects.com/zos/rmsportal/uMfMFlvUuceEyPpotzlq.png'; // Generic placeholder
  };

  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: 24,
      minHeight: '100vh'
    }}>
      {/* Header */}
    <div style={{ marginBottom: 24 }}>
  <Space align="center" size="middle">
    <ThunderboltOutlined
      style={{
        fontSize: 18,
        color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
      }}
    />
    <Title
      level={2}
      style={{
        margin: 0,
        color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
      }}
    >
      AI Tools Library
    </Title>
  </Space>

  <div style={{ marginTop: 8 }}>
    <Text
      style={{
        color: theme === 'dark' ? '#9ca3af' : '#666666',
      }}
    >
      Discover the best AI tools for every business need
    </Text>
  </div>
</div>


      {/* Search and Filters */}
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
          borderColor: theme === 'dark' ? '#374151' : '#f0f0f0'
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Search
            placeholder="Search AI tools by name, description or tags..."
            allowClear
            enterButton={<Button type="primary">Search</Button>}
            size="large"
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Space wrap>
            <Select
              placeholder="Filter by category"
              style={{ width: 200 }}
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
            <Select
              placeholder="Filter by subcategory"
              style={{ width: 200 }}
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
            <Button
  type={showFavoritesOnly ? 'primary' : 'default'}
  icon={<StarOutlined />}
  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
  style={{
    color: showFavoritesOnly ? '#ffc107' : undefined,
    borderColor: showFavoritesOnly ? '#ffc107' : undefined,
    backgroundColor: showFavoritesOnly ? 'rgba(255, 193, 7, 0.1)' : undefined
  }}
>
  Favorites
</Button>
            <Select
              placeholder="Filter by pricing"
              style={{ width: 200 }}
              value={selectedPricing}
              onChange={setSelectedPricing}
              suffixIcon={<DollarOutlined />}
            >
              <Option value="All">All Pricing Models</Option>
              <Option value="Free">Free</Option>
              <Option value="Freemium">Freemium</Option>
              <Option value="Paid">Paid</Option>
              <Option value="Enterprise">Enterprise</Option>
            </Select>
            <Select
              placeholder="Sort by"
              style={{ width: 200 }}
              value={sortBy}
              onChange={setSortBy}
            >
              <Option value="rating">
                <Space>
                  <StarOutlined />
                  Rating (High to Low)
                </Space>
              </Option>
              <Option value="name">Name (A-Z)</Option>
            </Select>
          </Space>
          <Text type="secondary">
            Showing {sortedTools.length} of {aiTools.length} AI tools
          </Text>
        </Space>
        
      </Card>

      

      {/* Tools Grid - Changed to 3 per row (xl={8}) */}
      {sortedTools.length > 0 ? (
        <Row gutter={[24, 24]}> {/* Increased gutter for more spacing */}
          {sortedTools.map(tool => {
            const displayedFeatures = tool.features.slice(0, 3);
            const remainingFeaturesCount = tool.features.length - 3;
            return (
              <Col key={tool.id} xs={24} sm={12} lg={8} xl={8}> {/* 3 per row on large screens */}
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
                    borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                  // Add image at the top using cover prop
                  cover={
                    <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                      <Image
                        alt={tool.name}
                        src={getToolImageUrl(tool)} // Use the helper function
                        fallback="https://gw.alipayobjects.com/zos/rmsportal/uMfMFlvUuceEyPpotzlq.png" // Fallback image
                        preview={false} // Disable lightbox preview for simplicity
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* Pricing Tag overlay */}
                      <Tag
                        color={getPricingColor(tool.pricing)}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1
                        }}
                      >
                        {tool.pricing}
                      </Tag>
                    </div>
                  }
                  // Action button at the bottom
            actions={[
  <div key={`actions-${tool.id}`} style={{ 
    display: 'flex', 
    justifyContent: 'center',
    gap: 8,
    padding: '0 8px'
  }}>
    <Button
      icon={<StarOutlined />}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(tool.id);
      }}
      type={favorites.has(tool.id) ? 'primary' : 'default'}
      style={{
        width: 48,
        color: favorites.has(tool.id) ? '#ffc107' : undefined,
        borderColor: favorites.has(tool.id) ? '#ffc107' : undefined,
        backgroundColor: favorites.has(tool.id) ? 'rgba(255, 193, 7, 0.1)' : undefined
      }}
    />
    <Button
      type="primary"
      href={tool.url}
      target="_blank"
      icon={<RocketOutlined />}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 'calc(100% - 56px)', // 48px for star button + 8px gap
        backgroundColor: '#15140f',
        borderColor: '#343436'
      }}
    >
      Try Tool
    </Button>
  </div>
]}
                >
                  <Card.Meta
                   // Avatar removed as image is now on top
                    title={
                      <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a', fontSize: 18 }}>
                        {tool.name}
                      </Text>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {/* Simplified description display */}
                        <Paragraph
                          type="secondary"
                          ellipsis={{ rows: 2, expandable: false, symbol: 'more' }}
                          style={{ marginBottom: 8 }}
                        >
                          {tool.description}
                        </Paragraph>
                        <Rate
                          disabled
                          defaultValue={tool.rating}
                          allowHalf
                          style={{ fontSize: 14 }}
                          character={<StarOutlined />}
                        />

                        {/* Best For */}
                        <div>
                          <Text strong style={{ fontSize: 14 }}>Best For:</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 13 }}>{tool.useCase}</Text>
                        </div>

                        {/* Key Features */}
                        <div>
                          <Text strong style={{ fontSize: 14 }}>Key Features:</Text>
                          <br />
                          <Space wrap size={[0, 4]} style={{ marginTop: 4 }}>
                            {displayedFeatures.map((feature, index) => (
                              <Tag key={index} style={{ margin: 0, marginRight: 4, marginBottom: 4 }}>{feature}</Tag>
                            ))}
                            {remainingFeaturesCount > 0 && (
                              <Tag icon={<PlusOutlined />} style={{ margin: 0, marginRight: 4, marginBottom: 4 }}>
                                {remainingFeaturesCount}
                              </Tag>
                            )}
                          </Space>
                        </div>

                        {/* Categories */}
                        <div>
                          <Text strong style={{ fontSize: 14 }}>Categories:</Text>
                          <br />
                          <Space wrap size={[0, 4]} style={{ marginTop: 4 }}>
                            <Tag style={{ margin: 0, marginRight: 4, marginBottom: 4 }}>{tool.category}</Tag>
                            <Tag style={{ margin: 0, marginRight: 4, marginBottom: 4 }}>{tool.subcategory}</Tag>
                          </Space>
                        </div>
                      </Space>
                    }
                  />
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
            }}
          >
            Reset Filters
          </Button>
        </Empty>
      )}
    </div>
  );
};

export default AIToolsDashboard;