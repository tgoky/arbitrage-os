// app/dashboard/components/QuickStartActions.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Grid, Button, Spin, message, Select, Space } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

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
  
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');

  // Fetch work items data
  const fetchAllWorkItems = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching work items for statistics chart...');
      const url = new URL('/api/dashboard/work-items', window.location.origin);
      if (workspaceId) {
        url.searchParams.append('workspaceId', workspaceId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch work items: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      if (data.success && Array.isArray(data.data?.items)) {
        console.log(`🎉 Successfully fetched ${data.data.items.length} work items for chart`);
        setWorkItems(data.data.items);
      } else {
        throw new Error(data.error || 'Invalid response format from unified API');
      }
    } catch (error) {
      console.error('💥 Error fetching work items for chart:', error);
      message.error('Failed to load statistics');
      setWorkItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchAllWorkItems();
  }, [workspaceId]);

  // Helper functions - moved before useMemo
  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      'sales-call': 'Sales Call Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calculator',
      'niche-research': 'Niche Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offer Creator',
      'ad-writer': 'Ad Copy Writer',
      'n8n-workflow': 'n8n Workflow'
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
      'n8n Workflow': '#fa541c'
    };
    return colors[type] || '#666';
  };

  // Process data for different chart types
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

  const getMainCardStyles = () => ({
    header: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
    },
    body: {
      backgroundColor: theme === 'dark' ? '#081724' : '#ffffff',
      padding: '12px',
      minHeight: '150px', // Reduced from 320px to 200px
    },
  });

  const chartColors = ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2', '#faad14', '#fa541c'];

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 240,
          color: theme === 'dark' ? '#9ca3af' : '#666'
        }}>
          No data available for visualization
        </div>
      );
    }

    const commonProps = {
      width: '100%',
      height: 160, // Reduced from 240 to 160
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#f0f0f0'} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: theme === 'dark' ? '#9ca3af' : '#666' }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 10, fill: theme === 'dark' ? '#9ca3af' : '#666' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d9d9d9'}`,
                  borderRadius: '6px',
                  color: theme === 'dark' ? '#f9fafb' : '#000'
                }}
              />
              <Bar dataKey="count" fill="#1890ff" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#f0f0f0'} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: theme === 'dark' ? '#9ca3af' : '#666' }}
              />
              <YAxis tick={{ fontSize: 10, fill: theme === 'dark' ? '#9ca3af' : '#666' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d9d9d9'}`,
                  borderRadius: '6px',
                  color: theme === 'dark' ? '#f9fafb' : '#000'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#1890ff" 
                strokeWidth={3}
                dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#1890ff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#f0f0f0'} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: theme === 'dark' ? '#9ca3af' : '#666' }}
              />
              <YAxis tick={{ fontSize: 10, fill: theme === 'dark' ? '#9ca3af' : '#666' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d9d9d9'}`,
                  borderRadius: '6px',
                  color: theme === 'dark' ? '#f9fafb' : '#000'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#1890ff" 
                fill="url(#colorGradient)" 
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1890ff" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30} // Reduced from 40
                outerRadius={60} // Reduced from 80
                paddingAngle={5}
                dataKey="count"
                label={({ name, percent }: any) => 
                  `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                }
                labelLine={false}
                style={{ fontSize: 12, fill: theme === 'dark' ? '#9ca3af' : '#666' }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d9d9d9'}`,
                  borderRadius: '6px',
                  color: theme === 'dark' ? '#f9fafb' : '#000'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      data-tour="quick-actions"
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Text strong style={{ fontSize: '18px', color: theme === 'dark' ? '#f9fafb' : '#111827' }}>
            Submissions Analytics
          </Text>
          <Space>
            <Select
              value={chartType}
              onChange={setChartType}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="bar">
                <BarChartOutlined /> Bar
              </Option>
              <Option value="line">
                <LineChartOutlined /> Line  
              </Option>
              <Option value="area">
                <AreaChart /> Area
              </Option>
              <Option value="pie">
                <PieChartOutlined /> Pie
              </Option>
            </Select>
          </Space>
        </div>
      }
      styles={getMainCardStyles()}
      style={{ 
        marginBottom: 24, 
        borderRadius: '8px', 
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
      }}
      extra={
        <Button 
          type="link" 
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={fetchAllWorkItems}
          style={{ color: theme === 'dark' ? '#a78bfa' : '#1890ff', fontWeight: 500 }}
        >
          Refresh
        </Button>
      }
    >
      {loading ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 160, // Reduced from 240
          flexDirection: 'column',
          gap: 12 // Reduced from 16
        }}>
          <Spin size="large" />
          <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#666' }}>
            Loading analytics...
          </Text>
        </div>
      ) : (
        <div style={{ width: '100%', height: 160 }}> {/* Reduced from 240 */}
          {renderChart()}
        </div>
      )}
    </Card>
  );
};

export default QuickStartActions;