// app/components/CrewMarketplace.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Tag, 
  Button, 
  Input, 
  Space, 
  Modal, 
  Typography, 
  ConfigProvider, 
  theme as antTheme,
  Avatar,
  Divider
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
  EyeOutlined,
  RightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_CARD = '#09090b'; // Zinc-950
const SURFACE_ELEVATED = '#18181b'; // Zinc-900
const BORDER_COLOR = '#27272a'; // Zinc-800
const TEXT_SECONDARY = '#a1a1aa'; // Zinc-400
const TEXT_PRIMARY = '#ffffff';

interface CrewTemplateProps {
  workspaceId: string;
  onSelect: (crewId: string) => void;
}

const categoryIcons: Record<string, any> = {
  content: <FileTextOutlined />,
  research: <SearchOutlined />,
  sales: <MailOutlined />,
  marketing: <GlobalOutlined />,
  data: <BarChartOutlined />,
  communication: <CustomerServiceOutlined />
};

export const CrewMarketplace: React.FC<CrewTemplateProps> = ({ workspaceId, onSelect }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCrew, setPreviewCrew] = useState<any>(null);

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

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [selectedCategory, searchQuery, templates]);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/agent-crews/templates');
      const data = await res.json();
      
      if (data.success) {
        setTemplates(data.templates);
        setFilteredTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  };

  const categories = [
    { value: 'all', label: 'All Crews' },
    { value: 'content', label: 'Content Creation' },
    { value: 'research', label: 'Research & Analysis' },
    { value: 'sales', label: 'Sales & Outreach' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'data', label: 'Data Analysis' },
    { value: 'communication', label: 'Communication' }
  ];

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
          borderRadius: 8,
        },
        components: {
          Button: { fontWeight: 600, defaultBg: 'transparent', defaultBorderColor: BORDER_COLOR },
          Input: { colorBgContainer: '#000000', activeBorderColor: BRAND_GREEN, hoverBorderColor: BRAND_GREEN },
          Card: { headerBg: 'transparent' },
          Modal: { contentBg: SURFACE_CARD, headerBg: SURFACE_CARD }
        }
      }}
    >
      <div style={{ backgroundColor: DARK_BG, minHeight: '100%', fontFamily: 'Manrope, sans-serif' }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={3} style={{ color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', letterSpacing: '-0.5px' }}>
            <span style={{ 
                width: '36px', height: '36px', borderRadius: '8px', 
                background: `linear-gradient(135deg, ${BRAND_GREEN}20, ${BRAND_GREEN}10)`, 
                border: `1px solid ${BRAND_GREEN}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: '12px'
            }}>
                <ThunderboltOutlined style={{ fontSize: '18px', color: BRAND_GREEN }} />
            </span>
            Crew Templates
          </Title>
          <Text style={{ color: TEXT_SECONDARY, fontSize: '15px' }}>
            Jumpstart your automation with pre-built agent crews designed for specific workflows.
          </Text>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '32px' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Search
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ maxWidth: '500px' }}
              size="large"
              allowClear
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <div
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    style={{
                      padding: '6px 16px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      borderRadius: '100px',
                      border: isSelected ? `1px solid ${BRAND_GREEN}` : `1px solid ${BORDER_COLOR}`,
                      backgroundColor: isSelected ? 'rgba(92, 196, 157, 0.1)' : 'transparent',
                      color: isSelected ? BRAND_GREEN : TEXT_SECONDARY,
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {cat.label}
                  </div>
                );
              })}
            </div>
          </Space>
        </div>

        {/* Templates Grid */}
        <Row gutter={[20, 20]}>
          {filteredTemplates.map(template => (
            <Col xs={24} sm={12} lg={8} xl={6} key={template.id}>
              <Card
                hoverable
                style={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: `1px solid ${BORDER_COLOR}`,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    backgroundColor: SURFACE_CARD
                }}
                bodyStyle={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column' }}
                actions={[
                  <Button
                    key="preview"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => setPreviewCrew(template)}
                    style={{ color: TEXT_SECONDARY }}
                  >
                    Preview
                  </Button>,
                  <Button
                    key="use"
                    type="text"
                    icon={<RightOutlined />}
                    style={{ color: BRAND_GREEN, fontWeight: 600 }}
                    onClick={() => onSelect(template.id)}
                  >
                    Use Crew
                  </Button>
                ]}
              >
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ 
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #27272a 0%, #09090b 100%)',
                            border: `1px solid ${BORDER_COLOR}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '24px', color: BRAND_GREEN
                        }}>
                            {categoryIcons[template.category] || <RobotOutlined />}
                        </div>
                        <Tag style={{ 
                            margin: 0, 
                            border: `1px solid ${BORDER_COLOR}`, 
                            backgroundColor: SURFACE_ELEVATED, 
                            color: TEXT_SECONDARY, 
                            fontSize: '10px',
                            textTransform: 'uppercase' 
                        }}>
                            {template.category}
                        </Tag>
                    </div>
                    
                    <Title level={5} style={{ marginBottom: '8px', color: '#fff', fontSize: '16px' }} ellipsis={{ tooltip: template.name }}>
                        {template.name}
                    </Title>

                    <Paragraph 
                        style={{ color: TEXT_SECONDARY, marginBottom: '20px', fontSize: '13px', lineHeight: '1.6' }}
                        ellipsis={{ rows: 3 }}
                    >
                        {template.description}
                    </Paragraph>

                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: `1px dashed ${BORDER_COLOR}` }}>
                        <Space split={<Divider type="vertical" style={{ borderColor: BORDER_COLOR }} />}>
                            <Text style={{ fontSize: '12px', color: TEXT_SECONDARY }}>
                                <strong>{template.agents.length}</strong> Agents
                            </Text>
                            <Text style={{ fontSize: '12px', color: TEXT_SECONDARY }}>
                                <strong>{template.tasks.length}</strong> Tasks
                            </Text>
                        </Space>
                    </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Preview Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ 
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(92, 196, 157, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: BRAND_GREEN
                }}>
                    {categoryIcons[previewCrew?.category] || <RobotOutlined />}
                </div>
                <span style={{ fontFamily: 'Manrope' }}>{previewCrew?.name}</span>
            </div>
          }
          open={!!previewCrew}
          onCancel={() => setPreviewCrew(null)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${BORDER_COLOR}` }}>
                <Button key="close" onClick={() => setPreviewCrew(null)}>
                    Close
                </Button>
                <Button
                    key="use"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    style={{ backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000', fontWeight: 600 }}
                    onClick={() => {
                        onSelect(previewCrew.id);
                        setPreviewCrew(null);
                    }}
                >
                    Use This Crew
                </Button>
            </div>
          }
          width={700}
          styles={{
              content: { backgroundColor: SURFACE_CARD, border: `1px solid ${BORDER_COLOR}`, padding: '24px' },
              header: { backgroundColor: SURFACE_CARD, borderBottom: `1px solid ${BORDER_COLOR}`, paddingBottom: '16px', marginBottom: '16px' }
          }}
        >
          {previewCrew && (
            <div>
              <Paragraph style={{ fontSize: '14px', color: TEXT_SECONDARY, lineHeight: '1.6' }}>
                  {previewCrew.description}
              </Paragraph>

              <div style={{ marginTop: '24px' }}>
                <Title level={5} style={{ color: '#fff', fontSize: '14px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Agent Team
                </Title>
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    {previewCrew.agents.map((agent: any) => (
                    <div key={agent.id} style={{ 
                        padding: '12px 16px', 
                        backgroundColor: SURFACE_ELEVATED, 
                        border: `1px solid ${BORDER_COLOR}`,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <Avatar style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                            {agent.avatar || '🤖'}
                        </Avatar>
                        <div>
                            <Text strong style={{ color: '#fff', display: 'block' }}>{agent.name}</Text>
                            <Text style={{ fontSize: '12px', color: TEXT_SECONDARY }}>{agent.role}</Text>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                             <Text style={{ fontSize: '11px', color: BRAND_GREEN }}>Goal</Text>
                             <div style={{ fontSize: '11px', color: TEXT_SECONDARY, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                 {agent.goal}
                             </div>
                        </div>
                    </div>
                    ))}
                </Space>
              </div>

              <div style={{ marginTop: '24px' }}>
                <Title level={5} style={{ color: '#fff', fontSize: '14px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Process Tasks
                </Title>
                <div style={{ position: 'relative', paddingLeft: '14px' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1px', backgroundColor: BORDER_COLOR }}></div>
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                        {previewCrew.tasks.map((task: any, idx: number) => (
                        <div key={task.id} style={{ position: 'relative' }}>
                            <div style={{ 
                                position: 'absolute', left: '-18px', top: '10px', 
                                width: '9px', height: '9px', borderRadius: '50%', 
                                backgroundColor: SURFACE_CARD, border: `2px solid ${BRAND_GREEN}` 
                            }}></div>
                            <div style={{ padding: '12px', backgroundColor: SURFACE_ELEVATED, borderRadius: '8px' }}>
                                <Text style={{ color: TEXT_SECONDARY }}>
                                    <span style={{ color: '#fff', fontWeight: 600, marginRight: '8px' }}>Step {idx + 1}</span> 
                                    {task.description}
                                </Text>
                            </div>
                        </div>
                        ))}
                    </Space>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
};