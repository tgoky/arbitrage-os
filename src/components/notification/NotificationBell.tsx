"use client";

import React, { useState } from 'react';
import {
  BellOutlined,
  DeleteOutlined,
  CheckOutlined,
  DollarCircleOutlined,
  PhoneOutlined,
  RocketOutlined,
  BulbOutlined,
  MailOutlined,
  FileTextOutlined,
  EditOutlined,
  TagOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  InboxOutlined
} from '@ant-design/icons';
import {
  Badge,
  Dropdown,
  ConfigProvider,
  Button,
  List,
  Typography,
  Empty,
  Spin,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../../providers/NotificationProvider';
import { Notification, NotificationType } from '../../types/notification';

const { Text } = Typography;

const getNotificationIcon = (type: NotificationType) => {
  const iconStyle = { fontSize: '16px' };
  // Updated specifically for sales_call and lead-gen to Emerald-700
  const icons: Record<NotificationType, React.ReactNode> = {
    'pricing_calculation': <DollarCircleOutlined style={{ ...iconStyle, color: '#4ADE80' }} />,
    'sales_call': <PhoneOutlined style={{ ...iconStyle, color: '#047857' }} />, // Emerald-700
    'growth_plan': <RocketOutlined style={{ ...iconStyle, color: '#3B82F6' }} />,
    'niche_research': <BulbOutlined style={{ ...iconStyle, color: '#F59E0B' }} />,
    'cold_email': <MailOutlined style={{ ...iconStyle, color: '#EC4899' }} />,
    'offer_creator': <EditOutlined style={{ ...iconStyle, color: '#14B8A6' }} />,
    'ad_writer': <TagOutlined style={{ ...iconStyle, color: '#EAB308' }} />,
    'n8n_workflow': <ThunderboltOutlined style={{ ...iconStyle, color: '#F97316' }} />,
    'proposal': <FileTextOutlined style={{ ...iconStyle, color: '#8B5CF6' }} />,
    'lead-generation': <TeamOutlined style={{ ...iconStyle, color: '#047857' }} /> // Emerald-700
  };
  return icons[type] || <BellOutlined />;
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') await markAsRead(notification.id);
    router.push(notification.route);
    setDropdownOpen(false);
  };

  const dropdownContent = (
    <div style={{
      width: 360,
      backgroundColor: '#000000',
      borderRadius: '12px',
      border: '1px solid #262626',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #262626',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text strong style={{ color: '#FFFFFF', fontSize: '15px', letterSpacing: '-0.3px' }}>Notifications</Text>
          {unreadCount > 0 && (
            <span style={{ 
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', // Emerald-700 Gradient
                color: 'white', 
                fontSize: '10px', 
                padding: '1px 7px', 
                borderRadius: '6px',
                fontWeight: 700,
                letterSpacing: '0.5px'
            }}>
              {unreadCount} NEW
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button 
            type="text" 
            size="small" 
            onClick={markAllAsRead}
            style={{ color: '#737373', fontSize: '12px', padding: 0 }}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>


            <ConfigProvider
                     theme={{
                       token: {
                         colorPrimary: '#5CC49D',
                       },
                     }}
                   >
                     <Spin size="large"  />
                   </ConfigProvider>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <InboxOutlined style={{ fontSize: '32px', color: '#262626', marginBottom: '12px' }} />
            <Text style={{ color: '#525252', display: 'block' }}>All caught up</Text>
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <div
                onClick={() => handleNotificationClick(item)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  borderBottom: '1px solid #171717',
                  backgroundColor: item.status === 'unread' ? 'rgba(4, 120, 87, 0.03)' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#111111'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = item.status === 'unread' ? 'rgba(4, 120, 87, 0.03)' : 'transparent'}
              >
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#111111',
                    border: '1px solid #262626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(item.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Text style={{ 
                        color: item.status === 'unread' ? '#FFFFFF' : '#737373', 
                        fontSize: '13px',
                        fontWeight: item.status === 'unread' ? 600 : 400,
                        display: 'block' 
                      }}>
                        {item.title}
                      </Text>
                      <Text style={{ color: '#404040', fontSize: '10px', textTransform: 'uppercase' }}>
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                    </div>
                    
                    <Text style={{ 
                      color: '#a3a3a3', 
                      fontSize: '12px', 
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginTop: '2px'
                    }}>
                      {item.message}
                    </Text>

                    <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
                       {item.status === 'unread' && (
                         <Button 
                            type="text" 
                            size="small" 
                            icon={<CheckOutlined style={{ fontSize: '10px' }} />}
                            onClick={(e) => { e.stopPropagation(); markAsRead(item.id); }}
                            style={{ color: '#047857', padding: 0, height: 'auto', fontSize: '11px', fontWeight: 600 }}
                         >Done</Button>
                       )}
                       <Button 
                          type="text" 
                          size="small" 
                          danger
                          icon={<DeleteOutlined style={{ fontSize: '10px' }} />}
                          onClick={(e) => { e.stopPropagation(); deleteNotification(item.id); }}
                          style={{ padding: 0, height: 'auto', fontSize: '11px' }}
                       >Remove</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>
      
      <div style={{ padding: '10px', textAlign: 'center', borderTop: '1px solid #171717' }}>
        <Button type="text" block style={{ color: '#525252', fontSize: '11px' }}>
          Archive
        </Button>
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
      <div style={{ cursor: 'pointer', padding: '4px' }}>
        <Badge 
            count={unreadCount} 
            size="small"
            style={{ 
              backgroundColor: '#047857', 
              boxShadow: '0 0 0 2px #000',
              fontSize: '10px' 
            }}
        >
          <BellOutlined style={{ 
            fontSize: '19px', 
            color: unreadCount > 0 ? '#FFFFFF' : '#737373',
            transition: 'all 0.3s ease'
          }} />
        </Badge>
      </div>
    </Dropdown>
  );
};