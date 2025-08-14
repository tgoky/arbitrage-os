// app/api/pricing-calculator/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PricingCalculatorService } from '@/services/pricingCalculator.service';
import { validatePricingCalculatorInput } from '../../../validators/pricingCalculator.validator';

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

    const calculationId = params.id;
    const pricingService = new PricingCalculatorService();
    const calculation = await pricingService.getPricingCalculation(user.id, calculationId);

    if (!calculation) {
      return NextResponse.json(
        { error: 'Pricing calculation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: calculation
    });

  } catch (error) {
    console.error('Calculation Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing calculation' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const calculationId = params.id;
    const body = await req.json();

    // Validate partial input for updates
    const validation = validatePricingCalculatorInput(body, true); // partial validation
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const pricingService = new PricingCalculatorService();
    const updatedCalculation = await pricingService.updatePricingCalculation(user.id, calculationId, validation.data);

    return NextResponse.json({
      success: true,
      data: updatedCalculation
    });

  } catch (error) {
    console.error('Calculation Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing calculation' },
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

    const calculationId = params.id;
    const { prisma } = await import('@/lib/prisma');
    
    const result = await prisma.deliverable.deleteMany({
      where: {
        id: calculationId,
        user_id: user.id,
        type: 'pricing_calculator'
      }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Pricing calculation not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing calculation deleted successfully'
    });

  } catch (error) {
    console.error('Calculation Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete pricing calculation' },
      { status: 500 }
    );
  }
}