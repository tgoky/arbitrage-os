// app/api/offer-creator/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../../services/offerCreator.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const offerId = params.id;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const offerService = new OfferCreatorService();
    const exportData = await offerService.exportOffer(user.id, offerId, format as 'json' | 'html');

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData.content
      });
    }

    // For HTML format, return as downloadable file
    return new NextResponse(exportData.content as string, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${exportData.filename}"`
      }
    });

  } catch (error) {
    console.error('Offer Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to export offer' },
      { status: 500 }
    );
  }
}