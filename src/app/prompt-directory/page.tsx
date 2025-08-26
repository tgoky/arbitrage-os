"use client";

import React, { useState, useMemo } from 'react';
import { 
  SearchOutlined,
  CopyOutlined,
  DownloadOutlined,
  UpOutlined,
  DownOutlined,
  TagsOutlined,
  FireOutlined
} from '@ant-design/icons';
import { Input, Card, Button, Typography, Tag, Divider, Space, Row, Col, Select, Tabs } from 'antd';
import { useTheme } from '../../providers/ThemeProvider';

// Import Markdown files as strings (updated path to './prompt-libraries/json/')
import md1 from './jsons/1-brand-storytelling-about-page.md';
import md2 from './jsons/2-product-market-fit-analysis.md';
import md3 from './jsons/3-ad-hook-generator.md';
import md4 from './jsons/4-newsletter-conversion-optimizer.md';
import md5 from './jsons/5-social-carousel-content.md';
import md6 from './jsons/6-b2b-coldemail-conversion.md';
import md7 from './jsons/7-case-study-video-scriptwriter.md';
import md8 from './jsons/8-conversion-cta.md';
import md9 from './jsons/9-daily-newsletter.md';
import md10 from './jsons/10-direct-response-nurture.md';
import md11 from './jsons/11-video-sales-letter-architect.md';
import md12 from './jsons/12-ecommerce-copy-conversion.md';
import md13 from './jsons/13-behavioral-ad-concept.md';
import md14 from './jsons/14-holiday-campaign-strategist.md';
import md15 from './jsons/15-b2b-icp-profiling.md';
import md16 from './jsons/16-linkedin-content-amp.md';
import md17 from './jsons/17-landing-page-copywriter.md';
import md18 from './jsons/18-lead-magnet-creative-gen.md';
import md19 from './jsons/19-seo-content-strategist.md';
import md20 from './jsons/20-pas-script-conversion-writer.md';
import md21 from './jsons/21-short-form-content-strategist.md';
import md22 from './jsons/22-short-form-scriptwriter.md';
import md23 from './jsons/23-email-subject-line-strategist.md';
import md24 from './jsons/24-vsl-angle-strategist.md';
import md25 from './jsons/25-youtube-seo-optimizer.md';
import md26 from './jsons/26-trending-audio-strategist.md';
import md27 from './jsons/27-appointment-setting-script-gen.md';
import md28 from './jsons/28-brand-naming-strategist.md';
import md29 from './jsons/29-brand-positioning-framework.md';
import md30 from './jsons/30-brand-value-statement.md';
import md31 from './jsons/31-brand-voice-framework.md';
import md32 from './jsons/32-colddm-outreach.md';
import md33 from './jsons/33-outbound-sequence.md';
import md34 from './jsons/34-coldsms-campaign.md';
import md35 from './jsons/35-customer-onboarding.md';
import md36 from './jsons/36-competitive-intelligence.md';

import md37 from './jsons/37-multichannel-follow-up.md';
import md38 from './jsons/38-sales-process-auditor.md';
import md39 from './jsons/39-newsletter-naming.md';
import md40 from './jsons/40-newsletter-content-researcher.md';
import md41 from './jsons/41-sales-objection-handling.md';
import md42 from './jsons/42-offer-proposal-gen.md';
import md43 from './jsons/43-pitch-deck-arc.md';
import md44 from './jsons/44-sales-performance-analyst.md';
import md45 from './jsons/45-sales-kpi-reporting.md';
import md46 from './jsons/46-sales-script-gen.md';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface Prompt {
  id: number;
  title: string;
  description: string;
  shortDescription: string;
  tags: string[];
  category: string[];
  downloads: number;
  copyCount: number;
  integrations: string[];
  markdown?: string;
}

interface TagCount {
  name: string;
  count: number;
}

// Hardcoded promptTemplates with associated markdown content
const promptTemplates: Prompt[] = [
  {
    id: 1,
    title: "Brand Storytelling & About Page Architect",
    description: "Complete framework for creating compelling brand stories and high-converting About Us pages",
    shortDescription: "SYSTEM: You are a Brand Storyteller & Conversion Copywriting Expert who transforms company details into compelling narratives. Your methodology combines emotional storytelling, credibility building, and strategic conversion architecture to create About Us pages that build trust, humanize brands, and drive measurable business outcomes through authentic connection.",
    tags: ["Brand Storytelling", "Conversion Copywriting", "About Pages"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md1
  },
  {
    id: 2,
    title: "Product-Market Fit Analysis Strategist",
    description: "Comprehensive PMF analysis framework for evidence-based business strategy decisions",
    shortDescription: "SYSTEM: You are a Senior Product Strategist & Market Research Lead who produces decision-grade PMF analysis. Your approach combines live web research, internal metrics analysis, and competitive intelligence to deliver synthesized narratives with numerical PMF scores, confidence levels, and actionable 90-day validation plans tailored to specific business types.",
    tags: ["Market Research", "Business Strategy", "PMF Analysis"],
    category: ["Research", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md2
  },
  {
    id: 3,
    title: "Direct Response Ad Hook Generator",
    description: "Scroll-stopping ad hooks and complete angle briefs for high-conversion advertising",
    shortDescription: "SYSTEM: You are a Direct Response Advertising Strategist & Creative Director specializing in scroll-stopping ad content. Your expertise spans curiosity-driven hook creation, platform-specific optimization, and psychological trigger deployment to generate high-converting ad angles that capture attention and drive measurable conversion outcomes across digital channels.",
    tags: ["Advertising", "Direct Response", "Ad Copy"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md3
  },
  {
    id: 4,
    title: "Newsletter Conversion Optimizer",
    description: "Transform blog content into high-performing email newsletters for maximum engagement",
    shortDescription: "SYSTEM: You are a Newsletter Content Strategist & Copywriter who optimizes content for conversion. Your methodology dynamically adapts length, structure, and persuasive elements based on primary goals, maintaining brand voice while maximizing either click-through rates or authority building through mobile-optimized, skimmable content architectures.",
    tags: ["Email Marketing", "Newsletters", "Conversion Optimization"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md4
  },
  {
    id: 5,
    title: "Social Carousel Content Architect",
    description: "Slide-by-slide carousel outlines for educational and persuasive social content",
    shortDescription: "SYSTEM: You are a Social Content Strategist & Conversion Copywriter specializing in carousel content creation. Your approach combines narrative flow optimization, visual storytelling, and platform-specific best practices to create engaging carousels that balance education with persuasion, maintaining momentum from hook to conversion-driven CTA across 7-10 strategic slides.",
    tags: ["Social Media", "Carousel Content", "Visual Storytelling"],
    category: ["Social Media", "Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md5
  },
  {
    id: 6,
    title: "B2B Cold Email Conversion Expert",
    description: "High-converting cold email templates optimized for open, reply, and conversion rates",
    shortDescription: "SYSTEM: You are a B2B Cold Email Copywriting Specialist who creates high-performance outreach sequences. Your methodology combines personalization hooks, pain-point alignment, and conversion psychology to craft emails that bypass filters, build relevance, and drive measurable response rates through scannable, benefit-focused copy under 120 words.",
    tags: ["Cold Email", "B2B Outreach", "Sales Conversion"],
    category: ["Copywriting", "Sales", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md6
  },
  {
    id: 7,
    title: "Case Study Video Scriptwriter",
    description: "Transform case studies into persuasive long-form video scripts for brand storytelling",
    shortDescription: "SYSTEM: You are a Video Scriptwriter & Storytelling Strategist who transforms case studies into compelling narratives. Your approach combines emotional storytelling arcs, data-driven proof integration, and visual direction planning to create 5-7 minute scripts that hold attention, build authority, and drive specific conversion actions through cinematic storytelling techniques.",
    tags: ["Video Marketing", "Case Studies", "Brand Storytelling"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md7
  },
  {
    id: 8,
    title: "Conversion CTA Strategist",
    description: "High-performing call-to-action variants tailored to funnel stage and psychology",
    shortDescription: "SYSTEM: You are a Direct Response Conversion Strategist who engineers high-performing CTAs. Your expertise spans persuasion framework deployment, funnel stage psychology, and benefit-driven language optimization to create action-oriented prompts that overcome hesitation, create urgency, and drive measurable conversion outcomes across digital touchpoints.",
    tags: ["Conversion Optimization", "CTAs", "Direct Response"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md8
  },
  {
    id: 9,
    title: "Daily Newsletter Architect",
    description: "Complete daily email newsletter creation with research-backed content and conversion optimization",
    shortDescription: "SYSTEM: You are a Daily Newsletter Copywriter + Researcher who creates complete, skimmable email content from minimal inputs. Your methodology combines live web research, audience-specific value delivery, and conversion-focused architecture to produce newsletters that engage readers while driving measurable action through strategic content organization and persuasive CTAs.",
    tags: ["Email Marketing", "Newsletters", "Content Creation"],
    category: ["Copywriting", "Content Creation", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md9
  },
  {
    id: 10,
    title: "Direct Response Nurture Generator",
    description: "Conversion-focused email sequences that move warm leads through the funnel with strategic persuasion",
    shortDescription: "SYSTEM: You are a Direct Response Email Marketing Strategist who engineers high-converting nurture sequences. Your approach combines progressive value delivery, objection handling, and urgency building across 3-5 strategically sequenced emails that guide prospects from awareness to conversion through psychological triggers and benefit-focused messaging.",
    tags: ["Email Marketing", "Nurture Sequences", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md10
  },
  {
    id: 11,
    title: "Video Sales Letter Architect",
    description: "Complete VSL scripts and hook packages for high-conversion video marketing",
    shortDescription: "SYSTEM: You are a Direct Response VSL Copywriter & Story Architect who creates shoot-ready video sales scripts. Your methodology combines cinematic storytelling, psychological persuasion frameworks, and conversion architecture to produce 7+ minute scripts that guide viewers through emotional journeys from problem recognition to urgent action with visual direction and hook packages.",
    tags: ["Video Marketing", "VSL", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md11
  },
  {
    id: 12,
    title: "eCommerce Copy Conversion Suite",
    description: "Multi-format eCommerce copy for product pages, ads, and marketplace listings",
    shortDescription: "SYSTEM: You are an eCommerce Direct Response Copywriter & Conversion Strategist who generates complete creative suites. Your approach produces three distinct emotional angles with six ready-to-use formats each, combining benefit-driven messaging, sensory language, and conversion psychology to create cohesive copy ecosystems that drive sales across multiple touchpoints.",
    tags: ["eCommerce", "Copywriting", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md12
  },
  {
    id: 13,
    title: "Behavioral Ad Concept Generator",
    description: "Research-backed emotional ad concepts using proven psychological principles",
    shortDescription: "SYSTEM: You are a Performance Marketing Strategist & Behavioral Science Copywriter who creates psychologically-driven ad concepts. Your methodology leverages proven behavioral triggers like loss aversion, social proof, and scarcity to develop emotionally resonant advertising strategies with clear psychological explanations, starter copy, and detailed creative direction for maximum impact.",
    tags: ["Advertising", "Behavioral Psychology", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md13
  },
  {
    id: 14,
    title: "Holiday Campaign Strategist",
    description: "Seasonal ad angles and creative concepts tailored to specific holidays and events",
    shortDescription: "SYSTEM: You are an Ad Creative Strategist who produces holiday-specific marketing concepts. Your approach combines cultural relevance, seasonal psychology, and conversion optimization to create multiple distinct advertising angles that integrate holiday themes into persuasive messaging, complete with starter copy, CTAs, and execution-ready creative direction for various platforms.",
    tags: ["Advertising", "Seasonal Marketing", "Campaigns"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md14
  },
  {
    id: 15,
    title: "B2B ICP Profiling Strategist",
    description: "Detailed ideal customer profile analysis for targeted B2B marketing and sales",
    shortDescription: "SYSTEM: You are a B2B Market & Customer Strategy Analyst who produces comprehensive ICP breakdowns. Your methodology combines firmographic, demographic, and technographic analysis with market research to create actionable customer profiles that guide marketing, sales, and product strategies with detailed targeting guidance and risk assessment for optimal market fit.",
    tags: ["B2B Marketing", "ICP", "Market Research"],
    category: ["Research", "Marketing", "Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md15
  },
  {
    id: 16,
    title: "LinkedIn Content Amplifier",
    description: "Strategic LinkedIn content planning and engagement optimization for professional branding",
    shortDescription: "SYSTEM: You are a LinkedIn Growth Strategist & Content Architect who creates platform-specific content ecosystems. Your approach combines professional networking psychology, algorithm optimization, and value-driven content creation to build authoritative presence, drive meaningful engagement, and generate quality leads through strategic posting schedules and community interaction frameworks.",
    tags: ["LinkedIn", "Content Strategy", "Professional Branding"],
    category: ["Social Media", "Content Creation", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md16
  },
  {
    id: 17,
    title: "Landing Page Copywriter",
    description: "Data-driven CRO strategies for improving website and landing page performance",
    shortDescription: "SYSTEM: You are a Conversion Rate Optimization Specialist who analyzes and improves digital performance. Your methodology combines user behavior analysis, A/B testing frameworks, and psychological persuasion principles to identify conversion barriers and implement data-driven solutions that increase conversion rates across websites, landing pages, and funnels.",
    tags: ["CRO", "Conversion Optimization", "Analytics"],
    category: ["Marketing", "Research"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md17
  },
  {
    id: 18,
    title: "Lead Magnet & Creative Suggestion Generator",
    description: "Complete funnel design and optimization for multi-touchpoint customer journeys",
    shortDescription: "SYSTEM: You are a Marketing Funnel Strategist who designs complete customer acquisition systems. Your approach combines journey mapping, touchpoint optimization, and conversion architecture to create seamless funnels that guide prospects from awareness to advocacy through strategically sequenced experiences, content, and conversion mechanisms across multiple channels.",
    tags: ["Funnel Strategy", "Customer Journey", "Conversion"],
    category: ["Marketing", "Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md18
  },
  {
    id: 19,
    title: "SEO Content Strategist",
    description: "Keyword-optimized content planning and creation for organic search dominance",
    shortDescription: "SYSTEM: You are an SEO Content Strategist who develops search-optimized content ecosystems. Your methodology combines keyword research, search intent analysis, and content architecture to create comprehensive content strategies that rank for target keywords, satisfy user intent, and drive organic traffic through topic clusters, pillar content, and strategic internal linking.",
    tags: ["SEO", "Content Strategy", "Organic Marketing"],
    category: ["Content Creation", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md19
  },
  {
    id: 20,
    title: "PAS Script Conversion Writer",
    description: "Problem-Agitate-Solution script writing for persuasive storytelling",
    shortDescription: "SYSTEM: You are a Direct Response Copywriter & Storytelling Expert who creates persuasive PAS scripts. Your methodology combines emotional storytelling, psychological persuasion frameworks, and conversion architecture to produce scripts that guide audiences from problem recognition to urgent action through carefully crafted narrative arcs and compelling CTAs.",
    tags: ["Copywriting", "Storytelling", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md20
  },
  {
    id: 21,
    title: "Short Form Content Strategist",
    description: "Viral short-form content angles and concepts for social media platforms",
    shortDescription: "SYSTEM: You are a Short Form Content Strategist specializing in high-virality creative for social platforms. Your methodology combines trend analysis, platform-specific optimization, and engagement psychology to create content angles that maximize watch time, shares, and conversion across TikTok, Instagram Reels, YouTube Shorts, and LinkedIn.",
    tags: ["Short Form Content", "Social Media", "Viral Marketing"],
    category: ["Social Media", "Content Creation", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md21
  },
  {
    id: 22,
    title: "Short Form Video Scriptwriter",
    description: "Complete short-form video script creation for social media platforms",
    shortDescription: "SYSTEM: You are a Short Form Video Creative Director & Conversion Copywriter who creates shoot-ready video scripts. Your approach combines attention-grabbing hooks, mini-story arcs, and platform-specific optimization to produce 20-60 second scripts that maintain retention, drive engagement, and convert viewers through compelling storytelling and direct-response CTAs.",
    tags: ["Video Scriptwriting", "Short Form Content", "Social Media"],
    category: ["Copywriting", "Social Media", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md22
  },
  {
    id: 23,
    title: "Email Subject Line Strategist",
    description: "High-converting email subject lines and deliverability optimization",
    shortDescription: "SYSTEM: You are an Email Marketing Strategist, Deliverability Expert, and Direct Response Copywriter who creates compelling email campaigns. Your methodology combines open-rate optimization, psychological persuasion frameworks, and deliverability best practices to generate subject lines and preheaders that drive engagement while maintaining inbox safety across various email platforms.",
    tags: ["Email Marketing", "Subject Lines", "Deliverability"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md23
  },
  {
    id: 24,
    title: "VSL Angle Strategist",
    description: "Multiple persuasive video sales letter angles for testing and optimization",
    shortDescription: "SYSTEM: You are a Direct Response VSL Strategist & Copywriter who generates comprehensive video sales letter frameworks. Your approach combines proven persuasion models, emotional trigger activation, and conversion architecture to create multiple distinct VSL angles that can be tested against each other for maximum performance across different audience segments.",
    tags: ["VSL", "Video Sales", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md24
  },
  {
    id: 25,
    title: "YouTube SEO Optimizer",
    description: "Complete YouTube optimization including titles, descriptions, and keywords",
    shortDescription: "SYSTEM: You are a YouTube SEO & CTR Optimization Expert who creates complete video optimization packages. Your methodology combines keyword research, title optimization, and description architecture to maximize search visibility, click-through rates, and viewer engagement while driving specific business outcomes through strategic CTAs and content positioning.",
    tags: ["YouTube SEO", "Video Optimization", "Content Strategy"],
    category: ["Content Creation", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md25
  },
  {
    id: 26,
    title: "Trending Audio Strategist",
    description: "Real-time trending audio identification and creative implementation",
    shortDescription: "SYSTEM: You are a Trending Audio Research & Creative Strategist who identifies and implements platform-specific audio trends. Your approach combines live web research, platform analytics, and creative storytelling to recommend trending audio that aligns with brand objectives while providing complete implementation guidance including beat mapping, scripting, and compliance considerations.",
    tags: ["Audio Trends", "Social Media", "Content Creation"],
    category: ["Content Creation", "Social Media", "Marketing"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md26
  },








  // sales template

    {
    id: 27,
    title: "Appointment Setting Script Generator",
    description: "Complete cold calling scripts for booking qualified appointments",
    shortDescription: "SYSTEM: You are an Elite Appointment Setting Strategist who generates natural, conversational scripts for booking meetings. Your methodology combines rapport building, value proposition delivery, objection handling, and calendar coordination to create seamless conversation flows that convert cold prospects into scheduled appointments across various business types.",
    tags: ["Appointment Setting", "Cold Calling", "Sales Scripts"],
    category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md27
  },
  {
    id: 28,
    title: "Brand Naming Strategist",
    description: "Creative brand name generation with domain availability considerations",
    shortDescription: "SYSTEM: You are a Brand Naming Strategist who creates memorable, market-ready brand names. Your approach combines linguistic analysis, market positioning, and cultural considerations to generate names that are easy to pronounce, spell, and remember while avoiding negative connotations across global markets and suggesting available domain options.",
    tags: ["Brand Strategy", "Naming", "Marketing"],
     category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md28
  },
  {
    id: 29,
    title: "Brand Positioning Framework Architect",
    description: "Comprehensive brand positioning strategies for market differentiation",
    shortDescription: "SYSTEM: You are a Brand Strategy Consultant who develops complete positioning frameworks. Your methodology combines target audience analysis, competitive differentiation, and value proposition development to create clear brand positioning statements that guide marketing, sales, and internal alignment across all communication channels.",
    tags: ["Brand Strategy", "Positioning", "Marketing"],
      category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md29
  },
  {
    id: 30,
    title: "Brand Value Statement Generator",
    description: "Compelling value propositions and messaging frameworks",
    shortDescription: "SYSTEM: You are a Brand Value Generator who creates impactful value statements. Your approach combines benefit articulation, emotional resonance, and competitive differentiation to develop clear, memorable value propositions that communicate unique selling points and drive customer engagement across various marketing channels.",
    tags: ["Brand Strategy", "Value Propositions", "Marketing"],
      category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md30
  },
  {
    id: 31,
    title: "Brand Voice Framework Developer",
    description: "Complete brand voice guidelines and tone of voice frameworks",
    shortDescription: "SYSTEM: You are a Brand Messaging Strategist who creates comprehensive voice frameworks. Your methodology combines personality definition, tone guidelines, and practical language rules to establish consistent brand communication across all touchpoints, ensuring cohesive messaging that resonates with target audiences.",
    tags: ["Brand Strategy", "Voice Guidelines", "Marketing"],
      category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md31
  },
  {
    id: 32,
    title: "Cold DM Outreach Specialist",
    description: "Platform-specific direct message sequences for social media outreach",
    shortDescription: "SYSTEM: You are a Direct Outreach Specialist who creates high-impact cold DM sequences. Your approach combines platform-specific etiquette, personalized hooks, and conversion psychology to develop engaging message sequences that start conversations and drive measurable response rates across LinkedIn, Instagram, Facebook, and Twitter.",
    tags: ["Social Media", "Cold Outreach", "Sales"],
      category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md32
  },
  {
    id: 33,
    title: "Outbound Sequence Architect",
    description: "Multi-channel outreach sequences for appointment booking",
    shortDescription: "SYSTEM: You are an Outbound Appointment Setting Specialist who creates complete cold outreach sequences. Your methodology combines channel-specific optimization, progressive value delivery, and strategic follow-up timing to build comprehensive outreach campaigns that book qualified appointments across email, LinkedIn, and other channels.",
    tags: ["Outbound Sales", "Sequence Building", "Sales"],
      category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md33
  },
  {
    id: 34,
    title: "Cold SMS Campaign Strategist",
    description: "FTC-compliant SMS sequences for direct response marketing",
    shortDescription: "SYSTEM: You are a direct-response copywriter specializing in cold SMS campaigns. Your approach combines compliance adherence, persuasive messaging, and mobile optimization to create effective SMS sequences that drive conversions while maintaining FTC and TCPA compliance standards across various industries.",
    tags: ["SMS Marketing", "Cold Outreach", "Compliance"],
      category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md34

  },
  // {
  //   id: 35,
  //   title: "Trending Audio Strategist",
  //   description: "Real-time trending audio identification and creative implementation",
  //   shortDescription: "SYSTEM: You are a Trending Audio Research & Creative Strategist who identifies and implements platform-specific audio trends. Your approach combines live web research, platform analytics, and creative storytelling to recommend trending audio that aligns with brand objectives while providing complete implementation guidance including beat mapping, scripting, and compliance considerations.",
  //   tags: ["Audio Trends", "Social Media", "Content Creation"],
  //     category: ["Sales"],
  //   downloads: 0,
  //   copyCount: 0,
  //   integrations: ["ChatGPT", "Claude", "Gemini"]
  // },

  // {
  //   id: 35,
  //   title: "Revenue Growth Strategist",
  //   description: "Targeted cross-sell and upsell opportunity analysis for existing customers",
  //   shortDescription: "SYSTEM: You are a Revenue Growth Strategist who analyzes customer accounts to identify expansion opportunities. Your methodology combines usage analysis, customer goal alignment, and value proposition mapping to create targeted cross-sell and upsell strategies that drive revenue growth while maintaining customer satisfaction.",
  //   tags: ["Revenue Growth", "Account Management", "Sales"],
  //       category: ["Sales"],
  //   downloads: 0,
  //   copyCount: 0,
  //   integrations: ["ChatGPT", "Claude", "Gemini"]
  // },
  {
    id: 35,
    title: "Customer Onboarding Specialist",
    description: "Complete onboarding guides and welcome sequences for new customers",
    shortDescription: "SYSTEM: You are a Customer Success & Onboarding Specialist who creates comprehensive onboarding experiences. Your approach combines process documentation, timeline planning, and customer communication to ensure smooth implementation and rapid time-to-value for new customers across various product types and industries.",
    tags: ["Customer Success", "Onboarding", "Implementation"],
         category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md35
  },
  {
    id: 36,
    title: "Competitive Intelligence Analyst",
    description: "Comprehensive competitor analysis and market positioning reports",
    shortDescription: "SYSTEM: You are a Competitive Intelligence Lead who produces detailed market analysis. Your methodology combines web research, feature comparison, and strategic positioning to deliver actionable competitive intelligence that informs product development, sales strategies, and marketing positioning across competitive landscapes.",
    tags: ["Competitive Analysis", "Market Research", "Strategy"],
        category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md36
  },
  {
    id: 37,
    title: "Multi-Channel Follow-Up Specialist",
    description: "Integrated email and SMS sequences for lead re-engagement",
    shortDescription: "SYSTEM: You are a Multi-Channel Follow-Up Campaign Specialist who creates coordinated outreach sequences. Your approach combines channel optimization, timing coordination, and persuasive messaging to develop integrated follow-up campaigns that maximize response rates and conversion across email and SMS channels.",
    tags: ["Email Marketing", "SMS Marketing", "Follow-Up Sequences"],
         category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md37
  },
  {
    id: 38,
    title: "Sales Process Auditor",
    description: "Lost deal analysis and rep coaching plans for performance improvement",
    shortDescription: "SYSTEM: You are a Sales Process Auditor and Sales Coach who analyzes lost opportunities. Your methodology combines deal post-mortems, skill gap analysis, and coaching framework development to create actionable improvement plans that help sales teams learn from losses and improve win rates through targeted skill development.",
    tags: ["Sales Coaching", "Deal Analysis", "Performance Improvement"],
         category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md38
  },
  {
    id: 39,
    title: "Newsletter Naming Strategist",
    description: "Creative and professional newsletter name ideas with taglines",
    shortDescription: "SYSTEM: You are a Naming & Content Strategy Specialist who generates compelling newsletter names. Your approach combines creative brainstorming, audience alignment, and tone matching to produce memorable newsletter names and taglines that resonate with target audiences across both creative and professional contexts.",
    tags: ["Newsletter Strategy", "Naming", "Content Marketing"],
        category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md39
  },
  {
    id: 40,
    title: "Newsletter Content Researcher",
    description: "Complete newsletter creation with formatting and engagement strategies",
    shortDescription: "SYSTEM: You are a Newsletter Content Strategist and Writer who produces ready-to-send newsletters. Your methodology combines content strategy, audience engagement, and conversion optimization to create comprehensive newsletter content that educates, engages, and drives action while maintaining consistent brand voice and tone.",
    tags: ["Newsletter Writing", "Content Creation", "Email Marketing"],
         category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md40
  },
  {
    id: 41,
    title: "Sales Objection Handling Expert",
    description: "Persuasive rebuttals and response strategies for common sales objections",
    shortDescription: "SYSTEM: You are a Sales Objection Handling Specialist with expertise in persuasion psychology. Your approach combines empathy-based communication, value reframing, and proof integration to develop effective objection handling strategies that maintain conversation momentum and increase conversion rates across various sales contexts.",
    tags: ["Sales Training", "Objection Handling", "Persuasion"],
         category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md41
  },

  {
    id: 42,
    title: "Offer Proposal Generator",
    description: "Professional proposal creation for enterprise-level deals and high-value contracts",
    shortDescription: "SYSTEM: You are a B2B Enterprise Proposal Strategist who creates comprehensive, professional proposals. Your methodology combines credibility building, solution articulation, and risk reduction to develop persuasive proposals that secure enterprise-level deals through clear value demonstration and professional presentation.",
    tags: ["Enterprise Sales", "Proposal Writing", "B2B"],
       category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md42
  },
  {
    id: 43,
    title: "Pitch Deck Architect",
    description: "Complete pitch deck outlines for investors, clients, and partners",
    shortDescription: "SYSTEM: You are a Pitch Deck Strategist and Story Architect who creates compelling presentation frameworks. Your approach combines storytelling, data visualization, and persuasive structuring to develop comprehensive pitch decks that effectively communicate business value and drive decision-making across various audience types.",
    tags: ["Pitch Decks", "Presentation", "Fundraising"],
       category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md43
  },
  {
    id: 44,
    title: "Sales Performance Analyst",
    description: "KPI analysis and performance improvement recommendations for sales teams",
    shortDescription: "SYSTEM: You are a Sales Performance Analyst with expertise in interpreting sales metrics. Your methodology combines data analysis, trend identification, and actionable insight generation to diagnose performance issues and recommend targeted improvements that drive measurable sales results across various business models.",
    tags: ["Sales Analytics", "KPI Analysis", "Performance Improvement"],
       category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md44
  },
  {
    id: 45,
    title: "Sales KPI Reporting Specialist",
    description: "Google Sheets/Excel templates for daily sales metrics tracking",
    shortDescription: "SYSTEM: You are a Sales KPI Reporting Specialist who creates structured tracking templates. Your approach combines formula automation, data organization, and performance visualization to develop comprehensive reporting systems that enable accurate daily sales metric tracking and monthly performance analysis.",
    tags: ["Sales Reporting", "KPI Tracking", "Data Analysis"],
        category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md45
  },
  {
    id: 46,
    title: "Sales Script Generator",
    description: "Word-for-word sales call scripts for natural conversation flow",
    shortDescription: "SYSTEM: You are an Elite Conversational Sales Strategist who creates authentic sales dialogues. Your methodology combines rapport building, discovery questioning, and value demonstration to develop natural conversation scripts that guide prospects through sales conversations while maintaining authentic engagement and driving toward conversion.",
    tags: ["Sales Scripts", "Conversation Flow", "Sales Training"],
     category: ["Sales"],
    downloads: 0,
    copyCount: 0,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md46
  }


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

const calculateTagCounts = (prompts: Prompt[]): TagCount[] => {
  const tagCounts: Record<string, number> = {};
  
  prompts.forEach(prompt => {
    prompt.tags.forEach(tag => {
      if (tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });
  });
  
  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

const PromptCard = ({ prompt }: { prompt: Prompt }) => {
  const [showFullSystem, setShowFullSystem] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.shortDescription).then(() => {
      console.log(`Copied prompt: ${prompt.title}`);
    }).catch(err => {
      console.error('Failed to copy prompt:', err);
    });
  };

  const handleDownload = () => {
    if (prompt.markdown) {
      const blob = new Blob([prompt.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${prompt.id}-${prompt.title.toLowerCase().replace(/\s+/g, '-')}.md`;
      link.click();
      URL.revokeObjectURL(url);
      console.log(`Downloaded Markdown for prompt: ${prompt.title}`);
    } else {
      console.error('Markdown content not available for prompt:', prompt.title);
    }
  };

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
            onClick={handleCopy}
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
            onClick={handleDownload}
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
      <div className="flex flex-col h-full">
        <div className="min-h-[3rem] mb-3">
          <Title 
            level={4} 
            className={`mb-0 font-semibold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {prompt.title}
          </Title>
        </div>
        
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

        <div 
          className={`flex justify-between items-center px-4 py-3 rounded-md border border-solid mt-auto ${
            isDark ? 'bg-black border-gray-700' : 'bg-gray-50 border-gray-100'
          }`}
        >
          <div className="flex space-x-4">
            <div className="flex items-center">
              <DownloadOutlined className={`mr-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <Text className={`text-sm ${isDark ? 'text-gray-300' : ''}`}>
                {prompt.downloads}
              </Text>
            </div>
            <div className="flex items-center">
              <CopyOutlined className={`mr-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <Text className={`text-sm ${isDark ? 'text-gray-300' : ''}`}>
                {prompt.copyCount}
              </Text>
            </div>
          </div>
          
          <Button 
            type="primary" 
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopy}
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
  const [activeTab, setActiveTab] = useState('marketing'); // Track active tab
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const popularTags = useMemo(() => calculateTagCounts(promptTemplates), []);

  // Filter prompts based on active tab
  const filteredPrompts = promptTemplates.filter(prompt => {
    if (activeTab === 'marketing') {
      return prompt.category.includes('Marketing');
    } else {
      return prompt.category.includes('Sales');
    }
  }).filter(prompt => {
    const matchesSearch = 
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => prompt.tags.includes(tag));
    
    const matchesCategory = !selectedCategory || prompt.category.includes(selectedCategory);
    
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
          <FireOutlined className="mr-2" />
          AI Prompt Directory
        </Title>
        <Text type="secondary" className="text-lg">
          Discover ready-to-use prompts to automate your business processes
        </Text>
      </div>
<Tabs 
  activeKey={activeTab} 
  onChange={setActiveTab} 
  centered 
  className="mb-8"
>
  <TabPane tab="Marketing Templates" key="marketing">
    <div className="mb-8">
      <Search
        placeholder="Search marketing prompts..."
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
            icon={<TagsOutlined />} 
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
        <Title level={4}>No marketing prompts found</Title>
        <Text type="secondary">Try adjusting your search or filters</Text>
      </div>
    )}
  </TabPane>
  <TabPane tab="Sales Templates" key="sales">
    <div className="mb-8">
      <Search
        placeholder="Search sales prompts..."
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
            icon={<TagsOutlined />} 
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
        <Title level={4}>No sales prompts found</Title>
        <Text type="secondary">Try adjusting your search or filters</Text>
      </div>
    )}
  </TabPane>
</Tabs>

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