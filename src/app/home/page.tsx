"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogout } from "@refinedev/core";
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkspace } from '../hooks/useWorkspace';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWorkItems } from '../hooks/useDashboardData';
import Image from 'next/image';
import { Power } from "lucide-react";

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
const SURFACE_ELEVATED = '#000000';
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

// Logout Dialog
interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutDialog: React.FC<LogoutDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 backdrop-blur-sm font-manrope">
      <div className="border border-black bg-black w-80 rounded-lg shadow-2xl overflow-hidden">
        <div className="bg-black text-white px-3 py-2 flex justify-between items-center border-b border-black">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-[#5CC49D]" />
            <span className="font-bold text-xs tracking-widest text-zinc-400">SYSTEM LOGOFF</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">×</button>
        </div>
        <div className="p-6 bg-black text-gray-300">
          <p className="mb-6 text-sm text-zinc-400">Terminate session and return to login?</p>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              CANCEL
            </button>
            <button
              className="px-4 py-1.5 bg-[#5CC49D] text-black text-xs font-bold rounded hover:bg-[#4ab08b] transition-colors"
              onClick={onConfirm}
            >
              CONFIRM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkspaceHomePage = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { mutate: logout } = useLogout();

  const {
    workspaces,
    isLoading: workspaceHookLoading,
    createWorkspace,
    refreshWorkspaces
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
  const [dataReady, setDataReady] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Logout handler
  const handleLogout = () => setShowLogoutDialog(true);

  // Keep loading until we actually have workspace data OR confirmed empty after load
  const workspaceLoading = workspaceHookLoading || (!dataReady && !workspaceHookLoading);

  // Effect to check if data is ready and retry if needed
  useEffect(() => {
    // If hook says loading is done
    if (!workspaceHookLoading && !userLoading) {
      // If we have workspaces, data is ready
      if (workspaces.length > 0) {
        setDataReady(true);
      } else {
        // No workspaces yet - could be first load or user has none
        // Try refreshing once to make sure
        const retryTimeout = setTimeout(async () => {
          console.log('No workspaces found, attempting refresh...');
          try {
            await refreshWorkspaces();
          } catch (e) {
            console.error('Refresh failed:', e);
          }
          // After retry, mark data as ready regardless (user may have no workspaces)
          setDataReady(true);
        }, 500);

        return () => clearTimeout(retryTimeout);
      }
    }
  }, [workspaceHookLoading, userLoading, workspaces.length, refreshWorkspaces]);

  // Password setup state (ADDED FROM CODE 1)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordSetSuccess, setPasswordSetSuccess] = useState(false);

  // --- FONT INJECTION (ADDED FROM CODE 1) ---
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

  // Notification content (UPDATED FROM CODE 1)
  const notificationContent = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto', backgroundColor: theme === 'dark' ? SURFACE_CARD : '#ffffff' }}>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: `1px solid ${theme === 'dark' ? BORDER_COLOR : '#f0f0f0'}`, 
        background: theme === 'dark' ? SURFACE_ELEVATED : '#fafafa'
      }}>
        <Text strong style={{ color: theme === 'dark' ? '#fff' : '#000' }}>Notifications</Text>
        {unreadCount > 0 && <Badge count={unreadCount} size="small" style={{ marginLeft: 8, backgroundColor: BRAND_GREEN }} />}
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center' }}><Text type="secondary">No notifications</Text></div>
      ) : (
        <List
          size="small"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item style={{ 
              padding: '12px 16px', 
              borderBottom: `1px solid ${theme === 'dark' ? BORDER_COLOR : '#f0f0f0'}`, 
              cursor: item.actionable ? 'pointer' : 'default',
              backgroundColor: theme === 'dark' ? SURFACE_CARD : '#ffffff'
            }}>
              <List.Item.Meta
                avatar={getNotificationIcon(item.type)}
                title={<div style={{ display: 'flex', justifyContent: 'space-between' }}><Text style={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '13px' }}>{item.title}</Text><Text type="secondary" style={{ fontSize: '10px' }}>{getRelativeTime(item.timestamp)}</Text></div>}
                description={<Text type="secondary" style={{ fontSize: '12px' }}>{item.description}</Text>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  // ==================== RENDER ====================

// --- PREMIUM HOVER STYLES ---
const premiumStyles = `
  .workspace-card-premium {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    position: relative;
    overflow: hidden;
    z-index: 1;
  }

  /* DARK MODE HOVER */
  .dark .workspace-card-premium:hover {
    border-color: rgba(16, 185, 129, 0.6) !important;
    transform: translateY(-4px);
    box-shadow: 
      0 0 0 1px rgba(16, 185, 129, 0.1),
      0 12px 24px -10px rgba(16, 185, 129, 0.15),
      0 0 20px -5px rgba(16, 185, 129, 0.1);
  }

  /* LIGHT MODE HOVER */
  .light .workspace-card-premium:hover {
    border-color: #047857 !important;
    transform: translateY(-4px);
    box-shadow: 
      0 10px 25px -5px rgba(4, 120, 87, 0.15), 
      0 4px 6px -2px rgba(4, 120, 87, 0.05);
  }

  /* Optional: Subtle sheen effect */
  .workspace-card-premium::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .workspace-card-premium:hover::after {
    opacity: 1;
  }
`;

  // Event handlers
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreating(true);

    try {
      console.log('Creating workspace:', newWorkspaceName);

      const newWorkspace = await createWorkspace(
        newWorkspaceName.trim(),
        newWorkspaceDescription.trim() || undefined
      );

      console.log('Workspace created successfully:', newWorkspace);

      // Refresh workspaces list
      await refreshWorkspaces();

      // Close modal and clear form
      setShowCreateModal(false);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");

      // Navigate to new workspace
      console.log('Navigating to new workspace:', newWorkspace.slug);
      router.push(`/dashboard/${newWorkspace.slug}`);

    } catch (error: any) {
      console.error('Error creating workspace:', error);

      // Show error to user
      const errorMessage = error.message || 'Failed to create workspace';
      alert(`Error: ${errorMessage}`);

    } finally {
      setIsCreating(false);
    }
  };

  // Handle workspace click with loading animation (UPDATED FROM CODE 1)
  const handleWorkspaceClick = (workspace: any) => {
    setSelectedWorkspace(workspace.name);
    setNavigating(true);
    setNavigationProgress(0);
    
    const interval = setInterval(() => {
      setNavigationProgress(prev => {
        return Math.min(prev + (Math.random() * 5), 100);
      });
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
      setTimeout(() => { 
        clearInterval(interval); 
        setProgress(100); 
        setTimeout(() => setIsLoading(false), 500); 
      }, 2000);
    };
    
    if (!workspaceLoading && !userLoading) {
      runBootSequence();
    }
  }, [workspaceLoading, userLoading]);

  // Check Password Status (ADDED FROM CODE 1)
  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const response = await fetch('/api/auth/set-password');
        const data = await response.json();
        if (data.success) setHasPassword(data.hasPassword);
      } catch (error) { 
        console.error('Error checking password status:', error); 
      }
    };
    
    if (!userLoading && userProfile) {
      checkPasswordStatus();
    }
  }, [userLoading, userProfile]);

  // Handle password setup (ADDED FROM CODE 1)
  const handleSetPassword = async () => {
    setPasswordError('');
    if (password.length < 8) { 
      setPasswordError('Password must be at least 8 characters'); 
      return; 
    }
    if (password !== confirmPassword) { 
      setPasswordError('Passwords do not match'); 
      return; 
    }
    
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
        setTimeout(() => { 
          setShowPasswordModal(false); 
          setPassword(''); 
          setConfirmPassword(''); 
          setPasswordSetSuccess(false); 
        }, 2000);
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
    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout }
  ];

  // ==================== RENDER ====================

  // UPDATED Loading Screen from Code 1
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
              src={theme === 'dark' ? "/aoswhite.png" : "/aosblack.png"} 
              alt="ArbitrageOS" 
              style={{ 
                height: '160px', 
                objectFit: 'contain',
                opacity: 0.9 + (Math.sin(Date.now() / 200) * 0.1)
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
      token: {
        fontFamily: 'Manrope, sans-serif',
        colorPrimary: BRAND_GREEN,
      },
    }}
  >
    {/* INJECT THE STYLES HERE */}
    <style>{premiumStyles}</style>
    
    <div className="min-h-screen w-full" style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#f9fafb' ,
      fontFamily: 'Manrope, sans-serif'
    }}>
      {/* Navigation Loading Modal from Code 1 */}
      <Modal
        open={navigating}
        footer={null}
        closable={false}
        centered
        width={400}
        styles={{ body: { padding: 0, backgroundColor: theme === 'dark' ? '#000000' : '#ffffff', overflow: 'hidden', borderRadius: '16px', border: `1px solid ${theme === 'dark' ? BORDER_COLOR : '#e5e7eb'}` } }}
      >
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px', position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
             <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', border: `2px solid ${BRAND_GREEN}`, opacity: 0.2 }}></div>
             <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', border: `2px solid ${BRAND_GREEN}`, borderTopColor: 'transparent', borderLeftColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
             <FolderOutlined style={{ fontSize: '32px', color: BRAND_GREEN, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
          <Title level={4} style={{ color: theme === 'dark' ? '#fff' : '#000', marginBottom: '8px' }}>Opening Workspace</Title>
          <Text style={{ color: theme === 'dark' ? TEXT_SECONDARY : '#6b7280', fontSize: '13px', marginBottom: '24px', display: 'block' }}>Preparing your environment...</Text>
          <div style={{ height: '4px', backgroundColor: theme === 'dark' ? SURFACE_ELEVATED : '#e5e7eb', borderRadius: '2px', overflow: 'hidden', maxWidth: '200px', margin: '0 auto' }}>
             <div style={{ height: '100%', backgroundColor: BRAND_GREEN, width: `${navigationProgress}%`, transition: 'width 0.1s linear' }}></div>
          </div>
        </div>
      </Modal>

      {/* Password Modal from Code 1 */}
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
            <Title level={3} style={{ color: theme === 'dark' ? '#fff' : '#000', marginBottom: '12px' }}>All Set!</Title>
            <Text style={{ color: theme === 'dark' ? TEXT_SECONDARY : '#666' }}>Your password has been created successfully.</Text>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(92, 196, 157, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: `1px solid ${BRAND_GREEN}40` }}>
                <SafetyOutlined style={{ fontSize: '28px', color: BRAND_GREEN }} />
              </div>
              <Title level={3} style={{ color: theme === 'dark' ? '#fff' : '#000', marginBottom: '8px', margin: 0 }}>Set Password</Title>
              <Text style={{ color: theme === 'dark' ? TEXT_SECONDARY : '#666' }}>Secure your account with a strong password.</Text>
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

      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-black border-black' : 'bg-white border-black'} border-b px-6 py-2`}>
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={theme === 'dark' ? "/newlogo.png" : "/newlogo.png"}
              alt="ArbitrageOS Logo"
              style={{ 
                height: '40px',
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

        {/* Password Setup Card - ADDED HERE UNDER WELCOME SECTION */}
        {hasPassword === false && (
          <div className="mb-6">
            <Card 
              size="small"
              className="w-full"
              bodyStyle={{ padding: '16px' }}
              style={{
                border: `1px solid ${theme === 'dark' ? '#27272a' : '#e5e7eb'}`,
                backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme === 'dark' ? 'rgba(92, 196, 157, 0.1)' : 'rgba(92, 196, 157, 0.15)' }}>
                    <LockOutlined style={{ color: BRAND_GREEN, fontSize: '20px' }} />
                  </div>
                  <div>
                    <Title level={5} className="mb-0" style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
                      Secure Your Account
                    </Title>
                    <Text type="secondary" className="text-sm">
                      Set up a password for added security
                    </Text>
                  </div>
                </div>
                <Button 
                  type="primary"
                  icon={<SafetyOutlined />}
                  onClick={() => setShowPasswordModal(true)}
                  style={{ backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000', fontWeight: 600 }}
                >
                  Set Password
                </Button>
              </div>
            </Card>
          </div>
        )}

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
          borderColor: theme === 'dark' ? '#404040' : '#d1d5db',
           background: theme === 'dark' ? '#000000' : '#ffffff',
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
                <div className="w-10 h-10 bg-[#052c32] rounded-lg flex items-center justify-center mb-2">
                  <PlusOutlined className="text-white text-sm" />
                </div>
                <Text className="text-sm font-medium">New Workspace</Text>
              </div>
            </Card>
          </Col>

          {/* Existing Workspaces */}
        
{filteredWorkspaces.map((workspace) => (
  <Col xs={12} sm={12} md={8} lg={6} xl={6} key={workspace.id}>
    {/* Wrapper to pass the current theme context to CSS */}
    <div className={theme === 'dark' ? 'dark h-full' : 'light h-full'}>
      <Card
        hoverable
        size="small"
        // 1. ADD THE CLASS HERE
        className="cursor-pointer h-full workspace-card-premium" 
        style={{ 
          height: '140px',
          // 2. Ensure base border colors are set
          borderColor: theme === 'dark' ? '#27272a' : '#f0f0f0',
          background: theme === 'dark' ? '#000000' : '#ffffff' 
        }}
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
    </div>
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

      {/* Logout Dialog */}
      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={() => {
          logout();
          setShowLogoutDialog(false);
        }}
      />
    </div>
    </ConfigProvider>
  );
};

export default WorkspaceHomePage;