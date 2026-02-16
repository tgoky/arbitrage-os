// app/api/test/deliverables/route.ts - Create this file to test your database
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 Database test endpoint called');
  
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // Get URL params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        error: 'Please provide userId parameter',
        example: '/api/test/deliverables?userId=your-user-id'
      }, { status: 400 });
    }

    console.log('🔍 Testing for userId:', userId);

    // 1. Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('  Database connection works');

    // 2. Get total deliverable count
    const totalCount = await prisma.deliverable.count();
    console.log('📊 Total deliverables in database:', totalCount);

    // 3. Get user-specific count
    const userCount = await prisma.deliverable.count({
      where: { user_id: userId }
    });
    console.log('📊 User deliverables:', userCount);

    // 4. Get all types in database
    const allTypes = await prisma.deliverable.groupBy({
      by: ['type'],
      _count: { id: true }
    });
    console.log('📊 All deliverable types:', allTypes);

    // 5. Get user types
    const userTypes = await prisma.deliverable.groupBy({
      by: ['type'],
      where: { user_id: userId },
      _count: { id: true }
    });
    console.log('📊 User deliverable types:', userTypes);

    // 6. Get recent deliverables for user
    const recentDeliverables = await prisma.deliverable.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        created_at: true,
        metadata: true
      }
    });

    // 7. Check for specific types we're looking for
    const targetTypes = [
      'sales_call_analysis',
      'growth_plan', 
      'pricing_calculation',
      'niche_research',
      'cold_email_generation',
      'signature_offers'
    ];

    const targetTypeCount = await prisma.deliverable.count({
      where: {
        user_id: userId,
        type: { in: targetTypes }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        databaseConnection: true,
        totalDeliverablesInDb: totalCount,
        userDeliverables: userCount,
        targetTypeDeliverables: targetTypeCount,
        allTypes: allTypes,
        userTypes: userTypes,
        recentDeliverables: recentDeliverables,
        targetTypes: targetTypes,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('  Database test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}