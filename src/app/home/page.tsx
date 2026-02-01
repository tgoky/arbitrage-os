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
  List,
  ConfigProvider,
  theme as antTheme,
  Divider
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
  TrophyOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SafetyOutlined,
  SearchOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  ThunderboltFilled,
  CodeOutlined,
  ConsoleSqlOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_CARD = '#09090b';
const SURFACE_ELEVATED = '#18181b';
const BORDER_COLOR = '#27272a';
const TEXT_SECONDARY = '#a1a1aa';
const TEXT_PRIMARY = '#ffffff';

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

  // Password setup state
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordSetSuccess, setPasswordSetSuccess] = useState(false);

  // --- FONT INJECTION ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Calculate metrics from work items
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

  // Generate notifications (Logic kept identical)
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
      // Logic for formatting name from email...
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    } catch {
      return "User";
    }
  };

  const displayName = React.useMemo(() => {
    if (!userProfile) return "User";
    if (userProfile.name && userProfile.name.trim()) return userProfile.name.trim();
    if (userProfile.email) return extractNameFromEmail(userProfile.email);
    return "User";
  }, [userProfile]);

  const userInitial = React.useMemo(() => {
    return displayName.charAt(0).toUpperCase() || "U";
  }, [displayName]);

  // Notification helpers
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircleOutlined style={{ fontSize: '14px', color: BRAND_GREEN }} />;
      case 'warning': return <ExclamationCircleOutlined style={{ fontSize: '14px', color: '#faad14' }} />;
      case 'achievement': return <TrophyOutlined style={{ fontSize: '14px', color: '#722ed1' }} />;
      default: return <InfoCircleOutlined style={{ fontSize: '14px', color: '#3b82f6' }} />;
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffMs / (1000 * 60 * 60 * 24))}d ago`;
  };

  // Notification content
  const notificationContent = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto', backgroundColor: SURFACE_CARD }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER_COLOR}`, background: SURFACE_ELEVATED }}>
        <Text strong style={{ color: '#fff' }}>Notifications</Text>
        {unreadCount > 0 && <Badge count={unreadCount} size="small" style={{ marginLeft: 8, backgroundColor: BRAND_GREEN }} />}
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center' }}><Text type="secondary">No notifications</Text></div>
      ) : (
        <List
          size="small"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER_COLOR}`, cursor: item.actionable ? 'pointer' : 'default' }}>
              <List.Item.Meta
                avatar={getNotificationIcon(item.type)}
                title={<div style={{ display: 'flex', justifyContent: 'space-between' }}><Text style={{ color: '#fff', fontSize: '13px' }}>{item.title}</Text><Text type="secondary" style={{ fontSize: '10px' }}>{getRelativeTime(item.timestamp)}</Text></div>}
                description={<Text type="secondary" style={{ fontSize: '12px' }}>{item.description}</Text>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreating(true);
    try {
      const newWorkspace = await createWorkspace(newWorkspaceName.trim(), newWorkspaceDescription.trim() || undefined);
      setShowCreateModal(false);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
      router.push(`/dashboard/${newWorkspace.slug}`);
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to create workspace'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleWorkspaceClick = (workspace: any) => {
    setSelectedWorkspace(workspace.name);
    setNavigating(true);
    setNavigationProgress(0);
    const interval = setInterval(() => {
      setNavigationProgress(prev => Math.min(prev + (Math.random() * 5), 100));
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      router.push(`/dashboard/${workspace.slug}`);
    }, 1500);
  };

  // Effects
  useEffect(() => {
    const runBootSequence = async () => {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + (Math.random() * 3), 100));
      }, 100);
      setTimeout(() => { clearInterval(interval); setProgress(100); setTimeout(() => setIsLoading(false), 500); }, 2000);
    };
    if (!workspaceLoading && !userLoading) runBootSequence();
  }, [workspaceLoading, userLoading]);

  // Check Password
  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const response = await fetch('/api/auth/set-password');
        const data = await response.json();
        if (data.success) setHasPassword(data.hasPassword);
      } catch (error) { console.error(error); }
    };
    if (!userLoading && userProfile) checkPasswordStatus();
  }, [userLoading, userProfile]);

  // Handle password setup
  const handleSetPassword = async () => {
    setPasswordError('');
    if (password.length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    setIsSettingPassword(true);
    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (data.success) {
        setPasswordSetSuccess(true);
        setHasPassword(true);
        setTimeout(() => { setShowPasswordModal(false); setPassword(''); setConfirmPassword(''); setPasswordSetSuccess(false); }, 2000);
      } else {
        setPasswordError(data.error || 'Failed to set password');
      }
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to set password');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

 const userMenuItems = [
  { key: 'profile', label: 'Profile', icon: <UserOutlined /> },
  { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
  { type: 'divider' as const },
  { key: 'logout', label: 'Logout', icon: <LogoutOutlined /> }
];

  // ==================== RENDER ====================

  // UPDATED Loading Screen
  if (isLoading || workspaceLoading || userLoading) {
    // Determine system log text based on progress
    let logText = "> Initializing kernel...";
    if (progress > 20) logText = "> Mounting volumes...";
    if (progress > 40) logText = "> Verifying user privileges...";
    if (progress > 60) logText = "> Loading interface modules...";
    if (progress > 80) logText = "> Establishing secure connection...";
    if (progress >= 98) logText = "> System Ready.";

    return (
      <div style={{ 
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#000',
        backgroundImage: 'radial-gradient(circle at center, #111 0%, #000 70%)',
        fontFamily: 'Manrope, sans-serif' 
      }}>
        <div style={{ 
          width: '380px',
          padding: '40px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Logo Animation */}
          <div style={{ 
            marginBottom: '32px', 
            position: 'relative',
            filter: 'drop-shadow(0 0 15px rgba(92, 196, 157, 0.3))'
          }}>
             <img 
              src="/aoswhite.png" 
              alt="ArbitrageOS" 
              style={{ 
                height: '160px', 
                objectFit: 'contain',
                opacity: 0.9 + (Math.sin(Date.now() / 200) * 0.1) // Subtle breath effect
              }} 
            />
          </div>

          <div style={{ width: '100%' }}>
            {/* Status Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-end' }}>
              <Text style={{ 
                color: BRAND_GREEN, 
                fontSize: '11px', 
                fontFamily: 'JetBrains Mono, monospace', 
                textTransform: 'uppercase', 
                letterSpacing: '2px',
                textShadow: `0 0 10px ${BRAND_GREEN}40`
              }}>
                <LoadingOutlined spin style={{ marginRight: 8 }} />
                System Boot
              </Text>
              <Text style={{ color: '#fff', fontSize: '14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                {Math.round(progress)}%
              </Text>
            </div>

            {/* Progress Bar */}
            <div style={{ 
              height: '4px', 
              backgroundColor: '#222', 
              borderRadius: '2px', 
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
            }}>
              <div style={{ 
                height: '100%', 
                width: `${progress}%`, 
                backgroundColor: BRAND_GREEN, 
                transition: 'width 0.1s linear',
                boxShadow: `0 0 15px ${BRAND_GREEN}, 0 0 5px ${BRAND_GREEN}`
              }}></div>
            </div>

            {/* Terminal Logs */}
            <div style={{ 
              marginTop: '24px', 
              height: '20px',
              display: 'flex', 
              alignItems: 'center',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '12px'
            }}>
               <Text style={{ 
                 color: '#666', 
                 fontSize: '11px', 
                 fontFamily: 'JetBrains Mono, monospace',
                 whiteSpace: 'nowrap',
                 overflow: 'hidden',
                 textOverflow: 'ellipsis',
                 width: '100%'
               }}>
                 {logText} <span className="animate-pulse">_</span>
               </Text>
            </div>
          </div>
        </div>
        
        {/* Version Footer */}
        <div style={{ position: 'absolute', bottom: '30px', color: '#333', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>
          v2.4.0-stable
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: {
          colorPrimary: BRAND_GREEN,
          fontFamily: 'Manrope, sans-serif',
          colorBgContainer: SURFACE_CARD,
          colorBgElevated: SURFACE_ELEVATED,
          colorBorder: BORDER_COLOR,
          colorText: TEXT_PRIMARY,
          colorTextSecondary: TEXT_SECONDARY,
          borderRadius: 8,
        },
        components: {
          Button: { fontWeight: 600, defaultBg: 'transparent', defaultBorderColor: BORDER_COLOR },
          Input: { colorBgContainer: '#000000', activeBorderColor: BRAND_GREEN, hoverBorderColor: BRAND_GREEN },
          Card: { headerBg: 'transparent', boxShadow: 'none' },
          Modal: { contentBg: SURFACE_CARD, headerBg: SURFACE_CARD }
        }
      }}
    >
      <div style={{ minHeight: '100vh', backgroundColor: DARK_BG, fontFamily: 'Manrope, sans-serif', display: 'flex', flexDirection: 'column' }}>
        
      {/* --- HEADER --- */}
{/* --- HEADER --- */}
{/* --- HEADER --- */}
<header style={{ 
  height: '70px', 
  width: '100%',
  borderBottom: `1px solid ${BORDER_COLOR}`, 
  display: 'flex', 
  alignItems: 'center',
  justifyContent: 'space-between', /* <--- THIS IS THE KEY CHANGE */
  padding: '0 32px',
  backgroundColor: 'rgba(0,0,0,0.95)', 
  backdropFilter: 'blur(10px)',
  position: 'sticky',
  top: 0,
  zIndex: 1000, 
  boxSizing: 'border-box'
}}>
  {/* 1. Logo Section (Left) */}
  <div style={{ 
    display: 'flex', 
    alignItems: 'center',
    flexShrink: 0
  }}>
    <img 
      src="/aoswhite.png" 
      alt="ArbitrageOS" 
      style={{ 
        height: '40px',
        width: 'auto',
        objectFit: 'contain'
      }} 
    />
  </div>

  {/* REMOVED THE EMPTY SPACER DIV HERE */}

  {/* 2. Notification and Profile Section (Right) */}
  <div style={{ 
    display: 'flex', 
    alignItems: 'center',
    gap: '20px'
  }}>
    {/* Notification Bell */}
    <Popover 
      content={notificationContent} 
      trigger="click" 
      placement="bottomRight"
    >
      <Badge 
        count={unreadCount} 
        size="small" 
        color={BRAND_GREEN}
        style={{ cursor: 'pointer' }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          backgroundColor: SURFACE_ELEVATED,
          border: `1px solid ${BORDER_COLOR}`,
          cursor: 'pointer'
        }}>
          <BellOutlined style={{ 
            fontSize: '18px', 
            color: TEXT_SECONDARY 
          }} />
        </div>
      </Badge>
    </Popover>

    {/* Profile Avatar */}
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px',
      cursor: 'pointer'
    }}>
      <Avatar 
        src={userProfile?.avatar} 
        style={{ 
          backgroundColor: SURFACE_ELEVATED, 
          border: `1px solid ${BORDER_COLOR}`, 
          color: BRAND_GREEN,
          width: '40px',
          height: '40px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {userInitial}
      </Avatar>
    </div>
  </div>
</header>

        {/* --- MAIN CONTENT --- */}
              {/* Main Content - UPDATED FOR FULL WIDTH */}
        <main style={{ 
          flex: 1, 
          padding: '40px',
          width: '100%',
          minHeight: 'calc(100vh - 140px)',
          backgroundColor: theme === 'dark' ? '#000000' : '#f9fafb'
        }}>
          
          {/* Welcome Section */}
          <div style={{ 
            marginBottom: '32px',
            maxWidth: '100%'
          }}>
            <Title level={3} style={{ 
              color: theme === 'dark' ? '#fff' : '#000',
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
              Workspace Environment
            </Title>
            <Text style={{ 
              color: theme === 'dark' ? '#a1a1aa' : '#6b7280',
              fontSize: '14px'
            }}>
              Manage your arbitrage projects and team collaborations
            </Text>
          </div>

          {/* Stats Cards - FULL WIDTH */}
          <div style={{ 
            width: '100%',
            marginBottom: '40px'
          }}>
            <Row gutter={[20, 20]} style={{ width: '100%' }}>
              <Col xs={24} sm={8} style={{ width: '33.33%' }}>
                <div style={{ 
                  height: '100px',
                  borderRadius: '12px',
                  border: `1px solid ${theme === 'dark' ? '#27272a' : '#e5e7eb'}`,
                  backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ 
                      color: theme === 'dark' ? '#a1a1aa' : '#6b7280',
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Active Workspaces
                    </div>
                    <div style={{ 
                      color: theme === 'dark' ? '#fff' : '#000',
                      fontSize: '28px',
                      fontWeight: 700
                    }}>
                      {workspaces.length}
                    </div>
                  </div>
                  <div style={{ 
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: theme === 'dark' ? 'rgba(92, 196, 157, 0.1)' : 'rgba(92, 196, 157, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FolderOutlined style={{ 
                      color: '#5CC49D',
                      fontSize: '20px'
                    }} />
                  </div>
                </div>
              </Col>
              
              <Col xs={24} sm={8} style={{ width: '33.33%' }}>
                <div style={{ 
                  height: '100px',
                  borderRadius: '12px',
                  border: `1px solid ${theme === 'dark' ? '#27272a' : '#e5e7eb'}`,
                  backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      color: theme === 'dark' ? '#a1a1aa' : '#6b7280',
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Recent Workspace
                    </div>
                    <div style={{ 
                      color: theme === 'dark' ? '#fff' : '#000',
                      fontSize: '16px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '4px'
                    }}>
                      {mostRecentWorkspace?.name || "None"}
                    </div>
                    {mostRecentWorkspace && (
                      <div style={{ 
                        color: theme === 'dark' ? '#71717a' : '#9ca3af',
                        fontSize: '12px'
                      }}>
                        {new Date(mostRecentWorkspace.updated_at || mostRecentWorkspace.created_at || 0).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '12px'
                  }}>
                    <HistoryOutlined style={{ 
                      color: '#3b82f6',
                      fontSize: '20px'
                    }} />
                  </div>
                </div>
              </Col>
              
              <Col xs={24} sm={8} style={{ width: '33.33%' }}>
                <div style={{ 
                  height: '100px',
                  borderRadius: '12px',
                  border: `1px solid ${theme === 'dark' ? '#27272a' : '#e5e7eb'}`,
                  backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      color: theme === 'dark' ? '#a1a1aa' : '#6b7280',
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Recent Tool Used
                    </div>
                    <div style={{ 
                      color: theme === 'dark' ? '#fff' : '#000',
                      fontSize: '16px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '4px'
                    }}>
                      {metrics.recentToolName}
                    </div>
                    {metrics.recentToolTime && (
                      <div style={{ 
                        color: theme === 'dark' ? '#71717a' : '#9ca3af',
                        fontSize: '12px'
                      }}>
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
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '12px'
                  }}>
                    <RiseOutlined style={{ 
                      color: '#8b5cf6',
                      fontSize: '20px'
                    }} />
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Workspaces Grid Header */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            width: '100%'
          }}>
            <Title level={4} style={{ 
              color: theme === 'dark' ? '#fff' : '#000',
              margin: 0,
              fontSize: '20px',
              fontWeight: 600
            }}>
              Your Workspaces
            </Title>
          </div>

          {/* Workspaces Grid - FIXED FULL WIDTH */}
          <div style={{ width: '100%' }}>
            <Row gutter={[20, 20]} style={{ width: '100%', margin: 0 }}>
              {/* Create New Workspace Card */}
              <Col xs={24} sm={12} md={8} lg={6} xl={4} style={{ width: '20%', minWidth: '200px' }}>
                <div 
                  onClick={() => setShowCreateModal(true)}
                  style={{ 
                    height: '160px',
                    borderRadius: '12px',
                    border: `2px dashed ${theme === 'dark' ? '#27272a' : '#d1d5db'}`,
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#5CC49D';
                    e.currentTarget.style.backgroundColor = theme === 'dark' 
                      ? 'rgba(92, 196, 157, 0.05)' 
                      : 'rgba(92, 196, 157, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme === 'dark' ? '#27272a' : '#d1d5db';
                    e.currentTarget.style.backgroundColor = theme === 'dark' 
                      ? 'rgba(255, 255, 255, 0.02)' 
                      : 'rgba(0, 0, 0, 0.02)';
                  }}
                >
                  <div style={{ 
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: theme === 'dark' ? '#063f48' : '#5CC49D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <PlusOutlined style={{ 
                      color: '#fff',
                      fontSize: '18px'
                    }} />
                  </div>
                  <Text style={{ 
                    color: theme === 'dark' ? '#fff' : '#000',
                    fontSize: '14px',
                    fontWeight: 600
                  }}>
                    New Workspace
                  </Text>
                </div>
              </Col>

              {/* Existing Workspaces - DYNAMIC WIDTH */}
              {filteredWorkspaces.map((workspace) => (
                <Col 
                  key={workspace.id} 
                  xs={24} 
                  sm={12} 
                  md={8} 
                  lg={6} 
                  xl={4}
                  style={{ 
                    width: '20%',
                    minWidth: '200px'
                  }}
                >
                  <div 
                    onClick={() => handleWorkspaceClick(workspace)}
                    style={{ 
                      height: '160px',
                      borderRadius: '12px',
                      border: `1px solid ${theme === 'dark' ? '#27272a' : '#e5e7eb'}`,
                      backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#5CC49D';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = theme === 'dark'
                        ? '0 12px 32px rgba(0, 0, 0, 0.3)'
                        : '0 12px 32px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme === 'dark' ? '#27272a' : '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}>
                      <div style={{ 
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#5CC49D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FolderOutlined style={{ 
                          color: '#fff',
                          fontSize: '16px'
                        }} />
                      </div>
                      <ArrowRightOutlined style={{ 
                        color: theme === 'dark' ? '#71717a' : '#9ca3af',
                        fontSize: '14px',
                        marginTop: '4px'
                      }} />
                    </div>
                    
                    <div style={{ 
                      flex: 1,
                      minHeight: 0,
                      marginBottom: '12px'
                    }}>
                      <Text strong style={{ 
                        color: theme === 'dark' ? '#fff' : '#000',
                        fontSize: '16px',
                        display: 'block',
                        marginBottom: '6px',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {workspace.name}
                      </Text>
                      
                      {workspace.description && (
                        <div style={{ marginTop: '6px' }}>
                          <Text style={{ 
                            color: theme === 'dark' ? '#71717a' : '#6b7280',
                            fontSize: '12px',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            height: '32px'
                          }}>
                            {workspace.description}
                          </Text>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ 
                      marginTop: 'auto',
                      paddingTop: '12px',
                      borderTop: `1px solid ${theme === 'dark' ? '#27272a' : '#f3f4f6'}`
                    }}>
                      <Text style={{ 
                        fontSize: '12px',
                        color: theme === 'dark' ? '#71717a' : '#9ca3af'
                      }}>
                        {workspace.created_at 
                          ? new Date(workspace.created_at).toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Recent'}
                      </Text>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          {/* Empty State */}
          {workspaces.length === 0 && !searchQuery && (
            <div style={{ 
              padding: '80px 0',
              textAlign: 'center',
              marginTop: '60px',
              width: '100%'
            }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Title level={4} style={{ 
                      marginBottom: '12px',
                      color: theme === 'dark' ? '#fff' : '#000',
                      fontSize: '20px'
                    }}>
                      No workspaces yet
                    </Title>
                    <Text style={{ 
                      color: theme === 'dark' ? '#a1a1aa' : '#6b7280',
                      fontSize: '15px',
                      maxWidth: '400px',
                      margin: '0 auto'
                    }}>
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
                  style={{ 
                    backgroundColor: '#5CC49D',
                    borderColor: '#5CC49D',
                    color: '#000',
                    fontWeight: 600,
                    height: '44px',
                    padding: '0 32px',
                    fontSize: '15px',
                    marginTop: '20px'
                  }}
                >
                  Create Workspace
                </Button>
              </Empty>
            </div>
          )}

          {/* No Search Results */}
          {searchQuery && filteredWorkspaces.length === 0 && (
            <div style={{ 
              padding: '80px 0',
              textAlign: 'center',
              marginTop: '60px',
              width: '100%'
            }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Title level={4} style={{ 
                      marginBottom: '12px',
                      color: theme === 'dark' ? '#fff' : '#000',
                      fontSize: '20px'
                    }}>
                      No results found
                    </Title>
                    <Text style={{ 
                      color: theme === 'dark' ? '#a1a1aa' : '#6b7280',
                      fontSize: '15px',
                      maxWidth: '400px',
                      margin: '0 auto'
                    }}>
                      Try adjusting your search terms
                    </Text>
                  </div>
                } 
              />
            </div>
          )}
        </main>

        {/* --- MODALS --- */}

        {/* Create Workspace */}
        <Modal
          title={<span style={{ fontFamily: 'Manrope' }}>Create New Workspace</span>}
          open={showCreateModal}
          onCancel={() => setShowCreateModal(false)}
          footer={null}
          width={480}
        >
          <div style={{ marginTop: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <Text style={{ display: 'block', marginBottom: '8px', color: TEXT_SECONDARY }}>Name</Text>
              <Input 
                value={newWorkspaceName} 
                onChange={e => setNewWorkspaceName(e.target.value)} 
                placeholder="e.g. Marketing Campaign Q1" 
                size="large"
              />
            </div>
            <div style={{ marginBottom: '32px' }}>
              <Text style={{ display: 'block', marginBottom: '8px', color: TEXT_SECONDARY }}>Description (Optional)</Text>
              <Input.TextArea 
                value={newWorkspaceDescription} 
                onChange={e => setNewWorkspaceDescription(e.target.value)} 
                rows={3} 
                placeholder="What's this workspace for?" 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button 
                type="primary" 
                onClick={handleCreateWorkspace} 
                loading={isCreating} 
                disabled={!newWorkspaceName.trim()}
                style={{ backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000', fontWeight: 600 }}
              >
                Create Workspace
              </Button>
            </div>
          </div>
        </Modal>

        {/* Password Modal */}
        <Modal
          title={null}
          open={showPasswordModal}
          footer={null}
          closable={false}
          width={440}
          styles={{ body: { padding: '32px' } }}
        >
          {passwordSetSuccess ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircleFilled style={{ fontSize: '48px', color: BRAND_GREEN, marginBottom: '24px' }} />
              <Title level={3} style={{ color: '#fff', marginBottom: '12px' }}>All Set!</Title>
              <Text style={{ color: TEXT_SECONDARY }}>Your password has been created successfully.</Text>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(92, 196, 157, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: `1px solid ${BRAND_GREEN}40` }}>
                  <SafetyOutlined style={{ fontSize: '28px', color: BRAND_GREEN }} />
                </div>
                <Title level={3} style={{ color: '#fff', marginBottom: '8px', margin: 0 }}>Set Password</Title>
                <Text style={{ color: TEXT_SECONDARY }}>Secure your account with a strong password.</Text>
              </div>

              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Input.Password 
                  placeholder="New Password" 
                  size="large" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
                <Input.Password 
                  placeholder="Confirm Password" 
                  size="large" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
                
                {passwordError && (
                  <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <ExclamationCircleOutlined style={{ color: '#ef4444' }} />
                    <Text style={{ color: '#ef4444', fontSize: '13px' }}>{passwordError}</Text>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <Button block size="large" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
                  <Button 
                    block 
                    type="primary" 
                    size="large" 
                    loading={isSettingPassword}
                    onClick={handleSetPassword}
                    style={{ backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000', fontWeight: 600 }}
                  >
                    Set Password
                  </Button>
                </div>
              </Space>
            </div>
          )}
        </Modal>

        {/* Navigation Loader */}
        <Modal
          open={navigating}
          footer={null}
          closable={false}
          centered
          width={400}
          styles={{ body: { padding: 0, backgroundColor: SURFACE_CARD, overflow: 'hidden', borderRadius: '16px', border: `1px solid ${BORDER_COLOR}` } }}
        >
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ marginBottom: '24px', position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
               <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', border: `2px solid ${BRAND_GREEN}`, opacity: 0.2 }}></div>
               <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', border: `2px solid ${BRAND_GREEN}`, borderTopColor: 'transparent', borderLeftColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
               <FolderOutlined style={{ fontSize: '32px', color: BRAND_GREEN, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>
            <Title level={4} style={{ color: '#fff', marginBottom: '8px' }}>Opening Workspace</Title>
            <Text style={{ color: TEXT_SECONDARY, fontSize: '13px', marginBottom: '24px', display: 'block' }}>Preparing your environment...</Text>
            <div style={{ height: '4px', backgroundColor: SURFACE_ELEVATED, borderRadius: '2px', overflow: 'hidden', maxWidth: '200px', margin: '0 auto' }}>
               <div style={{ height: '100%', backgroundColor: BRAND_GREEN, width: `${navigationProgress}%`, transition: 'width 0.1s linear' }}></div>
            </div>
          </div>
        </Modal>

      </div>
    </ConfigProvider>
  );
};

export default WorkspaceHomePage;