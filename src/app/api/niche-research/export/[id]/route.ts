// app/api/niche-research/export/[id]/route.ts - UPDATED FOR NEW STRUCTURE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NicheResearcherService } from '@/services/nicheResearcher.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { GeneratedNicheReport, NicheReportMetadata } from '@/types/nicheResearcher';

//   SAME IMPROVED AUTH FUNCTION
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: () => undefined,
            },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('⚠️ Token auth error:', tokenError);
      }
    }
    
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;
              
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded);
                  return cookie.value;
                } catch (e) {
                  return undefined;
                }
              }
              
              if (cookie.value.startsWith('{') || cookie.value.startsWith('[')) {
                try {
                  JSON.parse(cookie.value);
                  return cookie.value;
                } catch (e) {
                  return undefined;
                }
              }
              
              return cookie.value;
            } catch (error) {
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      return { user, error: null };
    }
    
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        return { user, error: null };
      }
    } catch (helperError) {
      console.warn('⚠️ Route handler failed:', helperError);
    }
    
    return { user: null, error: error || new Error('All auth methods failed') };
    
  } catch (error) {
    console.error('  Auth error:', error);
    return { user: null, error };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📥 Export Niche Report called for ID:', params.id);
    
    //   AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    //   RATE LIMITING for exports - 10 per hour
    const rateLimitResult = await rateLimit(
      `niche_research_export:${user.id}`,
      10,
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Export rate limit exceeded. You can export 10 reports per hour.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const reportId = params.id;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'html';

    //   USE NEW SERVICE METHOD
    const nicheService = new NicheResearcherService();
    const report = await nicheService.getNicheReport(user.id, reportId);

    if (!report) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Niche research report not found' 
        },
        { status: 404 }
      );
    }

    //   LOG USAGE
    try {
      await logUsage({
        userId: user.id,
        feature: 'niche_research_export',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          reportId,
          format,
          reportType: 'niche_research',
          nicheName: report.report?.nicheOverview?.name
        }
      });
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: report,
        meta: {
          remaining: rateLimitResult.remaining
        }
      });
    }

    //   GENERATE HTML FOR EXPORT
    const htmlContent = generateNicheReportHTML(report.report, report.metadata);
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="niche-research-report-${new Date().toISOString().split('T')[0]}.html"`
      }
    });

  } catch (error) {
    console.error('  Export Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to export niche research report' 
      },
      { status: 500 }
    );
  }
}

//   UPDATED HTML GENERATOR FOR NEW STRUCTURE
function generateNicheReportHTML(report: GeneratedNicheReport, metadata: NicheReportMetadata): string {
  // Helper functions
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString();
  const safeString = (value: any) => value || 'Not specified';
  const safeArray = (arr: any[]) => Array.isArray(arr) ? arr : [];
  
  const getScoreColor = (score: string) => {
    switch (score) {
      case 'High': return '#28a745';
      case 'Medium': return '#ffc107';
      case 'Low': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'growing': return '#28a745';
      case 'plateauing': return '#ffc107';
      case 'declining': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeString(report.nicheOverview?.name)} - Niche Research Report</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f8f9fa; 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px; 
            text-align: center; 
            border-radius: 15px; 
            margin-bottom: 30px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; font-weight: 700; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        .section { 
            background: white; 
            margin: 25px 0; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .section h2 { 
            color: #667eea; 
            border-bottom: 3px solid #667eea; 
            padding-bottom: 15px; 
            margin-bottom: 25px;
            font-size: 1.8em;
        }
        .section h3 { color: #495057; margin: 20px 0 15px; font-size: 1.4em; }
        .section h4 { color: #6c757d; margin: 15px 0 10px; font-size: 1.2em; }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
        }
        .card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 10px; 
            border-left: 5px solid #667eea;
        }
        .score-badge { 
            display: inline-block;
            padding: 8px 16px; 
            border-radius: 25px; 
            color: white; 
            font-weight: bold; 
            font-size: 0.9em;
            margin: 5px;
        }
        .trend-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            color: white;
            font-weight: bold;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        .metric { 
            background: white; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #e9ecef;
            margin: 10px 0;
        }
        .metric strong { color: #495057; }
        .competitor { 
            background: #e3f2fd; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px; 
            border-left: 4px solid #2196f3;
        }
        .pain-point { 
            background: #fff3e0; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px; 
            border-left: 4px solid #ff9800;
        }
        .risk-factor { 
            background: #ffebee; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px; 
            border-left: 4px solid #f44336;
        }
        .entry-offer { 
            background: #e8f5e8; 
            padding: 20px; 
            margin: 15px 0; 
            border-radius: 10px; 
            border-left: 5px solid #4caf50;
        }
        .scorecard { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin: 20px 0; 
        }
        .scorecard-item { 
            text-align: center; 
            padding: 20px; 
            background: white; 
            border-radius: 10px; 
            border: 2px solid #e9ecef;
        }
        .scorecard-item h4 { margin-bottom: 10px; color: #495057; }
        .highlight { 
            background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
            text-align: center;
        }
        .page-break { page-break-before: always; }
        .footer { 
            background: #343a40; 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px; 
            margin-top: 40px; 
        }
        ul, ol { padding-left: 25px; margin: 15px 0; }
        li { margin: 8px 0; }
        .text-center { text-align: center; }
        .mb-20 { margin-bottom: 20px; }
        .font-bold { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 ${safeString(report.nicheOverview?.name)}</h1>
        <p><strong>Niche Research Report</strong></p>
        <p>Generated: ${formatDate(metadata.generatedAt)}</p>
        <div style="margin-top: 15px;">
            <span class="score-badge" style="background: #28a745;">
                ${metadata.primaryObjective || 'Strategy'}
            </span>
            <span class="score-badge" style="background: #17a2b8;">
                ${metadata.marketType || 'Market'}
            </span>
            <span class="score-badge" style="background: #ffc107; color: #212529;">
                ${metadata.budget || 'Budget'}
            </span>
        </div>
    </div>

    <!-- Niche Overview -->
    <div class="section">
        <h2>1. 🔍 Niche Overview</h2>
        <div class="highlight">
            <h3>${safeString(report.nicheOverview?.name)}</h3>
            <p style="font-size: 1.1em; margin: 15px 0;">
                ${safeString(report.nicheOverview?.summary)}
            </p>
        </div>
        <div class="card">
            <h4>💡 Why This Niche Fits Your Profile</h4>
            <p>${safeString(report.nicheOverview?.whyItFits)}</p>
        </div>
    </div>

    <!-- Market Demand -->
    <div class="section">
        <h2>2. 📈 Market Demand Snapshot</h2>
        <div class="grid">
            <div class="metric">
                <strong>Market Size:</strong><br>
                <span style="font-size: 1.3em; color: #28a745;">
                    ${safeString(report.marketDemand?.marketSize)}
                </span>
            </div>
            <div class="metric">
                <strong>Market Trend:</strong><br>
                <span class="trend-badge" style="background: ${getTrendColor(report.marketDemand?.trend)}">
                    ${safeString(report.marketDemand?.trend)}
                </span>
            </div>
            <div class="metric">
                <strong>Willingness to Pay:</strong><br>
                <span style="font-size: 1.1em; color: #495057;">
                    ${safeString(report.marketDemand?.willingnessToPay)}
                </span>
            </div>
        </div>
    </div>

    <!-- Customer Pain Points -->
    <div class="section">
        <h2>3. 🎯 Customer Pain Points</h2>
        ${safeArray(report.painPoints).map((point, index) => `
            <div class="pain-point">
                <h4>${point.problem || 'Unnamed Problem'}</h4>
                <span class="score-badge" style="background: ${getScoreColor(point.intensity)}">
                    ${point.intensity || 'Unknown'} Intensity
                </span>
            </div>
        `).join('')}
        ${safeArray(report.painPoints).length === 0 ? '<p>No pain points data available</p>' : ''}
    </div>

    <!-- Competitive Landscape -->
    <div class="section page-break">
        <h2>4. 🏢 Competitive Landscape</h2>
        <div class="metric mb-20">
            <strong>Barrier to Entry:</strong>
            <span class="score-badge" style="background: ${getScoreColor(report.competitiveLandscape?.barrierToEntry)}">
                ${safeString(report.competitiveLandscape?.barrierToEntry)}
            </span>
        </div>
        
        <h3>🏆 Key Competitors</h3>
        ${safeArray(report.competitiveLandscape?.competitors).map(competitor => `
            <div class="competitor">
                <h4>${competitor.name || 'Unnamed Competitor'}</h4>
                <p>${competitor.description || 'No description available'}</p>
            </div>
        `).join('')}
        ${safeArray(report.competitiveLandscape?.competitors).length === 0 ? '<p>No competitor data available</p>' : ''}
        
        <div class="card">
            <h4>📊 Gap Analysis</h4>
            <p>${safeString(report.competitiveLandscape?.gapAnalysis)}</p>
        </div>
    </div>

    <!-- Arbitrage Opportunity -->
    <div class="section">
        <h2>5. ⚡ Arbitrage Opportunity</h2>
        <div class="card">
            <h4>💰 The Opportunity</h4>
            <p>${safeString(report.arbitrageOpportunity?.explanation)}</p>
        </div>
        <div class="highlight">
            <h4>🎯 Your Concrete Angle</h4>
            <p style="font-size: 1.1em; font-weight: 500;">
                ${safeString(report.arbitrageOpportunity?.concreteAngle)}
            </p>
        </div>
    </div>

    <!-- Entry Offers -->
    <div class="section">
        <h2>6. Suggested Entry Offers</h2>
        ${safeArray(report.entryOffers).map((offer, index) => `
            <div class="entry-offer">
                <h4>📦 Offer ${index + 1}: ${offer.positioning || 'Unnamed Offer'}</h4>
                <div class="grid">
                    <div>
                        <strong>Business Model:</strong><br>
                        ${offer.businessModel || 'Not specified'}
                    </div>
                    <div>
                        <strong>Price Point:</strong><br>
                        <span style="color: #28a745; font-size: 1.2em; font-weight: bold;">
                            ${offer.pricePoint || 'Not specified'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('')}
        ${safeArray(report.entryOffers).length === 0 ? '<p>No entry offers available</p>' : ''}
    </div>

    <!-- Go-to-Market Strategy -->
    <div class="section">
        <h2>7.  Go-to-Market Strategy</h2>
        <div class="grid">
            <div class="card">
                <h4> Primary Channel</h4>
                <p style="font-size: 1.2em; color: #667eea; font-weight: bold;">
                    ${safeString(report.gtmStrategy?.primaryChannel)}
                </p>
            </div>
            <div class="card">
                <h4>💡 Why This Channel</h4>
                <p>${safeString(report.gtmStrategy?.justification)}</p>
            </div>
        </div>
    </div>

    <!-- Scalability & Exit -->
    <div class="section">
        <h2>8. 📊 Scalability & Exit Potential</h2>
        <div class="grid">
            <div class="metric">
                <strong>Scalability Score:</strong><br>
                <span class="score-badge" style="background: ${getScoreColor(report.scalabilityExit?.scalabilityScore)}">
                    ${safeString(report.scalabilityExit?.scalabilityScore)}
                </span>
            </div>
            <div class="card">
                <h4>🎯 Exit Potential</h4>
                <p>${safeString(report.scalabilityExit?.exitPotential)}</p>
            </div>
        </div>
    </div>

    <!-- Risk Factors -->
    <div class="section page-break">
        <h2>9. ⚠️ Risk Factors & Mitigation</h2>
        ${safeArray(report.riskFactors).map((risk, index) => `
            <div class="risk-factor">
                <h4>⚠️ ${risk.risk || 'Unnamed Risk'}</h4>
                <span class="score-badge" style="background: ${getScoreColor(risk.impact)}">
                    ${risk.impact || 'Unknown'} Impact
                </span>
            </div>
        `).join('')}
        ${safeArray(report.riskFactors).length === 0 ? '<p>No risk factors identified</p>' : ''}
    </div>

    <!-- Opportunity Scorecard -->
    <div class="section">
        <h2>10. 📋 Opportunity Scorecard</h2>
        <div class="scorecard">
            <div class="scorecard-item">
                <h4>📈 Market Demand</h4>
                <span class="score-badge" style="background: ${getScoreColor(report.scorecard?.marketDemand)}">
                    ${safeString(report.scorecard?.marketDemand)}
                </span>
            </div>
            <div class="scorecard-item">
                <h4>🏢 Competition</h4>
                <span class="score-badge" style="background: ${getScoreColor(report.scorecard?.competition)}">
                    ${safeString(report.scorecard?.competition)}
                </span>
            </div>
            <div class="scorecard-item">
                <h4>🚪 Ease of Entry</h4>
                <span class="score-badge" style="background: ${getScoreColor(report.scorecard?.easeOfEntry)}">
                    ${safeString(report.scorecard?.easeOfEntry)}
                </span>
            </div>
            <div class="scorecard-item">
                <h4>💰 Profitability</h4>
                <span class="score-badge" style="background: ${getScoreColor(report.scorecard?.profitability)}">
                    ${safeString(report.scorecard?.profitability)}
                </span>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <h3>🎯 Your Niche Journey Starts Here</h3>
        <p>This report provides you with a data-driven roadmap to enter and succeed in your chosen niche.</p>
        <div style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
            <p><strong>Report Statistics:</strong></p>
            <p>Generation Time: ${report.generationTime}ms | Tokens Used: ${report.tokensUsed}</p>
            <p>Match Score: ${metadata.topNiches?.[0]?.matchScore || 'N/A'}/100</p>
        </div>
    </div>
</body>
</html>
  `;
}