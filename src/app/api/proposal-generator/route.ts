// app/api/proposal-generator/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ProposalGeneratorService } from '../../../services/proposalGenerator.service';
import { validateProposalGeneratorInput } from '../../validators/proposalGenerator.validator';

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { user: null, error: error || new Error('No user found') };
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function POST(request: NextRequest) {
  console.log('🎯 Proposal Generator API Route called');

  try {
    // Authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    console.log('✅ User authenticated:', user.id);

    // Rate limiting
    const rateLimitResult = await rateLimit(`proposal_gen:${user.id}`, 50, 3600);
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded');
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate input with Zod
    console.log('🔍 Validating input...');
    const validation = validateProposalGeneratorInput(body);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.errors);
      return NextResponse.json(
        { success: false, error: 'Invalid input', data: validation.errors },
        { status: 400 }
      );
    }
    console.log('✅ Validation passed');

    // Generate via service
    console.log('🤖 Generating Gamma prompt via AI service...');
    const service = new ProposalGeneratorService();
    const output = await service.generateGammaPrompt(validation.data);
    console.log('✅ Prompt generated in', output.processingTime, 'ms');

    // Log usage
    try {
      await logUsage({
        userId: user.id,
        feature: 'proposal_generator',
        tokens: output.tokensUsed,
        timestamp: new Date(),
        metadata: {
          companyName: validation.data.clientDetails.companyName,
          solutionCount: validation.data.solutions.length,
          processingTime: output.processingTime,
          action: 'generate_prompt',
        },
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      data: output,
      meta: {
        tokensUsed: output.tokensUsed,
        processingTime: output.processingTime,
        remaining: rateLimitResult.remaining,
      },
    });
  } catch (error) {
    console.error('❌ Proposal generator error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate proposal prompt. Please try again.',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}