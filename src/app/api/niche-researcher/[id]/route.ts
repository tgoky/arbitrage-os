
// app/api/niche-research/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NicheResearcherService } from '@/services/nicheResearcher.service';

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

    const reportId = params.id;
    const nicheService = new NicheResearcherService();
    const report = await nicheService.getNicheReport(user.id, reportId);

    if (!report) {
      return NextResponse.json(
        { error: 'Niche research report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Niche Report Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch niche research report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const reportId = params.id;
    const { prisma } = await import('@/lib/prisma');
    
    const result = await prisma.deliverable.deleteMany({
      where: {
        id: reportId,
        user_id: user.id,
        type: 'niche_research'
      }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Niche research report not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Niche research report deleted successfully'
    });

  } catch (error) {
    console.error('Niche Report Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete niche research report' },
      { status: 500 }
    );
  }
}
