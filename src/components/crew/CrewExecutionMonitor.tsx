// app/components/CrewExecutionMonitor.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Timeline,
  Progress,
  Tag,
  Space,
  Button,
  Statistic,
  Row,
  Col,
  Alert,
  Descriptions,
  Typography,
  Empty,
  Badge,
  Spin,
  Tooltip,
  Collapse,
  Divider,
  ConfigProvider,
  theme as antTheme
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  RobotOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  CodeOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  RightOutlined
} from '@ant-design/icons';
import ReactJson from 'react-json-view';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_CARD = '#09090b'; // Zinc-950
const SURFACE_ELEVATED = '#18181b'; // Zinc-900
const BORDER_COLOR = '#27272a'; // Zinc-800
const TEXT_SECONDARY = '#a1a1aa'; // Zinc-400
const TEXT_PRIMARY = '#ffffff';

interface ExecutionStep {
  id: string;
  type: 'task' | 'tool' | 'agent_response' | 'error';
  timestamp: Date;
  agentName?: string;
  taskName?: string;
  toolName?: string;
  content: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  metadata?: any;
}

interface CrewExecutionMonitorProps {
  executionId: string;
  workspaceId: string;
  autoRefresh?: boolean;
  onComplete?: (result: any) => void;
}

export const CrewExecutionMonitor: React.FC<CrewExecutionMonitorProps> = ({
  executionId,
  workspaceId,
  autoRefresh = true,
  onComplete
}) => {
  const [execution, setExecution] = useState<any>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalDuration: 0,
    toolCalls: 0
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- FONT INJECTION ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    loadExecution();

    if (autoRefresh) {
      connectToEventStream();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [executionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  // ==================== DATA LOADING ====================

  const loadExecution = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/agent-crews/executions/${executionId}?workspaceId=${workspaceId}`
      );
      const data = await res.json();

      if (data.success) {
        setExecution(data.execution);
        setSteps(data.execution.steps || []);
        calculateStats(data.execution);
        calculateProgress(data.execution);

        if (data.execution.status === 'completed' && onComplete) {
          onComplete(data.execution.result);
        }
      }
    } catch (error) {
      console.error('Failed to load execution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectToEventStream = () => {
    const eventSource = new EventSource(
      `/api/agent-crews/executions/${executionId}/stream?workspaceId=${workspaceId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'step') {
        setSteps(prev => [...prev, data.step]);
      } else if (data.type === 'update') {
        setExecution(data.execution);
        calculateProgress(data.execution);
        calculateStats(data.execution);
      } else if (data.type === 'complete') {
        setExecution(data.execution);
        calculateProgress(data.execution);
        calculateStats(data.execution);
        if (onComplete) onComplete(data.execution.result);
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  };

  // ==================== CALCULATIONS ====================

  const calculateProgress = (exec: any) => {
    if (!exec || !exec.tasks) {
      setProgress(0);
      return;
    }
    const total = exec.tasks.length;
    const completed = exec.tasks.filter((t: any) => 
      t.status === 'completed' || t.status === 'failed'
    ).length;
    setProgress(Math.round((completed / total) * 100));
  };

  const calculateStats = (exec: any) => {
    if (!exec) return;
    const totalTasks = exec.tasks?.length || 0;
    const completedTasks = exec.tasks?.filter((t: any) => t.status === 'completed').length || 0;
    const failedTasks = exec.tasks?.filter((t: any) => t.status === 'failed').length || 0;
    
    const totalDuration = exec.endTime 
      ? new Date(exec.endTime).getTime() - new Date(exec.startTime).getTime()
      : Date.now() - new Date(exec.startTime).getTime();

    const toolCalls = steps.filter(s => s.type === 'tool').length;

    setStats({
      totalTasks,
      completedTasks,
      failedTasks,
      totalDuration: Math.round(totalDuration / 1000),
      toolCalls
    });
  };

  // ==================== ACTIONS ====================

  const handleRetry = async () => {
    try {
      const res = await fetch('/api/agent-crews/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          crewId: execution.crewId,
          retryFrom: executionId
        })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = `/dashboard/${workspaceId}/executions/${data.executionId}`;
      }
    } catch (error) {
      console.error('Failed to retry execution:', error);
    }
  };

  const handleExportLogs = () => {
    const logs = {
      executionId,
      crewName: execution.crewName,
      status: execution.status,
      startTime: execution.startTime,
      endTime: execution.endTime,
      steps,
      stats
    };
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crew-execution-${executionId}.json`;
    a.click();
  };

  // ==================== RENDER HELPERS ====================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return BRAND_GREEN;
      case 'failed': return '#ef4444';
      case 'running': return '#3b82f6';
      default: return TEXT_SECONDARY;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleFilled style={{ color: BRAND_GREEN }} />;
      case 'failed': return <CloseCircleFilled style={{ color: '#ef4444' }} />;
      case 'running': return <LoadingOutlined style={{ color: '#3b82f6' }} />;
      default: return <ClockCircleOutlined style={{ color: TEXT_SECONDARY }} />;
    }
  };

  const getStepIcon = (step: ExecutionStep) => {
    switch (step.type) {
      case 'task': return <RobotOutlined style={{ fontSize: '16px', color: '#fff' }} />;
      case 'tool': return <ToolOutlined style={{ fontSize: '16px', color: '#a855f7' }} />; // Purple
      case 'agent_response': return <ThunderboltOutlined style={{ fontSize: '16px', color: '#3b82f6' }} />; // Blue
      case 'error': return <CloseCircleOutlined style={{ fontSize: '16px', color: '#ef4444' }} />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getStepColor = (step: ExecutionStep) => {
    switch (step.type) {
        case 'task': return SURFACE_ELEVATED; // Default grey
        case 'tool': return 'rgba(168, 85, 247, 0.1)'; // Purple tint
        case 'agent_response': return 'rgba(59, 130, 246, 0.1)'; // Blue tint
        case 'error': return 'rgba(239, 68, 68, 0.1)'; // Red tint
        default: return SURFACE_ELEVATED;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm, token: { colorPrimary: BRAND_GREEN } }}>
        <div style={{ textAlign: 'center', padding: '100px 0', background: DARK_BG, minHeight: '100vh' }}>
          <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48, color: BRAND_GREEN }} spin />} />
          <div style={{ marginTop: '24px' }}>
            <Text style={{ color: TEXT_SECONDARY, fontFamily: 'Manrope' }}>Loading execution data...</Text>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  if (!execution) {
    return (
      <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm }}>
        <Empty description="Execution not found" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{marginTop: '100px'}} />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: {
          colorPrimary: BRAND_GREEN,
          fontFamily: 'Manrope, sans-serif',
          colorBgContainer: SURFACE_CARD,
          colorBgElevated: SURFACE_ELEVATED,
          colorBorder: BORDER_COLOR,
          colorText: TEXT_PRIMARY,
          colorTextSecondary: TEXT_SECONDARY,
          borderRadius: 8,
        },
        components: {
          Card: { headerBg: 'transparent', boxShadow: 'none' },
          Button: { fontWeight: 600, defaultBg: 'transparent', defaultBorderColor: BORDER_COLOR },
          Statistic: { titleFontSize: 12, contentFontSize: 24 },
          Collapse: { contentBg: 'transparent', headerBg: 'transparent' },
          Timeline: { tailColor: BORDER_COLOR }
        }
      }}
    >
      <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: DARK_BG, fontFamily: 'Manrope, sans-serif' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '32px', borderBottom: `1px solid ${BORDER_COLOR}`, paddingBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <Space align="center" style={{ marginBottom: '8px' }}>
                    <Title level={3} style={{ margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
                        {execution.crewName}
                    </Title>
                    <Tag 
                        icon={getStatusIcon(execution.status)} 
                        style={{ 
                            backgroundColor: 'rgba(255,255,255,0.05)', 
                            border: `1px solid ${BORDER_COLOR}`, 
                            color: getStatusColor(execution.status),
                            fontSize: '12px',
                            padding: '4px 10px',
                            margin: 0
                        }}
                    >
                        {execution.status.toUpperCase()}
                    </Tag>
                </Space>
                <Space split={<Divider type="vertical" style={{ borderColor: BORDER_COLOR }} />}>
                    <Text style={{ color: TEXT_SECONDARY, fontSize: '13px' }}>
                        <ClockCircleOutlined style={{ marginRight: '6px' }} />
                        Started {new Date(execution.startTime).toLocaleString()}
                    </Text>
                    <Text style={{ color: TEXT_SECONDARY, fontSize: '13px' }}>
                        ID: <Text copyable style={{ color: TEXT_SECONDARY }}>{executionId}</Text>
                    </Text>
                </Space>
              </div>

              <Space>
                {execution.status === 'failed' && (
                  <Button icon={<ReloadOutlined />} onClick={handleRetry} danger ghost>
                    Retry
                  </Button>
                )}
                <Button icon={<DownloadOutlined />} onClick={handleExportLogs}>
                  Export Logs
                </Button>
              </Space>
            </div>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ border: `1px solid ${BORDER_COLOR}`, height: '100%' }}>
                <Statistic
                  title={<span style={{ color: TEXT_SECONDARY }}>TOTAL PROGRESS</span>}
                  value={progress}
                  suffix="%"
                  valueStyle={{ color: progress === 100 ? BRAND_GREEN : '#fff', fontWeight: 600 }}
                  prefix={<ThunderboltOutlined style={{ color: progress === 100 ? BRAND_GREEN : TEXT_SECONDARY }} />}
                />
                <Progress 
                    percent={progress} 
                    showInfo={false} 
                    strokeColor={BRAND_GREEN} 
                    trailColor="#27272a" 
                    strokeWidth={4}
                    style={{ marginTop: '16px' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card style={{ border: `1px solid ${BORDER_COLOR}`, height: '100%' }}>
                <Statistic
                  title={<span style={{ color: TEXT_SECONDARY }}>TASKS</span>}
                  value={stats.completedTasks}
                  suffix={`/ ${stats.totalTasks}`}
                  prefix={<CheckCircleOutlined style={{ color: '#fff' }} />}
                  valueStyle={{ color: '#fff', fontWeight: 600 }}
                />
                <div style={{ marginTop: '16px', fontSize: '12px', color: stats.failedTasks > 0 ? '#ef4444' : TEXT_SECONDARY }}>
                    {stats.failedTasks > 0 ? `${stats.failedTasks} tasks failed` : 'No failures'}
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card style={{ border: `1px solid ${BORDER_COLOR}`, height: '100%' }}>
                <Statistic
                  title={<span style={{ color: TEXT_SECONDARY }}>DURATION</span>}
                  value={formatDuration(stats.totalDuration * 1000)}
                  prefix={<ClockCircleOutlined style={{ color: '#fff' }} />}
                  valueStyle={{ color: '#fff', fontWeight: 600 }}
                />
                <div style={{ marginTop: '16px', fontSize: '12px', color: TEXT_SECONDARY }}>
                    Running time
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card style={{ border: `1px solid ${BORDER_COLOR}`, height: '100%' }}>
                <Statistic
                  title={<span style={{ color: TEXT_SECONDARY }}>TOOL CALLS</span>}
                  value={stats.toolCalls}
                  prefix={<ToolOutlined style={{ color: '#a855f7' }} />}
                  valueStyle={{ color: '#fff', fontWeight: 600 }}
                />
                <div style={{ marginTop: '16px', fontSize: '12px', color: TEXT_SECONDARY }}>
                    Actions performed
                </div>
              </Card>
            </Col>
          </Row>

          {/* Error Alert */}
          {execution.status === 'failed' && execution.error && (
            <Alert
              message={<span style={{ fontWeight: 600 }}>Execution Failed</span>}
              description={execution.error}
              type="error"
              showIcon
              style={{ marginBottom: '32px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
            />
          )}

          <Row gutter={[24, 24]}>
            {/* Left: Timeline */}
            <Col xs={24} lg={16}>
              <Card
                title={
                  <Space>
                    <ClockCircleOutlined style={{ color: TEXT_SECONDARY }} />
                    <span style={{ color: '#fff', fontWeight: 600 }}>Live Feed</span>
                    {execution.status === 'running' && (
                      <Badge status="processing" color={BRAND_GREEN} />
                    )}
                  </Space>
                }
                style={{ border: `1px solid ${BORDER_COLOR}`, height: '800px', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, overflow: 'hidden', padding: '0 24px 24px' }}
              >
                <div
                  ref={scrollRef}
                  style={{
                    height: '100%',
                    overflowY: 'auto',
                    paddingRight: '12px',
                    paddingTop: '24px'
                  }}
                >
                  {steps.length === 0 ? (
                    <Empty
                      description={<span style={{ color: TEXT_SECONDARY }}>Waiting for events...</span>}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ marginTop: '100px' }}
                    />
                  ) : (
                    <Timeline>
                      {steps.map((step, index) => (
                        <Timeline.Item
                          key={step.id}
                          dot={
                            <div style={{ 
                                backgroundColor: SURFACE_ELEVATED, 
                                border: `1px solid ${BORDER_COLOR}`, 
                                borderRadius: '50%', 
                                width: '32px', 
                                height: '32px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                            }}>
                                {getStepIcon(step)}
                            </div>
                          }
                          color="gray" // Hide default line color to use custom dot
                        >
                          <div style={{ marginLeft: '12px', marginBottom: '24px' }}>
                            {/* Step Header */}
                            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              {step.agentName && (
                                <Tag style={{ border: 'none', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 600 }}>
                                    {step.agentName}
                                </Tag>
                              )}
                              {step.taskName && (
                                <Tag style={{ border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: TEXT_SECONDARY }}>
                                    {step.taskName}
                                </Tag>
                              )}
                              {step.toolName && (
                                <Tag style={{ border: 'none', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                                    <ToolOutlined /> {step.toolName}
                                </Tag>
                              )}
                              <span style={{ fontSize: '12px', color: TEXT_SECONDARY, marginLeft: 'auto' }}>
                                {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>

                            {/* Step Content Card */}
                            <div
                              style={{
                                backgroundColor: getStepColor(step),
                                borderRadius: '8px',
                                border: `1px solid ${step.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : BORDER_COLOR}`,
                                padding: '12px 16px',
                                fontSize: '13px',
                                color: '#e4e4e7',
                                lineHeight: '1.6'
                              }}
                            >
                              <Paragraph
                                style={{ marginBottom: 0, color: 'inherit', fontFamily: step.type === 'tool' ? 'monospace' : 'inherit' }}
                                ellipsis={{ rows: 6, expandable: true, symbol: <span style={{ color: BRAND_GREEN }}>Show more</span> }}
                              >
                                {step.content}
                              </Paragraph>

                              {/* Metadata Accordion */}
                              {step.metadata && Object.keys(step.metadata).length > 0 && (
                                <Collapse
                                  ghost
                                  size="small"
                                  style={{ marginTop: '8px' }}
                                  expandIcon={({ isActive }) => <RightOutlined rotate={isActive ? 90 : 0} style={{ fontSize: '10px', color: TEXT_SECONDARY }} />}
                                >
                                  <Panel
                                    header={
                                      <Text style={{ fontSize: '11px', color: TEXT_SECONDARY }}>
                                        <CodeOutlined /> View Data
                                      </Text>
                                    }
                                    key="metadata"
                                  >
                                    <div style={{ backgroundColor: DARK_BG, padding: '12px', borderRadius: '6px', border: `1px solid ${BORDER_COLOR}` }}>
                                        <ReactJson
                                        src={step.metadata}
                                        name={false}
                                        collapsed={1}
                                        displayDataTypes={false}
                                        enableClipboard={true}
                                        theme="ocean"
                                        style={{ backgroundColor: 'transparent', fontSize: '11px' }}
                                        />
                                    </div>
                                  </Panel>
                                </Collapse>
                              )}
                            </div>
                            
                            {step.duration && (
                                <div style={{ marginTop: '4px', fontSize: '11px', color: '#52525b' }}>
                                    Duration: {formatDuration(step.duration)}
                                </div>
                            )}
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  )}
                </div>
              </Card>
            </Col>

            {/* Right: Details & Status */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" style={{ width: '100%' }} size={24}>
                
                {/* Agents List */}
                <Card
                  title={<span style={{ color: '#fff', fontSize: '14px' }}>Active Agents ({execution.agents?.length || 0})</span>}
                  style={{ border: `1px solid ${BORDER_COLOR}` }}
                  bodyStyle={{ padding: '0' }}
                >
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {execution.agents?.map((agent: any, idx: number) => (
                      <div key={agent.id} style={{ 
                          padding: '12px 16px', 
                          display: 'flex', alignItems: 'center', gap: '12px',
                          borderBottom: idx !== execution.agents.length - 1 ? `1px solid ${BORDER_COLOR}` : 'none'
                      }}>
                        <div style={{ fontSize: '20px' }}>{agent.avatar || '🤖'}</div>
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ color: '#fff', fontSize: '13px' }}>{agent.name}</Text>
                          <div style={{ fontSize: '11px', color: TEXT_SECONDARY }}>{agent.role}</div>
                        </div>
                        <Tag style={{ margin: 0, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER_COLOR}`, color: TEXT_SECONDARY }}>
                            {agent.tools?.length || 0} tools
                        </Tag>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Tasks Status */}
                <Card
                  title={<span style={{ color: '#fff', fontSize: '14px' }}>Task Checklist</span>}
                  style={{ border: `1px solid ${BORDER_COLOR}` }}
                  bodyStyle={{ padding: '0' }}
                >
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {execution.tasks?.map((task: any, idx: number) => (
                      <div
                        key={task.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: idx !== execution.tasks.length - 1 ? `1px solid ${BORDER_COLOR}` : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          backgroundColor: task.status === 'running' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        <div style={{ paddingRight: '12px' }}>
                          <Text style={{ fontSize: '12px', color: TEXT_SECONDARY, display: 'block', marginBottom: '2px' }}>Task {idx + 1}</Text>
                          <Text style={{ fontSize: '13px', color: '#fff', lineHeight: '1.4' }}>
                            {task.description?.length > 60 ? task.description.substring(0, 60) + '...' : task.description}
                          </Text>
                        </div>
                        <div style={{ marginTop: '4px' }}>
                            {getStatusIcon(task.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Final Result */}
                {execution.status === 'completed' && execution.result && (
                  <Card
                    title={
                      <Space>
                        <CheckCircleFilled style={{ color: BRAND_GREEN }} />
                        <span style={{ color: '#fff' }}>Final Output</span>
                      </Space>
                    }
                    style={{ border: `1px solid ${BORDER_COLOR}` }}
                  >
                    <div style={{ backgroundColor: DARK_BG, padding: '16px', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, maxHeight: '400px', overflowY: 'auto' }}>
                        <ReactJson
                        src={execution.result}
                        name={false}
                        collapsed={2}
                        displayDataTypes={false}
                        enableClipboard={true}
                        theme="ocean"
                        style={{ backgroundColor: 'transparent', fontSize: '12px' }}
                        />
                    </div>
                  </Card>
                )}
              </Space>
            </Col>
          </Row>
        </div>
      </div>
    </ConfigProvider>
  );
};