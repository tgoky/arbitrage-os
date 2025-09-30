// app/api/lead-generation/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Complete authentication function
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: { get: () => undefined },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('Token auth failed:', tokenError);
      }
    }
    
    // Method 2: SSR cookies
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              try {
                const cookie = cookieStore.get(name);
                if (!cookie?.value) return undefined;
                
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded);
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
                    return undefined;
                  }
                }
                
                return cookie.value;
              } catch (error) {
                console.warn(`Error reading cookie ${name}:`, error);
                return undefined;
              }
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (routeError) {
      console.warn('Route handler auth failed:', routeError);
    }
    
    return { user: null, error: new Error('All authentication methods failed') };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Lead Generation Export API called for ID:', params.id);
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    // Get the specific lead generation
    const generation = await prisma.deliverable.findFirst({
      where: {
        id: params.id,
        user_id: user.id,
        type: 'lead_generation'
      }
    });

    if (!generation) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Lead generation not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Parse the stored content (leads)
    let leads = [];
    try {
      const parsedContent = JSON.parse(generation.content);
      leads = parsedContent.leads || [];
    } catch (parseError) {
      console.error('Error parsing generation content:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid generation data',
          code: 'INVALID_DATA'
        },
        { status: 500 }
      );
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(leads, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="leads-${params.id}.json"`
        }
      });
    }

    // Default to CSV
    const csvHeaders = [
      'Name', 'Email', 'Phone', 'Title', 'Company', 'Industry', 
      'Company Size', 'Location', 'LinkedIn URL', 'Website', 
      'Score', 'Country Code', 'Timezone', 'Currency', 'Seniority'
    ];

    const csvRows = leads.map((lead: any) => [
      `"${lead.name || ''}"`,
      `"${lead.email || ''}"`,
      `"${lead.phone || ''}"`,
      `"${lead.title || ''}"`,
      `"${lead.company || ''}"`,
      `"${lead.industry || ''}"`,
      `"${lead.companySize || ''}"`,
      `"${lead.location || ''}"`,
      `"${lead.linkedinUrl || ''}"`,
      `"${lead.website || ''}"`,
      lead.score || 0,
      `"${lead.metadata?.countryCode || ''}"`,
      `"${lead.metadata?.timezone || ''}"`,
      `"${lead.metadata?.currency || ''}"`,
      `"${lead.metadata?.seniority || ''}"`
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: string[]) => row.join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${params.id}.csv"`
      }
    });

  } catch (error) {
    console.error('💥 Lead Generation Export Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to export leads',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}