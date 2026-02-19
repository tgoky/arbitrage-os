"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  FundProjectionScreenOutlined,
  LoadingOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Typography,
  Spin,
  message,
  Collapse,
  Tag,
  ConfigProvider,
  theme,
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

import VidalyticsEmbed from '@/components/VidalyticsEmbed';

const { Title, Text } = Typography;

const BRAND_GREEN = '#5CC49D';
const SURFACE_BG = '#000000';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const BORDER_COLOR = '#334155';

const videoWalkthroughs = [
  {
    title: 'Step 1: Pasting Your Prompt into Gamma',
    description: 'Learn how to take your generated prompt and paste it into Gamma.app to create a beautiful presentation.',
        videoId: 'ICx2ePCXxSyHU52h',
  },
  {
    title: 'Step 2: Choosing a Theme & Customizing',
    description: 'Pick from Gamma\'s professional themes and customize colors to match your brand.',
  },
  {
    title: 'Step 3: Exporting & Sending Your Proposal',
    description: 'Export your finished proposal as a PDF or share a live link with your prospect.',
  },
];

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

const GAMMA_APP_URL = 'https://gamma.app';

const GammaProposalDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<GammaProposalDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const proposalId = params.id as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, proposalId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      message.error('Failed to copy');
    }
  };

  const handleOpenGamma = () => {
    window.open(GAMMA_APP_URL, '_blank', 'noopener,noreferrer');
  };

  if (!isWorkspaceReady) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <ConfigProvider theme={{ token: { colorPrimary: BRAND_GREEN } }}>
          <Spin size="large" tip="Loading workspace..." />
        </ConfigProvider>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto px-8 py-14 text-center">
          <LoadingOutlined className="text-5xl text-[#5CC49D] mb-6" />
          <p className="text-xl text-gray-200">Loading gamma proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-xl text-gray-300 mb-4">{error || 'Gamma proposal not found'}</p>
          <div className="flex justify-center gap-3">
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
              Go Back
            </Button>
            <Button type="primary" onClick={fetchDetail}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          fontFamily: 'Manrope, sans-serif',
          colorPrimary: BRAND_GREEN,
          borderRadius: 8,
          colorTextHeading: TEXT_PRIMARY,
          colorText: TEXT_SECONDARY,
          colorBgContainer: SURFACE_BG,
          colorBgElevated: SURFACE_BG,
          colorBorder: BORDER_COLOR,
        },
        components: {
          Button: {
            colorPrimary: BRAND_GREEN,
            algorithm: true,
            fontWeight: 600,
            colorTextLightSolid: '#000000',
          },
          Card: {
            headerBg: SURFACE_BG,
            colorBgContainer: SURFACE_BG,
            colorTextHeading: TEXT_PRIMARY,
            colorBorder: BORDER_COLOR,
          },
        },
      }}
    >
      <div className="min-h-screen bg-black font-manrope">
        <div className="max-w-4xl mx-auto px-8 py-14">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeftOutlined className="text-xs" /> Back
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(92, 196, 157, 0.15)' }}>
                <FundProjectionScreenOutlined style={{ color: BRAND_GREEN, fontSize: 20 }} />
              </div>
              <h1 className="text-3xl font-semibold text-gray-100 leading-tight m-0">
                {detail.title}
              </h1>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarOutlined /> {new Date(detail.createdAt).toLocaleDateString()}
              </span>
              {detail.tone && (
                <Tag color="default" className="border-0" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                  {detail.tone}
                </Tag>
              )}
              {detail.solutionCount > 0 && (
                <Tag color="default" className="border-0" style={{ background: 'rgba(92, 196, 157, 0.1)', color: BRAND_GREEN }}>
                  {detail.solutionCount} solution{detail.solutionCount !== 1 ? 's' : ''}
                </Tag>
              )}
              <span className="flex items-center gap-1">
                <ThunderboltOutlined /> {detail.tokensUsed.toLocaleString()} tokens
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#5CC49D] text-black font-semibold text-sm hover:bg-[#4db38c] transition-colors"
            >
              <CopyOutlined /> Copy to Clipboard
            </button>
            <button
              onClick={handleOpenGamma}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#5CC49D] border border-[#5CC49D]/40 text-black font-semibold text-sm hover:bg-[#5CC49D]/10 transition-colors"
            >
              Open Gamma.app
            </button>
            {detail.analysisId && (
              <button
                onClick={() => router.push(`/sales-call-analyzer/analysis/${detail.analysisId}`)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#5CC49D]  border border-white/10 text-black font-semibold text-sm hover:border-white/20 hover:text-white transition-colors"
              >
                View Source Analysis
              </button>
            )}
          </div>

          {/* Prompt Output */}
          <Card
            title="Gamma Prompt"
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <textarea
              readOnly
              value={detail.gammaPrompt}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-sm text-gray-300 font-mono leading-relaxed resize-y min-h-[400px] focus:outline-none"
            />
          </Card>

          {/* Video Walkthroughs */}
          <div className="mt-10">
            <h2 className="text-lg font-medium text-gray-200 mb-2">How to Use This Prompt in Gamma</h2>
            <p className="text-sm text-gray-500 mb-6">
              Follow these video walkthroughs to turn your prompt into a polished proposal presentation.
            </p>

            <Collapse
              ghost
              className="proposal-video-collapse"
              expandIconPosition="end"
              items={videoWalkthroughs.map((video, index) => ({
                key: String(index),
                label: (
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <PlayCircleOutlined className="text-[#5CC49D] text-sm" />
                    </div>
                    <span className="text-base text-gray-300 font-manrope">{video.title}</span>
                  </div>
                ),
                children: (
                  <div className="pl-11">
                    <p className="text-sm text-gray-500 mb-4">{video.description}</p>
                    <div className="w-full">
                      {video.videoId ? (
                        <VidalyticsEmbed videoId={video.videoId} />
                      ) : (
                        <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                          <p className="text-sm text-gray-600">Video coming soon</p>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
          

          {/* Gamma CTA */}
          <div className="text-center border border-white/10 rounded-lg p-8 mt-10">
            <h3 className="text-base font-medium text-gray-200 mb-2">Don&apos;t have a Gamma account?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Gamma turns your prompt into a beautiful, interactive presentation in seconds.
            </p>
            <button
              onClick={handleOpenGamma}
              className="px-6 py-2.5 rounded-lg bg-[#5CC49D] text-black font-semibold text-sm hover:bg-[#4db38c] transition-colors"
            >
              Sign Up for Gamma
            </button>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default GammaProposalDetailPage;