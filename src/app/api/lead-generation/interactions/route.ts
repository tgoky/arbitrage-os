// Create: app/api/leads/[id]/interactions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// POST /api/leads/[id]/interactions - Add interaction to lead
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Add Interaction API called for lead ID:', params.id);
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('📝 Interaction data:', body);

    // For now, we'll store interactions as metadata in the lead generation
    // Later you can create a dedicated interactions table if needed

    // Find the lead and its generation
    const result = await findLeadInGenerations(user.id, params.id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Get the full generation
    const generation = await prisma.deliverable.findFirst({
      where: {
        id: result.generation.id,
        user_id: user.id,
        type: 'lead_generation'
      }
    });

    if (!generation) {
      return NextResponse.json(
        { success: false, error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Create interaction object
    const interaction = {
      id: `interaction_${Date.now()}`,
      type: body.type || 'note',
      content: body.content,
      date: new Date().toISOString(),
      userId: user.id,
      userName: user.email?.split('@')[0] || 'User'
    };

    // Get existing metadata
    const metadata = generation.metadata as any || {};
    const interactions = metadata.interactions || {};
    const leadInteractions = interactions[params.id] || [];

    // Add new interaction
    leadInteractions.push(interaction);
    interactions[params.id] = leadInteractions;

    // Update metadata
    const updatedMetadata = {
      ...metadata,
      interactions
    };

    // Save to database
    await prisma.deliverable.update({
      where: { id: generation.id },
      data: {
        metadata: updatedMetadata,
        updated_at: new Date()
      }
    });

    console.log('✅ Interaction added successfully');

    return NextResponse.json({
      success: true,
      message: 'Interaction added successfully',
      data: { interaction }
    });

  } catch (error) {
    console.error('💥 Add Interaction Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add interaction' },
      { status: 500 }
    );
  }
}

// GET /api/leads/[id]/interactions - Get interactions for a lead
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the lead and get its interactions from metadata
    const result = await findLeadInGenerations(user.id, params.id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const generation = await prisma.deliverable.findFirst({
      where: {
        id: result.generation.id,
        user_id: user.id,
        type: 'lead_generation'
      }
    });

    if (!generation) {
      return NextResponse.json(
        { success: false, error: 'Generation not found' },
        { status: 404 }
      );
    }

    const metadata = generation.metadata as any || {};
    const interactions = metadata.interactions || {};
    const leadInteractions = interactions[params.id] || [];

    return NextResponse.json({
      success: true,
      data: { interactions: leadInteractions }
    });

  } catch (error) {
    console.error('💥 Get Interactions Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get interactions' },
      { status: 500 }
    );
  }
}