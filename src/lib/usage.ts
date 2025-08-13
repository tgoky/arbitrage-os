
// lib/usage.ts
import { prisma } from '@/lib/prisma';

interface UsageLogInput {
  userId: string;
  feature: string;
  tokens: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export async function logUsage(input: UsageLogInput) {
  try {
    // Get user's first workspace or create default
    let workspace = await prisma.workspace.findFirst({
      where: { user_id: input.userId }
    });

    if (!workspace) {
      // Create a default workspace for the user
      workspace = await prisma.workspace.create({
        data: {
          user_id: input.userId,
          name: 'Default Workspace',
          slug: 'default',
          description: 'Default workspace for usage tracking'
        }
      });
    }
    
    // Store usage as a deliverable with special type
    await prisma.deliverable.create({
      data: {
        title: `Usage Log - ${input.feature}`,
        content: `Feature: ${input.feature}, Tokens: ${input.tokens}`,
        type: 'usage_log',
        user_id: input.userId,
        workspace_id: workspace.id,
        metadata: {
          feature: input.feature,
          tokens: input.tokens,
          timestamp: input.timestamp,
          ...input.metadata
        },
        tags: ['usage', 'log', input.feature]
      }
    });
    
    // Also log to console for debugging
    console.log(`Usage logged for user ${input.userId}: ${input.feature} - ${input.tokens} tokens`);
    
  } catch (error) {
    console.error('Failed to log usage:', error);
    // Don't throw error to avoid breaking the main flow
  }
}