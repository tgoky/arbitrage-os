import React, { useMemo, useEffect } from 'react';
import { Card, Typography, Tooltip, Grid } from 'antd';
import { 
  CalendarOutlined, 
  FireOutlined, 
  CrownOutlined,
  StarOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkItems } from '../../app/hooks/useDashboardData';

const { Text } = Typography;
const { useBreakpoint } = Grid;

// --- Interfaces ---
interface ActivityHeatmapProps {
  currentWorkspace?: any;
}

interface DayActivity {
  date: string;
  count: number;
  items: any[];
}

interface ActivityStats {
  totalItems: number;
  activeDays: number;
  thisWeek: number;
  topClient: string;
  favTool: string;
  streak: number;
  bestDay: string;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  currentWorkspace
}) => {
  const { theme } = useTheme();
  const screens = useBreakpoint();
  
  const {
    data: workItems = [],
    isLoading,
    isError
  } = useWorkItems(365);

  // --- 1. FORCE LOAD MANROPE FONT ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      // Optional cleanup: document.head.removeChild(link);
    };
  }, []);

  // --- Theme Constants ---
  const isDark = theme === 'dark';
  const fontFamily = "'Manrope', sans-serif";
  const backgroundColor = isDark ? '#000000' : '#ffffff';
  const borderColor = isDark ? '#262626' : '#f0f0f0';
  const subCardBg = isDark ? '#0A0A0A' : '#f9fafb';
  
  // Heatmap Colors
  const intensityColorsDark = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
  const intensityColorsLight = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

  // --- Helpers ---
  const getTypeDisplayName = (type: string) => {
    const names: Record<string, string> = {
      'sales-call': 'Sales Call', 'growth-plan': 'Growth Plan', 'pricing-calc': 'Pricing',
      'niche-research': 'Research', 'cold-email': 'Cold Email', 'offer-creator': 'Offer',
      'ad-writer': 'Ad Copy', 'n8n-workflow': 'Workflow'
    };
    return names[type] || type;
  };

  // --- Logic ---
  const { heatmapData, stats } = useMemo(() => {
    // Default "Zero" State to satisfy TypeScript
    const defaultStats: ActivityStats = {
      totalItems: 0,
      activeDays: 0,
      thisWeek: 0,
      topClient: '--',
      favTool: '--',
      streak: 0,
      bestDay: '--'
    };

    if (!Array.isArray(workItems) || workItems.length === 0) {
      return { heatmapData: [], stats: defaultStats };
    }

    // 1. Heatmap Data Generation
    const days: DayActivity[] = [];
    const today = new Date();
    const daysToShow = 19 * 7; // Approx 4.5 months
    const startDate = new Date(today.getTime() - (daysToShow - 1) * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      
      const dayItems = workItems.filter(item => {
        try {
          if (!item.createdAt) return false;
          const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
          return itemDate === dateString;
        } catch { return false; }
      });
      
      days.push({ date: dateString, count: dayItems.length, items: dayItems });
    }

    // 2. Statistical Calculations
    const totalItems = workItems.length;
    const activeDaysCount = days.filter(d => d.count > 0).length;
    
    // Weekly Stats
    const thisWeekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyItems = workItems.filter(item => new Date(item.createdAt) >= thisWeekStart);

    // Top Client Logic
    const clientCounts = workItems.reduce((acc, item) => {
      try {
        const client = item.subtitle?.split('•')[0]?.trim() || 'Unknown';
        if (client !== 'Unknown' && client !== 'Generated content') {
          acc[client] = (acc[client] || 0) + 1;
        }
      } catch {}
      return acc;
    }, {} as Record<string, number>);
    
    const topClient = Object.entries(clientCounts).reduce((max, [client, count]) => 
      count > max.count ? { client, count } : max, { client: '--', count: 0 }
    );

    // Fav Tool Logic
    const typeCounts = workItems.reduce((acc, item) => {
      if (item.type) acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topTool = Object.entries(typeCounts).reduce((max, [type, count]) => 
      count > max.count ? { type, count } : max, { type: '--', count: 0 }
    );

    // Streak Logic
    const activityDays = [...new Set(workItems.map(item => new Date(item.createdAt).toDateString()))].sort();
    let currentStreak = 0;
    const todayStr = new Date().toDateString();
    const yesterdayStr = new Date(today.getTime() - 86400000).toDateString();
    
    if (activityDays.includes(todayStr) || activityDays.includes(yesterdayStr)) {
      for (let i = activityDays.length - 1; i >= 0; i--) {
        const d1 = new Date(todayStr).getTime();
        const d2 = new Date(activityDays[i]).getTime();
        const daysDiff = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === currentStreak || (daysDiff === currentStreak + 1 && currentStreak === 0)) {
            currentStreak++;
        } else {
            break;
        }
      }
    }

    // Best Day Logic
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayCounts = days.reduce((acc, day) => {
        const d = new Date(day.date).getDay();
        acc[d] = (acc[d] || 0) + day.count;
        return acc;
    }, {} as Record<number, number>);
    
    let bestDayIndex = 0;
    let maxDayCount = -1;
    Object.entries(weekdayCounts).forEach(([idx, count]) => {
        if(count > maxDayCount) {
            maxDayCount = count;
            bestDayIndex = Number(idx);
        }
    });

    const calculatedStats: ActivityStats = {
        totalItems,
        activeDays: activeDaysCount,
        thisWeek: weeklyItems.length,
        topClient: topClient.client,
        favTool: topTool.count > 0 ? getTypeDisplayName(topTool.type) : '--',
        streak: currentStreak,
        bestDay: maxDayCount > 0 ? weekdays[bestDayIndex] : '--'
    };

    return { heatmapData: days, stats: calculatedStats };
  }, [workItems]);


  // Group heatmap into columns (weeks)
  const weeks = useMemo(() => {
    const weeksArray = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      weeksArray.push(heatmapData.slice(i, i + 7));
    }
    return weeksArray;
  }, [heatmapData]);

  const getIntensityLevel = (count: number) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  // --- Styles ---
  const getMainCardStyles = () => ({
    header: {
      backgroundColor: backgroundColor,
      borderBottom: `1px solid ${borderColor}`,
      padding: '20px 24px',
    },
    body: {
      backgroundColor: backgroundColor,
      padding: '24px',
      height: '100%',
      fontFamily // Ensure body inherits font
    },
  });

  const getStatItemStyle = (color: string) => ({
    backgroundColor: subCardBg,
    borderRadius: '12px',
    padding: '16px',
    border: `1px solid ${borderColor}`,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    transition: 'all 0.2s ease',
  });

  if (isLoading) return <Card loading styles={getMainCardStyles()} style={{ borderRadius: '16px' }} />;
  if (isError) return null;

  return (
    // Wrap in div to enforce font family on all children
    <div style={{ fontFamily }}>
        <Card 
           data-tour="heatmaps-view"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                 backgroundColor: isDark ? 'rgba(82, 196, 26, 0.2)' : '#f6ffed',
                 padding: '8px',
                 borderRadius: '10px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center'
              }}>
                <CalendarOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
              </div>
              <Text strong style={{ 
                  fontSize: '15px', 
                  color: isDark ? '#f3f4f6' : '#111827', 
                  fontFamily,
                  letterSpacing: '-0.01em' 
              }}>
                ACTIVITY & INSIGHTS
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* --- 1. STATISTICS GRID --- */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: screens.lg ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', 
              gap: '12px',
            }}>
                {/* Total Items */}
                <div style={getStatItemStyle('#1890ff')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1890ff' }}>
                        <CheckCircleOutlined />
                        <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isDark ? '#6b7280' : '#8c8c8c', fontFamily }}>Total Items</Text>
                    </div>
                    <Text style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#fff' : '#000', fontFamily }}>
                        {stats.totalItems}
                    </Text>
                </div>

                {/* Current Streak */}
                <div style={getStatItemStyle('#faad14')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#faad14' }}>
                        <FireOutlined />
                        <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isDark ? '#6b7280' : '#8c8c8c', fontFamily }}>Current Streak</Text>
                    </div>
                    <Text style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#fff' : '#000', fontFamily }}>
                       {stats.streak} Days
                    </Text>
                </div>

                 {/* This Week */}
                 <div style={getStatItemStyle('#52c41a')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#52c41a' }}>
                        <RiseOutlined />
                        <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isDark ? '#6b7280' : '#8c8c8c', fontFamily }}>This Week</Text>
                    </div>
                    <Text style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#fff' : '#000', fontFamily }}>
                        {stats.thisWeek}
                    </Text>
                </div>

                {/* Best Day */}
                <div style={getStatItemStyle('#722ed1')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#722ed1' }}>
                        <ThunderboltOutlined />
                        <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isDark ? '#6b7280' : '#8c8c8c', fontFamily }}>Premier Day</Text>
                    </div>
                    <Text style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#fff' : '#000', fontFamily }}>
                        {stats.bestDay}
                    </Text>
                </div>

                {/* Top Client */}
                <div style={{ 
                    ...getStatItemStyle('#eb2f96'),
                    gridColumn: screens.lg ? 'span 2' : 'span 1'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#eb2f96' }}>
                        <CrownOutlined />
                        <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isDark ? '#6b7280' : '#8c8c8c', fontFamily }}>Top Client</Text>
                    </div>
                    <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 700, 
                        color: isDark ? '#fff' : '#000',
                        whiteSpace: 'normal', 
                        lineHeight: 1.3,
                        fontFamily
                    }}>
                        {stats.topClient}
                    </Text>
                </div>

                {/* Top Tool */}
                <div style={{ 
                    ...getStatItemStyle('#13c2c2'),
                    gridColumn: screens.lg ? 'span 2' : 'span 1'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#13c2c2' }}>
                        <StarOutlined />
                        <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isDark ? '#6b7280' : '#8c8c8c', fontFamily }}>Favorite Tool</Text>
                    </div>
                    <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 700, 
                        color: isDark ? '#fff' : '#000',
                        whiteSpace: 'normal',
                        lineHeight: 1.3,
                        fontFamily
                    }}>
                        {stats.favTool}
                    </Text>
                </div>
            </div>

            {/* --- 2. HEATMAP VISUALIZATION --- */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              width: '100%',
              overflowX: 'auto',
              paddingBottom: 10
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                
                {/* Weekday Labels */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  paddingTop: 16,
                  height: 7 * 15,
                  marginRight: 8
                }}>
                   {['Mon', 'Wed', 'Fri'].map((day) => (
                     <Text key={day} style={{ fontSize: 10, color: isDark ? '#6b7280' : '#9ca3af', fontFamily, fontWeight: 600 }}>
                       {day}
                     </Text>
                   ))}
                </div>

                {/* The Grid */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {week.map((day) => {
                        const intensity = getIntensityLevel(day.count);
                        return (
                          <Tooltip
                            key={day.date}
                            color={isDark ? '#1f1f1f' : '#fff'}
                            overlayInnerStyle={{ color: isDark ? '#fff' : '#000', padding: '8px 12px', fontFamily }}
                            title={`${day.count} items on ${new Date(day.date).toLocaleDateString()}`}
                          >
                            <div
                              style={{
                                width: 11,
                                height: 11,
                                backgroundColor: isDark ? intensityColorsDark[intensity] : intensityColorsLight[intensity],
                                borderRadius: 2,
                                border: day.count === 0 && isDark ? '1px solid #262626' : 'none',
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, alignSelf: 'flex-end' }}>
                 <Text style={{ fontSize: 10, color: isDark ? '#6b7280' : '#9ca3af', fontFamily }}>Less</Text>
                 {[0, 1, 2, 3, 4].map(level => (
                   <div key={level} style={{ 
                     width: 10, 
                     height: 10, 
                     borderRadius: 2, 
                     backgroundColor: isDark ? intensityColorsDark[level] : intensityColorsLight[level],
                     border: level === 0 && isDark ? '1px solid #262626' : 'none'
                   }} />
                 ))}
                 <Text style={{ fontSize: 10, color: isDark ? '#6b7280' : '#9ca3af', fontFamily }}>More</Text>
              </div>
            </div>

          </div>
        </Card>
    </div>
  );
};

export default ActivityHeatmap;