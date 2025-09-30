// types/notifications.ts

export type NotificationType = 
  | 'pricing_calculation'
  | 'sales_call'
  | 'growth_plan'
  | 'niche_research'
  | 'cold_email'
  |  'lead_generation'
  |  'proposal'
  | 'offer_creator'
  | 'ad_writer'
  | 'n8n_workflow';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  workspaceId: string;
  itemId: string; // The ID of the generated item
  route: string; // The URL to navigate to
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, any>;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  fetchNotifications: () => Promise<void>;
}