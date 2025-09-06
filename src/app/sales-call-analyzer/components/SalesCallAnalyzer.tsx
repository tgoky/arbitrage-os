"use client";

import React, { useState, useEffect , useCallback} from 'react';
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
  Alert
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

  useEffect(() => {
    if (currentWorkspace) {
      loadAnalyses();
    }
  }, [currentWorkspace?.id, loadAnalyses]);

  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });



    // ADD WORKSPACE VALIDATION (copy from pricing calculator)
  if (!isWorkspaceReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading workspace..."/>
        {/* <p className="mt-4"></p> */}
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert
          message="Workspace Required"
          description="The sales call analyzer must be accessed from within a workspace. Please navigate to a workspace first."
          type="error"
          showIcon
          action={
            <Button type="primary" href="/dashboard">
              Go to Dashboard
            </Button>
          }
        />
      </div>
    );
  }


  const callTypes = [
    { value: 'discovery', label: 'Discovery', icon: <PhoneOutlined />, color: 'blue' },
    { value: 'interview', label: 'Interview', icon: <UserOutlined />, color: 'purple' },
    { value: 'sales', label: 'Sales', icon: <PhoneOutlined />, color: 'green' },
    { value: 'podcast', label: 'Podcast', icon: <PhoneOutlined />, color: 'orange' }
  ];

  const statusOptions = [
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'processing', label: 'Processing', color: 'processing' },
    { value: 'failed', label: 'Failed', color: 'error' },
    { value: 'pending', label: 'Pending', color: 'default' }
  ];

  // Load analyses on component mount




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
      default: return 'blue';
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
            <div className="text-xs text-blue-600">{record.companyName}</div>
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
    <div className="max-w-7xl mx-auto px-4 py-6">
       <Spin spinning={loading} tip="Loading analysis data...">

               <Button 
  icon={<ArrowLeftOutlined />} 
  onClick={handleBack}
// negative margin top
>
  Back
</Button>
        
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="mb-1"> <span style={{ color: '#5CC49D' }}>a</span>rb
  <span style={{ color: '#5CC49D' }}>i</span>trageOS Sales Calls Analyzer</Title>
          <Text type="secondary">View and manage your AI-analyzed sales calls</Text>
        </div>
        <Space>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => go({ to: "/sales-call-analyzer/settings" })}
          >
            Settings
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
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
          className={`border border-gray-200 hover:border-blue-300 ${activeTab === 'all' ? 'border-blue-500' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <div className="flex items-center">
            <Avatar
              icon={<PhoneOutlined />}
              style={{ backgroundColor: 'var(--ant-color-blue-1)' }}
              className="mr-3"
            />
            <div>
              <Text strong className="block">All Calls</Text>
              <Text type="secondary">{analyses.length} total</Text>
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
              className={`border border-${type.color}-200 hover:border-${type.color}-300 ${activeTab === type.value ? `border-${type.color}-500` : ''}`}
                style={{ border: '1px solid #e5e7eb' }} 
              onClick={() => setActiveTab(type.value)}
            >
              <div className="flex items-center">
                <Avatar
                  icon={type.icon}
                  style={{ backgroundColor: `var(--ant-color-${type.color}-1)` }}
                  className="mr-3"
                />
                <div>
                  <Text strong className="block capitalize">{type.label} Calls</Text>
                  <Text type="secondary">
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
      <Card className="mb-8" title={
        <span>
          <DashboardOutlined className="mr-2" />
          Analysis Overview
        </span>
      }>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6} className="mb-4">
            <Card bordered={false}>
              <Statistic
                title="Total Calls"
                value={stats.totalCalls}
                prefix={<PhoneOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} className="mb-4">
            <Card bordered={false}>
              <Statistic
                title="Completed Analysis"
                value={stats.completedCalls}
                suffix={`/ ${stats.totalCalls}`}
                prefix={<CheckCircleOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} className="mb-4">
            <Card bordered={false}>
              <Statistic
                title="Average Score"
                value={stats.avgScore}
                suffix="/ 100"
                prefix={<LikeOutlined className="text-orange-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} className="mb-4">
            <Card bordered={false}>
              <Statistic
                title="Avg. Duration"
                value={Math.floor(stats.avgDuration / 60)}
                suffix={`min ${stats.avgDuration % 60}s`}
                prefix={<ClockCircleOutlined className="text-purple-500" />}
              />
            </Card>
          </Col>
        </Row>
        
        <Row gutter={16} className="mt-4">
          <Col xs={24} md={12} className="mb-4">
            <Card title="Sentiment Analysis" bordered={false}>
              <div className="flex justify-between mb-2">
                <span>Positive</span>
                <span>{stats.sentimentCounts.positive} calls</span>
              </div>
              <Progress 
                percent={stats.totalCalls > 0 ? Math.round((stats.sentimentCounts.positive / stats.totalCalls) * 100) : 0} 
                strokeColor="#52c41a"
                className="mb-3"
              />
              
              <div className="flex justify-between mb-2">
                <span>Negative</span>
                <span>{stats.sentimentCounts.negative} calls</span>
              </div>
              <Progress 
                percent={stats.totalCalls > 0 ? Math.round((stats.sentimentCounts.negative / stats.totalCalls) * 100) : 0} 
                strokeColor="#f5222d"
                className="mb-3"
              />
              
              <div className="flex justify-between mb-2">
                <span>Mixed</span>
                <span>{stats.sentimentCounts.mixed} calls</span>
              </div>
              <Progress 
                percent={stats.totalCalls > 0 ? Math.round((stats.sentimentCounts.mixed / stats.totalCalls) * 100) : 0} 
                strokeColor="#fa8c16"
                className="mb-3"
              />
              
              <div className="flex justify-between mb-2">
                <span>Neutral</span>
                <span>{stats.sentimentCounts.neutral} calls</span>
              </div>
              <Progress 
                percent={stats.totalCalls > 0 ? Math.round((stats.sentimentCounts.neutral / stats.totalCalls) * 100) : 0} 
                strokeColor="#1890ff"
              />
            </Card>
          </Col>
          
          <Col xs={24} md={12} className="mb-4">
            <Card title="Recent Calls" bordered={false}>
              <List
                itemLayout="horizontal"
                dataSource={analyses.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<PhoneOutlined />} />}
                      title={<a onClick={() => handleViewAnalysis(item.id)}>{item.title}</a>}
                      description={
                        <div>
                          <div>{item.participants.join(', ')}</div>
                          <div className="flex justify-between mt-1">
                            <Tag color={getSentimentColor(item.sentiment)}>{item.sentiment || 'neutral'}</Tag>
                            <span>{item.date}</span>
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
      </Spin>


      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
          <div className="flex flex-col md:flex-row gap-4 flex-grow">
            <div>
              <Text strong className="block mb-1">Type</Text>
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
              <Text strong className="block mb-1">Status</Text>
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
              enterButton
              onChange={e => setSearchText(e.target.value)}
              className="min-w-[250px]"
            />
          </div>
        </div>
      </div>

      {/* Calls Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="key"
          loading={loading}
          locale={{
            emptyText: (
              <div className="py-12 text-center">
                <FileSearchOutlined className="text-3xl mb-2 text-gray-400" />
                <Text type="secondary">No sales calls found</Text>
                <div className="mt-2">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
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
              <Text type="secondary">
                Viewing {range[0]}-{range[1]} of {total} results
              </Text>
            )
          }}
        />
      </Card>
    </div>
  );
}