// app/api/ad-writer/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { AdWriterService } from '@/services/adWriter.service';
import { validateAdWriterInput } from '@/app/validators/adWriter.validator';
import { rateLimit } from '../../../lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { convertToPlatforms, type Platform } from '@/types/adWriter'; // ✅ Import the helper function

// EXACT COPY of pricing calculator's robust authentication function
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
      
      console.log('Route handler auth failed:', error);
    } catch (helperError) {
      console.warn('Route handler client failed:', helperError);
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
        
        console.log('Token auth failed:', error);
      } catch (tokenError) {
        console.warn('Token auth error:', tokenError);
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
                  console.warn(`Invalid cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
              console.warn(`Error reading cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    return { user, error };
    
  } catch (error) {
    console.error('All authentication methods failed:', error);
    return { user: null, error };
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== AD WRITER API START ===');
    
    // Use EXACT SAME robust authentication as pricing calculator
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('Auth failed in ad writer:', authError);
      
      // Clear corrupted cookies in response (EXACT SAME as pricing calculator)
      const response = NextResponse.json(
        { 
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies (EXACT SAME as pricing calculator)
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
    
    console.log('User authenticated:', user.id);

    // ✅ RATE LIMITING for ad generation (same pattern as pricing calculator)
    const rateLimitResult = await rateLimit(
      `ad_writer:${user.id}`,
      25, // 25 ad generations per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          error: 'Too many ad generation requests. You can generate 25 ads per hour.',
          retryAfter: rateLimitResult.reset,
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const validation = validateAdWriterInput(body);
    
    if (!validation.success) {
      console.error('Validation failed:', validation.errors);
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.errors,
          received: body
        },
        { status: 400 }
      );
    }

    if (!validation.data) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    console.log('Validation passed');

    // ✅ GET USER'S WORKSPACE with error handling (EXACT SAME as pricing calculator)
    let workspace;
    try {
      workspace = await prisma.workspace.findFirst({
        where: { user_id: user.id }
      });

      if (!workspace) {
        console.log('Creating default workspace for user');
        workspace = await prisma.workspace.create({
          data: {
            user_id: user.id,
            name: 'Default Workspace',
            slug: 'default',
            description: 'Default workspace for ad campaigns'
          }
        });
      }
    } catch (dbError) {
      console.error('Database error getting/creating workspace:', dbError);
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Using workspace:', workspace.id);

    // ✅ FIXED: Convert string platforms to Platform type and prepare data for ad generation service
    const validatedPlatforms = convertToPlatforms(validation.data.activePlatforms || []);
    
    const adGenerationInput = {
      ...validation.data,
      userId: user.id,
      platforms: validatedPlatforms // ✅ Now properly typed as Platform[]
    };

    console.log('Calling AdWriterService with:', JSON.stringify(adGenerationInput, null, 2));

    // ✅ SERVICE HANDLES BOTH GENERATION AND STORAGE with error handling (same pattern as pricing calculator)
    let result;
    let deliverableId;
    
    try {
      const adWriterService = new AdWriterService();
      
      // Generate and save the ads
      result = await adWriterService.generateAndSaveAds(
        adGenerationInput,
        user.id,
        workspace.id
      );
      
      deliverableId = result.deliverableId;
    } catch (serviceError) {
      console.error('Service error:', serviceError);
      return NextResponse.json(
        { error: 'Failed to generate ads. Please try again.' },
        { status: 500 }
      );
    }

    console.log('AdWriterService result:', {
      deliverableId: result.deliverableId,
      adsCount: result.ads.length,
      tokensUsed: result.tokensUsed,
      generationTime: result.generationTime
    });

    // ✅ LOG USAGE for analytics/billing with error handling (same pattern as pricing calculator)
    try {
      await logUsage({
        userId: user.id,
        feature: 'ad_writer',
        tokens: result.tokensUsed,
        timestamp: new Date(),
        metadata: {
          deliverableId: result.deliverableId,
          businessName: validation.data.businessName,
          offerName: validation.data.offerName,
          platforms: validation.data.activePlatforms || [],
          adCount: result.ads.length
        }
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Usage logging failed:', logError);
    }

    console.log('Usage logged successfully');

    // Return successful response (same format as pricing calculator)
    const response = {
      success: true,
      data: {
        campaignId: result.deliverableId,
        ads: result.ads
      },
      meta: {
        tokensUsed: result.tokensUsed,
        generationTime: result.generationTime,
        remaining: rateLimitResult.remaining
      }
    };

    console.log('Sending success response');
    console.log('=== AD WRITER API END ===');

    return NextResponse.json(response);

  } catch (error) {
    console.error('=== AD WRITER API ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Failed to generate ads. Please try again.',
        debug: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? error.constructor.name : typeof error
        } : undefined
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    service: 'ad-writer',
    timestamp: new Date().toISOString()
  });
}