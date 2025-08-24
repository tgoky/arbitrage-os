// app/api/deliverables/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ✅ ROBUST AUTHENTICATION (same pattern)
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Try with route handler client
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        return { user, error: null };
      }
    } catch (helperError) {
      console.warn('⚠️ Export route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
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
        console.warn('⚠️ Export token auth error:', tokenError);
      }
    }
    
    // Method 3: Try with SSR cookies
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              return cookie?.value;
            } catch (error) {
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    return { user, error };
    
  } catch (error) {
    return { user: null, error };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    // Get the deliverable with user verification
    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        user_id: user.id // Ensure user owns the deliverable
      },
      include: {
        workspace: true
      }
    });

    if (!deliverable) {
      return NextResponse.json({
        success: false,
        error: 'Deliverable not found or access denied'
      }, { status: 404 });
    }

    // Generate export content based on format
    const exportData = generateExportContent(deliverable, format);
    
    // Set appropriate headers based on format
    const headers = new Headers();
    
    switch (format) {
      case 'json':
        headers.set('Content-Type', 'application/json');
        headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(deliverable.title)}.json"`);
        break;
      case 'txt':
        headers.set('Content-Type', 'text/plain');
        headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(deliverable.title)}.txt"`);
        break;
      case 'csv':
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(deliverable.title)}.csv"`);
        break;
      case 'md':
        headers.set('Content-Type', 'text/markdown');
        headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(deliverable.title)}.md"`);
        break;
      default:
        headers.set('Content-Type', 'application/json');
        headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(deliverable.title)}.json"`);
    }

    return new NextResponse(exportData, { headers });
  } catch (error) {
    console.error('Export deliverable error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to export deliverable'
    }, { status: 500 });
  }
}

// Helper function to generate export content based on deliverable type and format
function generateExportContent(deliverable: any, format: string): string {
  const { type, title, content, metadata, created_at, tags } = deliverable;
  
  try {
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    
    switch (format) {
      case 'json':
        return JSON.stringify({
          title,
          type,
          content: parsedContent,
          metadata,
          tags,
          created_at,
          exported_at: new Date().toISOString()
        }, null, 2);
        
      case 'txt':
        return generateTextExport(deliverable, parsedContent);
        
      case 'csv':
        return generateCsvExport(deliverable, parsedContent);
        
      case 'md':
        return generateMarkdownExport(deliverable, parsedContent);
        
      default:
        return JSON.stringify(parsedContent, null, 2);
    }
  } catch (error) {
    console.error('Error parsing content:', error);
    return JSON.stringify({ title, type, content, metadata, error: 'Failed to parse content' }, null, 2);
  }
}

// Generate text export based on deliverable type
function generateTextExport(deliverable: any, parsedContent: any): string {
  const { type, title, metadata, created_at } = deliverable;
  let output = `${title}\n${'='.repeat(title.length)}\n\n`;
  output += `Type: ${type}\n`;
  output += `Created: ${new Date(created_at).toLocaleString()}\n\n`;
  
  switch (type) {
    case 'sales_call_analysis':
      output += generateCallAnalysisText(parsedContent);
      break;
    case 'pricing_calculation':
      output += generatePricingText(parsedContent);
      break;
    case 'signature_offers':
      output += generateOffersText(parsedContent);
      break;
    case 'cold_email_generation':
      output += generateEmailText(parsedContent);
      break;
    case 'growth_plan':
      output += generateGrowthPlanText(parsedContent);
      break;
    case 'niche_research':
      output += generateNicheResearchText(parsedContent);
      break;
    case 'ad_writer':
      output += generateAdWriterText(parsedContent);
      break;
    default:
      output += JSON.stringify(parsedContent, null, 2);
  }
  
  return output;
}

// Specific text generators for each type
function generateCallAnalysisText(content: any): string {
  let output = 'SALES CALL ANALYSIS\n';
  output += '==================\n\n';
  
  if (content.callResults) {
    const analysis = content.callResults.analysis;
    output += `Overall Score: ${analysis?.overallScore || 'N/A'}/100\n`;
    output += `Sentiment: ${analysis?.sentiment || 'N/A'}\n`;
    output += `Duration: ${Math.floor((content.callResults.duration || 0) / 60)} minutes\n\n`;
    
    if (analysis?.keyInsights) {
      output += 'KEY INSIGHTS:\n';
      analysis.keyInsights.forEach((insight: string, idx: number) => {
        output += `${idx + 1}. ${insight}\n`;
      });
      output += '\n';
    }
    
    if (analysis?.actionItems) {
      output += 'ACTION ITEMS:\n';
      analysis.actionItems.forEach((item: string, idx: number) => {
        output += `${idx + 1}. ${item}\n`;
      });
    }
  }
  
  return output;
}

function generatePricingText(content: any): string {
  let output = 'PRICING STRATEGY\n';
  output += '===============\n\n';
  
  if (content.calculations) {
    const calc = content.calculations;
    output += `Recommended Monthly Retainer: ${calc.recommendedRetainer?.toLocaleString() || 'N/A'}\n`;
    output += `ROI for Client: ${calc.roiPercentage || 'N/A'}%\n`;
    output += `Effective Hourly Rate: ${calc.hourlyRate || 'N/A'}\n`;
    output += `Total Project Value: ${calc.totalProjectValue?.toLocaleString() || 'N/A'}\n\n`;
  }
  
  if (content.strategy) {
    output += 'STRATEGY:\n';
    output += content.strategy.recommendedApproach || 'No strategy available';
    output += '\n\n';
  }
  
  return output;
}

function generateOffersText(content: any): string {
  let output = 'SIGNATURE OFFERS\n';
  output += '===============\n\n';
  
  if (content.signatureOffers) {
    const offers = content.signatureOffers;
    
    ['starter', 'core', 'premium'].forEach(tier => {
      if (offers[tier]) {
        const offer = offers[tier];
        output += `${tier.toUpperCase()} TIER:\n`;
        output += `Name: ${offer.name || 'N/A'}\n`;
        output += `Price: ${offer.pricing || 'N/A'}\n`;
        output += `For: ${offer.for || 'N/A'}\n`;
        output += `Promise: ${offer.promise || 'N/A'}\n\n`;
      }
    });
  }
  
  return output;
}

function generateEmailText(content: any): string {
  let output = 'COLD EMAIL CAMPAIGN\n';
  output += '==================\n\n';
  
  if (content.emails && Array.isArray(content.emails)) {
    content.emails.forEach((email: any, idx: number) => {
      output += `EMAIL ${idx + 1}:\n`;
      output += `Subject: ${email.subject || 'N/A'}\n`;
      output += `Method: ${email.method || 'N/A'}\n\n`;
      output += `Body:\n${email.body || 'No content'}\n\n`;
      output += `Signature:\n${email.signature || 'No signature'}\n\n`;
      output += '-'.repeat(50) + '\n\n';
    });
  }
  
  return output;
}

function generateGrowthPlanText(content: any): string {
  let output = 'GROWTH PLAN\n';
  output += '===========\n\n';
  
  if (content.executiveSummary) {
    output += 'EXECUTIVE SUMMARY:\n';
    output += content.executiveSummary + '\n\n';
  }
  
  if (content.strategy?.stages) {
    output += 'IMPLEMENTATION STAGES:\n';
    content.strategy.stages.forEach((stage: any, idx: number) => {
      output += `${idx + 1}. ${stage.title || 'Untitled Stage'}\n`;
      output += `   Duration: ${stage.duration || 'N/A'}\n`;
      output += `   Budget: ${stage.budget?.toLocaleString() || 'N/A'}\n\n`;
    });
  }
  
  return output;
}

function generateNicheResearchText(content: any): string {
  let output = 'NICHE RESEARCH REPORT\n';
  output += '====================\n\n';
  
  if (content.nicheOverview) {
    output += `NICHE: ${content.nicheOverview.name || 'N/A'}\n`;
    output += `SUMMARY: ${content.nicheOverview.summary || 'N/A'}\n\n`;
  }
  
  if (content.marketDemand) {
    output += 'MARKET ANALYSIS:\n';
    output += `Market Size: ${content.marketDemand.marketSize || 'N/A'}\n`;
    output += `Trend: ${content.marketDemand.trend || 'N/A'}\n`;
    output += `Willingness to Pay: ${content.marketDemand.willingnessToPay || 'N/A'}\n\n`;
  }
  
  return output;
}

function generateAdWriterText(content: any): string {
  let output = 'AD CAMPAIGN\n';
  output += '===========\n\n';
  
  if (content.ads && Array.isArray(content.ads)) {
    content.ads.forEach((ad: any, idx: number) => {
      output += `${ad.platform?.toUpperCase() || 'PLATFORM'} ADS:\n`;
      output += '-'.repeat(20) + '\n';
      
      if (ad.headlines) {
        output += 'Headlines:\n';
        ad.headlines.forEach((headline: string, hidx: number) => {
          output += `${hidx + 1}. ${headline}\n`;
        });
        output += '\n';
      }
      
      if (ad.descriptions) {
        output += 'Descriptions:\n';
        ad.descriptions.forEach((desc: string, didx: number) => {
          output += `${didx + 1}. ${desc}\n`;
        });
        output += '\n';
      }
      
      output += '\n';
    });
  }
  
  return output;
}

// Generate CSV export (simplified for key metrics)
function generateCsvExport(deliverable: any, parsedContent: any): string {
  const { type, title, created_at, metadata } = deliverable;
  
  let csvContent = 'Field,Value\n';
  csvContent += `Title,"${title}"\n`;
  csvContent += `Type,"${type}"\n`;
  csvContent += `Created,"${new Date(created_at).toLocaleString()}"\n`;
  
  // Add type-specific metrics
  switch (type) {
    case 'sales_call_analysis':
      if (parsedContent.callResults?.analysis) {
        const analysis = parsedContent.callResults.analysis;
        csvContent += `Overall Score,${analysis.overallScore || 'N/A'}\n`;
        csvContent += `Sentiment,"${analysis.sentiment || 'N/A'}"\n`;
        csvContent += `Duration (minutes),${Math.floor((parsedContent.callResults.duration || 0) / 60)}\n`;
      }
      break;
    case 'pricing_calculation':
      if (parsedContent.calculations) {
        const calc = parsedContent.calculations;
        csvContent += `Monthly Retainer,${calc.recommendedRetainer?.toLocaleString() || 'N/A'}\n`;
        csvContent += `ROI Percentage,${calc.roiPercentage || 'N/A'}%\n`;
        csvContent += `Hourly Rate,${calc.hourlyRate || 'N/A'}\n`;
      }
      break;
    // Add other types as needed
  }
  
  return csvContent;
}

// Generate Markdown export
function generateMarkdownExport(deliverable: any, parsedContent: any): string {
  const { type, title, created_at, metadata, tags } = deliverable;
  
  let output = `# ${title}\n\n`;
  output += `**Type:** ${type}  \n`;
  output += `**Created:** ${new Date(created_at).toLocaleString()}  \n`;
  
  if (tags && tags.length > 0) {
    output += `**Tags:** ${tags.join(', ')}  \n`;
  }
  
  output += '\n---\n\n';
  
  // Add type-specific markdown content
  switch (type) {
    case 'sales_call_analysis':
      output += generateCallAnalysisMarkdown(parsedContent);
      break;
    case 'pricing_calculation':
      output += generatePricingMarkdown(parsedContent);
      break;
    case 'growth_plan':
      output += parsedContent.detailedReport || 'No detailed report available';
      break;
    default:
      output += '```json\n' + JSON.stringify(parsedContent, null, 2) + '\n```\n';
  }
  
  output += '\n\n---\n\n';
  output += `*Exported on ${new Date().toLocaleString()}*\n`;
  
  return output;
}

function generateCallAnalysisMarkdown(content: any): string {
  let output = '## Sales Call Analysis\n\n';
  
  if (content.callResults?.analysis) {
    const analysis = content.callResults.analysis;
    output += `**Overall Score:** ${analysis.overallScore || 'N/A'}/100  \n`;
    output += `**Sentiment:** ${analysis.sentiment || 'N/A'}  \n`;
    output += `**Duration:** ${Math.floor((content.callResults.duration || 0) / 60)} minutes\n\n`;
    
    if (analysis.keyInsights) {
      output += '### Key Insights\n\n';
      analysis.keyInsights.forEach((insight: string) => {
        output += `- ${insight}\n`;
      });
      output += '\n';
    }
  }
  
  return output;
}

function generatePricingMarkdown(content: any): string {
  let output = '## Pricing Strategy\n\n';
  
  if (content.calculations) {
    const calc = content.calculations;
    output += '### Financial Summary\n\n';
    output += `- **Monthly Retainer:** ${calc.recommendedRetainer?.toLocaleString() || 'N/A'}\n`;
    output += `- **Client ROI:** ${calc.roiPercentage || 'N/A'}%\n`;
    output += `- **Effective Hourly Rate:** ${calc.hourlyRate || 'N/A'}\n\n`;
  }
  
  return output;
}

// Helper function to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}