// app/api/sales-call-analyzer/test-service/route.ts
import { NextResponse } from 'next/server';
import { SalesCallAnalyzerService } from '@/services/salesCallAnalyzer.service';

export async function POST() {
  console.log('🧪 Testing sales call analyzer service...');
  
  try {
    const service = new SalesCallAnalyzerService();
    console.log('  Service instantiated');
    
    const testInput = {
      title: 'Test Discovery Call',
      callType: 'discovery' as const,
      transcript: 'Speaker 1: Hello, thanks for joining. Speaker 2: Happy to be here. Speaker 1: Tell me about your current solution. Speaker 2: We are using an outdated system that requires manual data entry.',
      userId: 'test-user-123'
    };
    
    console.log('🧪 Test input prepared');
    console.log('🧪 Calling analyzeCall...');
    
    const result = await service.analyzeCall(testInput);
    
    console.log('  Analysis completed');
    console.log('📊 Result keys:', Object.keys(result));
    
    return NextResponse.json({
      success: true,
      message: 'Service test passed',
      tokensUsed: result.tokensUsed,
      processingTime: result.processingTime,
      hasCallResults: !!result.callResults,
      overallScore: result.callResults?.analysis?.overallScore
    });
    
  } catch (error) {
    console.error('  Service test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}