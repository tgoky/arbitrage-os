// Create: app/api/pricing-calculator/export-simple/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { format, calculationData } = await req.json();
    
    let content = '';
    let filename = '';
    const clientName = calculationData?.clientName || 'client';

    switch (format) {
      case 'proposal':
        content = generateSimpleProposal(calculationData);
        filename = `pricing-proposal-${clientName}.html`;
        break;
      case 'presentation':
        content = generateSimplePresentation(calculationData);
        filename = `pricing-presentation-${clientName}.html`;
        break;
      case 'contract':
        content = generateSimpleContract(calculationData);
        filename = `contract-template-${clientName}.html`;
        break;
      default:
        content = generateSimpleComplete(calculationData);
        filename = `complete-pricing-package-${clientName}.html`;
    }
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Simple Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to export' },
      { status: 500 }
    );
  }
}

function generateSimpleProposal(data: any) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Pricing Proposal - ${data?.clientName || 'Client'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
        .highlight { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Pricing Proposal</h1>
        <h2>${data?.clientName || 'Valued Client'}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <h2> Executive Summary</h2>
    <p>We're excited to present this ArbitrageOS automation solution that will deliver substantial returns on your investment.</p>

    <div class="highlight">
        <h3>Key Benefits</h3>
        <div class="metrics">
            <div class="metric">
                <h4>Annual Savings</h4>
                <div style="font-size: 1.5em; color: #28a745;">$${data?.annualSavings?.toLocaleString() || '100,000'}</div>
            </div>
            <div class="metric">
                <h4>Monthly Investment</h4>
                <div style="font-size: 1.5em; color: #007bff;">$${data?.recommendedRetainer?.toLocaleString() || '5,000'}</div>
            </div>
            <div class="metric">
                <h4>Monthly Net Savings</h4>
                <div style="font-size: 1.5em; color: #28a745;">$${data?.netSavings?.toLocaleString() || '3,333'}</div>
            </div>
            <div class="metric">
                <h4>ROI</h4>
                <div style="font-size: 1.5em; color: #28a745;">${data?.roiPercentage?.toFixed(0) || '300'}%</div>
            </div>
        </div>
    </div>

    <h2> Our Solution</h2>
    <p>Our comprehensive AI automation package includes:</p>
    <ul>
        <li>Process analysis and optimization</li>
        <li>Custom AI solution development</li>
        <li>Implementation and deployment</li>
        <li>Staff training and documentation</li>
        <li>90-day support and optimization</li>
    </ul>

    <h2>⚡ Next Steps</h2>
    <p><strong>This proposal is valid for 30 days.</strong> We're ready to begin immediately upon agreement and can deliver results within 8-12 weeks.</p>
    
    <div style="background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-top: 30px;">
        <h3>Ready to transform your business?</h3>
        <p>Contact us to schedule your implementation consultation.</p>
    </div>
</body>
</html>`;
}

function generateSimplePresentation(data: any) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Pricing Presentation - ${data?.clientName || 'Client'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .slide { background: white; margin: 20px 0; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-height: 300px; }
        .slide-number { background: #007bff; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
        h1 { color: #007bff; }
        .big-number { font-size: 3em; color: #28a745; font-weight: bold; text-align: center; }
    </style>
</head>
<body>
    <div class="slide">
        <div class="slide-number">Slide 1</div>
        <h1> The Opportunity</h1>
        <p style="font-size: 1.3em;">Your company is currently missing out on significant savings through manual processes that could be automated.</p>
        <div class="big-number">$${data?.annualSavings?.toLocaleString() || '100,000'}</div>
        <p style="text-align: center; font-size: 1.2em;">Annual savings potential</p>
    </div>

    <div class="slide">
        <div class="slide-number">Slide 2</div>
        <h1> Our Solution</h1>
        <ul style="font-size: 1.2em; line-height: 2;">
            <li>AI-powered process automation</li>
            <li>Custom workflow optimization</li>
            <li>Intelligent data processing</li>
            <li>Predictive analytics integration</li>
        </ul>
    </div>

    <div class="slide">
        <div class="slide-number">Slide 3</div>
        <h1>Investment vs Returns</h1>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px;">
            <div style="text-align: center;">
                <h3>Monthly Investment</h3>
                <div class="big-number" style="color: #007bff;">${data?.recommendedRetainer?.toLocaleString() || '5,000'}</div>
            </div>
            <div style="text-align: center;">
                <h3>Monthly Savings</h3>
                <div class="big-number">${((data?.recommendedRetainer || 5000) + (data?.netSavings || 3333))?.toLocaleString()}</div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <h3>Your ROI</h3>
            <div class="big-number">${data?.roiPercentage?.toFixed(0) || '300'}%</div>
        </div>
    </div>

    <div class="slide">
        <div class="slide-number">Slide 4</div>
        <h1>Why Choose Us?</h1>
        <ul style="font-size: 1.2em; line-height: 2;">
            <li>Proven track record with ${data?.roiPercentage?.toFixed(0) || '300'}% ROI delivery</li>
            <li>Industry expertise in ${data?.industry || 'your sector'}</li>
            <li>90-day performance guarantee</li>
            <li>Comprehensive training and support</li>
        </ul>
    </div>

    <div class="slide">
        <div class="slide-number">Slide 5</div>
        <h1>🎯 Next Steps</h1>
        <div style="font-size: 1.3em; line-height: 2;">
            <p><strong>1.</strong> Schedule implementation consultation</p>
            <p><strong>2.</strong> Sign agreement and begin in 2 weeks</p>
            <p><strong>3.</strong> Start seeing results in 30-60 days</p>
            <p><strong>4.</strong> Achieve full ROI within 90 days</p>
        </div>
        <div style="background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-top: 30px;">
            <h3>Ready to get started?</h3>
        </div>
    </div>
</body>
</html>`;
}

function generateSimpleContract(data: any) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Service Agreement - ${data?.clientName || 'Client'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .terms { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .signature-area { margin-top: 50px; border-top: 2px solid #007bff; padding-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>  Services Agreement</h1>
        <h2>${data?.clientName || 'Client Name'}</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h3> Project Overview</h3>
        <div class="terms">
            <p><strong>Client:</strong> ${data?.clientName || 'Client Name'}</p>
            <p><strong>Project:</strong> ${data?.projectName || 'AI Automation Implementation'}</p>
            <p><strong>Industry:</strong> ${data?.industry || 'Technology'}</p>
            <p><strong>Monthly Investment:</strong> ${data?.recommendedRetainer?.toLocaleString() || '5,000'}</p>
            <p><strong>Expected Monthly Savings:</strong> ${((data?.recommendedRetainer || 5000) + (data?.netSavings || 3333))?.toLocaleString()}</p>
            <p><strong>Expected ROI:</strong> ${data?.roiPercentage?.toFixed(0) || '300'}%</p>
        </div>
    </div>

    <div class="section">
        <h3> Scope of Services</h3>
        <p>Service Provider agrees to deliver comprehensive AI automation services including:</p>
        <ul>
            <li>Process analysis and optimization assessment</li>
            <li>Custom AI solution development and implementation</li>
            <li>System integration and deployment</li>
            <li>Staff training and documentation</li>
            <li>90-day support and optimization period</li>
        </ul>
    </div>

    <div class="section">
        <h3> Payment Terms</h3>
        <div class="terms">
            <p><strong>Monthly Retainer:</strong> ${data?.recommendedRetainer?.toLocaleString() || '5,000'}</p>
            <p><strong>Payment Schedule:</strong> Monthly payments due within 15 days of invoice</p>
            <p><strong>First Payment:</strong> Due upon contract execution</p>
            <p><strong>Late Fee:</strong> 1.5% per month on overdue amounts</p>
        </div>
    </div>

    <div class="section">
        <h3>Performance Guarantee</h3>
        <div class="terms">
            <p>Service Provider guarantees that documented savings will exceed ${Math.floor((data?.recommendedRetainer || 5000) * 1.2)?.toLocaleString()} monthly within 90 days of implementation completion.</p>
            <p>If guarantee is not met, Client receives full refund of payments made during the guarantee period.</p>
        </div>
    </div>

    <div class="section">
        <h3>Timeline & Deliverables</h3>
        <div class="terms">
            <p><strong>Phase 1:</strong> Discovery & Analysis (2 weeks)</p>
            <p><strong>Phase 2:</strong> Development & Testing (6-8 weeks)</p>
            <p><strong>Phase 3:</strong> Deployment & Training (2 weeks)</p>
            <p><strong>Phase 4:</strong> Support & Optimization (90 days)</p>
        </div>
    </div>

    <div class="section">
        <h3>Terms & Conditions</h3>
        <ul>
            <li><strong>Contract Duration:</strong> 12 months from start date</li>
            <li><strong>Termination:</strong> Either party may terminate with 30 days written notice</li>
            <li><strong>Confidentiality:</strong> Both parties agree to maintain confidentiality of proprietary information</li>
            <li><strong>Intellectual Property:</strong> Client retains ownership of custom solutions developed</li>
            <li><strong>Liability:</strong> Service Provider liability limited to amounts paid under this agreement</li>
        </ul>
    </div>

    <div class="signature-area">
        <h3>Agreement Signatures</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
            <div>
                <h4>Client Representative:</h4>
                <p>_________________________________</p>
                <p>Print Name: _______________________</p>
                <p>Title: _____________________________</p>
                <p>Date: _____________________________</p>
            </div>
            <div>
                <h4>Service Provider:</h4>
                <p>_________________________________</p>
                <p>Print Name: _______________________</p>
                <p>Title: _____________________________</p>
                <p>Date: _____________________________</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

function generateSimpleComplete(data: any) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Complete Pricing Package - ${data?.clientName || 'Client'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 40px; text-align: center; border-radius: 15px; margin-bottom: 40px; }
        .section { margin: 40px 0; padding: 30px; border: 2px solid #e9ecef; border-radius: 10px; }
        .highlight { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .big-number { font-size: 2em; font-weight: bold; color: #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Complete Pricing Strategy Package</h1>
        <h2>${data?.clientName || 'Valued Client'}</h2>
        <p><strong>Project:</strong> ${data?.projectName || 'Services Implementation'}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="highlight">
            <p style="font-size: 1.2em; margin-bottom: 20px;">This AI automation investment will deliver substantial returns while transforming your business operations.</p>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>Annual Savings</h4>
                    <div class="big-number">${data?.annualSavings?.toLocaleString() || '100,000'}</div>
                </div>
                <div class="metric-card">
                    <h4>Monthly Investment</h4>
                    <div class="big-number" style="color: #007bff;">${data?.recommendedRetainer?.toLocaleString() || '5,000'}</div>
                </div>
                <div class="metric-card">
                    <h4>Monthly Net Benefit</h4>
                    <div class="big-number">${data?.netSavings?.toLocaleString() || '3,333'}</div>
                </div>
                <div class="metric-card">
                    <h4>ROI Percentage</h4>
                    <div class="big-number">${data?.roiPercentage?.toFixed(0) || '300'}%</div>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Our Solution</h2>
        <p>We'll implement a comprehensive AI automation system that addresses your specific business challenges:</p>
        <ul style="font-size: 1.1em; line-height: 1.8;">
            <li><strong>Process Optimization:</strong> Identify and eliminate bottlenecks in your current workflows</li>
            <li><strong>Custom AI Development:</strong> Build tailored solutions for your unique requirements</li>
            <li><strong>Data Integration:</strong> Connect and optimize your existing systems</li>
            <li><strong>Predictive Analytics:</strong> Implement forecasting and decision-support tools</li>
            <li><strong>Training & Support:</strong> Ensure your team can effectively use the new systems</li>
        </ul>
    </div>

    <div class="section">
        <h2>Implementation Timeline</h2>
        <table>
            <thead>
                <tr><th>Phase</th><th>Duration</th><th>Key Deliverables</th><th>Investment</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Discovery</strong></td>
                    <td>2 weeks</td>
                    <td>Process audit, ROI analysis, Implementation roadmap</td>
                    <td>${Math.floor((data?.recommendedRetainer || 5000) * 0.3)?.toLocaleString()}</td>
                </tr>
                <tr>
                    <td><strong>Development</strong></td>
                    <td>6-8 weeks</td>
                    <td>Custom AI solution, System integration, Testing</td>
                    <td>${Math.floor((data?.recommendedRetainer || 5000) * 2.5)?.toLocaleString()}</td>
                </tr>
                <tr>
                    <td><strong>Deployment</strong></td>
                    <td>2 weeks</td>
                    <td>System launch, Staff training, Documentation</td>
                    <td>${Math.floor((data?.recommendedRetainer || 5000) * 0.5)?.toLocaleString()}</td>
                </tr>
                <tr>
                    <td><strong>Optimization</strong></td>
                    <td>90 days</td>
                    <td>Performance tuning, Support, ROI validation</td>
                    <td>${Math.floor((data?.recommendedRetainer || 5000) * 3)?.toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Risk Mitigation & Guarantees</h2>
        <div class="highlight">
            <h4>Performance Guarantee</h4>
            <p>We guarantee that your documented savings will exceed ${Math.floor(((data?.recommendedRetainer || 5000) + (data?.netSavings || 3333)) * 0.8)?.toLocaleString()} monthly within 90 days of implementation.</p>
            <p><strong>If we don't meet this guarantee, you receive a full refund of all payments made.</strong></p>
        </div>
        <ul>
            <li>Phased implementation reduces deployment risk</li>
            <li>Comprehensive testing before go-live</li>
            <li>90-day support period ensures success</li>
            <li>Proven methodology with ${data?.roiPercentage?.toFixed(0) || '300'}% average ROI</li>
        </ul>
    </div>

    <div class="section">
        <h2>Common Questions & Objections</h2>
        <div style="margin: 20px 0;">
            <h4 style="color: #dc3545;">Q: "This investment seems high for our budget"</h4>
            <p><strong>A:</strong> I understand budget concerns. However, consider that you'll save ${((data?.recommendedRetainer || 5000) + (data?.netSavings || 3333))?.toLocaleString()} monthly for a ${data?.recommendedRetainer?.toLocaleString() || '5,000'} investment - that's ${data?.netSavings?.toLocaleString() || '3,333'} in net profit every month. The solution pays for itself immediately.</p>
        </div>
        <div style="margin: 20px 0;">
            <h4 style="color: #dc3545;">Q: "How do we know this will actually work?"</h4>
            <p><strong>A:</strong> Our track record speaks for itself - we've delivered similar results for companies in your industry. Plus, our performance guarantee means you only pay if we deliver the promised savings.</p>
        </div>
        <div style="margin: 20px 0;">
            <h4 style="color: #dc3545;">Q: "We need time to think about it"</h4>
            <p><strong>A:</strong> That's completely reasonable. Just remember that every month of delay costs you ${((data?.recommendedRetainer || 5000) + (data?.netSavings || 3333))?.toLocaleString()} in unrealized savings. Would a smaller pilot project help reduce the decision risk?</p>
        </div>
    </div>

    <div class="section" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white;">
        <h2>Ready to Transform Your Business?</h2>
        <div style="text-align: center; font-size: 1.2em;">
            <p><strong>Monthly Investment:</strong> ${data?.recommendedRetainer?.toLocaleString() || '5,000'}</p>
            <p><strong>Monthly Returns:</strong> ${((data?.recommendedRetainer || 5000) + (data?.netSavings || 3333))?.toLocaleString()}</p>
            <p><strong>Net Monthly Profit:</strong> ${data?.netSavings?.toLocaleString() || '3,333'}</p>
            <div style="margin: 30px 0; padding: 20px; background: rgba(255,255,255,0.2); border-radius: 10px;">
                <h3>This proposal is valid for 30 days</h3>
                <p>Contact us today to begin your transformation!</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}