// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      openrouter: {
        configured: !!process.env.OPENROUTER_API_KEY,
        status: process.env.OPENROUTER_API_KEY ? 'ready' : 'not_configured'
      }
    },
    environment: process.env.NODE_ENV
  };

  return NextResponse.json(healthData);
}