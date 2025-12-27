// app/api/email-agent/campaigns/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET: Get campaign details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        id: params.id,
        user_id: user.id
      },
      include: {
        emailAccount: {
          select: {
            email: true,
            provider: true
          }
        },
        sentEmails: {
          take: 10,
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      campaign
    });

  } catch (error: any) {
    console.error('Fetch campaign error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// PATCH: Pause/Resume campaign
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();

    const { EmailCampaignAgent } = await import('@/services/emailCampaignAgent.service');
    const agent = new EmailCampaignAgent();

    let result;
    if (action === 'pause') {
      result = await agent.pauseCampaign(params.id);
    } else if (action === 'resume') {
      result = await agent.resumeCampaign(params.id);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: result,
      message: `Campaign ${action}d successfully`
    });

  } catch (error: any) {
    console.error('Update campaign error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE: Delete campaign
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { EmailCampaignAgent } = await import('@/services/emailCampaignAgent.service');
    const agent = new EmailCampaignAgent();
    const result = await agent.deleteCampaign(user.id, params.id);

    return NextResponse.json({
      success: result,
      message: 'Campaign deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete campaign error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}