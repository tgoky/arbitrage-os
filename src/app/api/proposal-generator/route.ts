import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import type { ProposalGeneratorInput } from '../../../types/proposalGenerator';

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

function buildGammaPrompt(input: ProposalGeneratorInput): string {
  const { clientDetails, currentState, futureState, solutions, closeDetails } = input;

  // Calculate totals
  let totalSetup = 0;
  let totalMonthly = 0;
  solutions.forEach((s) => {
    const setup = parseFloat(s.setupFee.replace(/[^0-9.]/g, '')) || 0;
    const monthly = parseFloat(s.monthlyFee.replace(/[^0-9.]/g, '')) || 0;
    totalSetup += setup;
    totalMonthly += monthly;
  });

  const totalSetupStr = totalSetup > 0 ? `$${totalSetup.toLocaleString()}` : 'TBD';
  const totalMonthlyStr = totalMonthly > 0 ? `$${totalMonthly.toLocaleString()}` : 'TBD';

  // Build slide-by-slide prompt
  let prompt = '';

  // Header instruction
  prompt += `Create a comprehensive proposal presentation for ${clientDetails.clientName}, ${clientDetails.clientTitle} of ${clientDetails.companyName}. The tone should be ${clientDetails.presentationTone}. The goal is to pitch ${clientDetails.corePitchGoal}.\n\n`;

  // Slide 1: Title Card
  prompt += `Slide 1: Title Card\n`;
  prompt += `Title: Scaling ${clientDetails.companyName} with ${clientDetails.corePitchGoal}\n`;
  prompt += `Subtitle: ${currentState.mainBottleneck ? `Eliminating ${currentState.mainBottleneck.split('.')[0].trim()}` : 'Transforming Operations'} and Driving Measurable ROI.\n\n`;

  // Slide 2: The Main Bottleneck
  prompt += `Slide 2: The Main Bottleneck - Current Pain Points\n`;
  prompt += `Highlight the primary pain points:\n`;
  prompt += `* The Main Bleed: ${currentState.mainBottleneck}\n`;
  if (currentState.teamInefficiencies) {
    prompt += `* Team Inefficiencies: ${currentState.teamInefficiencies}\n`;
  }
  if (currentState.opportunityCost) {
    prompt += `* Opportunity Cost: ${currentState.opportunityCost}\n`;
  }
  prompt += '\n';

  // Slide 3: The New Vision
  prompt += `Slide 3: The New Operating Model\n`;
  prompt += `Visualize the operational and financial shift:\n`;
  prompt += `* Current State: ${currentState.teamInefficiencies}\n`;
  prompt += `* Proposed Structure: ${futureState.proposedTeamStructure}\n`;
  prompt += `* Executive Role: ${futureState.ownerExecutiveRole}\n\n`;

  // Solution Slides
  solutions.forEach((solution, index) => {
    const slideNum = index + 4;
    prompt += `Slide ${slideNum}: Solution ${index + 1} - ${solution.solutionName}\n`;
    prompt += `Describe the workflow and investment:\n`;
    prompt += `* How it Works: ${solution.howItWorks}\n`;
    if (solution.keyBenefits) {
      prompt += `* Key Benefits: ${solution.keyBenefits}\n`;
    }
    prompt += `* Result: Streamlined operations with measurable impact.\n`;
    prompt += `* Investment: ${solution.setupFee} One-Time Setup | ${solution.monthlyFee} / Month.\n\n`;
  });

  // Summary Slide
  const summarySlideNum = solutions.length + 4;
  prompt += `Slide ${summarySlideNum}: Summary of Impact & ROI\n`;
  prompt += `Provide a clear breakdown of value vs. cost:\n`;
  prompt += `* Efficiency: Significant reduction in manual work and operational bottlenecks.\n`;
  prompt += `* Team Restructure: ${futureState.proposedTeamStructure}\n`;
  prompt += `* Total Investment Summary: ${totalSetupStr} Total Upfront Setup | ${totalMonthlyStr} / Month for ongoing infrastructure.\n`;
  if (closeDetails.bundleDiscountOffer) {
    prompt += `* Bundle Offer: ${closeDetails.bundleDiscountOffer}\n`;
  }
  prompt += '\n';

  // CTA Slide
  const ctaSlideNum = summarySlideNum + 1;
  prompt += `Slide ${ctaSlideNum}: Next Steps\n`;
  prompt += `Call to Action: ${closeDetails.callToAction}\n`;
  if (closeDetails.bookingLink) {
    prompt += `Booking Link: ${closeDetails.bookingLink}\n`;
  }

  return prompt.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(`proposal_gen:${user.id}`, 50, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const input: ProposalGeneratorInput = body;

    // Basic validation
    if (!input.clientDetails?.clientName || !input.clientDetails?.companyName) {
      return NextResponse.json(
        { success: false, error: 'Client name and company name are required.' },
        { status: 400 }
      );
    }
    if (!input.solutions || input.solutions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one solution is required.' },
        { status: 400 }
      );
    }

    const gammaPrompt = buildGammaPrompt(input);

    // Log usage
    try {
      await logUsage({
        userId: user.id,
        feature: 'proposal_generator',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          companyName: input.clientDetails.companyName,
          solutionCount: input.solutions.length,
          action: 'generate_prompt',
        },
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      data: {
        gammaPrompt,
        generatedAt: new Date().toISOString(),
        inputSnapshot: input,
      },
    });
  } catch (error) {
    console.error('Proposal generator error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate proposal prompt.' },
      { status: 500 }
    );
  }
}