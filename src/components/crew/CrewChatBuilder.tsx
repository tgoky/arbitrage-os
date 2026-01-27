// app/components/CrewChatBuilder.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { Input, Button, Space, Card, message, Spin, Typography, Tag, Avatar } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ThunderboltOutlined } from '@ant-design/icons';

import { ConfigProvider } from "antd";

const { TextArea } = Input;
const { Text } = Typography;

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
      content: "👋 Hi! I'm your AI crew builder. Tell me what you want to accomplish, and I'll design a team of AI agents to help you.\n\nFor example:\n• \"I need to research companies and write personalized cold emails\"\n• \"Help me create SEO-optimized blog posts from trending topics\"\n• \"Monitor competitors and send me weekly summaries\"\n\nWhat would you like to build?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCrew, setCurrentCrew] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          content: `✨ I've designed a crew called **"${crew.name}"** for you!\n\n${crew.description}\n\n**Team:**`,
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
        content: `❌ Sorry, I had trouble generating the crew: ${error.message}\n\nPlease try rephrasing your request or be more specific.`,
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
        <Space>
          <ThunderboltOutlined style={{ fontSize: '20px', color: '#5CC49D' }} />
          <Text strong>Build with AI</Text>
          {isGenerating && <Tag color="processing">Generating...</Tag>}
        </Space>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              marginBottom: '16px',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {message.role === 'assistant' && (
              <Avatar
                icon={<RobotOutlined />}
                style={{ backgroundColor: '#5CC49D', marginRight: '8px' }}
              />
            )}

            <div style={{ maxWidth: '70%' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: message.role === 'user' ? '#5CC49D' : '#e6f7ff',
                  color: '#000'
                }}
              >
                {message.isThinking ? (
                  <Space>

                    <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
     <Spin size="small" />
</ConfigProvider>

               
                    <Text>{message.content}</Text>
                  </Space>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </div>
                )}

                {/* Crew Preview */}
                {message.crew && (
                  <Card size="small" style={{ marginTop: '12px' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {message.crew.agents.map((agent: any) => (
                        <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '20px' }}>{agent.avatar}</div>
                          <div>
                            <Text strong style={{ fontSize: '12px' }}>{agent.name}</Text>
                            <div style={{ fontSize: '11px', color: '#666' }}>{agent.role}</div>
                          </div>
                          <Tag style={{ marginLeft: 'auto' }}>{agent.tools.length} tools</Tag>
                        </div>
                      ))}

                      <Button
                        type="primary"
                        block
                        onClick={handleUseCrew}
                        style={{ marginTop: '8px', backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
                      >
                        Use This Crew
                      </Button>
                    </Space>
                  </Card>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {message.role === 'user' && (
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff', marginLeft: '8px' }}
              />
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
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
            placeholder="Describe what you want to build..."
            disabled={isGenerating}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            loading={isGenerating}
            disabled={!input.trim()}
            style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D', height: 'auto' }}
          >
            Send
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
};