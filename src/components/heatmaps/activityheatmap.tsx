import React, { useMemo } from 'react';
import { Card, Typography, Tooltip, Spin } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkItems } from '../../app/hooks/useDashboardData';

const { Text, Title } = Typography;

interface ActivityHeatmapProps {
  currentWorkspace?: any;
}

interface DayActivity {
  date: string;
  count: number;
  items: any[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  currentWorkspace
}) => {
  const { theme } = useTheme();
  
  // Use TanStack Query to get real-time work items data
  const {
    data: workItems = [],
    isLoading,
    isError
  } = useWorkItems(365); // Get up to 1 year of data for comprehensive heatmap

  // Generate heatmap data for the last 12 weeks (84 days) using real data
  const heatmapData = useMemo(() => {
    const days: DayActivity[] = [];
    const today = new Date();
    const startDate = new Date(today.getTime() - 83 * 24 * 60 * 60 * 1000); // 84 days ago
    
    // Create array of all days for the last 12 weeks
    for (let i = 0; i < 84; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      
      // Find work items for this date from real data
      const dayItems = workItems.filter(item => {
        try {
          if (!item.createdAt) return false;
          const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
          return itemDate === dateString;
        } catch {
          return false;
        }
      });
      
      days.push({
        date: dateString,
        count: dayItems.length,
        items: dayItems
      });
    }
    
    return days;
  }, [workItems]);

  // Calculate real activity levels and stats
  const { maxCount, totalActiveDays, totalItems, weekdays, averageDaily } = useMemo(() => {
    const maxCount = Math.max(...heatmapData.map(day => day.count), 1);
    const totalActiveDays = heatmapData.filter(day => day.count > 0).length;
    const totalItems = heatmapData.reduce((sum, day) => sum + day.count, 0);
    const averageDaily = totalActiveDays > 0 ? Math.round((totalItems / totalActiveDays) * 10) / 10 : 0;
    
    // Group by weekday for patterns
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return { maxCount, totalActiveDays, totalItems, weekdays, averageDaily };
  }, [heatmapData]);

  // Get intensity level for a day (0-4) based on real data distribution
  const getIntensityLevel = (count: number) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= Math.max(2, maxCount * 0.3)) return 2;
    if (count <= Math.max(3, maxCount * 0.6)) return 3;
    return 4;
  };

  // Get color for intensity level
  const getIntensityColor = (level: number) => {
    if (theme === 'dark') {
      const colors = ['#1f2937', '#065f46', '#047857', '#059669', '#10b981'];
      return colors[level];
    } else {
      const colors = ['#f3f4f6', '#dcfce7', '#bbf7d0', '#86efac', '#22c55e'];
      return colors[level];
    }
  };

  // Format date for tooltip
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Group days into weeks for display
  const weeks = useMemo(() => {
    const weeksArray = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      weeksArray.push(heatmapData.slice(i, i + 7));
    }
    return weeksArray;
  }, [heatmapData]);

  // Get type display name for items
  const getTypeDisplayName = (type: string) => {
    const names: Record<string, string> = {
      'sales-call': 'Call Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing',
      'niche-research': 'Research',
      'cold-email': 'Email',
      'offer-creator': 'Offer',
      'ad-writer': 'Ad Copy',
      'n8n-workflow': 'Workflow'
    };
    return names[type] || type;
  };

  const getCardStyle = () => ({
    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
    borderRadius: '12px',
  });

  // Handle loading state
  if (isLoading) {
    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: '#52c41a' }} />
            <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
              Activity Heatmap
            </span>
          </div>
        }
        style={getCardStyle()}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <Text style={{ 
            color: theme === 'dark' ? '#9ca3af' : '#666666',
            display: 'block',
            marginTop: 16
          }}>
            Loading activity data...
          </Text>
        </div>
      </Card>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: '#ef4444' }} />
            <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
              Activity Heatmap
            </span>
          </div>
        }
        style={getCardStyle()}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text style={{ 
            color: theme === 'dark' ? '#ef4444' : '#dc2626',
            display: 'block'
          }}>
            Failed to load activity data
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarOutlined style={{ color: '#52c41a' }} />
          <span style={{ color: theme === 'dark' ? '#f9fafb' : '#1a1a1a' }}>
            Activity Heatmap
          </span>
        </div>
      }
      style={getCardStyle()}
      bodyStyle={{ padding: '16px' }}
    >
      {/* Real Stats Summary */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ textAlign: 'center' }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 600,
            color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
            display: 'block'
          }}>
            {totalItems}
          </Text>
          <Text style={{ 
            fontSize: 11, 
            color: theme === 'dark' ? '#9ca3af' : '#666666'
          }}>
            Items created
          </Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 600,
            color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
            display: 'block'
          }}>
            {totalActiveDays}
          </Text>
          <Text style={{ 
            fontSize: 11, 
            color: theme === 'dark' ? '#9ca3af' : '#666666'
          }}>
            Active days
          </Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 600,
            color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
            display: 'block'
          }}>
            {Math.round((totalActiveDays / 84) * 100)}%
          </Text>
          <Text style={{ 
            fontSize: 11, 
            color: theme === 'dark' ? '#9ca3af' : '#666666'
          }}>
            Consistency
          </Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 600,
            color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
            display: 'block'
          }}>
            {averageDaily}
          </Text>
          <Text style={{ 
            fontSize: 11, 
            color: theme === 'dark' ? '#9ca3af' : '#666666'
          }}>
            Avg per day
          </Text>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          minWidth: '600px',
          gap: 2
        }}>
          {/* Weekday Labels */}
          <div style={{ display: 'flex', gap: 2, marginLeft: 24 }}>
            {weeks[0]?.map((_, dayIndex) => (
              <div 
                key={dayIndex}
                style={{ 
                  width: 12, 
                  height: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  color: theme === 'dark' ? '#9ca3af' : '#666666'
                }}
              >
                {dayIndex % 2 === 1 ? weekdays[dayIndex][0] : ''}
              </div>
            ))}
          </div>

          {/* Month Labels and Grid */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            {/* Vertical month labels */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-around',
              height: weeks.length * 14,
              width: 20,
              fontSize: 9,
              color: theme === 'dark' ? '#9ca3af' : '#666666'
            }}>
              {weeks.map((week, weekIndex) => {
                if (weekIndex % 3 === 0) {
                  const monthName = new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' });
                  return <span key={weekIndex}>{monthName}</span>;
                }
                return <span key={weekIndex}></span>;
              })}
            </div>

            {/* Activity Grid */}
            <div style={{ display: 'flex', gap: 2 }}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {week.map((day) => {
                    const intensity = getIntensityLevel(day.count);
                    return (
                      <Tooltip
                        key={day.date}
                        title={
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {formatDate(day.date)}
                            </div>
                            <div>
                              {day.count === 0 
                                ? 'No activity' 
                                : `${day.count} item${day.count === 1 ? '' : 's'}`}
                            </div>
                            {day.items.length > 0 && (
                              <div style={{ marginTop: 4, fontSize: 11 }}>
                                {day.items.slice(0, 3).map((item, i) => (
                                  <div key={i}>
                                    • {getTypeDisplayName(item.type)}: {item.title.substring(0, 25)}...
                                  </div>
                                ))}
                                {day.items.length > 3 && (
                                  <div>... and {day.items.length - 3} more</div>
                                )}
                              </div>
                            )}
                          </div>
                        }
                        placement="top"
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: getIntensityColor(intensity),
                            borderRadius: 2,
                            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        padding: '8px 0',
        borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
      }}>
        <Text style={{ 
          fontSize: 11, 
          color: theme === 'dark' ? '#9ca3af' : '#666666',
          marginRight: 8
        }}>
          Less
        </Text>
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            style={{
              width: 10,
              height: 10,
              backgroundColor: getIntensityColor(level),
              borderRadius: 2,
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
            }}
          />
        ))}
        <Text style={{ 
          fontSize: 11, 
          color: theme === 'dark' ? '#9ca3af' : '#666666',
          marginLeft: 8
        }}>
          More
        </Text>
      </div>
    </Card>
  );
};

export default ActivityHeatmap;