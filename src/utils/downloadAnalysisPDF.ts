// utils/downloadAnalysisPDF.ts
import jsPDF from 'jspdf';

interface AnalysisData {
  title: string;
  createdAt: string;
  metadata?: any;
  analysis?: any;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 12;
const SAFE_BOTTOM = PAGE_H - FOOTER_H - 6;
const LINE_SM = 4.8;
const LINE_MD = 5.5;
const LINE_LG = 7;

// ─── Colour palette (light / white theme) ────────────────────────────────────
const C = {
  black:   [15,  15,  15]  as [number,number,number],
  heading: [30,  30,  30]  as [number,number,number],
  body:    [60,  60,  60]  as [number,number,number],
  muted:   [120, 120, 120] as [number,number,number],
  label:   [150, 150, 150] as [number,number,number],
  rule:    [215, 215, 215] as [number,number,number],
  chipBg:  [245, 245, 245] as [number,number,number],
  chipBdr: [210, 210, 210] as [number,number,number],
  white:   [255, 255, 255] as [number,number,number],
  footBg:  [248, 248, 248] as [number,number,number],
};

// ─── Module-level state (reset per export) ────────────────────────────────────
let _doc: jsPDF;
let _y: number;
let _page: number;

// ─── Core helpers ─────────────────────────────────────────────────────────────

function tc(rgb: [number,number,number]) { _doc.setTextColor(rgb[0], rgb[1], rgb[2]); }

function whiteFill() {
  _doc.setFillColor(255, 255, 255);
  _doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
}

function newPage() {
  _doc.addPage();
  _page++;
  whiteFill();
  _y = MARGIN;
}

function need(mm: number) {
  if (_y + mm > SAFE_BOTTOM) newPage();
}

function hRule(col: [number,number,number] = C.rule, lw = 0.3) {
  _doc.setDrawColor(col[0], col[1], col[2]);
  _doc.setLineWidth(lw);
  _doc.line(MARGIN, _y, PAGE_W - MARGIN, _y);
  _y += 4;
}

function sp(mm = 4) { _y += mm; }

// ─── Typography helpers ───────────────────────────────────────────────────────

function sectionHeading(title: string) {
  need(16);
  sp(2);
  _doc.setFontSize(7.5);
  _doc.setFont('helvetica', 'bold');
  tc(C.label);
  _doc.text(title.toUpperCase(), MARGIN, _y);
  _y += 3;
  hRule(C.rule, 0.3);
}

function subLabel(text: string) {
  need(8);
  _doc.setFontSize(7);
  _doc.setFont('helvetica', 'normal');
  tc(C.label);
  _doc.text(text.toUpperCase(), MARGIN, _y);
  _y += 4.5;
}

function bodyText(
  text: string,
  indent = 0,
  fontSize = 9,
  color: [number,number,number] = C.body
) {
  if (!text) return;
  _doc.setFontSize(fontSize);
  _doc.setFont('helvetica', 'normal');
  tc(color);
  const lines = _doc.splitTextToSize(text, CONTENT_W - indent);
  for (const ln of lines) {
    need(LINE_MD + 1);
    _doc.text(ln, MARGIN + indent, _y);
    _y += LINE_MD;
  }
}

function boldText(text: string, indent = 0, fontSize = 9) {
  if (!text) return;
  _doc.setFontSize(fontSize);
  _doc.setFont('helvetica', 'bold');
  tc(C.heading);
  const lines = _doc.splitTextToSize(text, CONTENT_W - indent);
  for (const ln of lines) {
    need(LINE_MD + 1);
    _doc.text(ln, MARGIN + indent, _y);
    _y += LINE_MD;
  }
}

function kvRow(key: string, value: string, indent = 0) {
  if (!value) return;
  need(LINE_MD + 2);
  _doc.setFontSize(8.5);
  _doc.setFont('helvetica', 'bold');
  tc(C.muted);
  _doc.text(`${key}:`, MARGIN + indent, _y);
  const kw = _doc.getTextWidth(`${key}: `) + 1;
  _doc.setFont('helvetica', 'normal');
  tc(C.body);
  const lines = _doc.splitTextToSize(value, CONTENT_W - indent - kw);
  _doc.text(lines[0], MARGIN + indent + kw, _y);
  _y += LINE_MD;
  for (let i = 1; i < lines.length; i++) {
    need(LINE_MD);
    _doc.text(lines[i], MARGIN + indent + kw, _y);
    _y += LINE_MD;
  }
}

function bullets(items: string[], indent = 3) {
  if (!items?.length) return;
  _doc.setFontSize(9);
  _doc.setFont('helvetica', 'normal');
  tc(C.body);
  for (const item of items) {
    const lines = _doc.splitTextToSize(item, CONTENT_W - indent - 4);
    need(lines.length * LINE_MD + 2);
    _doc.text('\u2022', MARGIN + indent, _y);
    _doc.text(lines, MARGIN + indent + 4, _y);
    _y += lines.length * LINE_MD + 1;
  }
  sp(2);
}

function numberedList(items: string[], indent = 3) {
  if (!items?.length) return;
  _doc.setFontSize(9);
  _doc.setFont('helvetica', 'normal');
  tc(C.body);
  items.forEach((item, i) => {
    const lines = _doc.splitTextToSize(item, CONTENT_W - indent - 6);
    need(lines.length * LINE_MD + 2);
    _doc.text(`${i + 1}.`, MARGIN + indent, _y);
    _doc.text(lines, MARGIN + indent + 6, _y);
    _y += lines.length * LINE_MD + 1;
  });
  sp(2);
}

// ─── Footers ──────────────────────────────────────────────────────────────────

function drawFooters(total: number) {
  for (let i = 1; i <= total; i++) {
    _doc.setPage(i);
    const fy = PAGE_H - FOOTER_H;
    _doc.setFillColor(C.footBg[0], C.footBg[1], C.footBg[2]);
    _doc.rect(0, fy, PAGE_W, FOOTER_H, 'F');
    _doc.setDrawColor(C.rule[0], C.rule[1], C.rule[2]);
    _doc.setLineWidth(0.3);
    _doc.line(0, fy, PAGE_W, fy);
    _doc.setFontSize(7);
    _doc.setFont('helvetica', 'normal');
    tc(C.muted);
    _doc.text('ArbitrageOS  \u00b7  Sales Call Analysis', MARGIN, fy + 7.5);
    _doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, fy + 7.5, { align: 'right' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

function renderCover(a: AnalysisData) {
  whiteFill();
  _y = 44;

  // Score badge
  const score = a?.analysis?.callResults?.analysis?.overallScore || a?.metadata?.overallScore || 0;
  _doc.setFillColor(C.chipBg[0], C.chipBg[1], C.chipBg[2]);
  _doc.setDrawColor(C.chipBdr[0], C.chipBdr[1], C.chipBdr[2]);
  _doc.setLineWidth(0.4);
  _doc.circle(PAGE_W / 2, _y, 14, 'FD');
  _doc.setFontSize(18);
  _doc.setFont('helvetica', 'bold');
  tc(C.black);
  _doc.text(String(score), PAGE_W / 2, _y + 2.5, { align: 'center' });
  _doc.setFontSize(6.5);
  _doc.setFont('helvetica', 'normal');
  tc(C.muted);
  _doc.text('OVERALL SCORE', PAGE_W / 2, _y + 9, { align: 'center' });
  _y += 24;

  // Title
  _doc.setFontSize(17);
  _doc.setFont('helvetica', 'bold');
  tc(C.heading);
  const tLines = _doc.splitTextToSize(a.title, CONTENT_W - 20);
  _doc.text(tLines, PAGE_W / 2, _y, { align: 'center' });
  _y += tLines.length * LINE_LG + 5;

  // Meta
  const sentiment = a?.analysis?.callResults?.analysis?.sentiment || a?.metadata?.sentiment || 'neutral';
  const dur = a?.analysis?.callResults?.duration || a?.metadata?.duration || 0;
  const durStr = `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}`;
  const dateStr = new Date(a.createdAt).toLocaleDateString();
  _doc.setFontSize(8.5);
  _doc.setFont('helvetica', 'normal');
  tc(C.muted);
  _doc.text(`${sentiment}  \u00b7  ${durStr}  \u00b7  ${dateStr}`, PAGE_W / 2, _y, { align: 'center' });
  _y += 10;

  hRule(C.rule, 0.4);

  // Deal grade block
  const deal = a?.analysis?.dealArchitecture;
  if (deal?.dealGrade) {
    sp(4);
    _doc.setFontSize(52);
    _doc.setFont('helvetica', 'bold');
    tc([50, 50, 50]);
    _doc.text(deal.dealGrade.grade, PAGE_W / 2, _y + 16, { align: 'center' });
    _y += 22;
    _doc.setFontSize(7.5);
    _doc.setFont('helvetica', 'normal');
    tc(C.muted);
    _doc.text(
      `DEAL GRADE  \u00b7  ${deal.dealGrade.winProbability}% WIN PROBABILITY`,
      PAGE_W / 2, _y, { align: 'center' }
    );
    _y += 8;
    if (deal.executiveBrief?.oneLineSummary) {
      _doc.setFontSize(9.5);
      tc(C.body);
      const sLines = _doc.splitTextToSize(deal.executiveBrief.oneLineSummary, CONTENT_W - 10);
      _doc.text(sLines, PAGE_W / 2, _y, { align: 'center' });
      _y += sLines.length * LINE_MD + 5;
    }
  }

  // Contents hint
  sp(4);
  hRule(C.rule, 0.3);
  _doc.setFontSize(7.5);
  tc(C.muted);
  const toc = [
    'Executive Brief', 'Prospect Diagnosis', 'Solution Stack',
    'Pricing Strategy', 'Sales Performance', 'Call Structure',
    'Coaching Feedback', 'Deal Assessment', 'Follow-up Email'
  ].join('  \u00b7  ');
  const tocLines = _doc.splitTextToSize(toc, CONTENT_W);
  _doc.text(tocLines, PAGE_W / 2, _y, { align: 'center' });
}

// ── Executive Brief ────────────────────────────────────────────────────────────
function renderExecutiveBrief(deal: any) {
  if (!deal?.executiveBrief) return;
  sectionHeading('Executive Brief');
  const b = deal.executiveBrief;
  kvRow('Deal Value', b.dealValue);
  kvRow('Top Priority', b.topPriority);
  kvRow('Immediate Action', b.immediateAction);
  sp(3);
}

// ── Call Summary ───────────────────────────────────────────────────────────────
function renderCallSummary(a: AnalysisData) {
  const s = a?.analysis?.callResults?.executiveSummary;
  if (!s) return;
  sectionHeading('Call Summary');
  bodyText(s);
  sp(3);
}

// ── Key Insights ───────────────────────────────────────────────────────────────
function renderKeyInsights(a: AnalysisData) {
  const items = a?.analysis?.callResults?.analysis?.keyInsights || [];
  if (!items.length) return;
  sectionHeading('Key Insights');
  numberedList(items);
}

// ── Prospect Diagnosis ─────────────────────────────────────────────────────────
function renderProspectDiagnosis(deal: any) {
  if (!deal?.prospectDiagnosis) return;
  sectionHeading('Prospect Diagnosis');
  const pd = deal.prospectDiagnosis;
  const bp = pd.businessProfile;

  if (bp) {
    subLabel('Business Profile');
    kvRow('Industry', bp.industry);
    kvRow('Type', (bp.businessType || '').replace(/_/g, ' '));
    kvRow('Team Size', bp.estimatedTeamSize);
    kvRow('Revenue', bp.estimatedRevenue);
    if (bp.location) kvRow('Location', bp.location);
    if (bp.currentTechStack?.length) kvRow('Tech Stack', bp.currentTechStack.join(', '));
    sp(3);
  }

  if (pd.bleedingNeckProblems?.length) {
    subLabel('Pain Points');
    pd.bleedingNeckProblems.forEach((p: any, i: number) => {
      need(20);
      boldText(`${i + 1}. ${p.problem}`, 0, 8.5);
      _doc.setFontSize(8);
      _doc.setFont('helvetica', 'normal');
      tc(C.muted);
      const meta = [p.severity, p.frequency, p.estimatedCost].filter(Boolean).join('  \u00b7  ');
      if (meta) { need(LINE_SM); _doc.text(meta, MARGIN + 3, _y); _y += LINE_SM; }
      if (p.quotedEvidence) {
        const ql = _doc.splitTextToSize(`"${p.quotedEvidence}"`, CONTENT_W - 8);
        need(ql.length * LINE_SM + 1);
        _doc.text(ql, MARGIN + 5, _y);
        _y += ql.length * LINE_SM + 1;
      }
      sp(3);
    });
  }

  const fq = pd.financialQualification;
  if (fq) {
    subLabel('Financial Qualification');
    const status = fq.isQualified === 'yes' ? 'Qualified' : fq.isQualified === 'maybe' ? 'Needs Validation' : 'Not Qualified';
    kvRow('Status', status);
    if (fq.estimatedBudget) kvRow('Budget', fq.estimatedBudget);
    kvRow('Urgency', (fq.urgencyLevel || '').replace(/_/g, ' '));
    kvRow('Decision Maker', fq.decisionMakerPresent ? 'Present' : 'Not confirmed');
    bodyText(fq.qualificationReason, 0, 8.5, C.muted);
    sp(3);
    if (fq.buyingSignals?.length) { subLabel('Buying Signals'); bullets(fq.buyingSignals); }
    if (fq.redFlags?.length) { subLabel('Red Flags'); bullets(fq.redFlags); }
  }
  sp(2);
}

// ── Solution Stack ─────────────────────────────────────────────────────────────
function renderSolutionStack(deal: any) {
  if (!deal?.solutionStack) return;
  sectionHeading('Solution Stack');
  const ss = deal.solutionStack;

  const phases = [
    { data: ss.phase1QuickWin, label: 'Phase 1 — Quick Win', extra: (p: any) => p.proofOfConcept ? `Proof of concept: ${p.proofOfConcept}` : null },
    { data: ss.phase2CoreSystem, label: 'Phase 2 — Core System', extra: (p: any) => p.retainerJustification ? `Retainer rationale: ${p.retainerJustification}` : null },
    { data: ss.phase3AIWowFactor, label: 'Phase 3 — AI Wow Factor', extra: (p: any) => p.roiProjection ? `ROI projection: ${p.roiProjection}` : null },
  ];

  phases.forEach(({ data: ph, label, extra }) => {
    if (!ph) return;
    need(14);
    _doc.setFontSize(9.5);
    _doc.setFont('helvetica', 'bold');
    tc(C.heading);
    _doc.text(label, MARGIN, _y);
    _doc.setFontSize(8);
    _doc.setFont('helvetica', 'normal');
    tc(C.muted);
    _doc.text(ph.timeline || '', PAGE_W - MARGIN, _y, { align: 'right' });
    _y += LINE_MD + 1;
    bodyText(ph.phaseName, 0, 8.5, C.muted);
    sp(2);

    (ph.tools || []).forEach((tool: any) => {
      need(20);
      boldText(`${tool.toolName}`, 2, 8.5);
      _y -= 1;
      bodyText(tool.description, 4, 8, C.muted);
      const meta = [
        `${tool.estimatedSetupHours}h setup`,
        `${tool.setupComplexity} complexity`,
        tool.monthlyMaintenanceHours ? `${tool.monthlyMaintenanceHours}h/mo` : null,
        tool.replacesRole ? `replaces ${tool.replacesRole}` : null,
      ].filter(Boolean).join('  \u00b7  ');
      need(LINE_SM + 1);
      _doc.setFontSize(7.5);
      tc(C.label);
      _doc.text(meta, MARGIN + 4, _y);
      _y += LINE_SM + 3;
    });

    bodyText(`Expected outcome: ${ph.expectedOutcome}`, 0, 8.5, C.body);
    const ex = extra(ph);
    if (ex) bodyText(ex, 0, 8, C.muted);
    sp(5);
  });

  const im = ss.integrationMap;
  if (im) {
    subLabel('Integrations');
    if (im.requiredIntegrations?.length) kvRow('Required', im.requiredIntegrations.join(', '));
    if (im.niceToHaveIntegrations?.length) kvRow('Nice to Have', im.niceToHaveIntegrations.join(', '));
    if (im.potentialBlockers?.length) kvRow('Blockers', im.potentialBlockers.join(', '));
  }
  sp(2);
}

// ── Pricing Strategy ───────────────────────────────────────────────────────────
function renderPricingStrategy(deal: any) {
  if (!deal?.pricingStrategy) return;
  sectionHeading('Pricing Strategy');
  const ps = deal.pricingStrategy;

  // Three-column summary
  need(32);
  const colW = CONTENT_W / 3;
  const cols = [
    { label: 'Setup Fee', value: `$${(ps.setupFee?.recommended || 0).toLocaleString()}`, sub: `Range $${(ps.setupFee?.minimum||0).toLocaleString()} – $${(ps.setupFee?.maximum||0).toLocaleString()}` },
    { label: 'Monthly Retainer', value: `$${(ps.monthlyRetainer?.recommended || 0).toLocaleString()}/mo`, sub: `Range $${(ps.monthlyRetainer?.minimum||0).toLocaleString()} – $${(ps.monthlyRetainer?.maximum||0).toLocaleString()}` },
    { label: 'Year 1 Value', value: `$${(ps.totalDealValue?.firstYearValue || 0).toLocaleString()}`, sub: `Margin: ${ps.totalDealValue?.profitMarginEstimate || 'N/A'}` },
  ];
  cols.forEach((col, i) => {
    const cx = MARGIN + i * colW + colW / 2;
    _doc.setFontSize(7); _doc.setFont('helvetica', 'normal'); tc(C.muted);
    _doc.text(col.label.toUpperCase(), cx, _y, { align: 'center' });
    _doc.setFontSize(13); _doc.setFont('helvetica', 'bold'); tc(C.heading);
    _doc.text(col.value, cx, _y + 8, { align: 'center' });
    _doc.setFontSize(7.5); _doc.setFont('helvetica', 'normal'); tc(C.muted);
    _doc.text(col.sub, cx, _y + 14, { align: 'center' });
  });
  _y += 22;
  hRule(C.rule, 0.3);

  if (ps.setupFee?.breakdown?.length) {
    subLabel('Setup Fee Breakdown');
    ps.setupFee.breakdown.forEach((b: any) => kvRow(b.item, `$${(b.cost||0).toLocaleString()}`));
    sp(2);
  }
  if (ps.monthlyRetainer?.breakdown?.length) {
    subLabel('Monthly Retainer Breakdown');
    ps.monthlyRetainer.breakdown.forEach((b: any) => kvRow(b.item, `$${(b.monthlyCost||0).toLocaleString()}/mo`));
    if (ps.monthlyRetainer.includedHours) {
      kvRow('Included Hours', `${ps.monthlyRetainer.includedHours} hrs${ps.monthlyRetainer.overhourlyRate ? ` ($${ps.monthlyRetainer.overhourlyRate}/hr overage)` : ''}`);
    }
    sp(2);
  }
  if (ps.pitchAngle) {
    subLabel('Pitch Angle');
    boldText(ps.pitchAngle.headline);
    bodyText(ps.pitchAngle.valueFraming, 0, 8.5, C.body);
    kvRow('Comparison', ps.pitchAngle.comparisonPoint);
    kvRow('Urgency', ps.pitchAngle.urgencyHook);
    sp(2);
  }
  if (ps.contractTerms) {
    subLabel('Contract Terms');
    kvRow('Term', (ps.contractTerms.recommendedTerm || '').replace(/_/g, ' '));
    kvRow('Payment', ps.contractTerms.paymentStructure);
    if (ps.contractTerms.discountForLongerTerm) kvRow('Discount', ps.contractTerms.discountForLongerTerm);
    if (ps.contractTerms.guaranteeOffered) kvRow('Guarantee', ps.contractTerms.guaranteeOffered);
    sp(2);
  }
  if (ps.upsellOpportunities?.length) {
    subLabel('Upsell Opportunities');
    ps.upsellOpportunities.forEach((u: any) => {
      bodyText(`${u.service}  \u00b7  ${u.timing}  \u00b7  +$${(u.additionalRevenue||0).toLocaleString()}/mo`, 0, 8.5);
    });
    sp(2);
  }
}

// ── Sales Performance ──────────────────────────────────────────────────────────
function renderSalesPerformance(deal: any) {
  if (!deal?.salesPerformance) return;
  sectionHeading('Sales Performance');
  const perf = deal.salesPerformance;
  const sc = perf.callScoreCard;

  if (sc) {
    need(50);
    _doc.setFontSize(30); _doc.setFont('helvetica', 'bold'); tc(C.heading);
    _doc.text(String(sc.overallScore), PAGE_W / 2, _y + 8, { align: 'center' });
    _doc.setFontSize(7); _doc.setFont('helvetica', 'normal'); tc(C.muted);
    _doc.text('OVERALL SCORE', PAGE_W / 2, _y + 15, { align: 'center' });
    _y += 22;
    hRule(C.rule, 0.3);

    const scoreItems: [string, number][] = [
      ['Rapport Building', sc.rapportBuilding],
      ['Discovery Depth', sc.discoveryDepth],
      ['Pain Identification', sc.painIdentification],
      ['Value Presentation', sc.valuePresentation],
      ['Objection Handling', sc.objectionHandling],
      ['Closing Strength', sc.closingStrength],
    ];
    _doc.setFontSize(8.5);
    scoreItems.forEach(([label, val]) => {
      need(LINE_MD + 2);
      _doc.setFont('helvetica', 'normal'); tc(C.body);
      _doc.text(label, MARGIN, _y);
      _doc.setFont('helvetica', 'bold'); tc(C.heading);
      _doc.text(`${val}/10`, PAGE_W - MARGIN, _y, { align: 'right' });
      _y += LINE_MD + 1;
    });
    sp(4);
  }

  if (perf.greenFlags?.length) {
    subLabel('Strengths Observed');
    perf.greenFlags.forEach((f: any) => {
      need(14);
      boldText(f.observation, 0, 8.5);
      if (f.example) bodyText(f.example, 3, 8, C.muted);
      bodyText(f.impact, 3, 8, C.muted);
      sp(2);
    });
  }
  if (perf.redFlags?.length) {
    subLabel('Areas to Improve');
    perf.redFlags.forEach((f: any) => {
      need(14);
      boldText(`${f.observation}  (${f.priority})`, 0, 8.5);
      if (f.example) bodyText(f.example, 3, 8, C.muted);
      bodyText(`Fix: ${f.howToFix}`, 3, 8, C.muted);
      sp(2);
    });
  }
  if (perf.missedOpportunities?.length) {
    subLabel('Missed Opportunities');
    perf.missedOpportunities.forEach((o: any) => {
      need(16);
      boldText(o.topic, 0, 8.5);
      bodyText(o.questionToAsk, 3, 8, C.muted);
      bodyText(o.whyItMatters, 3, 8, C.label);
      sp(2);
    });
  }
  if (perf.nextCallPreparation?.length) {
    subLabel('Next Call Preparation');
    numberedList(perf.nextCallPreparation);
  }
  sp(2);
}

// ── Call Structure ─────────────────────────────────────────────────────────────
function renderCallStructure(a: AnalysisData) {
  const cs = a?.analysis?.callResults?.callStructureAnalysis;
  if (!cs) return;
  sectionHeading('Call Structure');

  const phases = [
    { data: cs.callStructure?.opening, label: 'Opening (First 20%)' },
    { data: cs.callStructure?.middle,  label: 'Discovery / Middle (20–70%)' },
    { data: cs.callStructure?.closing, label: 'Closing (Last 30%)' },
  ];
  phases.forEach(({ data, label }) => {
    if (!data) return;
    need(12);
    boldText(`${label}  —  ${data.assessment || ''}`, 0, 9);
    if (data.strengths?.length)       { subLabel('Strengths');        bullets(data.strengths); }
    if (data.weaknesses?.length)      { subLabel('Areas to Improve'); bullets(data.weaknesses); }
    if (data.recommendations?.length) { subLabel('Recommendations');  bullets(data.recommendations); }
    if (data.discoveryQuality) {
      bodyText(`Discovery quality: ${data.discoveryQuality}  \u00b7  ${data.questionCount || 0} questions asked`, 0, 8.5, C.muted);
      if (data.topicsCovered?.length) bodyText(`Topics: ${data.topicsCovered.join(', ')}`, 0, 8, C.muted);
    }
    if (data.nextStepsDefined !== undefined) {
      bodyText(`Next steps defined: ${data.nextStepsDefined ? 'Yes' : 'No'}  \u00b7  Commitment: ${data.commitmentLevel || 'Unknown'}`, 0, 8.5, C.muted);
    }
    sp(4);
  });

  if (cs.metrics) {
    subLabel('Call Quality Metrics');
    Object.entries(cs.metrics).forEach(([key, val]) => {
      const lbl = key.replace(/([A-Z])/g, ' $1').trim();
      kvRow(lbl.charAt(0).toUpperCase() + lbl.slice(1), typeof val === 'boolean' ? (val ? 'Yes' : 'No') : `${val}/10`);
    });
    sp(3);
  }
  if (cs.keyMoments?.length) {
    subLabel('Key Moments');
    cs.keyMoments.forEach((m: any) => {
      need(14);
      _doc.setFontSize(7.5); tc(C.muted); _doc.setFont('helvetica', 'normal');
      need(LINE_SM);
      _doc.text(`${m.timestamp}  \u00b7  ${m.type}${m.emotionalTag ? `  \u00b7  ${m.emotionalTag}` : ''}`, MARGIN + 2, _y);
      _y += LINE_SM;
      bodyText(m.description, 2, 8.5);
      bodyText(`Impact: ${m.impact}`, 4, 8, C.muted);
      sp(2);
    });
  }
  if (cs.missedOpportunities?.length) {
    subLabel('Missed Opportunities');
    cs.missedOpportunities.forEach((o: any) => {
      need(14);
      boldText(`${o.area}  (${o.priority})`, 0, 8.5);
      bodyText(o.description, 3, 8.5);
      bodyText(`How to fix: ${o.howToFix}`, 3, 8, C.muted);
      sp(2);
    });
  }
  sp(2);
}

// ── Coaching Feedback ──────────────────────────────────────────────────────────
function renderCoachingFeedback(a: AnalysisData) {
  const c = a?.analysis?.callResults?.coachingFeedback;
  if (!c) return;
  sectionHeading('Coaching Feedback');
  if (c.strengths?.length)          { subLabel('Strengths');             bullets(c.strengths); }
  if (c.improvements?.length)       { subLabel('Areas to Improve');      bullets(c.improvements); }
  if (c.specificSuggestions?.length){ subLabel('Specific Suggestions');  bullets(c.specificSuggestions); }
  if (c.communicationTips?.length)  { subLabel('Communication Tips');    bullets(c.communicationTips); }
  if (c.nextCallPreparation?.length){ subLabel('Next Call Preparation'); bullets(c.nextCallPreparation); }
  sp(2);
}

// ── Action Items ───────────────────────────────────────────────────────────────
function renderActionItems(a: AnalysisData) {
  const items = a?.analysis?.callResults?.analysis?.actionItems ||
                a?.analysis?.nextStepsStrategy?.immediateActions || [];
  if (!items.length) return;
  sectionHeading('Action Items');
  numberedList(items);
}

// ── Competitive Intel ──────────────────────────────────────────────────────────
function renderCompetitiveIntel(a: AnalysisData) {
  const competitors = a?.analysis?.callResults?.analysis?.salesMetrics?.competitorsMentioned ||
                      a?.analysis?.callResults?.analysis?.discoveryMetrics?.currentVendors || [];
  const objections  = a?.analysis?.callResults?.analysis?.salesMetrics?.objectionsRaised || [];
  if (!competitors.length && !objections.length) return;
  sectionHeading('Competitive Intel');
  if (competitors.length) { subLabel('Competitors / Current Vendors'); bullets(competitors); }
  if (objections.length)  { subLabel('Objections Raised');             bullets(objections); }
  sp(2);
}

// ── Deal Assessment ────────────────────────────────────────────────────────────
function renderDealAssessment(deal: any) {
  if (!deal?.dealGrade) return;
  sectionHeading('Deal Assessment');
  const dg = deal.dealGrade;

  need(16);
  _doc.setFontSize(9); _doc.setFont('helvetica', 'bold'); tc(C.heading);
  _doc.text(`Grade ${dg.grade}  \u00b7  ${dg.winProbability}% Win Probability`, MARGIN, _y);
  _y += LINE_MD + 1;
  bodyText(dg.gradeReason, 0, 8.5, C.body);
  sp(3);

  if (dg.dealStrengths?.length) { subLabel('Strengths'); bullets(dg.dealStrengths); }
  if (dg.dealRisks?.length)     { subLabel('Risks');     bullets(dg.dealRisks); }

  // Recommended next step box
  need(24);
  _doc.setFillColor(C.chipBg[0], C.chipBg[1], C.chipBg[2]);
  _doc.setDrawColor(C.chipBdr[0], C.chipBdr[1], C.chipBdr[2]);
  _doc.setLineWidth(0.3);
  const by = _y;
  _doc.roundedRect(MARGIN, by, CONTENT_W, 22, 2, 2, 'FD');
  _doc.setFontSize(7); _doc.setFont('helvetica', 'bold'); tc(C.muted);
  _doc.text('RECOMMENDED NEXT STEP', MARGIN + 4, by + 6);
  _doc.setFontSize(8.5); _doc.setFont('helvetica', 'normal'); tc(C.heading);
  const nsLines = _doc.splitTextToSize(dg.recommendedNextStep || 'N/A', CONTENT_W - 10);
  _doc.text(nsLines, MARGIN + 4, by + 13);
  _y = by + 26;
  sp(2);
}

// ── Follow-up Email ────────────────────────────────────────────────────────────
function renderFollowUpEmail(a: AnalysisData) {
  const email = a?.analysis?.callResults?.followUpEmail;
  if (!email) return;
  newPage();
  sectionHeading('Follow-up Email');
  _doc.setFontSize(8.5); _doc.setFont('helvetica', 'normal'); tc(C.body);
  email.split('\n').forEach((line: string) => {
    const wrapped = _doc.splitTextToSize(line || ' ', CONTENT_W);
    wrapped.forEach((wl: string) => {
      need(LINE_MD + 1);
      _doc.text(wl, MARGIN, _y);
      _y += LINE_MD;
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

export async function downloadAnalysisPDF(analysis: AnalysisData): Promise<void> {
  _doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  _page = 1;
  _y    = MARGIN;

  // Page 1 — white
  whiteFill();
  renderCover(analysis);

  // Content pages
  newPage();
  const deal = analysis?.analysis?.dealArchitecture;

  renderExecutiveBrief(deal);
  renderCallSummary(analysis);
  renderKeyInsights(analysis);
  renderProspectDiagnosis(deal);
  renderSolutionStack(deal);
  renderPricingStrategy(deal);
  renderSalesPerformance(deal);
  renderCallStructure(analysis);
  renderCoachingFeedback(analysis);
  renderActionItems(analysis);
  renderCompetitiveIntel(analysis);
  renderDealAssessment(deal);
  renderFollowUpEmail(analysis);

  // Footers
  const total = (_doc as any).internal.getNumberOfPages();
  drawFooters(total);

  // Save
  const safeName = (analysis.title || 'call-analysis')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .slice(0, 40);
  _doc.save(`${safeName}-${new Date().toISOString().split('T')[0]}.pdf`);
}