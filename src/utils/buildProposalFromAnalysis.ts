import type { ProposalGeneratorInput } from '@/types/proposalGenerator';

/**
 * Build a ProposalGeneratorInput from sales call analysis data.
 * Used by both the Quick Generate flow (result page) and the
 * Proposal Editor prefill flow.
 */
export function buildProposalFromAnalysis(analysis: any): ProposalGeneratorInput {
  const deal = analysis?.analysis?.dealArchitecture;
  const meta = analysis?.metadata;
  const painPoints = deal?.prospectDiagnosis?.bleedingNeckProblems || [];
  const pricing = deal?.pricingStrategy;
  const phases = deal?.solutionStack
    ? [deal.solutionStack.phase1QuickWin, deal.solutionStack.phase2CoreSystem, deal.solutionStack.phase3AIWowFactor].filter(Boolean)
    : [];

  // Distribute pricing across solutions proportionally
  const setupPerSolution = pricing?.setupFee?.recommended
    ? Math.round(pricing.setupFee.recommended / Math.max(phases.length, 1))
    : 0;
  const monthlyPerSolution = pricing?.monthlyRetainer?.recommended
    ? Math.round(pricing.monthlyRetainer.recommended / Math.max(phases.length, 1))
    : 0;

  return {
    clientDetails: {
      clientName: meta?.prospectName || '',
      clientTitle: meta?.prospectTitle || '',
      companyName: meta?.companyName || '',
      corePitchGoal: pricing?.pitchAngle?.headline || 'Custom AI Automation Solutions',
      presentationTone: 'Professional, ROI-focused',
    },
    currentState: {
      mainBottleneck: painPoints[0]?.problem || '',
      teamInefficiencies: painPoints.slice(1).map((p: any) => p.problem).join('. ') || '',
      opportunityCost: painPoints[0]?.estimatedCost || '',
    },
    futureState: {
      proposedTeamStructure: deal?.solutionStack?.phase2CoreSystem?.expectedOutcome || '',
      ownerExecutiveRole: deal?.executiveBrief?.topPriority || '',
    },
    solutions: phases.length > 0
      ? phases.map((phase: any, i: number) => ({
          id: String(i + 1),
          solutionName: phase?.phaseName || `Phase ${i + 1}`,
          howItWorks: (phase?.tools || []).map((t: any) => `${t.toolName}: ${t.description || ''}`).join(' → ') || '',
          keyBenefits: phase?.expectedOutcome || '',
          setupFee: setupPerSolution > 0 ? `$${setupPerSolution.toLocaleString()}` : '',
          monthlyFee: monthlyPerSolution > 0 ? `$${monthlyPerSolution.toLocaleString()}/mo` : '',
        }))
      : [{
          id: '1',
          solutionName: 'Custom AI Automation Solution',
          howItWorks: '',
          keyBenefits: '',
          setupFee: '',
          monthlyFee: '',
        }],
    closeDetails: {
      bundleDiscountOffer: pricing?.contractTerms?.discountForLongerTerm || '',
      callToAction: 'Book Your Strategy Call',
      bookingLink: '',
    },
  };
}
