// app/api/agent-crews/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { CrewGeneratorService } from '@/services/agent-runtime/CrewGeneratorService';

// ✅ COPY THE SAME AUTHENTICATION FUNCTION FROM NICHE RESEARCHER
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
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
    
    if (error || !user) {
      console.error('❌ Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('✅ User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { user: null, error };
  }
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userPrompt, workspaceId, conversationHistory, refineCrew, currentCrew } = await req.json();

    if (!userPrompt || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const generator = new CrewGeneratorService();

    let crew;

    if (refineCrew && currentCrew) {
      // Refining existing crew
      crew = await generator.refineCrewWithFeedback(
        currentCrew,
        userPrompt,
        conversationHistory || []
      );
    } else {
      // Generating new crew
      crew = await generator.generateCrewFromPrompt({
        userPrompt,
        workspaceId,
        userId: user.id,
        conversationHistory
      });
    }

    // Save to database
    const crewId = await generator.saveGeneratedCrew(crew, workspaceId, user.id);

    return NextResponse.json({
      success: true,
      crew,
      crewId
    });

  } catch (error: any) {
    console.error('Crew generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate crew' },
      { status: 500 }
    );
  }
}