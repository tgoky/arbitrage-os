// app/api/email-agent/analytics/route.ts - FIXED WITH ROBUST AUTH
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ✅ ROBUST AUTHENTICATION (same pattern as n8n and lead gen)
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

// GET /api/email-agent/analytics - Get email campaign analytics
export async function GET(req: NextRequest) {
  console.log('🚀 Email Agent Analytics API called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const campaignId = searchParams.get('campaignId');

    if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required' 
      }, { status: 400 });
    }

    const { EmailCampaignAgent } = await import('@/services/emailCampaignAgent.service');
    const agent = new EmailCampaignAgent();

    // ✅ FIXED: Different endpoints for different analytics
    if (campaignId) {
      // Get specific campaign analytics
      console.log(`📊 Fetching analytics for campaign: ${campaignId}`);
      
      const analytics = await agent.getCampaignAnalytics(campaignId);  // ✅ Correct: 1 argument
      
      return NextResponse.json({
        success: true,
        data: analytics
      });
      
    } else {
      // Get workspace-wide analytics
      console.log(`📊 Fetching workspace analytics: ${workspaceId}`);
      
      const analytics = await agent.getWorkspaceAnalytics(user.id, workspaceId);  // ✅ Correct method
      
      return NextResponse.json({
        success: true,
        data: analytics
      });
    }

  } catch (error: any) {
    console.error('💥 Fetch analytics error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch analytics' 
      },
      { status: 500 }
    );
  }
}