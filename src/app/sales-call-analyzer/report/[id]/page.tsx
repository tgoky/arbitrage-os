"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { message } from 'antd';

// ── Printable Report Page ──
// Opens in a new tab with a clean, formatted layout ready to print/download via browser Print dialog.

interface AnalysisData {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  analysis: {
    callResults: {
      callId: string;
      status: string;
      duration: number;
      detailedReport?: string;
      followUpEmail?: string;
      participants: Array<{
        name: string;
        role: string;
        speakingTime: number;
        speakingPercentage: number;
      }>;
      transcript: string;
      analysis: {
        overallScore: number;
        sentiment: string;
        keyInsights: string[];
        actionItems: string[];
        speakerBreakdown: Array<{
          speaker: string;
          speakingTime: number;
          percentage: number;
          keyPoints: string[];
        }>;
        salesMetrics?: {
          painPointsIdentified?: string[];
          buyingSignals?: string[];
          objectionsRaised?: string[];
          competitorsMentioned?: string[];
        };
      };
      executiveSummary: string;
      coachingFeedback: {
        strengths: string[];
        improvements: string[];
        specificSuggestions: string[];
      };
    };
    performanceMetrics: {
      talkTimePercentage?: number;
      talkTime?: number;
      engagementScore: number;
      clarityScore: number;
      professionalismScore: number;
    };
    dealArchitecture?: {
      prospectDiagnosis: {
        businessProfile: {
          industry: string;
          businessType: string;
          estimatedTeamSize: string;
          estimatedRevenue: string;
          currentTechStack: string[];
          location?: string;
        };
        bleedingNeckProblems: Array<{
          problem: string;
          severity: string;
          frequency: string;
          estimatedCost: string;
          quotedEvidence?: string;
        }>;
        financialQualification: {
          isQualified: string;
          qualificationReason: string;
          estimatedBudget?: string;
          urgencyLevel: string;
          decisionMakerPresent: boolean;
          buyingSignals: string[];
          redFlags: string[];
        };
      };
      solutionStack: {
        phase1QuickWin: {
          phaseName: string;
          timeline: string;
          tools: Array<{ toolName: string; toolType: string; description: string; estimatedSetupHours: number; setupComplexity: string; }>;
          expectedOutcome: string;
          proofOfConcept: string;
        };
        phase2CoreSystem: {
          phaseName: string;
          timeline: string;
          tools: Array<{ toolName: string; toolType: string; description: string; estimatedSetupHours: number; setupComplexity: string; monthlyMaintenanceHours?: number; }>;
          expectedOutcome: string;
          retainerJustification: string;
        };
        phase3AIWowFactor: {
          phaseName: string;
          timeline: string;
          tools: Array<{ toolName: string; toolType: string; description: string; estimatedSetupHours: number; setupComplexity: string; replacesRole?: string; monthlyMaintenanceHours?: number; }>;
          expectedOutcome: string;
          roiProjection: string;
        };
        integrationMap: {
          requiredIntegrations: string[];
          niceToHaveIntegrations: string[];
          potentialBlockers: string[];
        };
      };
      pricingStrategy: {
        setupFee: { minimum: number; maximum: number; recommended: number; breakdown: Array<{ item: string; cost: number; justification: string; }>; };
        monthlyRetainer: { minimum: number; maximum: number; recommended: number; breakdown: Array<{ item: string; monthlyCost: number; justification: string; }>; includedHours?: number; overhourlyRate?: number; };
        pitchAngle: { headline: string; valueFraming: string; comparisonPoint: string; urgencyHook: string; };
        contractTerms: { recommendedTerm: string; discountForLongerTerm?: string; paymentStructure: string; guaranteeOffered?: string; };
        upsellOpportunities: Array<{ service: string; timing: string; additionalRevenue: number; }>;
        totalDealValue: { firstYearValue: number; lifetimeValueEstimate: number; profitMarginEstimate: string; };
      };
      salesPerformance: {
        greenFlags: Array<{ observation: string; example?: string; impact: string; }>;
        redFlags: Array<{ observation: string; example?: string; howToFix: string; priority: string; }>;
        missedOpportunities: Array<{ topic: string; questionToAsk: string; whyItMatters: string; }>;
        callScoreCard: {
          rapportBuilding: number;
          discoveryDepth: number;
          painIdentification: number;
          valuePresentation: number;
          objectionHandling: number;
          closingStrength: number;
          overallScore: number;
        };
        nextCallPreparation: string[];
      };
      dealGrade: {
        grade: string;
        gradeReason: string;
        winProbability: number;
        recommendedNextStep: string;
        dealRisks: string[];
        dealStrengths: string[];
      };
      executiveBrief: {
        oneLineSummary: string;
        topPriority: string;
        immediateAction: string;
        dealValue: string;
      };
    };
  };
  metadata: {
    callType: string;
    duration: number;
    sentiment: string;
    actualDate: string;
    overallScore: number;
    companyName?: string;
    prospectName?: string;
    prospectTitle?: string;
    companyIndustry?: string;
    companyLocation?: string;
    generatedAt: string;
    participantCount: number;
  };
}

export default function ReportPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/sales-call-analyzer/${id}`);
        const result = await res.json();
        if (result.success) setAnalysis(result.data);
      } catch {
        console.error('Failed to load analysis for report');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="report-loading">
        <p>Loading report...</p>
        <style jsx>{`
          .report-loading { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Manrope', 'Inter', system-ui, sans-serif; color: #666; }
        `}</style>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="report-loading">
        <p>Report not found.</p>
        <style jsx>{`
          .report-loading { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Manrope', 'Inter', system-ui, sans-serif; color: #666; }
        `}</style>
      </div>
    );
  }

  const deal = analysis.analysis?.dealArchitecture;
  const callResults = analysis.analysis?.callResults;
  const duration = callResults?.duration || analysis.metadata?.duration || 0;
  const overallScore = callResults?.analysis?.overallScore || analysis.metadata?.overallScore || 0;
  const strengths = callResults?.coachingFeedback?.strengths || [];

  const participants = callResults?.participants || [];
  const agent = participants[0];
  const prospect = participants[1];

  return (
    <>
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .report-page { padding: 0 !important; }
          .page-break { page-break-before: always; }
        }
        body { margin: 0; padding: 0; background: #fff; }
      `}</style>

      <div className="report-page" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 48px', fontFamily: "'Manrope', 'Inter', system-ui, sans-serif", color: '#1a1a1a', lineHeight: 1.6 }}>

        {/* Print button */}
        <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => window.print()}
            style={{ padding: '10px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          >
            Print / Save as PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{ padding: '10px 24px', background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          >
            Close
          </button>
        </div>

        {/* Header */}
        <div style={{ borderBottom: '2px solid #111', paddingBottom: 24, marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{analysis.title}</h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
            {analysis.metadata?.sentiment} &middot; {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} &middot; {new Date(analysis.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {analysis.metadata?.companyName && <> &middot; {analysis.metadata.companyName}</>}
          </p>
        </div>

        {/* Score + Key Metrics */}
        <div style={{ display: 'flex', gap: 40, marginBottom: 32, alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'center', minWidth: 100 }}>
            <p style={{ fontSize: 56, fontWeight: 300, margin: 0, lineHeight: 1 }}>{overallScore}</p>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginTop: 4 }}>Score</p>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {agent && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>{Math.round(agent.speakingPercentage || 0)}%</p>
                <p style={{ fontSize: 11, color: '#888' }}>You</p>
              </div>
            )}
            {prospect && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>{Math.round(prospect.speakingPercentage || 0)}%</p>
                <p style={{ fontSize: 11, color: '#888' }}>Prospect</p>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>{(callResults?.analysis?.salesMetrics?.buyingSignals || []).length}</p>
              <p style={{ fontSize: 11, color: '#888' }}>Buying Signals</p>
            </div>
          </div>
        </div>

        {/* Strengths */}
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
            {/* Deal Grade */}
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

            <Divider />

            {/* Prospect Diagnosis */}
            {deal.prospectDiagnosis && (
              <>
                <SectionTitle>Prospect Diagnosis</SectionTitle>
                <SubLabel>Business Profile</SubLabel>
                <InfoRow label="Industry" value={deal.prospectDiagnosis.businessProfile?.industry || 'N/A'} />
                <InfoRow label="Type" value={(deal.prospectDiagnosis.businessProfile?.businessType || '').replace(/_/g, ' ') || 'N/A'} />
                <InfoRow label="Team Size" value={deal.prospectDiagnosis.businessProfile?.estimatedTeamSize || 'N/A'} />
                <InfoRow label="Revenue" value={deal.prospectDiagnosis.businessProfile?.estimatedRevenue || 'N/A'} />
                {deal.prospectDiagnosis.businessProfile?.location && <InfoRow label="Location" value={deal.prospectDiagnosis.businessProfile.location} />}

                {deal.prospectDiagnosis.financialQualification && (
                  <>
                    <SubLabel>Financial Qualification</SubLabel>
                    <InfoRow label="Qualified" value={deal.prospectDiagnosis.financialQualification.isQualified === 'yes' ? 'Yes' : deal.prospectDiagnosis.financialQualification.isQualified === 'maybe' ? 'Needs Validation' : 'No'} />
                    <InfoRow label="Reason" value={deal.prospectDiagnosis.financialQualification.qualificationReason || 'N/A'} />
                    {deal.prospectDiagnosis.financialQualification.estimatedBudget && <InfoRow label="Budget" value={deal.prospectDiagnosis.financialQualification.estimatedBudget} />}
                    <InfoRow label="Urgency" value={(deal.prospectDiagnosis.financialQualification.urgencyLevel || '').replace(/_/g, ' ')} />
                    <InfoRow label="Decision Maker Present" value={deal.prospectDiagnosis.financialQualification.decisionMakerPresent ? 'Yes' : 'No'} />
                  </>
                )}

                {(deal.prospectDiagnosis.bleedingNeckProblems || []).length > 0 && (
                  <>
                    <SubLabel>Pain Points</SubLabel>
                    {deal.prospectDiagnosis.bleedingNeckProblems.map((p, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <p style={{ margin: 0, fontWeight: 500 }}>{i + 1}. {p.problem} <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>({p.severity})</span></p>
                        <p style={{ margin: '2px 0 0', color: '#666', fontSize: 14 }}>{p.frequency}{p.estimatedCost ? ` / ${p.estimatedCost}` : ''}</p>
                        {p.quotedEvidence && <p style={{ margin: '4px 0 0 16px', color: '#888', fontSize: 13, fontStyle: 'italic', borderLeft: '2px solid #ddd', paddingLeft: 12 }}>{p.quotedEvidence}</p>}
                      </div>
                    ))}
                  </>
                )}

                {(deal.prospectDiagnosis.financialQualification?.buyingSignals || []).length > 0 && (
                  <>
                    <SubLabel>Buying Signals</SubLabel>
                    <BulletList items={deal.prospectDiagnosis.financialQualification.buyingSignals} />
                  </>
                )}

                {(deal.prospectDiagnosis.financialQualification?.redFlags || []).length > 0 && (
                  <>
                    <SubLabel>Red Flags</SubLabel>
                    <BulletList items={deal.prospectDiagnosis.financialQualification.redFlags} />
                  </>
                )}
              </>
            )}

            <Divider className="page-break" />

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
                        <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{tool.estimatedSetupHours || 0}h setup, {tool.setupComplexity} complexity</p>
                      </div>
                    ))}
                    <p style={{ color: '#555', fontSize: 14, margin: '8px 0 0' }}>Expected outcome: {phase.expectedOutcome || 'N/A'}</p>
                  </div>
                ))}
              </>
            )}

            <Divider className="page-break" />

            {/* Pricing Strategy */}
            {deal.pricingStrategy && (
              <>
                <SectionTitle>Pricing Strategy</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
                    <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#888', margin: '0 0 4px' }}>Setup Fee</p>
                    <p style={{ fontSize: 28, fontWeight: 300, margin: 0 }}>${(deal.pricingStrategy.setupFee?.recommended || 0).toLocaleString()}</p>
                    <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Range: ${(deal.pricingStrategy.setupFee?.minimum || 0).toLocaleString()} - ${(deal.pricingStrategy.setupFee?.maximum || 0).toLocaleString()}</p>
                  </div>
                  <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
                    <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#888', margin: '0 0 4px' }}>Monthly Retainer</p>
                    <p style={{ fontSize: 28, fontWeight: 300, margin: 0 }}>${(deal.pricingStrategy.monthlyRetainer?.recommended || 0).toLocaleString()}<span style={{ fontSize: 14, color: '#888' }}>/mo</span></p>
                    <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Range: ${(deal.pricingStrategy.monthlyRetainer?.minimum || 0).toLocaleString()} - ${(deal.pricingStrategy.monthlyRetainer?.maximum || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 8, marginBottom: 24 }}>
                  <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#888', margin: '0 0 4px' }}>Total Year 1 Value</p>
                  <p style={{ fontSize: 32, fontWeight: 300, margin: 0 }}>${(deal.pricingStrategy.totalDealValue?.firstYearValue || 0).toLocaleString()}</p>
                  <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Lifetime: ${(deal.pricingStrategy.totalDealValue?.lifetimeValueEstimate || 0).toLocaleString()} &middot; Margin: {deal.pricingStrategy.totalDealValue?.profitMarginEstimate || 'N/A'}</p>
                </div>

                {deal.pricingStrategy.pitchAngle && (
                  <>
                    <SubLabel>Pitch Angle</SubLabel>
                    <p style={{ fontWeight: 500, margin: '0 0 4px' }}>{deal.pricingStrategy.pitchAngle.headline}</p>
                    <p style={{ color: '#555', margin: '0 0 4px', fontSize: 14 }}>{deal.pricingStrategy.pitchAngle.valueFraming}</p>
                    <p style={{ color: '#888', margin: 0, fontSize: 13 }}>Comparison: {deal.pricingStrategy.pitchAngle.comparisonPoint}</p>
                    <p style={{ color: '#888', margin: '2px 0 16px', fontSize: 13 }}>Urgency: {deal.pricingStrategy.pitchAngle.urgencyHook}</p>
                  </>
                )}
              </>
            )}

            <Divider className="page-break" />

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
                  ].map(({ key, label }) => {
                    const val = (deal.salesPerformance?.callScoreCard as any)?.[key] || 0;
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                        <span style={{ color: '#555', fontSize: 14 }}>{label}</span>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{val}/10</span>
                      </div>
                    );
                  })}
                </div>

                {(deal.salesPerformance.greenFlags || []).length > 0 && (
                  <>
                    <SubLabel>Strengths Observed</SubLabel>
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
                    <SubLabel>Areas to Improve</SubLabel>
                    {deal.salesPerformance.redFlags.map((f, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{f.observation} <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>({f.priority})</span></p>
                        <p style={{ margin: '2px 0', color: '#666', fontSize: 13 }}>Fix: {f.howToFix}</p>
                      </div>
                    ))}
                  </>
                )}

                {(deal.salesPerformance.nextCallPreparation || []).length > 0 && (
                  <>
                    <SubLabel>Next Call Preparation</SubLabel>
                    <ol style={{ margin: 0, paddingLeft: 20, color: '#555', fontSize: 14 }}>
                      {deal.salesPerformance.nextCallPreparation.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
                    </ol>
                  </>
                )}
              </>
            )}

            <Divider />

            {/* Deal Summary */}
            {deal.dealGrade && (
              <>
                <SectionTitle>Deal Summary</SectionTitle>
                {(deal.dealGrade.dealStrengths || []).length > 0 && (
                  <>
                    <SubLabel>Deal Strengths</SubLabel>
                    <BulletList items={deal.dealGrade.dealStrengths} />
                  </>
                )}
                {(deal.dealGrade.dealRisks || []).length > 0 && (
                  <>
                    <SubLabel>Deal Risks</SubLabel>
                    <BulletList items={deal.dealGrade.dealRisks} />
                  </>
                )}
                <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8, marginTop: 16 }}>
                  <SubLabel>Recommended Next Step</SubLabel>
                  <p style={{ margin: '0 0 4px', fontSize: 14 }}>{deal.dealGrade.recommendedNextStep || 'N/A'}</p>
                  <p style={{ margin: 0, color: '#888', fontSize: 13 }}>{deal.dealGrade.gradeReason || ''}</p>
                </div>
              </>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ color: '#bbb', fontSize: 12 }}>Generated on {new Date(analysis.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    </>
  );
}

// ── Helper Components ──

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 18, fontWeight: 600, margin: '32px 0 16px', paddingBottom: 8, borderBottom: '1px solid #eee' }}>{children}</h2>;
}

function SubLabel({ children }: { children: React.ReactNode }) {
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: '0 0 16px', paddingLeft: 20, color: '#555', fontSize: 14 }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
    </ul>
  );
}

function Divider({ className }: { className?: string }) {
  return <div className={className} style={{ borderTop: '1px solid #eee', margin: '32px 0' }} />;
}