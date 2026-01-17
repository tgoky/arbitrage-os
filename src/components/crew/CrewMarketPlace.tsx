// app/components/CrewMarketplace.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Input, Select, Space, Modal, Typography } from 'antd';
import { 
  SearchOutlined, 
  RobotOutlined, 
  ThunderboltOutlined,
  FileTextOutlined,
  BarChartOutlined,
  MailOutlined,
  CustomerServiceOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

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
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>
          <ThunderboltOutlined style={{ color: '#5CC49D', marginRight: '12px' }} />
          Crew Templates
        </Title>
        <Text type="secondary">
          Pre-built agent crews ready to tackle any task
        </Text>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Search
            placeholder="Search crews..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ maxWidth: '500px' }}
            size="large"
          />

          <Space wrap>
            {categories.map(cat => (
              <Tag
                key={cat.value}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: selectedCategory === cat.value ? '#5CC49D' : undefined,
                  color: selectedCategory === cat.value ? '#000' : undefined,
                  borderColor: selectedCategory === cat.value ? '#5CC49D' : undefined
                }}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Tag>
            ))}
          </Space>
        </Space>
      </div>

      {/* Templates Grid */}
      <Row gutter={[16, 16]}>
        {filteredTemplates.map(template => (
          <Col xs={24} sm={12} lg={8} key={template.id}>
            <Card
              hoverable
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              actions={[
                <Button
      key="preview"
      type="text"
      onClick={() => setPreviewCrew(template)}
    >
      Preview
    </Button>,
    <Button
      key="use"
      type="primary"
      style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
      onClick={() => onSelect(template.id)}
    >
      Use This Crew
    </Button>
  ]}
>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {categoryIcons[template.category] || <RobotOutlined />}
                </div>
                
                <Title level={5} style={{ marginBottom: '4px' }}>
                  {template.name}
                </Title>

                <Tag>{template.category}</Tag>
              </div>

              <Paragraph 
                style={{ color: '#666', marginBottom: '16px' }}
                ellipsis={{ rows: 3 }}
              >
                {template.description}
              </Paragraph>

              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {template.agents.length} Agents • {template.tasks.length} Tasks
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Preview Modal */}
      <Modal
        title={previewCrew?.name}
        open={!!previewCrew}
        onCancel={() => setPreviewCrew(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewCrew(null)}>
            Close
          </Button>,
          <Button
            key="use"
            type="primary"
            style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
            onClick={() => {
              onSelect(previewCrew.id);
              setPreviewCrew(null);
            }}
          >
            Use This Crew
          </Button>
        ]}
        width={700}
      >
        {previewCrew && (
          <div>
            <Paragraph>{previewCrew.description}</Paragraph>

            <Title level={5}>Agents</Title>
            <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
              {previewCrew.agents.map((agent: any) => (
                <Card key={agent.id} size="small">
                  <div>
                    <Text strong>{agent.name}</Text>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {agent.role}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      <strong>Goal:</strong> {agent.goal}
                    </div>
                  </div>
                </Card>
              ))}
            </Space>

            <Title level={5}>Tasks</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {previewCrew.tasks.map((task: any, idx: number) => (
                <Card key={task.id} size="small">
                  <Text>{idx + 1}. {task.description}</Text>
                </Card>
              ))}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};