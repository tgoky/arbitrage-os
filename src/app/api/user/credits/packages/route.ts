// app/api/credits/packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CreditsService } from '@/services/credits.service';

export async function GET(req: NextRequest) {
  console.log('Credit Packages API called');
  
  try {
    const packages = CreditsService.getCreditPackages();
    
    return NextResponse.json({
      success: true,
      data: packages
    });

  } catch (error) {
    console.error('Credit Packages API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch credit packages',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}