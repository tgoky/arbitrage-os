// providers/NotificationProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWorkspace } from '../app/hooks/useWorkspace';
import { Notification, NotificationContextType } from '../types/notification';
import { message } from 'antd';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { currentWorkspace } = useWorkspace();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications?workspaceId=${currentWorkspace.id}`, {
        credentials: 'include',
        headers: {
          'X-Workspace-Id': currentWorkspace.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!currentWorkspace?.id) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentWorkspace?.id, fetchNotifications]);

  // Listen for workspace changes
  useEffect(() => {
    const handleWorkspaceChange = () => {
      fetchNotifications();
    };

    window.addEventListener('workspaceChanged', handleWorkspaceChange);
    return () => window.removeEventListener('workspaceChanged', handleWorkspaceChange);
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    if (!currentWorkspace?.id) return;

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Workspace-Id': currentWorkspace.id
        },
        body: JSON.stringify({ status: 'read' })
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, status: 'read', readAt: new Date().toISOString() } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      message.error('Failed to update notification');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!currentWorkspace?.id) return;

    try {
      const response = await fetch(`/api/notifications/mark-all-read?workspaceId=${currentWorkspace.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Workspace-Id': currentWorkspace.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          status: 'read',
          readAt: notif.readAt || new Date().toISOString()
        }))
      );

      message.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      message.error('Failed to update notifications');
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    if (!currentWorkspace?.id) return;

    try {
      const response = await fetch(`/api/notifications/${id}?workspaceId=${currentWorkspace.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-Workspace-Id': currentWorkspace.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      setNotifications(prev => prev.filter(notif => notif.id !== id));
      message.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      message.error('Failed to delete notification');
    }
  };

  // Add new notification (usually called after generation completes)
  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) => {
    if (!currentWorkspace?.id) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Workspace-Id': currentWorkspace.id
        },
        body: JSON.stringify({
          ...notification,
          workspaceId: currentWorkspace.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(prev => [data.data.notification, ...prev]);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};