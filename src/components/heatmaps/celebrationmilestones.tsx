import React, { useMemo } from 'react';
import { Card, Badge, Typography, Row, Col, Progress, Avatar } from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  RocketOutlined, 
  CrownOutlined,
  StarOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkItems } from '../../app/hooks/useDashboardData';

const { Text, Title } = Typography;

interface CelebrationMilestonesPanelProps {
  currentWorkspace?: any;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  progress: number;
  icon: React.ReactElement;
  color: string;
  badge?: string;
}

interface Achievement {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  type: 'milestone' | 'streak' | 'top';
}

const CelebrationMilestonesPanel: React.FC<CelebrationMilestonesPanelProps> = ({
  currentWorkspace
}) => {
  const { theme } = useTheme();
  
  // Use TanStack Query to get real-time work items data
  const {
    data: workItems = [],
    isLoading,
    isError
  } = useWorkItems(200); // Get more items for better analytics

  // Calculate real achievements and milestones from live data
  const { achievements, milestones } = useMemo(() => {
    if (!Array.isArray(workItems) || workItems.length === 0) {
      // Return empty state data when no work items exist
      const emptyAchievements: Achievement[] = [
        {
          title: 'This Week',
          value: '0 items',
          icon: <FireOutlined />,
          color: '#f5222d',
          type: 'streak'
        },
        {
          title: 'Top Client',
          value: 'No clients yet',
          icon: <CrownOutlined />,
          color: '#faad14',
          type: 'top'
        },
        {
          title: 'Favorite Tool',
          value: 'None yet',
          icon: <StarOutlined />,
          color: '#1890ff',
          type: 'top'
        },
        {
          title: 'Activity Streak',
          value: 'Start today!',
          icon: <ThunderboltOutlined />,
          color: '#52c41a',
          type: 'streak'
        }
      ];

      const emptyMilestones: Milestone[] = [
        {
          id: 'first_item',
          title: 'Getting Started',
          description: 'Create your first AI item',
          achieved: false,
          progress: 0,
          icon: <RocketOutlined />,
          color: '#52c41a'
        },
        {
          id: 'productive_week',
          title: 'Productive Week',
          description: 'Generate 10 items in one week',
          achieved: false,
          progress: 0,
          icon: <FireOutlined />,
          color: '#fa8c16'
        },
        {
          id: 'power_user',
          title: 'Power User',
          description: 'Create 50 total items',
          achieved: false,
          progress: 0,
          icon: <TrophyOutlined />,
          color: '#1890ff'
        },
        {
          id: 'ai_expert',
          title: 'AI Expert',
          description: 'Use 5 different AI tools',
          achieved: false,
          progress: 0,
          icon: <CrownOutlined />,
          color: '#722ed1'
        }
      ];

      return { achievements: emptyAchievements, milestones: emptyMilestones };
    }

    const now = new Date();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate real weekly and monthly stats
    const weeklyItems = workItems.filter(item => {
      try {
        return new Date(item.createdAt) >= thisWeek;
      } catch {
        return false;
      }
    });
    
    const monthlyItems = workItems.filter(item => {
      try {
        return new Date(item.createdAt) >= thisMonth;
      } catch {
        return false;
      }
    });
    
    // Real client analysis from subtitle data
    const clientCounts = workItems.reduce((acc, item) => {
      try {
        const client = item.subtitle?.split('•')[0]?.trim() || 'Unknown Client';
        if (client !== 'Unknown Client' && client !== 'Generated content') {
          acc[client] = (acc[client] || 0) + 1;
        }
      } catch {
        // Skip invalid items
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topClient = Object.entries(clientCounts).reduce((max, [client, count]) => 
      count > max.count ? { client, count } : max, { client: 'No clients yet', count: 0 }
    );

    // Real tool type analysis
    const typeCounts = workItems.reduce((acc, item) => {
      if (item.type) {
        acc[item.type] = (acc[item.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topType = Object.entries(typeCounts).reduce((max, [type, count]) => 
      count > max.count ? { type, count } : max, { type: 'none', count: 0 }
    );

    // Real activity streak calculation
    const activityDays = [...new Set(workItems
      .map(item => {
        try {
          return new Date(item.createdAt).toDateString();
        } catch {
          return null;
        }
      })
      .filter((date): date is string => date !== null)
    )].sort();
    
    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    // Check if user was active today or yesterday to start streak
    const hasRecentActivity = activityDays.includes(today) || activityDays.includes(yesterday);
    
    if (hasRecentActivity) {
      // Calculate consecutive days from most recent activity
      for (let i = activityDays.length - 1; i >= 0; i--) {
        const daysDiff = Math.floor((new Date(today).getTime() - new Date(activityDays[i]).getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === currentStreak || (daysDiff === currentStreak + 1 && currentStreak === 0)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const achievements: Achievement[] = [
      {
        title: 'This Week',
        value: `${weeklyItems.length} item${weeklyItems.length === 1 ? '' : 's'}`,
        icon: <FireOutlined />,
        color: weeklyItems.length >= 5 ? '#52c41a' : weeklyItems.length >= 2 ? '#faad14' : '#f5222d',
        type: 'streak'
      },
      {
        title: 'Top Client',
        value: topClient.count > 0 ? `${topClient.client} (${topClient.count})` : 'No clients yet',
        icon: <CrownOutlined />,
        color: '#faad14',
        type: 'top'
      },
      {
        title: 'Favorite Tool',
        value: topType.count > 0 ? getTypeDisplayName(topType.type) : 'None yet',
        icon: <StarOutlined />,
        color: '#1890ff',
        type: 'top'
      },
      {
        title: 'Activity Streak',
        value: currentStreak > 0 ? `${currentStreak} day${currentStreak === 1 ? '' : 's'}` : 'Start today!',
        icon: <ThunderboltOutlined />,
        color: currentStreak >= 7 ? '#52c41a' : currentStreak >= 3 ? '#1890ff' : '#52c41a',
        type: 'streak'
      }
    ];

    const milestones: Milestone[] = [
      {
        id: 'first_item',
        title: 'Getting Started',
        description: 'Create your first AI item',
        achieved: workItems.length >= 1,
        progress: Math.min(100, (workItems.length / 1) * 100),
        icon: <RocketOutlined />,
        color: '#52c41a',
        badge: workItems.length >= 1 ? 'Completed!' : undefined
      },
      {
        id: 'productive_week',
        title: 'Productive Week',
        description: 'Generate 10 items in one week',
        achieved: weeklyItems.length >= 10,
        progress: Math.min(100, (weeklyItems.length / 10) * 100),
        icon: <FireOutlined />,
        color: '#fa8c16',
        badge: weeklyItems.length >= 10 ? 'This Week!' : undefined
      },
      {
        id: 'power_user',
        title: 'Power User',
        description: 'Create 50 total items',
        achieved: workItems.length >= 50,
        progress: Math.min(100, (workItems.length / 50) * 100),
        icon: <TrophyOutlined />,
        color: '#1890ff',
        badge: workItems.length >= 50 ? 'Achieved!' : undefined
      },
      {
        id: 'ai_expert',
        title: 'AI Expert',
        description: 'Use 5 different AI tools',
        achieved: Object.keys(typeCounts).length >= 5,
        progress: Math.min(100, (Object.keys(typeCounts).length / 5) * 100),
        icon: <CrownOutlined />,
        color: '#722ed1',
        badge: Object.keys(typeCounts).length >= 5 ? 'Expert!' : undefined
      }
    ];

    return { achievements, milestones };
  }, [workItems]);

  function getTypeDisplayName(type: string) {
    const names: Record<string, string> = {
      'sales-call': 'Sales Calls',
      'growth-plan': 'Growth Plans',
      'pricing-calc': 'Pricing',
      'niche-research': 'Research',
      'cold-email': 'Cold Emails',
      'offer-creator': 'Offers',
      'ad-writer': 'Ad Copy',
      'n8n-workflow': 'Workflows'
    };
    return names[type] || type;
  }

  const getCardStyle = () => ({
    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
    borderRadius: '12px',
  });

  // Handle loading state
  if (isLoading) {
    return (
      <Card 
        style={getCardStyle()}
        bodyStyle={{ padding: '20px' }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Title level={4} style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
            Loading Your Achievements...
          </Title>
        </div>
      </Card>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <Card 
        style={getCardStyle()}
        bodyStyle={{ padding: '20px' }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {/* <RocketOutlined 
            style={{ 
              fontSize: 48, 
              color: theme === 'dark' ? '#ef4444' : '#dc2626',
              marginBottom: 16 
            }} 
          /> */}
          <Title level={4} style={{ color: theme === 'dark' ? '#ef4444' : '#dc2626' }}>
            Failed to Load Achievements
          </Title>
        </div>
      </Card>
    );
  }

  // Empty state for new users
  if (workItems.length === 0) {
    return (
      <Card 
        style={getCardStyle()}
        bodyStyle={{ padding: '20px' }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {/* <RocketOutlined 
            style={{ 
              fontSize: 48, 
              color: theme === 'dark' ? '#4b5563' : '#d1d5db',
              marginBottom: 16 
            }} 
          /> */}
          <Title level={4} style={{ color: theme === 'dark' ? '#9ca3af' : '#666666' }}>
            Start Your  Journey
          </Title>
          <Text style={{ color: theme === 'dark' ? '#6b7280' : '#999999' }}>
            Use any AI tool to unlock achievements and milestones
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Achievements Row - Made wider for 2-column dashboard layout */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrophyOutlined style={{ color: '#faad14' }} />
            <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
              Recent Achievements
            </span>
          </div>
        }
        style={getCardStyle()}
        bodyStyle={{ padding: '16px' }}
      >
        <Row gutter={[12, 12]}>
          {achievements.map((achievement, index) => (
            <Col xs={24} sm={12} key={index}>
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: '64px'
              }}>
                <Avatar
                  icon={achievement.icon}
                  style={{
                    backgroundColor: achievement.color + '15',
                    color: achievement.color,
                    border: `2px solid ${achievement.color}20`,
                    flexShrink: 0
                  }}
                  size={36}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text 
                    style={{ 
                      fontSize: 12, 
                      color: theme === 'dark' ? '#9ca3af' : '#666666',
                      display: 'block',
                      marginBottom: 2
                    }}
                  >
                    {achievement.title}
                  </Text>
                  <Text 
                    style={{ 
                      fontSize: 14, 
                      fontWeight: 600,
                      color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                      wordBreak: 'break-word'
                    }}
                  >
                    {achievement.value}
                  </Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Milestones Progress - Compact for 2-column layout */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarOutlined style={{ color: '#1890ff' }} />
            <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
              Milestone Progress
            </span>
          </div>
        }
        style={getCardStyle()}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {milestones.map((milestone) => (
            <div 
              key={milestone.id}
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                border: `1px solid ${milestone.achieved ? milestone.color + '40' : (theme === 'dark' ? '#374151' : '#e5e7eb')}`,
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <Avatar
                    icon={milestone.icon}
                    style={{
                      backgroundColor: milestone.achieved ? milestone.color : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                      color: milestone.achieved ? '#ffffff' : (theme === 'dark' ? '#9ca3af' : '#666666'),
                      flexShrink: 0
                    }}
                    size={24}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text 
                      style={{ 
                        fontSize: 13, 
                        fontWeight: 600,
                        color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                        display: 'block'
                      }}
                    >
                      {milestone.title}
                    </Text>
                    <Text 
                      style={{ 
                        fontSize: 11, 
                        color: theme === 'dark' ? '#9ca3af' : '#666666',
                        display: 'block'
                      }}
                    >
                      {milestone.description}
                    </Text>
                  </div>
                </div>
                {milestone.badge && (
                  <Badge 
                    count={milestone.badge} 
                    style={{ 
                      backgroundColor: milestone.color,
                      fontSize: 9,
                      flexShrink: 0
                    }} 
                  />
                )}
              </div>
              <Progress 
                percent={milestone.progress} 
                strokeColor={milestone.color}
                trailColor={theme === 'dark' ? '#374151' : '#e5e7eb'}
                size="small"
                showInfo={false}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CelebrationMilestonesPanel;