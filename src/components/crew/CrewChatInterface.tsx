// app/components/CrewChatInterface.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Avatar,
  Tag,
  Spin,
  Typography,
  Divider,
  Alert,
  message
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system' | 'tool';
  content: string;
  agentName?: string;
  timestamp: Date;
  metadata?: any;
}

interface CrewChatInterfaceProps {
  executionId?: string;
  workspaceId: string;
  crewId?: string;
  agents: any[];
  onExecutionStart?: (executionId: string) => void;
  onExecutionComplete?: (result: any) => void;
}

export const CrewChatInterface: React.FC<CrewChatInterfaceProps> = ({
  executionId: initialExecutionId,
  workspaceId,
  crewId,
  agents,
  onExecutionStart,
  onExecutionComplete
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executionId, setExecutionId] = useState(initialExecutionId);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingAgent, setStreamingAgent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ==================== AUTO-SCROLL ====================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // ==================== CLEANUP ====================

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // ==================== MESSAGE SENDING ====================

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsExecuting(true);

    try {
      // If no execution yet, start one
      if (!executionId) {
        await startExecution(input);
      } else {
        // Send message to ongoing execution
        await continueExecution(input);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      message.error('Failed to send message');
      setIsExecuting(false);
    }
  };

  // ==================== EXECUTION CONTROL ====================

  const startExecution = async (initialPrompt: string) => {
    try {
      const res = await fetch('/api/agent-crews/execute-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          crewId,
          initialPrompt,
          agents
        })
      });

      const data = await res.json();

      if (data.success) {
        setExecutionId(data.executionId);
        
        if (onExecutionStart) {
          onExecutionStart(data.executionId);
        }

        // Connect to streaming
        connectToStream(data.executionId);
      }
    } catch (error) {
      console.error('Failed to start execution:', error);
      throw error;
    }
  };

  const continueExecution = async (userInput: string) => {
    try {
      await fetch(`/api/agent-crews/executions/${executionId}/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userInput
        })
      });

      // Stream will receive updates automatically
    } catch (error) {
      console.error('Failed to continue execution:', error);
      throw error;
    }
  };

  const pauseExecution = async () => {
    try {
      await fetch(`/api/agent-crews/executions/${executionId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });

      setIsPaused(true);
      message.info('Execution paused');
    } catch (error) {
      console.error('Failed to pause execution:', error);
      message.error('Failed to pause');
    }
  };

  const resumeExecution = async () => {
    try {
      await fetch(`/api/agent-crews/executions/${executionId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });

      setIsPaused(false);
      message.info('Execution resumed');
    } catch (error) {
      console.error('Failed to resume execution:', error);
      message.error('Failed to resume');
    }
  };

  const stopExecution = async () => {
    try {
      await fetch(`/api/agent-crews/executions/${executionId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });

      setIsExecuting(false);
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const systemMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'system',
        content: 'Execution stopped by user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, systemMessage]);
      message.warning('Execution stopped');
    } catch (error) {
      console.error('Failed to stop execution:', error);
      message.error('Failed to stop');
    }
  };

  // ==================== STREAMING ====================

  const connectToStream = (execId: string) => {
    const eventSource = new EventSource(
      `/api/agent-crews/executions/${execId}/chat-stream?workspaceId=${workspaceId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'agent_thinking':
          setStreamingAgent(data.agentName);
          setStreamingMessage('');
          break;

        case 'agent_chunk':
          setStreamingMessage(prev => prev + data.chunk);
          setStreamingAgent(data.agentName);
          break;

        case 'agent_response':
          // Finalize streaming message
          const agentMessage: ChatMessage = {
            id: data.messageId,
            role: 'agent',
            content: data.content,
            agentName: data.agentName,
            timestamp: new Date(),
            metadata: data.metadata
          };

          setMessages(prev => [...prev, agentMessage]);
          setStreamingMessage('');
          setStreamingAgent('');
          break;

        case 'tool_call':
          const toolMessage: ChatMessage = {
            id: `tool_${Date.now()}`,
            role: 'tool',
            content: `🔧 ${data.agentName} used ${data.toolName}`,
            agentName: data.agentName,
            timestamp: new Date(),
            metadata: data.toolResult
          };

          setMessages(prev => [...prev, toolMessage]);
          break;

        case 'system':
          const systemMessage: ChatMessage = {
            id: `sys_${Date.now()}`,
            role: 'system',
            content: data.message,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, systemMessage]);
          break;

        case 'complete':
          setIsExecuting(false);
          
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }

          const completeMessage: ChatMessage = {
            id: `sys_${Date.now()}`,
            role: 'system',
            content: '✅ Crew execution completed!',
            timestamp: new Date()
          };

          setMessages(prev => [...prev, completeMessage]);

          if (onExecutionComplete) {
            onExecutionComplete(data.result);
          }
          break;

        case 'error':
          setIsExecuting(false);
          
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }

          const errorMessage: ChatMessage = {
            id: `err_${Date.now()}`,
            role: 'system',
            content: `❌ Error: ${data.error}`,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, errorMessage]);
          message.error('Execution failed');
          break;
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      setIsExecuting(false);
    };

    eventSourceRef.current = eventSource;
  };

  // ==================== RENDER HELPERS ====================

  const getAgentColor = (agentName?: string): string => {
    if (!agentName) return '#1890ff';

    const agent = agents.find(a => a.name === agentName);
    return agent?.color || '#5CC49D';
  };

  const getAgentAvatar = (agentName?: string): string => {
    if (!agentName) return '🤖';

    const agent = agents.find(a => a.name === agentName);
    return agent?.avatar || '🤖';
  };

  // ==================== RENDER ====================

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa'
        }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Space>
              <ThunderboltOutlined style={{ fontSize: '20px', color: '#5CC49D' }} />
              <Text strong>Crew Chat</Text>
              {isExecuting && !isPaused && (
                <Tag color="processing">Executing</Tag>
              )}
              {isPaused && (
                <Tag color="warning">Paused</Tag>
              )}
            </Space>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {agents.length} agents ready
            </div>
          </div>

          {/* Control Buttons */}
          {isExecuting && (
            <Space>
              {!isPaused ? (
                <Button
                  size="small"
                  icon={<PauseCircleOutlined />}
                  onClick={pauseExecution}
                >
                  Pause
                </Button>
              ) : (
                <Button
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={resumeExecution}
                  type="primary"
                >
                  Resume
                </Button>
              )}
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={stopExecution}
              >
                Stop
              </Button>
            </Space>
          )}
        </Space>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#fff'
        }}
      >
        {messages.length === 0 && !streamingMessage && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              💬
            </div>
            <Text type="secondary">
              Start a conversation with your crew
            </Text>
            <div style={{ marginTop: '16px' }}>
              <Space direction="vertical">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Available agents:
                </Text>
                <Space wrap>
                  {agents.map(agent => (
                    <Tag key={agent.id}>
                      {agent.avatar} {agent.name}
                    </Tag>
                  ))}
                </Space>
              </Space>
            </div>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              marginBottom: '16px',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {message.role !== 'user' && message.role !== 'system' && (
              <Avatar
                style={{
                  backgroundColor: getAgentColor(message.agentName),
                  marginRight: '8px',
                  flexShrink: 0
                }}
              >
                {getAgentAvatar(message.agentName)}
              </Avatar>
            )}

            <div style={{ maxWidth: '70%' }}>
              {message.agentName && (
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  {message.agentName}
                </div>
              )}

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor:
                    message.role === 'user' ? '#5CC49D' :
                    message.role === 'system' ? '#f0f0f0' :
                    message.role === 'tool' ? '#f9f0ff' :
                    '#e6f7ff',
                  color: message.role === 'user' ? '#000' : '#000'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </div>

                {message.metadata && (
                  <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
                    <details>
                      <summary style={{ cursor: 'pointer' }}>Details</summary>
                      <pre style={{ marginTop: '4px', fontSize: '10px' }}>
                        {JSON.stringify(message.metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {message.role === 'user' && (
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff', marginLeft: '8px', flexShrink: 0 }}
              />
            )}
          </div>
        ))}

        {/* Streaming Message */}
        {streamingMessage && (
          <div style={{ display: 'flex', marginBottom: '16px' }}>
            <Avatar
              style={{
                backgroundColor: getAgentColor(streamingAgent),
                marginRight: '8px'
              }}
            >
              {getAgentAvatar(streamingAgent)}
            </Avatar>

            <div style={{ maxWidth: '70%' }}>
              {streamingAgent && (
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  {streamingAgent} <Spin size="small" style={{ marginLeft: '8px' }} />
                </div>
              )}

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#e6f7ff'
                }}
              >
                {streamingMessage}
                <span className="cursor-blink" style={{ marginLeft: '2px' }}>▋</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fafafa'
        }}
      >
        {isPaused && (
          <Alert
            message="Execution is paused. Resume to continue."
            type="warning"
            showIcon
            style={{ marginBottom: '12px' }}
          />
        )}

        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={input}
            onChange={e => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              isPaused 
                ? "Resume execution to continue..." 
                : "Type your message... (Shift+Enter for new line)"
            }
            disabled={isExecuting && !isPaused}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ resize: 'none' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            loading={isExecuting && !isPaused}
            disabled={isPaused || !input.trim()}
            style={{
              backgroundColor: '#5CC49D',
              borderColor: '#5CC49D',
              height: 'auto'
            }}
          >
            Send
          </Button>
        </Space.Compact>

        <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      <style jsx>{`
        .cursor-blink {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};