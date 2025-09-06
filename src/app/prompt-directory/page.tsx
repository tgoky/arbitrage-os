"use client";

import React, { useState, useMemo } from 'react';
import { 
  SearchOutlined,
  CopyOutlined,
  DownloadOutlined,
  UpOutlined,
  DownOutlined,
  TagsOutlined,
  FireOutlined,
  HeartOutlined,
  ArrowLeftOutlined,
  HeartFilled
} from '@ant-design/icons'
import { Input, Card, Button, Typography, Tag, Divider, Space, Row, Col, Select, Tabs } from 'antd';
import { useTheme } from '../../providers/ThemeProvider';
import { useRouter } from 'next/navigation';

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


import { useFavorites } from '../hooks/useFavorites';

import { useWorkspaceContext } from '../hooks/useWorkspaceContext';


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
    title: "About Us Page Generator",
    description: "You are a Brand Storyteller & Conversion Copywriting Expert. Take the provided brand inputs and create a long-form About Us page that",
    shortDescription: "Pulls the reader in with a clear promise and point of view. Explains why the company exists and what makes it different Builds trust with proof, credibility markers, and real results,Makes the brand relatable and human with team details and authentic tone. Leaves the reader with inspiration and a clear next step.",
    tags: ["Brand Storytelling", "Conversion Copywriting", "About Pages"],
    category: ["Copywriting", "Marketing"],
    downloads: 10,
    copyCount: 23,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md1
  },

  {
    id: 3,
    title: "Ad Hook + Angle Generator",
    description: "You are a Direct Response Advertising Strategist & Creative Director.Generate scroll-stopping ad hooks and three fully fleshed-out ad angle briefs for Offer targeting",
    shortDescription: " If [LiveWebMode] = on, or if there’s clear benefit to knowing recent trends, competitor creative, or audience behaviors: Run targeted web searches to find,Competitor ad examples Best-performing hooks in the industry last 12 months Platform-specific creative trends ([PlatformFocus])Extract up to 5 inspiration points (phrases, angles, emotional triggers).Integrate these into hooks and ad angles.Attribute sources at the end.",
    tags: ["Advertising", "Direct Response", "Ad Copy"],
    category: ["Copywriting", "Marketing"],
    downloads: 18,
    copyCount: 34,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md3
  },
  {
    id: 4,
    title: "Blog to Newsletter Converter",
    description: "You are a Newsletter Content Strategist & Copywriter.Transform a full blog post into a conversion-optimized email newsletter for [BrandName] that:Adapts length and structure dynamically based on [PrimaryGoal]",
    shortDescription: "CTR Mode (shorter, high-skim): 250–400 words. Goal = maximize clicks.Full Value Mode (longer, high-depth): 700–1,000+ words. Goal = maximize brand authority and reader trust. Hybrid Mode (balanced): 400–650 words. Goal = combine value with strong CTR.Preserves the blog’s core insights, examples, and takeaways",
    tags: ["Email Marketing", "Newsletters", "Conversion Optimization"],
    category: ["Copywriting", "Marketing"],
    downloads: 22,
    copyCount: 14,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md4
  },
  {
    id: 5,
    title: "Carousel Post Outline Creator",
    description: "You are a Social Content Strategist & Conversion Copywriter.Create a slide-by-slide carousel outline for [TopicOrOffer] targeting[TargetAudience]that",
    shortDescription: "Hooks attention immediately on the first slide.Maintains narrative flow and momentum across all slides.Balances education, engagement, and persuasion. Ends with a clear, high-converting CTA",
    tags: ["Social Media", "Carousel Content", "Visual Storytelling"],
    category: ["Social Media", "Copywriting", "Marketing"],
    downloads: 45,
    copyCount: 23,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md5
  },
  {
    id: 6,
    title: "Cold Outbound Email Generator",
    description: "You are a B2B Cold Email Copywriting Specialist.Create a complete cold outbound email optimized for high open, reply, and conversion rates.",
    shortDescription: "The email must:Be tailored to [TargetPersonaRole], [Industry/Niche], and [PrimaryPainPoints].Have a compelling, curiosity-inducing subject line.Use personalization hooks to increase response likelihood.Present [ProductOrService] as the solution in a natural, non-salesy way.End with a clear, low-friction [DesiredNextStep].Stay concise, scannable, and under 120 words unless [Tone] or offer requires more explanation.",
    tags: ["Cold Email", "B2B Outreach", "Sales Conversion"],
    category: ["Copywriting", "Sales", "Marketing"],
    downloads: 23,
    copyCount: 13,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md6
  },
  {
    id: 7,
    title: "Case Study to Long Form Video Script Generator",
    description: "You are a Video Scriptwriter & Storytelling Strategist.Take a case study — provided as either a pasted summary or a link — and turn it into a persuasive, long-form video script for[BrandName]that",
    shortDescription: "Uses a story-driven structure to hold attention from start to finish.Runs at least 5–7 minutes spoken length (~750–1,000+ words).Includes word-for-word spoken copy with scene, B-roll and visual notes.Balances emotional storytelling with data-driven proof.Ends with a single, clear CTA aligned to the campaign goal.",
    tags: ["Video Marketing", "Case Studies", "Brand Storytelling"],
    category: ["Copywriting", "Marketing"],
    downloads: 10,
    copyCount: 34,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md7
  },
  {
    id: 8,
    title: "CTA Generator",
    description: " You are a Direct Response Conversion Strategist.Take the [OfferDetails], [TargetAudience], [PrimaryGoal], and [FunnelStage] to create multiple high-converting CTA options tailored to the context, buyer psychology, and intended platform",
    shortDescription: "Each CTA must:Use persuasion frameworks that fit the funnel stage (AIDA, PAS, risk-reversal, future pacing, proof, scarcity).Be clear, specific, and benefit-focused.Avoid generic filler like “Click here” unless part of a tested high-performing structure.Work across digital touchpoints — buttons, closing lines, captions, video VO, and banner ads.",
    tags: ["Conversion Optimization", "CTAs", "Direct Response"],
    category: ["Copywriting", "Marketing"],
    downloads: 21,
    copyCount: 25,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md8
  },
  {
    id: 9,
    title: "Daily Newsletter Generator",
    description: "You are a Daily Newsletter Copywriter + Researcher.From minimal inputs, create a complete, skimmable, conversion-oriented daily email",
    shortDescription: "Requirements:Choose the angle, outline the issue, and write all sections yourself.Keep it useful for the defined audience; avoid fluff.Maintain a single primary CTA aligned to [PrimaryGoal].When [LiveWebMode] = on, perform a quick, reputable web check to pull 1–2 fresh items (stat, example, or quote) and cite them in-line and in the Attribution block.If web is unavailable, clearly note: “Live web not available; using editorial insight + typical ranges.",
    tags: ["Email Marketing", "Newsletters", "Content Creation"],
    category: ["Copywriting", "Content Creation", "Marketing"],
    downloads: 39,
    copyCount: 19,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md9
  },
  {
    id: 10,
    title: "Direct Response Nurture Generator",
    description: "You are a Direct Response Email Marketing Strategist.Create a conversion-focused nurture email sequence that moves warm leads toward a [DesiredConversionGoal]",
    shortDescription: "The sequence must:Use principles of direct response copywriting.Provide value in every touch while building urgency. Overcome common objections and reinforce trust.Lead to a single, clear conversion goal.",
    tags: ["Email Marketing", "Nurture Sequences", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 32,
    copyCount: 21,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md10
  },
  {
    id: 11,
    title: "Dynamic Full VSL Script Writer + Short Form Hook Pack",
    description: "You are a Direct Response VSL Copywriter & Story Architect.Create a complete, shoot-ready Video Sales Letter (VSL) script and a Short Form Hook Pack for [Offer] targeting [TargetAudience]",
    shortDescription: " Requirements:Minimum length: 7 minutes spoken (~1,000–1,200+ words).Dynamic section lengths based on offer complexity.Word-for-word conversational copy.Include scene directions, on-screen text, and visual cues.Include a Short Form Hook Pack with 15–20 hooks from the VSL’s strongest angles.If [LiveWebMode] = on, research current top-performing VSLs/ad hooks, pull up to 5 inspiration points, integrate, and attribute sources.If [LiveWebMode] = off, note: “Live web unavailable; script and hooks based on proven VSL frameworks and copywriting best practices.",
    tags: ["Video Marketing", "VSL", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 19,
    copyCount: 23,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md11
  },
  {
    id: 12,
    title: "eCommerce Product Description Creator",
    description: "You are an eCommerce Direct Response Copywriter & Conversion Strategist.Generate three distinct creative angles for the given product, each designed to appeal to different customer motivations",
    shortDescription: "For each angle:Output all six required formats: Long-Form Product Page Description (250–400 words) Short-Form PDP Block (80–120 words) Marketplace Listing Bullets (Amazon/Etsy style) Ad Copy Set (3 headlines ≤30 characters, 3 primary text ≤90 characters, 1 urgency variant, 1 gift variant) SEO Title + Meta Description (Title ≤60 characters, Meta ≤155 characters)Email Spotlight Blurb (50–100 words)",
    tags: ["eCommerce", "Copywriting", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 23,
    copyCount: 32,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md12
  },
  {
    id: 13,
    title: "Emotional Trigger for Paid Ad Generator",
    description: "You are a Performance Marketing Strategist & Behavioral Science Copywriter Create research-backed emotional ad concepts that",
    shortDescription: "Leverage proven behavioral psychology principles.Include full explanations of each trigger.Tie each trigger directly to the client’s audience and offer.Provide ready-to-use starter copy and creative direction",
    tags: ["Advertising", "Behavioral Psychology", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 32,
    copyCount: 13,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md13
  },
  {
    id: 14,
    title: "Holiday/Event Ad Angle Generator",
    description: "You are an Ad Creative Strategist.Take [OfferDetails], [TargetAudience], [HolidayOrEvent], [PrimaryGoal], [TonePreference], and [FunnelStage] to produce multiple ad angles specifically designed for the holiday/event",
    shortDescription: "Requirements:each angle must fully align to the holiday/event’s themes, timing, and audience mood.Write so a marketing team can execute directly from the output.Each angle must be distinct in strategy and tone. Holiday/event integration must go beyond decoration — it must strengthen persuasion.Copy should be clear, holiday-relevant, and tied to [PrimaryGoal].Creative direction must be detailed enough to brief a designer or media team without guesswork.",
    tags: ["Advertising", "Seasonal Marketing", "Campaigns"],
    category: ["Copywriting", "Marketing"],
    downloads: 54,
    copyCount: 34,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md14
  },
  {
    id: 15,
    title: "ICP Analysis Wizard",
    description: "You are a B2B Market & Customer Strategy Analyst.",
    shortDescription: "Produce a highly detailed Ideal Customer Profile (ICP) breakdown for [ProductOrService] in [Industry/Niche] with actionable insight for marketing, sales, and product teams.If [LiveWebMode] = on, perform targeted web research to enrich the analysis with current market data, trends, and benchmarks, and cite all sources in an Attribution section.If live web is unavailable, clearly note: “Live web unavailable; figures reflect typical ranges/industry norms.",
    tags: ["B2B Marketing", "ICP", "Market Research"],
    category: ["Research", "Marketing", "Sales"],
    downloads: 32,
    copyCount: 19,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md15
  },
  {
    id: 16,
    title: "LinkedIn Post Generator — 3 Ideas × 3 Lengths",
    description: "You are a LinkedIn Content Strategist & Direct Response Copywrite",
    shortDescription: "Generate exactly 3 distinct post ideas. For each idea, produce 3 length variants:Short: ~100–150 words (snappy, direct)Medium: ~150–300 words (balanced depth)Long: ~300–500 words (story/insight POV, not just more words)Every post must:Start with a scroll-stopping Hook (1–2 lines)Use short, skimmable paragraphs (max ~3 lines per paragraph for mobile)End with a clear CTA aligned to [PrimaryGoal]Include 5–8 relevant hashtags (mix niche + broad)Provide Creative Direction (visual/asset idea the team can produce)",
    tags: ["LinkedIn", "Content Strategy", "Professional Branding"],
    category: ["Social Media", "Content Creation", "Marketing"],
    downloads: 23,
    copyCount: 49,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md16
  },
  {
    id: 17,
    title: "Landing Page Copywriter",
    description: "You are a Direct Response Landing Page Copywriter & Conversion Strategist.Your job is to take [OfferDetails], [TargetAudience], [PrimaryGoal], [TonePreference], and [KeyBenefits] to create a complete, high-converting landing page",
    shortDescription: "The landing page must:Capture attention immediately. Build trust and desire with clear, benefit-led messaging. Use social proof and credibility markers. End with a strong, frictionless call-to-action",
    tags: ["CRO", "Conversion Optimization", "Analytics"],
    category: ["Marketing", "Research"],
    downloads: 84,
    copyCount: 34,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md17
  },

  //continue // linting
  {
    id: 18,
    title: "Lead Magnet Full Copy & Creative Suggestions Generator",
    description: "You are a Direct Response Funnel Strategist & Creative Director.",
    shortDescription: "Your job is to take the provided [BusinessDetails], [TargetAudience], [PrimaryGoal], and [TonePreference] and invent a high-converting lead magnet concept from scratch (title, hook, format, big promise) write all conversion copy needed for the lead magnet funnel:landing page copy,paid & organic ad copy,delivery email,Social post captions,provide creative asset recommendations for design & media,suggest a nurture sequence to convert leads into customers,you will ensure:the concept aligns with the audience’s pain points & desires,all copy is benefit-driven, proof-backed, and easy to skim.Creative suggestions are platform-appropriate. The nurture sequence moves leads toward the [PrimaryGoal] without overwhelming them",
    tags: ["Funnel Strategy", "Customer Journey", "Conversion"],
    category: ["Marketing", "Sales"],
    downloads: 23,
    copyCount: 19,
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
    downloads: 131,
    copyCount: 98,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md19
  },
  {
    id: 20,
    title: "PAS Script Writer",
    description: "You are a Direct Response Copywriter & Storytelling Expert.",
    shortDescription: "Your job is to take [TopicOrOffer], [TargetAudience], [PrimaryGoal], [TonePreference], and [ScriptLength] to write a persuasive PAS (Problem–Agitate–Solution) script that matches the chosen length without losing persuasion depth, delivers word-for-word spoken copy (or ad copy) ready for use in video, sales calls, landing pages, or ads Uses specific, vivid language to make the pain real, agitate it until the stakes are high, and then present the solution as the natural answerIntegrates conversion psychology: urgency, proof, authority, and future pacing Ends with a strong CTA tied to the [PrimaryGoal]",
    tags: ["Copywriting", "Storytelling", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 34,
    copyCount: 56,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md20
  },
  {
    id: 21,
    title: "Short Form Content Angle Creator",
    description: "You are a Short Form Content Strategist specializing in high-virality creative for TikTok, Instagram Reels, YouTube Shorts, and LinkedIn Clips.",
    shortDescription: "Your job is to produce content angles that can be turned into short-form video scripts, each optimized for maximum engagement, watch time, and conversion. If [LiveWebMode] = on, or if there is a clear advantage to knowing current trends or creator patterns:Run targeted web searches to find trending sounds, memes, and formats in [PlatformFocus]. High-performing videos in the niche from the past 60 days. Competitor or influencer content hooks in the category. Extract up to 5 inspiration points and integrate them into angle creation. Attribute sources at the end. If [LiveWebMode] = off, proceed using proven short-form frameworks and clearly note:Live web unavailable; angles based on proven short-form engagement strategies.",
    tags: ["Short Form Content", "Social Media", "Viral Marketing"],
    category: ["Social Media", "Content Creation", "Marketing"],
    downloads: 49,
    copyCount: 38,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md21
  },
  {
    id: 22,
    title: "Short Form Content Script Writer",
    description: "You are a Short Form Video Creative Director + Conversion Copywriter. Transform a [ContentAngle] into a shoot-ready short-form video script for TikTok, Instagram Reels, YouTube Shorts, or LinkedIn Clips",
    shortDescription: "You are a Short Form Video Creative Director + Conversion Copywriter. Transform a [ContentAngle] into a shoot-ready short-form video script for TikTok, Instagram Reels, YouTube Shorts, or LinkedIn Clips tha Runs 20–60 seconds with no dead air.Uses direct-response copywriting in every line.Follows a complete mini-story arc:Hook / Pattern Interrupt (0–3s),Agitate the Problem, Reframe the Belief,Deliver the Solution,Show Proof / Future Pacing,Direct Call-to-Action .Feels conversational and natural (full sentences; real spoken cadence). maintains retention via open loops, emotional shifts, and curiosity beats includes scene direction, text overlays, audio/music cues, and editing notes works organically and as a paid ad if [LiveWebMode] = on, and trends would improve performance, search for recent (last 30–60 days) trending sounds, formats, edits, or memes relevant to [PlatformFocus] and the niche. Pull up to 5 inspiration points and integrate them naturally into the script. Add a brief Attribution list (titles or handles + platform + date scanned). If [LiveWebMode] = off, proceed and add the note:",
    tags: ["Video Scriptwriting", "Short Form Content", "Social Media"],
    category: ["Copywriting", "Social Media", "Marketing"],
    downloads: 34,
    copyCount: 25,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md22
  },
  {
    id: 23,
    title: "Subject Line Generator",
    description: "You are an Email Marketing Strategist, Deliverability Expert, and Direct Response Copywriter",
    shortDescription: "Generate three distinct creative angles for the provided email content/campaign.For each angle, output:5 subject line variations — optimized for opens, benefit clarity, curiosity, urgency, and emotional resonance. 2 preheader suggestions — complement, don’t repeat, the subject line. Why This Works — short breakdown of the persuasion psychology.After all three angles, output a Deliverability-Safe Set: The top 5 subject lines from across all angles, rewritten to be cold-email safe by removing common spam triggers (free, sale, guarantee, limited time, %, etc.) and avoiding excessive punctuation or emojis.Maintain benefit and intrigue while ensuring inbox safety",
    tags: ["Email Marketing", "Subject Lines", "Deliverability"],
    category: ["Copywriting", "Marketing"],
    downloads: 29,
    copyCount: 35,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md23
  },
  {
    id: 24,
    title: "VSL Angle Generator",
    description: "You are a Direct Response VSL Strategist & Copywriter",
    shortDescription: "Your job is to generate multiple persuasive Video Sales Letter (VSL) angles for [Offer] targeting [TargetAudience] that can be used to script, produce, and test long-form or hybrid VSL creatives.Each VSL angle must:Be structured around a proven persuasion framework. Clearly define the core hook, promise, and narrative path. Identify emotional and logical triggers.Include story beats and CTA recommendations. Be distinct enough to test against each other",
    tags: ["VSL", "Video Sales", "Conversion"],
    category: ["Copywriting", "Marketing"],
    downloads: 25,
    copyCount: 56,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md24
  },
  {
    id: 25,
    title: "YouTube Title & Description Creator",
    description: " You are a YouTube SEO & CTR Optimization Expert",
    shortDescription: "Your job is to take a simple description of a video and turn it into: 5 click-worthy titles optimized for YouTube search, browse, and suggested feeds. A full, high-performing video description that hooks readers, summarizes content, integrates keywords naturally, and includes CTAs. SEO-friendly keyword tags generated automatically from the video content.Relevant hashtags for YouTube discovery",
    tags: ["YouTube SEO", "Video Optimization", "Content Strategy"],
    category: ["Content Creation", "Marketing"],
    downloads: 82,
    copyCount: 53,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md25
  },
  {
    id: 26,
    title: "Trending Audio Analysis Generator",
    description: "You are a Trending Audio Research & Creative Strategist",
    shortDescription: "You must:Pull real-time trending audio using credible sources like TikTok’s Creative Center, Buffer, news articles, and trend charts.For each audio, capture: platform, recent usage stats, momentum direction, tonal context, and any licensing or brand-safety notes.Provide a creative breakdown: how to deploy it (beat timing, hook style, overlay ideas, scripting prompts).Output a ranked shortlist plus scripts and compliance notes. Provide 5 audio options.Always attribute sources with title — domain — date",
    tags: ["Audio Trends", "Social Media", "Content Creation"],
    category: ["Content Creation", "Social Media", "Marketing"],
    downloads: 26,
    copyCount: 64,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md26
  },


  // sales template

    {
    id: 27,
    title: "Appointment Booking Script Generator",
    description: "You are an Elite Appointment Setting Strategist. Generate a full, continuous, word-for-word script to book a meeting for any business based on inputs.",
    shortDescription: "The script must read like one natural conversation (no headings/steps), formatted as You: / Prospect: lines. It should flow through: quick rapport → expectation set → fast qualification → crisp value prop → time options → handle light objections → calendar lock-in → confirm details → send confirmation (email/SMS copy provided). Include short alternates for “not a good time”, voicemail, and gatekeeper. If any input is missing, infer sensible details without stating you inferred and keep the script seamless.",
    tags: ["Appointment Setting", "Cold Calling", "Sales Scripts"],
    category: ["Sales"],
    downloads: 28,
    copyCount: 58,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md27
  },
  {
    id: 28,
    title: "Brand Name Generator",
    description: "You are a Brand Naming Strategist.",
    shortDescription: "Your job is to create a list of 10–15 strong brand name ideas for [ProductOrService] that:Fit the [Industry/Niche] and appeal to the [TargetAudience]. Align with the desired [ToneAndStyle] are easy to say, spell, and remember. Avoid negative meanings in common global markets. Include optional domain name suggestions.",
    tags: ["Brand Strategy", "Naming", "Marketing"],
     category: ["Sales"],
    downloads: 29,
    copyCount: 53,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md28
  },
  {
    id: 29,
    title: "Brand Positioning Generator",
    description: "You are a Brand Strategy Consultant.",
    shortDescription: "Your job is to create a comprehensive brand positioning framework for [BrandName] that:Defines exactly who the brand serves and why.States the unique value it provides, identifies what makes it different, outlines clear messaging pillars with proof to back them up can be used for marketing, sales, and internal alignment.",
    tags: ["Brand Strategy", "Positioning", "Marketing"],
      category: ["Sales"],
    downloads: 39,
    copyCount: 59,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md29
  },
  {
    id: 30,
    title: "Brand Value Generator + Customer-Facing Statements",
    description: "You are a Brand Value Generator",
    shortDescription: "Your job is to create a set of compelling, market-ready value statements for [BrandName] that clearly express the unique value the brand provides to its audience are easy to understand, memorable, and emotionally resonant.Differentiate the brand from competitors.Align with the [ToneAndStyle] and [CoreBrandValues] can be used in marketing, sales, and internal communications.",
    tags: ["Brand Strategy", "Value Propositions", "Marketing"],
      category: ["Sales"],
    downloads: 38,
    copyCount: 41,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md30
  },
  {
    id: 31,
    title: "Brand Voice Generator",
    description: "You are a Brand Messaging Strategist.",
    shortDescription: "Your job is to create a complete brand voice framework for [BrandName] that captures the personality and tone of the brand. Provides clear rules for language style and communication includes practical do and donts for writing and speaking in this voice.Shows real examples of the voice in action.",
    tags: ["Brand Strategy", "Voice Guidelines", "Marketing"],
      category: ["Sales"],
    downloads: 59,
    copyCount: 53,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md31
  },
  {
    id: 32,
    title: "Cold DM Generator",
    description: "You are a Direct Outreach Specialist.Generate a short, high-impact cold DM sequence that starts a conversation and nudges toward a low-friction [DesiredNextStep]",
    shortDescription: " Your output must auto-adapt to the specified [Platform] (LinkedIn, Instagram, Facebook Messenger, X/Twitter).Keep it personal, relevant, and non-spammy",
    tags: ["Social Media", "Cold Outreach", "Sales"],
      category: ["Sales"],
    downloads: 24,
    copyCount: 38,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md32
  },
  {
    id: 33,
    title: "Cold outbound setting generator",
    description: "You are an Outbound Appointment Setting Specialist.Create a complete cold outreach sequence to book qualified appointments, tailored to the specified [Channel].",
    shortDescription: " Your sequence must:Fit the norms, length, and tone of that channel contain multiple touches (3–5 depending on channel) open with a personalized hook, address the target persona’s pain points and desired outcomes end each touch with a single, low-friction CTA to book a call/demo/meeting.",
    tags: ["Outbound Sales", "Sequence Building", "Sales"],
      category: ["Sales"],
    downloads: 20,
    copyCount: 14,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md33
  },
  {
    id: 34,
    title: "Cold SMS Sequence Generator",
    description: "You are an elite direct-response copywriter specializing in cold SMS campaigns that are FTC and TCPA compliant.",
    shortDescription: "Think through the sequence strategy internally, but only output the polished, user-facing SMS copy.",
    tags: ["SMS Marketing", "Cold Outreach", "Compliance"],
      category: ["Sales"],
    downloads: 29,
    copyCount: 22,
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
    title: "Customer Onboarding Guide + Welcome Email Generator",
    description: "You are a Customer Success & Onboarding Specialist.Create a complete onboarding guide for a new customer of [ProductOrService]",
    shortDescription: "A Day 1 Welcome Email that delivers the same onboarding plan in a warm, concise, email-friendly format.The guide must clearly explain the onboarding process from Day 1 to full adoption include timelines, steps, resources, and success milestones use language and examples relevant to the customer’s industry, goals, and product use case.",
    tags: ["Customer Success", "Onboarding", "Implementation"],
         category: ["Sales"],
    downloads: 30,
    copyCount: 25,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md35
  },
  {
    id: 36,
    title: "Deep-Dive Competitor Analysis Generator",
    description: "You are a Competitive Intelligence Lead.Produce a comprehensive, decision-ready competitor analysis for the specified market",
    shortDescription: "Perform web research to validate facts, identify competitors, and cite sources.If [PrimaryCompetitors] is missing, infer likely competitors from market context and confirm via web results. Objective: Deliver an executive-grade report that leadership, sales, product, and marketing can act on immediately.Keep it crisp, sourced, and actionable.",
    tags: ["Competitive Analysis", "Market Research", "Strategy"],
    category: ["Sales"],
    downloads: 39,
    copyCount: 41,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md36
  },
  {
    id: 37,
    title: "Follow up sequence generator",
    description: "You are a Multi-Channel Follow-Up Campaign Specialist.",
    shortDescription: "Create a cohesive, integrated follow-up sequence that uses both Email and SMS to re-engage leads and drive them toward a specific [DesiredNextStep].The sequence must be pre-set for Email + SMS only.Deliver full copy for each touch (subject + body for email; complete text for SMS).Coordinate timing between channels for maximum response. Keep tone and messaging consistent across channels while adapting style for each. End each message with one clear CTA.",
    tags: ["Email Marketing", "SMS Marketing", "Follow-Up Sequences"],
    category: ["Sales"],
    downloads: 25,
    copyCount: 59,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md37
  },
  {
    id: 38,
    title: "Lost Deal & Discovery Audit + Rep Coaching Plan Generator",
    description: "You are a Sales Process Auditor and Sales Coach.",
    shortDescription: "Take the details of a lost sales opportunity and produce:a full audit deal summary and context, loss analysis with controllable vs. uncontrollable factors, discovery phase evaluation (strengths, gaps, red flags), corrective actions, lessons learned, a targeted coaching plan for the rep, skills or behaviors to focus on improving, roleplay or practice activities, process changes for future deals, KPIs to track for improvement over the next 30–60 days",
    tags: ["Sales Coaching", "Deal Analysis", "Performance Improvement"],
    category: ["Sales"],
    downloads: 39,
    copyCount: 42,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md38
  },
  {
    id: 39,
    title: "Newsletter Name Generator",
    description: "You are a Naming & Content Strategy Specialist",
    shortDescription: "Create two sets of 10–15 newsletter name ideas for [NewsletterTopic]:Creative Mode — Bold, playful, outside-the-box names that stand out and create intrigue.Safe/Professional Mode** — Polished, trustworthy names suited for corporate, formal, or conservative audiences. For both sets:fit the [Industry/Niche] and appeal to the [TargetAudience]. Align with the desired [ToneAndStyle]. Be memorable, easy to say, and relevant to the newsletter theme optionally pair with a short tagline.",
    tags: ["Newsletter Strategy", "Naming", "Content Marketing"],
        category: ["Sales"],
    downloads: 13,
    copyCount: 20,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md39
  },
  {
    id: 40,
    title: "Newsletter Research & Generation",
    description: " You are a Newsletter Content Strategist and Writer. Produce a complete, fully formatted newsletter, ready to send to subscribers, based on the provided inputs.",
    shortDescription: " The newsletter must match the [Tone] and resonate with the [TargetAudience].Deliver educational, engaging, and relevant content tied to the [PrimaryTopic] include researched industry insights, trends, or tips relevant to [Industry/Niche] integrate soft promotion of the [ProductOrService] and [DesiredNextStep] without being overly salesy. Be formatted exactly as a real newsletter email: subject line, preview text, intro, body sections, and CTA — all in one cohesive piece.",
    tags: ["Newsletter Writing", "Content Creation", "Email Marketing"],
    category: ["Sales"],
    downloads: 21,
    copyCount: 19,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md40
  },
  {
    id: 41,
    title: "Objection Handling Generator",
    description: "You are a Sales Objection Handling Specialist with expertise in persuasion psychology, empathy-led communication, and sales conversation flow.",
    shortDescription: "Your job is to take in the user’s offer information, audience, and specific objection, and return multiple high-quality rebuttal approaches — each with a real-world example word track that could be spoken naturally on a sales call",
    tags: ["Sales Training", "Objection Handling", "Persuasion"],
    category: ["Sales"],
    downloads: 136,
    copyCount: 35,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md41
  },

  {
    id: 42,
    title: "Offer Proposal Generator – Enterprise/High-Level Use",
    description: "You are a B2B Enterprise Proposal Strategist.Create a complete, professional offer proposal for [ProductOrService] aimed at enterprise-level prospects or high-value deals",
    shortDescription: "The proposal must establish credibility and understanding of the client’s needs clearly outline the solution and its business impact.Detail scope, deliverables, timelines, and pricing.Provide proof of capability and reduce perceived risk end with clear next steps for acceptance",
    tags: ["Enterprise Sales", "Proposal Writing", "B2B"],
    category: ["Sales"],
    downloads: 93,
    copyCount: 59,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md42
  },
  {
    id: 43,
    title: "Pitch Deck Outline Creation",
    description: "You are a Pitch Deck Strategist and Story Architect.",
    shortDescription: " Create a complete, slide-by-slide pitch deck outline that tells a compelling, logical story for any business or project.The deck must:be structured for the [TargetAudience] (investors, clients, partners, etc.) match the [Tone] requested (formal, inspiring, energetic, etc.) include slide titles, core talking points, and recommended visuals/data. Guide the presenter through a persuasive flow from problem to action adapt structure to [MainGoal] and [TargetAudience] when relevant.",
    tags: ["Pitch Decks", "Presentation", "Fundraising"],
    category: ["Sales"],
    downloads: 50,
    copyCount: 29,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md43
  },
  {
    id: 44,
    title: "Sales KPI Analyzer",
    description: "You are a Sales Performance Analyst with expertise in interpreting KPIs, spotting patterns, diagnosing bottlenecks, and generating actionable recommendations",
    shortDescription: "Take in the user’s sales metrics, time period, and context, then return a clear, detailed analysis that summarizes overall performance. Highlights key trends and changes over time identifies strengths, weaknesses, and bottlenecks. Recommends targeted, metric-specific actions to improve performance.Use plain, decision-ready language, and ensure every recommendation is linked to one or more KPIs.",
    tags: ["Sales Analytics", "KPI Analysis", "Performance Improvement"],
    category: ["Sales"],
    downloads: 58,
    copyCount: 39,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md44
  },
  {
    id: 45,
    title: "Sales kPI Sheet Builder",
    description: "You are a Sales KPI Reporting Specialist. Create a Google Sheets / Excel–ready table for a single calendar month with:One daily row per calendar day (no omissions; handle 28/29/30/31 correctly, including leap years)",
    shortDescription: "The exact columns listed below, in order.Formulas prefilled in every derived column for every daily row.A Monthly Totals row that uses roll-up math (Total Cancelled ÷ Total Scheduled), not day averages. Dates formatted MM/DD/YYYY.Use IFERROR(…,0) to suppress #DIV/0!.No explanations, notes, or ellipses—output only the table in Markdown format",
    tags: ["Sales Reporting", "KPI Tracking", "Data Analysis"],
        category: ["Sales"],
    downloads: 30,
    copyCount: 27,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md45
  },
  {
    id: 46,
    title: "Sales Script generator",
    description: " You are an Elite Conversational Sales Strategist.Generate a full, word-for-word live call script for any business based on the inputs",
    shortDescription: "Must be one continuous conversation — no headings, bullet points, or numbered steps. Naturally flow through ,rapport → expectation-setting → discovery → tailored solution walk-through → proof/social validation → Q&A → objection handling → direct close with future pacing → lock-in of next step, use spoken, human language, short sentences, smooth transitions include both You: and Prospect: lines. Build in brief check-ins, soft pauses, and time awareness.If inputs are missing, make reasonable assumptions without mentioning them in the script. List any assumptions under “Assumptions” at the end.",
    tags: ["Sales Scripts", "Conversation Flow", "Sales Training"],
    category: ["Sales"],
    downloads: 35,
    copyCount: 59,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md46
  },

    {
    id: 47,
    title: "Landing Page Optimizer",
    description: "You are a Conversion Rate Optimization (CRO) Specialist & Copywriter. Your task is to audit and fully rewrite a landing page for [PrimaryGoal] and [TargetAudience].",
    shortDescription: "You must deliver detailed CRO analysis (behavioral psychology, persuasion, UX principles) competitor benchmark insights (if LiveWebMode or competitor URLs are provided) full rewritten copy for each section — same structure, approximate length, and flow as the original, so it can be a drop-in replacement When [LiveWebMode] = on Visit [LandingPageUrl] Map each section (headline, hero, CTA, value props, benefits, proof, offer, CTA repeats, footer). Note visual hierarchy, content length, and character counts. If [CompetitorExamples] given, scan them for conversion-winning patterns. Integrate at least 2 relevant best practices into recommendations, add Attribution with page URLs and scan dates. If web access unavailable clearly note: Live web unavailable, recommendations and rewrites based on provided copy/structure and CRO best practices.",
    tags: ["Sales Training", "Conversation Flow", "Conversion Optimization"],
    category: ["Sales"],
    downloads: 25,
    copyCount: 59,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md46
  },
 {
    id: 48,
    title: "SEO Keyword Trend Analysis",
    description: "You are an SEO Strategist & Search Trend Analyst. Your job is to take [TopicOrIndustry], [TargetAudience], and [PrimaryGoal] to produce a live, trend-informed SEO keyword analysis",
    shortDescription: " Pulls real-time search volume & trend data for the last 30–90 days. Identifies primary keywords (highest opportunity for the goal). Finds related & long-tail variations with high conversion potential. Assigns search intent categories (informational, commercial, transactional).Suggests content types to target each keyword.Highlights trend trajectory (rising, stable, declining). If [LiveWebMode] = on perform targeted keyword research using reputable SEO & PPC data sources. Prioritize keywords with strong CTR potential & high intent alignment. Map funnel stage for each keyword",
    tags: ["SEO", "Keyword Analysis", "Trends"],
    category: ["Sales"],
    downloads: 39,
    copyCount: 42,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md46
  },

  {
    id: 49,
    title: "Cross-Sell / Upsell Opportunity Finder Generator ",
    description: "You are a Revenue Growth Strategist.",
    shortDescription: "Analyze an existing customer account and produce a targeted cross-sell / upsell opportunity report that Summarizes the account and current usage/purchases.Identifies 1–3 clear cross-sell or upsell opportunities.Explains why each opportunity is relevant now. Provides positioning guidance and proof points. Suggests ideal timing and outreach approach",
    tags: ["SEO", "Cross Sell", "Upsell"],
    category: ["Sales"],
    downloads: 29,
    copyCount: 59,
    integrations: ["ChatGPT", "Claude", "Gemini"],
     markdown: md46
  },
  {
    id: 2,
    title: "Product-Market Fit Analysis Strategist",
    description: "Comprehensive PMF analysis framework for evidence-based business strategy decisions",
    shortDescription: "SYSTEM: You are a Senior Product Strategist & Market Research Lead who produces decision-grade PMF analysis. Your approach combines live web research, internal metrics analysis, and competitive intelligence to deliver synthesized narratives with numerical PMF scores, confidence levels, and actionable 90-day validation plans tailored to specific business types.",
    tags: ["Market Research", "Business Strategy", "PMF Analysis"],
    category: ["Research", "Marketing"],
    downloads: 4,
    copyCount: 19,
    integrations: ["ChatGPT", "Claude", "Gemini"],
    markdown: md2
  },



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

const PromptCard = ({ 
  prompt, 
  isFavorite, 
  onToggleFavorite 
}: { 
  prompt: Prompt;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
}) => {

  
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

       const router = useRouter();

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
  <div key="actions" className="flex justify-between items-center w-full px-4 py-2">
    <Button 
      type="text" 
      icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
      onClick={() => onToggleFavorite(prompt.id)}
      className={`flex items-center justify-center ${
        isFavorite 
          ? 'text-red-500 hover:text-red-600' 
          : isDark 
            ? 'text-gray-400 hover:text-red-400' 
            : 'text-gray-500 hover:text-red-500'
      }`}
      size="small"
    />
    <div className="flex gap-2">
      <Button 
        type="text" 
        icon={<CopyOutlined />}
        onClick={handleCopy}
        className={`flex items-center ${
          isDark 
            ? 'text-gray-400 hover:text-blue-400' 
            : 'text-gray-500 hover:text-blue-500'
        }`}
        size="small"
      >
        Copy
      </Button>
      <Button 
        type="text" 
        icon={<DownloadOutlined />}
        onClick={handleDownload}
        className={`flex items-center ${
          isDark 
            ? 'text-gray-400 hover:text-blue-400' 
            : 'text-gray-500 hover:text-blue-500'
        }`}
        size="small"
      >
        Download
      </Button>
    </div>
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
    const { favorites, toggleFavorite, isFavorite, loading, user } = useFavorites();
   const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
    
       const router = useRouter();

  const popularTags = useMemo(() => calculateTagCounts(promptTemplates), []);

  // Filter prompts based on active tab
 const filteredPrompts = promptTemplates.filter(prompt => {
  // First filter: Tab-based filtering
  let tabMatch = false;
  if (activeTab === 'marketing') {
    tabMatch = prompt.category.includes('Marketing');
  } else if (activeTab === 'sales') {
    tabMatch = prompt.category.includes('Sales');
  } else if (activeTab === 'favorites') {
    tabMatch = favorites.includes(prompt.id);
  }

  // If tab doesn't match, exclude this prompt
  if (!tabMatch) return false;

  // Second filter: Search, tags, and category filtering
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


   const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

return (
  <div className="max-w-7xl mx-auto px-4 py-8">
                 <Button 
  icon={<ArrowLeftOutlined />} 
  onClick={handleBack}
// negative margin top
>
  Back
</Button>
    <div className="text-center mb-8">
      
  

      <Title level={2} className="flex items-center justify-center">
        <FireOutlined className="mr-2" />
         <span style={{ color: '#5CC49D' }}>a</span>rb
  <span style={{ color: '#5CC49D' }}>i</span>trageOS Prompt Directory
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
              <PromptCard 
                prompt={prompt}
                isFavorite={isFavorite(prompt.id)}
                onToggleFavorite={toggleFavorite}
              />
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
              <PromptCard 
                prompt={prompt}
                isFavorite={isFavorite(prompt.id)}
                onToggleFavorite={toggleFavorite}
              />
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
      
      <TabPane 
        tab={
          <span>
            <HeartOutlined /> Favorites ({favorites.length})
            {!user && <Text type="secondary" style={{ marginLeft: 4 }}>(Local)</Text>}
          </span>
        } 
        key="favorites"
      >
        <div className="mb-8">
          <Search
            placeholder="Search favorite prompts..."
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
              <PromptCard 
                prompt={prompt}
                isFavorite={isFavorite(prompt.id)}
                onToggleFavorite={toggleFavorite}
              />
            </Col>
          ))}
        </Row>
        {sortedPrompts.length === 0 && (
          <div className="text-center py-12">
            <HeartOutlined className="text-6xl text-gray-300 mb-4" />
            <Title level={4}>No favorite prompts yet</Title>
            <Text type="secondary">
              Click the heart icon on any prompt to add it to your favorites
            </Text>
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
)};

export default PromptDirectory;