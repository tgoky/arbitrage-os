"use client";

import React, { useState } from 'react';
import { 
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
  FireOutlined,
  NodeIndexOutlined,
  ApiOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import { 
  Input, 
  Button, 
  Typography, 
  Tag, 
  Row, 
  Col,
  Select,
  ConfigProvider, 
  Empty,
  Tooltip
} from 'antd';
import { useNavigation } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';

const { Paragraph } = Typography;
const { Option } = Select;

// --- Imports (Preserved) ---
import whatsappChatbot from './jsons/whatsapp-ai-chatbot.json';
import weeklyReports from './jsons/weekly-marketing-report.json';
import youtubeCreator from './jsons/long-form-youtube-ai-gen.json';
import gmailAutoLabel from './jsons/gmail-auto-label-response.json';
import reviewResponse from './jsons/ai-review-response.json';
import salesCallAnalyzer from './jsons/ai-sales-call-analyzer.json';
import socialMediaGen from './jsons/ai-social-media-gen.json';
import autoLinkedinDm from './jsons/automated-linkedin-dm.json';
import autopostAi from './jsons/Generate-Auto-post AI Videos-Social-Media-with-Veo3-Blotato.json';
import aiagentDev from './jsons/AI-Agent-Development Agent.json';
import aiblogPost from './jsons/AI-Blog-Post-R&D-Agent.json';
import analyzeLanding from './jsons/Analyze-Landing-Page-with-OpenAI-and-Get-Optimization Tips.json';
import autoRespond from './jsons/Auto-Respond to Gmail Inquiries using OpenAI, Google Sheet & AI Agent.json';
import auoRespondDocs from './jsons/Auto-Respond to Slack Messages as Yourself using GPT and Google Docs RAG.json';
import automatedLink from './jsons/Automated-LinkedIn-Content Creation-with-GPT-4-and-DALL-E-for-Scheduled Posts.json';
import gmailEmail from './jsons/Gmail_and_Email_Automation_Extract-spending-history from-gmail-google sheet.json';
import googleMaps from './jsons/Google-Maps-Lead-Generation.json';
import imageCaps from './jsons/Image-Captioning-with-Gemini.json';
import linkLead from './jsons/Linkedin-Lead-Gen.json';
import longForm from './jsons/Long-Form-Faceless-Content-Generator.json';
import n8node from './jsons/N8N-Node-Library.json';
import openais from './jsons/OpenAI_and_LLMs_AI-Youtube-Trend-Finde- Based On Niche.json';
import resumeParser from './jsons/Resume-Parser.json';
import trackAi from './jsons/Track-AI-Agent-token-usage-estimate-costs-Google-Sheets.json';
import turnt from './jsons/Turn-YouTube-Transcripts into-Newsletter-Drafts-using Dumpling-AI-GPT-4o.json';
import voiceb from './jsons/Voice-Based Appointment Booking System with ElevenLabs AI and Cal.com.json';
import { useTheme } from '../../providers/ThemeProvider';

// --- Styling Constants ---
const BRAND_COLOR = '#9DA2B3'; 
const BRAND_COLOR_HOVER = '#B4B8C5';
const CARD_BG_DARK = 'rgba(255, 255, 255, 0.03)';
const BORDER_DARK = 'rgba(255, 255, 255, 0.08)';

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
    description: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work.",
    tags: ["LinkedIn", "Outreach", "Automation"],
    downloads: 142,
    demoUrl: "#",
    integrations: ["LinkedIn", "OpenAI", "Sheets"],
    jsonTemplate: autoLinkedinDm
  },
  {
    id: 2,
    title: "Gmail Auto-Label & Response",
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
    tags: ["YouTube", "AI", "Video Gen"],
    downloads: 76,
    demoUrl: "#",
    integrations: ["YouTube", "OpenAI", "Fliki"],
    jsonTemplate: youtubeCreator
  },
  {
    id: 4,
    title: "AI Sales Call Analyzer",
    description: "Transcribes calls, evaluates performance across 6 key metrics, and generates actionable insights saved to Google Sheets.",
    tags: ["Sales", "AI Analysis", "Recording"],
    downloads: 118,
    demoUrl: "#",
    integrations: ["Zoom", "OpenAI", "Sheets"],
    jsonTemplate: salesCallAnalyzer
  },
  {
    id: 5,
    title: "WhatsApp AI Sales Chatbot",
    description: "AI-powered WhatsApp chatbot for sales inquiries and lead qualification with automated responses.",
    tags: ["WhatsApp", "Chatbot", "Sales"],
    downloads: 95,
    demoUrl: "#",
    integrations: ["WhatsApp", "OpenAI"],
    jsonTemplate: whatsappChatbot
  },
  {
    id: 6,
    title: "AI Review Response Generator",
    description: "Automatically generate personalized responses to customer reviews across multiple platforms.",
    tags: ["Reviews", "AI Responses", "Reputation"],
    downloads: 64,
    demoUrl: "#",
    integrations: ["GMB", "Yelp", "OpenAI"],
    jsonTemplate: reviewResponse
  },
  {
    id: 7,
    title: "AI Social Media Content Gen",
    description: "Generate and schedule AI-powered social media content across multiple platforms.",
    tags: ["Social Media", "AI Content", "Marketing"],
    downloads: 132,
    demoUrl: "#",
    integrations: ["Twitter", "Facebook", "OpenAI"],
    jsonTemplate: socialMediaGen
  },
  {
    id: 8,
    title: "Weekly Marketing Reports",
    description: "Automated weekly marketing report generator that collects and analyzes data from multiple sources.",
    tags: ["Analytics", "Reporting", "Automation"],
    downloads: 107,
    demoUrl: "#",
    integrations: ["Analytics", "Meta", "Sheets"],
    jsonTemplate: weeklyReports
  },
  {
    id: 9,
    title: "Auto-Post AI Videos",
    description: "Automatically generate and schedule AI-powered videos for social media platforms using Veo3 and Blotato.",
    tags: ["Video Gen", "Social Media", "AI"],
    downloads: 92,
    demoUrl: "#",
    integrations: ["Veo3", "Blotato", "Social"],
    jsonTemplate: autopostAi
  },
  {
    id: 10,
    title: "AI Agent Development Platform",
    description: "Build and deploy custom AI agents with no-code development tools and pre-built templates.",
    tags: ["Development", "No-Code", "Automation"],
    downloads: 156,
    demoUrl: "#",
    integrations: ["OpenAI", "Custom API", "Webhook"],
    jsonTemplate: aiagentDev
  },
  {
    id: 11,
    title: "AI Blog Post Research",
    description: "Automatically research topics and generate SEO-optimized blog posts with AI-powered content creation.",
    tags: ["Content", "SEO", "Blogging"],
    downloads: 134,
    demoUrl: "#",
    integrations: ["OpenAI", "SEO Tools", "CMS"],
    jsonTemplate: aiblogPost
  },
  {
    id: 12,
    title: "Landing Page Analysis",
    description: "Analyze landing pages and receive AI-powered optimization tips to improve conversion rates.",
    tags: ["CRO", "Analytics", "AI Analysis"],
    downloads: 87,
    demoUrl: "#",
    integrations: ["OpenAI", "Analytics", "PageSpeed"],
    jsonTemplate: analyzeLanding
  },
  {
    id: 13,
    title: "Auto-Respond to Gmail",
    description: "Automatically respond to Gmail inquiries using OpenAI, with responses logged in Google Sheets.",
    tags: ["Email", "Support", "AI Responses"],
    downloads: 121,
    demoUrl: "#",
    integrations: ["Gmail", "OpenAI", "Sheets"],
    jsonTemplate: autoRespond
  },
  {
    id: 14,
    title: "Auto-Respond to Slack",
    description: "Automatically respond to Slack messages using GPT and Google Docs RAG to maintain your voice.",
    tags: ["Slack", "AI Responses", "RAG"],
    downloads: 98,
    demoUrl: "#",
    integrations: ["Slack", "OpenAI", "Docs"],
    jsonTemplate: auoRespondDocs
  },
  {
    id: 15,
    title: "LinkedIn Content Creation",
    description: "Generate and schedule LinkedIn content with GPT-4 and DALL-E for consistent social media presence.",
    tags: ["LinkedIn", "Content", "Scheduling"],
    downloads: 145,
    demoUrl: "#",
    integrations: ["LinkedIn", "OpenAI", "DALL-E"],
    jsonTemplate: automatedLink
  },
  {
    id: 16,
    title: "Gmail Spending Extractor",
    description: "Extract spending history from Gmail receipts and organize it automatically in Google Sheets.",
    tags: ["Finance", "Parsing", "Data"],
    downloads: 113,
    demoUrl: "#",
    integrations: ["Gmail", "Sheets", "Regex"],
    jsonTemplate: gmailEmail
  },
  {
    id: 17,
    title: "Google Maps Lead Gen",
    description: "Automatically extract business leads from Google Maps based on location and industry filters.",
    tags: ["Leads", "Scraping", "Sales"],
    downloads: 179,
    demoUrl: "#",
    integrations: ["Maps", "CRM", "Sheets"],
    jsonTemplate: googleMaps
  },
  {
    id: 18,
    title: "AI Image Captioning",
    description: "Automatically generate accurate captions for images using Google's Gemini AI model.",
    tags: ["Images", "AI Vision", "Accessibility"],
    downloads: 76,
    demoUrl: "#",
    integrations: ["Gemini", "Storage", "CMS"],
    jsonTemplate: imageCaps
  },
  {
    id: 19,
    title: "LinkedIn Lead Gen System",
    description: "Automate LinkedIn lead generation with targeted search and connection requests.",
    tags: ["LinkedIn", "Leads", "Sales"],
    downloads: 167,
    demoUrl: "#",
    integrations: ["LinkedIn", "CRM", "Sheets"],
    jsonTemplate: linkLead
  },
  {
    id: 20,
    title: "Faceless Content Generator",
    description: "Create long-form faceless video content automatically with AI narration and visuals.",
    tags: ["Video", "Narration", "Content"],
    downloads: 102,
    demoUrl: "#",
    integrations: ["Video API", "OpenAI", "TTS"],
    jsonTemplate: longForm
  },
  {
    id: 21,
    title: "N8N Node Library",
    description: "Comprehensive library of custom nodes for extending n8n workflow automation capabilities.",
    tags: ["Development", "Workflow", "Extensions"],
    downloads: 254,
    demoUrl: "#",
    integrations: ["n8n", "API", "Webhooks"],
    jsonTemplate: n8node
  },
  {
    id: 22,
    title: "AI YouTube Trend Finder",
    description: "Discover trending YouTube topics in your niche using AI analysis of current trends.",
    tags: ["YouTube", "Trends", "Research"],
    downloads: 118,
    demoUrl: "#",
    integrations: ["YouTube", "OpenAI", "Trends"],
    jsonTemplate: openais
  },
  {
    id: 23,
    title: "AI Resume Parser",
    description: "Automatically parse and extract key information from resumes for recruitment purposes.",
    tags: ["HR", "Recruitment", "Parsing"],
    downloads: 189,
    demoUrl: "#",
    integrations: ["OpenAI", "ATS", "Sheets"],
    jsonTemplate: resumeParser
  },
  {
    id: 24,
    title: "AI Token Usage Tracker",
    description: "Track AI agent token usage and estimate costs with automated Google Sheets reporting.",
    tags: ["Costs", "Analytics", "Monitoring"],
    downloads: 95,
    demoUrl: "#",
    integrations: ["OpenAI", "Sheets", "API"],
    jsonTemplate: trackAi
  },
  {
    id: 25,
    title: "YouTube to Newsletter",
    description: "Turn YouTube transcripts into newsletter drafts automatically using Dumpling AI and GPT-4o.",
    tags: ["Repurposing", "Newsletters", "AI"],
    downloads: 83,
    demoUrl: "#",
    integrations: ["YouTube", "OpenAI", "Email"],
    jsonTemplate: turnt
  },
  {
    id: 26,
    title: "Voice Appointment Booking",
    description: "Voice AI appointment booking system using ElevenLabs AI and Cal.com integration.",
    tags: ["Voice AI", "Scheduling", "Support"],
    downloads: 127,
    demoUrl: "#",
    integrations: ["ElevenLabs", "Cal.com", "Calendar"],
    jsonTemplate: voiceb
  },
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

// --- Components ---

const WorkflowCard = ({ workflow, onDownload }: { workflow: WorkflowTemplate; onDownload: (w: WorkflowTemplate) => void }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  return (
    <div 
      className={`group relative flex flex-col h-full rounded-2xl transition-all duration-300 ${
        isDark 
          ? 'hover:shadow-[0_0_20px_rgba(157,162,179,0.15)]' 
          : 'hover:shadow-xl hover:shadow-gray-200'
      }`}
      style={{
        background: isDark ? CARD_BG_DARK : '#ffffff',
        border: `1px solid ${isDark ? BORDER_DARK : '#f0f0f0'}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                <NodeIndexOutlined className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
            <div className="flex gap-2">
                <Tooltip title="Preview">
                    <Button 
                        type="text" 
                        shape="circle" 
                        size="small"
                        icon={<EyeOutlined />} 
                        onClick={() => router.push(`/n8n-library/show/${workflow.id}`)}
                        className={isDark ? "text-gray-500 hover:text-white" : "text-gray-400"}
                    />
                </Tooltip>
            </div>
        </div>

        {/* Content */}
        <h3 className={`font-manrope text-lg font-bold mb-2 leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {workflow.title}
        </h3>
        
        <Paragraph 
            className={`text-sm mb-4 flex-grow ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            ellipsis={{ rows: 3, expandable: false }}
        >
            {workflow.description}
        </Paragraph>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
            {workflow.tags.slice(0, 3).map(tag => (
                <span 
                    key={tag} 
                    className={`text-[10px] px-2 py-1 rounded-full border ${
                        isDark 
                        ? 'border-gray-700 text-gray-400 bg-gray-800/30' 
                        : 'border-gray-200 text-gray-500 bg-gray-50'
                    }`}
                >
                    {tag}
                </span>
            ))}
        </div>

        {/* Integrations (Visual) */}
        <div className="mb-5 pt-3 border-t border-dashed border-gray-700/30">
            <p className="text-[10px] uppercase tracking-wider opacity-50 mb-2 font-semibold">Integrations</p>
            <div className="flex flex-wrap gap-2 text-xs">
                 {workflow.integrations.map((int, i) => (
                    <span key={i} className={`flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <ApiOutlined className="opacity-50 text-[10px]"/> {int}
                    </span>
                 ))}
            </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex justify-between items-center pt-2">
             <div className="flex items-center gap-1 text-xs opacity-50">
                <DownloadOutlined />
                <span>{workflow.downloads}</span>
             </div>
             <Button 
                type="primary"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => onDownload(workflow)}
                style={{
                    backgroundColor: BRAND_COLOR,
                    borderColor: BRAND_COLOR,
                    color: '#000',
                    fontWeight: 600,
                    fontFamily: 'Manrope, sans-serif'
                }}
                className="hover:!bg-[#B4B8C5] hover:!border-[#B4B8C5] shadow-none rounded-md"
             >
                Download
             </Button>
        </div>
      </div>
    </div>
  );
};

const N8nWorkflowLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceContext();

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
  
  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  return (
    <ConfigProvider
        theme={{
            token: {
                fontFamily: "'Manrope', sans-serif",
                colorPrimary: BRAND_COLOR,
                borderRadius: 8,
                colorBgContainer: isDark ? '#141414' : '#ffffff',
                colorText: isDark ? '#ffffff' : '#000000',
            },
            components: {
                Input: {
                    colorBgContainer: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    colorBorder: isDark ? 'rgba(255,255,255,0.1)' : '#d9d9d9',
                    activeBorderColor: BRAND_COLOR,
                    hoverBorderColor: BRAND_COLOR,
                },
                Select: {
                    colorBgContainer: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    colorBorder: isDark ? 'rgba(255,255,255,0.1)' : '#d9d9d9',
                    colorPrimaryHover: BRAND_COLOR,
                    controlOutline: 'transparent',
                },
                Button: {
                    defaultColor: isDark ? '#fff' : '#000',
                    defaultBg: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                    defaultBorderColor: isDark ? 'rgba(255,255,255,0.1)' : '#d9d9d9',
                }
            }
        }}
    >
        <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Manrope', sans-serif; }
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #555; }
        `}</style>

        <div className={`min-h-screen ${isDark ? 'bg-[#0B0C10]' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-6 py-8">
                
                {/* Modernized Header Navigation (Breadcrumb style) */}
                <div className="flex items-center gap-4 mb-10">
                    <button 
                        onClick={handleBack}
                        className={`
                            group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
                            ${isDark 
                                ? 'bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white' 
                                : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-900'}
                        `}
                    >
                        <ArrowLeftOutlined className="text-xs transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-medium font-manrope">Back to Dashboard</span>
                    </button>
                </div>

                {/* Hero Section */}
                <div className="mb-12">
                    <h1 className={`text-4xl font-bold mb-3 tracking-tight font-manrope ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        N8n Automation Hub
                    </h1>
                    <p className={`text-lg max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Production-ready workflow templates to automate your business processes.
                    </p>
                </div>

                {/* Filter Bar */}
                <div className={`p-4 rounded-xl mb-8 border ${isDark ? 'bg-[#12141a] border-white/5' : 'bg-white border-gray-100'}`}>
                    <div className="flex flex-col xl:flex-row gap-4 justify-between">
                        <Input 
                            placeholder="Search workflows..." 
                            prefix={<SearchOutlined className="opacity-50" />} 
                            allowClear
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full xl:w-96 text-lg"
                            size="large"
                            bordered={false}
                            style={{ 
                                background: isDark ? 'rgba(255,255,255,0.03)' : '#f9f9f9',
                                borderRadius: '8px' 
                            }}
                        />

                        <div className="flex flex-wrap gap-3 items-center">
                            <Select
                                mode="multiple"
                                placeholder="Filter by Tags"
                                style={{ width: 280 }}
                                onChange={setSelectedTags}
                                allowClear
                                size="large"
                                maxTagCount="responsive"
                            >
                                {popularTags.map(t => (
                                    <Option key={t.name} value={t.name}>{t.name} ({t.count})</Option>
                                ))}
                            </Select>

                            <div className={`w-px h-8 mx-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>

                            <Select
                                defaultValue="popular"
                                style={{ width: 160 }}
                                onChange={setSortBy}
                                size="large"
                                variant="borderless"
                                suffixIcon={<FireOutlined className={isDark ? "text-gray-500" : ""} />}
                                className="font-semibold"
                            >
                                <Option value="popular">Most Popular</Option>
                                <Option value="newest">Newest First</Option>
                            </Select>

                            {(selectedTags.length > 0 || searchTerm) && (
                                <Button 
                                    type="text" 
                                    danger 
                                    icon={<FilterOutlined />}
                                    onClick={() => {
                                        setSelectedTags([]);
                                        setSearchTerm('');
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="min-h-[400px]">
                    <Row gutter={[24, 24]}>
                        {sortedWorkflows.map(workflow => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={workflow.id}>
                                <WorkflowCard 
                                    workflow={workflow} 
                                    onDownload={downloadWorkflow} 
                                />
                            </Col>
                        ))}
                    </Row>

                    {sortedWorkflows.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                                        No workflows found matching your criteria.
                                    </span>
                                }
                            />
                            <Button 
                                type="dashed" 
                                className="mt-4"
                                onClick={() => {
                                    setSelectedTags([]);
                                    setSearchTerm('');
                                }}
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* CTA Footer */}
                <div className="mt-20 border-t pt-10 text-center border-dashed border-gray-700">
                    <h4 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        Need a custom workflow?
                    </h4>
                    <p className={`mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Our community builds new automations every day.
                    </p>
                    <div className="flex justify-center gap-4">
                         <Button size="large" type="primary" style={{ background: BRAND_COLOR, color: '#000', borderColor: BRAND_COLOR }}>
                            Request Workflow
                        </Button>
                        <Button size="large" type="default" ghost={isDark}>
                            Browse Community
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </ConfigProvider>
  );
};

export default N8nWorkflowLibrary;