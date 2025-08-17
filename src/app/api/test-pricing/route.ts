// app/api/test-pricing/route.ts - MINIMAL DEBUG VERSION
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🧪 Starting minimal pricing test...');
  
  try {
    // Test 1: Environment Variables
    console.log('🔑 Testing environment variables...');
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const redisUrl = process.env.UPSTASH_REDIS_URL;
    const redisToken = process.env.UPSTASH_REDIS_TOKEN;
    
    console.log('Environment check:', {
      hasOpenRouterKey: !!openRouterKey,
      openRouterKeyLength: openRouterKey?.length,
      hasRedisUrl: !!redisUrl,
      hasRedisToken: !!redisToken
    });
    
    if (!openRouterKey) {
      return NextResponse.json({
        error: 'Missing OPENROUTER_API_KEY environment variable',
        debug: 'Check your .env.local file'
      }, { status: 500 });
    }
    
    // Test 2: OpenRouter Client Import
    console.log('📦 Testing OpenRouter import...');
    try {
      const { OpenRouterClient } = await import('@/lib/openrouter');
      console.log('✅ OpenRouter import successful');
      
      const client = new OpenRouterClient(openRouterKey);
      console.log('✅ OpenRouter client created');
      
      // Test 3: Simple API Call
      console.log('🤖 Testing OpenRouter API call...');
      const response = await client.complete({
        model: 'anthropic/claude-3-haiku', // Use cheaper model for testing
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, this is a test" and return valid JSON: {"test": true}'
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      });
      
      console.log('✅ OpenRouter API call successful:', {
        contentLength: response.content?.length,
        tokensUsed: response.usage?.total_tokens
      });
      
      return NextResponse.json({
        success: true,
        message: 'All tests passed!',
        debug: {
          openRouterWorking: true,
          apiResponse: response.content?.substring(0, 100) + '...',
          tokensUsed: response.usage?.total_tokens
        }
      });
      
    } catch (openRouterError: unknown) {
      console.error('❌ OpenRouter error:', openRouterError);
      const errorMessage = openRouterError instanceof Error ? openRouterError.message : 'Unknown OpenRouter error';
      const errorStack = openRouterError instanceof Error ? openRouterError.stack?.substring(0, 500) : 'No stack trace';
      
      return NextResponse.json({
        error: 'OpenRouter client failed',
        debug: {
          message: errorMessage,
          stack: errorStack,
          errorType: typeof openRouterError
        }
      }, { status: 500 });
    }
    
  } catch (generalError: unknown) {
    console.error('❌ General error:', generalError);
    const errorMessage = generalError instanceof Error ? generalError.message : 'Unknown general error';
    const errorStack = generalError instanceof Error ? generalError.stack?.substring(0, 500) : 'No stack trace';
    
    return NextResponse.json({
      error: 'Test failed',
      debug: {
        message: errorMessage,
        stack: errorStack,
        errorType: typeof generalError
      }
    }, { status: 500 });
  }
}