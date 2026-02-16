// app/components/CrewChatInterface.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Input,
  Button,
  Space,
  Avatar,
  Tag,
  Spin,
  Typography,
  Alert,
  message,
  ConfigProvider,
  theme as antTheme,
  Divider
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  ToolOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_CARD = '#09090b';
const SURFACE_ELEVATED = '#18181b';
const BORDER_COLOR = '#27272a';
const TEXT_SECONDARY = '#a1a1aa';
const TEXT_PRIMARY = '#ffffff';

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
      if (!executionId) {
        await startExecution(input);
      } else {
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
        if (onExecutionStart) onExecutionStart(data.executionId);
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
        body: JSON.stringify({ workspaceId, userInput })
      });
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
      if (eventSourceRef.current) eventSourceRef.current.close();
      
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
    const eventSource = new EventSource(`/api/agent-crews/executions/${execId}/chat-stream?workspaceId=${workspaceId}`);

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
            content: `Used tool: ${data.toolName}`,
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
          if (eventSourceRef.current) eventSourceRef.current.close();
          const completeMessage: ChatMessage = {
            id: `sys_${Date.now()}`,
            role: 'system',
            content: '  Execution completed successfully.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, completeMessage]);
          if (onExecutionComplete) onExecutionComplete(data.result);
          break;
        case 'error':
          setIsExecuting(false);
          if (eventSourceRef.current) eventSourceRef.current.close();
          const errorMessage: ChatMessage = {
            id: `err_${Date.now()}`,
            role: 'system',
            content: `Error: ${data.error}`,
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
    return agent?.color || BRAND_GREEN;
  };

  const getAgentAvatar = (agentName?: string): string => {
    if (!agentName) return '🤖';
    const agent = agents.find(a => a.name === agentName);
    return agent?.avatar || '🤖';
  };

  // ==================== RENDER ====================

  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: {
          colorPrimary: BRAND_GREEN,
          fontFamily: 'Manrope, sans-serif',
          colorBgContainer: SURFACE_CARD,
          colorBorder: BORDER_COLOR,
          colorText: TEXT_PRIMARY,
          colorTextSecondary: TEXT_SECONDARY,
          borderRadius: 8,
        },
        components: {
          Button: { fontWeight: 600, defaultBg: 'transparent', defaultBorderColor: BORDER_COLOR },
          Input: { colorBgContainer: '#000000', activeBorderColor: BRAND_GREEN, hoverBorderColor: BRAND_GREEN },
          Alert: { colorInfoBg: 'rgba(92, 196, 157, 0.1)', colorInfoBorder: 'rgba(92, 196, 157, 0.2)' }
        }
      }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: DARK_BG, fontFamily: 'Manrope, sans-serif' }}>
        
        {/* Header */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: `1px solid ${BORDER_COLOR}`, 
          backgroundColor: SURFACE_CARD,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  background: 'rgba(92, 196, 157, 0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${BRAND_GREEN}40`
              }}>
                  <ThunderboltOutlined style={{ fontSize: '16px', color: BRAND_GREEN }} />
              </div>
              <Text strong style={{ fontSize: '16px', color: '#fff' }}>Crew Chat</Text>
              
              {isExecuting && !isPaused && (
                <Tag color="success" style={{ margin: 0, border: 'none', fontWeight: 600 }}>LIVE</Tag>
              )}
              {isPaused && (
                <Tag color="warning" style={{ margin: 0, border: 'none', fontWeight: 600 }}>PAUSED</Tag>
              )}
            </div>
            <div style={{ fontSize: '11px', color: TEXT_SECONDARY, marginTop: '4px', marginLeft: '44px' }}>
              {agents.length} agents active
            </div>
          </div>

          {/* Control Buttons */}
          {isExecuting && (
            <Space>
              {!isPaused ? (
                <Button size="small" icon={<PauseCircleOutlined />} onClick={pauseExecution}>Pause</Button>
              ) : (
                <Button size="small" icon={<PlayCircleOutlined />} onClick={resumeExecution} type="primary" style={{ backgroundColor: BRAND_GREEN, color: '#000' }}>Resume</Button>
              )}
              <Button size="small" danger icon={<StopOutlined />} onClick={stopExecution} ghost>Stop</Button>
            </Space>
          )}
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', scrollbarWidth: 'thin' }}>
          {messages.length === 0 && !streamingMessage && (
            <div style={{ textAlign: 'center', padding: '80px 20px', opacity: 0.7 }}>
              <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  backgroundColor: 'rgba(255,255,255,0.03)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  margin: '0 auto 24px', border: `1px solid ${BORDER_COLOR}`
              }}>
                  <RobotOutlined style={{ fontSize: '32px', color: TEXT_SECONDARY }} />
              </div>
              <Text type="secondary" style={{ fontSize: '16px' }}>Start a conversation to activate the crew.</Text>
              
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {agents.map(agent => (
                  <Tag key={agent.id} style={{ 
                      padding: '6px 12px', fontSize: '12px', 
                      backgroundColor: SURFACE_ELEVATED, 
                      border: `1px solid ${BORDER_COLOR}`,
                      color: TEXT_SECONDARY
                  }}>
                    {agent.avatar} {agent.name}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isSystem = message.role === 'system';
            const isTool = message.role === 'tool';

            if (isSystem) {
                return (
                    <div key={message.id} style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                        <div style={{ 
                            backgroundColor: 'rgba(255,255,255,0.05)', 
                            padding: '4px 12px', borderRadius: '100px', 
                            fontSize: '11px', color: TEXT_SECONDARY,
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <InfoCircleOutlined /> {message.content}
                        </div>
                    </div>
                );
            }

            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  marginBottom: '24px',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  gap: '12px',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                {!isUser && (
                  <Avatar
                    style={{
                      backgroundColor: isTool ? '#71717a' : getAgentColor(message.agentName),
                      color: isTool ? '#fff' : '#000',
                      border: `1px solid ${isTool ? '#52525b' : getAgentColor(message.agentName)}`,
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {isTool ? <ToolOutlined /> : getAgentAvatar(message.agentName)}
                  </Avatar>
                )}

                <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  {!isUser && (
                    <div style={{ fontSize: '11px', color: TEXT_SECONDARY, marginBottom: '4px', marginLeft: '4px' }}>
                      {message.agentName} {isTool && <span style={{ opacity: 0.7 }}>• Tool Output</span>}
                    </div>
                  )}

                  <div
                    style={{
                      padding: isTool ? '12px' : '16px',
                      borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      backgroundColor: isUser 
                        ? BRAND_GREEN 
                        : isTool ? 'rgba(39, 39, 42, 0.5)' : SURFACE_ELEVATED,
                      color: isUser ? '#000' : isTool ? TEXT_SECONDARY : '#e4e4e7',
                      border: isUser ? 'none' : isTool ? `1px dashed ${BORDER_COLOR}` : `1px solid ${BORDER_COLOR}`,
                      fontSize: isTool ? '12px' : '14px',
                      fontFamily: isTool ? 'monospace' : 'inherit',
                      lineHeight: '1.6',
                      boxShadow: isUser ? `0 4px 12px ${BRAND_GREEN}30` : 'none'
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>

                    {message.metadata && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px dashed ${isUser ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
                        <details>
                          <summary style={{ cursor: 'pointer', fontSize: '10px', opacity: 0.7 }}>View Data</summary>
                          <pre style={{ marginTop: '8px', fontSize: '10px', padding: '8px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflowX: 'auto' }}>
                            {JSON.stringify(message.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '4px', fontSize: '10px', color: '#52525b', marginLeft: isUser ? 0 : '4px', marginRight: isUser ? '4px' : 0 }}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isUser && (
                  <Avatar icon={<UserOutlined style={{ color: '#fff' }} />} style={{ backgroundColor: '#27272a', border: `1px solid ${BORDER_COLOR}`, flexShrink: 0 }} />
                )}
              </div>
            );
          })}

          {/* Streaming Indicator */}
          {streamingMessage && (
            <div style={{ display: 'flex', marginBottom: '16px', gap: '12px', animation: 'fadeIn 0.3s ease-out' }}>
              <Avatar
                style={{
                  backgroundColor: getAgentColor(streamingAgent),
                  color: '#000',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {getAgentAvatar(streamingAgent)}
              </Avatar>

              <div style={{ maxWidth: '80%' }}>
                <div style={{ fontSize: '11px', color: BRAND_GREEN, marginBottom: '4px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {streamingAgent} <LoadingOutlined />
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: '4px 16px 16px 16px',
                    backgroundColor: SURFACE_ELEVATED,
                    border: `1px solid ${BORDER_COLOR}`,
                    color: '#e4e4e7',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}
                >
                  {streamingMessage}
                  <span className="cursor-blink" style={{ marginLeft: '2px', color: BRAND_GREEN }}>▋</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '24px', borderTop: `1px solid ${BORDER_COLOR}`, backgroundColor: SURFACE_CARD }}>
          {isPaused && (
            <Alert
              message="Execution paused. Resume to continue."
              type="warning"
              showIcon
              style={{ marginBottom: '16px', backgroundColor: 'rgba(250, 173, 20, 0.1)', border: '1px solid rgba(250, 173, 20, 0.2)', color: '#faad14' }}
            />
          )}

          <div style={{ 
              position: 'relative', 
              backgroundColor: DARK_BG, 
              borderRadius: '12px', 
              border: `1px solid ${BORDER_COLOR}`,
              padding: '4px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <TextArea
                value={input}
                onChange={e => setInput(e.target.value)}
                onPressEnter={(e) => {
                if (!e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
                }}
                placeholder={isPaused ? "Resume to continue..." : "Message the crew..."}
                disabled={isExecuting && !isPaused}
                autoSize={{ minRows: 1, maxRows: 4 }}
                bordered={false}
                style={{ 
                    resize: 'none', 
                    padding: '12px 16px', 
                    fontSize: '14px', 
                    backgroundColor: 'transparent',
                    color: '#fff'
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 8px 8px 0' }}>
                <Button
                    type="primary"
                    shape="circle"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={isExecuting && !isPaused}
                    disabled={isPaused || !input.trim()}
                    style={{ 
                        backgroundColor: input.trim() ? BRAND_GREEN : '#27272a', 
                        borderColor: input.trim() ? BRAND_GREEN : '#27272a',
                        color: input.trim() ? '#000' : '#71717a',
                        transform: input.trim() ? 'scale(1)' : 'scale(0.95)',
                        transition: 'all 0.2s'
                    }}
                />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
             <Text style={{ fontSize: '10px', color: '#52525b' }}>AI agents can make mistakes. Review generated content.</Text>
          </div>
        </div>

        <style jsx>{`
          .cursor-blink { animation: blink 1s infinite; }
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </ConfigProvider>
  );
};