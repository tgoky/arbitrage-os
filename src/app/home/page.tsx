"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkspace } from '../hooks/useWorkspace';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWorkItems } from '../hooks/useDashboardData';
import Image from 'next/image';

import { 
  Button, 
  Card, 
  Input, 
  Modal, 
  Typography, 
  Progress, 
  Space, 
  Avatar, 
  Dropdown, 
  Badge,
  Row,
  Col,
  Empty,
  Popover,
  List
} from 'antd';
import { 
  PlusOutlined, 
  FolderOutlined, 
  ArrowRightOutlined, 
  BellOutlined, 
  DownOutlined, 
  LoadingOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  RiseOutlined,
  CheckCircleFilled,
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

// Interfaces
interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'achievement';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  workspaceId?: string;
}

const WorkspaceHomePage = () => {
  const router = useRouter();
  const { theme } = useTheme();
  
  const { 
    workspaces, 
    isLoading: workspaceLoading, 
    createWorkspace 
  } = useWorkspace();

  const { data: userProfile, isLoading: userLoading } = useUserProfile() as {
    data: UserProfile | undefined;
    isLoading: boolean;
  };

  const { data: workItems = [] } = useWorkItems(1000);
  
  // State variables
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate metrics from work items
// Replace the entire metrics useMemo with this:
const metrics = React.useMemo(() => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get most recent item
  const sortedItems = [...workItems].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
  
  const mostRecentItem = sortedItems[0];
  
  // Count this month's items
  const thisMonthItems = workItems.filter(item => {
    if (!item.createdAt) return false;
    const itemDate = new Date(item.createdAt);
    return itemDate >= startOfMonth && itemDate <= now;
  });

  // Tool display names
  const toolNames: Record<string, string> = {
    'sales-call': 'Sales Call',
    'growth-plan': 'Growth Plan',
    'pricing-calc': 'Pricing Calc',
    'niche-research': 'Niche Research',
    'cold-email': 'Cold Email',
    'offer-creator': 'Offer Creator',
    'ad-writer': 'Ad Writer',
    'n8n-workflow': 'Workflow',
    'proposal': 'Proposal',
    'lead-generation': 'Lead Gen'
  };

  return {
    thisMonthItems: thisMonthItems.length,
    recentToolType: mostRecentItem?.type || null,
    recentToolName: mostRecentItem ? toolNames[mostRecentItem.type] || 'Tool' : 'None',
    recentToolTime: mostRecentItem?.createdAt || null
  };
}, [workItems]);

  // Generate notifications
  const notifications = React.useMemo(() => {
    const notifs: Notification[] = [];
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentItems = workItems.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return itemDate >= yesterday && itemDate <= now;
    });

    if (recentItems.length > 0) {
      const itemsByType = recentItems.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(itemsByType).forEach(([type, count]) => {
        const typeNames: Record<string, string> = {
          'sales-call': 'Sales Call Analysis',
          'growth-plan': 'Growth Plan',
          'pricing-calc': 'Pricing Calculator',
          'niche-research': 'Niche Research',
          'cold-email': 'Cold Email',
          'offer-creator': 'Signature Offer',
          'ad-writer': 'Ad Copy',
          'n8n-workflow': 'Automation Workflow'
        };

        notifs.push({
          id: `completion-${type}`,
          type: 'success',
          title: `${typeNames[type] || type} Completed`,
          description: `${count} new ${typeNames[type]?.toLowerCase() || type}${count > 1 ? 's' : ''} generated successfully`,
          timestamp: new Date(Math.max(...recentItems.filter(i => i.type === type).map(i => new Date(i.createdAt).getTime()))),
          read: false,
          actionable: true
        });
      });
    }

    if (workItems.length === 10) {
  notifs.push({
    id: 'milestone-10',
    type: 'achievement',
    title: 'First 10 Tools!',
    description: 'You\'ve generated 10 items. You\'re getting the hang of this!',
    timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    read: false
  });
} else if (workItems.length === 50) {
  notifs.push({
    id: 'milestone-50',
    type: 'achievement',
    title: '50 Tools Generated!',
    description: 'You\'re becoming a power user. Keep building!',
    timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    read: false
  });
} else if (workItems.length === 100) {
  notifs.push({
    id: 'milestone-100',
    type: 'achievement',
    title: 'Century Club!',
    description: '100 tools generated! You\'re a true arbitrageOS expert.',
    timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    read: false
  });
}

    const thisWeekItems = workItems.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return itemDate >= thisWeek;
    });

    if (thisWeekItems.length >= 5) {
      notifs.push({
        id: 'weekly-milestone',
        type: 'achievement',
        title: 'Weekly Milestone Reached!',
        description: `${thisWeekItems.length} AI tools used this week. You're on fire!`,
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        read: false
      });
    }

    if (workspaces.length === 1 && workItems.length > 3) {
      notifs.push({
        id: 'workspace-suggestion',
        type: 'info',
        title: 'Consider Creating More Workspaces',
        description: 'You might want to organize your projects into separate workspaces for better management',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000),
        read: false,
        actionable: true
      });
    }

    notifs.push({
      id: 'system-update',
      type: 'info',
      title: 'New arbitrageOS tool Available !',
      description: 'Check out the new proposal creator!',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      read: false,
      actionable: true
    });

    return notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [workItems, metrics, workspaces]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Get most recent workspace
  const mostRecentWorkspace = React.useMemo(() => {
    if (!workspaces || workspaces.length === 0) return null;
    
    const sorted = [...workspaces].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    return sorted[0];
  }, [workspaces]);

  // Extract display name from user profile
  const extractNameFromEmail = (email: string): string => {
    try {
      const localPart = email.split('@')[0];
      
      if (localPart.includes('.')) {
        return localPart
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      } else if (localPart.includes('_')) {
        return localPart
          .split('_')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      } else if (localPart.includes('-')) {
        return localPart
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      } else {
        return localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase();
      }
    } catch {
      return "User";
    }
  };

  const displayName = React.useMemo(() => {
    if (!userProfile) return "User";
    
    if (userProfile.name && userProfile.name.trim()) {
      return userProfile.name.trim();
    } else if (userProfile.email) {
      return extractNameFromEmail(userProfile.email);
    }
    
    return "User";
  }, [userProfile]);

  const userInitial = React.useMemo(() => {
    return displayName.charAt(0).toUpperCase() || 
           userProfile?.email?.charAt(0).toUpperCase() || 
           "U";
  }, [displayName, userProfile]);

  // Notification helpers
  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { style: { fontSize: '14px' } };
    switch (type) {
      case 'success':
        return <CheckCircleOutlined {...iconProps} style={{ ...iconProps.style, color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined {...iconProps} style={{ ...iconProps.style, color: '#faad14' }} />;
      case 'achievement':
        return <TrophyOutlined {...iconProps} style={{ ...iconProps.style, color: '#722ed1' }} />;
      default:
        return <InfoCircleOutlined {...iconProps} style={{ ...iconProps.style, color: '#1890ff' }} />;
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

// Notification dropdown content
  const notificationContent = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#f0f0f0'}`,
        background: theme === 'dark' ? '#1f2937' : '#fafafa'
      }}>
        <Text strong style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <Badge 
            count={unreadCount} 
            size="small" 
            style={{ marginLeft: 8 }}
          />
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Text type="secondary">No notifications yet</Text>
        </div>
      ) : (
        <List
          size="small"
          dataSource={notifications}
          style={{ 
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff' 
          }}
          renderItem={(notification) => (
            <List.Item
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#f0f0f0'}`,
                backgroundColor: !notification.read 
                  ? (theme === 'dark' ? '#1f2937' : '#f8fafc')
                  : 'transparent',
                cursor: notification.actionable ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (notification.actionable) {
                  if (notification.id.includes('completion')) {
                    router.push('/submissions');
                  } else if (notification.id === 'workspace-suggestion') {
                    setShowCreateModal(true);
                  }
                }
              }}
            >
              <List.Item.Meta
                avatar={getNotificationIcon(notification.type)}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text 
                      strong 
                      style={{ 
                        color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                        fontSize: '13px'
                      }}
                    >
                      {notification.title}
                    </Text>
                    <Text 
                      type="secondary" 
                      style={{ fontSize: '11px' }}
                    >
                      {getRelativeTime(notification.timestamp)}
                    </Text>
                  </div>
                }
                description={
                  <Text 
                    style={{ 
                      color: theme === 'dark' ? '#9ca3af' : '#666666',
                      fontSize: '12px',
                      lineHeight: 1.4
                    }}
                  >
                    {notification.description}
                  </Text>
                }
              />
              {!notification.read && (
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#1890ff',
                  marginLeft: 8
                }} />
              )}
            </List.Item>
          )}
        />
      )}
      
      {notifications.length > 0 && (
        <div style={{ 
          padding: '8px 16px', 
          borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#f0f0f0'}`,
          textAlign: 'center',
          background: theme === 'dark' ? '#1f2937' : '#fafafa'
        }}>
          <Button 
            type="text" 
            size="small"
            style={{ 
              color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
              fontSize: '12px'
            }}
          >
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  );

  // Event handlers
const handleCreateWorkspace = async () => {
  if (!newWorkspaceName.trim()) return;
  setIsCreating(true);
  
  try {
    console.log('🆕 Creating workspace:', newWorkspaceName);
    
    const newWorkspace = await createWorkspace(
      newWorkspaceName.trim(),
      newWorkspaceDescription.trim() || undefined
    );

    console.log('✅ Workspace created successfully:', newWorkspace);

    // Close modal and clear form
    setShowCreateModal(false);
    setNewWorkspaceName("");
    setNewWorkspaceDescription("");
    
    // Small delay to ensure state updates have propagated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Navigate to new workspace
    console.log('🔄 Navigating to new workspace:', newWorkspace.slug);
    router.push(`/dashboard/${newWorkspace.slug}`);
    
  } catch (error: any) {
    console.error('❌ Error creating workspace:', error);
    
    // Show error to user
    const errorMessage = error.message || 'Failed to create workspace';
    alert(`Error: ${errorMessage}`);
    
  } finally {
    setIsCreating(false);
  }
};


  const handleWorkspaceClick = (workspace: any) => {
    setSelectedWorkspace(workspace.name);
    setNavigating(true);
    setNavigationProgress(0);
    
    const interval = setInterval(() => {
      setNavigationProgress(prev => {
        const increment = Math.random() > 0.8 ? 0 : (Math.random() > 0.6 ? 4 : 2);
        return Math.min(prev + increment, 100);
      });
    }, 100);
    
    const delay = 500 + Math.random() * 1000;
    setTimeout(() => {
      clearInterval(interval);
      setNavigationProgress(100);
      setTimeout(() => {
        router.push(`/dashboard/${workspace.slug}`);
      }, 300);
    }, delay);
  };

  // Effects
  useEffect(() => {
    const runBootSequence = async () => {
      const interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() > 0.85 ? 0 : (Math.random() > 0.7 ? 2 : 1);
          return Math.min(prev + increment, 100);
        });
      }, 200);

      await new Promise(resolve => setTimeout(resolve, 3000));
      clearInterval(interval);
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
    };

    if (!workspaceLoading && !userLoading) {
      runBootSequence();
    }
  }, [workspaceLoading, userLoading]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes glow-pulse {
        0%, 100% { 
          text-shadow: 0 0 5px #5CC49D, 0 0 10px #5CC49D, 0 0 15px #5CC49D;
          transform: scale(1);
        }
        50% { 
          text-shadow: 0 0 10px #5CC49D, 0 0 20px #5CC49D, 0 0 30px #5CC49D;
          transform: scale(1.05);
        }
      }
      
      .animate-glow-pulse {
        animation: glow-pulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Filter workspaces
  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userMenuItems = [
    { key: 'profile', label: 'Profile' },
    { key: 'settings', label: 'Settings' },
    { key: 'logout', label: 'Logout' }
  ];

  // Loading state
if (isLoading || workspaceLoading || userLoading) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center pt-20" style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#f9fafb' 
    }}>
      <div className="flex flex-col items-center">
        {/* Logo above the card - reduced margin */}
        <div className="mb-4"> {/* Changed from mb-1 to mb-4 for better spacing */}
          <img
               src={theme === 'dark' ? "/aoswhite.png" : "/aosblack.png"}
            alt="ArbitrageOS Logo"
            className="h-64" // Reduced height from 340px to h-64 (256px)
            style={{ 
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
        
        <Card 
          className="w-80 text-center shadow-lg -mt-2" // Added negative margin to pull card closer
          bodyStyle={{ padding: '32px' }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            {/* Empty div - removed title content */}
          </div>
          
          <div className="space-y-4">
            <div style={{  letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 600,
    fontSize: '11px',}}>
              <Text className="text-sm font-medium">Initializing System</Text>
              <div className="flex justify-between items-center mt-2">
                <Progress 
                  percent={progress} 
                  strokeColor="#5CC49D"
                  trailColor={theme === 'dark' ? '#374151' : '#e5e7eb'}
                  size="small"
                  showInfo={false}
                  className="flex-1 mr-3"
                />
                <Text className="text-xs font-mono font-medium" style={{ color: '#5CC49D' }}>
                  {progress}%
                </Text>
              </div>
            </div>
            
            <div className="space-y-3 text-xs">
              {/* Loading workspaces */}
              <div className="flex justify-between items-center py-1">
                <Text type="secondary" className="text-xs">Loading workspaces</Text>
                <div className="flex items-center">
                  {progress >= 30 ? (
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                  ) : progress >= 15 ? (
                    <LoadingOutlined className="text-blue-500 text-sm" />
                  ) : (
                    <ClockCircleOutlined className="text-gray-400 text-sm" />
                  )}
                </div>
              </div>
              
              {/* Loading user profile */}
              <div className="flex justify-between items-center py-1">
                <Text type="secondary" className="text-xs">Loading user profile</Text>
                <div className="flex items-center">
                  {progress >= 50 ? (
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                  ) : progress >= 30 ? (
                    <LoadingOutlined className="text-blue-500 text-sm" />
                  ) : (
                    <ClockCircleOutlined className="text-gray-400 text-sm" />
                  )}
                </div>
              </div>
              
              {/* Preparing dashboard */}
              <div className="flex justify-between items-center py-1">
                <Text type="secondary" className="text-xs">Preparing dashboard</Text>
                <div className="flex items-center">
                  {progress >= 70 ? (
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                  ) : progress >= 50 ? (
                    <LoadingOutlined className="text-blue-500 text-sm" />
                  ) : (
                    <ClockCircleOutlined className="text-gray-400 text-sm" />
                  )}
                </div>
              </div>
              
              {/* Ready status */}
              <div className="flex justify-between items-center py-1">
                <Text type="secondary" className="text-xs font-medium">Ready</Text>
                <div className="flex items-center">
                  {progress >= 100 ? (
                    <div className="flex items-center gap-1">
                      <CheckCircleFilled className="text-emerald-500 text-sm" />
                      <Text className="text-emerlad-500 text-xs font-medium">Complete</Text>
                    </div>
                  ) : (
                    <Text className="text-gray-400 text-xs">Pending</Text>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

  // Main render
  return (
    <div className="min-h-screen w-full" style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#f9fafb' 
    }}>
      {/* Navigation Loading Modal */}
    {/* Navigation Loading Modal */}
<Modal
  open={navigating}
  footer={null}
  closable={false}
  centered
  width={420}
  styles={{
    body: { 
      padding: 0,
      background: theme === 'dark' ? '#1a1a1a' : '#ffffff'
    }
  }}
  className="navigation-loading-modal"
  style={{
    borderRadius: '16px',
    overflow: 'hidden',
    border: theme === 'dark' 
      ? '1px solid rgba(255,255,255,0.1)'
      : '1px solid rgba(0,0,0,0.1)',
    boxShadow: theme === 'dark'
      ? '0 20px 40px rgba(0,0,0,0.4)'
      : '0 20px 40px rgba(0,0,0,0.15)'
  }}
>
  <div className="relative overflow-hidden">
    {/* Header with subtle background */}
    <div className="relative z-10 p-6 border-b" style={{ 
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      background: theme === 'dark' ? '#1f1f1f' : '#fafafa'
    }}>
      <div className="flex items-center gap-4">
        {/* Clean workspace icon */}
        <div className="relative">
          <div className="w-12 h-12 bg-[#5CC49D] rounded-xl flex items-center justify-center shadow-lg">
            <FolderOutlined className="text-white text-lg" />
          </div>
          {/* Subtle pulsing effect */}
          <div 
            className="absolute inset-0 border-2 border-[#5CC49D] rounded-xl animate-ping opacity-20"
            style={{ animationDuration: '2s' }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <Title 
            level={4} 
            className="mb-1 font-semibold truncate"
            style={{ color: theme === 'dark' ? '#fff' : '#1a1a1a' ,   letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 600,
    fontSize: '12px',}}
          >
            Opening {selectedWorkspace}
          </Title>
          <Text 
            type="secondary"
            className="text-sm"
            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
          >
            Preparing your workspace environment...
          </Text>
        </div>
      </div>
    </div>

    {/* Progress section */}
    <div className="relative z-10 p-6">
      {/* Progress stats */}
      <div className="flex justify-between items-center mb-4">
        <Text 
          strong
          className="text-sm"
          style={{ color: theme === 'dark' ? '#e5e7eb' : '#4b5563' }}
        >
          Loading Progress
        </Text>
        <div className="flex items-center gap-2">
          <Text 
            strong
            className="text-lg font-mono"
            style={{ color: '#5CC49D' }}
          >
            {navigationProgress}%
          </Text>
          <Text 
            type="secondary"
            className="text-xs"
          >
            complete
          </Text>
        </div>
      </div>

      {/* Main progress bar */}
      <div className="relative mb-2">
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ 
            background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }}
        >
          <div 
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${navigationProgress}%`,
              background: '#5CC49D',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Subtle shimmer effect */}
            <div 
              className="absolute inset-0 bg-white opacity-30"
              style={{
                transform: 'translateX(-100%)',
                animation: 'shimmer 2s infinite'
              }}
            />
          </div>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: 'Files', complete: navigationProgress > 20 },
          { label: 'Tools', complete: navigationProgress > 50 },
          { label: 'AI Models', complete: navigationProgress > 80 }
        ].map((item, index) => (
          <div key={index} className="text-center">
            <div className="flex items-center justify-center mb-1">
              {item.complete ? (
                <CheckCircleFilled className="text-[#5CC49D] text-base" />
              ) : (
                <div 
                  className="w-3 h-3 rounded-full border-2"
                  style={{ 
                    borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db'
                  }}
                />
              )}
            </div>
            <Text 
              className="text-xs font-medium"
              style={{ 
                color: item.complete 
                  ? '#5CC49D' 
                  : (theme === 'dark' ? '#6b7280' : '#9ca3af')
              }}
            >
              {item.label}
            </Text>
          </div>
        ))}
      </div>

      {/* Loading animation */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#5CC49D] opacity-60"
              style={{
                animation: `bounce 1.4s infinite ease-in-out`,
                animationDelay: `${i * 0.16}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>

    {/* Footer with status message */}
    <div className="relative z-10 p-4 border-t text-center" style={{ 
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      background: theme === 'dark' ? '#1f1f1f' : '#fafafa'
    }}>
      <Text 
        className="text-xs font-medium"
        style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
      >
        {navigationProgress < 30 && 'Initializing workspace structure...'}
        {navigationProgress >= 30 && navigationProgress < 60 && 'Loading AI tools and templates...'}
        {navigationProgress >= 60 && navigationProgress < 90 && 'Preparing analytics dashboard...'}
        {navigationProgress >= 90 && 'Finalizing workspace setup...'}
      </Text>
    </div>
  </div>
</Modal>

      {/* Header */}
 <header className={`${theme === 'dark' ? 'bg-[#181919] border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-2`}>
  <div className="flex items-center justify-between h-12">
    {/* Logo */}
    <div className="flex items-center gap-3">
      <img
        src={theme === 'dark' ? "/aoswhite.png" : "/aosblack.png"}
        alt="ArbitrageOS Logo"
        style={{ 
          height: '140px',
          width: 'auto',
          objectFit: 'contain',
          marginRight: '16px'
        }}
      />
    </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <Search
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </div>

          {/* User Menu */}
          <Space size="middle">
            <Popover
              content={notificationContent}
              title={null}
              trigger="click"
              placement="bottomRight"
              overlayStyle={{
                borderRadius: '8px',
                boxShadow: theme === 'dark' 
                  ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Badge count={unreadCount} size="small">
                <Button 
                  type="text" 
                  icon={<BellOutlined />} 
                  style={{
                    color: theme === 'dark' ? '#fff' : '#000'
                  }}
                />
              </Badge>
            </Popover>
            
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <Button type="text" className="flex items-center gap-2">
                {userProfile?.avatar ? (
                  <Avatar 
                    size="small" 
                    src={userProfile.avatar}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                ) : (
                  <Avatar 
                    size="small" 
                    style={{ backgroundColor: '#1890ff' }}
                  >
                    {userInitial}
                  </Avatar>
                )}
                <div className="flex flex-col items-start">
                  <Text 
                    style={{ 
                      color: theme === 'dark' ? '#fff' : '#000',
                      fontSize: '12px',
                      lineHeight: 1.2
                    }}
                  >
                    {displayName}
                  </Text>
                  {userProfile?.email && (
                    <Text 
                      style={{ 
                        color: theme === 'dark' ? '#9ca3af' : '#666',
                        fontSize: '10px',
                        lineHeight: 1.2
                      }}
                    >
                      {userProfile.email.length > 20 
                        ? `${userProfile.email.substring(0, 20)}...` 
                        : userProfile.email
                      }
                    </Text>
                  )}
                </div>
                <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <Title level={3} className="mb-1" style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
            Workspace Environment
          </Title>
          <Text type="secondary" className="text-sm">
            Manage your arbitrage projects and team collaborations
          </Text>
        </div>

        {/* Stats Cards */}
        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card 
              size="small" 
              className="text-center h-full" 
              bodyStyle={{ padding: '12px 16px' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <Text type="secondary" className="text-xs block mb-1">Active Workspaces</Text>
                  <Title level={3} className="mb-0" style={{ marginBottom: 0 }}>{workspaces.length}</Title>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FolderOutlined className="text-green-600 text-sm" />
                </div>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card 
              size="small" 
              className="text-center h-full" 
              bodyStyle={{ padding: '12px 16px' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <Text type="secondary" className="text-xs block mb-1">Recent Workspace</Text>
                  <Title 
                    
                    level={4} 
                    className="mb-0" 
                    style={{ 
                      marginBottom: 0, 
                      fontSize: '16px',
                      lineHeight: 1.2
                    }}
                    ellipsis={{ tooltip: mostRecentWorkspace?.name }}
                  >
                    {mostRecentWorkspace?.name || "None"}
                  </Title>
                  {mostRecentWorkspace && (
                    <Text 
                      type="secondary" 
                      className="text-xs"
                      title={`Last used: ${new Date(mostRecentWorkspace.updated_at || mostRecentWorkspace.created_at || 0).toLocaleString()}`}
                    >
                      {new Date(mostRecentWorkspace.updated_at || mostRecentWorkspace.created_at || 0).toLocaleDateString()}
                    </Text>
                  )}
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <HistoryOutlined className="text-blue-600 text-sm" />
                </div>
              </div>
            </Card>
          </Col>
          
        <Col xs={24} sm={8}>
  <Card 
    size="small" 
    className="text-center h-full" 
    bodyStyle={{ padding: '12px 16px' }}
  >
    <div className="flex items-center justify-between">
      <div className="text-left">
        <Text type="secondary" className="text-xs block mb-1">Recent Tool Used</Text>
        <Title 
          level={4} 
          className="mb-0" 
          style={{ 
            marginBottom: 0, 
            fontSize: '16px',
            lineHeight: 1.2,
            color: theme === 'dark' ? '#fff' : '#000'
          }}
          ellipsis={{ tooltip: metrics.recentToolName }}
        >
          {metrics.recentToolName}
        </Title>
        {metrics.recentToolTime && (
          <Text 
            type="secondary" 
            className="text-xs"
            title={new Date(metrics.recentToolTime).toLocaleString()}
          >
            {(() => {
              const now = new Date();
              const itemDate = new Date(metrics.recentToolTime);
              const diffMs = now.getTime() - itemDate.getTime();
              const diffMins = Math.floor(diffMs / (1000 * 60));
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              
              if (diffMins < 1) return 'Just now';
              if (diffMins < 60) return `${diffMins}m ago`;
              if (diffHours < 24) return `${diffHours}h ago`;
              if (diffDays === 1) return 'Yesterday';
              return `${diffDays}d ago`;
            })()}
          </Text>
        )}
      </div>
      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
        <RiseOutlined className="text-purple-600 text-sm" />
      </div>
    </div>
  </Card>
</Col>

        </Row>

        {/* Workspaces Grid */}
        <Row gutter={[16, 16]}>
          {/* Create New Workspace Card */}
          <Col xs={12} sm={12} md={8} lg={6} xl={6}>
            <Card
              hoverable
              size="small"
              className="cursor-pointer border-dashed h-full"
              style={{ 
                borderStyle: 'dashed', 
                borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                height: '140px'
              }}
              bodyStyle={{ 
                padding: '16px', 
                height: '100%', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setShowCreateModal(true)}
            >
              <div className="flex flex-col items-center justify-center w-full text-center">
                <div className="w-10 h-10 bg-[#063f48] rounded-lg flex items-center justify-center mb-2">
                  <PlusOutlined className="text-white text-sm" />
                </div>
                <Text className="text-sm font-medium">New Workspace</Text>
              </div>
            </Card>
          </Col>

          {/* Existing Workspaces */}
          {filteredWorkspaces.map((workspace) => (
            <Col xs={12} sm={12} md={8} lg={6} xl={6} key={workspace.id}>
              <Card
                hoverable
                size="small"
                className="cursor-pointer h-full"
                style={{ height: '140px' }}
                bodyStyle={{ 
                  padding: '16px', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column' 
                }}
                onClick={() => handleWorkspaceClick(workspace)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 bg-[#5CC49D] rounded flex items-center justify-center flex-shrink-0">
                      <FolderOutlined className="text-white text-sm" />
                    </div>
                    <ArrowRightOutlined className="text-gray-400 text-xs mt-1" />
                  </div>
                  
                  <div className="flex-1 min-h-0 mb-3">
                    <Text 
                      className="text-sm font-semibold block mb-2 leading-tight" 
                      ellipsis={{ tooltip: workspace.name }}
                      style={{ lineHeight: '1.2' }}
                    >
                      {workspace.name}
                    </Text>
                    
                    {workspace.description && (
                      <div className="mt-1">
                        <Text 
                          type="secondary" 
                          className="text-xs leading-relaxed block" 
                          ellipsis={{ tooltip: workspace.description }}
                          style={{ 
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            height: '36px'
                          }}
                        >
                          {workspace.description}
                        </Text>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 mt-1">
                    <Text type="secondary" className="text-xs">
                      {workspace.created_at 
                        ? new Date(workspace.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })
                        : 'Recent'}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Empty State */}
        {workspaces.length === 0 && !searchQuery && (
          <div className="text-center py-16">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={4} className="mb-2">No workspaces yet</Title>
                  <Text type="secondary" className="text-sm">
                    Create your first workspace to start managing your arbitrage projects
                  </Text>
                </div>
              }
            >
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />}
                onClick={() => setShowCreateModal(true)}
                style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D'  }}
              >
                Create Workspace
              </Button>
            </Empty>
          </div>
        )}

        {/* No Search Results */}
        {searchQuery && filteredWorkspaces.length === 0 && (
          <div className="text-center py-16">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={4} className="mb-2">No results found</Title>
                  <Text type="secondary" className="text-sm">
                    Try adjusting your search terms
                  </Text>
                </div>
              }
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`${theme === 'dark' ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} border-t mt-auto px-6 py-2`}>
        <div className="flex items-center justify-center">
          <Text type="secondary" className="text-xs">
            <span className="" style={{ color: '#5CC49D' }}>arbitrage</span>OS by{' '}
            <span  style={{ color: '#5CC49D' }}>GrowAI</span>
            {' '}© 2025 • Automate & Grow
          </Text>
        </div>
      </footer>

      {/* Create Workspace Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <PlusOutlined className="text-white text-sm" />
            </div>
            <div>
              <Title level={4} className="mb-0">Create New Workspace</Title>
              <Text type="secondary" className="text-sm">Start a new arbitrage project</Text>
            </div>
          </div>
        }
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowCreateModal(false)} disabled={isCreating}>
            Cancel
          </Button>,
          <Button
            key="create"
            type="primary"
            loading={isCreating}
            disabled={!newWorkspaceName.trim()}
            onClick={handleCreateWorkspace}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
          >
            Create Workspace
          </Button>
        ]}
      >
        <div className="space-y-4 pt-4">
          <div>
            <Text strong className="block mb-2">Workspace Name</Text>
            <Input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="My Arbitrage Project"
              autoFocus
            />
          </div>
          
          <div>
            <Text strong className="block mb-2">
              Description <Text type="secondary">(optional)</Text>
            </Text>
            <Input.TextArea
              value={newWorkspaceDescription}
              onChange={(e) => setNewWorkspaceDescription(e.target.value)}
              placeholder="Describe your project goals..."
              rows={3}
              style={{ resize: 'none' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkspaceHomePage;