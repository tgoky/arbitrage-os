"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  SearchOutlined,
  SettingOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  UserOutlined,
  PhoneOutlined,
  ArrowLeftOutlined,
  FileSearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  BarChartOutlined,
  SoundOutlined,
  TeamOutlined,
  LikeOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Input,
  Select,
  Table,
  Tag,
  Typography,
  Space,
  Progress,
  Badge,
  Avatar,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  List,
  Spin,
  Alert,
  ConfigProvider,
  theme
} from 'antd';

import { useGo } from "@refinedev/core";
import { NewCallModal } from '../callmodel';
import { useSalesCallAnalyzer } from '../../hooks/useSalesCallAnalyzer';
import type { ColumnsType } from 'antd/es/table';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// --- DARK MODE STYLING CONSTANTS ---
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#0f172a'; // Deep space dark background
const SURFACE_BG = '#1e293b'; // Card surface background
const SURFACE_LIGHTER = '#334155'; // Lighter surfaces
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const TEXT_TERTIARY = '#64748b';
const BORDER_COLOR = '#334155';

interface CallRecord {
  key: string;
  id: string;
  type: string;
  title: string;
  status: string;
  date: string;
  duration: number;
  insights: string;
  progress: number;
  participants: string[];
  overallScore?: number;
  sentiment?: string;
  companyName?: string;
  prospectName?: string;
}

export default function SalesCallAnalyzerPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [analyses, setAnalyses] = useState<CallRecord[]>([]);
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const router = useRouter();
  
  const go = useGo();

  const {
    getUserAnalyses,
    deleteAnalysis,
    exportAnalysis,
    loading,
    error
  } = useSalesCallAnalyzer();

  // ✅ Wrap loadAnalyses with useCallback
  const loadAnalyses = useCallback(async () => {
    try {
      const data = await getUserAnalyses();
      const formattedData = data.map((analysis: any) => ({
        key: analysis.id,
        id: analysis.id,
        type: analysis.callType || 'discovery',
        title: analysis.title || 'Untitled Call',
        status: analysis.analysisStatus || 'completed',
        date: new Date(analysis.createdAt).toLocaleDateString(),
        duration: analysis.duration || 0,
        insights: `Score: ${analysis.overallScore || 'N/A'}/100 • ${analysis.sentiment || 'neutral'} sentiment`,
        progress: analysis.analysisStatus === 'completed' ? 100 : 
                 analysis.analysisStatus === 'processing' ? 50 : 0,
        participants: [analysis.prospectName, analysis.companyName].filter(Boolean),
        overallScore: analysis.overallScore,
        sentiment: analysis.sentiment,
        companyName: analysis.companyName,
        prospectName: analysis.prospectName
      }));
      setAnalyses(formattedData);
    } catch (err) {
      console.error('Failed to load analyses:', err);
      message.error('Failed to load call analyses');
    }
  }, [getUserAnalyses]);

  // --- GOOGLE FONT INJECTION ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (currentWorkspace) {
      loadAnalyses();
    }
  }, [currentWorkspace?.id, loadAnalyses]);

  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });

  // ADD WORKSPACE VALIDATION
  if (!isWorkspaceReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center min-h-[50vh] flex flex-col items-center justify-center bg-gray-900">


<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
    <Spin size="large" tip="Initializing Workspace..." />
</ConfigProvider>

    
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-900">
        <Alert
          message="Workspace Required"
          description="The sales call analyzer must be accessed from within a workspace. Please navigate to a workspace first."
          type="error"
          showIcon
          action={
            <Button type="primary" href="/dashboard" style={{ background: BRAND_GREEN, color: '#000' }}>
              Go to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const callTypes = [
    { value: 'discovery', label: 'Discovery', icon: <PhoneOutlined />, color: 'blue' },
    { value: 'interview', label: 'Interview', icon: <UserOutlined />, color: BRAND_GREEN }, // Changed from purple
    { value: 'sales', label: 'Sales', icon: <PhoneOutlined />, color: 'green' },
    { value: 'podcast', label: 'Podcast', icon: <PhoneOutlined />, color: 'orange' }
  ];

  const statusOptions = [
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'processing', label: 'Processing', color: 'processing' },
    { value: 'failed', label: 'Failed', color: 'error' },
    { value: 'pending', label: 'Pending', color: 'default' }
  ];

  const handleDelete = async (analysisId: string) => {
    try {
      await deleteAnalysis(analysisId);
      message.success('Analysis deleted successfully');
      loadAnalyses(); // Refresh the list
    } catch (err) {
      message.error('Failed to delete analysis');
    }
  };

  const handleExport = async (analysisId: string, format: 'summary' | 'detailed' | 'presentation' | 'follow-up' = 'summary') => {
    try {
      await exportAnalysis(analysisId, format);
      message.success('Analysis exported successfully');
    } catch (err) {
      message.error('Failed to export analysis');
    }
  };

  const handleViewAnalysis = (analysisId: string) => {
    go({ to: `/sales-call-analyzer/analysis/${analysisId}` });
  };

  const filteredData = analyses.filter(call => {
    const matchesSearch = call.title.toLowerCase().includes(searchText.toLowerCase()) ||
      call.participants.some(p => p?.toLowerCase().includes(searchText.toLowerCase()));
    const matchesType = !filters.type || call.type === filters.type;
    const matchesStatus = !filters.status || call.status === filters.status;
    const matchesTab = activeTab === 'all' || call.type === activeTab;
    return matchesSearch && matchesType && matchesStatus && matchesTab;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'processing': return <SyncOutlined spin />;
      case 'failed': return <CloseCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'green';
      case 'negative': return 'red';
      case 'mixed': return 'orange';
      default: return BRAND_GREEN; // Changed from blue to brand green
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  // Calculate statistics for the dashboard
  const getStats = () => {
    const totalCalls = analyses.length;
    const completedCalls = analyses.filter(a => a.status === 'completed').length;
    const avgScore = totalCalls > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + (a.overallScore || 0), 0) / totalCalls) 
      : 0;
    
    const sentimentCounts = {
      positive: analyses.filter(a => a.sentiment === 'positive').length,
      negative: analyses.filter(a => a.sentiment === 'negative').length,
      mixed: analyses.filter(a => a.sentiment === 'mixed').length,
      neutral: analyses.filter(a => !a.sentiment || a.sentiment === 'neutral').length
    };
    
    const totalDuration = analyses.reduce((sum, a) => sum + a.duration, 0);
    const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
    
    return {
      totalCalls,
      completedCalls,
      avgScore,
      sentimentCounts,
      avgDuration
    };
  };

  const stats = getStats();

  const columns: ColumnsType<CallRecord> = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const callType = callTypes.find(t => t.value === type);
        return (
          <Tag icon={callType?.icon} color={callType?.color}>
            {callType?.label}
          </Tag>
        );
      },
      filters: callTypes.map(type => ({
        text: type.label,
        value: type.value
      })),
      onFilter: (value: boolean | React.Key, record: CallRecord) => {
        return record.type === String(value);
      },
    },
    {
      title: 'Meeting/Call',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: CallRecord) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">
            {record.participants.join(', ') || 'No participants'}
          </div>
          {record.companyName && (
            <div className="text-xs" style={{ color: BRAND_GREEN }}>{record.companyName}</div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusObj = statusOptions.find(s => s.value === status);
        return (
          <Tag icon={getStatusIcon(status)} color={statusObj?.color}>
            {statusObj?.label || status}
          </Tag>
        );
      },
      filters: statusOptions.map(status => ({
        text: status.label,
        value: status.value
      })),
      onFilter: (value: boolean | React.Key, record: CallRecord) => {
        return record.status === String(value);
      },
    },
    {
      title: 'Score & Sentiment',
      key: 'scoreAndSentiment',
      render: (_, record: CallRecord) => (
        <div>
          {record.overallScore && (
            <div className="flex items-center mb-1">
              <Progress
                percent={record.overallScore}
                size="small"
                showInfo={false}
                className="w-16 mr-2"
              />
              <Text className="text-xs">{record.overallScore}/100</Text>
            </div>
          )}
          {record.sentiment && (
            <Tag color={getSentimentColor(record.sentiment)}>
              {record.sentiment}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: CallRecord, b: CallRecord) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => {
        if (!duration) return '-';
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: CallRecord) => (
        <Space>
          <Tooltip title="View Analysis">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewAnalysis(record.id)}
            />
          </Tooltip>
          <Tooltip title="Export Summary">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleExport(record.id, 'summary')}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Analysis"
            description="Are you sure you want to delete this analysis?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Calculate stats for call type cards
  const getTypeStats = (type: string) => {
    const typeAnalyses = analyses.filter(a => a.type === type);
    const completed = typeAnalyses.filter(a => a.status === 'completed').length;
    return { total: typeAnalyses.length, completed };
  };

  if (error) {
    message.error(error);
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          fontFamily: 'Manrope, sans-serif',
          colorPrimary: BRAND_GREEN,
          borderRadius: 8,
          colorTextHeading: TEXT_PRIMARY,
          colorText: TEXT_SECONDARY,
          colorBgContainer: SURFACE_BG,
          colorBgElevated: SURFACE_BG,
          colorBorder: BORDER_COLOR,
        },
        components: {
          Button: {
            colorPrimary: BRAND_GREEN,
            algorithm: true,
            fontWeight: 600,
            colorTextLightSolid: '#000000',
            defaultBorderColor: SPACE_COLOR,
            defaultColor: TEXT_SECONDARY,
            defaultBg: SURFACE_BG,
          },
          Input: {
            paddingBlock: 10,
            // borderColor: SURFACE_LIGHTER,
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
          },
          Select: {
            controlHeight: 44,
            colorPrimary: BRAND_GREEN,
            optionSelectedBg: SURFACE_LIGHTER,
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
          },
          Card: {
            headerBg: SURFACE_BG,
            colorBgContainer: SURFACE_BG,
            colorTextHeading: TEXT_PRIMARY,
            colorBorder: BORDER_COLOR,
          },
          Table: {
            headerBg: SURFACE_LIGHTER,
            headerColor: TEXT_PRIMARY,
            rowHoverBg: '#2d3748',
            colorBgContainer: SURFACE_BG,
            borderColor: BORDER_COLOR,
          },
          Progress: {
            defaultColor: BRAND_GREEN,
          }
        }
      }}
    >
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6 font-manrope">
          <Spin spinning={loading} tip="Loading analysis data...">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              className="mb-6 hover:text-white border-none shadow-none px-0"
              style={{ background: 'transparent', color: SPACE_COLOR }}
            >
              Back to Dashboard
            </Button>
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-700 mb-2 inline-block">
                  <span className="text-[13px] font-bold tracking-widest uppercase text-gray-100">
                    <span style={{ color: BRAND_GREEN }}>a</span>rb<span style={{ color: BRAND_GREEN }}>i</span>trageOS
                  </span>
                </div>
                <Title level={1} style={{ marginBottom: 8, fontSize: '32px', fontWeight: 800, color: TEXT_PRIMARY }}>
                  Sales Calls Analyzer
                </Title>
                <Text className="text-lg text-gray-400">
                  View and manage your AI-analyzed sales calls
                </Text>
              </div>
              <Space>
                <Button 
                  icon={<SettingOutlined />}
                  onClick={() => go({ to: "/sales-call-analyzer/settings" })}
                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                >
                  Settings
                </Button>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                  style={{
                    backgroundColor: BRAND_GREEN,
                    borderColor: BRAND_GREEN,
                    color: '#000000',
                    fontWeight: '600'
                  }}
                >
                  New Call
                </Button>
                <NewCallModal 
                  visible={isModalVisible} 
                  onClose={() => {
                    setIsModalVisible(false);
                    loadAnalyses(); // Refresh after new call
                  }}
                />
              </Space>
            </div>

            {/* Call Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card
                bordered
                hoverable
                className={`border border-gray-700 hover:border-[${BRAND_GREEN}] ${activeTab === 'all' ? 'border-[${BRAND_GREEN}]' : ''}`}
                onClick={() => setActiveTab('all')}
                styles={{ body: { padding: '16px' } }}
              >
                <div className="flex items-center">
                  <Avatar
                    icon={<PhoneOutlined />}
                    style={{ backgroundColor: 'rgba(92, 196, 157, 0.1)', color: BRAND_GREEN }}
                    className="mr-3"
                  />
                  <div>
                    <Text strong className="block" style={{ color: TEXT_PRIMARY }}>All Calls</Text>
                    <Text style={{ color: TEXT_SECONDARY }}>{analyses.length} total</Text>
                  </div>
                </div>
              </Card>
              
              {callTypes.map(type => {
                const stats = getTypeStats(type.value);
                return (
                  <Card
                    key={type.value}
                    bordered
                    hoverable
                    className={`border border-gray-700 hover:border-[${BRAND_GREEN}] ${activeTab === type.value ? `border-[${BRAND_GREEN}]` : ''}`}
                    onClick={() => setActiveTab(type.value)}
                    styles={{ body: { padding: '16px' } }}
                  >
                    <div className="flex items-center">
                      <Avatar
                        icon={type.icon}
                        style={{ 
                          backgroundColor: type.color === BRAND_GREEN ? 'rgba(92, 196, 157, 0.1)' : `var(--ant-color-${type.color}-1)`,
                          color: type.color === BRAND_GREEN ? BRAND_GREEN : `var(--ant-color-${type.color}-6)`
                        }}
                        className="mr-3"
                      />
                      <div>
                        <Text strong className="block capitalize" style={{ color: TEXT_PRIMARY }}>{type.label} Calls</Text>
                        <Text style={{ color: TEXT_SECONDARY }}>
                          {stats.total > 0 ? (
                            `${stats.completed}/${stats.total} analyzed`
                          ) : (
                            'No calls yet'
                          )}
                        </Text>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Analysis Dashboard */}
            <Card 
              className="mb-8 border border-gray-700" 
              title={
                <span style={{ color: TEXT_PRIMARY }}>
                  <DashboardOutlined className="mr-2" />
                  Analysis Overview
                </span>
              }
            >
              <Row gutter={16}>
                <Col xs={24} sm={12} md={6} className="mb-4">
                  <Card bordered={false} className="border border-gray-700 bg-gray-800/50">
                    <Statistic
                      title={<span style={{ color: TEXT_SECONDARY }}>Total Calls</span>}
                      value={stats.totalCalls}
                      prefix={<PhoneOutlined style={{ color: BRAND_GREEN }} />}
                      valueStyle={{ color: TEXT_PRIMARY }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6} className="mb-4">
                  <Card bordered={false} className="border border-gray-700 bg-gray-800/50">
                    <Statistic
                      title={<span style={{ color: TEXT_SECONDARY }}>Completed Analysis</span>}
                      value={stats.completedCalls}
                      suffix={`/ ${stats.totalCalls}`}
                      prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      valueStyle={{ color: TEXT_PRIMARY }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6} className="mb-4">
                  <Card bordered={false} className="border border-gray-700 bg-gray-800/50">
                    <Statistic
                      title={<span style={{ color: TEXT_SECONDARY }}>Average Score</span>}
                      value={stats.avgScore}
                      suffix="/ 100"
                      prefix={<LikeOutlined style={{ color: BRAND_GREEN }} />}
                      valueStyle={{ color: TEXT_PRIMARY }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6} className="mb-4">
                  <Card bordered={false} className="border border-gray-700 bg-gray-800/50">
                    <Statistic
                      title={<span style={{ color: TEXT_SECONDARY }}>Avg. Duration</span>}
                      value={Math.floor(stats.avgDuration / 60)}
                      suffix={`min ${stats.avgDuration % 60}s`}
                      prefix={<ClockCircleOutlined style={{ color: BRAND_GREEN }} />}
                      valueStyle={{ color: TEXT_PRIMARY }}
                    />
                  </Card>
                </Col>
              </Row>
              
              <Row gutter={16} className="mt-4">
                <Col xs={24} md={12} className="mb-4">
                  <Card 
                    title={<span style={{ color: TEXT_PRIMARY }}>Sentiment Analysis</span>} 
                    bordered={false}
                    className="border border-gray-700 bg-gray-800/50"
                  >
                    <div className="flex justify-between mb-2">
                      <span style={{ color: TEXT_SECONDARY }}>Positive</span>
                      <span style={{ color: TEXT_PRIMARY }}>{stats.sentimentCounts.positive} calls</span>
                    </div>
                    <Progress 
                      percent={stats.totalCalls > 0 ? Math.round((stats.sentimentCounts.positive / stats.totalCalls) * 100) : 0} 
                      strokeColor="#52c41a"
                      className="mb-3"
                    />
                    
                    <div className="flex justify-between mb-2">
                      <span style={{ color: TEXT_SECONDARY }}>Negative</span>
                      <span style={{ color: TEXT_PRIMARY }}>{stats.sentimentCounts.negative} calls</span>
                    </div>
                    <Progress 
                      percent={stats.totalCalls > 0 ? Math.round((stats.sentimentCounts.negative / stats.totalCalls) * 100) : 0} 
                      strokeColor="#f5222d"
                      className="mb-3"
                    />
                    
                    <div className="flex justify-between mb-2">
                      <span style={{ color: TEXT_SECONDARY }}>Mixed</span>
                      <span style={{ color: TEXT_PRIMARY }}>{stats.sentimentCounts.mixed} calls</span>
                    </div>
                    <Progress 
                      percent={stats.totalCalls > 0 ? Math.round((stats.sentimentCounts.mixed / stats.totalCalls) * 100) : 0} 
                      strokeColor="#fa8c16"
                      className="mb-3"
                    />
                    
                    <div className="flex justify-between mb-2">
                      <span style={{ color: TEXT_SECONDARY }}>Neutral</span>
                      <span style={{ color: TEXT_PRIMARY }}>{stats.sentimentCounts.neutral} calls</span>
                    </div>
                    <Progress 
                      percent={stats.totalCalls > 0 ? Math.round((stats.sentimentCounts.neutral / stats.totalCalls) * 100) : 0} 
                      strokeColor={BRAND_GREEN}
                    />
                  </Card>
                </Col>
                
                <Col xs={24} md={12} className="mb-4">
                  <Card 
                    title={<span style={{ color: TEXT_PRIMARY }}>Recent Calls</span>} 
                    bordered={false}
                    className="border border-gray-700 bg-gray-800/50"
                  >
                    <List
                      itemLayout="horizontal"
                      dataSource={analyses.slice(0, 5)}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar icon={<PhoneOutlined />} style={{ backgroundColor: 'rgba(92, 196, 157, 0.1)', color: BRAND_GREEN }} />}
                            title={
                              <a 
                                onClick={() => handleViewAnalysis(item.id)} 
                                style={{ color: TEXT_PRIMARY, cursor: 'pointer' }}
                              >
                                {item.title}
                              </a>
                            }
                            description={
                              <div>
                                <div style={{ color: TEXT_SECONDARY }}>{item.participants.join(', ')}</div>
                                <div className="flex justify-between mt-1">
                                  <Tag color={getSentimentColor(item.sentiment)}>{item.sentiment || 'neutral'}</Tag>
                                  <span style={{ color: TEXT_SECONDARY }}>{item.date}</span>
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
                <div className="flex flex-col md:flex-row gap-4 flex-grow">
                  <div>
                    <Text strong className="block mb-1" style={{ color: TEXT_PRIMARY }}>Type</Text>
                    <Select
                      placeholder="All Types"
                      style={{ width: 150 }}
                      onChange={value => setFilters({ ...filters, type: value })}
                      allowClear
                    >
                      <Option value="discovery">Discovery</Option>
                      <Option value="interview">Interview</Option>
                      <Option value="sales">Sales</Option>
                      <Option value="podcast">Podcast</Option>
                    </Select>
                  </div>
                  <div>
                    <Text strong className="block mb-1" style={{ color: TEXT_PRIMARY }}>Status</Text>
                    <Select
                      placeholder="All Statuses"
                      style={{ width: 150 }}
                      onChange={value => setFilters({ ...filters, status: value })}
                      allowClear
                    >
                      {statusOptions.map(status => (
                        <Option key={status.value} value={status.value}>
                          {status.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Search Box aligned right */}
                <div className="mt-[6px] md:mt-6 md:ml-auto">
                  <Search
                    placeholder="Search by name or company..."
                    allowClear
                    enterButton={<SearchOutlined />}
                    onChange={e => setSearchText(e.target.value)}
                    className="min-w-[250px]"
                  />
                </div>
              </div>
            </div>

            {/* Calls Table */}
            <Card className="border border-gray-700">
              <Table
                columns={columns}
                dataSource={filteredData}
                className="no-vertical-borders"
                rowKey="key"
                loading={loading}
                locale={{
                  emptyText: (
                    <div className="py-12 text-center">
                      <FileSearchOutlined className="text-3xl mb-2" style={{ color: TEXT_SECONDARY }} />
                      <Text style={{ color: TEXT_SECONDARY }}>No sales calls found</Text>
                      <div className="mt-2">
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => setIsModalVisible(true)}
                          style={{
                            backgroundColor: BRAND_GREEN,
                            borderColor: BRAND_GREEN,
                            color: '#000000',
                            fontWeight: '600'
                          }}
                        >
                          Create Your First Analysis
                        </Button>
                      </div>
                    </div>
                  )
                }}
                pagination={{
                  showSizeChanger: true,
                  showTotal: (total, range) => (
                    <Text style={{ color: TEXT_SECONDARY }}>
                      Viewing {range[0]}-{range[1]} of {total} results
                    </Text>
                  )
                }}
              />
            </Card>
          </Spin>
        </div>
      </div>
    </ConfigProvider>
  );
}