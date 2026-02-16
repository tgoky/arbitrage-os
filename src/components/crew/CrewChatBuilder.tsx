// app/components/CrewChatBuilder.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Space, 
  Card, 
  message, 
  Spin, 
  Typography, 
  Tag, 
  Avatar, 
  ConfigProvider, 
  theme as antTheme,
  Divider
} from 'antd';
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined, 
  ThunderboltOutlined,
  CheckCircleFilled,

} from '@ant-design/icons';

const { TextArea } = Input;
const { Text, Title } = Typography;

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_CARD = '#09090b'; // Zinc-950
const SURFACE_ELEVATED = '#18181b'; // Zinc-900
const BORDER_COLOR = '#27272a'; // Zinc-800
const TEXT_SECONDARY = '#a1a1aa'; // Zinc-400
const TEXT_PRIMARY = '#ffffff';

interface CrewChatBuilderProps {
  workspaceId: string;
  onCrewGenerated: (crew: any) => void;
}

export const CrewChatBuilder: React.FC<CrewChatBuilderProps> = ({
  workspaceId,
  onCrewGenerated
}) => {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi! I'm your AI crew architect. Tell me what you want to accomplish, and I'll design a team of AI agents to help you.\n\n**Try asking:**\n• \"I need to research companies and write personalized cold emails\"\n• \"Help me create SEO-optimized blog posts from trending topics\"\n• \"Monitor competitors and send me weekly summaries\"\n\nWhat would you like to build?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCrew, setCurrentCrew] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    // Add thinking indicator
    const thinkingMessage = {
      id: 'thinking',
      role: 'assistant',
      content: '🤔 Analyzing your request and designing the perfect crew...',
      isThinking: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // Generate or refine crew
      const res = await fetch('/api/agent-crews/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: input,
          workspaceId,
          conversationHistory: conversationHistory.slice(-4), // Last 2 turns
          refineCrew: !!currentCrew,
          currentCrew
        })
      });

      const data = await res.json();

      if (data.success) {
        const crew = data.crew;
        setCurrentCrew(crew);

        // Update conversation history
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: input },
          { role: 'assistant', content: JSON.stringify(crew) }
        ]);

        // Remove thinking message
        setMessages(prev => prev.filter(m => m.id !== 'thinking'));

        // Add crew preview message
        const crewMessage = {
          id: `crew_${Date.now()}`,
          role: 'assistant',
          content: `✨ I've designed a crew called **"${crew.name}"** for you!\n\n${crew.description}\n\n**Proposed Team:**`,
          crew,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, crewMessage]);

        message.success('Crew generated successfully!');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
      
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== 'thinking'));

      const errorMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `  Sorry, I had trouble generating the crew: ${error.message}\n\nPlease try rephrasing your request or be more specific.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      message.error('Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseCrew = () => {
    if (currentCrew) {
      onCrewGenerated(currentCrew);
      message.success('Crew loaded into builder!');
    }
  };

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
          borderRadius: 12,
        },
        components: {
          Input: {
            colorBgContainer: SURFACE_ELEVATED,
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
            paddingBlock: 10,
          },
          Button: {
            fontWeight: 600,
            defaultBorderColor: BORDER_COLOR,
            defaultBg: SURFACE_ELEVATED,
          },
          Card: {
            headerBg: 'transparent',
            colorBgContainer: SURFACE_ELEVATED,
          },
          Tag: {
            defaultBg: 'rgba(255,255,255,0.05)',
            // defaultBorderColor: BORDER_COLOR,
          }
        }
      }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: DARK_BG, fontFamily: 'Manrope, sans-serif' }}>
        
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: `1px solid ${BORDER_COLOR}`, 
          backgroundColor: DARK_BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Space>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '8px', 
              background: `linear-gradient(135deg, ${BRAND_GREEN}20, ${BRAND_GREEN}10)`, 
              border: `1px solid ${BRAND_GREEN}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <ThunderboltOutlined style={{ fontSize: '18px', color: BRAND_GREEN }} />
            </div>
            <div>
              <Text strong style={{ fontSize: '16px', color: '#fff', display: 'block', lineHeight: 1.2 }}>Build with AI</Text>
              <Text style={{ fontSize: '11px', color: TEXT_SECONDARY }}>Describe your workflow, get a crew.</Text>
            </div>
          </Space>
          
          {isGenerating && (
            <Tag color={BRAND_GREEN} style={{ color: '#000', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Spin size="small" indicator={<ThunderboltOutlined spin style={{ color: '#000' }} />} />
              Thinking...
            </Tag>
          )}
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLast = index === messages.length - 1;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  marginBottom: '24px',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  gap: '12px',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <Avatar
                    icon={<RobotOutlined style={{ color: BRAND_GREEN }} />}
                    style={{ 
                      backgroundColor: 'rgba(92, 196, 157, 0.1)', 
                      border: `1px solid ${BRAND_GREEN}30`,
                      flexShrink: 0
                    }}
                  />
                )}

                <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  {/* Name Label */}
                  <Text style={{ fontSize: '11px', color: TEXT_SECONDARY, marginBottom: '4px', marginLeft: isUser ? 0 : '4px', marginRight: isUser ? '4px' : 0 }}>
                    {isUser ? 'You' : 'Architect AI'}
                  </Text>

                  {/* Message Bubble */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      backgroundColor: isUser ? BRAND_GREEN : SURFACE_ELEVATED,
                      color: isUser ? '#000000' : '#e4e4e7',
                      border: isUser ? 'none' : `1px solid ${BORDER_COLOR}`,
                      fontSize: '14px',
                      lineHeight: '1.6',
                      boxShadow: isUser ? `0 4px 12px ${BRAND_GREEN}30` : 'none'
                    }}
                  >
                    {msg.isThinking ? (
                      <Space>
                        <Spin size="small" />
                        <Text style={{ color: TEXT_SECONDARY }}>{msg.content}</Text>
                      </Space>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {/* Simple parser for bolding text in the response since we don't have markdown render */}
                        {msg.content.split('\n').map((line: string, i: number) => {
                            if (line.includes('**')) {
                                return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} style={{ margin: 0 }} />;
                            }
                            return <p key={i} style={{ margin: 0, minHeight: line === '' ? '8px' : 'auto' }}>{line}</p>;
                        })}
                      </div>
                    )}

                    {/* Crew Preview Card */}
                    {msg.crew && (
                      <div style={{ marginTop: '16px', padding: '0', backgroundColor: DARK_BG, borderRadius: '12px', border: `1px solid ${BORDER_COLOR}`, overflow: 'hidden' }}>
                        {/* Card Header */}
                        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER_COLOR}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <Text strong style={{ color: '#fff', fontSize: '13px' }}>{msg.crew.name}</Text>
                            <Tag style={{ margin: 0, fontSize: '10px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)' }}>{msg.crew.process}</Tag>
                        </div>
                        
                        {/* Agents List */}
                        <div style={{ padding: '12px' }}>
                            <Space direction="vertical" style={{ width: '100%' }} size={8}>
                            {msg.crew.agents.map((agent: any) => (
                                <div key={agent.id} style={{ 
                                    display: 'flex', alignItems: 'center', gap: '12px', 
                                    padding: '10px', borderRadius: '8px', 
                                    backgroundColor: SURFACE_ELEVATED, border: `1px solid ${BORDER_COLOR}` 
                                }}>
                                <div style={{ fontSize: '20px', lineHeight: 1 }}>{agent.avatar || '🤖'}</div>
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{ fontSize: '13px', color: '#fff', display: 'block' }}>{agent.name}</Text>
                                    <Text style={{ fontSize: '11px', color: TEXT_SECONDARY }}>{agent.role}</Text>
                                </div>
                                <Tag style={{ margin: 0, fontSize: '10px', backgroundColor: DARK_BG }}>
                                    {agent.tools.length} tools
                                </Tag>
                                </div>
                            ))}
                            </Space>
                        </div>

                        {/* Action Footer */}
                        <div style={{ padding: '12px', borderTop: `1px solid ${BORDER_COLOR}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <Button
                                type="primary"
                                block
                                icon={<CheckCircleFilled />}
                                onClick={handleUseCrew}
                                style={{ backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000', fontWeight: 700 }}
                            >
                                Load into Builder
                            </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '4px', marginLeft: isUser ? 0 : '4px', marginRight: isUser ? '4px' : 0 }}>
                     <Text style={{ fontSize: '10px', color: '#52525b' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </Text>
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <Avatar
                    icon={<UserOutlined style={{ color: '#fff' }} />}
                    style={{ 
                      backgroundColor: '#27272a', 
                      flexShrink: 0,
                      border: `1px solid ${BORDER_COLOR}`
                    }}
                  />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ 
            padding: '24px', 
            borderTop: `1px solid ${BORDER_COLOR}`, 
            backgroundColor: DARK_BG
        }}>
          <div style={{ 
              position: 'relative', 
              backgroundColor: SURFACE_ELEVATED, 
              borderRadius: '16px', 
              border: `1px solid ${BORDER_COLOR}`,
              padding: '4px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
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
                placeholder="Describe your agent workflow..."
                disabled={isGenerating}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 8px 16px' }}>
                <Text style={{ fontSize: '10px', color: '#52525b' }}>Shift + Enter for new line</Text>
                <Button
                    type="primary"
                    shape="circle"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={isGenerating}
                    disabled={!input.trim()}
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
        </div>
      </div>
    </ConfigProvider>
  );
};