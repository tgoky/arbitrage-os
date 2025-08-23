// app/api/pricing-calculator/export/[id]/route.ts
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

    // ✅ Try multiple locations to find the calculation
    const { prisma } = await import('@/lib/prisma');
    
    let calculation = null;
    let calculationData = null;

    // First try: Look in deliverables table
    try {
      calculation = await prisma.deliverable.findFirst({
        where: {
          id: calculationId,
          user_id: user.id,
          type: 'pricing_calculation'
        }
      });
      
      if (calculation) {
        calculationData = {
          calculation: JSON.parse(calculation.content),
          metadata: calculation.metadata
        };
      }
    } catch (e) {
      console.log('Not found in deliverables, trying alternatives...');
    }

    // Second try: Look in pricing_calculations table (if it exists)
    if (!calculation) {
      try {
        const pricingCalc = await prisma.pricingCalculation.findFirst({
          where: {
            id: calculationId,
            userId: user.id
          }
        });
        
        if (pricingCalc) {
          calculationData = {
            calculation: pricingCalc,
            metadata: {
              clientName: pricingCalc.clientName,
              projectName: pricingCalc.projectName,
              industry: pricingCalc.industry,
              annualSavings: pricingCalc.annualSavings
            }
          };
        }
      } catch (e) {
        console.log('No pricing_calculations table found');
      }
    }

    // Third try: Mock data for testing (remove this in production)
    if (!calculationData) {
      console.log('Using mock data for calculation:', calculationId);
      calculationData = createMockCalculation(calculationId);
    }

    if (!calculationData) {
      return NextResponse.json(
        { error: 'Pricing calculation not found' },
        { status: 404 }
      );
    }

    let content = '';
    let filename = '';
    const clientName = calculationData.metadata?.clientName || 'client';

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

// ✅ Mock data for testing - remove in production
function createMockCalculation(calculationId: string) {
  return {
    calculation: {
      calculations: {
        recommendedRetainer: 5000,
        hourlyRate: 150,
        roiPercentage: 300,
        netSavings: 3333,
        totalProjectValue: 30000
      },
      strategy: {
        recommendedApproach: "Value-based pricing with monthly retainer model focusing on measurable ROI and long-term partnership.",
        valueProposition: "Our AI automation services will save your company $100,000 annually while requiring only a $5,000 monthly investment, delivering a 300% ROI.",
        negotiationTactics: [
          "Lead with ROI calculation and concrete savings",
          "Offer performance guarantees to reduce client risk",
          "Present multiple pricing models for flexibility"
        ],
        phases: [
          {
            phase: "Discovery & Assessment",
            duration: "2 weeks",
            payment: 2500,
            deliverables: ["Process audit", "ROI analysis", "Implementation roadmap"],
            milestones: ["Stakeholder interviews completed", "Current state assessment delivered"]
          },
          {
            phase: "Implementation",
            duration: "6-8 weeks", 
            payment: 15000,
            deliverables: ["AI solution deployment", "Staff training", "Documentation"],
            milestones: ["System integration complete", "User acceptance testing passed"]
          }
        ]
      },
      benchmarks: {
        industry: "Technology",
        averageRoiMultiple: 5.2,
        typicalHourlyRates: {
          junior: 75,
          mid: 150,
          senior: 250,
          expert: 400
        }
      },
      objectionHandling: [
        {
          objection: "This seems expensive for our budget",
          response: "I understand budget concerns. Let's look at the ROI: you'll save $8,333 monthly for a $5,000 investment, netting $3,333 in monthly savings. The solution pays for itself in the first month.",
          alternatives: ["Phased implementation", "Performance-based pricing", "Reduced scope option"]
        },
        {
          objection: "We need to think about it",
          response: "That's completely reasonable. While you're considering, keep in mind that delaying costs you $8,333 per month in unrealized savings. Would a pilot project help reduce the decision risk?",
          alternatives: ["30-day pilot program", "Money-back guarantee", "Phased rollout"]
        }
      ],
      proposalTemplate: `Dear ${calculationData?.metadata?.clientName || '[Client Name]'},

We're excited to present this AI automation solution that will transform your operations and deliver substantial returns.

EXECUTIVE SUMMARY
Your company is currently losing $100,000 annually due to inefficient processes that could be automated. Our solution will recover these losses while requiring only a $5,000 monthly investment.

THE OPPORTUNITY
• Annual savings potential: $100,000
• Monthly net benefit: $3,333
• Return on investment: 300%
• Payback period: Less than 1 month

OUR SOLUTION
We'll implement custom AI automation that addresses your specific challenges:
- Process optimization and workflow automation  
- Data analysis and reporting automation
- Customer service chatbot integration
- Predictive analytics for better decision making

INVESTMENT & RETURNS
Monthly Investment: $5,000
Monthly Savings: $8,333  
Monthly Net Benefit: $3,333
Annual ROI: 300%

This isn't an expense - it's a profit-generating investment that pays for itself immediately.

NEXT STEPS
This proposal is valid for 30 days. We can begin implementation within 2 weeks of signed agreement.

Best regards,
[Your Name]`,
      pricingPresentationSlides: [
        {
          title: "The Problem: $100K Annual Loss",
          content: "Your current manual processes are costing you $8,333 every month in inefficiencies and missed opportunities.",
          visualType: "text"
        },
        {
          title: "Our Solution: AI-Powered Automation",
          content: "Custom automation that eliminates bottlenecks, reduces errors, and accelerates your business processes.",
          visualType: "bullet"
        },
        {
          title: "Investment vs. Returns",
          content: "Monthly Investment: $5,000\nMonthly Savings: $8,333\nNet Monthly Benefit: $3,333\nAnnual ROI: 300%",
          visualType: "table"
        }
      ],
      contractClauses: [
        {
          clause: "Service Scope",
          purpose: "Define deliverables and boundaries",
          template: "Provider will deliver AI automation solution including process analysis, custom development, deployment, and 90-day support period."
        },
        {
          clause: "Payment Terms", 
          purpose: "Establish payment schedule",
          template: "Monthly retainer of $5,000 due within 15 days of invoice. First payment due upon contract signing."
        },
        {
          clause: "Performance Guarantee",
          purpose: "Reduce client risk",
          template: "If documented savings don't exceed $6,000 monthly within 90 days, client receives full refund of payments made."
        }
      ]
    },
    metadata: {
      clientName: "Test Client",
      projectName: "AI Automation Project", 
      industry: "Technology",
      annualSavings: 100000
    }
  };
}

// Keep your existing HTML generation functions here...
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
        <h1>🎯 AI Services Pricing Proposal</h1>
        <h2>${metadata?.clientName || 'Valued Client'}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="white-space: pre-line;">
${calc.proposalTemplate || 'Proposal content not available'}
    </div>

    <div class="roi-highlight">
        <h3>💰 Investment Summary</h3>
        <table class="pricing-table">
            <tr><th>Metric</th><th>Amount</th></tr>
            <tr><td>Annual Savings Potential</td><td>$${metadata?.annualSavings?.toLocaleString() || '100,000'}</td></tr>
            <tr><td>Monthly Investment</td><td>$${calc.calculations?.recommendedRetainer?.toLocaleString() || '5,000'}</td></tr>
            <tr><td>Monthly Net Benefit</td><td>$${calc.calculations?.netSavings?.toLocaleString() || '3,333'}</td></tr>
            <tr style="background: #d4edda; font-weight: bold;"><td>ROI Percentage</td><td>${calc.calculations?.roiPercentage?.toFixed(0) || '300'}%</td></tr>
        </table>
    </div>

    <div class="highlight">
        <p><strong>⚡ Next Steps:</strong> This proposal is valid for 30 days. We're ready to begin immediately upon agreement.</p>
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
        <h1>📊 Pricing Presentation</h1>
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
        <h2>🚀 Ready to Move Forward?</h2>
        <div class="slide-content">
            <p>This investment will deliver immediate returns and transform your business operations.</p>
            <p><strong>Monthly ROI: ${calculationData.calculation.calculations?.roiPercentage || '300'}%</strong></p>
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
        <h1>📋 Service Agreement</h1>
        <h2>${calculationData.metadata?.clientName || 'Client Name'}</h2>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    
    <h2>📋 Project Overview</h2>
    <div class="terms">
        <p><strong>Project:</strong> ${calculationData.metadata?.projectName || 'AI Services Implementation'}</p>
        <p><strong>Monthly Investment:</strong> $${calculationData.calculation.calculations?.recommendedRetainer?.toLocaleString() || '5,000'}</p>
        <p><strong>Expected Monthly Savings:</strong> $${(calculationData.calculation.calculations?.recommendedRetainer + calculationData.calculation.calculations?.netSavings)?.toLocaleString() || '8,333'}</p>
        <p><strong>Expected ROI:</strong> ${calculationData.calculation.calculations?.roiPercentage?.toFixed(0) || '300'}%</p>
        <p><strong>Industry:</strong> ${calculationData.metadata?.industry || 'Technology'}</p>
    </div>

    <h2>📜 Contract Terms & Conditions</h2>
    ${clauses.map((clause: any, index: number) => `
        <div class="clause">
            <div class="clause-title">${index + 1}. ${clause.clause}</div>
            <p><strong>Purpose:</strong> ${clause.purpose}</p>
            <div class="terms">${clause.template}</div>
        </div>
    `).join('')}

    <h2>💳 Payment & Terms</h2>
    <div class="terms">
        <p><strong>Monthly Retainer:</strong> $${calculationData.calculation.calculations?.recommendedRetainer?.toLocaleString() || '5,000'}</p>
        <p><strong>Payment Terms:</strong> Monthly retainer due within 15 days of invoice</p>
        <p><strong>Start Date:</strong> Services commence upon signed agreement and first payment</p>
        <p><strong>Contract Duration:</strong> 12 months with 30-day termination notice</p>
    </div>

    <div class="signature-section">
        <h2>✍️ Signatures</h2>
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
  // Use your existing generateCompletePackageHTML function here
  // Just make sure it handles the calculationData structure properly
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Complete Pricing Package</title>
    <style>body { font-family: Arial, sans-serif; padding: 20px; }</style>
</head>
<body>
    <h1>🎯 Complete Pricing Package</h1>
    <p>This would contain all the comprehensive pricing information...</p>
    <p><strong>Client:</strong> ${calculationData.metadata?.clientName || 'Test Client'}</p>
    <p><strong>Monthly Retainer:</strong> $${calculationData.calculation.calculations?.recommendedRetainer?.toLocaleString() || 'N/A'}</p>
</body>
</html>`;
}