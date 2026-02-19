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
    rawAnalysisContext: buildRawAnalysisContext(analysis),
  };
}

/**
 * Serialize the full analysis into a structured text block that the AI
 * service can use to generate a highly specific gamma prompt.
 * Includes: deal architecture, transcript, call structure, sales
 * performance, competitive intel, buying signals, and key moments.
 */
function buildRawAnalysisContext(analysis: any): string {
  const sections: string[] = [];
  const deal = analysis?.analysis?.dealArchitecture;
  const callStructure = analysis?.analysis?.callStructure;
  const salesPerformance = analysis?.analysis?.salesPerformance;
  const competitiveIntel = analysis?.analysis?.competitiveIntel;
  const meta = analysis?.metadata;
  const transcript = analysis?.transcript;

  // ── Transcript (the gold) ──
  if (transcript) {
    sections.push(`FULL SALES CALL TRANSCRIPT:\n${transcript}`);
  }

  // ── Deal Architecture ──
  if (deal) {
    const brief = deal.executiveBrief;
    if (brief) {
      const parts = [
        brief.dealGrade && `Deal Grade: ${brief.dealGrade}`,
        brief.winProbability && `Win Probability: ${brief.winProbability}%`,
        brief.totalDealValue && `Total Deal Value: ${brief.totalDealValue}`,
        brief.topPriority && `Top Priority: ${brief.topPriority}`,
        brief.immediateAction && `Immediate Action: ${brief.immediateAction}`,
      ].filter(Boolean);
      if (parts.length) sections.push(`EXECUTIVE BRIEF:\n${parts.join('\n')}`);
    }

    // Pain points with full detail
    const painPoints = deal.prospectDiagnosis?.bleedingNeckProblems;
    if (painPoints?.length) {
      const lines = painPoints.map((p: any, i: number) => {
        const parts = [
          `${i + 1}. ${p.problem} [${p.severity || 'unknown'} severity]`,
          p.frequency && `   Frequency: ${p.frequency}`,
          p.estimatedCost && `   Estimated Cost: ${p.estimatedCost}`,
          p.directQuote && `   Direct Quote: "${p.directQuote}"`,
        ].filter(Boolean);
        return parts.join('\n');
      });
      sections.push(`PROSPECT PAIN POINTS (with direct quotes):\n${lines.join('\n')}`);
    }

    // Buying signals
    const signals = deal.prospectDiagnosis?.buyingSignals;
    if (signals?.length) {
      sections.push(`BUYING SIGNALS:\n${signals.map((s: any) => `- "${typeof s === 'string' ? s : s.signal || s}"`).join('\n')}`);
    }

    // Red flags
    const redFlags = deal.prospectDiagnosis?.redFlags;
    if (redFlags?.length) {
      sections.push(`RED FLAGS:\n${redFlags.map((f: any) => `- ${typeof f === 'string' ? f : f.flag || f}`).join('\n')}`);
    }

    // Solution stack with full detail
    const stack = deal.solutionStack;
    if (stack) {
      const phaseEntries = [
        stack.phase1QuickWin && { label: 'Phase 1 (Quick Win)', data: stack.phase1QuickWin },
        stack.phase2CoreSystem && { label: 'Phase 2 (Core System)', data: stack.phase2CoreSystem },
        stack.phase3AIWowFactor && { label: 'Phase 3 (AI Wow Factor)', data: stack.phase3AIWowFactor },
      ].filter(Boolean) as { label: string; data: any }[];

      const lines = phaseEntries.map(({ label, data }) => {
        const parts = [
          `${label}: ${data.phaseName || ''}`,
          data.timeline && `  Timeline: ${data.timeline}`,
          data.expectedOutcome && `  Expected Outcome: ${data.expectedOutcome}`,
          data.proofOfConcept && `  Proof of Concept: ${data.proofOfConcept}`,
          data.retainerJustification && `  Retainer Justification: ${data.retainerJustification}`,
          data.roiProjection && `  ROI Projection: ${data.roiProjection}`,
          data.replaces && `  Replaces: ${data.replaces}`,
          data.tools?.length && `  Tools: ${data.tools.map((t: any) => `${t.toolName} (${t.description || t.category || ''})`).join(', ')}`,
        ].filter(Boolean);
        return parts.join('\n');
      });
      sections.push(`SOLUTION STACK (detailed):\n${lines.join('\n\n')}`);
    }

    // Pricing strategy
    const pricing = deal.pricingStrategy;
    if (pricing) {
      const parts = [
        pricing.setupFee?.recommended && `Setup Fee: $${pricing.setupFee.recommended.toLocaleString()} (range: $${pricing.setupFee.minimum?.toLocaleString()}-$${pricing.setupFee.maximum?.toLocaleString()})`,
        pricing.monthlyRetainer?.recommended && `Monthly Retainer: $${pricing.monthlyRetainer.recommended.toLocaleString()}/mo (range: $${pricing.monthlyRetainer.minimum?.toLocaleString()}-$${pricing.monthlyRetainer.maximum?.toLocaleString()})`,
        pricing.totalDealValue?.firstYear && `First Year Value: $${pricing.totalDealValue.firstYear.toLocaleString()}`,
        pricing.totalDealValue?.lifetime && `Lifetime Value: $${pricing.totalDealValue.lifetime.toLocaleString()}`,
        pricing.totalDealValue?.margin && `Margin: ${pricing.totalDealValue.margin}`,
        pricing.pitchAngle?.headline && `Pitch Angle: ${pricing.pitchAngle.headline}`,
        pricing.pitchAngle?.subtext && `Subtext: ${pricing.pitchAngle.subtext}`,
        pricing.pitchAngle?.comparison && `Comparison: ${pricing.pitchAngle.comparison}`,
        pricing.pitchAngle?.urgency && `Urgency: ${pricing.pitchAngle.urgency}`,
        pricing.contractTerms?.recommendedTerm && `Contract: ${pricing.contractTerms.recommendedTerm}`,
        pricing.contractTerms?.discountForLongerTerm && `Discount: ${pricing.contractTerms.discountForLongerTerm}`,
        pricing.contractTerms?.paymentStructure && `Payment: ${pricing.contractTerms.paymentStructure}`,
        pricing.contractTerms?.guarantee && `Guarantee: ${pricing.contractTerms.guarantee}`,
      ].filter(Boolean);
      if (parts.length) sections.push(`PRICING STRATEGY:\n${parts.join('\n')}`);
    }
  }

  // ── Call Structure ──
  if (callStructure) {
    const parts: string[] = [];
    ['opening', 'discovery', 'closing'].forEach((phase) => {
      const data = callStructure[phase];
      if (!data) return;
      parts.push(`${phase.toUpperCase()}: ${data.rating || data.quality || ''}`);
      if (data.strengths?.length) parts.push(`  Strengths: ${data.strengths.join('; ')}`);
      if (data.areasToImprove?.length) parts.push(`  Areas to Improve: ${data.areasToImprove.join('; ')}`);
      if (data.recommendations?.length) parts.push(`  Recommendations: ${data.recommendations.join('; ')}`);
    });

    const keyMoments = callStructure.keyMoments;
    if (keyMoments?.length) {
      parts.push('KEY MOMENTS:');
      keyMoments.forEach((m: any) => {
        parts.push(`  ${m.timestamp || ''} [${m.sentiment || ''}/${m.emotion || ''}]: ${m.description || ''}`);
        if (m.impact) parts.push(`    Impact: ${m.impact}`);
      });
    }

    if (parts.length) sections.push(`CALL STRUCTURE ANALYSIS:\n${parts.join('\n')}`);
  }

  // ── Sales Performance ──
  if (salesPerformance) {
    const parts: string[] = [];
    if (salesPerformance.overallScore) parts.push(`Overall Score: ${salesPerformance.overallScore}/100`);

    const metrics = salesPerformance.metrics || salesPerformance;
    ['rapportBuilding', 'discoveryDepth', 'painIdentification', 'valuePresentation', 'objectionHandling', 'closingStrength'].forEach((key) => {
      const val = metrics[key];
      if (val) parts.push(`  ${key}: ${typeof val === 'object' ? val.score || val.rating : val}/10`);
    });

    if (salesPerformance.strengthsObserved?.length) {
      parts.push(`Strengths: ${salesPerformance.strengthsObserved.join('; ')}`);
    }
    if (salesPerformance.areasToImprove?.length) {
      parts.push(`Areas to Improve: ${salesPerformance.areasToImprove.map((a: any) => typeof a === 'string' ? a : a.area || a.description || '').join('; ')}`);
    }
    if (salesPerformance.missedOpportunities?.length) {
      parts.push(`Missed Opportunities: ${salesPerformance.missedOpportunities.map((m: any) => typeof m === 'string' ? m : m.opportunity || m.description || '').join('; ')}`);
    }

    if (parts.length) sections.push(`SALES PERFORMANCE:\n${parts.join('\n')}`);
  }

  // ── Competitive Intel ──
  if (competitiveIntel) {
    const parts: string[] = [];
    const competitors = competitiveIntel.competitors || competitiveIntel.currentVendors;
    if (competitors?.length) {
      parts.push(`Competitors: ${competitors.map((c: any) => typeof c === 'string' ? c : c.name || c).join(', ')}`);
    }
    const buyingSignals = competitiveIntel.buyingSignals;
    if (buyingSignals?.length) {
      parts.push(`Additional Buying Signals: ${buyingSignals.map((s: any) => `"${typeof s === 'string' ? s : s.signal || s}"`).join(', ')}`);
    }
    if (parts.length) sections.push(`COMPETITIVE INTEL:\n${parts.join('\n')}`);
  }

  // ── Metadata ──
  if (meta) {
    const parts = [
      meta.companyIndustry && `Industry: ${meta.companyIndustry}`,
      meta.callType && `Call Type: ${meta.callType}`,
      meta.callDuration && `Call Duration: ${meta.callDuration}`,
    ].filter(Boolean);
    if (parts.length) sections.push(`CALL METADATA:\n${parts.join('\n')}`);
  }

  return sections.join('\n\n---\n\n');
}