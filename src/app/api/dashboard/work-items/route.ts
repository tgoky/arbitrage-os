// // app/api/dashboard/work-items/route.ts - Enhanced Auth Handling
// import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';

// interface WorkItem {
//   id: string;
//   type: 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator';
//   title: string;
//   subtitle: string;
//   status: 'completed' | 'processing' | 'failed' | 'draft';
//   createdAt: string;
//   metadata: Record<string, any>;
//   actions: string[];
//   rawData: any;
// }

// // Define auth result types
// interface AuthSuccess {
//   success: true;
//   user: {
//     id: string;
//     email?: string;
//     [key: string]: any;
//   };
//   authMethod: string;
// }

// interface AuthFailure {
//   success: false;
//   error: string;
//   status: number;
//   shouldClearAuth?: boolean;
// }

// type AuthResult = AuthSuccess | AuthFailure;

// // Enhanced auth verification with proper typing
// async function verifyAuthentication(request: NextRequest): Promise<AuthResult> {
//   try {
//     console.log('🔐 Starting authentication verification...');
    
//     // Create Supabase client with cookie handling
//     const cookieStore = cookies();
//     const supabase = createRouteHandlerClient({ 
//       cookies: () => cookieStore 
//     });

//     // Method 1: Check Authorization header first
//     const authHeader = request.headers.get('authorization');
//     console.log('📋 Auth header present:', !!authHeader);
    
//     if (authHeader?.startsWith('Bearer ')) {
//       const token = authHeader.substring(7);
//       console.log('🎫 Token from header:', {
//         length: token.length,
//         prefix: token.substring(0, 20) + '...'
//       });
      
//       // Verify the token with Supabase
//       const { data: { user }, error } = await supabase.auth.getUser(token);
      
//       if (error) {
//         console.error('❌ Token verification failed:', error.message);
//         return { success: false, error: `Token verification failed: ${error.message}`, status: 401 };
//       }
      
//       if (user && user.id) {
//         console.log('✅ User verified via token:', user.id);
//         return { success: true, user, authMethod: 'bearer-token' };
//       }
//     }

//     // Method 2: Check session from cookies
//     console.log('🔄 Checking session from cookies...');
//     const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
//     if (sessionError) {
//       console.error('❌ Cookie session error:', sessionError.message);
      
//       // Handle specific cookie parsing errors
//       if (sessionError.message?.includes('JSON') || sessionError.message?.includes('parse')) {
//         return { 
//           success: false, 
//           error: 'Authentication data corrupted. Please refresh the page and sign in again.', 
//           status: 401,
//           shouldClearAuth: true
//         };
//       }
      
//       return { success: false, error: `Session error: ${sessionError.message}`, status: 401 };
//     }

//     if (session?.user?.id) {
//       console.log('✅ User verified via session:', session.user.id);
//       return { success: true, user: session.user, authMethod: 'session-cookie' };
//     }

//     // Method 3: Try to get user directly
//     console.log('🔄 Trying direct user lookup...');
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
    
//     if (userError) {
//       console.error('❌ Direct user lookup failed:', userError.message);
//       return { success: false, error: `User lookup failed: ${userError.message}`, status: 401 };
//     }

//     if (user && user.id) {
//       console.log('✅ User found via direct lookup:', user.id);
//       return { success: true, user, authMethod: 'direct-lookup' };
//     }

//     // No authentication method worked
//     console.error('❌ No valid authentication found');
//     return { success: false, error: 'No valid authentication found', status: 401 };

//   } catch (error) {
//     console.error('💥 Authentication verification error:', error);
//     return { 
//       success: false, 
//       error: error instanceof Error ? error.message : 'Authentication system error', 
//       status: 500 
//     };
//   }
// }

// // GET /api/dashboard/work-items - Enhanced auth and error handling with proper types
// export async function GET(request: NextRequest) {
//   const requestId = Date.now().toString(36);
//   console.log(`🔍 [${requestId}] Dashboard API called`);
  
//   try {
//     // Enhanced authentication verification
//     const authResult = await verifyAuthentication(request);
    
//     if (!authResult.success) {
//       console.error(`❌ [${requestId}] Authentication failed:`, authResult.error);
      
//       const response = NextResponse.json({ 
//         success: false, 
//         error: authResult.error,
//         requestId,
//         shouldClearAuth: authResult.shouldClearAuth || false
//       }, { status: authResult.status || 401 });
      
//       // Add helpful headers for debugging
//       response.headers.set('X-Auth-Error', 'true');
//       response.headers.set('X-Request-ID', requestId);
      
//       return response;
//     }

//     // TypeScript now knows authResult.success is true, so user exists
//     const { user, authMethod } = authResult;
//     console.log(`✅ [${requestId}] Authenticated via ${authMethod}:`, user.id);

//     // Parse request parameters
//     const { searchParams } = new URL(request.url);
//     const workspaceId = searchParams.get('workspaceId');
//     const forceRefresh = searchParams.get('refresh') === 'true';

//     console.log(`📡 [${requestId}] Fetching work items:`, {
//       userId: user.id,
//       workspaceId,
//       forceRefresh
//     });

//     // Create a fresh Supabase client for data fetching
//     const cookieStore = cookies();
//     const supabase = createRouteHandlerClient({ 
//       cookies: () => cookieStore 
//     });

//     // Fetch work items
//     const startTime = Date.now();
//     const workItems = await fetchAllWorkItems(user.id, workspaceId, supabase);
//     const fetchTime = Date.now() - startTime;

//     console.log(`✅ [${requestId}] Returning ${workItems.length} work items (${fetchTime}ms)`);

//     const response = NextResponse.json({
//       success: true,
//       data: {
//         items: workItems,
//         cached: false, // Not using cache yet
//         timestamp: new Date().toISOString(),
//         authMethod,
//         fetchTime
//       },
//       requestId
//     });

//     // Add performance headers
//     response.headers.set('X-Request-ID', requestId);
//     response.headers.set('X-Fetch-Time', fetchTime.toString());
//     response.headers.set('X-Item-Count', workItems.length.toString());
    
//     return response;

//   } catch (error) {
//     console.error(`💥 [${requestId}] Dashboard API error:`, error);
    
//     const errorMessage = error instanceof Error ? error.message : 'Internal server error';
//     const isAuthError = errorMessage.includes('auth') || errorMessage.includes('session') || errorMessage.includes('token');
    
//     return NextResponse.json({
//       success: false,
//       error: errorMessage,
//       requestId,
//       isAuthError
//     }, { 
//       status: isAuthError ? 401 : 500,
//       headers: {
//         'X-Request-ID': requestId,
//         'X-Error': 'true'
//       }
//     });
//   }
// }

// // Enhanced data fetching with better error handling
// async function fetchAllWorkItems(userId: string, workspaceId?: string | null, supabase?: any): Promise<WorkItem[]> {
//   const items: WorkItem[] = [];
  
//   console.log('🔄 Fetching fresh work items from database...');
//   console.log('🔍 Parameters:', { userId, workspaceId });

//   // If no supabase client passed, create a new one
//   if (!supabase) {
//     const cookieStore = cookies();
//     supabase = createRouteHandlerClient({ 
//       cookies: () => cookieStore 
//     });
//   }

//   try {
//     // Fetch all data sources in parallel with individual error handling
//     const fetchPromises = [
//       fetchSalesCalls(userId, workspaceId, supabase).catch(err => {
//         console.warn('⚠️ Sales calls fetch failed:', err.message);
//         return [];
//       }),
//       fetchGrowthPlans(userId, workspaceId, supabase).catch(err => {
//         console.warn('⚠️ Growth plans fetch failed:', err.message);
//         return [];
//       }),
//       fetchPricingCalcs(userId, workspaceId, supabase).catch(err => {
//         console.warn('⚠️ Pricing calcs fetch failed:', err.message);
//         return [];
//       }),
//       fetchNicheReports(userId, workspaceId, supabase).catch(err => {
//         console.warn('⚠️ Niche reports fetch failed:', err.message);
//         return [];
//       }),
//       fetchColdEmails(userId, workspaceId, supabase).catch(err => {
//         console.warn('⚠️ Cold emails fetch failed:', err.message);
//         return [];
//       }),
//       fetchOffers(userId, workspaceId, supabase).catch(err => {
//         console.warn('⚠️ Offers fetch failed:', err.message);
//         return [];
//       })
//     ];

//     const [
//       salesCalls,
//       growthPlans,
//       pricingCalcs,
//       nicheReports,
//       coldEmails,
//       offers
//     ] = await Promise.all(fetchPromises);

//     // Process and transform data
//     const dataProcessors = [
//       { data: salesCalls, transform: transformSalesCall, name: 'sales calls' },
//       { data: growthPlans, transform: transformGrowthPlan, name: 'growth plans' },
//       { data: pricingCalcs, transform: transformPricingCalc, name: 'pricing calculations' },
//       { data: nicheReports, transform: transformNicheReport, name: 'niche reports' },
//       { data: coldEmails, transform: transformColdEmail, name: 'cold emails' },
//       { data: offers, transform: transformOffer, name: 'offers' }
//     ];

//     dataProcessors.forEach(({ data, transform, name }) => {
//       try {
//         if (Array.isArray(data)) {
//           data.forEach(item => {
//             items.push(transform(item));
//           });
//           console.log(`📊 Added ${data.length} ${name}`);
//         }
//       } catch (error) {
//         console.error(`❌ Error processing ${name}:`, error);
//       }
//     });

//     // Sort by creation date (newest first)
//     items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

//     console.log(`🎉 Total work items processed: ${items.length}`);
//     return items;

//   } catch (error) {
//     console.error('💥 Critical error in fetchAllWorkItems:', error);
//     // Return empty array instead of throwing to prevent complete failure
//     return [];
//   }
// }

// // Individual fetch functions with enhanced error handling
// async function fetchSalesCalls(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
//   try {
//     console.log('📞 Fetching sales calls...');
    
//     let query = supabase
//       .from('sales_call_analyses')
//       .select('*')
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false });
    
//     if (workspaceId) {
//       query = query.eq('workspace_id', workspaceId);
//     }
    
//     const { data, error } = await query.limit(50); // Limit for performance
    
//     if (error) {
//       console.warn('⚠️ Sales calls fetch error:', error.message);
//       return [];
//     }
    
//     console.log(`✅ Found ${data?.length || 0} sales calls`);
//     return data || [];
//   } catch (err) {
//     console.warn('⚠️ Sales calls fetch exception:', err);
//     return [];
//   }
// }

// async function fetchGrowthPlans(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
//   try {
//     console.log('🚀 Fetching growth plans...');
    
//     let query = supabase
//       .from('growth_plans')
//       .select('*')
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false });
    
//     if (workspaceId) {
//       query = query.eq('workspace_id', workspaceId);
//     }
    
//     const { data, error } = await query.limit(50);
    
//     if (error) {
//       console.warn('⚠️ Growth plans fetch error:', error.message);
//       return [];
//     }
    
//     console.log(`✅ Found ${data?.length || 0} growth plans`);
//     return data || [];
//   } catch (err) {
//     console.warn('⚠️ Growth plans fetch exception:', err);
//     return [];
//   }
// }

// async function fetchPricingCalcs(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
//   try {
//     console.log('💰 Fetching pricing calculations...');
    
//     let query = supabase
//       .from('pricing_calculations')
//       .select('*')
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false });
    
//     if (workspaceId) {
//       query = query.eq('workspace_id', workspaceId);
//     }
    
//     const { data, error } = await query.limit(50);
    
//     if (error) {
//       console.warn('⚠️ Pricing calculations fetch error:', error.message);
//       return [];
//     }
    
//     console.log(`✅ Found ${data?.length || 0} pricing calculations`);
//     return data || [];
//   } catch (err) {
//     console.warn('⚠️ Pricing calculations fetch exception:', err);
//     return [];
//   }
// }

// async function fetchNicheReports(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
//   try {
//     console.log('🔬 Fetching niche reports...');
    
//     let query = supabase
//       .from('niche_research_reports')
//       .select('*')
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false });
    
//     if (workspaceId) {
//       query = query.eq('workspace_id', workspaceId);
//     }
    
//     const { data, error } = await query.limit(50);
    
//     if (error) {
//       console.warn('⚠️ Niche reports fetch error:', error.message);
//       return [];
//     }
    
//     console.log(`✅ Found ${data?.length || 0} niche reports`);
//     return data || [];
//   } catch (err) {
//     console.warn('⚠️ Niche reports fetch exception:', err);
//     return [];
//   }
// }

// async function fetchColdEmails(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
//   try {
//     console.log('📧 Fetching cold emails...');
    
//     let query = supabase
//       .from('cold_email_generations')
//       .select('*')
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false });
    
//     if (workspaceId) {
//       query = query.eq('workspace_id', workspaceId);
//     }
    
//     const { data, error } = await query.limit(50);
    
//     if (error) {
//       console.warn('⚠️ Cold emails fetch error:', error.message);
//       return [];
//     }
    
//     console.log(`✅ Found ${data?.length || 0} cold emails`);
//     return data || [];
//   } catch (err) {
//     console.warn('⚠️ Cold emails fetch exception:', err);
//     return [];
//   }
// }

// async function fetchOffers(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
//   try {
//     console.log('✨ Fetching offers...');
    
//     let query = supabase
//       .from('signature_offers')
//       .select('*')
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false });
    
//     if (workspaceId) {
//       query = query.eq('workspace_id', workspaceId);
//     }
    
//     const { data, error } = await query.limit(50);
    
//     if (error) {
//       console.warn('⚠️ Offers fetch error:', error.message);
//       return [];
//     }
    
//     console.log(`✅ Found ${data?.length || 0} offers`);
//     return data || [];
//   } catch (err) {
//     console.warn('⚠️ Offers fetch exception:', err);
//     return [];
//   }
// }

// // Transform functions with enhanced error handling
// function transformSalesCall(call: any): WorkItem {
//   try {
//     return {
//       id: `sales-call-${call.id}`,
//       type: 'sales-call',
//       title: call.title || 'Sales Call Analysis',
//       subtitle: `${call.prospect_name || 'Unknown'} • ${call.company_name || 'Company'}`,
//       status: 'completed',
//       createdAt: call.created_at || new Date().toISOString(),
//       metadata: {
//         duration: call.duration || 'N/A',
//         callType: call.call_type || 'unknown',
//         company: call.company_name,
//         prospect: call.prospect_name,
//         sentiment: call.sentiment || 'neutral',
//         score: call.score || null
//       },
//       actions: ['view', 'export', 'delete'],
//       rawData: call
//     };
//   } catch (error) {
//     console.error('Error transforming sales call:', error);
//     throw new Error(`Failed to transform sales call data: ${error}`);
//   }
// }

// function transformGrowthPlan(plan: any): WorkItem {
//   try {
//     const metadata = typeof plan.metadata === 'string' 
//       ? JSON.parse(plan.metadata) 
//       : plan.metadata || {};

//     return {
//       id: `growth-plan-${plan.id}`,
//       type: 'growth-plan',
//       title: plan.title || 'Growth Plan',
//       subtitle: `${metadata.clientCompany || 'Company'} • ${metadata.industry || 'Industry'}`,
//       status: 'completed',
//       createdAt: plan.created_at || new Date().toISOString(),
//       metadata: {
//         industry: metadata.industry,
//         timeframe: metadata.timeframe,
//         strategies: metadata.strategies?.length || 0,
//         tokensUsed: metadata.tokensUsed || 0,
//         clientCompany: metadata.clientCompany
//       },
//       actions: ['view', 'export', 'edit', 'delete'],
//       rawData: plan
//     };
//   } catch (error) {
//     console.error('Error transforming growth plan:', error);
//     throw new Error(`Failed to transform growth plan data: ${error}`);
//   }
// }

// function transformPricingCalc(calc: any): WorkItem {
//   try {
//     return {
//       id: `pricing-calc-${calc.id}`,
//       type: 'pricing-calc',
//       title: calc.title || calc.project_name || 'Pricing Calculation',
//       subtitle: `${calc.client_name || 'Client'} • ${calc.recommended_retainer?.toLocaleString() || '0'}`,
//       status: 'completed',
//       createdAt: calc.created_at || new Date().toISOString(),
//       metadata: {
//         clientName: calc.client_name,
//         projectName: calc.project_name,
//         annualSavings: calc.annual_savings,
//         recommendedRetainer: calc.recommended_retainer,
//         hourlyRate: calc.hourly_rate,
//         roiPercentage: calc.roi_percentage,
//         industry: calc.industry
//       },
//       actions: ['view', 'export', 'duplicate', 'delete'],
//       rawData: calc
//     };
//   } catch (error) {
//     console.error('Error transforming pricing calc:', error);
//     throw new Error(`Failed to transform pricing calculation data: ${error}`);
//   }
// }

// function transformNicheReport(report: any): WorkItem {
//   try {
//     return {
//       id: `niche-research-${report.id}`,
//       type: 'niche-research',
//       title: report.title || 'Niche Research Report',
//       subtitle: `${report.niche_name} • ${report.market_type}`,
//       status: 'completed',
//       createdAt: report.created_at || new Date().toISOString(),
//       metadata: {
//         nicheName: report.niche_name,
//         marketSize: report.market_size,
//         primaryObjective: report.primary_objective,
//         marketType: report.market_type,
//         budget: report.budget,
//         tokensUsed: report.tokens_used
//       },
//       actions: ['view', 'export', 'update', 'delete'],
//       rawData: report
//     };
//   } catch (error) {
//     console.error('Error transforming niche report:', error);
//     throw new Error(`Failed to transform niche report data: ${error}`);
//   }
// }

// function transformColdEmail(email: any): WorkItem {
//   try {
//     const emailData = typeof email.emails === 'string' 
//       ? JSON.parse(email.emails) 
//       : email.emails || [];

//     return {
//       id: `cold-email-${email.id}`,
//       type: 'cold-email',
//       title: email.title || 'Cold Email Campaign',
//       subtitle: `${emailData.length || 0} emails • ${email.industry || 'General'}`,
//       status: 'completed',
//       createdAt: email.created_at || new Date().toISOString(),
//       metadata: {
//         emailCount: emailData.length || 0,
//         industry: email.industry,
//         tone: email.tone,
//         method: email.method,
//         firstName: email.first_name
//       },
//       actions: ['view', 'copy', 'optimize', 'delete'],
//       rawData: email
//     };
//   } catch (error) {
//     console.error('Error transforming cold email:', error);
//     throw new Error(`Failed to transform cold email data: ${error}`);
//   }
// }

// function transformOffer(offer: any): WorkItem {
//   try {
//     const offerData = typeof offer.offer_data === 'string' 
//       ? JSON.parse(offer.offer_data) 
//       : offer.offer_data || {};

//     return {
//       id: `offer-creator-${offer.id}`,
//       type: 'offer-creator',
//       title: offer.title || 'Signature Offers',
//       subtitle: `${offer.industry || 'General'} • ${offerData.packages?.length || 3} Packages`,
//       status: 'completed',
//       createdAt: offer.created_at || new Date().toISOString(),
//       metadata: {
//         industry: offer.industry,
//         packages: offerData.packages?.length || 0,
//         priceRange: offerData.priceRange,
//         deliveryModel: offerData.deliveryModel,
//         targetMarket: offer.target_market
//       },
//       actions: ['view', 'export', 'optimize', 'delete'],
//       rawData: offer
//     };
//   } catch (error) {
//     console.error('Error transforming offer:', error);
//     throw new Error(`Failed to transform offer data: ${error}`);
//   }
// }




// app/api/dashboard/work-items/route.ts - Cached Dashboard API
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// Comment out Redis for now to test basic functionality
// import { redis, cacheKeys, cacheTTL, cacheUtils } from '@/lib/redis';

interface WorkItem {
  id: string;
  type: 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator';
  title: string;
  subtitle: string;
  status: 'completed' | 'processing' | 'failed' | 'draft';
  createdAt: string;
  metadata: Record<string, any>;
  actions: string[];
  rawData: any;
}

// ✅ ROBUST 3-METHOD AUTHENTICATION (same as offer-creator that works!)
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
        console.log('✅ Dashboard Auth Method 1 (route handler) succeeded for user:', user.id);
        return { user, error: null, method: 'route_handler' };
      }
      
      console.log('⚠️ Dashboard route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Dashboard route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Dashboard trying token auth with token:', token.substring(0, 20) + '...');
        
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
          console.log('✅ Dashboard Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null, method: 'bearer_token' };
        }
        
        console.log('⚠️ Dashboard token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Dashboard token auth error:', tokenError);
      }
    }
    
    // Method 3: Try with cookie validation
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;
              
              // Validate base64 cookies
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded); // Validate JSON
                  return cookie.value;
                } catch (e) {
                  console.warn(`Invalid dashboard cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
              console.warn(`Error reading dashboard cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Dashboard Auth Method 3 (SSR cookies) succeeded for user:', user.id);
      return { user, error: null, method: 'ssr_cookies' };
    } else {
      console.log('⚠️ Dashboard SSR cookie auth failed:', error?.message);
    }
    
    return { user, error, method: 'none' };
    
  } catch (error) {
    console.error('💥 All dashboard authentication methods failed:', error);
    return { user: null, error, method: 'failed' };
  }
}

// GET /api/dashboard/work-items - Robust authenticated endpoint
export async function GET(request: NextRequest) {
  console.log('🚀 Dashboard API called with robust auth');
  
  try {
    // ✅ Use robust 3-method authentication (same as offer-creator)
    const { user, error: authError, method } = await getAuthenticatedUser(request);

    if (authError || !user) {
      console.error('❌ Dashboard auth failed with all methods:', authError);
      
      // Clear corrupted cookies in response (same as offer-creator)
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED',
          debug: {
            authMethod: method,
       
            hasAuthHeader: !!request.headers.get('authorization')
          }
        },
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

    console.log(`✅ Dashboard user authenticated successfully via ${method}:`, user.id);

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const forceRefresh = searchParams.get('refresh') === 'true';

    console.log(`📡 Fetching work items for user: ${user.id} (workspace: ${workspaceId || 'none'})`);

    // Create authenticated Supabase client for database queries
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    // For now, directly fetch without cache to test basic functionality
    const workItems = await fetchAllWorkItems(user.id, workspaceId, supabase);

    console.log(`✅ Returning ${workItems.length} work items`);

    return NextResponse.json({
      success: true,
      data: {
        items: workItems,
        cached: false, // Not using cache yet
        timestamp: new Date().toISOString(),
        authMethod: method
      }
    });

  } catch (error) {
    console.error('💥 Dashboard API error:', error);
    console.error('💥 Dashboard error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      debug: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// Fresh data fetching function
async function fetchAllWorkItems(userId: string, workspaceId?: string | null, supabase?: any): Promise<WorkItem[]> {
  const items: WorkItem[] = [];
  
  console.log('🔄 Fetching fresh work items from database...');
  console.log('🔍 User ID:', userId);
  console.log('🔍 Workspace ID:', workspaceId);

  // If no supabase client passed, create a new one
  if (!supabase) {
    const cookieStore = cookies();
    supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
  }

  try {
    // Fetch all data sources in parallel for better performance
    const [
      salesCalls,
      growthPlans,
      pricingCalcs,
      nicheReports,
      coldEmails,
      offers
    ] = await Promise.allSettled([
      fetchSalesCalls(userId, workspaceId, supabase),
      fetchGrowthPlans(userId, workspaceId, supabase),
      fetchPricingCalcs(userId, workspaceId, supabase),
      fetchNicheReports(userId, workspaceId, supabase),
      fetchColdEmails(userId, workspaceId, supabase),
      fetchOffers(userId, workspaceId, supabase)
    ]);

    // Process sales calls
    if (salesCalls.status === 'fulfilled') {
      salesCalls.value.forEach((call: any) => {
        items.push(transformSalesCall(call));
      });
      console.log(`📞 Added ${salesCalls.value.length} sales calls`);
    } else {
      console.warn('❌ Sales calls fetch failed:', salesCalls.reason);
    }

    // Process growth plans
    if (growthPlans.status === 'fulfilled') {
      growthPlans.value.forEach((plan: any) => {
        items.push(transformGrowthPlan(plan));
      });
      console.log(`🚀 Added ${growthPlans.value.length} growth plans`);
    } else {
      console.warn('❌ Growth plans fetch failed:', growthPlans.reason);
    }

    // Process pricing calculations
    if (pricingCalcs.status === 'fulfilled') {
      pricingCalcs.value.forEach((calc: any) => {
        items.push(transformPricingCalc(calc));
      });
      console.log(`💰 Added ${pricingCalcs.value.length} pricing calculations`);
    } else {
      console.warn('❌ Pricing calculations fetch failed:', pricingCalcs.reason);
    }

    // Process niche reports
    if (nicheReports.status === 'fulfilled') {
      nicheReports.value.forEach((report: any) => {
        items.push(transformNicheReport(report));
      });
      console.log(`🔬 Added ${nicheReports.value.length} niche reports`);
    } else {
      console.warn('❌ Niche reports fetch failed:', nicheReports.reason);
    }

    // Process cold emails
    if (coldEmails.status === 'fulfilled') {
      coldEmails.value.forEach((email: any) => {
        items.push(transformColdEmail(email));
      });
      console.log(`📧 Added ${coldEmails.value.length} cold emails`);
    } else {
      console.warn('❌ Cold emails fetch failed:', coldEmails.reason);
    }

    // Process offers
    if (offers.status === 'fulfilled') {
      offers.value.forEach((offer: any) => {
        items.push(transformOffer(offer));
      });
      console.log(`✨ Added ${offers.value.length} offers`);
    } else {
      console.warn('❌ Offers fetch failed:', offers.reason);
    }

    // Sort by creation date (newest first)
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`🎉 Total fresh work items: ${items.length}`);
    return items;

  } catch (error) {
    console.error('💥 Error in fetchAllWorkItems:', error);
    throw error;
  }
}

// Individual fetch functions with better error handling
async function fetchSalesCalls(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
  try {
    console.log('📞 Fetching sales calls...');
    
    let query = supabase
      .from('sales_call_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.warn('⚠️ Sales calls fetch error:', error.message);
      return [];
    }
    
    console.log(`✅ Found ${data?.length || 0} sales calls`);
    return data || [];
  } catch (err) {
    console.warn('⚠️ Sales calls fetch exception:', err);
    return [];
  }
}

async function fetchGrowthPlans(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
  try {
    console.log('🚀 Fetching growth plans...');
    
    let query = supabase
      .from('growth_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.warn('⚠️ Growth plans fetch error:', error.message);
      return [];
    }
    
    console.log(`✅ Found ${data?.length || 0} growth plans`);
    return data || [];
  } catch (err) {
    console.warn('⚠️ Growth plans fetch exception:', err);
    return [];
  }
}

async function fetchPricingCalcs(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
  try {
    console.log('💰 Fetching pricing calculations...');
    
    let query = supabase
      .from('pricing_calculations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.warn('⚠️ Pricing calculations fetch error:', error.message);
      return [];
    }
    
    console.log(`✅ Found ${data?.length || 0} pricing calculations`);
    return data || [];
  } catch (err) {
    console.warn('⚠️ Pricing calculations fetch exception:', err);
    return [];
  }
}

async function fetchNicheReports(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
  try {
    console.log('🔬 Fetching niche reports...');
    
    let query = supabase
      .from('niche_research_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.warn('⚠️ Niche reports fetch error:', error.message);
      return [];
    }
    
    console.log(`✅ Found ${data?.length || 0} niche reports`);
    return data || [];
  } catch (err) {
    console.warn('⚠️ Niche reports fetch exception:', err);
    return [];
  }
}

async function fetchColdEmails(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
  try {
    console.log('📧 Fetching cold emails...');
    
    let query = supabase
      .from('cold_email_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.warn('⚠️ Cold emails fetch error:', error.message);
      return [];
    }
    
    console.log(`✅ Found ${data?.length || 0} cold emails`);
    return data || [];
  } catch (err) {
    console.warn('⚠️ Cold emails fetch exception:', err);
    return [];
  }
}

async function fetchOffers(userId: string, workspaceId?: string | null, supabase?: any): Promise<any[]> {
  try {
    console.log('✨ Fetching offers...');
    
    let query = supabase
      .from('signature_offers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.warn('⚠️ Offers fetch error:', error.message);
      return [];
    }
    
    console.log(`✅ Found ${data?.length || 0} offers`);
    return data || [];
  } catch (err) {
    console.warn('⚠️ Offers fetch exception:', err);
    return [];
  }
}

// Transform functions
function transformSalesCall(call: any): WorkItem {
  return {
    id: `sales-call-${call.id}`,
    type: 'sales-call',
    title: call.title || 'Sales Call Analysis',
    subtitle: `${call.prospect_name || 'Unknown'} • ${call.company_name || 'Company'}`,
    status: 'completed',
    createdAt: call.created_at || new Date().toISOString(),
    metadata: {
      duration: call.duration || 'N/A',
      callType: call.call_type || 'unknown',
      company: call.company_name,
      prospect: call.prospect_name,
      sentiment: call.sentiment || 'neutral',
      score: call.score || null
    },
    actions: ['view', 'export', 'delete'],
    rawData: call
  };
}

function transformGrowthPlan(plan: any): WorkItem {
  const metadata = typeof plan.metadata === 'string' 
    ? JSON.parse(plan.metadata) 
    : plan.metadata || {};

  return {
    id: `growth-plan-${plan.id}`,
    type: 'growth-plan',
    title: plan.title || 'Growth Plan',
    subtitle: `${metadata.clientCompany || 'Company'} • ${metadata.industry || 'Industry'}`,
    status: 'completed',
    createdAt: plan.created_at || new Date().toISOString(),
    metadata: {
      industry: metadata.industry,
      timeframe: metadata.timeframe,
      strategies: metadata.strategies?.length || 0,
      tokensUsed: metadata.tokensUsed || 0,
      clientCompany: metadata.clientCompany
    },
    actions: ['view', 'export', 'edit', 'delete'],
    rawData: plan
  };
}

function transformPricingCalc(calc: any): WorkItem {
  return {
    id: `pricing-calc-${calc.id}`,
    type: 'pricing-calc',
    title: calc.title || calc.project_name || 'Pricing Calculation',
    subtitle: `${calc.client_name || 'Client'} • $${calc.recommended_retainer?.toLocaleString() || '0'}`,
    status: 'completed',
    createdAt: calc.created_at || new Date().toISOString(),
    metadata: {
      clientName: calc.client_name,
      projectName: calc.project_name,
      annualSavings: calc.annual_savings,
      recommendedRetainer: calc.recommended_retainer,
      hourlyRate: calc.hourly_rate,
      roiPercentage: calc.roi_percentage,
      industry: calc.industry
    },
    actions: ['view', 'export', 'duplicate', 'delete'],
    rawData: calc
  };
}

function transformNicheReport(report: any): WorkItem {
  return {
    id: `niche-research-${report.id}`,
    type: 'niche-research',
    title: report.title || 'Niche Research Report',
    subtitle: `${report.niche_name} • ${report.market_type}`,
    status: 'completed',
    createdAt: report.created_at || new Date().toISOString(),
    metadata: {
      nicheName: report.niche_name,
      marketSize: report.market_size,
      primaryObjective: report.primary_objective,
      marketType: report.market_type,
      budget: report.budget,
      tokensUsed: report.tokens_used
    },
    actions: ['view', 'export', 'update', 'delete'],
    rawData: report
  };
}

function transformColdEmail(email: any): WorkItem {
  const emailData = typeof email.emails === 'string' 
    ? JSON.parse(email.emails) 
    : email.emails || [];

  return {
    id: `cold-email-${email.id}`,
    type: 'cold-email',
    title: email.title || 'Cold Email Campaign',
    subtitle: `${emailData.length || 0} emails • ${email.industry || 'General'}`,
    status: 'completed',
    createdAt: email.created_at || new Date().toISOString(),
    metadata: {
      emailCount: emailData.length || 0,
      industry: email.industry,
      tone: email.tone,
      method: email.method,
      firstName: email.first_name
    },
    actions: ['view', 'copy', 'optimize', 'delete'],
    rawData: email
  };
}

function transformOffer(offer: any): WorkItem {
  const offerData = typeof offer.offer_data === 'string' 
    ? JSON.parse(offer.offer_data) 
    : offer.offer_data || {};

  return {
    id: `offer-creator-${offer.id}`,
    type: 'offer-creator',
    title: offer.title || 'Signature Offers',
    subtitle: `${offer.industry || 'General'} • ${offerData.packages?.length || 3} Packages`,
    status: 'completed',
    createdAt: offer.created_at || new Date().toISOString(),
    metadata: {
      industry: offer.industry,
      packages: offerData.packages?.length || 0,
      priceRange: offerData.priceRange,
      deliveryModel: offerData.deliveryModel,
      targetMarket: offer.target_market
    },
    actions: ['view', 'export', 'optimize', 'delete'],
    rawData: offer
  };
}