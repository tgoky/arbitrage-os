// app/api/test-pricing-service/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🧪 Testing actual pricing service...');
  
  try {
    // Test the actual PricingCalculatorService
    console.log('📦 Importing PricingCalculatorService...');
    const { PricingCalculatorService } = await import('@/services/pricingCalculator.service');
    console.log('✅ Service imported successfully');
    
    // Create service instance
    console.log('🏗️ Creating service instance...');
    const service = new PricingCalculatorService();
    console.log('✅ Service instance created');
    
    // Test input
    const testInput = {
      userId: 'test-user',
      annualSavings: 120000,
      hoursPerWeek: 20,
      roiMultiple: 4,
      clientName: 'Test Client',
      projectName: 'Test Project',
      industry: 'Technology',
      experienceLevel: 'intermediate' as const
    };
    
    console.log('🎯 Calling generatePricingPackage...');
    const result = await service.generatePricingPackage(testInput);
    console.log('✅ Pricing package generated successfully:', {
      tokensUsed: result.tokensUsed,
      generationTime: result.generationTime,
      hasCalculations: !!result.calculations,
      hasStrategy: !!result.strategy,
      recommendedRetainer: result.calculations?.recommendedRetainer
    });
    
    return NextResponse.json({
      success: true,
      message: 'Pricing service working perfectly!',
      debug: {
        tokensUsed: result.tokensUsed,
        generationTime: result.generationTime,
        recommendedRetainer: result.calculations?.recommendedRetainer,
        roiPercentage: result.calculations?.roiPercentage
      }
    });
    
  } catch (error: unknown) {
    console.error('❌ Service test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack?.substring(0, 1000) : 'No stack trace';
    
    return NextResponse.json({
      error: 'Pricing service failed',
      debug: {
        message: errorMessage,
        stack: errorStack,
        errorType: typeof error
      }
    }, { status: 500 });
  }
}