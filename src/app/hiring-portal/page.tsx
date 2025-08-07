"use client";

import React, { useState } from 'react';
import { 
  SearchOutlined,
  MailOutlined,
  LinkedinOutlined,
  PlayCircleOutlined,
  FilterOutlined,
  DownOutlined,
  UpOutlined
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
  Avatar,
  Collapse,
} from 'antd';
import { useTheme } from '../../providers/ThemeProvider';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Search } = Input;
const { Option } = Select;

const specialists = [
  {
    id: 1,
    name: "Jean-Michel Moreau",
    company: "Rapid Product Growth",
    experience: "2 Years",
    specialty: "Paid Marketing",
    description: "Broken Funnel, CAC too high, Not enough calls, Not enough sales. Specialty is paid ads and recurring revenue models.",
    email: "jean@rapidgrowth.com",
    linkedin: "https://linkedin.com/in/jeanmichel",
    videoUrl: "#",
    website: "https://rapidgrowth.com",
    tags: ["Paid Ads", "Revenue Models", "Funnel Optimization"],
    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    id: 2,
    name: "Andrew Hathaway",
    company: "Virtual Assist",
    experience: "5 Years",
    specialty: "Sales and Fulfillment",
    description: "Virtual Assistants Agency. We aim to provide highly skilled remote professionals to support a wide range of business needs from administrative assistance, customer service, and operational roles, making them a flexible solution for businesses across industries which helps businesses streamline operations, reduce overhead, and maintain high-quality support around the clock.",
    email: "andrew@virtualassist.com",
    linkedin: "https://linkedin.com/in/andrewh",
    videoUrl: "#",
    website: "https://virtualassist.com",
    tags: ["Virtual Assistants", "Operations", "Customer Support"],
    imageUrl: "https://randomuser.me/api/portraits/men/44.jpg"
  },
  {
    id: 3,
    name: "Matthew Tigwell",
    company: "Hilo Labs",
    experience: "4 Years",
    specialty: "Technical Fulfillment",
    description: "We build custom AI automations for businesses. Most AI use cases can't be covered by out of the box solutions. We build custom AI agents into companies that are specifically trained on how they do business, integrated into the tools they use.",
    email: "matt@hilolabs.com",
    linkedin: "https://linkedin.com/in/matthewt",
    videoUrl: "#",
    website: "https://hilolabs.com",
    tags: ["AI Automation", "Custom Agents", "Integration"],
    imageUrl: "https://randomuser.me/api/portraits/men/68.jpg"
  },
  {
    id: 4,
    name: "Vlad Lisic",
    company: "LeanOps AI",
    experience: "14 Years",
    specialty: "Technical Fulfillment",
    description: "We partner with businesses to simplify technology and support their growth by helping with implementation of AI-driven automation, integrated outreach systems and bespoke solutions. From CRM deployments and platform integration to cold outreach and tailored systems, we combine technical delivery with consultancy to ensure systems match business needs. Using low-code and full-stack development, we build scalable workflows that reduce manual work — so you can focus on growing your business, not managing the tech.",
    email: "vlad@leanops.com",
    linkedin: "https://linkedin.com/in/vladlisic",
    videoUrl: "#",
    website: "https://leanops.com",
    tags: ["AI Automation", "CRM", "Workflow Automation"],
    imageUrl: "https://randomuser.me/api/portraits/men/75.jpg"
  },
  {
    id: 5,
    name: "Jacques Rossouw",
    company: "Growthlio",
    experience: "14 Years",
    specialty: "AI Integrations",
    description: "AI Integrations & Paid Media Strategies, including media buying and digital strategies.",
    email: "jacques@growthlio.com",
    linkedin: "https://linkedin.com/in/jacquesr",
    videoUrl: "#",
    website: "https://growthlio.com",
    tags: ["Media Buying", "Digital Strategy", "AI Integration"],
    imageUrl: "https://randomuser.me/api/portraits/men/81.jpg"
  }
];

const HiringPortal = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [expandedCards, setExpandedCards] = useState<number[]>([]);

  const specialties = [
    "Paid Marketing",
    "Sales and Fulfillment",
    "Technical Fulfillment / Implementation",
    "AI Integrations",
    "Media Strategies"
  ];

  const toggleExpand = (id: number) => {
    if (expandedCards.includes(id)) {
      setExpandedCards(expandedCards.filter(cardId => cardId !== id));
    } else {
      setExpandedCards([...expandedCards, id]);
    }
  };

  const filteredSpecialists = specialists.filter(specialist => {
    const matchesSearch = 
      specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      specialist.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
      specialist.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = !selectedSpecialty || 
      specialist.specialty.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <Title level={2} className={`mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            AI Implementation Specialists
          </Title>
          <Text type="secondary" className={`text-lg ${theme === 'dark' ? 'text-gray-300' : ''}`}>
            Connect with top specialists to help deliver your AI projects
          </Text>
        </div>

        {/* Search and Filter Section */}
   <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch md:items-center">
        
          <Select
            placeholder="Filter by specialty"
            style={{ width: 200 }}
            size="large"
            onChange={setSelectedSpecialty}
            allowClear
          >
            {specialties.map(specialty => (
              <Option key={specialty} value={specialty}>
                {specialty}
              </Option>
            ))}
          </Select>

          <Button 
            icon={<FilterOutlined />} 
            size="large"
            onClick={() => {
              setSelectedSpecialty('');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </Button>
           <Search
            placeholder="Search specialists..."
            allowClear
            enterButton={<Button type="primary">Search</Button>}
            size="large"
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0"
          />
        </div>


        <Divider />

        {/* Specialists Grid */}
        <Row gutter={[24, 24]}>
          {filteredSpecialists.map(specialist => (
            <Col xs={24} md={12} lg={8} key={specialist.id}>
              <Card
                hoverable
                className={`h-full border border-solid transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-gray-700 hover:border-blue-500 bg-zinc-900'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
                bodyStyle={{ 
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                {/* Header with Avatar and Basic Info */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar
                    src={specialist.imageUrl}
                    size={72}
                    className={`shrink-0 border-2 border-solid ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <Title 
                      level={4} 
                      className={`mb-1 text-base leading-tight ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {specialist.name}
                    </Title>
                    <Text 
                      strong 
                      className={`block mb-2 ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}
                    >
                      {specialist.company}
                    </Text>
                    <div className="flex flex-wrap items-center gap-2">
                      <Text 
                        type="secondary" 
                        className={`text-sm whitespace-nowrap ${
                          theme === 'dark' ? 'text-gray-400' : ''
                        }`}
                      >
                        {specialist.experience}
                      </Text>
                      <Tag 
                        color="blue" 
                        className={`text-xs ${
                          theme === 'dark' ? 'bg-blue-900 border-blue-700 text-blue-200' : ''
                        }`}
                      >
                        {specialist.specialty}
                      </Tag>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="flex-1 mb-4">
                  <Text
                    className={`text-sm leading-relaxed ${
                      expandedCards.includes(specialist.id) ? '' : 'line-clamp-3'
                    } ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    {specialist.description}
                  </Text>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => toggleExpand(specialist.id)}
                    className={`p-0 mt-1 h-auto ${
                      theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'
                    }`}
                    icon={
                      expandedCards.includes(specialist.id) ? (
                        <UpOutlined className="text-xs" />
                      ) : (
                        <DownOutlined className="text-xs" />
                      )
                    }
                  >
                    {expandedCards.includes(specialist.id)
                      ? 'Show less'
                      : 'Show more'}
                  </Button>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <Space size={[8, 8]} wrap>
                    {specialist.tags.map(tag => (
                      <Tag 
                        key={tag} 
                        className={`text-xs ${
                          theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : ''
                        }`}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>

                {/* Contact Links */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="text"
                      size="small"
                      icon={<MailOutlined />}
                      href={`mailto:${specialist.email}`}
                      className={`flex items-center ${
                        theme === 'dark' ? 'text-gray-300 hover:text-white' : ''
                      }`}
                    >
                      Email
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      icon={<LinkedinOutlined />}
                      href={specialist.linkedin}
                      target="_blank"
                      className={`flex items-center ${
                        theme === 'dark' ? 'text-gray-300 hover:text-white' : ''
                      }`}
                    >
                      LinkedIn
                    </Button>
                    {specialist.videoUrl && (
                      <Button
                        type="text"
                        size="small"
                        icon={<PlayCircleOutlined />}
                        href={specialist.videoUrl}
                        target="_blank"
                        className={`flex items-center ${
                          theme === 'dark' ? 'text-gray-300 hover:text-white' : ''
                        }`}
                      >
                        Video
                      </Button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    className="flex-1"
                    href={specialist.website}
                    target="_blank"
                  >
                    Visit Website
                  </Button>
                  <Button 
                    type="primary" 
                    className="flex-1"
                  >
                    Book a Call
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* No Results */}
        {filteredSpecialists.length === 0 && (
          <div className="text-center py-16">
            <Title 
              level={4} 
              className={`mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
            >
              No specialists found
            </Title>
            <Text 
              type="secondary"
              className={theme === 'dark' ? 'text-gray-400' : ''}
            >
              Try adjusting your search or filters
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default HiringPortal;