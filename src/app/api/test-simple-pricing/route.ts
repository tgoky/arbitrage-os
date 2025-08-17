// app/api/test-simple-pricing/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🧪 Testing simplified pricing service...');
  
  try {
    const { OpenRouterClient } = await import('@/lib/openrouter');
    const client = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    
    // Test with a much simpler prompt
    const testInput = {
      annualSavings: 120000,
      hoursPerWeek: 20,
      roiMultiple: 4,
      clientName: 'Test Client'
    };
    
    const monthlySavings = testInput.annualSavings / 12;
    const recommendedRetainer = (monthlySavings * testInput.roiMultiple) / 100;
    
    // Simple, short prompt
    const prompt = `Create a pricing strategy for:
- Client: ${testInput.clientName}
- Annual Savings: $${testInput.annualSavings}
- Monthly Retainer: $${recommendedRetainer}
- Hours/Week: ${testInput.hoursPerWeek}

Return JSON with calculations, strategy, and benchmarks.`;
    
    console.log('🤖 Testing OpenRouter with simple prompt...');
    console.log('Prompt length:', prompt.length);
    
    const response = await client.complete({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content: 'You are a pricing strategist. Return valid JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000 // Reduced from 4000
    });
    
    console.log('✅ Simple prompt worked:', {
      tokensUsed: response.usage?.total_tokens,
      contentLength: response.content?.length
    });
    
    return NextResponse.json({
      success: true,
      message: 'Simple pricing prompt works!',
      debug: {
        promptLength: prompt.length,
        tokensUsed: response.usage?.total_tokens,
        responseLength: response.content?.length,
        responsePreview: response.content?.substring(0, 200) + '...'
      }
    });
    
  } catch (error: unknown) {
    console.error('❌ Simple test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack?.substring(0, 1000) : 'No stack trace';
    
    return NextResponse.json({
      error: 'Simple test failed',
      debug: {
        message: errorMessage,
        stack: errorStack
      }
    }, { status: 500 });
  }
}