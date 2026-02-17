

import jsPDF from 'jspdf';

interface AnalysisData {
  title: string;
  createdAt: string;
  metadata?: any;
  analysis?: any;
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addSection(
  doc: jsPDF,
  title: string,
  y: number,
  pageHeight: number,
  margin: number
): number {
  if (y > pageHeight - 40) {
    doc.addPage();
    y = margin;
  }
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 180, 180);
  doc.text(title.toUpperCase(), margin, y);
  y += 6;
  // Thin rule under section title
  doc.setDrawColor(50, 50, 50);
  doc.line(margin, y, 190, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.setFontSize(9);
  return y;
}

function checkNewPage(
  doc: jsPDF,
  y: number,
  pageHeight: number,
  margin: number,
  needed = 20
): number {
  if (y > pageHeight - needed) {
    doc.addPage();
    return margin;
  }
  return y;
}

export async function downloadAnalysisPDF(analysis: AnalysisData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const margin = 20;
  const pageWidth = 210;
  const pageHeight = 297;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 5.5;

  // ── Dark background ──────────────────────────────────────────────────────
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // ── COVER PAGE ───────────────────────────────────────────────────────────
  let y = 60;

  // Score circle
  const score =
    analysis?.analysis?.callResults?.analysis?.overallScore ||
    analysis?.metadata?.overallScore ||
    0;
  doc.setFillColor(30, 30, 30);
  doc.circle(pageWidth / 2, y, 18, 'F');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(240, 240, 240);
  doc.text(String(score), pageWidth / 2, y + 3, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text('SCORE', pageWidth / 2, y + 10, { align: 'center' });

  y += 30;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(240, 240, 240);
  const titleLines = doc.splitTextToSize(analysis.title, contentWidth);
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
  y += titleLines.length * 8 + 6;

  // Meta line
  const sentiment =
    analysis?.analysis?.callResults?.analysis?.sentiment ||
    analysis?.metadata?.sentiment ||
    'neutral';
  const duration = analysis?.analysis?.callResults?.duration || analysis?.metadata?.duration || 0;
  const durationStr = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
  const dateStr = new Date(analysis.createdAt).toLocaleDateString();

  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`${sentiment}  ·  ${durationStr}  ·  ${dateStr}`, pageWidth / 2, y, { align: 'center' });
  y += 16;

  // Divider
  doc.setDrawColor(40, 40, 40);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Deal grade (if present)
  const deal = analysis?.analysis?.dealArchitecture;
  if (deal?.dealGrade) {
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 200, 200);
    doc.text(deal.dealGrade.grade, pageWidth / 2, y + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`DEAL GRADE  ·  ${deal.dealGrade.winProbability}% WIN PROBABILITY`, pageWidth / 2, y + 20, {
      align: 'center',
    });
    y += 32;

    if (deal.executiveBrief?.oneLineSummary) {
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      const summaryLines = doc.splitTextToSize(deal.executiveBrief.oneLineSummary, contentWidth - 20);
      doc.text(summaryLines, pageWidth / 2, y, { align: 'center' });
      y += summaryLines.length * lineHeight + 10;
    }
  }

  // ── PAGE 2+ : CONTENT ────────────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  y = margin;

  // Helper: bullet list
  const addBullets = (items: string[], currentY: number): number => {
    let cy = currentY;
    for (const item of items) {
      cy = checkNewPage(doc, cy, pageHeight, margin);
      const wrapped = doc.splitTextToSize(`• ${item}`, contentWidth - 4);
      doc.text(wrapped, margin + 2, cy);
      cy += wrapped.length * lineHeight + 1;
    }
    return cy + 4;
  };

  // ── EXECUTIVE BRIEF ──────────────────────────────────────────────────────
  if (deal?.executiveBrief) {
    y = addSection(doc, 'Executive Brief', y, pageHeight, margin);
    const brief = deal.executiveBrief;

    const rows = [
      ['Deal Value', brief.dealValue],
      ['Top Priority', brief.topPriority],
      ['Immediate Action', brief.immediateAction],
    ];

    for (const [label, value] of rows) {
      y = checkNewPage(doc, y, pageHeight, margin);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text(label.toUpperCase(), margin, y);
      y += 4;
      doc.setTextColor(210, 210, 210);
      doc.setFontSize(9);
      const wrapped = doc.splitTextToSize(value || 'N/A', contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * lineHeight + 6;
    }

    y += 4;
  }

  // ── EXECUTIVE SUMMARY ────────────────────────────────────────────────────
  const execSummary = analysis?.analysis?.callResults?.executiveSummary;
  if (execSummary) {
    y = addSection(doc, 'Call Summary', y, pageHeight, margin);
    const wrapped = doc.splitTextToSize(execSummary, contentWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * lineHeight + 12;
  }

  // ── PROSPECT DIAGNOSIS ───────────────────────────────────────────────────
  if (deal?.prospectDiagnosis) {
    y = addSection(doc, 'Prospect Diagnosis', y, pageHeight, margin);
    const pd = deal.prospectDiagnosis;
    const bp = pd.businessProfile;

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('BUSINESS PROFILE', margin, y);
    y += 5;
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);

    const profileLines = [
      `Industry: ${bp.industry || 'N/A'}`,
      `Type: ${(bp.businessType || '').replace(/_/g, ' ')}`,
      `Team Size: ${bp.estimatedTeamSize || 'N/A'}`,
      `Revenue: ${bp.estimatedRevenue || 'N/A'}`,
      bp.location ? `Location: ${bp.location}` : null,
    ].filter(Boolean) as string[];

    for (const line of profileLines) {
      y = checkNewPage(doc, y, pageHeight, margin);
      doc.text(line, margin + 2, y);
      y += lineHeight;
    }
    y += 6;

    // Pain points
    if (pd.bleedingNeckProblems?.length) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('PAIN POINTS', margin, y);
      y += 5;
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);

      for (const prob of pd.bleedingNeckProblems) {
        y = checkNewPage(doc, y, pageHeight, margin);
        doc.setFont('helvetica', 'bold');
        doc.text(`${prob.problem}`, margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        y += lineHeight;
        doc.text(
          `${prob.severity} · ${prob.frequency || ''} · ${prob.estimatedCost || ''}`,
          margin + 4,
          y
        );
        y += lineHeight;
        if (prob.quotedEvidence) {
          const quoted = doc.splitTextToSize(`"${prob.quotedEvidence}"`, contentWidth - 8);
          doc.text(quoted, margin + 4, y);
          y += quoted.length * lineHeight;
        }
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        y += 4;
      }
    }

    // Buying signals & red flags
    const fq = pd.financialQualification;
    if (fq) {
      y = checkNewPage(doc, y, pageHeight, margin, 30);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('FINANCIAL QUALIFICATION', margin, y);
      y += 5;
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      doc.text(
        `Status: ${fq.isQualified === 'yes' ? 'Qualified' : fq.isQualified === 'maybe' ? 'Needs Validation' : 'Not Qualified'}  ·  Urgency: ${(fq.urgencyLevel || '').replace(/_/g, ' ')}`,
        margin + 2,
        y
      );
      y += lineHeight + 2;
      const reasonWrapped = doc.splitTextToSize(fq.qualificationReason || '', contentWidth - 4);
      doc.text(reasonWrapped, margin + 2, y);
      y += reasonWrapped.length * lineHeight + 8;

      if (fq.buyingSignals?.length) {
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text('BUYING SIGNALS', margin, y);
        y += 5;
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(9);
        y = addBullets(fq.buyingSignals, y);
      }

      if (fq.redFlags?.length) {
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text('RED FLAGS', margin, y);
        y += 5;
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(9);
        y = addBullets(fq.redFlags, y);
      }
    }

    y += 4;
  }

  // ── PRICING STRATEGY ─────────────────────────────────────────────────────
  if (deal?.pricingStrategy) {
    y = addSection(doc, 'Pricing Strategy', y, pageHeight, margin);
    const ps = deal.pricingStrategy;

    // Setup fee
    y = checkNewPage(doc, y, pageHeight, margin);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('SETUP FEE', margin, y);
    y += 5;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(240, 240, 240);
    doc.text(`$${(ps.setupFee?.recommended || 0).toLocaleString()}`, margin, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Range: $${(ps.setupFee?.minimum || 0).toLocaleString()} – $${(ps.setupFee?.maximum || 0).toLocaleString()}`,
      margin + 30,
      y
    );
    y += 8;

    // Monthly retainer
    y = checkNewPage(doc, y, pageHeight, margin);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('MONTHLY RETAINER', margin, y);
    y += 5;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(240, 240, 240);
    doc.text(`$${(ps.monthlyRetainer?.recommended || 0).toLocaleString()}/mo`, margin, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Range: $${(ps.monthlyRetainer?.minimum || 0).toLocaleString()} – $${(ps.monthlyRetainer?.maximum || 0).toLocaleString()}`,
      margin + 40,
      y
    );
    y += 8;

    // Year 1 value
    y = checkNewPage(doc, y, pageHeight, margin);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('YEAR 1 DEAL VALUE', margin, y);
    y += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(240, 240, 240);
    doc.text(`$${(ps.totalDealValue?.firstYearValue || 0).toLocaleString()}`, margin, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 110);
    doc.text(`Margin: ${ps.totalDealValue?.profitMarginEstimate || 'N/A'}`, margin + 35, y);
    y += 10;

    // Pitch angle
    if (ps.pitchAngle) {
      y = checkNewPage(doc, y, pageHeight, margin);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('PITCH ANGLE', margin, y);
      y += 5;
      doc.setTextColor(210, 210, 210);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const headlineWrapped = doc.splitTextToSize(ps.pitchAngle.headline, contentWidth);
      doc.text(headlineWrapped, margin, y);
      y += headlineWrapped.length * lineHeight + 3;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      const valueWrapped = doc.splitTextToSize(ps.pitchAngle.valueFraming, contentWidth);
      doc.text(valueWrapped, margin, y);
      y += valueWrapped.length * lineHeight + 10;
    }
  }

  // ── SALES PERFORMANCE ────────────────────────────────────────────────────
  if (deal?.salesPerformance?.callScoreCard) {
    y = addSection(doc, 'Sales Performance', y, pageHeight, margin);
    const sc = deal.salesPerformance.callScoreCard;

    y = checkNewPage(doc, y, pageHeight, margin, 50);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(240, 240, 240);
    doc.text(String(sc.overallScore), pageWidth / 2, y + 4, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('OVERALL SCORE', pageWidth / 2, y + 11, { align: 'center' });
    y += 20;

    const scoreItems = [
      ['Rapport Building', sc.rapportBuilding],
      ['Discovery Depth', sc.discoveryDepth],
      ['Pain Identification', sc.painIdentification],
      ['Value Presentation', sc.valuePresentation],
      ['Objection Handling', sc.objectionHandling],
      ['Closing Strength', sc.closingStrength],
    ];

    doc.setFontSize(9);
    for (const [label, val] of scoreItems) {
      y = checkNewPage(doc, y, pageHeight, margin);
      doc.setTextColor(160, 160, 160);
      doc.text(String(label), margin, y);
      doc.setTextColor(220, 220, 220);
      doc.text(`${val}/10`, pageWidth - margin, y, { align: 'right' });
      y += lineHeight + 1;
    }
    y += 8;

    // Missed opportunities
    if (deal.salesPerformance.missedOpportunities?.length) {
      y = checkNewPage(doc, y, pageHeight, margin);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('MISSED OPPORTUNITIES', margin, y);
      y += 5;
      doc.setFontSize(9);

      for (const opp of deal.salesPerformance.missedOpportunities) {
        y = checkNewPage(doc, y, pageHeight, margin);
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'bold');
        doc.text(opp.topic, margin + 2, y);
        doc.setFont('helvetica', 'normal');
        y += lineHeight;
        doc.setTextColor(130, 130, 130);
        doc.setFontSize(8);
        const q = doc.splitTextToSize(opp.questionToAsk, contentWidth - 4);
        doc.text(q, margin + 4, y);
        y += q.length * lineHeight + 2;
        const why = doc.splitTextToSize(opp.whyItMatters, contentWidth - 4);
        doc.text(why, margin + 4, y);
        y += why.length * lineHeight + 5;
        doc.setFontSize(9);
      }
    }

    // Next call prep
    if (deal.salesPerformance.nextCallPreparation?.length) {
      y = checkNewPage(doc, y, pageHeight, margin);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('NEXT CALL PREPARATION', margin, y);
      y += 5;
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      y = addBullets(deal.salesPerformance.nextCallPreparation, y);
    }
  }

  // ── COACHING FEEDBACK ────────────────────────────────────────────────────
  const coaching = analysis?.analysis?.callResults?.coachingFeedback;
  if (coaching) {
    y = addSection(doc, 'Coaching Feedback', y, pageHeight, margin);

    if (coaching.strengths?.length) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('STRENGTHS', margin, y);
      y += 5;
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      y = addBullets(coaching.strengths, y);
    }

    if (coaching.improvements?.length) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('AREAS TO IMPROVE', margin, y);
      y += 5;
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      y = addBullets(coaching.improvements, y);
    }

    if (coaching.specificSuggestions?.length) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('SPECIFIC SUGGESTIONS', margin, y);
      y += 5;
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      y = addBullets(coaching.specificSuggestions, y);
    }
  }

  // ── DEAL STRENGTHS & RISKS ───────────────────────────────────────────────
  if (deal?.dealGrade) {
    y = addSection(doc, 'Deal Assessment', y, pageHeight, margin);
    const dg = deal.dealGrade;

    y = checkNewPage(doc, y, pageHeight, margin);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    const gradeReason = doc.splitTextToSize(dg.gradeReason, contentWidth);
    doc.text(gradeReason, margin, y);
    y += gradeReason.length * lineHeight + 8;

    if (dg.dealStrengths?.length) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('STRENGTHS', margin, y);
      y += 5;
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      y = addBullets(dg.dealStrengths, y);
    }

    if (dg.dealRisks?.length) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('RISKS', margin, y);
      y += 5;
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      y = addBullets(dg.dealRisks, y);
    }

    y = checkNewPage(doc, y, pageHeight, margin);
    doc.setFillColor(25, 25, 25);
    const boxY = y;
    doc.roundedRect(margin, boxY, contentWidth, 24, 2, 2, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text('RECOMMENDED NEXT STEP', margin + 4, boxY + 7);
    doc.setTextColor(210, 210, 210);
    doc.setFontSize(9);
    const nextStep = doc.splitTextToSize(dg.recommendedNextStep || 'N/A', contentWidth - 8);
    doc.text(nextStep, margin + 4, boxY + 14);
    y = boxY + 28;
  }

  // ── FOLLOW-UP EMAIL ──────────────────────────────────────────────────────
  const email = analysis?.analysis?.callResults?.followUpEmail;
  if (email) {
    doc.addPage();
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    y = margin;

    y = addSection(doc, 'Follow-up Email', y, pageHeight, margin);
    doc.setFontSize(8.5);
    doc.setTextColor(190, 190, 190);
    const emailLines = doc.splitTextToSize(email, contentWidth);
    // Chunk it across pages if needed
    for (const line of emailLines) {
      y = checkNewPage(doc, y, pageHeight, margin, 10);
      doc.text(line, margin, y);
      y += lineHeight;
    }
  }

  // ── FOOTER on every page ─────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 285, pageWidth, 12, 'F');
    doc.setDrawColor(35, 35, 35);
    doc.line(margin, 286, pageWidth - margin, 286);
    doc.setFontSize(7);
    doc.setTextColor(70, 70, 70);
    doc.text('ArbitrageOS · Sales Call Analysis', margin, 292);
    doc.text(`${i} / ${totalPages}`, pageWidth - margin, 292, { align: 'right' });
  }

  // ── SAVE ─────────────────────────────────────────────────────────────────
  const safeName = (analysis.title || 'call-analysis')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .slice(0, 40);
  doc.save(`${safeName}-${new Date().toISOString().split('T')[0]}.pdf`);
}