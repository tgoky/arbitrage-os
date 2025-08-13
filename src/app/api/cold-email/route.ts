// app/api/cold-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ColdEmailService } from '@/services/coldEmail.service';
import { validateColdEmailInput } from '../../validators/coldEmail.validator';
import { rateLimit } from '../../../lib/rateLimit';
import { logUsage } from '@/lib/usage';

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting - 20 emails per minute
    const rateLimitResult = await rateLimit(user.id, 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateColdEmailInput(body);
        
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    // Ensure validation.data exists (TypeScript guard)
    if (!validation.data) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Generate emails using service
    const coldEmailService = new ColdEmailService();
    const generatedEmails = await coldEmailService.generateEmails({
      ...validation.data,
      userId: user.id
    });

    // Log usage for analytics/billing
    await logUsage({
      userId: user.id,
      feature: 'cold_email',
      tokens: generatedEmails.tokensUsed,
      timestamp: new Date(),
      metadata: {
        method: validation.data.method,
        count: generatedEmails.emails.length
      }
    });

    return NextResponse.json({
      success: true,
      data: generatedEmails.emails,
      meta: {
        tokensUsed: generatedEmails.tokensUsed,
        generationTime: generatedEmails.generationTime,
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });
   } catch (error) {
    console.error('Cold Email API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate emails. Please try again.' },
      { status: 500 }
    );
  }
}