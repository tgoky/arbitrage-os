// app/api/test-models/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🧪 Testing OpenRouter models...');
  
  const { OpenRouterClient } = await import('@/lib/openrouter');
  const client = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
  
  // Test different model names
  const modelsToTest = [
    'anthropic/claude-3-sonnet',
    'anthropic/claude-3-sonnet-20240229',
    'anthropic/claude-3-haiku',
    'anthropic/claude-3-haiku-20240307',
    'openai/gpt-3.5-turbo',
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.1-8b-instruct'
  ];
  
  const results = [];
  
  for (const model of modelsToTest) {
    try {
      console.log(`Testing model: ${model}`);
      const response = await client.complete({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello" in JSON format: {"message": "Hello"}'
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      });
      
      results.push({
        model,
        status: 'success',
        tokensUsed: response.usage?.total_tokens,
        response: response.content?.substring(0, 100)
      });
      
      console.log(`✅ ${model} works`);
      break; // If we find a working model, use it
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        model,
        status: 'failed',
        error: errorMessage
      });
      console.log(`❌ ${model} failed: ${errorMessage}`);
    }
  }
  
  return NextResponse.json({
    results,
    workingModels: results.filter(r => r.status === 'success'),
    failedModels: results.filter(r => r.status === 'failed')
  });
}