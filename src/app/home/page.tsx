"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkspace } from '../hooks/useWorkspace';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWorkItems } from '../hooks/useDashboardData';
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
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  FolderOutlined, 
  ArrowRightOutlined, 
  UserOutlined, 
  BellOutlined, 
  DownOutlined, 
  HistoryOutlined,
  RiseOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

// Add interface for user profile
interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

const WorkspaceHomePage = () => {
  const router = useRouter();
  const { theme } = useTheme();
  
  const { 
    workspaces, 
    isLoading: workspaceLoading, 
    createWorkspace 
  } = useWorkspace();

  // Get user profile for email display
  const { data: userProfile, isLoading: userLoading } = useUserProfile() as {
    data: UserProfile | undefined;
    isLoading: boolean;
  };

  // Get work items for metrics calculation
  const { data: workItems = [] } = useWorkItems(1000); // Get lots of items for metrics
  
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
  const metrics = React.useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filter items for this month and last month
    const thisMonthItems = workItems.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return itemDate >= startOfMonth && itemDate <= now;
    });

    const lastMonthItems = workItems.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return itemDate >= startOfLastMonth && itemDate <= endOfLastMonth;
    });

    // Calculate productivity score based on different item types with weights
    const getItemScore = (item: any) => {
      const weights: Record<string, number> = {
        'sales-call': 5,      // High value
        'growth-plan': 8,     // Very high value
        'pricing-calc': 4,    // Medium-high value
        'niche-research': 6,  // High value
        'cold-email': 3,      // Medium value
        'offer-creator': 7,   // High value
        'ad-writer': 4,       // Medium-high value
        'n8n-workflow': 9     // Very high value (automation)
      };
      return weights[item.type] || 3;
    };

    const thisMonthScore = thisMonthItems.reduce((sum, item) => sum + getItemScore(item), 0);
    const lastMonthScore = lastMonthItems.reduce((sum, item) => sum + getItemScore(item), 0);

    // Calculate percentage change
    let changePercent = 0;
    if (lastMonthScore > 0) {
      changePercent = ((thisMonthScore - lastMonthScore) / lastMonthScore) * 100;
    } else if (thisMonthScore > 0) {
      changePercent = 100; // First month with activity
    }

    return {
      thisMonthItems: thisMonthItems.length,
      thisMonthScore,
      changePercent: Math.round(changePercent * 10) / 10,
      isPositive: changePercent >= 0
    };
  }, [workItems]);

  // Get most recent workspace from workspaces array
  const mostRecentWorkspace = React.useMemo(() => {
    if (!workspaces || workspaces.length === 0) return null;
    
    // Sort by updated_at or created_at to find most recent
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

  // Boot sequence effect
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

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      return;
    }

    setIsCreating(true);
    
    try {
      const newWorkspace = await createWorkspace(
        newWorkspaceName.trim(),
        newWorkspaceDescription.trim() || undefined
      );

      setShowCreateModal(false);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
      
      router.push(`/dashboard/${newWorkspace.slug}`);
    } catch (error) {
      console.error('Error creating workspace:', error);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    // Add custom styles for glow effects
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

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userMenuItems = [
    { key: 'profile', label: 'Profile' },
    { key: 'settings', label: 'Settings' },
    { key: 'logout', label: 'Logout' }
  ];

  if (isLoading || workspaceLoading || userLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ 
        backgroundColor: theme === 'dark' ? '#000000' : '#f9fafb' 
      }}>
        <Card 
          className="w-80 text-center shadow-lg"
          bodyStyle={{ padding: '32px' }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Title level={4} className="mb-0" style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
              <span className="animate-glow-pulse" style={{ color: '#5CC49D' }}>arbitrage</span>
              <span>OS</span>
              <span className="text-sm font-normal ml-2" style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                by
              </span>
              <span className="text-sm font-bold ml-1 " style={{ color: '#5CC49D' }}>
                GrowAI
              </span>
            </Title>
          </div>
          
          <div className="space-y-4">
            <div>
              <Text className="text-sm">Initializing System</Text>
              <div className="flex justify-between items-center mt-1">
                <Progress 
                  percent={progress} 
                  strokeColor="#16a34a"
                  size="small"
                  showInfo={false}
                  className="flex-1 mr-3"
                />
                <Text className="text-xs font-mono" style={{ color: '#16a34a' }}>
                  {progress}%
                </Text>
              </div>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <Text type="secondary">Loading workspaces</Text>
                <Text>{progress >= 30 ? '✓' : '⏳'}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Loading user profile</Text>
                <Text>{progress >= 50 ? '✓' : '⏳'}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Preparing dashboard</Text>
                <Text>{progress >= 70 ? '✓' : '⏳'}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Ready</Text>
                <Text>{progress >= 100 ? '✓' : '⏳'}</Text>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#f9fafb' 
    }}>
      {/* Navigation Loading Modal */}
      <Modal
        open={navigating}
        footer={null}
        closable={false}
        centered
        width={400}
      >
        <div className="text-center py-4">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <FolderOutlined className="text-white" />
            </div>
            <div>
              <Title level={4} className="mb-0">Opening {selectedWorkspace}</Title>
              <Text type="secondary">Loading workspace contents...</Text>
            </div>
          </div>
          
          <Progress 
            percent={navigationProgress} 
            strokeColor="#16a34a"
            size="small"
          />
          
          <Text type="secondary" className="mt-2 block">
            {navigationProgress}% complete
          </Text>
        </div>
      </Modal>

      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-3`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Title level={4} className="mb-0" style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
              <span className="animate-glow-pulse" style={{ color: '#5CC49D' }}>arbitrage</span>
              <span>OS</span>
              <span className="text-sm font-normal ml-2" style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                by
              </span>
              <span className="text-sm font-bold ml-1 " style={{ color: '#5CC49D' }}>
                GrowAI
              </span>
            </Title>
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
            <Badge count={3} size="small">
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            
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
                  <Text type="secondary" className="text-xs block mb-1">This Month</Text>
                  <Title 
                    level={3} 
                    className="mb-0" 
                    style={{ 
                      marginBottom: 0, 
                      color: metrics.isPositive ? '#16a34a' : '#ef4444'
                    }}
                  >
                    {metrics.isPositive ? '+' : ''}{metrics.changePercent}%
                  </Title>
                  <Text 
                    type="secondary" 
                    className="text-xs"
                    title={`${metrics.thisMonthItems} items created this month (score: ${metrics.thisMonthScore})`}
                  >
                    {metrics.thisMonthItems} items created
                  </Text>
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
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
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
                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center flex-shrink-0">
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
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a'  }}
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

      {/* Simplified Footer */}
      <footer className={`${theme === 'dark' ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} border-t mt-auto px-6 py-2`}>
        <div className="flex items-center justify-center">
          <Text type="secondary" className="text-xs">
            <span className="animate-glow-pulse" style={{ color: '#5CC49D' }}>arbitrage</span>OS by{' '}
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