"use client";

import React, { useState } from 'react';
import { 
  SearchOutlined,
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  TagsOutlined,
  FireOutlined,
  StarOutlined,
  ClockCircleOutlined,
  UpOutlined,
  DownOutlined

} from '@ant-design/icons';
import { 
  Input, 
  Card, 
  Button, 
  Typography, 
  Tag, 
  Divider, 
  Space, 
  Row, 
  Col,
  Select,
  Badge,
  Tooltip,
  Collapse,
  Popover
} from 'antd';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Panel } = Collapse;



const promptTemplates = [
  {
    id: 1,
    title: "Viral TikTok Content Strategist",
    description: "A structured, multi-phase guide to assessing creators and developing TikTok content strategies that maximize engagement, retention, and shareability",
    shortDescription: "SYSTEM: You are a viral content strategist who understands the exact mechanics of TikTok's algorithm.djjddjdbnjdjdnjndjndjndjdnjdnjdnjddnjdnjdjdnjdndjdn..",
    tags: ["TikTok", "Content Generation", "Social Media Marketing"],
    category: "Content Creation",
    downloads: 342,
    copyCount: 1287,
    integrations: ["ChatGPT", "Claude", "Gemini"]
  },
  {
    id: 2,
    title: "Surprising Industry Facts Researcher",
    description: "System to uncover counterintuitive facts that make people stop scrolling and share content",
    shortDescription: "SYSTEM: You are a research expert who uncovers counterintuitive and surprising facts...",
    tags: ["Content Strategy", "Research Framework", "Viral Video"],
    category: "Research",
    downloads: 215,
    copyCount: 892,
    integrations: ["ChatGPT", "Perplexity"]
  },
  {
    id: 3,
    title: "Hook-Problem-Solution Script Guide",
    description: "Expert storytelling copywriter prompt for persuasive marketing narratives",
    shortDescription: "SYSTEM: You are an expert storytelling copywriter specializing in persuasive...",
    tags: ["Marketing", "Copywriting", "Persuasive Narrative"],
    category: "Copywriting",
    downloads: 187,
    copyCount: 754,
    integrations: ["ChatGPT", "Claude"]
  },
  // Add more prompt objects...
];

const popularTags = [
  { name: "Content Creation", count: 42 },
  { name: "Marketing", count: 38 },
  { name: "Copywriting", count: 31 },
  { name: "Research", count: 25 },
  { name: "Social Media", count: 29 },
  { name: "Sales", count: 18 },
  { name: "SEO", count: 12 },
  { name: "Video Scripts", count: 15 }
];

const categories = [
  "Content Creation",
  "Marketing",
  "Copywriting",
  "Research",
  "Social Media",
  "Sales",
  "Productivity"
];





import { useTheme } from '../../providers/ThemeProvider';
import { color } from 'framer-motion';



const PromptCard = ({ prompt }) => {
  const [showFullSystem, setShowFullSystem] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { theme } = useTheme(); // Access current theme

  // Determine dynamic classes based on theme
  const isDark = theme === 'dark';

  return (
    <Card
      hoverable
      className={`h-full flex flex-col border border-solid ${
        isDark ? 'border-gray-700 bg-zinc-900' : 'border-gray-200 bg-white'
      } ${isDark ? 'hover:border-blue-500' : 'hover:border-blue-300'}`}
      bodyStyle={{ 
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
      actions={[
        <div key="actions" className="flex justify-center space-x-6 py-2">
        <Button 
  type="text" 
  icon={<CopyOutlined />}
  className={`flex items-center justify-center border ${
    isDark 
      ? 'bg-black text-white hover:border-blue-400' 
      : 'bg-white text-black hover:border-blue-300'
  }`}
  key="copy"
>
  Copy Prompt
</Button>

<Button 
  type="text" 
  icon={<DownloadOutlined />}
  className={`flex items-center justify-center border ${
    isDark 
      ? 'bg-black text-white hover:border-blue-400' 
      : 'bg-white text-black hover:border-blue-300'
  }`}
  key="download"
>
  Download
</Button>

        </div>
      ]}
    >
      {/* Content container that grows to fill available space */}
      <div className="flex flex-col h-full">
        
        {/* Fixed height title section */}
        <div className="min-h-[3rem] mb-3">
          <Title 
            level={4} 
            className={`mb-0 font-semibold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {prompt.title}
          </Title>
        </div>
        
        {/* System Prompt Preview - fixed height container */}
        <div 
          className={`p-4 rounded-md mb-3 border border-solid min-h-[6rem] ${
            isDark ? 'bg-black border-gray-700' : 'bg-gray-50 border-gray-100'
          }`}
        >
          <div className="flex flex-col h-full">
            <Text 
              className={`font-mono text-sm flex-grow ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
            >
              {showFullSystem 
                ? prompt.shortDescription 
                : `${prompt.shortDescription.substring(0, 100)}...`}
            </Text>
            <Button 
              type="text" 
              size="small"
              icon={showFullSystem ? <UpOutlined /> : <DownOutlined />}
              onClick={() => setShowFullSystem(!showFullSystem)}
              className={`p-0 self-start mt-2 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}
            >
              {showFullSystem ? 'Show less' : 'Show more'}
            </Button>
          </div>
        </div>

        {/* Description with expand toggle - flexible height but contained */}
        <div className="flex-grow mb-4">
          <div className="mb-2">
            <Text 
              type={isDark ? undefined : "secondary"} 
              className={`${expanded ? '' : 'line-clamp-3'} ${isDark ? 'text-gray-300' : ''}`}
            >
              {prompt.description}
            </Text>
          </div>
          <Button 
            type="text" 
            size="small"
            onClick={() => setExpanded(!expanded)}
            className={`p-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        </div>

        {/* Tags - fixed position from bottom */}
        <div className="mb-4">
          <Space size={[0, 8]} wrap>
            {prompt.tags.map(tag => (
              <Tag 
                key={tag} 
                className={`cursor-pointer ${isDark ? '!bg-gray-700 !text-gray-200' : ''}`}
              >
                {tag}
              </Tag>
            ))}
          </Space>
        </div>

        {/* Stats Bar - always at bottom of card content */}
        <div 
          className={`flex justify-between items-center px-4 py-3 rounded-md border border-solid mt-auto ${
            isDark ? 'bg-black border-gray-700' : 'bg-gray-50 border-gray-100'
          }`}
        >
          <div className="flex space-x-4">
            <Tooltip title="Downloads">
              <div className="flex items-center">
                <DownloadOutlined className={`mr-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <Text className={`text-sm ${isDark ? 'text-gray-300' : ''}`}>
                  {prompt.downloads}
                </Text>
              </div>
            </Tooltip>
            <Tooltip title="Copies">
              <div className="flex items-center">
                <CopyOutlined className={`mr-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <Text className={`text-sm ${isDark ? 'text-gray-300' : ''}`}>
                  {prompt.copyCount}
                </Text>
              </div>
            </Tooltip>
          </div>
          
         <Button 
  type="primary" 
  size="small"
  icon={<CopyOutlined />}
  className={isDark ? 'bg-blue-600 hover:bg-blue-500 border-blue-500' : ''}
>
  Use Prompt
</Button>
        </div>
      </div>
    </Card>
  );
};



const PromptDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState('popular');

  const filteredPrompts = promptTemplates.filter(prompt => {
    // Search term filter
    const matchesSearch = 
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Tag filter
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => prompt.tags.includes(tag));
    
    // Category filter
    const matchesCategory = !selectedCategory || 
      prompt.category === selectedCategory;
    
    return matchesSearch && matchesTags && matchesCategory;
  });

  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    if (sortBy === 'popular') return b.downloads - a.downloads;
    if (sortBy === 'newest') return b.id - a.id;
    if (sortBy === 'copied') return b.copyCount - a.copyCount;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <ThunderboltOutlined className="mr-2" />
          AI Prompt Directory
        </Title>
        <Text type="secondary" className="text-lg">
          Discover ready-to-use prompts to automate your business processes
        </Text>
      </div>

      <div className="mb-8">
        <Search
          placeholder="Search prompts..."
          allowClear
          enterButton={<Button type="primary">Search</Button>}
          size="large"
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />

        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <Select
              placeholder="Filter by category"
              style={{ width: 200 }}
              onChange={setSelectedCategory}
              allowClear
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>

            <Select
              mode="multiple"
              placeholder="Filter by tags"
              style={{ width: 250 }}
              onChange={setSelectedTags}
              suffixIcon={<TagsOutlined />}
              allowClear
            >
              {popularTags.map(tag => (
                <Option key={tag.name} value={tag.name}>
                  {tag.name} <Text type="secondary">({tag.count})</Text>
                </Option>
              ))}
            </Select>

            <Button 
              icon={<FilterOutlined />} 
              onClick={() => {
                setSelectedTags([]);
                setSelectedCategory('');
                setSearchTerm('');
              }}
            >
              Clear Filters
            </Button>
          </div>

          <Select
            defaultValue="popular"
            style={{ width: 150 }}
            onChange={setSortBy}
            suffixIcon={<FireOutlined />}
          >
            <Option value="popular">Most Popular</Option>
            <Option value="copied">Most Copied</Option>
            <Option value="newest">Newest First</Option>
          </Select>
        </div>
      </div>

      <Divider />

     <Row gutter={[16, 16]}>
  {sortedPrompts.map(prompt => (
    <Col xs={24} sm={12} lg={8} key={prompt.id}>
      <PromptCard prompt={prompt} />
    </Col>
  ))}
</Row>

      {sortedPrompts.length === 0 && (
        <div className="text-center py-12">
          <Title level={4}>No prompts found</Title>
          <Text type="secondary">Try adjusting your search or filters</Text>
        </div>
      )}

      <Divider />

      <div className="text-center">
        <Title level={4} className="mb-2">
          Want to contribute your own prompt?
        </Title>
        <Text type="secondary" className="block mb-4">
          Join our community and share your best AI prompts
        </Text>
        <Space>
          <Button type="primary">Submit Prompt</Button>
          <Button>Browse Community</Button>
        </Space>
      </div>
    </div>
  );
};

export default PromptDirectory;