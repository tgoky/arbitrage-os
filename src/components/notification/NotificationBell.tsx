// components/NotificationBell.tsx
"use client";

import React, { useState } from 'react';
import {
  BellOutlined,
  CloseOutlined,
  DeleteOutlined,
  CheckOutlined,
  EyeOutlined,
  DollarCircleOutlined,
  PhoneOutlined,
  RocketOutlined,
  BulbOutlined,
  MailOutlined,
  EditOutlined,
  TagOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import {
  Badge,
  Dropdown,
  Button,
  List,
  Typography,
  Space,
  Empty,
  Spin,
  Divider,
  Tooltip,
  Tag
} from 'antd';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../../providers/NotificationProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { Notification, NotificationType } from '../../types/notification';

const { Text } = Typography;

// Get icon for notification type
const getNotificationIcon = (type: NotificationType) => {
  const icons: Record<NotificationType, React.ReactNode> = {
    'pricing_calculation': <DollarCircleOutlined style={{ color: '#52c41a' }} />,
    'sales_call': <PhoneOutlined style={{ color: '#722ed1' }} />,
    'growth_plan': <RocketOutlined style={{ color: '#1890ff' }} />,
    'niche_research': <BulbOutlined style={{ color: '#fa8c16' }} />,
    'cold_email': <MailOutlined style={{ color: '#eb2f96' }} />,
    'offer_creator': <EditOutlined style={{ color: '#13c2c2' }} />,
    'ad_writer': <TagOutlined style={{ color: '#faad14' }} />,
    'n8n_workflow': <ThunderboltOutlined style={{ color: '#fa541c' }} />
  };
  return icons[type];
};

// Format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }

    // Navigate to the item
    router.push(notification.route);
    setDropdownOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const dropdownContent = (
    <div
      style={{
        width: 380,
        maxHeight: 500,
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        borderRadius: 8,
        boxShadow: theme === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Text strong style={{ color: theme === 'dark' ? '#f9fafb' : '#000' }}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={markAllAsRead}
            style={{ padding: 0 }}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '40px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No notifications"
            />
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: notification.status === 'unread'
                    ? (theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(24, 144, 255, 0.05)')
                    : 'transparent',
                  borderBottom: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #f0f0f0',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fafafa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notification.status === 'unread'
                    ? (theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(24, 144, 255, 0.05)')
                    : 'transparent';
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <Text
                        strong
                        style={{
                          color: theme === 'dark' ? '#f9fafb' : '#000',
                          fontSize: 14,
                          display: 'block'
                        }}
                      >
                        {notification.title}
                      </Text>
                      {notification.status === 'unread' && (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#1890ff',
                          flexShrink: 0,
                          marginLeft: 8,
                          marginTop: 4
                        }} />
                      )}
                    </div>

                    <Text
                      style={{
                        color: theme === 'dark' ? '#9ca3af' : '#666',
                        fontSize: 13,
                        display: 'block',
                        marginBottom: 6
                      }}
                    >
                      {notification.message}
                    </Text>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        {formatTimeAgo(notification.createdAt)}
                      </Text>

                      <Space size={4}>
                        {notification.status === 'unread' && (
                          <Tooltip title="Mark as read">
                            <Button
                              type="text"
                              size="small"
                              icon={<CheckOutlined />}
                              onClick={(e) => handleMarkAsRead(e, notification.id)}
                              style={{ padding: '2px 4px' }}
                            />
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => handleDelete(e, notification.id)}
                            style={{ padding: '2px 4px' }}
                          />
                        </Tooltip>
                      </Space>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          style={{
            color: theme === 'dark' ? '#f9fafb' : '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Badge>
    </Dropdown>
  );
};