"use client";

import React, { useState } from 'react';
import { 
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  TagsOutlined,
  FireOutlined
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
  Collapse
} from 'antd';
import { useNavigation } from '@refinedev/core';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Panel } = Collapse;

// Import JSON templates
import whatsappChatbot from './jsons/whatsapp-ai-chatbot.json';
import weeklyReports from './jsons/weekly-marketing-report.json';
import youtubeCreator from './jsons/long-form-youtube-ai-gen.json';
import gmailAutoLabel from './jsons/gmail-auto-label-response.json';
import reviewResponse from './jsons/ai-review-response.json';
import salesCallAnalyzer from './jsons/ai-sales-call-analyzer.json';
import socialMediaGen from './jsons/ai-social-media-gen.json';
import autoLinkedinDm from './jsons/automated-linkedin-dm.json';

interface WorkflowTemplate {
  id: number;
  title: string;
  description: string;
  tags: string[];
  downloads: number;
  demoUrl: string;
  integrations: string[];
  jsonTemplate: object;
}

const workflowTemplates = [
  {
    id: 1,
    title: "Automated LinkedIn DM System",
    description: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work (beyond the provided link). Automated LinkedIn outreach at scale.",
    tags: ["LinkedIn", "Outreach", "Automation"],
    downloads: 142,
    demoUrl: "#",
    integrations: ["LinkedIn API", "OpenAI", "Google Sheets"],
    jsonTemplate: autoLinkedinDm
  },
  {
    id: 2,
    title: "Gmail Auto-Label & Response Drafter",
    description: "Automatically categorise new Gmail messages with smart labels and draft AI-generated replies when needed.",
    tags: ["Gmail", "AI", "Email Automation"],
    downloads: 89,
    demoUrl: "#",
    integrations: ["Gmail", "OpenAI"],
    jsonTemplate: gmailAutoLabel
  },
  {
    id: 3,
    title: "Long Form YouTube AI Creator",
    description: "Automatically generate and upload Top 10 ranking videos to YouTube using AI and video generation APIs.",
    tags: ["YouTube", "AI", "Video Generation"],
    downloads: 76,
    demoUrl: "#",
    integrations: ["YouTube API", "OpenAI", "Fliki"],
    jsonTemplate: youtubeCreator
  },
  {
    id: 4,
    title: "AI Sales Call Analyzer",
    description: "Automatically analyzes sales calls from Zoom recordings. Transcribes calls, evaluates performance across 6 key metrics, and generates actionable insights saved to Google Sheets.",
    tags: ["Sales", "AI Analysis", "Call Recording"],
    downloads: 118,
    demoUrl: "#",
    integrations: ["Zoom", "OpenAI", "Google Sheets"],
    jsonTemplate: salesCallAnalyzer
  },
  {
    id: 5,
    title: "WhatsApp AI Sales Chatbot",
    description: "AI-powered WhatsApp chatbot for sales inquiries and lead qualification with automated responses.",
    tags: ["WhatsApp", "AI Chatbot", "Sales"],
    downloads: 95,
    demoUrl: "#",
    integrations: ["WhatsApp Business API", "OpenAI"],
    jsonTemplate: whatsappChatbot
  },
  {
    id: 6,
    title: "AI Review Response Generator",
    description: "Automatically generate personalized responses to customer reviews across multiple platforms.",
    tags: ["Review Management", "AI Responses", "Reputation Management"],
    downloads: 64,
    demoUrl: "#",
    integrations: ["Google My Business", "Yelp API", "OpenAI"],
    jsonTemplate: reviewResponse
  },
  {
    id: 7,
    title: "AI Social Media Content Generator",
    description: "Generate and schedule AI-powered social media content across multiple platforms.",
    tags: ["Social Media", "AI Content", "Marketing Automation"],
    downloads: 132,
    demoUrl: "#",
    integrations: ["Twitter API", "Facebook API", "OpenAI"],
    jsonTemplate: socialMediaGen
  },
  {
    id: 8,
    title: "Weekly Marketing Reports",
    description: "Automated weekly marketing report generator that collects and analyzes data from multiple sources including Google Analytics, Google Ads, and Meta Ads.",
    tags: ["Analytics", "Reporting", "Automation"],
    downloads: 107,
    demoUrl: "#",
    integrations: ["Google Analytics", "Meta API", "Google Sheets"],
    jsonTemplate: weeklyReports
  }
];

const popularTags = [
  { name: "AI", count: 28 },
  { name: "Marketing", count: 19 },
  { name: "Sales", count: 22 },
  { name: "Automation", count: 31 },
  { name: "Social Media", count: 15 },
  { name: "Email", count: 12 },
  { name: "CRM", count: 8 },
  { name: "Data Processing", count: 11 }
];

const N8nWorkflowLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');
  const { show } = useNavigation();
  const router = useRouter();

  const filteredWorkflows = workflowTemplates.filter(workflow => {
    const matchesSearch = 
      workflow.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => workflow.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
    if (sortBy === 'popular') return b.downloads - a.downloads;
    if (sortBy === 'newest') return b.id - a.id;
    return 0;
  });

  const downloadWorkflow = (workflow: WorkflowTemplate) => {
    const blob = new Blob([JSON.stringify(workflow.jsonTemplate, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <ThunderboltOutlined className="mr-2" />
       <span style={{ color: '#5CC49D' }}>a</span>rb
  <span style={{ color: '#5CC49D' }}>i</span>trageOS n8n Workflow Library
        </Title>
        <Text type="secondary" className="text-lg">
          Discover ready-to-use n8n workflow templates to automate your business processes
        </Text>
      </div>

      <div className="mb-8">
        <Search
          placeholder="Search workflow templates..."
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
            <Option value="newest">Newest First</Option>
          </Select>
        </div>
      </div>

      <Divider />

      <Row gutter={[16, 16]}>
        {sortedWorkflows.map(workflow => (
          <Col xs={24} sm={12} lg={8} key={workflow.id}>
            <Card
              hoverable
              className="h-full flex flex-col"
              actions={[
                <Tooltip title="View Demo" key="demo">
                <Button 
  type="text" 
  icon={<EyeOutlined />}
  onClick={() => router.push(`/n8n-library/show/${workflow.id}`)}
>
  Demo
</Button>
                </Tooltip>,
                <Tooltip title="Download Template" key="download">
                  <Button 
                    type="text" 
                    icon={<DownloadOutlined />}
                    onClick={() => downloadWorkflow(workflow)}
                  >
                    Download
                  </Button>
                </Tooltip>
              ]}
            >
              <div className="flex-grow">
                <Title level={4} className="mb-2">
                  {workflow.title}
                </Title>
                
                <Text type="secondary" className="block mb-3">
                  {workflow.description}
                </Text>

                <div className="mb-3">
                  <Space size={[0, 8]} wrap>
                    {workflow.tags.map(tag => (
                      <Tag 
                        key={tag} 
                        color={selectedTags.includes(tag) ? 'blue' : 'default'}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>

                <Collapse ghost size="small">
                  <Panel header="Integrations Used" key="integrations">
                    <div className="flex flex-wrap gap-2">
                      {workflow.integrations.map(integration => (
                        <Tag key={integration}>{integration}</Tag>
                      ))}
                    </div>
                  </Panel>
                </Collapse>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <Badge 
                  count={`${workflow.downloads}+ downloads`} 
                  style={{ backgroundColor: '#1890ff' }} 
                />
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  className="ml-2"
                  onClick={() => downloadWorkflow(workflow)}
                >
                  Get Template
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {sortedWorkflows.length === 0 && (
        <div className="text-center py-12">
          <Title level={4}>No workflows found</Title>
          <Text type="secondary">Try adjusting your search or filters</Text>
        </div>
      )}

      <Divider />

      <div className="text-center">
        <Title level={4} className="mb-2">
          Cannot find what you need?
        </Title>
        <Text type="secondary" className="block mb-4">
          Request a custom workflow or browse our community templates
        </Text>
        <Space>
          <Button type="primary">Request Workflow</Button>
          <Button>Browse Community</Button>
        </Space>
      </div>
    </div>
  );
};

export default N8nWorkflowLibrary;