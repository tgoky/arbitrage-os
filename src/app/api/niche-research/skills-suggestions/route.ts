// app/api/niche-research/market-analysis/route.ts - FIXED AUTH
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ✅ FIXED AUTH FUNCTION (same as main route)
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Try with authorization header FIRST (most reliable)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Trying token auth...');
        
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: () => undefined,
            },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          console.log('✅ Auth Method 1 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Token auth error:', tokenError);
      }
    }
    
    // Method 2: Try with cleaned SSR cookies
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;
              
              // Handle base64 cookies more safely
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  // Validate it's actually JSON
                  const parsed = JSON.parse(decoded);
                  return cookie.value;
                } catch (e) {
                  console.warn(`🧹 Corrupted cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              
              // For non-base64 cookies, validate they're proper JSON if they look like JSON
              if (cookie.value.startsWith('{') || cookie.value.startsWith('[')) {
                try {
                  JSON.parse(cookie.value);
                  return cookie.value;
                } catch (e) {
                  console.warn(`🧹 Invalid JSON cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              
              return cookie.value;
            } catch (error) {
              console.warn(`🧹 Error reading cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Auth Method 2 (SSR cookies) succeeded for user:', user.id);
      return { user, error: null };
    } else {
      console.log('⚠️ SSR cookie auth failed:', error?.message);
    }
    
    // Method 3: Try route handler as last resort (most prone to cookie issues)
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        console.log('✅ Auth Method 3 (route handler) succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Route handler client failed:', helperError);
    }
    
    return { user: null, error: error || new Error('All auth methods failed') };
    
  } catch (error) {
    console.error('💥 All authentication methods failed:', error);
    return { user: null, error };
  }
}

export async function GET(req: NextRequest) {
  console.log('🚀 Skills Suggestions API Route called');
  
  try {
    // ✅ USE FIXED AUTH FUNCTION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in skills suggestions:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token'
      ];
      
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path: '/',
        });
      });
      
      return response;
    }

    console.log('✅ User authenticated successfully:', user.id);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const allSkills = {
      technical: [
        'Software Development',
        'Data Analysis',
        'Digital Marketing',
        'SEO/SEM',
        'UI/UX Design',
        'Database Management',
        'Cloud Computing',
        'AI/Machine Learning',
        'Cybersecurity',
        'Web Development',
        'Mobile App Development',
        'DevOps',
        'Product Management'
      ],
      business: [
        'Project Management',
        'Business Strategy',
        'Financial Analysis',
        'Sales',
        'Marketing',
        'Operations Management',
        'Supply Chain',
        'Business Development',
        'Consulting',
        'Risk Management',
        'Quality Assurance',
        'Process Improvement',
        'Change Management'
      ],
      creative: [
        'Graphic Design',
        'Content Writing',
        'Video Production',
        'Photography',
        'Brand Strategy',
        'Social Media Marketing',
        'Creative Direction',
        'Copywriting',
        'Animation',
        'Illustration',
        'Audio Production',
        'Event Planning',
        'Interior Design'
      ],
      consulting: [
        'Management Consulting',
        'HR Consulting',
        'Financial Consulting',
        'IT Consulting',
        'Marketing Consulting',
        'Operations Consulting',
        'Strategy Consulting',
        'Change Management',
        'Training & Development',
        'Organizational Development',
        'Process Optimization',
        'Digital Transformation'
      ],
      specialized: [
        'Healthcare Administration',
        'Legal Services',
        'Education & Training',
        'Real Estate',
        'Manufacturing',
        'Retail Management',
        'Hospitality',
        'Non-profit Management',
        'Environmental Consulting',
        'Sustainability',
        'Research & Development',
        'Regulatory Compliance'
      ]
    };

    if (category && category in allSkills) {
      return NextResponse.json({
        success: true,
        data: {
          category,
          skills: allSkills[category as keyof typeof allSkills]
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: Object.keys(allSkills),
        all: allSkills
      }
    });

  } catch (error) {
    console.error('💥 Skills Suggestions Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch skills suggestions' 
      },
      { status: 500 }
    );
  }
}