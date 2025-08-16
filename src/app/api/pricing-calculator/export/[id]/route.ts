
// app/api/pricing-calculator/export/[id]/route.ts - WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PricingCalculatorService } from '@/services/pricingCalculator.service';
import { rateLimit } from '@/lib/rateLimit'; // ✅ Add rate limiting
import { logUsage } from '@/lib/usage'; // ✅ Add usage logging

const RATE_LIMITS = {
  EXPORT: {
    limit: 20,
    window: 3600 // 1 hour
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for exports
    const rateLimitResult = await rateLimit(
      `pricing_export:${user.id}`,
      RATE_LIMITS.EXPORT.limit,
      RATE_LIMITS.EXPORT.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Export rate limit exceeded. You can export 20 calculations per hour.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const calculationId = params.id;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'proposal';

    // ✅ FETCH FROM DELIVERABLES
    const { prisma } = await import('@/lib/prisma');
    const calculation = await prisma.deliverable.findFirst({
      where: {
        id: calculationId,
        user_id: user.id,
        type: 'pricing_calculation'
      }
    });

    if (!calculation) {
      return NextResponse.json(
        { error: 'Pricing calculation not found' },
        { status: 404 }
      );
    }

    const calculationData = {
      calculation: JSON.parse(calculation.content),
      metadata: calculation.metadata
    };

    let content = '';
    let filename = '';

    switch (format) {
      case 'proposal':
        content = generateProposalHTML(calculationData);
        filename = `pricing-proposal-${(calculation.metadata as any)?.clientName || 'client'}.html`;
        break;
      case 'presentation':
        content = generatePresentationHTML(calculationData);
        filename = `pricing-presentation-${(calculation.metadata as any)?.clientName || 'client'}.html`;
        break;
      case 'contract':
        content = generateContractHTML(calculationData);
        filename = `contract-template-${(calculation.metadata as any)?.clientName || 'client'}.html`;
        break;
      default:
        content = generateCompletePackageHTML(calculationData);
        filename = `complete-pricing-package-${(calculation.metadata as any)?.clientName || 'client'}.html`;
    }

    // ✅ LOG USAGE for export
    await logUsage({
      userId: user.id,
      feature: 'pricing_export',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        calculationId,
        format,
        filename,
        clientName: (calculation.metadata as any)?.clientName
      }
    });
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
      }
    });

  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to export pricing calculation' },
      { status: 500 }
    );
  }
}

function generateProposalHTML(calculation: any): string {
  const calc = calculation.calculation;
  const metadata = calculation.metadata;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Pricing Proposal - ${(metadata as any)?.clientName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
        .roi-highlight { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .pricing-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .pricing-table th, .pricing-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .pricing-table th { background: #f8f9fa; }
        .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Services Pricing Proposal</h1>
        <h2>${(metadata as any)?.clientName || 'Valued Client'}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="white-space: pre-line;">
${calc.proposalTemplate || 'Proposal content not available'}
    </div>

    <div class="roi-highlight">
        <h3>Investment Summary</h3>
        <table class="pricing-table">
            <tr>
                <th>Metric</th>
                <th>Amount</th>
            </tr>
            <tr>
                <td>Annual Savings Potential</td>
      <td>$${(metadata as any)?.annualSavings?.toLocaleString() || 'N/A'}</td>
            </tr>
            <tr>
                <td>Monthly Investment</td>
                <td>$${calc.calculations?.recommendedRetainer?.toLocaleString() || 'N/A'}</td>
            </tr>
            <tr>
                <td>Monthly Net Benefit</td>
                <td>$${calc.calculations?.netSavings?.toLocaleString() || 'N/A'}</td>
            </tr>
            <tr>
                <td style="background: #d4edda; font-weight: bold;">ROI Percentage</td>
                <td style="background: #d4edda; font-weight: bold;">${calc.calculations?.roiPercentage?.toFixed(0) || 'N/A'}%</td>
            </tr>
        </table>
    </div>

    <div class="highlight">
        <p><strong>Next Steps:</strong> This proposal is valid for 30 days. We're ready to begin immediately upon agreement.</p>
    </div>
</body>
</html>
  `;
}

function generatePresentationHTML(calculation: any): string {
  const slides = calculation.calculation.pricingPresentationSlides || [];
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Pricing Presentation - ${(calculation.metadata as any)?.clientName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .slide { border: 1px solid #ddd; margin: 20px 0; padding: 30px; min-height: 400px; border-radius: 8px; }
        .slide-number { background: #007bff; color: white; padding: 5px 15px; border-radius: 15px; display: inline-block; margin-bottom: 15px; }
        .slide h2 { color: #333; margin-top: 0; }
    </style>
</head>
<body>
    <h1>Pricing Presentation - ${(calculation.metadata as any)?.clientName}</h1>
     ${slides.map((slide: any, index: number) => `
        <div class="slide">
            <div class="slide-number">Slide ${index + 1}</div>
            <h2>${slide.title}</h2>
            <div>${slide.content}</div>
        </div>
    `).join('')}
</body>
</html>
  `;
}

function generateContractHTML(calculation: any): string {
  const clauses = calculation.calculation.contractClauses || [];
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Contract Template - ${(calculation.metadata as any)?.clientName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .clause { border-left: 4px solid #007bff; padding-left: 15px; margin: 20px 0; }
        .clause-title { font-weight: bold; color: #007bff; }
        .terms { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
   <h1>Service Agreement - ${(calculation.metadata as any)?.clientName}</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
    
    <h2>Project Details</h2>
    <div class="terms">
         <p><strong>Project:</strong> ${(calculation.metadata as any)?.projectName || 'AI Services Project'}</p>
        <p><strong>Monthly Investment:</strong> $${calculation.calculation.calculations?.recommendedRetainer?.toLocaleString() || 'N/A'}</p>
        <p><strong>Expected ROI:</strong> ${calculation.calculation.calculations?.roiPercentage?.toFixed(0) || 'N/A'}%</p>
       <p><strong>Duration:</strong> ${(calculation.metadata as any)?.projectDuration || 6} months</p>
    </div>

    <h2>Contract Clauses</h2>
    ${clauses.map((clause: any, index: number) => `
        <div class="clause">
            <div class="clause-title">${index + 1}. ${clause.clause}</div>
            <p><strong>Purpose:</strong> ${clause.purpose}</p>
            <div class="terms">${clause.template}</div>
        </div>
    `).join('')}

    <h2>Payment Terms</h2>
    <div class="terms">
        <p>Monthly retainer of $${calculation.calculation.calculations?.recommendedRetainer?.toLocaleString() || 'N/A'} due within 15 days of invoice.</p>
        <p>Services will commence upon signed agreement and first payment.</p>
    </div>

    <div style="margin-top: 40px; border-top: 2px solid #007bff; padding-top: 20px;">
        <p><strong>Client Signature:</strong> _________________________ <strong>Date:</strong> _________</p>
        <p><strong>Service Provider:</strong> _________________________ <strong>Date:</strong> _________</p>
    </div>
</body>
</html>`;
}

function generateCompletePackageHTML(calculation: any): string {
  const calc = calculation.calculation;
  const metadata = calculation.metadata;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Complete Pricing Package - ${(metadata as any)?.clientName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
        .section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .metric { background: #e7f3ff; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .pricing-option { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
        .recommendation { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f8f9fa; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Complete Pricing Strategy Package</h1>
       <h2>${(metadata as any)?.clientName || 'Client Name'}</h2>
     <p><strong>Project:</strong> ${(metadata as any)?.projectName || 'AI Services Project'}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>💰 Pricing Summary</h2>
<div class="metric"><strong>Annual Client Savings:</strong> $${(metadata as any)?.annualSavings?.toLocaleString() || 'N/A'}</div>
        <div class="metric"><strong>Recommended Monthly Retainer:</strong> $${calc.calculations?.recommendedRetainer?.toLocaleString() || 'N/A'}</div>
        <div class="metric"><strong>Client Monthly Net Benefit:</strong> $${calc.calculations?.netSavings?.toLocaleString() || 'N/A'}</div>
        <div class="metric"><strong>Client ROI:</strong> ${calc.calculations?.roiPercentage?.toFixed(0) || 'N/A'}%</div>
        <div class="metric"><strong>Effective Hourly Rate:</strong> $${calc.calculations?.hourlyRate?.toFixed(0) || 'N/A'}</div>
    </div>

    <div class="section">
        <h2>📊 Pricing Options</h2>
     ${calc.calculations?.pricingOptions?.map((option: any, index: number) => `
            <div class="pricing-option">
                <h4>${option.model.charAt(0).toUpperCase() + option.model.slice(1)} Model - $${option.price?.toLocaleString() || 'N/A'}</h4>
                <p>${option.description}</p>
                <p><strong>Pros:</strong> ${option.pros?.join(', ') || 'N/A'}</p>
                <p><strong>Cons:</strong> ${option.cons?.join(', ') || 'N/A'}</p>
                <div style="background: ${option.recommendationScore > 80 ? '#d4edda' : '#fff3cd'}; padding: 5px; border-radius: 3px;">
                    <strong>Recommendation Score:</strong> ${option.recommendationScore || 'N/A'}/100
                </div>
            </div>
        `).join('') || '<p>Pricing options not available</p>'}
    </div>

    <div class="section page-break">
        <h2>🎯 Strategy & Approach</h2>
        <div class="recommendation">
            <h4>Recommended Approach:</h4>
            <p>${calc.strategy?.recommendedApproach || 'Strategy not available'}</p>
        </div>
        <h4>Value Proposition:</h4>
        <p>${calc.strategy?.valueProposition || 'Value proposition not available'}</p>
        <h4>Negotiation Tactics:</h4>
        <ul>
          ${calc.strategy?.negotiationTactics?.map((tactic: any) => `<li>${tactic}</li>`).join('') || '<li>Tactics not available</li>'}
        </ul>
    </div>

    <div class="section">
        <h2>📈 Industry Benchmarks</h2>
        <table>
            <tr>
                <th>Level</th>
                <th>Hourly Rate</th>
            </tr>
            <tr><td>Junior</td><td>$${calc.benchmarks?.typicalHourlyRates?.junior || 'N/A'}</td></tr>
            <tr><td>Mid-Level</td><td>$${calc.benchmarks?.typicalHourlyRates?.mid || 'N/A'}</td></tr>
            <tr><td>Senior</td><td>$${calc.benchmarks?.typicalHourlyRates?.senior || 'N/A'}</td></tr>
            <tr><td>Expert</td><td>$${calc.benchmarks?.typicalHourlyRates?.expert || 'N/A'}</td></tr>
        </table>
        <p><strong>Industry:</strong> ${calc.benchmarks?.industry || 'N/A'}</p>
        <p><strong>Average ROI Multiple:</strong> ${calc.benchmarks?.averageRoiMultiple || 'N/A'}x</p>
    </div>

    <div class="section page-break">
        <h2>🛡️ Objection Handling</h2>
        ${calc.objectionHandling?.map((obj: any, index: number) => `
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h4>Objection: "${obj.objection}"</h4>
                <p><strong>Response:</strong> ${obj.response}</p>
                <p><strong>Alternatives:</strong> ${obj.alternatives?.join(', ') || 'None'}</p>
            </div>
        `).join('') || '<p>Objection handling not available</p>'}
    </div>

    <div class="section">
        <h2>📋 Implementation Phases</h2>
        ${calc.strategy?.phases?.map((phase: any, index: number) => `
            <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h4>Phase ${index + 1}: ${phase.phase}</h4>
                <p><strong>Duration:</strong> ${phase.duration}</p>
                <p><strong>Payment:</strong> $${phase.payment?.toLocaleString() || 'N/A'}</p>
                <p><strong>Deliverables:</strong> ${phase.deliverables?.join(', ') || 'N/A'}</p>
                <p><strong>Milestones:</strong> ${phase.milestones?.join(', ') || 'N/A'}</p>
            </div>
        `).join('') || '<p>Implementation phases not available</p>'}
    </div>

    <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 20px; text-align: center; border-radius: 10px; margin-top: 40px;">
        <h2>🚀 Ready to Move Forward?</h2>
        <p>This comprehensive pricing package provides everything needed for successful client conversations and project implementation.</p>
    </div>
</body>
</html>`;
}