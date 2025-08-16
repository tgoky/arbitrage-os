// app/api/niche-research/skills-suggestions/route.ts - WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit'; // ✅ Add rate limiting
import { logUsage } from '@/lib/usage'; // ✅ Add usage logging

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for skills suggestions - 100 per hour
    const rateLimitResult = await rateLimit(
      `niche_skills_suggestions:${user.id}`,
      100, // 100 requests per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Skills suggestions rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const skillsSuggestions = getSkillsSuggestions(category);

    // ✅ LOG USAGE for skills suggestions
    await logUsage({
      userId: user.id,
      feature: 'niche_skills_suggestions',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        category,
        suggestionsCount: category ? 
          skillsSuggestions.skills?.length || 0 : 
          Object.keys(skillsSuggestions.all || {}).length
      }
    });

    return NextResponse.json({
      success: true,
      data: skillsSuggestions,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Skills Suggestions Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills suggestions' },
      { status: 500 }
    );
  }
}

function getSkillsSuggestions(category?: string | null) {
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
    return {
      category,
      skills: allSkills[category as keyof typeof allSkills]
    };
  }

  return {
    categories: Object.keys(allSkills),
    all: allSkills
  };
}
