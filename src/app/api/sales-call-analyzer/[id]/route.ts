// app/api/sales-call-analyzer/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '@/services/salesCallAnalyzer.service';
import { validateSalesCallInput } from '../../../validators/salesCallAnalyzer.validator';

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

    const analysisId = params.id;
    const analyzerService = new SalesCallAnalyzerService();
    const analysis = await analyzerService.getCallAnalysis(user.id, analysisId);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Call analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Analysis Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call analysis' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const analysisId = params.id;
    const body = await req.json();

    const validation = validateSalesCallInput(body, true); // partial validation
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const analyzerService = new SalesCallAnalyzerService();
    const updatedAnalysis = await analyzerService.updateCallAnalysis(user.id, analysisId, validation.data);

    return NextResponse.json({
      success: true,
      data: updatedAnalysis
    });

  } catch (error) {
    console.error('Analysis Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update call analysis' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const analysisId = params.id;
    const analyzerService = new SalesCallAnalyzerService();
    const deleted = await analyzerService.deleteCallAnalysis(user.id, analysisId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Call analysis not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Call analysis deleted successfully'
    });

  } catch (error) {
    console.error('Analysis Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete call analysis' },
      { status: 500 }
    );
  }
}