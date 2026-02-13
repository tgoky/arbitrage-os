// app/api/sales-call-analyzer/share/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import crypto from 'crypto';

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { user: null, error: error || new Error('No user found') };
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

// POST - Create or retrieve a share token for an analysis
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const rateLimitResult = await rateLimit(`sales_call_share:${user.id}`, 30, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded', retryAfter: rateLimitResult.reset }, { status: 429 });
    }

    const analysisId = params.id;
    const { prisma } = await import('@/lib/prisma');

    // Find the deliverable belonging to this user
    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id: analysisId,
        user_id: user.id,
        type: 'sales_call_analysis',
      },
    });

    if (!deliverable) {
      return NextResponse.json({ success: false, error: 'Analysis not found' }, { status: 404 });
    }

    const metadata = (deliverable.metadata as any) || {};

    // If a share token already exists, return it
    if (metadata.shareToken) {
      const shareUrl = `${getBaseUrl(req)}/share/${metadata.shareToken}`;
      return NextResponse.json({
        success: true,
        data: {
          shareToken: metadata.shareToken,
          shareUrl,
          createdAt: metadata.sharedAt,
        },
      });
    }

    // Generate a new share token (URL-safe, 16 bytes = 22 chars base64url)
    const shareToken = crypto.randomBytes(16).toString('base64url');

    // Store the share token in the deliverable's metadata
    await prisma.deliverable.update({
      where: { id: analysisId },
      data: {
        metadata: {
          ...metadata,
          shareToken,
          sharedAt: new Date().toISOString(),
          sharedBy: user.id,
        },
      },
    });

    await logUsage({
      userId: user.id,
      feature: 'sales_call_share',
      tokens: 0,
      timestamp: new Date(),
      metadata: { analysisId, action: 'create_share_link' },
    });

    const shareUrl = `${getBaseUrl(req)}/share/${shareToken}`;

    return NextResponse.json({
      success: true,
      data: {
        shareToken,
        shareUrl,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Share creation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create share link' }, { status: 500 });
  }
}

// DELETE - Revoke a share token
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const analysisId = params.id;
    const { prisma } = await import('@/lib/prisma');

    const deliverable = await prisma.deliverable.findFirst({
      where: { id: analysisId, user_id: user.id, type: 'sales_call_analysis' },
    });

    if (!deliverable) {
      return NextResponse.json({ success: false, error: 'Analysis not found' }, { status: 404 });
    }

    const metadata = (deliverable.metadata as any) || {};

    // Remove share token from metadata
    const { shareToken, sharedAt, sharedBy, ...restMetadata } = metadata;

    await prisma.deliverable.update({
      where: { id: analysisId },
      data: { metadata: restMetadata },
    });

    return NextResponse.json({ success: true, message: 'Share link revoked' });
  } catch (error) {
    console.error('Share revoke error:', error);
    return NextResponse.json({ success: false, error: 'Failed to revoke share link' }, { status: 500 });
  }
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}