// app/api/niche-research/export/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NicheResearcherService } from '../../../../../services/nicheResearcher.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.id;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'html';

    const nicheService = new NicheResearcherService();
    const report = await nicheService.getNicheReport(user.id, reportId);

    if (!report) {
      return NextResponse.json(
        { error: 'Niche research report not found' },
        { status: 404 }
      );
    }

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: report
      });
    }

    // Generate HTML for PDF export
    const htmlContent = generateNicheReportHTML(report);
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="niche-research-report-${new Date().toISOString().split('T')[0]}.html"`
      }
    });

  } catch (error) {
    console.error('Niche Report Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to export niche research report' },
      { status: 500 }
    );
  }
}

// Fixed TypeScript issues with proper typing
function generateNicheReportHTML(report: any): string {
  const reportData = report.report;
  const metadata = report.metadata;
  
  // Type-safe helpers
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString();
  const safeJoin = (arr: string[] | undefined, separator = ', ') => arr?.join(separator) || 'Not specified';
  const safeCurrency = (amount: number | undefined) => amount ? `$${amount.toLocaleString()}` : 'Not specified';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Niche Research Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
        .section { margin: 30px 0; }
        .niche-card { border: 1px solid #e1e5e9; padding: 20px; margin: 20px 0; border-radius: 8px; background: #f8f9fa; }
        .match-score { background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 10px; }
        .high-score { background: #28a745; }
        .medium-score { background: #ffc107; color: #212529; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { background: white; border: 1px solid #dee2e6; padding: 15px; border-radius: 6px; }
        .risk-high { border-left: 4px solid #dc3545; }
        .risk-medium { border-left: 4px solid #ffc107; }
        .risk-low { border-left: 4px solid #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
        th { background: #f8f9fa; font-weight: bold; }
        .action-item { background: #e7f3ff; border-left: 4px solid #007bff; padding: 10px; margin: 10px 0; }
        .financial-projection { background: #f0f8f0; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .page-break { page-break-before: always; }
        .tag { background: #e9ecef; padding: 4px 8px; border-radius: 4px; margin: 2px; display: inline-block; }
        .tag-blue { background: #d1ecf1; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Personal Niche Research Report</h1>
        <p>Generated on ${formatDate(metadata?.generatedAt || Date.now())}</p>
        <p><strong>Skills Focus:</strong> ${safeJoin(metadata?.skills)}</p>
        <p><strong>Time Commitment:</strong> ${metadata?.timeCommitment || 'Not specified'} hours/week</p>
    </div>

    <div class="section">
        <h2>📋 Executive Summary</h2>
        <p>${reportData?.executiveSummary || 'No executive summary available.'}</p>
    </div>

    <div class="section page-break">
        <h2>🚀 Recommended Niche Opportunities</h2>
        ${reportData?.recommendedNiches?.map((niche: any, index: number) => `
            <div class="niche-card">
                <div class="match-score ${(niche?.matchScore || 0) >= 85 ? 'high-score' : 'medium-score'}">
                    ${niche?.matchScore || 0}% Match
                </div>
                <h3>${niche?.name || 'Unnamed Niche'}</h3>
                <p><strong>Category:</strong> ${niche?.category || 'Not specified'}</p>
                
                <h4>Why This Fits You:</h4>
                <ul>
                    ${niche?.reasons?.map((reason: string) => `<li>${reason}</li>`).join('') || '<li>No specific reasons provided</li>'}
                </ul>
                
                <div class="grid">
                    <div class="metric-card">
                        <h4>📊 Market Overview</h4>
                        <p><strong>Size:</strong> ${niche?.marketSize || 'Not specified'}</p>
                        <p><strong>Growth:</strong> ${niche?.growthRate || 'Not specified'}</p>
                        <p><strong>Competition:</strong> ${niche?.competition?.level || 'Not specified'} ${niche?.competition?.score ? `(${niche.competition.score}/5)` : ''}</p>
                        <p>${niche?.competition?.description || ''}</p>
                    </div>
                    
                    <div class="metric-card">
                        <h4>💰 Investment Required</h4>
                        <p><strong>Range:</strong> ${safeCurrency(niche?.startupCosts?.min)} - ${safeCurrency(niche?.startupCosts?.max)}</p>
                        <p><strong>Time to Market:</strong> ${niche?.timeToMarket || 'Not specified'}</p>
                        <div>
                            <strong>Cost Breakdown:</strong>
                            ${niche?.startupCosts?.breakdown?.map((cost: any) => `
                                <div style="margin: 5px 0;">• ${cost?.category || 'Category'}: ${safeCurrency(cost?.amount)} - ${cost?.description || ''}</div>
                            `).join('') || '<div>No breakdown available</div>'}
                        </div>
                    </div>
                </div>
                
                <h4>🎯 Target Customers:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${niche?.targetCustomers?.map((customer: string) => `<span class="tag">${customer}</span>`).join('') || '<span class="tag">Not specified</span>'}
                </div>
                
                <h4>💡 Monetization Models:</h4>
                <ul>
                    ${niche?.monetizationModels?.map((model: string) => `<li>${model}</li>`).join('') || '<li>No monetization models specified</li>'}
                </ul>
                
                <h4>📈 Key Success Metrics:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${niche?.keyMetrics?.map((metric: string) => `<span class="tag tag-blue">${metric}</span>`).join('') || '<span class="tag tag-blue">Not specified</span>'}
                </div>
                
                <div class="action-item">
                    <h4>🚀 Immediate Next Steps:</h4>
                    <ol>
                        ${niche?.nextSteps?.map((step: string) => `<li>${step}</li>`).join('') || '<li>No next steps provided</li>'}
                    </ol>
                </div>
            </div>
        `).join('') || '<div class="niche-card">No recommended niches available</div>'}
    </div>

    <div class="section page-break">
        <h2>📊 Market Analysis</h2>
        
        <h3>🔥 Key Trends</h3>
        <table>
            <thead>
                <tr>
                    <th>Trend</th>
                    <th>Relevance</th>
                    <th>Impact</th>
                    <th>Timeline</th>
                </tr>
            </thead>
            <tbody>
                ${reportData?.marketAnalysis?.trends?.map((trend: any) => `
                    <tr>
                        <td>${trend?.trend || 'Not specified'}</td>
                        <td><span style="color: ${getRelevanceColor(trend?.relevance)}">${trend?.relevance || 'Not specified'}</span></td>
                        <td>${trend?.impact || 'Not specified'}</td>
                        <td>${trend?.timeline || 'Not specified'}</td>
                    </tr>
                `).join('') || '<tr><td colspan="4">No trends data available</td></tr>'}
            </tbody>
        </table>
        
        <h3>🔍 Market Gaps & Opportunities</h3>
        ${reportData?.marketAnalysis?.gaps?.map((gap: any) => `
            <div class="metric-card">
                <h4>${gap?.gap || 'Unnamed Gap'}</h4>
                <p><strong>Severity:</strong> <span style="color: ${getSeverityColor(gap?.severity)}">${gap?.severity || 'Not specified'}</span></p>
                <p><strong>Opportunity:</strong> ${gap?.opportunity || 'Not specified'}</p>
            </div>
        `).join('') || '<div class="metric-card">No market gaps data available</div>'}
    </div>

    <div class="section">
        <h2>👤 Personal Fit Analysis</h2>
        
        <div class="grid">
            <div class="metric-card">
                <h3>💪 Your Strengths</h3>
                <ul>
                    ${reportData?.personalFit?.strengths?.map((strength: string) => `<li>${strength}</li>`).join('') || '<li>No strengths listed</li>'}
                </ul>
            </div>
            
            <div class="metric-card">
                <h3>📚 Development Areas</h3>
                <ul>
                    ${reportData?.personalFit?.skillGaps?.map((gap: string) => `<li>${gap}</li>`).join('') || '<li>No development areas listed</li>'}
                </ul>
            </div>
            
            <div class="metric-card">
                <h3>🤝 Network Advantages</h3>
                <ul>
                    ${reportData?.personalFit?.networkAdvantages?.map((advantage: string) => `<li>${advantage}</li>`).join('') || '<li>No network advantages listed</li>'}
                </ul>
            </div>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <div style="background: #e7f3ff; padding: 20px; border-radius: 10px; display: inline-block;">
                <h3>🎯 Overall Confidence Score</h3>
                <div style="font-size: 48px; font-weight: bold; color: #007bff;">${reportData?.personalFit?.confidenceScore || 0}%</div>
            </div>
        </div>
    </div>

    <div class="section page-break">
        <h2>💰 Financial Projections</h2>
        ${reportData?.financialProjections?.map((projection: any) => `
            <div class="financial-projection">
                <h3>${projection?.niche || 'Unnamed Niche'} - ${projection?.timeline || 'No timeline'}</h3>
                <div class="grid">
                    <div>
                        <h4>Revenue Scenarios</h4>
                        <p>🎯 <strong>Realistic:</strong> ${safeCurrency(projection?.revenue?.realistic)}</p>
                        <p>🔥 <strong>Optimistic:</strong> ${safeCurrency(projection?.revenue?.optimistic)}</p>
                        <p>⚠️ <strong>Conservative:</strong> ${safeCurrency(projection?.revenue?.conservative)}</p>
                    </div>
                    <div>
                        <h4>Investment & Returns</h4>
                        <p><strong>Expected Costs:</strong> ${safeCurrency(projection?.costs)}</p>
                        <p><strong>Net Profit:</strong> ${safeCurrency(projection?.profitability)}</p>
                        <p><strong>ROI:</strong> ${projection?.costs && projection?.profitability ? Math.round(((projection.profitability) / (projection.costs)) * 100) : 0}%</p>
                    </div>
                </div>
            </div>
        `).join('') || '<div class="financial-projection">No financial projections available</div>'}
    </div>

    <div class="section">
        <h2>⚠️ Risk Assessment</h2>
        ${reportData?.riskAssessment?.map((risk: any) => `
            <div class="metric-card risk-${(risk?.impact || '').toLowerCase()}">
                <h4>${risk?.risk || 'Unnamed Risk'}</h4>
                <p><strong>Probability:</strong> ${risk?.probability || 'Not specified'} | <strong>Impact:</strong> ${risk?.impact || 'Not specified'}</p>
                <p><strong>Mitigation:</strong> ${risk?.mitigation || 'No mitigation strategy provided'}</p>
            </div>
        `).join('') || '<div class="metric-card">No risk assessment available</div>'}
    </div>

    <div class="section page-break">
        <h2>📋 Action Plan</h2>
        
        <h3>⚡ Immediate Steps (This Week)</h3>
        <ol>
            ${reportData?.actionPlan?.immediateSteps?.map((step: string) => `<li class="action-item">${step}</li>`).join('') || '<li class="action-item">No immediate steps provided</li>'}
        </ol>
        
        <h3>🎯 Short-term Goals (1-3 Months)</h3>
        ${reportData?.actionPlan?.shortTerm?.map((item: any) => `
            <div class="action-item">
                <h4>${item?.action || 'Unnamed Action'}</h4>
                <p><strong>Timeline:</strong> ${item?.timeline || 'Not specified'}</p>
                <p><strong>Resources Needed:</strong> ${safeJoin(item?.resources)}</p>
            </div>
        `).join('') || '<div class="action-item">No short-term goals provided</div>'}
        
        <h3>🚀 Long-term Objectives (6-12 Months)</h3>
        ${reportData?.actionPlan?.longTerm?.map((item: any) => `
            <div class="action-item">
                <h4>${item?.goal || 'Unnamed Goal'}</h4>
                <p><strong>Target:</strong> ${item?.timeline || 'Not specified'}</p>
                <p><strong>Key Milestones:</strong></p>
                <ul>
                    ${item?.milestones?.map((milestone: string) => `<li>${milestone}</li>`).join('') || '<li>No milestones specified</li>'}
                </ul>
            </div>
        `).join('') || '<div class="action-item">No long-term objectives provided</div>'}
    </div>

    <div class="section">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px;">
            <h2>🎯 Your Journey Starts Now</h2>
            <p>This report is your roadmap to finding and building a successful niche business that aligns with your unique strengths and interests.</p>
            <p><strong>Remember:</strong> The best niche is one where your passion meets market demand and your existing skills give you an advantage.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Helper functions for color coding
function getRelevanceColor(relevance: string | undefined): string {
  switch (relevance) {
    case 'High': return '#28a745';
    case 'Medium': return '#ffc107';
    case 'Low': return '#6c757d';
    default: return '#6c757d';
  }
}

function getSeverityColor(severity: string | undefined): string {
  switch (severity) {
    case 'High': return '#dc3545';
    case 'Medium': return '#ffc107';
    case 'Low': return '#28a745';
    default: return '#6c757d';
  }
}