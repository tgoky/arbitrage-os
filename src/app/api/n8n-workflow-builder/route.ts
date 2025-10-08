// app/api/n8n-workflow-builder/route.ts - WITH ROBUST AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { N8nWorkflowBuilderService } from '../../../services/n8n-workflow-builder.service';
import { validateN8nWorkflowInput } from '../../validators/n8nWorkflowBuildervalidator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { createNotification } from '@/lib/notificationHelper';

// ✅ ROBUST AUTHENTICATION (same pattern as sales call analyzer)
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

function createAuthErrorResponse() {
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

export async function POST(request: NextRequest) {
  console.log('🚀 n8n Workflow Builder API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
  const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in n8n workflow builder:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ n8n Workflow Builder user authenticated successfully:', user.id);

    // ✅ RATE LIMITING for workflow generation
    console.log('🔍 Checking rate limits for n8n workflow builder user:', user.id);
    const rateLimitResult = await rateLimit(
      `workflow_generation:${user.id}`, 
      50, // 10 workflow generations per hour
      3600
    );
    
    if (!rateLimitResult.success) {
      console.log('❌ n8n workflow generation rate limit exceeded for user:', user.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many workflow generation requests. Please try again later.',
          data: {
            retryAfter: rateLimitResult.reset,
            remaining: rateLimitResult.remaining
          }
        },
        { status: 429 }
      );
    }
    console.log('✅ n8n workflow generation rate limit check passed');

    // Parse and validate request body
    console.log('📥 Parsing n8n workflow generation request body...');
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse n8n workflow generation request body:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Validating n8n workflow input...');
    const validation = validateN8nWorkflowInput(body);
    
    if (!validation.success) {
      console.error('❌ n8n workflow input validation failed:', validation.errors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input', 
          data: validation.errors 
        },
        { status: 400 }
      );
    }
    console.log('✅ n8n workflow input validation passed');

    // ✅ GET USER'S WORKSPACE (consistent pattern)
    console.log('🔍 Getting/creating workspace for n8n workflow builder user:', user.id);
    let workspace;
    try {
      const { prisma } = await import('@/lib/prisma');
      workspace = await prisma.workspace.findFirst({
        where: { user_id: user.id }
      });

      if (!workspace) {
        console.log('📁 Creating default workspace for n8n workflow builder user:', user.id);
        workspace = await prisma.workspace.create({
          data: {
            user_id: user.id,
            name: 'Default Workspace',
            slug: 'default',
            description: 'Default workspace for n8n workflows'
          }
        });
        console.log('✅ Created n8n workflow builder workspace:', workspace.id);
      } else {
        console.log('✅ Found existing n8n workflow builder workspace:', workspace.id);
      }
    } catch (dbError) {
      console.error('💥 Database error getting/creating n8n workflow builder workspace:', dbError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error. Please try again.',
          debug: dbError instanceof Error ? dbError.message : 'Unknown DB error'
        },
        { status: 500 }
      );
    }

    // ✅ SERVICE HANDLES BOTH GENERATION AND STORAGE
    console.log('🤖 Starting n8n workflow generation...');
    let workflowPackage;
    let deliverableId;
    
    try {
      const workflowService = new N8nWorkflowBuilderService();
      const workflowInput = { ...validation.data, userId: user.id };
      
      // Generate the workflow
      console.log('🔍 Generating n8n workflow...');
      workflowPackage = await workflowService.generateWorkflow(workflowInput);
      console.log('✅ n8n workflow generation completed');
      
      // Save via service (not API)
      console.log('💾 Saving n8n workflow...');
      deliverableId = await workflowService.saveWorkflow(
        user.id,
        workspace.id,
        workflowPackage,
        workflowInput
      );
      console.log('✅ n8n workflow saved with ID:', deliverableId);
    } catch (serviceError) {
      console.error('💥 Service error during n8n workflow generation:', serviceError);
      console.error('n8n workflow generation service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate workflow. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // After successful workflow generation
try {
  await createNotification({
    userId: user.id,
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    type: 'n8n_workflow',
    itemId: deliverableId,
    metadata: {
      workflowName: validation.data.workflowName,
      triggerType: validation.data.triggerType,
      integrations: validation.data.integrations,
      complexity: workflowPackage.analysis.complexity,
      nodeCount: workflowPackage.analysis.nodeCount
    }
  });
  
  console.log('✅ Notification created for workflow generation:', deliverableId);
} catch (notifError) {
  console.error('Failed to create notification:', notifError);
}

    // ✅ LOG USAGE for billing/analytics
    console.log('📊 Logging n8n workflow generation usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'n8n_workflow_builder',
        tokens: workflowPackage.tokensUsed,
        timestamp: new Date(),
        metadata: {
          deliverableId,
          workflowName: validation.data.workflowName,
          triggerType: validation.data.triggerType,
          integrationCount: validation.data.integrations.length,
          complexity: workflowPackage.analysis.complexity,
          nodeCount: workflowPackage.analysis.nodeCount,
          workflowId: workflowPackage.workflowId,
          estimatedSetupTime: workflowPackage.analysis.complexity === 'simple' ? 30 : 
                             workflowPackage.analysis.complexity === 'moderate' ? 60 : 120
        }
      });
      console.log('✅ n8n workflow generation usage logged successfully');
    } catch (logError) {
      console.error('⚠️ n8n workflow generation usage logging failed (non-critical):', logError);
    }

    console.log('🎉 n8n workflow generation completed successfully');
    return NextResponse.json({
      success: true,
      data: {
        workflowId: deliverableId,
          package: workflowPackage 
      },
      meta: {
        tokensUsed: workflowPackage.tokensUsed,
        processingTime: workflowPackage.processingTime,
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Unexpected n8n Workflow Builder API Error:', error);
    console.error('n8n workflow builder error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate workflow. Please try again.',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 n8n Workflow Builder GET API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
     const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in n8n workflow builder GET:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ n8n Workflow Builder GET user authenticated successfully:', user.id);

    // ✅ RATE LIMITING for list fetches
    const rateLimitResult = await rateLimit(
      `workflow_list:${user.id}`,
      100, // 100 list fetches per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ n8n workflow list rate limit exceeded for user:', user.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'List fetch rate limit exceeded.',
          data: {
            retryAfter: rateLimitResult.reset,
            remaining: rateLimitResult.remaining
          }
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const workflowId = searchParams.get('workflowId');

    // If specific workflow requested
    if (workflowId) {
      console.log('📋 Fetching specific n8n workflow:', workflowId, 'for user:', user.id);
      
      try {
        const workflowService = new N8nWorkflowBuilderService();
        const workflow = await workflowService.getWorkflow(user.id, workflowId);
        
        if (!workflow) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Workflow not found'
            },
            { status: 404 }
          );
        }

        console.log('✅ Retrieved n8n workflow:', workflowId);
        return NextResponse.json({
          success: true,
          data: workflow,
          meta: {
            remaining: rateLimitResult.remaining
          }
        });
      } catch (serviceError) {
        console.error('💥 Error fetching n8n workflow:', serviceError);
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to fetch workflow. Please try again.',
            debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
          },
          { status: 500 }
        );
      }
    }

    // Otherwise, fetch user's workflow list
    console.log('📋 Fetching n8n workflows for user:', user.id);

    // ✅ USE SERVICE METHOD (consistent with architecture)
    let workflows;
    try {
      const workflowService = new N8nWorkflowBuilderService();
      workflows = await workflowService.getUserWorkflows(
        user.id,
        workspaceId || undefined
      );
      console.log('✅ Retrieved', workflows.length, 'n8n workflows');
    } catch (serviceError) {
      console.error('💥 Error fetching n8n workflows:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch workflows. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE for list access
    try {
      await logUsage({
        userId: user.id,
        feature: 'n8n_workflow_builder_list',
        tokens: 0, // No AI tokens for listing
        timestamp: new Date(),
        metadata: {
          workspaceId,
          resultCount: workflows.length,
          action: 'list'
        }
      });
      console.log('✅ n8n workflow list usage logged successfully');
    } catch (logError) {
      console.error('⚠️ n8n workflow list usage logging failed (non-critical):', logError);
    }

    console.log('✅ n8n workflows GET request completed successfully');
    return NextResponse.json({
      success: true,
      data: workflows,
      meta: {
        total: workflows.length,
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Unexpected n8n Workflow Builder GET API Error:', error);
    console.error('n8n workflow builder GET error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch workflows',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log('🚀 n8n Workflow Builder PUT API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in n8n workflow builder PUT:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ n8n Workflow Builder PUT user authenticated successfully:', user.id);

    // ✅ RATE LIMITING for updates
    const rateLimitResult = await rateLimit(
      `workflow_update:${user.id}`,
      20, // 20 updates per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ n8n workflow update rate limit exceeded for user:', user.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Update rate limit exceeded.',
          data: {
            retryAfter: rateLimitResult.reset,
            remaining: rateLimitResult.remaining
          }
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Workflow ID is required for updates'
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse n8n workflow update request body:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }

    // Validate partial input (for updates)
    const validation = validateN8nWorkflowInput(body, true); // partial = true
    
    if (!validation.success) {
      console.error('❌ n8n workflow update validation failed:', validation.errors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input', 
          data: validation.errors 
        },
        { status: 400 }
      );
    }

    console.log('🔄 Updating n8n workflow:', workflowId);

    try {
      const workflowService = new N8nWorkflowBuilderService();
      const updatedWorkflow = await workflowService.updateWorkflow(
        user.id,
        workflowId,
        validation.data
      );

      // ✅ LOG USAGE for update
      try {
        await logUsage({
          userId: user.id,
          feature: 'n8n_workflow_builder_update',
          tokens: 0, // Updates don't typically use AI tokens unless regenerating
          timestamp: new Date(),
          metadata: {
            workflowId,
            action: 'update',
            fieldsUpdated: Object.keys(validation.data)
          }
        });
        console.log('✅ n8n workflow update usage logged successfully');
      } catch (logError) {
        console.error('⚠️ n8n workflow update usage logging failed (non-critical):', logError);
      }

      console.log('✅ n8n workflow updated successfully:', workflowId);
      return NextResponse.json({
        success: true,
        data: updatedWorkflow,
        meta: {
          remaining: rateLimitResult.remaining
        }
      });

    } catch (serviceError) {
      console.error('💥 Error updating n8n workflow:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to update workflow. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Unexpected n8n Workflow Builder PUT API Error:', error);
    console.error('n8n workflow builder PUT error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🚀 n8n Workflow Builder DELETE API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in n8n workflow builder DELETE:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ n8n Workflow Builder DELETE user authenticated successfully:', user.id);

    // ✅ RATE LIMITING for deletes
    const rateLimitResult = await rateLimit(
      `workflow_delete:${user.id}`,
      10, // 10 deletes per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ n8n workflow delete rate limit exceeded for user:', user.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Delete rate limit exceeded.',
          data: {
            retryAfter: rateLimitResult.reset,
            remaining: rateLimitResult.remaining
          }
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Workflow ID is required for deletion'
        },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting n8n workflow:', workflowId);

    try {
      const workflowService = new N8nWorkflowBuilderService();
      const deleted = await workflowService.deleteWorkflow(user.id, workflowId);

      if (!deleted) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Workflow not found or already deleted'
          },
          { status: 404 }
        );
      }

      // ✅ LOG USAGE for deletion
      try {
        await logUsage({
          userId: user.id,
          feature: 'n8n_workflow_builder_delete',
          tokens: 0,
          timestamp: new Date(),
          metadata: {
            workflowId,
            action: 'delete'
          }
        });
        console.log('✅ n8n workflow deletion usage logged successfully');
      } catch (logError) {
        console.error('⚠️ n8n workflow deletion usage logging failed (non-critical):', logError);
      }

      console.log('✅ n8n workflow deleted successfully:', workflowId);
      return NextResponse.json({
        success: true,
        data: { deleted: true },
        meta: {
          remaining: rateLimitResult.remaining
        }
      });

    } catch (serviceError) {
      console.error('💥 Error deleting n8n workflow:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete workflow. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Unexpected n8n Workflow Builder DELETE API Error:', error);
    console.error('n8n workflow builder DELETE error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}