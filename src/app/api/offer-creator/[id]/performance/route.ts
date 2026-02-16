// app/api/offer-creator/[id]/performance/route.ts - UPDATED TO MATCH NEW STRUCTURE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../../services/offerCreator.service';
import { validatePerformanceData } from '../../../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ApiResponse, PerformanceMetrics, OfferPerformance } from '@/types/offerCreator';

const RATE_LIMITS = {
  PERFORMANCE_UPDATE: {
    limit: 50,
    window: 3600 // 1 hour
  },
  PERFORMANCE_GET: {
    limit: 100,
    window: 3600 // 1 hour
  }
};

//   Enhanced authentication function (matches main route)
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('  Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('  User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('  Authentication error:', error);
    return { user: null, error };
  }
}


// POST method for updating signature offer performance
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(' Signature Offer Performance Update API called for offer:', params.id);

    //   Enhanced authentication
   const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      console.error('  Auth failed in performance update:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        } as ApiResponse<never>,
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token'
      ];
      
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path: '/',
        });
      });
      
      return response;
    }

    console.log('  User authenticated successfully:', user.id);

    // Rate limiting for performance updates
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `signature_offer_performance_update:${user.id}`,
      RATE_LIMITS.PERFORMANCE_UPDATE.limit,
      RATE_LIMITS.PERFORMANCE_UPDATE.window
    );
    if (!rateLimitResult.success) {
      console.log('  Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Performance update rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.reset
        } as ApiResponse<never>,
        { status: 429 }
      );
    }
    console.log('  Rate limit check passed');

    const offerId = params.id;
    
    // Validate offer ID format
    if (!offerId || offerId.length < 10) {
      console.error('  Invalid offer ID:', offerId);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid offer ID format' 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Parse and validate request body
    console.log('📥 Parsing performance data...');
    const body = await req.json();
    
    // Add offer ID to the validation data
    const performanceDataWithId = {
      ...body,
      offerId
    };

    console.log('🔍 Performance data structure:');
    console.log('- metrics keys:', body.metrics ? Object.keys(body.metrics) : 'missing');
    console.log('- date range:', body.dateRange ? 'present' : 'missing');

    // Validate performance data using our updated validator
    const validation = validatePerformanceData(performanceDataWithId);
    if (!validation.success) {
      console.error('  Performance data validation failed:', validation.errors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid performance data', 
          details: validation.errors,
          debug: {
            receivedFields: Object.keys(body),
            expectedStructure: {
              metrics: {
                inquiries: 'number',
                proposals: 'number', 
                conversions: 'number',
                avgDealSize: 'number',
                timeToClose: 'number'
              },
              dateRange: {
                start: 'string (ISO date)',
                end: 'string (ISO date)'
              }
            }
          }
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (!validation.data) {
      console.error('  No valid performance data provided');
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid performance data provided' 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    //   Update offer performance with error handling
    console.log('💾 Updating signature offer performance...');
    try {
      const offerService = new OfferCreatorService();
      await offerService.updateOfferPerformance(
        user.id, 
        offerId, 
        {
          inquiries: validation.data.metrics.inquiries,
          proposals: validation.data.metrics.proposals,
          conversions: validation.data.metrics.conversions,
          avgDealSize: validation.data.metrics.avgDealSize,
          timeToClose: validation.data.metrics.timeToClose,
          dateRange: validation.data.dateRange
        }
      );
      console.log('  Performance data updated successfully');
    } catch (updateError) {
      console.error('  Error updating performance:', updateError);
      
      if (updateError instanceof Error && updateError.message.includes('not found')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Signature offer not found or access denied',
            code: 'OFFER_NOT_FOUND'
          } as ApiResponse<never>,
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to update performance data. Please try again.',
          debug: updateError instanceof Error ? updateError.message : 'Unknown update error'
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // Get updated performance data with insights
    console.log('📊 Fetching updated performance insights...');
    let performanceData: OfferPerformance;
    try {
      const offerService = new OfferCreatorService();
      performanceData = await offerService.getOfferPerformance(user.id, offerId);
      console.log('  Performance insights generated successfully');
    } catch (fetchError) {
      console.error('  Error fetching performance insights:', fetchError);
      // Return success for the update but without insights
      return NextResponse.json(
        { 
          success: true,
          data: { updated: true },
          meta: {
            remaining: rateLimitResult.remaining,
            insightsError: 'Performance updated but insights unavailable'
          }
        } as ApiResponse<any>
      );
    }

    //   Log usage for performance update with enhanced metadata
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offer_performance_update',
        tokens: 0, // No AI tokens for data update
        timestamp: new Date(),
        metadata: {
          offerId,
          metricsUpdated: Object.keys(validation.data.metrics),
          conversionRate: performanceData.summary.averageConversionRate,
          proposalRate: performanceData.summary.averageProposalRate,
          totalConversions: performanceData.summary.totalConversions,
          totalRevenue: performanceData.summary.totalRevenue,
          avgDealSize: performanceData.summary.averageDealSize,
          trend: performanceData.summary.trend,
          dataPoints: performanceData.summary.dataPoints,
          insightsGenerated: performanceData.insights.length,
          dateRange: validation.data.dateRange
        }
      });
      console.log('  Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Signature offer performance update completed successfully');
    return NextResponse.json({
      success: true,
      data: performanceData,
      meta: {
        offerId,
        metricsUpdated: Object.keys(validation.data.metrics),
        remaining: rateLimitResult.remaining,
        insightsGenerated: performanceData.insights.length
      }
    } as ApiResponse<OfferPerformance>);

  } catch (error) {
    console.error('  Unexpected Performance Update Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update performance data. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

// GET method for retrieving signature offer performance
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Signature Offer Performance Get API called for offer:', params.id);

    //   Enhanced authentication
      const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      console.error('  Auth failed in performance get:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        } as ApiResponse<never>,
        { status: 401 }
      );
    }

    console.log('  User authenticated successfully:', user.id);

    // Rate limiting for performance gets
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `signature_offer_performance_get:${user.id}`,
      RATE_LIMITS.PERFORMANCE_GET.limit,
      RATE_LIMITS.PERFORMANCE_GET.window
    );
    if (!rateLimitResult.success) {
      console.log('  Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Performance fetch rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.reset
        } as ApiResponse<never>,
        { status: 429 }
      );
    }
    console.log('  Rate limit check passed');

    const offerId = params.id;
    
    // Validate offer ID format
    if (!offerId || offerId.length < 10) {
      console.error('  Invalid offer ID:', offerId);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid offer ID format' 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all'; // all, 30d, 90d, 1y
    const includeInsights = searchParams.get('insights') !== 'false';

    console.log('📊 Fetching performance data for offer:', offerId);
    console.log('🔍 Parameters - period:', period, 'insights:', includeInsights);

    //   Get signature offer performance data
    let performanceData: OfferPerformance;
    try {
      const offerService = new OfferCreatorService();
      performanceData = await offerService.getOfferPerformance(user.id, offerId);
      
      console.log('  Performance data retrieved successfully');
      console.log('📊 Summary - conversions:', performanceData.summary.totalConversions, 
                  'revenue:', performanceData.summary.totalRevenue,
                  'trend:', performanceData.summary.trend);
    } catch (fetchError) {
      console.error('  Error fetching performance data:', fetchError);
      
      if (fetchError instanceof Error && fetchError.message === 'Offer not found') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Signature offer not found or access denied',
            code: 'OFFER_NOT_FOUND'
          } as ApiResponse<never>,
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch performance data. Please try again.',
          debug: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    if (!performanceData) {
      console.error('  Performance data not found for offer:', offerId);
      return NextResponse.json(
        { 
          success: false,
          error: 'Performance data not found for this signature offer',
          code: 'PERFORMANCE_DATA_NOT_FOUND'
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Filter performance history by period if requested
    let filteredData = performanceData;
    if (period !== 'all' && performanceData.performanceHistory.length > 0) {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (period) {
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0); // All time
      }
      
      filteredData = {
        ...performanceData,
        performanceHistory: performanceData.performanceHistory.filter(entry => 
          new Date(entry.dateRange.start) >= cutoffDate
        )
      };
    }

    //   Log usage for performance fetch
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offer_performance_view',
        tokens: 0, // No AI tokens for viewing
        timestamp: new Date(),
        metadata: {
          offerId,
          action: 'view_performance',
          period,
          includeInsights,
          dataPointsReturned: filteredData.performanceHistory.length,
          hasLatestMetrics: !!filteredData.latestMetrics,
          trend: filteredData.summary.trend
        }
      });
      console.log('  Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Performance data fetch completed successfully');
    return NextResponse.json({
      success: true,
      data: filteredData,
      meta: {
        offerId,
        period,
        dataPoints: filteredData.performanceHistory.length,
        hasInsights: filteredData.insights.length > 0,
        lastUpdated: filteredData.latestMetrics ? 'recently' : 'no recent data',
        remaining: rateLimitResult.remaining
      }
    } as ApiResponse<OfferPerformance>);

  } catch (error) {
    console.error('  Unexpected Performance Fetch Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch performance data. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}