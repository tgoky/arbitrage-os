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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Sales Call Analysis': '#722ed1',
      'Growth Plan': '#1890ff',
      'Pricing Calculator': '#52c41a',
      'Niche Research': '#fa8c16',
      'Cold Email': '#eb2f96',
      'Offer Creator': '#13c2c2',
      'Ad Copy Writer': '#faad14',
      'n8n Workflow': '#fa541c',
      'Proposal': '#9254de',
      'Lead Generation': '#52c41a'
    };
    return colors[type] || '#666';
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
        color: '#1890ff'
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
  const chartColors = ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2', '#faad14', '#fa541c', '#9254de'];
  
  // ✅ CHANGED: Pure black background for dark mode
  const backgroundColor = isDark ? '#000000' : '#ffffff';
  const borderColor = isDark ? '#262626' : '#f0f0f0';

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

  // Tooltip Styles
  const tooltipStyle = {
    backgroundColor: isDark ? '#141414' : 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${isDark ? '#333' : '#f0f0f0'}`,
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    color: isDark ? '#f9fafb' : '#1f2937',
    padding: '8px 12px',
    fontFamily: fontFamily,
    fontSize: '12px',
    fontWeight: 500
  };

  const axisStyle = {
    fontSize: 11, 
    fill: isDark ? '#6b7280' : '#6b7280', // Muted text for axes
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
          color: isDark ? '#4b5563' : '#9ca3af',
          fontFamily: fontFamily,
          fontSize: '14px'
        }}>
          No data available for visualization
        </div>
      );
    }

    // Define chart content separately to avoid "Element | null" type error in ResponsiveContainer
    let chartContent: React.ReactElement | null = null;

    switch (chartType) {
      case 'bar':
        chartContent = (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {chartData.map((entry, index) => (
                <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0.9}/>
                  <stop offset="100%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0.5}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#f0f0f0'} strokeOpacity={0.5} />
            <XAxis 
              dataKey="name" 
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              dy={10}
              interval={0}
              tickFormatter={(val) => chartData.length > 8 ? val.substring(0, 3) : val}
            />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
              contentStyle={tooltipStyle}
              itemStyle={{ color: 'inherit' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#grad-${index})`} />
              ))}
            </Bar>
          </BarChart>
        );
        break;

      case 'line':
        chartContent = (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#f0f0f0'} strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#1890ff" 
              strokeWidth={3}
              dot={{ fill: isDark ? '#000' : '#fff', stroke: '#1890ff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#1890ff', stroke: isDark ? '#000' : '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        );
        break;

      case 'area':
        chartContent = (
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#f0f0f0'} strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#1890ff" 
              fill="url(#colorGradient)" 
              strokeWidth={3}
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
              stroke={isDark ? '#000' : '#fff'}
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              iconType="circle"
              formatter={(value) => <span style={{ color: isDark ? '#9ca3af' : '#4b5563', fontFamily: fontFamily, fontSize: 12 }}>{value}</span>}
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
              backgroundColor: isDark ? 'rgba(82, 196, 26, 0.2)' : '#e6f7ff',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
               <CalendarOutlined style={{ color: '#52c41a', fontSize: '16px' }} /> 
            </div>
            <Text strong style={{ 
              fontSize: '14px', 
              color: isDark ? '#f3f4f6' : '#111827', 
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
                backgroundColor: isDark ? '#1f1f1f' : '#ffffff', // Slightly lighter than black for dropdown
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.1)'
              }}
              style={{ 
                width: 130, 
                fontFamily: fontFamily,
                backgroundColor: isDark ? '#141414' : '#f9fafb', // Input bg
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#333' : 'transparent'}`
              }}
              suffixIcon={<span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>▼</span>}
            >
              <Option value="bar"><Space style={{ color: isDark ? '#d1d5db' : 'inherit' }}><BarChartOutlined /> Bar</Space></Option>
              <Option value="line"><Space style={{ color: isDark ? '#d1d5db' : 'inherit' }}><LineChartOutlined /> Line</Space></Option>
              <Option value="area"><Space style={{ color: isDark ? '#d1d5db' : 'inherit' }}><AreaChartOutlined /> Area</Space></Option>
              <Option value="pie"><Space style={{ color: isDark ? '#d1d5db' : 'inherit' }}><PieChartOutlined /> Pie</Space></Option>
            </Select>
          </Space>
        </div>
      }
      styles={getMainCardStyles()}
      style={{ 
        marginBottom: 24, 
        borderRadius: '16px', 
        border: `1px solid ${borderColor}`,
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.8)' : '0 4px 20px rgba(0,0,0,0.03)',
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
            color: '#52c41a', 
            fontWeight: 600,
            fontFamily: fontFamily,
            fontSize: '13px',
            backgroundColor: isDark ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.05)',
            borderRadius: '8px',
            border: '1px solid transparent',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(82, 196, 26, 0.2)' : 'rgba(82, 196, 26, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.05)';
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
      colorPrimary: '#5CC49D',
    },
  }}
>
      <Spin size="large" />
</ConfigProvider>

    
          <Text style={{ color: isDark ? '#6b7280' : '#9ca3af', fontFamily: fontFamily, fontSize: '13px' }}>
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