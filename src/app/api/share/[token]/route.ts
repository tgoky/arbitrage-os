// app/api/share/[token]/route.ts
// Public endpoint - no authentication required.
// Fetches a shared sales call analysis by its share token.
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token || token.length < 10 || token.length > 50) {
      return NextResponse.json({ success: false, error: 'Invalid share token' }, { status: 400 });
    }

    // Rate limit by IP to prevent abuse on this public endpoint
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(`share_view:${ip}`, 60, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { prisma } = await import('@/lib/prisma');

    // Find the deliverable with this share token in its metadata
    // Prisma JSON filtering: look for shareToken inside metadata
    const deliverable = await prisma.deliverable.findFirst({
      where: {
        type: { in: ['sales_call_analysis', 'sales_call'] },
        metadata: {
          path: ['shareToken'],
          equals: token,
        },
      },
    });

    if (!deliverable) {
      return NextResponse.json({ success: false, error: 'Shared analysis not found or link has expired' }, { status: 404 });
    }

    // Parse the analysis content
    let analysisContent;
    try {
      analysisContent = JSON.parse(deliverable.content);
    } catch {
      return NextResponse.json({ success: false, error: 'Failed to parse analysis data' }, { status: 500 });
    }

    const metadata = deliverable.metadata as any;

    // Return sanitized data (exclude internal fields like user_id, workspace details)
    return NextResponse.json({
      success: true,
      data: {
        id: deliverable.id,
        title: deliverable.title,
        analysis: analysisContent,
        metadata: {
          callType: metadata?.callType,
          duration: metadata?.duration,
          sentiment: metadata?.sentiment,
          overallScore: metadata?.overallScore,
          companyName: metadata?.companyName,
          prospectName: metadata?.prospectName,
          prospectTitle: metadata?.prospectTitle,
          companyIndustry: metadata?.companyIndustry,
          companyLocation: metadata?.companyLocation,
          generatedAt: metadata?.generatedAt,
          participantCount: metadata?.participantCount,
          questionCount: metadata?.questionCount,
          engagementScore: metadata?.engagementScore,
        },
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        sharedAt: metadata?.sharedAt,
      },
    });
  } catch (error) {
    console.error('Share view error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load shared analysis' }, { status: 500 });
  }
}