// app/api/offer-creator/[id]/route.ts - UPDATED TO MATCH NEW STRUCTURE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../services/offerCreator.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ApiResponse } from '@/types/offerCreator';

const RATE_LIMITS = {
  OFFER_GET: {
    limit: 100,
    window: 3600 // 1 hour
  },
  OFFER_DELETE: {
    limit: 20,
    window: 3600 // 1 hour
  }
};

// ✅ Enhanced authentication function (matches other routes)
// Use this IMPROVED 3-method approach in ALL routes
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header (most reliable for API calls)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: { get: () => undefined },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('Token auth failed:', tokenError);
      }
    }
    
    // Method 2: SSR cookies (FIXED cookie handling)
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              try {
                const cookie = cookieStore.get(name);
                if (!cookie?.value) return undefined;
                
                // FIXED: Proper base64 cookie handling
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded); // Validate it's valid JSON
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
                    return undefined; // Skip corrupted cookies
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
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client (fallback)
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (routeError) {
      console.warn('Route handler auth failed:', routeError);
    }
    
    return { user: null, error: new Error('All authentication methods failed') };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error };
  }
}

function isOfferExpired(expiryDate: string): boolean {
  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return expiry <= now;
  } catch (error) {
    console.warn('Error parsing expiry date:', expiryDate);
    return false;
  }
}

// GET method for retrieving a specific signature offer
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Signature Offer Get API called for offer:', params.id);

    // ✅ Enhanced authentication
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      console.error('❌ Auth failed in offer get:', authError);
      
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

    console.log('✅ User authenticated successfully:', user.id);

    // Rate limiting for individual offer fetches
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `signature_offer_get:${user.id}`,
      RATE_LIMITS.OFFER_GET.limit,
      RATE_LIMITS.OFFER_GET.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Offer fetch rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.reset
        } as ApiResponse<never>,
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    const offerId = params.id;
    
    // Validate offer ID format
    if (!offerId || offerId.length < 10) {
      console.error('❌ Invalid offer ID:', offerId);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid offer ID format' 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // ✅ Get signature offer with error handling
    console.log('📋 Fetching signature offer:', offerId);
    let offer;
    try {
      const offerService = new OfferCreatorService();
      offer = await offerService.getOffer(user.id, offerId);
      
      if (!offer) {
        console.log('❌ Offer not found:', offerId);
        return NextResponse.json(
          { 
            success: false,
            error: 'Signature offer not found or access denied',
            code: 'OFFER_NOT_FOUND'
          } as ApiResponse<never>,
          { status: 404 }
        );
      }
      
      console.log('✅ Signature offer retrieved successfully');
    } catch (fetchError) {
      console.error('💥 Error fetching offer:', fetchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch signature offer. Please try again.',
          debug: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // Check expiry status and extract metadata
    const metadata = offer.metadata as any || {};
    const expired = metadata.expiryDate ? isOfferExpired(metadata.expiryDate) : false;
    
    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    if (metadata.expiryDate && !expired) {
      try {
        daysUntilExpiry = Math.ceil(
          (new Date(metadata.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
      } catch (error) {
        console.warn('Error calculating days until expiry:', error);
      }
    }

    // ✅ Log usage for signature offer view with enhanced metadata
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offer_view',
        tokens: 0, // No AI tokens for viewing
        timestamp: new Date(),
        metadata: {
          offerId,
          expired,
          action: 'view',
          offerDetails: {
            targetMarket: metadata.targetMarket,
            industries: metadata.industries || [],
            deliveryModels: metadata.deliveryModels || [],
            pricePosture: metadata.pricePosture,
            brandTone: metadata.brandTone,
            positioning: metadata.positioning,
            hasExpiryDate: !!metadata.expiryDate,
            daysUntilExpiry,
            conversionScore: metadata.conversionScore || 0,
            tokensUsed: metadata.tokensUsed || 0,
            generationTime: metadata.generationTime || 0
          }
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Signature offer fetch completed successfully');
    return NextResponse.json({
      success: true,
      data: {
        ...offer,
        expired,
        daysUntilExpiry
      },
      meta: {
        offerId,
        remaining: rateLimitResult.remaining,
        lastAccessed: new Date().toISOString()
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('💥 Unexpected Signature Offer Fetch Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch signature offer. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

// DELETE method for removing a signature offer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Signature Offer Delete API called for offer:', params.id);

    // ✅ Enhanced authentication
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      console.error('❌ Auth failed in offer delete:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        } as ApiResponse<never>,
        { status: 401 }
      );
    }

    console.log('✅ User authenticated successfully:', user.id);

    // Rate limiting for offer deletions
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `signature_offer_delete:${user.id}`,
      RATE_LIMITS.OFFER_DELETE.limit,
      RATE_LIMITS.OFFER_DELETE.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Offer deletion rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.reset
        } as ApiResponse<never>,
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    const offerId = params.id;
    
    // Validate offer ID format
    if (!offerId || offerId.length < 10) {
      console.error('❌ Invalid offer ID:', offerId);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid offer ID format' 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // ✅ Delete signature offer with error handling
    console.log('🗑️ Deleting signature offer:', offerId);
    let deleted: boolean;
    try {
      const offerService = new OfferCreatorService();
      deleted = await offerService.deleteOffer(user.id, offerId);
      
      if (!deleted) {
        console.log('❌ Offer not found for deletion:', offerId);
        return NextResponse.json(
          { 
            success: false,
            error: 'Signature offer not found or access denied',
            code: 'OFFER_NOT_FOUND'
          } as ApiResponse<never>,
          { status: 404 }
        );
      }
      
      console.log('✅ Signature offer deleted successfully');
    } catch (deleteError) {
      console.error('💥 Error deleting offer:', deleteError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete signature offer. Please try again.',
          debug: deleteError instanceof Error ? deleteError.message : 'Unknown delete error'
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // ✅ Log usage for signature offer deletion
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offer_delete',
        tokens: 0, // No AI tokens for deletion
        timestamp: new Date(),
        metadata: {
          offerId,
          action: 'delete',
          deletedAt: new Date().toISOString()
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Signature offer deletion completed successfully');
    return NextResponse.json({
      success: true,
      data: { deleted: true },
      meta: {
        offerId,
        remaining: rateLimitResult.remaining,
        deletedAt: new Date().toISOString()
      }
    } as ApiResponse<{ deleted: boolean }>);

  } catch (error) {
    console.error('💥 Unexpected Signature Offer Delete Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete signature offer. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}