"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useGo } from "@refinedev/core";
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  FileTextOutlined,
  CalendarOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { message, Collapse, Skeleton, Tabs } from 'antd';
import LoadingOverlay from './LoadingOverlay';
import { useProposalGenerator } from '../hooks/useProposalGenerator';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { buildProposalFromAnalysis } from '../../utils/buildProposalfromAnalysis';
import VidalyticsEmbed from '@/components/VidalyticsEmbed';
import type {
  ProposalGeneratorInput,
  ProposalSolution,
  ClientDetails,
  CurrentState,
  FutureState,
  CloseDetails,
} from '@/types/proposalGenerator';

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-widest text-gray-500 font-manrope mb-3 mt-0">{children}</p>
);

const Rule = () => <div className="border-t border-white/5 my-10" />;

const GAMMA_APP_URL = 'https://gamma.app';

const toneOptions = [
  'Professional, ROI-focused',
  'Professional, Consultative',
  'Aggressive, Direct',
  'Friendly, Collaborative',
  'Technical, Data-driven',
];

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

function createEmptySolution(): ProposalSolution {
  return {
    id: crypto.randomUUID(),
    solutionName: '',
    howItWorks: '',
    keyBenefits: '',
    setupFee: '',
    monthlyFee: '',
  };
}

export default function ProposalGeneratorPage() {
  const go = useGo();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');
  const { generatePrompt } = useProposalGenerator();
  const { currentWorkspace } = useWorkspaceContext();
  const hasPrefilled = useRef(false);

  const [prefilling, setPrefilling] = useState(!!analysisId);

  // Form state
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    clientName: '',
    clientTitle: '',
    companyName: '',
    corePitchGoal: '',
    presentationTone: toneOptions[0],
  });

  const [currentState, setCurrentState] = useState<CurrentState>({
    mainBottleneck: '',
    teamInefficiencies: '',
    opportunityCost: '',
  });

  const [futureState, setFutureState] = useState<FutureState>({
    proposedTeamStructure: '',
    ownerExecutiveRole: '',
  });

  const [solutions, setSolutions] = useState<ProposalSolution[]>([createEmptySolution()]);

  const [closeDetails, setCloseDetails] = useState<CloseDetails>({
    bundleDiscountOffer: '',
    callToAction: 'Book Your Strategy Call',
    bookingLink: '',
  });

  // Output state
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  // Tab & Saved Proposals state
  const [activeTab, setActiveTab] = useState('generator');
  const [savedProposals, setSavedProposals] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Prefill form from analysis data when analysisId is present
  useEffect(() => {
    if (!analysisId || hasPrefilled.current) {
      setPrefilling(false);
      return;
    }
    hasPrefilled.current = true;

    (async () => {
      try {
        const response = await fetch(`/api/sales-call-analyzer/${analysisId}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        const input = buildProposalFromAnalysis(result.data);
        setClientDetails(input.clientDetails);
        setCurrentState(input.currentState);
        setFutureState(input.futureState);
        if (input.solutions.length > 0) setSolutions(input.solutions);
        setCloseDetails(input.closeDetails);
      } catch {
        message.error('Failed to load analysis data for prefill.');
      } finally {
        setPrefilling(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch saved proposals
  const fetchSavedProposals = async () => {
    if (!currentWorkspace?.id || loadingSaved) return;
    setLoadingSaved(true);
    try {
      const res = await fetch(`/api/proposal-generator?workspaceId=${currentWorkspace.id}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setSavedProposals(result.data);
      }
    } catch {
      message.error('Failed to load saved proposals.');
    } finally {
      setLoadingSaved(false);
    }
  };

  // If the workspace finishes loading while the user is already on the saved tab,
  // trigger a fetch (handles the case where the user clicked the tab before workspace was ready)
  useEffect(() => {
    if (activeTab === 'saved' && currentWorkspace?.id) {
      fetchSavedProposals();
    }
  }, [currentWorkspace?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Solution management
  const addSolution = () => {
    setSolutions((prev) => [...prev, createEmptySolution()]);
  };

  const removeSolution = (id: string) => {
    if (solutions.length <= 1) return;
    setSolutions((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSolution = (id: string, field: keyof ProposalSolution, value: string) => {
    setSolutions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Generate prompt via hook
  const handleGenerate = async () => {
    if (!clientDetails.clientName || !clientDetails.companyName) {
      message.error('Client name and company name are required.');
      return;
    }
    if (solutions.every((s) => !s.solutionName)) {
      message.error('At least one solution with a name is required.');
      return;
    }

    setGenerating(true);
    try {
      const input: ProposalGeneratorInput = {
        clientDetails,
        currentState,
        futureState,
        solutions: solutions.filter((s) => s.solutionName),
        closeDetails,
      };

      const result = await generatePrompt(input, {
        workspaceId: currentWorkspace?.id,
        analysisId: analysisId || undefined,
      });
      setGeneratedPrompt(result.gammaPrompt);
      setShowOutput(true);
      message.success('Gamma prompt generated & saved!');
    } catch {
      message.error('Something went wrong. Please try again.');
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

  const handleCopySaved = async (proposal: any) => {
    try {
      let content = proposal.content;
      if (typeof content === 'string') {
        try { content = JSON.parse(content); } catch { /* use as-is */ }
      }
      const prompt = content?.gammaPrompt || '';
      if (!prompt) {
        message.warning('No prompt content found.');
        return;
      }
      await navigator.clipboard.writeText(prompt);
      message.success('Prompt copied to clipboard!');
    } catch {
      message.error('Failed to copy prompt.');
    }
  };

  const getProposalMeta = (proposal: any) => {
    let meta = proposal.metadata;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch { meta = {}; }
    }
    return meta || {};
  };

  // Shared input styling
  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-base text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors font-manrope';
  const textareaClass = `${inputClass} resize-y min-h-[80px]`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <div className="px-8 py-14 w-full" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <LoadingOverlay visible={generating} />
      {/* Back */}
      <button
        onClick={() => go({ to: '/sales-call-analyzer' })}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeftOutlined className="text-xs" /> Back
      </button>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-100 mb-2 leading-tight">
        Proposal Generator
      </h1>
      <p className="text-base text-gray-500 mb-6">
        Create a polished Gamma.app presentation prompt from your sales data. Fill out the form below or use data from a Sales Call Analysis.
      </p>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          if (key === 'saved') fetchSavedProposals();
        }}
        className="proposal-tabs"
        tabBarStyle={{ borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 32 }}
        items={[
          {
            key: 'generator',
            label: (
              <span className="flex items-center gap-2 text-sm">
                <ThunderboltOutlined /> Generator
              </span>
            ),
            children: (
              <>
                {/* ─── FORM ─── */}
                {prefilling && (
                  <div className="py-10"><Skeleton active paragraph={{ rows: 8 }} /></div>
                )}
                {!showOutput && !prefilling && (
        <div className="space-y-10">
          {/* Section 1: Client & Presentation Details */}
          <div>
            <h2 className="text-lg font-medium text-gray-200 mb-6">Client & Presentation Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client Name</Label>
                <input
                  className={inputClass}
                  placeholder="e.g., Don Moreland"
                  value={clientDetails.clientName}
                  onChange={(e) => setClientDetails((p) => ({ ...p, clientName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Client Title</Label>
                <input
                  className={inputClass}
                  placeholder="e.g., Owner"
                  value={clientDetails.clientTitle}
                  onChange={(e) => setClientDetails((p) => ({ ...p, clientTitle: e.target.value }))}
                />
              </div>
              <div>
                <Label>Company Name</Label>
                <input
                  className={inputClass}
                  placeholder="e.g., Solar Crowd Source"
                  value={clientDetails.companyName}
                  onChange={(e) => setClientDetails((p) => ({ ...p, companyName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Core Pitch / Goal</Label>
                <input
                  className={inputClass}
                  placeholder="e.g., Custom AI Automation Solutions"
                  value={clientDetails.corePitchGoal}
                  onChange={(e) => setClientDetails((p) => ({ ...p, corePitchGoal: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Presentation Tone</Label>
                <select
                  className={selectClass}
                  value={clientDetails.presentationTone}
                  onChange={(e) => setClientDetails((p) => ({ ...p, presentationTone: e.target.value }))}
                >
                  {toneOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Rule />

          {/* Section 2: Current State */}
          <div>
            <h2 className="text-lg font-medium text-gray-200 mb-6">The Current State (Pain Points)</h2>
            <div className="space-y-4">
              <div>
                <Label>Main Bottleneck / Pain Point</Label>
                <textarea
                  className={textareaClass}
                  placeholder="What is the #1 thing costing them money or time? e.g., Manual proposal generation taking 45 minutes, leads going cold."
                  value={currentState.mainBottleneck}
                  onChange={(e) => setCurrentState((p) => ({ ...p, mainBottleneck: e.target.value }))}
                />
              </div>
              <div>
                <Label>Current Team Inefficiencies</Label>
                <textarea
                  className={textareaClass}
                  placeholder="Who is doing what wrong? e.g., 3-person sales team doing admin work instead of selling."
                  value={currentState.teamInefficiencies}
                  onChange={(e) => setCurrentState((p) => ({ ...p, teamInefficiencies: e.target.value }))}
                />
              </div>
              <div>
                <Label>Opportunity Cost (Optional)</Label>
                <textarea
                  className={textareaClass}
                  placeholder="What are they losing by not acting? e.g., Momentum dies while leads wait."
                  value={currentState.opportunityCost || ''}
                  onChange={(e) => setCurrentState((p) => ({ ...p, opportunityCost: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Rule />

          {/* Section 3: Future State */}
          <div>
            <h2 className="text-lg font-medium text-gray-200 mb-6">The Future State (The Vision)</h2>
            <div className="space-y-4">
              <div>
                <Label>Proposed Team Structure</Label>
                <textarea
                  className={textareaClass}
                  placeholder="What does the lean version look like? e.g., Downsize to 1 full-time rep + AI automation."
                  value={futureState.proposedTeamStructure}
                  onChange={(e) => setFutureState((p) => ({ ...p, proposedTeamStructure: e.target.value }))}
                />
              </div>
              <div>
                <Label>Owner / Executive Role</Label>
                <textarea
                  className={textareaClass}
                  placeholder="What is the boss doing now vs. after? e.g., Steps away from low-value calls, only takes warm lay-ups."
                  value={futureState.ownerExecutiveRole}
                  onChange={(e) => setFutureState((p) => ({ ...p, ownerExecutiveRole: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Rule />

          {/* Section 4: Solutions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-200">Solutions & Pricing</h2>
              <button
                onClick={addSolution}
                className="flex items-center gap-1.5 text-sm text-[#5CC49D] border border-[#5CC49D]/30 rounded px-3 py-1.5 hover:bg-[#5CC49D]/10 transition-colors"
              >
                <PlusOutlined className="text-xs" /> Add Solution
              </button>
            </div>

            <div className="space-y-6">
              {solutions.map((solution, index) => (
                <div
                  key={solution.id}
                  className="border border-white/10 rounded-lg p-5 relative"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-gray-300">Solution {index + 1}</p>
                    {solutions.length > 1 && (
                      <button
                        onClick={() => removeSolution(solution.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <DeleteOutlined className="text-sm" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Solution Name</Label>
                      <input
                        className={inputClass}
                        placeholder="e.g., Instant Proposal Generator"
                        value={solution.solutionName}
                        onChange={(e) => updateSolution(solution.id, 'solutionName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>How it Works (Input → Output)</Label>
                      <textarea
                        className={textareaClass}
                        placeholder="e.g., HubSpot data → Aurora Solar → Gamma → Email"
                        value={solution.howItWorks}
                        onChange={(e) => updateSolution(solution.id, 'howItWorks', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Key Benefits (Optional)</Label>
                      <input
                        className={inputClass}
                        placeholder="e.g., Zero human touch, instant turnaround"
                        value={solution.keyBenefits || ''}
                        onChange={(e) => updateSolution(solution.id, 'keyBenefits', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Setup Fee</Label>
                        <input
                          className={inputClass}
                          placeholder="e.g., $2,000"
                          value={solution.setupFee}
                          onChange={(e) => updateSolution(solution.id, 'setupFee', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Monthly Fee</Label>
                        <input
                          className={inputClass}
                          placeholder="e.g., $1,000/mo"
                          value={solution.monthlyFee}
                          onChange={(e) => updateSolution(solution.id, 'monthlyFee', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Rule />

          {/* Section 5: The Close */}
          <div>
            <h2 className="text-lg font-medium text-gray-200 mb-6">The Close</h2>
            <div className="space-y-4">
              <div>
                <Label>Bundle / Discount Offer (Optional)</Label>
                <input
                  className={inputClass}
                  placeholder="e.g., $750 off total setup if all 3 solutions purchased today"
                  value={closeDetails.bundleDiscountOffer || ''}
                  onChange={(e) => setCloseDetails((p) => ({ ...p, bundleDiscountOffer: e.target.value }))}
                />
              </div>
              <div>
                <Label>Call to Action</Label>
                <input
                  className={inputClass}
                  placeholder="e.g., Book Your Strategy Call"
                  value={closeDetails.callToAction}
                  onChange={(e) => setCloseDetails((p) => ({ ...p, callToAction: e.target.value }))}
                />
              </div>
              <div>
                <Label>Booking Link (Optional)</Label>
                <input
                  className={inputClass}
                  placeholder="e.g., https://calendly.com/your-link"
                  value={closeDetails.bookingLink || ''}
                  onChange={(e) => setCloseDetails((p) => ({ ...p, bookingLink: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Rule />

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-8 py-3 rounded-lg bg-[#5CC49D] text-black font-semibold text-base hover:bg-[#4db38c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? <LoadingOutlined /> : <ThunderboltOutlined />}
              {generating ? 'Generating...' : 'Generate Gamma Prompt'}
            </button>
          </div>
        </div>
      )}

      {/* ─── OUTPUT ─── */}
      {showOutput && (
        <div className="space-y-10">
          {/* Back to editor */}
          <button
            onClick={() => setShowOutput(false)}
            className="text-sm text-gray-500 border border-white/10 rounded px-3 py-1.5 hover:text-gray-300 hover:border-white/20 transition-colors"
          >
            Edit Form
          </button>

          {/* Prompt Output */}
          <div>
            <Label>Your Gamma Prompt</Label>
          <textarea
  id="gamma-prompt-output"
  readOnly
  value={generatedPrompt}
  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-sm text-gray-300 font-mono leading-relaxed resize-y min-h-[400px] focus:outline-none"
  // Add this to prevent any formatting
  style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
/>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
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
      )}
              </>
            ),
          },
          {
            key: 'saved',
            label: (
              <span className="flex items-center gap-2 text-sm">
                <FileTextOutlined /> Saved Proposals
              </span>
            ),
            children: (
              <div>
                {loadingSaved ? (
                  <div className="text-center py-20">
                    <LoadingOutlined className="text-3xl text-[#5CC49D] mb-4" />
                    <p className="text-base text-gray-400">Loading saved proposals...</p>
                  </div>
                ) : savedProposals.length === 0 ? (
                  <div className="text-center py-20 border border-white/5 rounded-lg">
                    <FileTextOutlined className="text-4xl text-gray-600 mb-4" />
                    <p className="text-base text-gray-400 mb-2">No saved proposals yet</p>
                    <p className="text-sm text-gray-600">
                      Generate a proposal from the Generator tab to see it here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedProposals.map((proposal) => {
                      const meta = getProposalMeta(proposal);
                      return (
                        <div
                          key={proposal.id}
                          className="border border-white/10 rounded-lg p-5 hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-medium text-gray-200 mb-1 truncate">
                                {proposal.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                {meta.companyName && (
                                  <span>{meta.companyName}</span>
                                )}
                                {meta.clientName && (
                                  <span>for {meta.clientName}</span>
                                )}
                                {meta.solutionCount > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-[#5CC49D]/10 text-[#5CC49D]">
                                    {meta.solutionCount} solution{meta.solutionCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {meta.tone && (
                                  <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400">
                                    {meta.tone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <CalendarOutlined />
                                  {new Date(proposal.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleCopySaved(proposal)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs hover:text-gray-200 hover:border-white/20 transition-colors bg-black"
                              >
                                <CopyOutlined /> Copy
                              </button>
                              {currentWorkspace && (
                                <button
                                  onClick={() => go({ to: `/dashboard/${currentWorkspace.slug}/proposal-generator/${proposal.id}` })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#5CC49D]/30 text-[#5CC49D] text-xs hover:bg-[#5CC49D]/10 transition-colors bg-black"
                                >
                                  <EyeOutlined /> View
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => fetchSavedProposals()}
                      className="w-full text-center py-3 text-sm text-white hover:text-white transition-colors bg-black border border-black"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}