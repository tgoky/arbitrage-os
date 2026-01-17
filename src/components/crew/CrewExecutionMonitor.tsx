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
  Divider
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
  CodeOutlined
} from '@ant-design/icons';
import ReactJson from 'react-json-view';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

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

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    loadExecution();

    if (autoRefresh) {
      // Connect to SSE for real-time updates
      connectToEventStream();
    }

    return () => {
      // Cleanup SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [executionId]);

  useEffect(() => {
    // Auto-scroll to bottom when new steps are added
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
        // Add new step
        setSteps(prev => [...prev, data.step]);
      } else if (data.type === 'update') {
        // Update execution status
        setExecution(data.execution);
        calculateProgress(data.execution);
        calculateStats(data.execution);
      } else if (data.type === 'complete') {
        // Execution completed
        setExecution(data.execution);
        calculateProgress(data.execution);
        calculateStats(data.execution);
        
        if (onComplete) {
          onComplete(data.execution.result);
        }

        // Close connection
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
      totalDuration: Math.round(totalDuration / 1000), // Convert to seconds
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
        // Navigate to new execution
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

    const blob = new Blob([JSON.stringify(logs, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crew-execution-${executionId}.json`;
    a.click();
  };

  // ==================== RENDER HELPERS ====================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStepIcon = (step: ExecutionStep) => {
    switch (step.type) {
      case 'task':
        return <RobotOutlined style={{ color: '#5CC49D' }} />;
      case 'tool':
        return <ToolOutlined style={{ color: '#722ed1' }} />;
      case 'agent_response':
        return <ThunderboltOutlined style={{ color: '#1890ff' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined />;
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
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text type="secondary">Loading execution...</Text>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <Empty
        description="Execution not found"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={3} style={{ marginBottom: '8px' }}>
              {execution.crewName}
            </Title>
            <Space>
              <Tag color={getStatusColor(execution.status)} icon={getStatusIcon(execution.status)}>
                {execution.status.toUpperCase()}
              </Tag>
              <Text type="secondary">
                Started {new Date(execution.startTime).toLocaleString()}
              </Text>
            </Space>
          </div>

          <Space>
            {execution.status === 'failed' && (
              <Button icon={<ReloadOutlined />} onClick={handleRetry}>
                Retry
              </Button>
            )}
            <Button icon={<DownloadOutlined />} onClick={handleExportLogs}>
              Export Logs
            </Button>
          </Space>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Progress"
              value={progress}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: progress === 100 ? '#52c41a' : '#1890ff' }}
            />
            <Progress percent={progress} showInfo={false} strokeColor="#5CC49D" />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tasks Completed"
              value={stats.completedTasks}
              suffix={`/ ${stats.totalTasks}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Duration"
              value={formatDuration(stats.totalDuration * 1000)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tool Calls"
              value={stats.toolCalls}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Error Alert */}
      {execution.status === 'failed' && execution.error && (
        <Alert
          message="Execution Failed"
          description={execution.error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Main Content */}
      <Row gutter={16}>
        {/* Left: Timeline */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                Execution Timeline
                {execution.status === 'running' && (
                  <Badge status="processing" text="Live" />
                )}
              </Space>
            }
            extra={
              <Text type="secondary">
                {steps.length} events
              </Text>
            }
          >
            <div
              ref={scrollRef}
              style={{
                maxHeight: '600px',
                overflowY: 'auto',
                paddingRight: '8px'
              }}
            >
              {steps.length === 0 ? (
                <Empty
                  description="Waiting for execution to start..."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Timeline>
                  {steps.map((step, index) => (
                    <Timeline.Item
                      key={step.id}
                      dot={getStepIcon(step)}
                      color={
                        step.status === 'completed' ? 'green' :
                        step.status === 'failed' ? 'red' :
                        step.status === 'running' ? 'blue' : 'gray'
                      }
                    >
                      <div style={{ marginBottom: '16px' }}>
                        {/* Step Header */}
                        <div style={{ marginBottom: '8px' }}>
                          <Space>
                            {step.agentName && (
                              <Tag color="blue">{step.agentName}</Tag>
                            )}
                            {step.taskName && (
                              <Tag>{step.taskName}</Tag>
                            )}
                            {step.toolName && (
                              <Tag color="purple">
                                <ToolOutlined /> {step.toolName}
                              </Tag>
                            )}
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {new Date(step.timestamp).toLocaleTimeString()}
                            </Text>
                            {step.duration && (
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {formatDuration(step.duration)}
                              </Text>
                            )}
                          </Space>
                        </div>

                        {/* Step Content */}
                        <Card
                          size="small"
                          style={{
                            backgroundColor: step.type === 'error' ? '#fff1f0' : '#fafafa'
                          }}
                        >
                          <Paragraph
                            style={{
                              marginBottom: 0,
                              whiteSpace: 'pre-wrap',
                              fontSize: '13px'
                            }}
                            ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                          >
                            {step.content}
                          </Paragraph>

                          {/* Metadata Accordion */}
                          {step.metadata && Object.keys(step.metadata).length > 0 && (
                            <Collapse
                              ghost
                              size="small"
                              style={{ marginTop: '8px' }}
                            >
                              <Panel
                                header={
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <CodeOutlined /> View Metadata
                                  </Text>
                                }
                                key="metadata"
                              >
                                <ReactJson
                                  src={step.metadata}
                                  name={false}
                                  collapsed={1}
                                  displayDataTypes={false}
                                  enableClipboard={true}
                                  theme="rjv-default"
                                  style={{ fontSize: '12px' }}
                                />
                              </Panel>
                            </Collapse>
                          )}
                        </Card>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </div>
          </Card>
        </Col>

        {/* Right: Details */}
        <Col xs={24} lg={10}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Execution Details */}
            <Card title="Execution Details">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Execution ID">
                  <Text code copyable>
                    {executionId}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Crew Name">
                  {execution.crewName}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(execution.status)}>
                    {execution.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Start Time">
                  {new Date(execution.startTime).toLocaleString()}
                </Descriptions.Item>
                {execution.endTime && (
                  <Descriptions.Item label="End Time">
                    {new Date(execution.endTime).toLocaleString()}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Duration">
                  {formatDuration(stats.totalDuration * 1000)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Agents */}
            <Card
              title={
                <Space>
                  <RobotOutlined />
                  Agents ({execution.agents?.length || 0})
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {execution.agents?.map((agent: any) => (
                  <Card key={agent.id} size="small">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '24px' }}>
                        {agent.avatar || '🤖'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text strong>{agent.name}</Text>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {agent.role}
                        </div>
                      </div>
                      <Tag>{agent.tools?.length || 0} tools</Tag>
                    </div>
                  </Card>
                ))}
              </Space>
            </Card>

            {/* Tasks Status */}
            <Card
              title={
                <Space>
                  <CheckCircleOutlined />
                  Tasks Status
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {execution.tasks?.map((task: any, idx: number) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '12px',
                      backgroundColor: '#fafafa',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${
                        task.status === 'completed' ? '#52c41a' :
                        task.status === 'failed' ? '#ff4d4f' :
                        task.status === 'running' ? '#1890ff' : '#d9d9d9'
                      }`
                    }}
                  >
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <Text strong style={{ fontSize: '13px' }}>
                          Task {idx + 1}
                        </Text>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          {task.description?.substring(0, 60)}...
                        </div>
                      </div>
                      {getStatusIcon(task.status)}
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>

            {/* Final Result */}
            {execution.status === 'completed' && execution.result && (
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    Final Result
                  </Space>
                }
              >
                <ReactJson
                  src={execution.result}
                  name={false}
                  collapsed={2}
                  displayDataTypes={false}
                  enableClipboard={true}
                  theme="rjv-default"
                />
              </Card>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};