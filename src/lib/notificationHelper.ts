// lib/notificationHelper.ts
import { NotificationType } from '../types/notification';

interface CreateNotificationParams {
  userId: string;
  workspaceId: string;
  workspaceSlug: string;
  type: NotificationType;
  itemId: string;
  metadata?: Record<string, any>;
}

// Map notification types to user-friendly messages
const notificationConfig: Record<NotificationType, {
  titleTemplate: (meta?: any) => string;
  messageTemplate: (meta?: any) => string;
  routeTemplate: (workspaceSlug: string, itemId: string) => string;
}> = {
  pricing_calculation: {
    titleTemplate: (meta) => meta?.clientName 
      ? `Pricing for ${meta.clientName} is Ready!` 
      : 'Pricing Calculation Complete!',
    messageTemplate: (meta) => meta?.recommendedRetainer
      ? `Your pricing strategy with $${meta.recommendedRetainer}/month retainer is ready to view.`
      : 'Your comprehensive pricing package has been generated and is ready for review.',
    routeTemplate: (slug, id) => `/dashboard/${slug}/pricing-calculator/${id}`
  },
  sales_call: {
    titleTemplate: (meta) => meta?.prospectName
      ? `Sales Call Analysis: ${meta.prospectName}`
      : 'Sales Call Analysis Complete!',
    messageTemplate: () => 'Your sales call has been analyzed with key insights and action items.',
    routeTemplate: (slug, id) => `/dashboard/${slug}/sales-call-analyzer/${id}`
  },
  growth_plan: {
    titleTemplate: (meta) => meta?.clientCompany
      ? `Growth Plan for ${meta.clientCompany} Ready!`
      : 'Growth Plan Generated!',
    messageTemplate: () => 'Your strategic growth plan with actionable recommendations is ready.',
    routeTemplate: (slug, id) => `/dashboard/${slug}/growth-plans/${id}`
  },
  niche_research: {
    titleTemplate: () => 'Niche Research Report Ready!',
    messageTemplate: (meta) => meta?.topNiches?.length
      ? `Found ${meta.topNiches.length} promising niches for your analysis.`
      : 'Your comprehensive niche research report is complete.',
    routeTemplate: (slug, id) => `/dashboard/${slug}/niche-research/${id}`
  },
  cold_email: {
    titleTemplate: () => 'Cold Email Sequences Generated!',
    messageTemplate: (meta) => meta?.emailCount
      ? `${meta.emailCount} personalized email sequences are ready to use.`
      : 'Your cold email campaigns have been generated.',
    routeTemplate: (slug, id) => `/dashboard/${slug}/cold-email/${id}`
  },
  offer_creator: {
    titleTemplate: () => 'Signature Offer Created!',
    messageTemplate: (meta) => meta?.conversionScore
      ? `Your offer with ${meta.conversionScore}% conversion potential is ready.`
      : 'Your signature offer package has been created.',
    routeTemplate: (slug, id) => `/dashboard/${slug}/offer-creator/${id}`
  },
  ad_writer: {
    titleTemplate: () => 'Ad Copies Generated!',
    messageTemplate: (meta) => meta?.adCount
      ? `${meta.adCount} ad variations are ready for your campaigns.`
      : 'Your advertising copy has been generated.',
    routeTemplate: (slug, id) => `/dashboard/${slug}/ad-writer/${id}`
  },
  n8n_workflow: {
    titleTemplate: () => 'Workflow Generated!',
    messageTemplate: (meta) => meta?.integrationCount
      ? `Your workflow with ${meta.integrationCount} integrations is ready.`
      : 'Your automation workflow has been created.',
    routeTemplate: (slug, id) => `/dashboard/${slug}/n8n-builder/${id}`
  }
};

export async function createNotification(params: CreateNotificationParams) {
  const { userId, workspaceId, workspaceSlug, type, itemId, metadata } = params;
  
  const config = notificationConfig[type];
  if (!config) {
    console.error('Unknown notification type:', type);
    return null;
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        workspace_id: workspaceId,
        type,
        title: config.titleTemplate(metadata),
        message: config.messageTemplate(metadata),
        item_id: itemId,
        route: config.routeTemplate(workspaceSlug, itemId),
        status: 'unread',
        metadata: metadata || {}
      }
    });

    console.log('✅ Notification created:', notification.id, type);
    return notification;
    
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

// Bulk create notifications for multiple users
export async function createBulkNotifications(
  notifications: CreateNotificationParams[]
) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const notificationData = notifications.map(params => {
      const config = notificationConfig[params.type];
      return {
        user_id: params.userId,
        workspace_id: params.workspaceId,
        type: params.type,
        title: config.titleTemplate(params.metadata),
        message: config.messageTemplate(params.metadata),
        item_id: params.itemId,
        route: config.routeTemplate(params.workspaceSlug, params.itemId),
        status: 'unread' as const,
        metadata: params.metadata || {}
      };
    });

    const result = await prisma.notification.createMany({
      data: notificationData
    });

    console.log(`✅ Created ${result.count} notifications`);
    return result;
    
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
    return null;
  }
}