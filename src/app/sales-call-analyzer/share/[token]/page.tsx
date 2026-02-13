"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// ── Public Share Page ──
// Publicly accessible page that displays a shared sales call analysis.
// No authentication required. Fetches data via the public /api/share/[token] endpoint.

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
      <PageShell>
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #eee', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#888', fontSize: 14 }}>Loading shared analysis...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: 48, margin: '0 0 16px' }}>&#128683;</p>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#333' }}>Link Not Found</h2>
          <p style={{ color: '#888', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>{error || 'This shared analysis link is invalid or has been revoked.'}</p>
        </div>
      </PageShell>
    );
  }

  const deal = data.analysis?.dealArchitecture;
  const callResults = data.analysis?.callResults;
  const duration = callResults?.duration || data.metadata?.duration || 0;
  const overallScore = callResults?.analysis?.overallScore || data.metadata?.overallScore || 0;
  const strengths = callResults?.coachingFeedback?.strengths || [];
  const participants = callResults?.participants || [];

  return (
    <PageShell>
      {/* Shared banner */}
      <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: '12px 20px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#666' }}>Shared Sales Call Analysis</p>
        <p style={{ margin: 0, fontSize: 12, color: '#999' }}>Shared on {new Date(data.sharedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Header */}
      <div style={{ borderBottom: '2px solid #111', paddingBottom: 24, marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{data.title}</h1>
        <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
          {data.metadata?.sentiment} &middot; {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} &middot; {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          {data.metadata?.companyName && <> &middot; {data.metadata.companyName}</>}
        </p>
      </div>

      {/* Score */}
      <div style={{ display: 'flex', gap: 40, marginBottom: 32, alignItems: 'flex-start' }}>
        <div style={{ textAlign: 'center', minWidth: 100 }}>
          <p style={{ fontSize: 56, fontWeight: 300, margin: 0, lineHeight: 1 }}>{overallScore}</p>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginTop: 4 }}>Score</p>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {participants[0] && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>{Math.round(participants[0].speakingPercentage || 0)}%</p>
              <p style={{ fontSize: 11, color: '#888' }}>Agent</p>
            </div>
          )}
          {participants[1] && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>{Math.round(participants[1].speakingPercentage || 0)}%</p>
              <p style={{ fontSize: 11, color: '#888' }}>Prospect</p>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>{(callResults?.analysis?.salesMetrics?.buyingSignals || []).length}</p>
            <p style={{ fontSize: 11, color: '#888' }}>Signals</p>
          </div>
        </div>
      </div>

      {strengths.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {strengths.slice(0, 4).map((s, i) => (
            <span key={i} style={{ padding: '4px 12px', fontSize: 13, borderRadius: 20, border: '1px solid #ddd', color: '#555' }}>{s}</span>
          ))}
        </div>
      )}

      {/* Deal Architecture */}
      {deal && (
        <>
          {/* Grade */}
          <div style={{ textAlign: 'center', margin: '40px 0', padding: '32px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
            <p style={{ fontSize: 72, fontWeight: 200, margin: 0, lineHeight: 1 }}>{deal.dealGrade.grade}</p>
            <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginTop: 8 }}>Deal Grade &middot; {deal.dealGrade.winProbability}% win probability</p>
            <p style={{ fontSize: 16, color: '#444', maxWidth: 600, margin: '16px auto 0', lineHeight: 1.6 }}>{deal.executiveBrief.oneLineSummary}</p>
          </div>

          {/* Executive Brief */}
          <SectionTitle>Executive Brief</SectionTitle>
          <InfoRow label="Deal Value" value={deal.executiveBrief.dealValue} />
          <InfoRow label="Top Priority" value={deal.executiveBrief.topPriority} />
          <InfoRow label="Immediate Action" value={deal.executiveBrief.immediateAction} />

          <Hr />

          {/* Prospect Diagnosis */}
          {deal.prospectDiagnosis && (
            <>
              <SectionTitle>Prospect Diagnosis</SectionTitle>
              <SmallLabel>Business Profile</SmallLabel>
              <InfoRow label="Industry" value={deal.prospectDiagnosis.businessProfile?.industry || 'N/A'} />
              <InfoRow label="Type" value={(deal.prospectDiagnosis.businessProfile?.businessType || '').replace(/_/g, ' ') || 'N/A'} />
              <InfoRow label="Team Size" value={deal.prospectDiagnosis.businessProfile?.estimatedTeamSize || 'N/A'} />
              <InfoRow label="Revenue" value={deal.prospectDiagnosis.businessProfile?.estimatedRevenue || 'N/A'} />

              {(deal.prospectDiagnosis.bleedingNeckProblems || []).length > 0 && (
                <>
                  <SmallLabel>Pain Points</SmallLabel>
                  {deal.prospectDiagnosis.bleedingNeckProblems.map((p, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <p style={{ margin: 0, fontWeight: 500 }}>{i + 1}. {p.problem} <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>({p.severity})</span></p>
                      <p style={{ margin: '2px 0', color: '#666', fontSize: 14 }}>{p.frequency}{p.estimatedCost ? ` / ${p.estimatedCost}` : ''}</p>
                      {p.quotedEvidence && <p style={{ margin: '4px 0 0 16px', color: '#888', fontSize: 13, fontStyle: 'italic', borderLeft: '2px solid #ddd', paddingLeft: 12 }}>{p.quotedEvidence}</p>}
                    </div>
                  ))}
                </>
              )}

              {(deal.prospectDiagnosis.financialQualification?.buyingSignals || []).length > 0 && (
                <>
                  <SmallLabel>Buying Signals</SmallLabel>
                  <Bullets items={deal.prospectDiagnosis.financialQualification.buyingSignals} />
                </>
              )}
            </>
          )}

          <Hr />

          {/* Solution Stack */}
          {deal.solutionStack && (
            <>
              <SectionTitle>Solution Stack</SectionTitle>
              {[
                { phase: deal.solutionStack.phase1QuickWin, label: 'Phase 1 - Quick Win' },
                { phase: deal.solutionStack.phase2CoreSystem, label: 'Phase 2 - Core System' },
                { phase: deal.solutionStack.phase3AIWowFactor, label: 'Phase 3 - AI Wow Factor' },
              ].map(({ phase, label }) => phase && (
                <div key={label} style={{ marginBottom: 28 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, margin: '0 0 4px' }}>{label} <span style={{ fontWeight: 400, color: '#888', fontSize: 13 }}>{phase.timeline}</span></p>
                  <p style={{ color: '#555', margin: '0 0 8px', fontSize: 14 }}>{phase.phaseName}</p>
                  {(phase.tools || []).map((tool: any, j: number) => (
                    <div key={j} style={{ marginLeft: 16, marginBottom: 8, borderLeft: '2px solid #eee', paddingLeft: 12 }}>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{tool.toolName} <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>{(tool.toolType || '').replace(/_/g, ' ')}</span></p>
                      <p style={{ margin: '2px 0', color: '#666', fontSize: 13 }}>{tool.description}</p>
                    </div>
                  ))}
                  <p style={{ color: '#555', fontSize: 14, margin: '8px 0 0' }}>Expected outcome: {phase.expectedOutcome || 'N/A'}</p>
                </div>
              ))}
            </>
          )}

          <Hr />

          {/* Pricing */}
          {deal.pricingStrategy && (
            <>
              <SectionTitle>Pricing Strategy</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
                  <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#888', margin: '0 0 4px' }}>Setup Fee</p>
                  <p style={{ fontSize: 28, fontWeight: 300, margin: 0 }}>${(deal.pricingStrategy.setupFee?.recommended || 0).toLocaleString()}</p>
                </div>
                <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
                  <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#888', margin: '0 0 4px' }}>Monthly Retainer</p>
                  <p style={{ fontSize: 28, fontWeight: 300, margin: 0 }}>${(deal.pricingStrategy.monthlyRetainer?.recommended || 0).toLocaleString()}<span style={{ fontSize: 14, color: '#888' }}>/mo</span></p>
                </div>
              </div>
              <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 8, marginBottom: 24 }}>
                <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#888', margin: '0 0 4px' }}>Total Year 1 Value</p>
                <p style={{ fontSize: 32, fontWeight: 300, margin: 0 }}>${(deal.pricingStrategy.totalDealValue?.firstYearValue || 0).toLocaleString()}</p>
              </div>
            </>
          )}

          <Hr />

          {/* Sales Performance */}
          {deal.salesPerformance && (
            <>
              <SectionTitle>Sales Performance</SectionTitle>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <p style={{ fontSize: 48, fontWeight: 200, margin: 0 }}>{deal.salesPerformance.callScoreCard?.overallScore || 0}</p>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#888' }}>Overall Score</p>
              </div>
              <div style={{ marginBottom: 24 }}>
                {[
                  { key: 'rapportBuilding', label: 'Rapport Building' },
                  { key: 'discoveryDepth', label: 'Discovery Depth' },
                  { key: 'painIdentification', label: 'Pain Identification' },
                  { key: 'valuePresentation', label: 'Value Presentation' },
                  { key: 'objectionHandling', label: 'Objection Handling' },
                  { key: 'closingStrength', label: 'Closing Strength' },
                ].map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ color: '#555', fontSize: 14 }}>{label}</span>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{(deal.salesPerformance?.callScoreCard as any)?.[key] || 0}/10</span>
                  </div>
                ))}
              </div>

              {(deal.salesPerformance.greenFlags || []).length > 0 && (
                <>
                  <SmallLabel>Strengths Observed</SmallLabel>
                  {deal.salesPerformance.greenFlags.map((f, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{f.observation}</p>
                      {f.example && <p style={{ margin: '2px 0', color: '#888', fontSize: 13, fontStyle: 'italic' }}>{f.example}</p>}
                      <p style={{ margin: '2px 0', color: '#666', fontSize: 13 }}>{f.impact}</p>
                    </div>
                  ))}
                </>
              )}

              {(deal.salesPerformance.redFlags || []).length > 0 && (
                <>
                  <SmallLabel>Areas to Improve</SmallLabel>
                  {deal.salesPerformance.redFlags.map((f, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{f.observation} <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>({f.priority})</span></p>
                      <p style={{ margin: '2px 0', color: '#666', fontSize: 13 }}>Fix: {f.howToFix}</p>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          <Hr />

          {/* Deal Summary */}
          {deal.dealGrade && (
            <>
              <SectionTitle>Deal Summary</SectionTitle>
              {(deal.dealGrade.dealStrengths || []).length > 0 && (
                <><SmallLabel>Strengths</SmallLabel><Bullets items={deal.dealGrade.dealStrengths} /></>
              )}
              {(deal.dealGrade.dealRisks || []).length > 0 && (
                <><SmallLabel>Risks</SmallLabel><Bullets items={deal.dealGrade.dealRisks} /></>
              )}
              <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8, marginTop: 16 }}>
                <SmallLabel>Recommended Next Step</SmallLabel>
                <p style={{ margin: '0 0 4px', fontSize: 14 }}>{deal.dealGrade.recommendedNextStep || 'N/A'}</p>
                <p style={{ margin: 0, color: '#888', fontSize: 13 }}>{deal.dealGrade.gradeReason}</p>
              </div>
            </>
          )}
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
        <p style={{ color: '#bbb', fontSize: 12 }}>Generated on {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 48px', fontFamily: "'Manrope', 'Inter', system-ui, sans-serif", color: '#1a1a1a', lineHeight: 1.6, background: '#fff', minHeight: '100vh' }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 18, fontWeight: 600, margin: '32px 0 16px', paddingBottom: 8, borderBottom: '1px solid #eee' }}>{children}</h2>;
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#888', margin: '20px 0 8px' }}>{children}</p>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid #f8f8f8' }}>
      <span style={{ width: 180, color: '#888', fontSize: 14, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#333', fontSize: 14 }}>{value}</span>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: '0 0 16px', paddingLeft: 20, color: '#555', fontSize: 14 }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
    </ul>
  );
}

function Hr() {
  return <div style={{ borderTop: '1px solid #eee', margin: '32px 0' }} />;
}