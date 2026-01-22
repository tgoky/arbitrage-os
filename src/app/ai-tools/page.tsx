// app/ai-tools/page.tsx

"use client";

import React, { useState } from 'react';

import { Manrope } from 'next/font/google'; // 1. Import Manrope

import {
  SearchOutlined,
  StarFilled,
  RocketOutlined,
  ExperimentOutlined,
  CodeOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  FileTextOutlined,
  ToolOutlined,
  FilterOutlined,
  LinkOutlined,
  // ArrowLeftOutlined, // Removed unused import
  HeartOutlined,
  HeartFilled,
  CheckCircleFilled
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
  Tabs,
  ConfigProvider,
  theme as antTheme
} from 'antd';

import { useTheme } from '../../providers/ThemeProvider';
import { AITool, aiTools } from './aitoolbank/aitoolbanks';
import { useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { useAIToolFavorites } from '../hooks/useAIToolFavorites';

// 2. Configure Font
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

// Custom Space Color
const BRAND_COLOR = '#9DA2B3'; 

const AIToolsDashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [selectedPricing, setSelectedPricing] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating');
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const { currentWorkspace } = useWorkspaceContext();
  const { favorites, toggleFavorite, isFavorite, user } = useAIToolFavorites();
  const router = useRouter();

  // Data Processing
  const categories = aiTools
    .map(tool => tool.category)
    .filter((value, index, self) => self.indexOf(value) === index);

  const subcategories = aiTools
    .map(tool => tool.subcategory)
    .filter((value, index, self) => self.indexOf(value) === index);

  const filteredTools = aiTools.filter(tool => {
    let tabMatch = activeTab === 'all' ? true : favorites.includes(tool.id);
    if (!tabMatch) return false;

    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch && 
      (selectedCategory === 'All' || tool.category === selectedCategory) &&
      (selectedSubcategory === 'All' || tool.subcategory === selectedSubcategory) &&
      (selectedPricing === 'All' || tool.pricing === selectedPricing);
  });

  const sortedTools = [...filteredTools].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  // Helper Functions
  const getCategoryIcon = (category: string) => {
    const iconStyle = { fontSize: 16 };
    switch (category) {
      case 'Language Models': return <FileTextOutlined style={iconStyle} />;
      case 'Content Generation': return <ExperimentOutlined style={iconStyle} />;
      case 'Sales & Marketing': return <RocketOutlined style={iconStyle} />;
      case 'Video & Visual': return <VideoCameraOutlined style={iconStyle} />;
      case 'Audio & Voice': return <AudioOutlined style={iconStyle} />;
      case 'Code & Development': return <CodeOutlined style={iconStyle} />;
      default: return <ToolOutlined style={iconStyle} />;
    }
  };

  const getPricingTagColor = (pricing: string) => {
    // Minimalist colors
    if (isDark) {
        switch (pricing) {
            case 'Free': return 'green';
            case 'Freemium': return 'cyan';
            case 'Paid': return 'orange';
            default: return 'default';
        }
    }
    // Light mode - use cleaner preset keywords or hex
    switch (pricing) {
      case 'Free': return 'success';
      case 'Freemium': return 'processing';
      case 'Paid': return 'warning';
      case 'Enterprise': return 'purple';
      default: return 'default';
    }
  };

  const handleToolClick = (tool: AITool) => {
    setSelectedTool(tool);
    setIsModalVisible(true);
  };

  const handleTryTool = (e: React.MouseEvent, tool: AITool) => {
    e.stopPropagation();
    const link = tool.affiliateLink || tool.url;
    window.open(link, '_blank');
  };

  // --- Theme Configuration for Ant Design ---
  const themeConfig = {
    algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      fontFamily: `var(--font-manrope), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`,
      colorPrimary: BRAND_COLOR,
      borderRadius: 6, // Sharper, premium corners
      colorBgContainer: isDark ? '#141414' : '#ffffff',
      colorBorder: isDark ? '#303030' : '#EAEAEA',
    },
    components: {
      Button: {
        fontWeight: 600,
        primaryColor: isDark ? '#000' : '#000', // Text color on primary button
        colorPrimary: BRAND_COLOR, 
        colorPrimaryHover: isDark ? '#B0B5C6' : '#8A8F9F',
      },
      Card: {
        boxShadow: 'none', // Flat design
        colorBorderSecondary: isDark ? '#303030' : '#EAEAEA',
      },
      Tag: {
        fontSize: 12,
        fontWeight: 500,
      },
      Input: {
        controlHeightLG: 48,
        colorBgContainer: isDark ? '#000' : '#fff',
      },
      Select: {
        controlHeight: 40,
        colorBgContainer: isDark ? '#000' : '#fff',
      }
    }
  };

  // --- Sub-Components ---

  const SearchAndFilters = ({ isAllTab = true }) => (
    <div className="mb-8">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Search
          placeholder={isAllTab ? "Search AI tools..." : "Search favorites..."}
          allowClear
          enterButton={
            <Button type="primary" style={{ padding: '0 32px' }}>
              Search
            </Button>
          }
          size="large"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="premium-search"
        />

        <Row gutter={[16, 16]}>
          {[
            { 
              label: 'Category', 
              value: selectedCategory, 
              setter: setSelectedCategory, 
              options: categories, 
              icon: <FilterOutlined /> 
            },
            { 
              label: 'Subcategory', 
              value: selectedSubcategory, 
              setter: setSelectedSubcategory, 
              options: subcategories.filter(sub => selectedCategory === 'All' || aiTools.some(t => t.category === selectedCategory && t.subcategory === sub)), 
              disabled: selectedCategory === 'All' 
            },
            { 
              label: 'Pricing', 
              value: selectedPricing, 
              setter: setSelectedPricing, 
              options: ['Free', 'Freemium', 'Paid', 'Enterprise'], 
              isStatic: true 
            },
            { 
              label: 'Sort By', 
              value: sortBy, 
              setter: setSortBy, 
              options: [{ val: 'rating', label: 'Rating' }, { val: 'name', label: 'Name (A-Z)' }], 
              isCustomObj: true 
            }
          ].map((filter, idx) => (
            <Col xs={24} sm={12} md={6} key={idx}>
              <div className="flex flex-col gap-2">
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {filter.label}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={filter.value}
                  onChange={filter.setter}
                  disabled={filter.disabled}
                  variant="borderless" // Cleaner look
                  className={`border ${isDark ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} rounded-md px-1`}
                >
                  <Option value={filter.label === 'Sort By' ? 'rating' : 'All'}>
                    {filter.label === 'Sort By' ? 'Rating' : `All ${filter.label === 'Category' ? 'Categories' : ''}`}
                  </Option>
                  
                  {filter.isCustomObj 
                    ? filter.options.map((opt: any) => <Option key={opt.val} value={opt.val}>{opt.label}</Option>)
                    : filter.isStatic 
                      ? filter.options.map((opt: any) => <Option key={opt} value={opt}>{opt}</Option>)
                      : filter.options.map((opt: any) => <Option key={opt} value={opt}>{opt}</Option>)
                  }
                </Select>
              </div>
            </Col>
          ))}
        </Row>
      </Space>
    </div>
  );

  return (
    <ConfigProvider theme={themeConfig}>
      <div className={`${manrope.className} min-h-screen p-6 md:p-8 transition-colors duration-300`}
        style={{ backgroundColor: isDark ? '#050505' : '#FAFAFA' }}
      >
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
            {/* Updated back button */}
            <Button 
                type="text" 
                size="small"
                onClick={() => router.push(`/dashboard/${currentWorkspace?.slug}`)}
                className="hover:bg-transparent pl-0 text-sm font-medium"
                style={{ color: isDark ? BRAND_COLOR : '#666' }} // Subtle color
            >
                ← Back
            </Button>
        </div>

        {/* Header Section */}
        <div className="mb-10">
          <Row justify="space-between" align="bottom">
            <Col>
                {/* Updated title */}
                <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em', fontSize: '2rem' }}>
                  Tool Library
                </Title>
                <Paragraph style={{ margin: '8px 0 0', fontWeight: 400, color: isDark ? '#888' : '#666', fontSize: '1.1em' }}>
                    Discover and manage powerful AI tools
                </Paragraph>
            </Col>
            <Col>
                <div className={`px-4 py-2 rounded-full border ${isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'} text-sm`}>
                    {aiTools.length} Curated Tools
                </div>
            </Col>
          </Row>
        </div>

        {/* Main Content Area */}
        <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
                {
                    key: 'all',
                    label: 'Discover',
                    children: (
                        <>
                            <SearchAndFilters isAllTab={true} />
                            <div className="mt-6">
                                {ToolsGrid({ 
                                    tools: sortedTools, 
                                    loading: false, 
                                    isDark, 
                                    handleToolClick, 
                                    handleTryTool, 
                                    toggleFavorite, 
                                    isFavorite, 
                                    getPricingTagColor 
                                })}
                            </div>
                        </>
                    )
                },
                {
                    key: 'favorites',
                    label: (
                        <span className="flex items-center gap-2">
                            <HeartFilled style={{ color: '#ff4d4f' }} /> Favorites
                        </span>
                    ),
                    children: (
                        <>
                             <SearchAndFilters isAllTab={false} />
                             <div className="mt-6">
                                {ToolsGrid({ 
                                    tools: sortedTools, 
                                    loading: false, 
                                    isDark, 
                                    handleToolClick, 
                                    handleTryTool, 
                                    toggleFavorite, 
                                    isFavorite, 
                                    getPricingTagColor 
                                })}
                             </div>
                        </>
                    )
                }
            ]}
        />

        {/* Detail Modal */}
        <Modal
          title={null}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={700}
          centered
          className="premium-modal"
          bodyStyle={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}
        >
          {selectedTool && (
            <div className={`${isDark ? 'bg-[#141414]' : 'bg-white'}`}>
                {/* Modal Header Image Area */}
                <div className={`p-8 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex items-start gap-6`}>
                     <div className={`w-24 h-24 rounded-xl flex items-center justify-center p-2 border ${isDark ? 'border-gray-700 bg-black' : 'border-gray-100 bg-gray-50'}`}>
                        <Image
                            src={selectedTool.imageUrl || 'https://via.placeholder.com/150'}
                            preview={false}
                            className="object-contain"
                        />
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <Title level={3} style={{ margin: 0 }}>{selectedTool.name}</Title>
                            <Space>
                                <Button 
                                    icon={isFavorite(selectedTool.id) ? <HeartFilled /> : <HeartOutlined />}
                                    onClick={() => toggleFavorite(selectedTool.id)}
                                    danger={isFavorite(selectedTool.id)}
                                />
                            </Space>
                        </div>
                        <div className="mt-2 flex gap-2">
                             <Tag color={getPricingTagColor(selectedTool.pricing)} bordered={false}>
                                {selectedTool.pricing}
                             </Tag>
                             <Tag bordered={false}>{selectedTool.category}</Tag>
                        </div>
                        <Paragraph className="mt-4 mb-0 text-base" type="secondary">
                            {selectedTool.description}
                        </Paragraph>
                     </div>
                </div>

                {/* Modal Content */}
                <div className="p-8">
                    <Row gutter={[32, 32]}>
                        <Col span={24}>
                            <div className="flex gap-4">
                                 <Button 
                                    type="primary" 
                                    size="large" 
                                    block 
                                    onClick={(e) => handleTryTool(e, selectedTool)}
                                    icon={<RocketOutlined />}
                                    style={{ height: 50, fontSize: 16 }}
                                 >
                                    {selectedTool.affiliateStatus?.includes('Active') ? 'Visit via Partner Link' : 'Visit Website'}
                                 </Button>
                            </div>
                        </Col>

                        <Col span={24}>
                            <Title level={5}>Best Used For</Title>
                            <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-800 bg-black' : 'border-gray-100 bg-gray-50'}`}>
                                <Text>{selectedTool.useCase}</Text>
                            </div>
                        </Col>

                        <Col span={12}>
                            <Title level={5}>Pros</Title>
                            <List
                                size="small"
                                dataSource={selectedTool.pros}
                                renderItem={(item: string) => (
                                    <List.Item className="!px-0 !border-0">
                                        <Space align="start">
                                            <CheckCircleFilled style={{ color: '#52c41a', marginTop: 4 }} />
                                            <Text type="secondary">{item}</Text>
                                        </Space>
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
                                    <List.Item className="!px-0 !border-0">
                                        <Space align="start">
                                            <div className="w-3 h-1 bg-red-400 mt-2.5 rounded-full" />
                                            <Text type="secondary">{item}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </Col>
                        
                        <Col span={24}>
                            <Divider style={{ margin: '12px 0 24px' }} />
                            <Title level={5} className="mb-4">Features</Title>
                            <div className="flex flex-wrap gap-2">
                                {selectedTool.features.map((f, i) => (
                                    <Tag key={i} className="py-1 px-3 m-0 text-sm">
                                        {f}
                                    </Tag>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
};

// Extracted for cleanliness
const ToolsGrid = ({ tools, isDark, handleToolClick, handleTryTool, toggleFavorite, isFavorite, getPricingTagColor }: any) => {
    if (tools.length === 0) return (
        <Empty description="No tools found matching your criteria" className="py-20" />
    );

    return (
        <Row gutter={[24, 24]}>
            {tools.map((tool: AITool) => (
                <Col key={tool.id} xs={24} sm={12} lg={8} xl={6}>
                    <Card
                        hoverable
                        onClick={() => handleToolClick(tool)}
                        className="h-full flex flex-col transition-all duration-300 hover:-translate-y-1"
                        style={{ 
                            border: isDark ? '1px solid #303030' : '1px solid #F0F0F0',
                            background: isDark ? '#141414' : '#FFFFFF'
                        }}
                        bodyStyle={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-lg p-1.5 flex items-center justify-center border ${isDark ? 'border-gray-800 bg-black' : 'border-gray-100 bg-gray-50'}`}>
                                <Image
                                    alt={tool.name}
                                    src={tool.imageUrl || 'https://via.placeholder.com/50'}
                                    preview={false}
                                    className="object-contain"
                                    style={{ mixBlendMode: isDark ? 'screen' : 'normal' }}
                                />
                            </div>
                            <Tag 
                                color={getPricingTagColor(tool.pricing)} 
                                bordered={false} 
                                style={{ margin: 0, borderRadius: 100 }}
                            >
                                {tool.pricing}
                            </Tag>
                        </div>

                        {/* Content */}
                        <div className="flex-grow">
                            <div className="flex justify-between items-center mb-1">
                                <Text strong style={{ fontSize: 17 }}>{tool.name}</Text>
                                <div className="flex items-center gap-1">
                                    <StarFilled style={{ color: '#F59E0B', fontSize: 12 }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>{tool.rating}</Text>
                                </div>
                            </div>
                            
                            <Paragraph 
                                type="secondary" 
                                ellipsis={{ rows: 2 }} 
                                style={{ fontSize: 14, minHeight: 44, marginBottom: 16 }}
                            >
                                {tool.description}
                            </Paragraph>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {tool.features.slice(0, 2).map((f: string, i: number) => (
                                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded border ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-dashed border-gray-200 dark:border-gray-800 flex justify-between items-center mt-auto">
                            <Button
                                type="text"
                                icon={isFavorite(tool.id) ? <HeartFilled /> : <HeartOutlined />}
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(tool.id); }}
                                className={isFavorite(tool.id) ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-500'}
                            />
                            
                            <Button 
                                type="text"
                                className="font-semibold hover:bg-transparent px-0 flex items-center gap-2 group"
                                style={{ color: BRAND_COLOR }}
                                onClick={(e) => handleTryTool(e, tool)}
                            >
                                {tool.affiliateStatus?.includes('Active') ? 'Get Link' : 'Visit'} 
                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                            </Button>
                        </div>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default AIToolsDashboard;