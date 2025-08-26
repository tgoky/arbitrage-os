// app/api/pricing-calculator/export/[id]/route.ts - PRODUCTION VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

    const calculationId = params.id;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'complete';

    // Fetch pricing calculation from deliverables table
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
      metadata: calculation.metadata as any
    };

    let content = '';
    let filename = '';
    const clientName = (calculationData.metadata?.clientName as string) || 'client';

    switch (format) {
      case 'proposal':
        content = generateProposalHTML(calculationData);
        filename = `pricing-proposal-${clientName}.html`;
        break;
      case 'presentation':
        content = generatePresentationHTML(calculationData);
        filename = `pricing-presentation-${clientName}.html`;
        break;
      case 'contract':
        content = generateContractHTML(calculationData);
        filename = `contract-template-${clientName}.html`;
        break;
      default:
        content = generateCompletePackageHTML(calculationData);
        filename = `complete-pricing-package-${clientName}.html`;
    }
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}"`
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

function generateProposalHTML(calculationData: any): string {
  const calc = calculationData.calculation;
  const metadata = calculationData.metadata;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Pricing Proposal - ${metadata?.clientName || 'Client'}</title>
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
        <h1>Pricing Proposal</h1>
        <h2>${metadata?.clientName || 'Valued Client'}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="white-space: pre-line;">
${calc.proposalTemplate || 'Proposal content not available'}
    </div>

    <div class="roi-highlight">
        <h3>Investment Summary</h3>
        <table class="pricing-table">
            <tr><th>Metric</th><th>Amount</th></tr>
            <tr><td>Annual Savings Potential</td><td>$${metadata?.annualSavings?.toLocaleString() || 'TBD'}</td></tr>
            <tr><td>Monthly Investment</td><td>$${calc.calculations?.recommendedRetainer?.toLocaleString() || 'TBD'}</td></tr>
            <tr><td>Monthly Net Benefit</td><td>$${calc.calculations?.netSavings?.toLocaleString() || 'TBD'}</td></tr>
            <tr style="background: #d4edda; font-weight: bold;"><td>ROI Percentage</td><td>${calc.calculations?.roiPercentage?.toFixed(0) || 'TBD'}%</td></tr>
        </table>
    </div>

    <div class="highlight">
        <p><strong>Next Steps:</strong> This proposal is valid for 30 days. We're ready to begin immediately upon agreement.</p>
    </div>
</body>
</html>
  `;
}

function generatePresentationHTML(calculationData: any): string {
  const slides = calculationData.calculation.pricingPresentationSlides || [];
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Pricing Presentation - ${calculationData.metadata?.clientName || 'Client'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .slide { background: white; border: 2px solid #007bff; margin: 20px 0; padding: 30px; min-height: 400px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .slide-number { background: #007bff; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
        .slide h2 { color: #333; margin-top: 0; font-size: 1.8em; }
        .slide-content { font-size: 1.2em; line-height: 1.6; }
    </style>
</head>
<body>
    <div style="text-align: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 10px;">
        <h1>Pricing Presentation</h1>
        <h2>${calculationData.metadata?.clientName || 'Client Name'}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    ${slides.map((slide: any, index: number) => `
        <div class="slide">
            <div class="slide-number">Slide ${index + 1}</div>
            <h2>${slide.title}</h2>
            <div class="slide-content">${slide.content.replace(/\n/g, '<br>')}</div>
        </div>
    `).join('')}
    
    <div class="slide">
        <div class="slide-number">Final Slide</div>
        <h2>Ready to Move Forward?</h2>
        <div class="slide-content">
            <p>This investment will deliver immediate returns and transform your business operations.</p>
            <p><strong>Monthly ROI: ${calculationData.calculation.calculations?.roiPercentage || 'TBD'}%</strong></p>
            <p>Let's schedule a follow-up meeting to discuss implementation!</p>
        </div>
    </div>
</body>
</html>
  `;
}

function generateContractHTML(calculationData: any): string {
  const clauses = calculationData.calculation.contractClauses || [];
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Service Agreement - ${calculationData.metadata?.clientName || 'Client'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .clause { border-left: 4px solid #007bff; padding-left: 15px; margin: 25px 0; }
        .clause-title { font-weight: bold; color: #007bff; font-size: 1.1em; }
        .terms { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .signature-section { margin-top: 50px; border-top: 2px solid #007bff; padding-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Service Agreement</h1>
        <h2>${calculationData.metadata?.clientName || 'Client Name'}</h2>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    
    <h2>Project Overview</h2>
    <div class="terms">
        <p><strong>Project:</strong> ${calculationData.metadata?.projectName || 'AI Services Implementation'}</p>
        <p><strong>Monthly Investment:</strong> $${calculationData.calculation.calculations?.recommendedRetainer?.toLocaleString() || 'TBD'}</p>
        <p><strong>Expected Monthly Savings:</strong> $${(calculationData.calculation.calculations?.recommendedRetainer + calculationData.calculation.calculations?.netSavings)?.toLocaleString() || 'TBD'}</p>
        <p><strong>Expected ROI:</strong> ${calculationData.calculation.calculations?.roiPercentage?.toFixed(0) || 'TBD'}%</p>
        <p><strong>Industry:</strong> ${calculationData.metadata?.industry || 'Technology'}</p>
    </div>

    <h2>Contract Terms & Conditions</h2>
    ${clauses.map((clause: any, index: number) => `
        <div class="clause">
            <div class="clause-title">${index + 1}. ${clause.clause}</div>
            <p><strong>Purpose:</strong> ${clause.purpose}</p>
            <div class="terms">${clause.template}</div>
        </div>
    `).join('')}

    <h2>Payment & Terms</h2>
    <div class="terms">
        <p><strong>Monthly Retainer:</strong> $${calculationData.calculation.calculations?.recommendedRetainer?.toLocaleString() || 'TBD'}</p>
        <p><strong>Payment Terms:</strong> Monthly retainer due within 15 days of invoice</p>
        <p><strong>Start Date:</strong> Services commence upon signed agreement and first payment</p>
        <p><strong>Contract Duration:</strong> 12 months with 30-day termination notice</p>
    </div>

    <div class="signature-section">
        <h2>Signatures</h2>
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div style="width: 45%;">
                <p><strong>Client Representative:</strong></p>
                <p>_________________________________</p>
                <p>Name: ___________________________</p>
                <p>Title: ____________________________</p>
                <p>Date: ____________________________</p>
            </div>
            <div style="width: 45%;">
                <p><strong>Service Provider:</strong></p>
                <p>_________________________________</p>
                <p>Name: ___________________________</p>
                <p>Title: ____________________________</p>
                <p>Date: ____________________________</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

function generateCompletePackageHTML(calculationData: any): string {
  const calc = calculationData.calculation;
  const metadata = calculationData.metadata;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Complete Pricing Package - ${metadata?.clientName || 'Client'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 40px; text-align: center; border-radius: 12px; margin-bottom: 40px; }
        .section { background: white; margin: 30px 0; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .pricing-card { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; }
        .pricing-card.recommended { border-color: #28a745; background: #f8fff8; }
        .price { font-size: 2em; font-weight: bold; color: #007bff; margin: 10px 0; }
        .roi-highlight { background: #d4edda; border-left: 5px solid #28a745; padding: 20px; margin: 20px 0; }
        .strategy-section { background: #fff3cd; border-left: 5px solid #ffc107; padding: 20px; margin: 20px 0; }
        .benchmark-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .benchmark-table th, .benchmark-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .benchmark-table th { background: #007bff; color: white; }
        h1, h2, h3 { color: #2c3e50; }
        .phase { border-left: 4px solid #17a2b8; padding-left: 20px; margin: 20px 0; }
        .objection-item { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Complete Pricing Package</h1>
        <h2>${metadata?.clientName || 'Valued Client'}</h2>
        <p>Comprehensive Pricing Strategy & Implementation Guide</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="roi-highlight">
            <h3>Key Metrics</h3>
            <div class="pricing-grid">
                <div class="pricing-card">
                    <h4>Annual Savings</h4>
                    <div class="price">$${metadata?.annualSavings?.toLocaleString() || 'TBD'}</div>
                </div>
                <div class="pricing-card recommended">
                    <h4>Monthly Investment</h4>
                    <div class="price">$${calc.calculations?.recommendedRetainer?.toLocaleString() || 'TBD'}</div>
                </div>
                <div class="pricing-card">
                    <h4>Monthly Net Benefit</h4>
                    <div class="price">$${calc.calculations?.netSavings?.toLocaleString() || 'TBD'}</div>
                </div>
                <div class="pricing-card">
                    <h4>ROI Percentage</h4>
                    <div class="price">${calc.calculations?.roiPercentage?.toFixed(0) || 'TBD'}%</div>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Pricing Strategy</h2>
        <div class="strategy-section">
            <h3>Recommended Approach</h3>
            <p>${calc.strategy?.recommendedApproach || 'Strategy not available'}</p>
            
            <h3>Value Proposition</h3>
            <p>${calc.strategy?.valueProposition || 'Value proposition not available'}</p>
            
            <h3>Negotiation Tactics</h3>
            <ul>
                ${calc.strategy?.negotiationTactics?.map((tactic: string) => `<li>${tactic}</li>`).join('') || '<li>Not available</li>'}
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>Implementation Phases</h2>
        ${calc.strategy?.phases?.map((phase: any) => `
            <div class="phase">
                <h3>${phase.phase}</h3>
                <p><strong>Duration:</strong> ${phase.duration}</p>
                <p><strong>Payment:</strong> $${phase.payment?.toLocaleString() || 'TBD'}</p>
                <p><strong>Deliverables:</strong></p>
                <ul>
                    ${phase.deliverables?.map((deliverable: string) => `<li>${deliverable}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
                <p><strong>Milestones:</strong></p>
                <ul>
                    ${phase.milestones?.map((milestone: string) => `<li>${milestone}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
            </div>
        `).join('') || '<p>Phases not available</p>'}
    </div>

    <div class="section">
        <h2>Industry Benchmarks</h2>
        <table class="benchmark-table">
            <tr><th>Experience Level</th><th>Typical Hourly Rate</th></tr>
            <tr><td>Junior</td><td>$${calc.benchmarks?.typicalHourlyRates?.junior || 75}</td></tr>
            <tr><td>Mid-Level</td><td>$${calc.benchmarks?.typicalHourlyRates?.mid || 125}</td></tr>
            <tr><td>Senior</td><td>$${calc.benchmarks?.typicalHourlyRates?.senior || 200}</td></tr>
            <tr><td>Expert</td><td>$${calc.benchmarks?.typicalHourlyRates?.expert || 350}</td></tr>
        </table>
        
        <p><strong>Industry:</strong> ${calc.benchmarks?.industry || 'Not specified'}</p>
        <p><strong>Average ROI Multiple:</strong> ${calc.benchmarks?.averageRoiMultiple || 'Not available'}x</p>
    </div>

    <div class="section">
        <h2>Objection Handling</h2>
        ${calc.objectionHandling?.map((objection: any) => `
            <div class="objection-item">
                <h4>Objection: "${objection.objection}"</h4>
                <p><strong>Response:</strong> ${objection.response}</p>
                <p><strong>Alternatives:</strong></p>
                <ul>
                    ${objection.alternatives?.map((alt: string) => `<li>${alt}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
            </div>
        `).join('') || '<p>Objection handling not available</p>'}
    </div>

    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Review this comprehensive pricing package</li>
            <li>Schedule a follow-up meeting to discuss any questions</li>
            <li>Finalize contract terms and implementation timeline</li>
            <li>Begin project kickoff within 2 weeks of agreement</li>
        </ol>
        
        <div class="roi-highlight">
            <p><strong>This proposal is valid for 30 days.</strong> We're ready to begin immediately upon agreement and deliver the promised ROI.</p>
        </div>
    </div>
</body>
</html>
  `;
}