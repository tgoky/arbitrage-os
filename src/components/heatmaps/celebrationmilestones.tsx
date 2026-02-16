import React, { useMemo, useEffect } from 'react';
import { Card, Typography, Grid, Spin } from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  RocketOutlined, 
  CrownOutlined,
  CheckCircleFilled,
  LockOutlined
} from '@ant-design/icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkItems } from '../../app/hooks/useDashboardData';

const { Text } = Typography;

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

const CelebrationMilestonesPanel: React.FC<CelebrationMilestonesPanelProps> = ({
  currentWorkspace
}) => {
  const { theme } = useTheme();
  
  const {
    data: workItems = [],
    isLoading,
    isError
  } = useWorkItems(200);

  // --- 1. FORCE LOAD MANROPE FONT (Like in ColdEmailWriter) ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      // Optional: don't remove if other components need it, 
      // but for strict cleanup: document.head.removeChild(link);
    };
  }, []);

  // --- Styling Constants ---
  const isDark = theme === 'dark';
  // We apply this variable to the container to ensure inheritance
  const fontFamily = "'Manrope', sans-serif";
  const backgroundColor = isDark ? '#000000' : '#ffffff';
  const borderColor = isDark ? '#262626' : '#f0f0f0';
  
  // --- Logic ---
  const milestones = useMemo(() => {
    if (!Array.isArray(workItems)) return [];

    const now = new Date();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyItems = workItems.filter(item => {
      try { return new Date(item.createdAt) >= thisWeek; } catch { return false; }
    });

    const uniqueTools = new Set(workItems.map(item => item.type)).size;

    const milestoneList: Milestone[] = [
      {
        id: 'first_item',
        title: 'First Steps',
        description: 'Create your first AI item',
        achieved: workItems.length >= 1,
        progress: Math.min(100, (workItems.length / 1) * 100),
        icon: <RocketOutlined />,
        color: '#52c41a',
        badge: 'UNLOCKED'
      },
      {
        id: 'productive_week',
        title: 'Momentum',
        description: 'Generate 10 items in a week',
        achieved: weeklyItems.length >= 10,
        progress: Math.min(100, (weeklyItems.length / 10) * 100),
        icon: <FireOutlined />,
        color: '#fa8c16',
        badge: 'UNLOCKED'
      },
      {
        id: 'power_user',
        title: 'Arbitrage User',
        description: 'Create 50 total items',
        achieved: workItems.length >= 50,
        progress: Math.min(100, (workItems.length / 50) * 100),
        icon: <TrophyOutlined />,
        color: '#1890ff',
        badge: 'UNLOCKED'
      },
      {
        id: 'ai_expert',
        title: 'AI Expert',
        description: 'Use 5 different AI tools',
        achieved: uniqueTools >= 5,
        progress: Math.min(100, (uniqueTools / 5) * 100),
        icon: <CrownOutlined />,
        color: '#722ed1',
        badge: 'UNLOCKED'
      }
    ];

    return milestoneList;
  }, [workItems]);

  // --- Styles ---
  const getMainCardStyles = () => ({
    header: {
      backgroundColor: backgroundColor,
      borderBottom: `1px solid ${borderColor}`,
      padding: '16px 24px',
    },
    body: {
      backgroundColor: backgroundColor,
      padding: '24px',
    },
  });

  if (isLoading) return <Card loading styles={getMainCardStyles()} style={{ borderRadius: '16px' }} />;
  if (isError) return null;

  return (
    // Applied font family to the wrapper div to ensure it trickles down
    <div style={{ fontFamily }}>
      <Card 
         data-tour="milestones-view"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
               backgroundColor: isDark ? 'rgba(24, 144, 255, 0.2)' : '#e6f7ff',
               padding: '6px',
               borderRadius: '8px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
            }}>
              <TrophyOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
            </div>
            <Text strong style={{ 
              fontSize: '15px', 
              color: isDark ? '#f3f4f6' : '#111827', 
              fontFamily, // Explicitly set here
              fontWeight: 700,
              letterSpacing: '-0.01em' // Manrope looks better with slight negative tracking on headers
            }}>
              MILESTONES
            </Text>
          </div>
        }
        styles={getMainCardStyles()}
        style={{ 
          borderRadius: '16px', 
          border: `1px solid ${borderColor}`, 
          backgroundColor: backgroundColor,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.8)' : '0 4px 20px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {milestones.map((milestone) => (
            <div 
              key={milestone.id}
              style={{
                position: 'relative',
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: isDark 
                  ? (milestone.achieved ? 'rgba(20, 20, 20, 0.8)' : '#0A0A0A') 
                  : '#f9fafb',
                border: milestone.achieved 
                  ? `1px solid ${milestone.color}50` 
                  : `1px solid ${isDark ? '#262626' : '#e5e7eb'}`,
                boxShadow: milestone.achieved && isDark
                  ? `0 0 15px ${milestone.color}10`
                  : 'none',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              {milestone.achieved && (
                <div style={{
                  position: 'absolute',
                  top: 0, right: 0, bottom: 0, width: '30%',
                  background: `linear-gradient(90deg, transparent, ${milestone.color}08)`,
                  pointerEvents: 'none'
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                
                {/* Icon Box */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  backgroundColor: milestone.achieved ? milestone.color : (isDark ? '#1f1f1f' : '#f0f0f0'),
                  color: milestone.achieved ? '#fff' : (isDark ? '#4b5563' : '#9ca3af'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  boxShadow: milestone.achieved ? `0 4px 12px ${milestone.color}40` : 'none',
                  flexShrink: 0
                }}>
                   {milestone.achieved ? <CheckCircleFilled /> : <LockOutlined style={{ fontSize: 18 }} />}
                </div>

                {/* Text Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: 700, // Manrope bold is 700 or 800
                      color: isDark ? '#f9fafb' : '#111827',
                      fontFamily,
                      letterSpacing: '-0.01em',
                      opacity: milestone.achieved ? 1 : 0.8
                    }}>
                      {milestone.title}
                    </Text>
                    
                    {milestone.achieved && (
                       <span style={{
                         fontSize: '10px',
                         fontWeight: 800, // Extra bold for badges
                         color: milestone.color,
                         backgroundColor: isDark ? `${milestone.color}15` : `${milestone.color}10`,
                         padding: '2px 8px',
                         borderRadius: '6px',
                         letterSpacing: '0.05em', // Wide tracking for caps
                         fontFamily
                       }}>
                         {milestone.badge}
                       </span>
                    )}
                  </div>
                  
                  <Text style={{ 
                    fontSize: 12, 
                    color: isDark ? '#9ca3af' : '#666666', 
                    fontFamily,
                    fontWeight: 500, // Medium weight for descriptions
                    display: 'block',
                    marginBottom: 10
                  }}>
                    {milestone.description}
                  </Text>

                  {/* Custom Progress Bar */}
                  <div style={{ position: 'relative', height: '6px', backgroundColor: isDark ? '#262626' : '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                       position: 'absolute',
                       left: 0, top: 0, bottom: 0,
                       width: `${milestone.progress}%`,
                       backgroundColor: milestone.achieved ? milestone.color : (isDark ? '#4b5563' : '#9ca3af'),
                       borderRadius: '3px',
                       transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                       boxShadow: milestone.achieved ? `0 0 10px ${milestone.color}` : 'none'
                    }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CelebrationMilestonesPanel;