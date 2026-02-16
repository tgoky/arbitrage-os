// app/dashboard/components/QuickStartActions.tsx
"use client";
import React, { useState, useMemo } from 'react';
import { Card, Typography, Grid, Button, Select, Space, Spin, message, theme as antTheme } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, ReloadOutlined, CalendarOutlined, AreaChartOutlined } from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { useWorkItems } from '../../hooks/useDashboardData';

import { ConfigProvider } from "antd";

const { Text } = Typography;
const { useBreakpoint } = Grid;
const { Option } = Select;

interface QuickStartActionsProps {
  workspaceId?: string;
}

// Brand grayscale colors from the screenshot
const brandColors = {
  cloud: '#EDEFF7',    // Lightest - for text/highlights
  smoke: '#D3D6E0',    // For secondary text
  steel: '#BCBFCC',    // For borders/lines
  space: '#9DA2B3',    // For muted elements
  graphite: '#6E7180', // For icons
  arsenic: '#40424D',  // For dark surfaces
  phantom: '#1E1E24',  // For darker surfaces
  black: '#000000',    // Pure black background
};

const QuickStartActions: React.FC<QuickStartActionsProps> = ({ workspaceId }) => {
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const router = useRouter();
  const { token } = antTheme.useToken();
  
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');

  // Use React Query for work items
  const {
    data: workItems = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useWorkItems();

  // --- Helpers ---
  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      'sales-call': 'Sales Call Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calculator',
      'niche-research': 'Niche Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offer Creator',
      'ad-writer': 'Ad Copy Writer',
      'n8n-workflow': 'n8n Workflow',
      'proposal': 'Proposal',
      'lead-generation': 'Lead Generation'
    };
    return names[type] || type;
  };

  // ✅ Using brand grayscale colors for type colors
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Sales Call Analysis': brandColors.cloud,     // Lightest
      'Growth Plan': brandColors.smoke,             // Light
      'Pricing Calculator': brandColors.steel,      // Medium-light
      'Niche Research': brandColors.space,          // Medium
      'Cold Email': brandColors.graphite,           // Medium-dark
      'Offer Creator': brandColors.arsenic,         // Dark
      'Ad Copy Writer': brandColors.phantom,        // Darker
      'n8n Workflow': brandColors.graphite,         // Using graphite as accent
      'Proposal': brandColors.space,                // Using space
      'Lead Generation': brandColors.steel           // Using steel
    };
    return colors[type] || brandColors.graphite;
  };

  // --- Data Processing ---
  const chartData = useMemo(() => {
    if (!workItems.length) return [];

    // Group by type for bar/pie charts
    const typeStats = workItems.reduce((acc, item) => {
      const typeName = getTypeName(item.type);
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // For bar/pie charts
    const barData = Object.entries(typeStats).map(([name, count]) => ({
      name: name.replace(' Analysis', '').replace(' Creator', ''),
      full_name: name,
      count,
      color: getTypeColor(name)
    }));

    // For line/area charts - group by month
    const monthlyStats = workItems.reduce((acc, item) => {
      const date = new Date(item.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lineData = Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count,
        color: brandColors.cloud // Using cloud for line color
      }));

    return chartType === 'line' || chartType === 'area' ? lineData : barData;
  }, [workItems, chartType]);

  const handleRefresh = async () => {
    try {
      await refetch();
      message.success('Analytics refreshed');
    } catch (err) {
      message.error('Failed to refresh analytics');
    }
  };

  // --- Premium Styling Constants ---
  const isDark = theme === 'dark';
  const fontFamily = "'Manrope', sans-serif";
  
  // Using brand colors for chart fills with transparency
  const chartColors = [
    'rgba(237, 239, 247, 0.2)', // cloud transparent
    'rgba(211, 214, 224, 0.2)', // smoke transparent
    'rgba(188, 191, 204, 0.2)', // steel transparent
    'rgba(157, 162, 179, 0.2)', // space transparent
    'rgba(110, 113, 128, 0.2)', // graphite transparent
    'rgba(64, 66, 77, 0.2)',    // arsenic transparent
    'rgba(30, 30, 36, 0.2)',    // phantom transparent
  ];
  
  // Border colors for chart elements (solid version of brand colors)
  const borderColors = [
    brandColors.cloud,
    brandColors.smoke,
    brandColors.steel,
    brandColors.space,
    brandColors.graphite,
    brandColors.arsenic,
    brandColors.phantom,
  ];
  
  // Pure black background for dark mode
  const backgroundColor = isDark ? brandColors.black : '#ffffff';
  const borderColor = isDark ? brandColors.phantom : '#f0f0f0';

  // Card Styles
  const getMainCardStyles = () => ({
    header: {
      backgroundColor: backgroundColor,
      borderBottom: `1px solid ${borderColor}`,
      padding: '16px 24px',
    },
    body: {
      backgroundColor: backgroundColor,
      padding: '24px',
      minHeight: '200px',
    },
  });

  // Tooltip styling
  const tooltipStyle = {
    backgroundColor: isDark ? brandColors.phantom : 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${isDark ? brandColors.graphite : '#f0f0f0'}`,
    borderRadius: '12px',
    boxShadow: isDark 
      ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
      : '0 8px 32px rgba(0, 0, 0, 0.12)',
    color: isDark ? brandColors.cloud : '#1f2937',
    padding: '8px 12px',
    fontFamily: fontFamily,
    fontSize: '12px',
    fontWeight: 500
  };

  const axisStyle = {
    fontSize: 11, 
    fill: isDark ? brandColors.graphite : brandColors.space,
    fontFamily: fontFamily,
    fontWeight: 500
  };

 const renderChart = () => {
  if (!chartData.length) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: 180,
        color: isDark ? brandColors.graphite : brandColors.space,
        fontFamily: fontFamily,
        fontSize: '14px'
      }}>
        No data available for visualization
      </div>
    );
  }

    // Define chart content separately
  let chartContent: React.ReactElement | null = null;

  switch (chartType) {
    case 'bar':
      chartContent = (
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={isDark ? brandColors.phantom : '#f0f0f0'} 
            strokeOpacity={0.5} 
          />
          <XAxis 
            dataKey="name" 
            tick={axisStyle}
            axisLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke, strokeWidth: 1 }}
            tickLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke }}
            dy={10}
            interval={0}
            tickFormatter={(val) => chartData.length > 8 ? val.substring(0, 3) : val}
          />
          <YAxis 
            tick={axisStyle} 
            axisLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke, strokeWidth: 1 }}
            tickLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke }}
          />
          <Tooltip 
            cursor={{ fill: isDark ? 'rgba(237, 239, 247, 0.02)' : 'rgba(0,0,0,0.02)' }}
            contentStyle={tooltipStyle}
            itemStyle={{ color: 'inherit' }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={chartColors[index % chartColors.length]}
                // ✅ REMOVED: stroke and strokeWidth props
              />
            ))}
          </Bar>
        </BarChart>
      );
      break;

    case 'line':
      chartContent = (
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={isDark ? brandColors.phantom : '#f0f0f0'} 
            strokeOpacity={0.5} 
          />
          <XAxis 
            dataKey="month" 
            tick={axisStyle} 
            axisLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke, strokeWidth: 1 }}
            tickLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke }}
            dy={10} 
          />
          <YAxis 
            tick={axisStyle} 
            axisLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke, strokeWidth: 1 }}
            tickLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke={brandColors.cloud}
            strokeWidth={2.5}
            dot={{ 
              fill: brandColors.cloud, // ✅ CHANGED: filled dots instead of outlined
              stroke: 'transparent', // ✅ REMOVED: stroke
              r: 4 
            }}
            activeDot={{ 
              r: 6, 
              fill: brandColors.cloud, // ✅ CHANGED: filled active dot
              stroke: 'transparent', // ✅ REMOVED: stroke
            }}
          />
        </LineChart>
      );
      break;

    case 'area':
      chartContent = (
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={brandColors.cloud} stopOpacity={0.15}/>
              <stop offset="95%" stopColor={brandColors.cloud} stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={isDark ? brandColors.phantom : '#f0f0f0'} 
            strokeOpacity={0.5} 
          />
          <XAxis 
            dataKey="month" 
            tick={axisStyle} 
            axisLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke, strokeWidth: 1 }}
            tickLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke }}
            dy={10} 
          />
          <YAxis 
            tick={axisStyle} 
            axisLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke, strokeWidth: 1 }}
            tickLine={{ stroke: isDark ? brandColors.phantom : brandColors.smoke }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke={brandColors.cloud}
            strokeWidth={2.5}
            fill="url(#colorGradient)"
          />
        </AreaChart>
      );
      break;

    case 'pie':
      chartContent = (
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={4}
            dataKey="count"
            label={false}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={chartColors[index % chartColors.length]}
                // ✅ REMOVED: stroke and strokeWidth props
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            iconType="circle"
            formatter={(value) => (
              <span style={{ 
                color: isDark ? brandColors.smoke : brandColors.graphite, 
                fontFamily: fontFamily, 
                fontSize: 12 
              }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      );
      break;
      
    default:
      chartContent = null;
  }

  if (!chartContent) return null;

  return (
    <ResponsiveContainer width="100%" height={180}>
      {chartContent}
    </ResponsiveContainer>
  );
};

  // --- Error State ---
  if (isError) {
    return (
      <Card
        styles={getMainCardStyles()}
        style={{ 
          marginBottom: 24, 
          borderRadius: '16px', 
          border: `1px solid ${borderColor}`,
          backgroundColor: backgroundColor,
          fontFamily: fontFamily
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 180,
          flexDirection: 'column',
          gap: 16,
          color: '#ef4444'
        }}>
          <Text style={{ fontFamily: fontFamily, color: 'inherit' }}>
            Failed to load analytics
          </Text>
          <Button 
            type="primary" 
            danger 
            shape="round"
            onClick={handleRefresh} 
            loading={isFetching}
            style={{ fontFamily: fontFamily }}
          >
            Retry Connection
          </Button>
        </div>
      </Card>
    );
  }

  // --- Main Render ---
  return (
    <Card
      data-tour="quick-actions"
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%',
          fontFamily: fontFamily 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              backgroundColor: isDark ? 'rgba(237, 239, 247, 0.1)' : '#e6f7ff',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
               <CalendarOutlined style={{ color: brandColors.cloud, fontSize: '16px' }} /> 
            </div>
            <Text strong style={{ 
              fontSize: '14px', 
              color: isDark ? brandColors.cloud : brandColors.arsenic, 
              letterSpacing: '-0.01em',
              fontFamily: fontFamily 
            }}>
              SUBMISSIONS ANALYTICS
            </Text>
          </div>

          <Space size="small">
            <Select
              value={chartType}
              onChange={setChartType}
              variant="borderless"
              dropdownStyle={{ 
                fontFamily: fontFamily, 
                borderRadius: '12px',
                padding: '4px',
                backgroundColor: isDark ? brandColors.phantom : '#ffffff',
                border: `1px solid ${isDark ? brandColors.graphite : brandColors.smoke}`,
              }}
              style={{ 
                width: 130, 
                fontFamily: fontFamily,
                backgroundColor: isDark ? brandColors.arsenic : '#f9fafb',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'transparent' : 'transparent'}`
              }}
              suffixIcon={<span style={{ color: isDark ? brandColors.smoke : brandColors.graphite }}>▼</span>}
            >
              <Option value="bar"><Space style={{ color: isDark ? brandColors.cloud : 'inherit' }}><BarChartOutlined /> Bar</Space></Option>
              <Option value="line"><Space style={{ color: isDark ? brandColors.cloud : 'inherit' }}><LineChartOutlined /> Line</Space></Option>
              <Option value="area"><Space style={{ color: isDark ? brandColors.cloud : 'inherit' }}><AreaChartOutlined /> Area</Space></Option>
              <Option value="pie"><Space style={{ color: isDark ? brandColors.cloud : 'inherit' }}><PieChartOutlined /> Pie</Space></Option>
            </Select>
          </Space>
        </div>
      }
      styles={getMainCardStyles()}
      style={{ 
        marginBottom: 24, 
        borderRadius: '16px', 
        border: `1px solid ${borderColor}`,
        boxShadow: isDark 
          ? '0 8px 32px rgba(0,0,0,0.8)' 
          : '0 4px 20px rgba(0,0,0,0.03)',
        fontFamily: fontFamily,
        overflow: 'hidden',
        backgroundColor: backgroundColor
      }}
      extra={
        <Button 
          type="text" 
          icon={<ReloadOutlined />}
          loading={isFetching}
          onClick={handleRefresh}
          style={{ 
            color: brandColors.cloud, 
            fontWeight: 600,
            fontFamily: fontFamily,
            fontSize: '13px',
            backgroundColor: 'transparent',
            borderRadius: '8px',
            border: `1px solid ${brandColors.phantom}`,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.phantom;
            e.currentTarget.style.borderColor = brandColors.cloud;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = brandColors.phantom;
          }}
        >
          Refresh
        </Button>
      }
    >
      {isLoading ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 180,
          flexDirection: 'column',
          gap: 16
        }}>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: brandColors.cloud,
              },
            }}
          >
            <Spin size="large" />
          </ConfigProvider>
          <Text style={{ 
            color: isDark ? brandColors.graphite : brandColors.space, 
            fontFamily: fontFamily, 
            fontSize: '13px' 
          }}>
            Gathering data...
          </Text>
        </div>
      ) : (
        <div style={{ width: '100%', height: 180, paddingTop: 10 }}>
          {renderChart()}
        </div>
      )}
    </Card>
  );
};

export default QuickStartActions;