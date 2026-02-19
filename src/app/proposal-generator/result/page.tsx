"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useGo } from "@refinedev/core";
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { message, Collapse } from 'antd';
import { useProposalGenerator } from '../../hooks/useProposalGenerator';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext';
import { buildProposalFromAnalysis } from '@/utils/buildProposalFromAnalysis';
import type { ProposalGeneratorInput } from '@/types/proposalGenerator';

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-widest text-gray-500 font-manrope mb-3 mt-0">{children}</p>
);

const Rule = () => <div className="border-t border-white/5 my-10" />;

const GAMMA_APP_URL = 'https://gamma.app';

const videoWalkthroughs = [
  {
    title: 'Step 1: Pasting Your Prompt into Gamma',
    description: 'Learn how to take your generated prompt and paste it into Gamma.app to create a beautiful presentation.',
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

export default function ProposalResultPage() {
  const go = useGo();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');
  const { generatePrompt } = useProposalGenerator();
  const { currentWorkspace } = useWorkspaceContext();
  const hasStarted = useRef(false);

  const [generating, setGenerating] = useState(true);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [deliverableId, setDeliverableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (!analysisId) {
      setError('No analysis ID provided. Please generate from a Sales Call Analysis.');
      setGenerating(false);
      return;
    }

    fetchAnalysisAndGenerate(analysisId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalysisAndGenerate = async (id: string) => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/sales-call-analyzer/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analysis');
      }

      const analysis = result.data;
      const input = buildProposalFromAnalysis(analysis);

      setClientName(input.clientDetails?.clientName || '');
      setCompanyName(input.clientDetails?.companyName || '');

      await runGeneration(input);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load analysis data. Please try again from the analysis page.'
      );
      setGenerating(false);
    }
  };

  const runGeneration = async (input: ProposalGeneratorInput) => {
    try {
      const filteredInput = {
        ...input,
        solutions: input.solutions.filter((s) => s.solutionName),
      };

      if (filteredInput.solutions.length === 0) {
        filteredInput.solutions = [{
          id: '1',
          solutionName: 'Custom AI Automation Solution',
          howItWorks: '',
          keyBenefits: '',
          setupFee: '',
          monthlyFee: '',
        }];
      }

      const result = await generatePrompt(filteredInput, {
        workspaceId: currentWorkspace?.id,
        analysisId: analysisId || undefined,
      });
      setGeneratedPrompt(result.gammaPrompt);
      if (result.deliverableId) {
        setDeliverableId(result.deliverableId);
      }
      message.success('Gamma prompt generated & saved!');
    } catch {
      setError('Failed to generate the proposal prompt. Please try again from the analysis page.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      message.success('Prompt copied to clipboard!');
    } catch {
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

  const backTo = analysisId
    ? `/sales-call-analyzer/analysis/${analysisId}`
    : '/sales-call-analyzer';

  // Loading state
  if (generating) {
    return (
      <div className="mx-auto px-8 py-14 max-w-4xl" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div className="text-center py-20">
          <LoadingOutlined className="text-5xl text-[#5CC49D] mb-6" />
          <p className="text-xl text-gray-200 mb-2">Generating your proposal prompt...</p>
          <p className="text-base text-gray-500 mb-1">
            {companyName ? `Building a custom presentation for ${companyName}` : 'Crafting a polished Gamma.app prompt'}
          </p>
          <p className="text-sm text-gray-600">This typically takes 15-30 seconds.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto px-8 py-14 max-w-4xl" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div className="text-center py-20">
          <p className="text-xl text-gray-300 mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => go({ to: backTo })}
              className="flex items-center gap-2 px-5 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-gray-200 hover:border-white/20 transition-colors"
            >
              <ArrowLeftOutlined /> Back to Analysis
            </button>
            <button
              onClick={() => go({ to: '/proposal-generator' })}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#5CC49D] text-black font-semibold text-sm hover:bg-[#4db38c] transition-colors"
            >
              Open Proposal Generator
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Result view
  return (
    <div className="mx-auto px-8 py-14 max-w-4xl" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* Back */}
      <button
        onClick={() => go({ to: backTo })}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeftOutlined className="text-xs" /> Back to Analysis
      </button>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-100 mb-2 leading-tight">
        {companyName ? `Proposal for ${companyName}` : 'Generated Proposal Prompt'}
      </h1>
      <p className="text-base text-gray-500 mb-10">
        {clientName ? `Custom Gamma.app presentation prompt for ${clientName}` : 'Your AI-generated Gamma.app presentation prompt is ready.'}
        {' '}Copy the prompt below and paste it into Gamma to create your presentation.
      </p>

      {/* Prompt Output */}
      <div>
        <Label>Your Gamma Prompt</Label>
        <textarea
          id="gamma-prompt-output"
          readOnly
          value={generatedPrompt}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-sm text-gray-300 font-mono leading-relaxed resize-y min-h-[400px] focus:outline-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-6 items-center">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#5CC49D] text-black font-semibold text-sm hover:bg-[#4db38c] transition-colors"
        >
          <CopyOutlined /> Copy to Clipboard
        </button>
        <button
          onClick={handleOpenGamma}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-[#5CC49D]/40 text-[#5CC49D] font-semibold text-sm hover:bg-[#5CC49D]/10 transition-colors"
        >
          Open Gamma.app
        </button>
        {deliverableId && currentWorkspace && (
          <button
            onClick={() => go({ to: `/dashboard/${currentWorkspace.slug}/proposal-generator/${deliverableId}` })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-gray-200 hover:border-white/20 transition-colors"
          >
            Saved — View in Dashboard
          </button>
        )}
      </div>

      <Rule />

      {/* Video Walkthroughs */}
      <div>
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
                <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-600">Video embed placeholder — add Google Drive link here</p>
                </div>
              </div>
            ),
          }))}
        />
      </div>

      <Rule />

      {/* Gamma sign-up CTA */}
      <div className="text-center border border-white/10 rounded-lg p-8">
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
  );
}
