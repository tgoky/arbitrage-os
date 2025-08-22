// app/api/niche-research/skills/route.ts - COMPLETE BUG-FREE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

// ✅ IMPROVED AUTH FUNCTION
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        
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
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('⚠️ Token auth error:', tokenError);
      }
    }
    
    const supabaseSSR = createServerClient(
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
                  return undefined;
                }
              }
              
              if (cookie.value.startsWith('{') || cookie.value.startsWith('[')) {
                try {
                  JSON.parse(cookie.value);
                  return cookie.value;
                } catch (e) {
                  return undefined;
                }
              }
              
              return cookie.value;
            } catch (error) {
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      return { user, error: null };
    }
    
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        return { user, error: null };
      }
    } catch (helperError) {
      console.warn('⚠️ Route handler failed:', helperError);
    }
    
    return { user: null, error: error || new Error('All auth methods failed') };
    
  } catch (error) {
    console.error('💥 Auth error:', error);
    return { user: null, error };
  }
}

export async function GET(req: NextRequest) {
  console.log('🚀 Skills Suggestions API Route called');
  
  try {
    // ✅ AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in skills suggestions:', authError);
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please sign in again.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated successfully:', user.id);

    // ✅ RATE LIMITING for skills suggestions - 100 per hour
    const rateLimitResult = await rateLimit(
      `niche_research_skills:${user.id}`,
      100,
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Skills suggestions rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const searchTerm = searchParams.get('search');

    // ✅ COMPLETE SKILLS DATABASE ALIGNED WITH NEW NICHE RESEARCH
    const allSkills = {
      'tech-development': [
        'Tech Development',
        'Software Development',
        'Web Development', 
        'Mobile App Development',
        'Full-Stack Development',
        'Frontend Development',
        'Backend Development',
        'Database Design',
        'API Development',
        'Cloud Architecture',
        'DevOps',
        'System Administration',
        'Network Security',
        'Blockchain Development',
        'Game Development'
      ],
      'data-analytics': [
        'Data Analysis',
        'Data Science',
        'Machine Learning',
        'AI/ML',
        'Business Intelligence',
        'Statistical Analysis',
        'Data Visualization',
        'Big Data Processing',
        'Predictive Analytics',
        'Database Management',
        'SQL/NoSQL',
        'Python/R Programming',
        'Data Mining',
        'Research Methods'
      ],
      'marketing-sales': [
        'Marketing',
        'Sales',
        'Digital Marketing',
        'SEO',
        'Social Media',
        'Content Marketing',
        'Email Marketing',
        'PPC Advertising',
        'Marketing Automation',
        'Lead Generation',
        'Customer Acquisition',
        'Conversion Optimization',
        'Marketing Analytics',
        'Brand Strategy',
        'Influencer Marketing'
      ],
      'design-creative': [
        'Design',
        'UI/UX Design',
        'Graphic Design',
        'Web Design',
        'Product Design',
        'Brand Design',
        'Motion Graphics',
        'Video Production',
        'Photography',
        'Content Writing',
        'Copywriting',
        'Creative Direction',
        'Illustration',
        '3D Modeling',
        'Animation'
      ],
      'business-operations': [
        'Operations',
        'Project Management',
        'Operations Management',
        'Business Strategy',
        'Process Improvement',
        'Supply Chain Management',
        'Quality Assurance',
        'Business Analysis',
        'Financial Analysis',
        'Risk Management',
        'Change Management',
        'Vendor Management',
        'Compliance',
        'Business Development',
        'Strategic Planning'
      ],
      'consulting-services': [
        'Consulting',
        'Management Consulting',
        'Business Consulting',
        'Strategy Consulting',
        'IT Consulting',
        'HR Consulting',
        'Financial Consulting',
        'Marketing Consulting',
        'Operations Consulting',
        'Training & Development',
        'Organizational Development',
        'Leadership Coaching',
        'Executive Coaching',
        'Change Management',
        'Digital Transformation'
      ],
      'finance-accounting': [
        'Finance',
        'Financial Planning',
        'Investment Analysis',
        'Tax Preparation',
        'Bookkeeping',
        'Accounting',
        'Auditing',
        'Corporate Finance',
        'Personal Finance',
        'Financial Modeling',
        'Budget Management',
        'Cash Flow Analysis',
        'Risk Assessment',
        'Insurance Planning',
        'Retirement Planning'
      ],
      'customer-support': [
        'Customer Support',
        'Customer Service',
        'Technical Support',
        'Customer Success',
        'Help Desk Management',
        'Client Relations',
        'Customer Experience',
        'Support Process Design',
        'Ticket Management',
        'Live Chat Support',
        'Phone Support',
        'Email Support',
        'Customer Onboarding',
        'Account Management',
        'Customer Retention'
      ],
      'specialized-domains': [
        'Healthcare Administration',
        'Legal/Compliance',
        'Education & Training',
        'Real Estate',
        'Manufacturing',
        'Logistics',
        'Hospitality Management',
        'Event Planning',
        'Non-profit Management',
        'Environmental Consulting',
        'Sustainability',
        'Regulatory Affairs',
        'Procurement',
        'International Trade',
        'Government Relations',
        'Public Policy'
      ]
    };

    // ✅ FILTER BY SEARCH TERM IF PROVIDED
    let filteredSkills = allSkills;
    if (searchTerm && searchTerm.length >= 2) {
      const searchLower = searchTerm.toLowerCase();
      filteredSkills = Object.fromEntries(
        Object.entries(allSkills).map(([key, skills]) => [
          key,
          skills.filter(skill => 
            skill.toLowerCase().includes(searchLower)
          )
        ]).filter(([key, skills]) => skills.length > 0)
      ) as typeof allSkills;
    }

    // ✅ RETURN SPECIFIC CATEGORY IF REQUESTED
    if (category && category in filteredSkills) {
      const categorySkills = filteredSkills[category as keyof typeof filteredSkills];
      
      // Log usage for category access
      try {
        await logUsage({
          userId: user.id,
          feature: 'skills_suggestions_category',
          tokens: 0,
          timestamp: new Date(),
          metadata: {
            category,
            searchTerm: searchTerm || null,
            resultCount: categorySkills.length
          }
        });
      } catch (logError) {
        console.error('⚠️ Usage logging failed (non-critical):', logError);
      }

      return NextResponse.json({
        success: true,
        data: {
          category,
          skills: categorySkills,
          searchTerm: searchTerm || null
        },
        meta: {
          remaining: rateLimitResult.remaining
        }
      });
    }

    // ✅ RETURN ALL CATEGORIES AND SKILLS
    const totalSkills = Object.values(filteredSkills).flat().length;
    
    // Log usage for full access
    try {
      await logUsage({
        userId: user.id,
        feature: 'skills_suggestions_all',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          searchTerm: searchTerm || null,
          totalCategories: Object.keys(filteredSkills).length,
          totalSkills
        }
      });
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: Object.keys(filteredSkills),
        skillsByCategory: filteredSkills,
        allSkills: Object.values(filteredSkills).flat(), // Flat list for easier frontend usage
        searchTerm: searchTerm || null,
        totalSkills
      },
      meta: {
        remaining: rateLimitResult.remaining
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

// ✅ POST ENDPOINT FOR SKILLS VALIDATION/SUGGESTIONS BASED ON INPUT
export async function POST(req: NextRequest) {
  console.log('🚀 Skills Validation/Suggestions POST called');
  
  try {
    // ✅ AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // ✅ RATE LIMITING
    const rateLimitResult = await rateLimit(
      `niche_research_skills_validate:${user.id}`,
      50,
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Skills validation rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { 
      currentSkills = [], 
      primaryObjective, 
      marketType, 
      customerSize,
      budget,
      suggestComplementary = true 
    } = body;

    // ✅ VALIDATE INPUT
    if (!Array.isArray(currentSkills)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'currentSkills must be an array' 
        },
        { status: 400 }
      );
    }

    // ✅ SUGGEST COMPLEMENTARY SKILLS BASED ON NICHE PREFERENCES
    const skillSuggestions = generateSkillSuggestions(
      currentSkills,
      primaryObjective,
      marketType,
      customerSize,
      budget
    );

    // ✅ LOG USAGE
    try {
      await logUsage({
        userId: user.id,
        feature: 'skills_validation',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          currentSkillsCount: currentSkills.length,
          primaryObjective: primaryObjective || null,
          marketType: marketType || null,
          suggestionsCount: skillSuggestions.suggested.length
        }
      });
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      data: {
        currentSkills,
        ...skillSuggestions
      },
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Skills Validation Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to validate/suggest skills' 
      },
      { status: 500 }
    );
  }
}

// ✅ INTELLIGENT SKILL SUGGESTION ALGORITHM
function generateSkillSuggestions(
  currentSkills: string[],
  primaryObjective?: string,
  marketType?: string,
  customerSize?: string,
  budget?: string
) {
  // Skill category mappings for recommendations
  const skillRecommendations = {
    // Based on Primary Objective
    objectives: {
      'cashflow': ['Sales', 'Customer Acquisition', 'Conversion Optimization', 'Revenue Optimization', 'Direct Response Marketing'],
      'equity-exit': ['Business Strategy', 'Financial Modeling', 'Scaling Operations', 'Investment Analysis', 'Due Diligence'],
      'lifestyle': ['Process Automation', 'Passive Income Strategies', 'Delegation', 'Time Management', 'Remote Operations'],
      'saas': ['Software Development', 'Product Management', 'Customer Success', 'SaaS Metrics', 'Subscription Models'],
      'agency': ['Project Management', 'Client Relations', 'Service Delivery', 'Team Management', 'Resource Planning'],
      'ecomm': ['E-commerce Platforms', 'Supply Chain', 'Inventory Management', 'Customer Service', 'Product Sourcing'],
      'audience-build': ['Content Creation', 'Social Media Marketing', 'Community Building', 'Email Marketing', 'Influencer Relations']
    },
    
    // Based on Market Type
    marketTypes: {
      'b2b-saas': ['Enterprise Sales', 'Product Marketing', 'Customer Success', 'API Development', 'Technical Integration'],
      'b2c-consumer': ['Consumer Psychology', 'Social Media Marketing', 'Brand Building', 'UX Design', 'Mobile Optimization'],
      'professional-services': ['Consulting', 'Client Management', 'Expertise Positioning', 'Service Design', 'Professional Branding'],
      'local-business': ['Local SEO', 'Community Engagement', 'Location-Based Marketing', 'Customer Service', 'Local Partnerships'],
      'info-education': ['Content Creation', 'Course Development', 'Educational Design', 'Online Teaching', 'Knowledge Packaging']
    },
    
    // Based on Customer Size
    customerSizes: {
      'startups': ['Agile Methodologies', 'Rapid Prototyping', 'Resource Optimization', 'Growth Hacking', 'MVP Development'],
      'smb': ['Small Business Operations', 'Cost-Effective Solutions', 'Personal Relationships', 'Practical Implementation', 'Local Market Understanding'],
      'enterprise': ['Enterprise Architecture', 'Stakeholder Management', 'Compliance', 'Scalable Solutions', 'Security Protocols'],
      'consumers': ['Consumer Behavior', 'Mass Marketing', 'User Experience', 'Customer Support', 'Brand Loyalty'],
      'government': ['Regulatory Compliance', 'Public Sector', 'Security Clearance', 'Policy Understanding', 'Government Procurement']
    },

    // Based on Budget
    budgets: {
      '<10k': ['Bootstrap Marketing', 'Lean Operations', 'Cost-Effective Tools', 'Organic Growth', 'Resource Efficiency'],
      '10k-50k': ['Paid Marketing', 'Professional Tools', 'Market Testing', 'Scaling Strategies', 'Investment Planning'],
      '50k-250k': ['Team Building', 'Advanced Marketing', 'Product Development', 'Market Expansion', 'Technology Investment'],
      '250k+': ['Enterprise Solutions', 'Strategic Partnerships', 'Advanced Analytics', 'International Markets', 'Acquisition Strategy']
    }
  };

  // Get suggestions based on context
  let suggested: string[] = [];
  
  if (primaryObjective && skillRecommendations.objectives[primaryObjective as keyof typeof skillRecommendations.objectives]) {
    suggested.push(...skillRecommendations.objectives[primaryObjective as keyof typeof skillRecommendations.objectives]);
  }
  
  if (marketType && skillRecommendations.marketTypes[marketType as keyof typeof skillRecommendations.marketTypes]) {
    suggested.push(...skillRecommendations.marketTypes[marketType as keyof typeof skillRecommendations.marketTypes]);
  }
  
  if (customerSize && skillRecommendations.customerSizes[customerSize as keyof typeof skillRecommendations.customerSizes]) {
    suggested.push(...skillRecommendations.customerSizes[customerSize as keyof typeof skillRecommendations.customerSizes]);
  }

  if (budget && skillRecommendations.budgets[budget as keyof typeof skillRecommendations.budgets]) {
    suggested.push(...skillRecommendations.budgets[budget as keyof typeof skillRecommendations.budgets]);
  }

  // Skill synergy recommendations
  const currentSkillsLower = currentSkills.map(s => s.toLowerCase());
  const synergies: Record<string, string[]> = {
    'software development': ['Product Management', 'UX Design', 'DevOps', 'Technical Writing', 'API Development'],
    'tech development': ['Product Management', 'UX Design', 'DevOps', 'Technical Writing', 'API Development'],
    'marketing': ['Data Analysis', 'Content Creation', 'Sales', 'Customer Psychology', 'SEO'],
    'digital marketing': ['Data Analysis', 'Content Creation', 'Sales', 'Customer Psychology', 'SEO'],
    'sales': ['Marketing', 'Customer Success', 'Business Development', 'CRM Management', 'Lead Generation'],
    'design': ['User Research', 'Product Management', 'Frontend Development', 'Brand Strategy', 'Prototyping'],
    'data analysis': ['Machine Learning', 'Business Intelligence', 'Statistical Analysis', 'Data Visualization', 'Python/R Programming'],
    'project management': ['Agile Methodologies', 'Team Leadership', 'Process Improvement', 'Risk Management', 'Resource Planning'],
    'consulting': ['Business Strategy', 'Client Management', 'Presentation Skills', 'Problem Solving', 'Industry Expertise'],
    'finance': ['Financial Modeling', 'Investment Analysis', 'Risk Assessment', 'Budget Management', 'Financial Planning']
  };

  // Add synergy suggestions
  Object.entries(synergies).forEach(([skill, synergisticSkills]) => {
    if (currentSkillsLower.some(cs => cs.includes(skill.toLowerCase()))) {
      suggested.push(...synergisticSkills);
    }
  });

  // Remove duplicates and current skills
  suggested = [...new Set(suggested)].filter(skill => 
    !currentSkills.some(cs => cs.toLowerCase() === skill.toLowerCase())
  );

  // Analyze skill gaps
  const skillGaps = analyzeSkillGaps(currentSkills, primaryObjective, marketType);

  return {
    suggested: suggested.slice(0, 10), // Top 10 suggestions
    skillGaps,
    strengths: identifyStrengths(currentSkills),
    recommendations: generateSkillRecommendations(currentSkills, suggested, skillGaps),
    synergies: findSkillSynergies(currentSkills)
  };
}

function analyzeSkillGaps(
  currentSkills: string[],
  primaryObjective?: string,
  marketType?: string
) {
  const gaps: string[] = [];
  const currentSkillsLower = currentSkills.map(s => s.toLowerCase());

  // Essential skills for different contexts
  const essentialSkills = {
    business: ['Sales', 'Marketing', 'Customer Service', 'Business Strategy'],
    technical: ['Problem Solving', 'Technical Writing', 'Quality Assurance', 'Data Analysis'],
    leadership: ['Project Management', 'Team Leadership', 'Communication', 'Decision Making'],
    growth: ['Data Analysis', 'Process Improvement', 'Strategic Thinking', 'Market Research']
  };

  // Check for missing essential categories
  Object.entries(essentialSkills).forEach(([category, skills]) => {
    const hasSkillInCategory = skills.some(skill => 
      currentSkillsLower.some(cs => cs.includes(skill.toLowerCase()))
    );
    
    if (!hasSkillInCategory) {
      gaps.push(`${category.charAt(0).toUpperCase() + category.slice(1)} skills`);
    }
  });

  return gaps;
}

function identifyStrengths(currentSkills: string[]) {
  const strengthAreas: string[] = [];
  const currentSkillsLower = currentSkills.map(s => s.toLowerCase());

  const strengthCategories = {
    'Technical Expertise': ['software', 'development', 'programming', 'technical', 'engineering', 'tech', 'data', 'ai', 'ml'],
    'Business Acumen': ['business', 'strategy', 'management', 'finance', 'operations', 'consulting'],
    'Marketing & Sales': ['marketing', 'sales', 'advertising', 'promotion', 'branding', 'seo', 'social'],
    'Creative Skills': ['design', 'creative', 'art', 'content', 'writing', 'ui', 'ux', 'graphic'],
    'Analytical Skills': ['data', 'analysis', 'research', 'statistics', 'analytics', 'intelligence'],
    'People Skills': ['communication', 'leadership', 'team', 'management', 'coaching', 'support', 'customer']
  };

  Object.entries(strengthCategories).forEach(([category, keywords]) => {
    const hasStrengthInCategory = keywords.some(keyword => 
      currentSkillsLower.some(skill => skill.includes(keyword))
    );
    
    if (hasStrengthInCategory) {
      strengthAreas.push(category);
    }
  });

  return strengthAreas;
}

function findSkillSynergies(currentSkills: string[]) {
  const synergies: string[] = [];
  const skillsLower = currentSkills.map(s => s.toLowerCase());

  // Common skill combinations that work well together
  const synergyPatterns = [
    {
      skills: ['marketing', 'data'],
      synergy: 'Data-driven marketing approach enables precise targeting and optimization'
    },
    {
      skills: ['tech', 'business'],
      synergy: 'Technical expertise combined with business knowledge creates valuable solutions'
    },
    {
      skills: ['design', 'development'],
      synergy: 'Design and development skills enable end-to-end product creation'
    },
    {
      skills: ['sales', 'marketing'],
      synergy: 'Sales and marketing alignment drives effective customer acquisition'
    },
    {
      skills: ['project', 'leadership'],
      synergy: 'Project management with leadership skills enables effective team coordination'
    }
  ];

  synergyPatterns.forEach(pattern => {
    const hasAllSkills = pattern.skills.every(skill => 
      skillsLower.some(userSkill => userSkill.includes(skill))
    );
    
    if (hasAllSkills) {
      synergies.push(pattern.synergy);
    }
  });

  return synergies;
}

function generateSkillRecommendations(
  currentSkills: string[],
  suggested: string[],
  skillGaps: string[]
) {
  const recommendations: string[] = [];

  if (currentSkills.length < 3) {
    recommendations.push("Consider adding 2-3 more skills to strengthen your profile and increase niche opportunities");
  }

  if (skillGaps.length > 0) {
    recommendations.push(`Focus on developing ${skillGaps[0]} to round out your capabilities and improve market fit`);
  }

  if (suggested.length > 0) {
    recommendations.push(`${suggested[0]} would complement your existing skills and enhance your niche positioning`);
  }

  const techSkills = currentSkills.filter(skill => 
    skill.toLowerCase().includes('tech') || 
    skill.toLowerCase().includes('software') ||
    skill.toLowerCase().includes('development') ||
    skill.toLowerCase().includes('data') ||
    skill.toLowerCase().includes('ai')
  );

  const businessSkills = currentSkills.filter(skill => 
    skill.toLowerCase().includes('business') || 
    skill.toLowerCase().includes('management') ||
    skill.toLowerCase().includes('sales') ||
    skill.toLowerCase().includes('marketing') ||
    skill.toLowerCase().includes('strategy')
  );

  if (techSkills.length > 0 && businessSkills.length === 0) {
    recommendations.push("Adding business skills would help you bridge technical solutions with market needs");
  }

  if (businessSkills.length > 0 && techSkills.length === 0) {
    recommendations.push("Technical skills would enhance your ability to understand and leverage technology solutions");
  }

  if (currentSkills.length >= 5) {
    recommendations.push("You have a strong skill foundation. Focus on deepening expertise in your core areas");
  }

  return recommendations.slice(0, 4); // Limit to top 4 recommendations
}