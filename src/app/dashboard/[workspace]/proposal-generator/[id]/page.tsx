"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  SolutionOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import {
  message,
  Collapse,
  type CollapseProps
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

import VidalyticsEmbed from '@/components/VidalyticsEmbed';

// --- Types ---

interface GammaProposalDetail {
  id: string;
  title: string;
  gammaPrompt: string;
  inputSnapshot: any;
  clientName: string;
  companyName: string;
  solutionCount: number;
  tone: string;
  tokensUsed: number;
  processingTime: number;
  analysisId: string | null;
  createdAt: string;
  updatedAt: string;
  workspace: { id: string; name: string; slug: string };
}

// --- Constants ---

const GAMMA_APP_URL = 'https://gamma.app';

const videoWalkthroughs = [
  {
    title: 'Step 1: Pasting Your Prompt into Gamma',
    description: 'Learn how to take your generated prompt and paste it into Gamma.app to create a beautiful presentation.',
    videoId: 'ICx2ePCXxSyHU52h',
  },
  {
    title: 'Step 2: Choosing a Theme & Customizing',
    description: 'Pick from Gamma\'s professional themes and customize colors to match your brand.',
    videoId: '',
  },
  {
    title: 'Step 3: Exporting & Sending Your Proposal',
    description: 'Export your finished proposal as a PDF or share a live link with your prospect.',
    videoId: '',
  },
];

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-widest text-gray-500 font-manrope mb-3 mt-0">
    {children}
  </p>
);

const Rule = () => <div className="border-t border-white/5 my-10" />;

// --- Main Component ---

const GammaProposalDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<GammaProposalDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const proposalId = params?.id as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace && proposalId) {
      fetchDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorkspaceReady, currentWorkspace, proposalId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/proposal-generator/${proposalId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setDetail(data.data);
      } else {
        throw new Error(data.error || 'Failed to load gamma proposal');
      }
    } catch (err) {
      console.error('Error fetching gamma proposal:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      message.error('Failed to load gamma proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!detail?.gammaPrompt) return;
    try {
      await navigator.clipboard.writeText(detail.gammaPrompt);
      message.success('Prompt copied to clipboard!');
    } catch {
      // Fallback
      const textarea = document.getElementById('gamma-prompt-output') as HTMLTextAreaElement;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
        message.success('Prompt copied!');
      }
    }
  };

  const handleOpenGamma = () => {
    window.open(GAMMA_APP_URL, '_blank', 'noopener,noreferrer');
  };

  // --- Render States ---

  if (loading || !isWorkspaceReady) {
    return (
      <div className="min-h-screen bg-black font-manrope">
        <div className="max-w-5xl mx-auto px-8 py-20 text-center">
          <LoadingOutlined className="text-5xl text-[#5CC49D] mb-6 animate-spin" />
          <p className="text-xl text-gray-200">Loading proposal details...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-black font-manrope">
        <div className="max-w-5xl mx-auto px-8 py-20 text-center">
          <p className="text-xl text-gray-300 mb-6">{error || 'Proposal not found'}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-gray-200 hover:border-white/20 transition-all"
            >
              <ArrowLeftOutlined /> Go Back
            </button>
            <button
              onClick={fetchDetail}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5CC49D] text-black font-semibold text-sm hover:bg-[#4db38c] transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Construct AntD Collapse Items
 // ... inside your component
const collapseItems: CollapseProps['items'] = videoWalkthroughs.map((video, index) => ({
  key: String(index),
  label: (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <PlayCircleOutlined className="text-[#5CC49D] text-sm" />
      </div>
      <span className="text-base text-gray-300 font-manrope font-medium">
        {video.title}
      </span>
    </div>
  ),
  children: (
    <div className="pl-11 pr-4 pb-4">
      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
        {video.description}
      </p>
      <div className="w-full rounded-lg overflow-hidden border border-white/10 bg-black/40">
        {video.videoId ? (
          // ADD key={video.videoId} HERE
          <VidalyticsEmbed key={video.videoId} videoId={video.videoId} />
        ) : (
          <div className="w-full aspect-video flex flex-col items-center justify-center text-gray-600 bg-white/5">
            <PlayCircleOutlined className="text-2xl mb-2 opacity-50" />
            <p className="text-xs uppercase tracking-wide">Video Coming Soon</p>
          </div>
        )}
      </div>
    </div>
  ),
}));


  return (
    <div className="min-h-screen bg-black font-manrope">
      <div className="px-8 py-14 w-full">
        
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeftOutlined className="text-xs group-hover:-translate-x-1 transition-transform" /> 
          Back to List
        </button>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-100 mb-3 leading-tight">
                {detail.title || 'Untitled Proposal'}
              </h1>
              
              {/* Meta Tags */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                  <CalendarOutlined /> 
                  {new Date(detail.createdAt).toLocaleDateString()}
                </span>
                
                {detail.solutionCount > 0 && (
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#5CC49D]/10 text-[#5CC49D] border border-[#5CC49D]/10">
                    <SolutionOutlined />
                    {detail.solutionCount} Solution{detail.solutionCount !== 1 ? 's' : ''}
                  </span>
                )}

                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                  <ThunderboltOutlined /> 
                  {detail.tokensUsed.toLocaleString()} tokens
                </span>
                
                {detail.tone && (
                  <span className="capitalize px-2 py-1 rounded bg-white/5 border border-white/5 text-gray-400">
                    {detail.tone} Tone
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Output */}
        <div className="mb-8">
          <Label>Gamma Prompt</Label>
          <div className="relative group">
            <textarea
              id="gamma-prompt-output"
              readOnly
              value={detail.gammaPrompt}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-5 text-sm text-gray-300 font-mono leading-relaxed resize-y min-h-[400px] focus:outline-none focus:border-[#5CC49D]/50 transition-colors"
            />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Copy"
              >
                <CopyOutlined />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#5CC49D] text-black font-bold text-sm hover:bg-[#4db38c] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#5CC49D]/20"
          >
            <CopyOutlined /> Copy Prompt
          </button>
          
          <button
            onClick={handleOpenGamma}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[#5CC49D]/40 text-[#5CC49D] font-semibold text-sm hover:bg-[#5CC49D]/10 transition-colors"
          >
            <GlobalOutlined /> Open Gamma.app
          </button>

          {detail.analysisId && (
            <button
              onClick={() => router.push(`/sales-call-analyzer/analysis/${detail.analysisId}`)}
              className="flex items-center gap-2 px-5 py-3 bg-black rounded-lg border border-white/10 text-emerald-200 text-sm hover:text-gray-200 hover:border-white/20 transition-colors ml-auto"
            >
              View Source Analysis
            </button>
          )}
        </div>

        <Rule />

        {/* Video Tutorials */}
        <div className="max-w-4xl">
          <h2 className="text-xl font-semibold text-gray-200 mb-2">How to Use This Prompt</h2>
          <p className="text-sm text-gray-500 mb-8">
            Follow these video walkthroughs to turn your prompt into a polished proposal presentation.
          </p>

          <Collapse
            ghost
            className="proposal-video-collapse border-none"
            expandIconPosition="end"
            items={collapseItems}
          />
        </div>

        <Rule />

        {/* Footer CTA */}
        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-10 text-center max-w-3xl mx-auto">
          <h3 className="text-lg font-medium text-gray-200 mb-2">Don&apos;t have a Gamma account?</h3>
          <p className="text-sm text-gray-500 mb-6">
            Gamma turns your prompt into a beautiful, interactive presentation in seconds.
          </p>
          <button
            onClick={handleOpenGamma}
            className="px-8 py-3 rounded-lg bg-[#5CC49D] text-black font-bold text-sm hover:bg-[#4db38c] transition-colors"
          >
            Sign Up for Gamma Free
          </button>
        </div>

      </div>
    </div>
  );
};

export default GammaProposalDetailPage;