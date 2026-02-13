"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// ── Public Share Page ──
// Publicly accessible page that displays a shared sales call analysis.
// No authentication required. Uses dark theme to match the main app.

interface SharedAnalysis {
  id: string;
  title: string;
  createdAt: string;
  sharedAt: string;
  analysis: {
    callResults: {
      duration: number;
      participants: Array<{ name: string; role: string; speakingPercentage: number; }>;
      analysis: {
        overallScore: number;
        sentiment: string;
        keyInsights: string[];
        actionItems: string[];
        salesMetrics?: { buyingSignals?: string[]; objectionsRaised?: string[]; };
      };
      executiveSummary: string;
      coachingFeedback: { strengths: string[]; improvements: string[]; specificSuggestions: string[]; };
    };
    performanceMetrics: { talkTimePercentage?: number; engagementScore: number; clarityScore: number; professionalismScore: number; };
    dealArchitecture?: {
      prospectDiagnosis: {
        businessProfile: { industry: string; businessType: string; estimatedTeamSize: string; estimatedRevenue: string; currentTechStack: string[]; location?: string; };
        bleedingNeckProblems: Array<{ problem: string; severity: string; frequency: string; estimatedCost: string; quotedEvidence?: string; }>;
        financialQualification: { isQualified: string; qualificationReason: string; estimatedBudget?: string; urgencyLevel: string; decisionMakerPresent: boolean; buyingSignals: string[]; redFlags: string[]; };
      };
      solutionStack: {
        phase1QuickWin: { phaseName: string; timeline: string; tools: Array<{ toolName: string; toolType: string; description: string; estimatedSetupHours: number; setupComplexity: string; }>; expectedOutcome: string; proofOfConcept: string; };
        phase2CoreSystem: { phaseName: string; timeline: string; tools: Array<{ toolName: string; toolType: string; description: string; estimatedSetupHours: number; setupComplexity: string; monthlyMaintenanceHours?: number; }>; expectedOutcome: string; retainerJustification: string; };
        phase3AIWowFactor: { phaseName: string; timeline: string; tools: Array<{ toolName: string; toolType: string; description: string; estimatedSetupHours: number; setupComplexity: string; replacesRole?: string; monthlyMaintenanceHours?: number; }>; expectedOutcome: string; roiProjection: string; };
        integrationMap: { requiredIntegrations: string[]; niceToHaveIntegrations: string[]; potentialBlockers: string[]; };
      };
      pricingStrategy: {
        setupFee: { minimum: number; maximum: number; recommended: number; breakdown: Array<{ item: string; cost: number; }>; };
        monthlyRetainer: { minimum: number; maximum: number; recommended: number; breakdown: Array<{ item: string; monthlyCost: number; }>; includedHours?: number; overhourlyRate?: number; };
        pitchAngle: { headline: string; valueFraming: string; comparisonPoint: string; urgencyHook: string; };
        contractTerms: { recommendedTerm: string; discountForLongerTerm?: string; paymentStructure: string; guaranteeOffered?: string; };
        upsellOpportunities: Array<{ service: string; timing: string; additionalRevenue: number; }>;
        totalDealValue: { firstYearValue: number; lifetimeValueEstimate: number; profitMarginEstimate: string; };
      };
      salesPerformance: {
        greenFlags: Array<{ observation: string; example?: string; impact: string; }>;
        redFlags: Array<{ observation: string; example?: string; howToFix: string; priority: string; }>;
        missedOpportunities: Array<{ topic: string; questionToAsk: string; whyItMatters: string; }>;
        callScoreCard: { rapportBuilding: number; discoveryDepth: number; painIdentification: number; valuePresentation: number; objectionHandling: number; closingStrength: number; overallScore: number; };
        nextCallPreparation: string[];
      };
      dealGrade: { grade: string; gradeReason: string; winProbability: number; recommendedNextStep: string; dealRisks: string[]; dealStrengths: string[]; };
      executiveBrief: { oneLineSummary: string; topPriority: string; immediateAction: string; dealValue: string; };
    };
  };
  metadata: {
    callType: string;
    duration: number;
    sentiment: string;
    overallScore: number;
    companyName?: string;
    prospectName?: string;
    prospectTitle?: string;
    companyIndustry?: string;
    companyLocation?: string;
    generatedAt: string;
    participantCount: number;
    questionCount: number;
    engagementScore: number;
  };
}

// Pill component - matches main app
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block px-2.5 py-0.5 text-sm rounded-full border border-white/10 text-gray-400 font-manrope">{children}</span>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-widest text-gray-500 font-manrope mb-3 mt-0">{children}</p>
);

const Rule = () => <div className="border-t border-white/5 my-10" />;

export default function SharedAnalysisPage() {
  const { token } = useParams();
  const [data, setData] = useState<SharedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/share/${token}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'This shared link is no longer available.');
        }
      } catch {
        setError('Failed to load shared analysis.');
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-14 font-manrope">
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading shared analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-14 font-manrope text-center">
        <p className="text-5xl mb-4">&#128683;</p>
        <p className="text-xl text-gray-300 mb-2">Link Not Found</p>
        <p className="text-base text-gray-500 max-w-md mx-auto">{error || 'This shared analysis link is invalid or has been revoked.'}</p>
      </div>
    );
  }

  const deal = data.analysis?.dealArchitecture;
  const callResults = data.analysis?.callResults;
  const duration = callResults?.duration || data.metadata?.duration || 0;
  const overallScore = callResults?.analysis?.overallScore || data.metadata?.overallScore || 0;
  const strengths = callResults?.coachingFeedback?.strengths || [];
  const participants = callResults?.participants || [];

  return (
    <div className="max-w-4xl mx-auto px-8 py-14" style={{ fontFamily: "'Manrope', sans-serif" }}>

      {/* Shared banner */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-8">
        <p className="text-xs text-gray-400 m-0">Shared Sales Call Analysis</p>
        <p className="text-xs text-gray-500 m-0">Shared on {new Date(data.sharedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-100 mb-2 leading-tight">{data.title}</h1>
      <p className="text-base text-gray-500 mb-8">
        {data.metadata?.sentiment} &middot; {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} &middot; {new Date(data.createdAt).toLocaleDateString()}
        {data.metadata?.companyName && <> &middot; {data.metadata.companyName}</>}
      </p>

      {/* Score strip */}
      <div className="flex items-center gap-8 mb-4">
        <div>
          <p className="text-5xl font-light text-gray-100">{overallScore}</p>
          <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Score</p>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-4 text-center">
          {participants[0] && (
            <div><p className="text-xl font-light text-gray-200">{Math.round(participants[0].speakingPercentage || 0)}%</p><p className="text-xs text-gray-500">Agent</p></div>
          )}
          {participants[1] && (
            <div><p className="text-xl font-light text-gray-200">{Math.round(participants[1].speakingPercentage || 0)}%</p><p className="text-xs text-gray-500">Prospect</p></div>
          )}
          <div><p className="text-xl font-light text-gray-200">{(callResults?.analysis?.salesMetrics?.buyingSignals || []).length}</p><p className="text-xs text-gray-500">Signals</p></div>
        </div>
      </div>

      {strengths.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {strengths.slice(0, 4).map((s, i) => <Pill key={i}>{s}</Pill>)}
        </div>
      )}

      <Rule />

      {/* Deal Architecture */}
      {deal ? (
        <div className="space-y-12">
          {/* Grade + Brief */}
          <div className="text-center">
            <p className="text-7xl font-extralight text-gray-100">{deal.dealGrade.grade}</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1 mb-4">Deal Grade &middot; {deal.dealGrade.winProbability}% win probability</p>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">{deal.executiveBrief.oneLineSummary}</p>
          </div>

          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3"><Label>Deal Value</Label><p className="text-xl text-gray-200">{deal.executiveBrief.dealValue}</p></div>
            <div className="border-b border-white/5 pb-3"><Label>Top Priority</Label><p className="text-base text-gray-300 leading-relaxed">{deal.executiveBrief.topPriority}</p></div>
            <div className="border-b border-white/5 pb-3"><Label>Immediate Action</Label><p className="text-base text-gray-300 leading-relaxed">{deal.executiveBrief.immediateAction}</p></div>
          </div>

          <Rule />

          {/* Prospect */}
          {deal.prospectDiagnosis && (
            <div>
              <h3 className="text-base font-medium text-gray-200 mb-6">Prospect Diagnosis</h3>

              <Label>Business Profile</Label>
              <div className="space-y-1.5 text-base text-gray-400 mb-8 leading-relaxed">
                <p><span className="text-gray-500">Industry:</span> {deal.prospectDiagnosis.businessProfile?.industry || 'N/A'}</p>
                <p><span className="text-gray-500">Type:</span> {(deal.prospectDiagnosis.businessProfile?.businessType || '').replace(/_/g, ' ') || 'N/A'}</p>
                <p><span className="text-gray-500">Team Size:</span> {deal.prospectDiagnosis.businessProfile?.estimatedTeamSize || 'N/A'}</p>
                <p><span className="text-gray-500">Revenue:</span> {deal.prospectDiagnosis.businessProfile?.estimatedRevenue || 'N/A'}</p>
                {deal.prospectDiagnosis.businessProfile?.location && <p><span className="text-gray-500">Location:</span> {deal.prospectDiagnosis.businessProfile.location}</p>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(deal.prospectDiagnosis.businessProfile?.currentTechStack || []).map((t, i) => <Pill key={i}>{t}</Pill>)}
                </div>
              </div>

              {deal.prospectDiagnosis.financialQualification && (
                <>
                  <Label>Financial Qualification</Label>
                  <p className="text-base mb-2">
                    <Pill>{deal.prospectDiagnosis.financialQualification.isQualified === 'yes' ? 'Qualified' : deal.prospectDiagnosis.financialQualification.isQualified === 'maybe' ? 'Needs Validation' : 'Not Qualified'}</Pill>
                  </p>
                  <div className="space-y-1.5 text-base text-gray-400 mb-8 leading-relaxed">
                    <p>{deal.prospectDiagnosis.financialQualification.qualificationReason || 'N/A'}</p>
                    {deal.prospectDiagnosis.financialQualification.estimatedBudget && <p><span className="text-gray-500">Budget:</span> {deal.prospectDiagnosis.financialQualification.estimatedBudget}</p>}
                    <p><span className="text-gray-500">Urgency:</span> {(deal.prospectDiagnosis.financialQualification.urgencyLevel || '').replace(/_/g, ' ')}</p>
                    <p><span className="text-gray-500">Decision Maker Present:</span> {deal.prospectDiagnosis.financialQualification.decisionMakerPresent ? 'Yes' : 'No'}</p>
                  </div>
                </>
              )}

              <Label>Pain Points</Label>
              <div className="space-y-5 mb-8">
                {(deal.prospectDiagnosis.bleedingNeckProblems || []).map((prob, i) => (
                  <div key={i}>
                    <p className="text-base text-gray-200 mb-1">{i + 1}. {prob.problem} <span className="text-gray-500 text-sm ml-1">{(prob.severity || '').toLowerCase()}</span></p>
                    <p className="text-sm text-gray-500">{prob.frequency || ''} {prob.estimatedCost ? `/ ${prob.estimatedCost}` : ''}</p>
                    {prob.quotedEvidence && <p className="text-sm text-gray-500 italic mt-1 pl-3 border-l border-white/10">{prob.quotedEvidence}</p>}
                  </div>
                ))}
              </div>

              {(deal.prospectDiagnosis.financialQualification?.buyingSignals || []).length > 0 && (
                <>
                  <Label>Buying Signals</Label>
                  <ul className="text-base text-gray-400 space-y-1.5 mb-6 leading-relaxed">
                    {deal.prospectDiagnosis.financialQualification.buyingSignals.map((s, i) => <li key={i}>- {s}</li>)}
                  </ul>
                </>
              )}

              {(deal.prospectDiagnosis.financialQualification?.redFlags || []).length > 0 && (
                <>
                  <Label>Red Flags</Label>
                  <ul className="text-base text-gray-400 space-y-1.5 mb-6 leading-relaxed">
                    {deal.prospectDiagnosis.financialQualification.redFlags.map((f, i) => <li key={i}>- {f}</li>)}
                  </ul>
                </>
              )}
            </div>
          )}

          <Rule />

          {/* Solution Stack */}
          {deal.solutionStack && (
            <div>
              <h3 className="text-base font-medium text-gray-200 mb-8">Solution Stack</h3>
              {[
                { phase: deal.solutionStack.phase1QuickWin, label: 'Phase 1 - Quick Win' },
                { phase: deal.solutionStack.phase2CoreSystem, label: 'Phase 2 - Core System' },
                { phase: deal.solutionStack.phase3AIWowFactor, label: 'Phase 3 - AI Wow Factor' },
              ].map(({ phase, label }) => phase && (
                <div key={label} className="mb-10">
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-sm font-medium text-gray-300">{label}</p>
                    <span className="text-xs text-gray-500">{phase.timeline || ''}</span>
                  </div>
                  <p className="text-base text-gray-400 mb-3">{phase.phaseName}</p>
                  {(phase.tools || []).map((tool: any, j: number) => (
                    <div key={j} className="mb-3 pl-4 border-l border-white/5">
                      <p className="text-base text-gray-300">{tool.toolName} <span className="text-gray-500 text-sm">{(tool.toolType || '').replace(/_/g, ' ')}</span></p>
                      <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
                      <p className="text-xs text-gray-600">{tool.estimatedSetupHours || 0}h setup, {tool.setupComplexity || 'n/a'} complexity</p>
                    </div>
                  ))}
                  <p className="text-base text-gray-400 leading-relaxed">Expected outcome: {phase.expectedOutcome || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}

          <Rule />

          {/* Pricing */}
          {deal.pricingStrategy && (
            <div>
              <h3 className="text-base font-medium text-gray-200 mb-8">Pricing Strategy</h3>
              <div className="space-y-6 mb-8">
                <div className="border-b border-white/5 pb-4">
                  <Label>Setup Fee</Label>
                  <p className="text-3xl font-light text-gray-200">${(deal.pricingStrategy.setupFee?.recommended || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Range: ${(deal.pricingStrategy.setupFee?.minimum || 0).toLocaleString()} - ${(deal.pricingStrategy.setupFee?.maximum || 0).toLocaleString()}</p>
                </div>
                <div className="border-b border-white/5 pb-4">
                  <Label>Monthly Retainer</Label>
                  <p className="text-3xl font-light text-gray-200">${(deal.pricingStrategy.monthlyRetainer?.recommended || 0).toLocaleString()}<span className="text-base text-gray-500">/mo</span></p>
                  <p className="text-sm text-gray-500">Range: ${(deal.pricingStrategy.monthlyRetainer?.minimum || 0).toLocaleString()} - ${(deal.pricingStrategy.monthlyRetainer?.maximum || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Total Deal Value (Year 1)</Label>
                  <p className="text-3xl font-light text-gray-200">${(deal.pricingStrategy.totalDealValue?.firstYearValue || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Lifetime: ${(deal.pricingStrategy.totalDealValue?.lifetimeValueEstimate || 0).toLocaleString()} &middot; Margin: {deal.pricingStrategy.totalDealValue?.profitMarginEstimate || 'N/A'}</p>
                </div>
              </div>

              {deal.pricingStrategy.pitchAngle && (
                <div className="mb-8">
                  <Label>Pitch Angle</Label>
                  <p className="text-base text-gray-200 mb-1">{deal.pricingStrategy.pitchAngle.headline}</p>
                  <p className="text-base text-gray-400 leading-relaxed mb-1">{deal.pricingStrategy.pitchAngle.valueFraming}</p>
                  <p className="text-sm text-gray-500">Comparison: {deal.pricingStrategy.pitchAngle.comparisonPoint}</p>
                  <p className="text-sm text-gray-500">Urgency: {deal.pricingStrategy.pitchAngle.urgencyHook}</p>
                </div>
              )}

              {deal.pricingStrategy.contractTerms && (
                <div className="mb-8">
                  <Label>Contract Terms</Label>
                  <div className="text-base text-gray-400 space-y-1 leading-relaxed">
                    <p>Recommended term: {(deal.pricingStrategy.contractTerms.recommendedTerm || '').replace(/_/g, ' ')}</p>
                    {deal.pricingStrategy.contractTerms.discountForLongerTerm && <p>Discount: {deal.pricingStrategy.contractTerms.discountForLongerTerm}</p>}
                    <p>Payment: {deal.pricingStrategy.contractTerms.paymentStructure || 'N/A'}</p>
                    {deal.pricingStrategy.contractTerms.guaranteeOffered && <p>Guarantee: {deal.pricingStrategy.contractTerms.guaranteeOffered}</p>}
                  </div>
                </div>
              )}

              {(deal.pricingStrategy.upsellOpportunities || []).length > 0 && (
                <div>
                  <Label>Upsell Opportunities</Label>
                  {deal.pricingStrategy.upsellOpportunities.map((u, i) => (
                    <p key={i} className="text-base text-gray-400 mb-1">{u.service} <span className="text-gray-500 text-sm">{u.timing} / +${(u.additionalRevenue || 0).toLocaleString()}</span></p>
                  ))}
                </div>
              )}
            </div>
          )}

          <Rule />

          {/* Sales Performance */}
          {deal.salesPerformance && (
            <div>
              <h3 className="text-base font-medium text-gray-200 mb-8">Sales Performance</h3>
              <div className="text-center mb-8">
                <p className="text-5xl font-extralight text-gray-100">{deal.salesPerformance.callScoreCard?.overallScore || 0}</p>
                <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Overall Score</p>
              </div>

              <div className="space-y-2 mb-8">
                {[
                  { key: 'rapportBuilding', label: 'Rapport Building' },
                  { key: 'discoveryDepth', label: 'Discovery Depth' },
                  { key: 'painIdentification', label: 'Pain Identification' },
                  { key: 'valuePresentation', label: 'Value Presentation' },
                  { key: 'objectionHandling', label: 'Objection Handling' },
                  { key: 'closingStrength', label: 'Closing Strength' },
                ].map(({ key, label }) => {
                  const val = (deal.salesPerformance?.callScoreCard as any)?.[key] || 0;
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm text-gray-300 w-8 text-right">{val}/10</span>
                    </div>
                  );
                })}
              </div>

              {(deal.salesPerformance.greenFlags || []).length > 0 && (
                <div className="mb-8">
                  <Label>Strengths Observed</Label>
                  {deal.salesPerformance.greenFlags.map((f, i) => (
                    <div key={i} className="mb-3">
                      <p className="text-base text-gray-300">{f.observation}</p>
                      {f.example && <p className="text-sm text-gray-500 italic">{f.example}</p>}
                      <p className="text-sm text-gray-500">{f.impact}</p>
                    </div>
                  ))}
                </div>
              )}

              {(deal.salesPerformance.redFlags || []).length > 0 && (
                <div className="mb-8">
                  <Label>Areas to Improve</Label>
                  {deal.salesPerformance.redFlags.map((f, i) => (
                    <div key={i} className="mb-3">
                      <p className="text-base text-gray-300">{f.observation} <span className="text-sm text-gray-500">{f.priority}</span></p>
                      <p className="text-sm text-gray-500">Fix: {f.howToFix}</p>
                    </div>
                  ))}
                </div>
              )}

              {(deal.salesPerformance.nextCallPreparation || []).length > 0 && (
                <div>
                  <Label>Next Call Preparation</Label>
                  <ol className="text-base text-gray-400 space-y-1.5 leading-relaxed list-decimal list-inside">
                    {deal.salesPerformance.nextCallPreparation.map((item, i) => <li key={i}>{item}</li>)}
                  </ol>
                </div>
              )}
            </div>
          )}

          <Rule />

          {/* Deal Summary */}
          {deal.dealGrade && (
            <div>
              {(deal.dealGrade.dealStrengths || []).length > 0 && (
                <div className="mb-6">
                  <Label>Deal Strengths</Label>
                  <ul className="text-base text-gray-400 space-y-1.5 leading-relaxed">
                    {deal.dealGrade.dealStrengths.map((s, i) => <li key={i}>- {s}</li>)}
                  </ul>
                </div>
              )}
              {(deal.dealGrade.dealRisks || []).length > 0 && (
                <div className="mb-6">
                  <Label>Deal Risks</Label>
                  <ul className="text-base text-gray-400 space-y-1.5 leading-relaxed">
                    {deal.dealGrade.dealRisks.map((r, i) => <li key={i}>- {r}</li>)}
                  </ul>
                </div>
              )}
              <div className="border border-white/5 rounded p-4">
                <Label>Recommended Next Step</Label>
                <p className="text-base text-gray-300 leading-relaxed">{deal.dealGrade.recommendedNextStep || 'N/A'}</p>
                <p className="text-sm text-gray-500 mt-1">{deal.dealGrade.gradeReason || ''}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-base text-gray-500 py-8">Call architecture analysis is not available for this call.</p>
      )}

      {/* Footer */}
      <Rule />
      <div className="text-center pb-12">
        <p className="text-xs text-gray-600">Generated on {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  );
}