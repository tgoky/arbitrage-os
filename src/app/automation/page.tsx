
"use client";

import { useState, useEffect } from 'react';
import { Tabs, Layout, Button, Space, message, Drawer, Badge, ConfigProvider, theme as antTheme, Typography } from 'antd';
import {
  AppstoreOutlined,
  BuildOutlined,
  HistoryOutlined,
  MessageOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import { CrewTemplateGallery } from '../../components/crew/CrewTemplateGallery';
import { UnifiedCrewBuilder } from '../../components/crew/UnifiedCrewBuilder';
import { CrewExecutionMonitor } from '../../components/crew/CrewExecutionMonitor';
import { CrewChatInterface } from '../../components/crew/CrewChatInterface';
import { useWorkspaceContext } from '@/app/hooks/useWorkspaceContext';

const { Content } = Layout;
const { Text, Title } = Typography;

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_CARD = '#09090b';
const BORDER_COLOR = '#27272a';
const TEXT_SECONDARY = '#a1a1aa';
const TEXT_PRIMARY = '#ffffff';

export default function CrewsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('gallery');
  
  // Crew state
  const [selectedCrew, setSelectedCrew] = useState<any>(null);
  const [savedCrews, setSavedCrews] = useState<any[]>([]);
  
  // Execution state
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [activeExecutions, setActiveExecutions] = useState<string[]>([]);
  
  // UI state
  const [showChatDrawer, setShowChatDrawer] = useState(false);

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

  // Load saved crews on mount
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadSavedCrews();
      loadActiveExecutions();
    }
  }, [currentWorkspace?.id]);

  const loadSavedCrews = async () => {
    try {
      const res = await fetch(`/api/agent-crews/save?workspaceId=${currentWorkspace?.id}`);
      const data = await res.json();
      if (data.success) {
        setSavedCrews(data.crews || []);
      }
    } catch (error) {
      console.error('Failed to load crews:', error);
    }
  };

  const loadActiveExecutions = async () => {
    try {
      const res = await fetch(`/api/agent-crews/executions?workspaceId=${currentWorkspace?.id}&status=running`);
      const data = await res.json();
      if (data.success) {
        setActiveExecutions(data.executions?.map((e: any) => e.id) || []);
      }
    } catch (error) {
      console.error('Failed to load executions:', error);
    }
  };

  if (!currentWorkspace) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: DARK_BG, color: TEXT_SECONDARY }}>
        Loading...
      </div>
    );
  }

  // ==================== HANDLERS ====================

  const handleUseTemplate = (template: any) => {
    const crewConfig = {
      id: `crew_${Date.now()}`,
      name: template.name,
      description: template.description,
      version: 1,
      process: template.process || 'sequential',
      agents: template.agents.map((a: any) => ({
        id: a.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: a.name,
        role: a.role,
        goal: a.goal,
        backstory: a.backstory || '',
        avatar: a.avatar || '🤖',
        color: a.color || '#5CC49D',
        tools: a.tools || [],
        llm: a.llm || { model: 'openai/gpt-4o-mini', temperature: 0.7 },
        config: a.config || { allowDelegation: false, maxIter: 25, verbose: true }
      })),
      tasks: template.tasks.map((t: any, idx: number) => ({
        id: t.id || `task_${Date.now()}_${idx}`,
        description: t.description,
        expectedOutput: t.expectedOutput || t.expected_output,
        assignedAgentId: t.assignedAgentId || t.agent_id,
        context: t.dependencies || t.context || [],
        tools: t.tools || [],
        config: t.config || { async: false, humanInput: false }
      })),
      triggers: [{ id: 'trigger_manual', type: 'manual', config: {}, enabled: true }],
      variables: template.variables || {},
      config: { verbose: true, memory: false, managerLlm: template.managerLlm || null }
    };

    setSelectedCrew(crewConfig);
    setActiveTab('builder');
  };

  const handleNewCrew = () => {
    setSelectedCrew(null);
    setActiveTab('builder');
  };

  const handleSaveCrew = async (crew: any) => {
    try {
      const res = await fetch('/api/agent-crews/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: currentWorkspace.id, crew })
      });
      const data = await res.json();
      if (data.success) {
        await loadSavedCrews();
        message.success('Crew saved!');
        return data.crewId;
      }
    } catch (error) {
      console.error('Failed to save crew:', error);
      message.error('Failed to save crew');
    }
  };

  const handleRunCrew = async (crew: any) => {
    try {
      if (!crew.savedId) await handleSaveCrew(crew);
      const res = await fetch('/api/agent-crews/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: currentWorkspace.id, crew })
      });
      const data = await res.json();
      if (data.success) {
        setExecutionId(data.executionId);
        setActiveExecutions(prev => [...prev, data.executionId]);
        setShowChatDrawer(true);
        message.success('Execution started!');
      }
    } catch (error) {
      console.error('Failed to run crew:', error);
      message.error('Failed to start execution');
    }
  };

  const handleExportCrew = async (crew: any) => {
    try {
      const res = await fetch('/api/agent-crews/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crew, format: 'zip', includeCrewaiProject: true })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${crew.name.replace(/\s+/g, '_').toLowerCase()}_crew.zip`;
        a.click();
        URL.revokeObjectURL(url);
        message.success('Project exported!');
      }
    } catch (error) {
      console.error('Failed to export:', error);
      message.error('Failed to export project');
    }
  };

  const handleExecutionComplete = (result: any) => {
    setActiveExecutions(prev => prev.filter(id => id !== executionId));
    message.success('Crew execution completed!');
  };

  // ==================== TAB CONFIG ====================

  const tabItems = [
    {
      key: 'gallery',
      label: (
        <span style={{ fontSize: '13px', fontWeight: 600 }}>
          <AppstoreOutlined />
          Templates
        </span>
      ),
      children: (
        <CrewTemplateGallery
          workspaceId={currentWorkspace.id}
          onSelectTemplate={setSelectedCrew}
          onUseTemplate={handleUseTemplate}
        />
      )
    },
    {
      key: 'builder',
      label: (
        <span style={{ fontSize: '13px', fontWeight: 600 }}>
          <BuildOutlined />
          Builder
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 64px)' }}>
          <UnifiedCrewBuilder
            workspaceId={currentWorkspace.id}
            initialCrew={selectedCrew}
            onSave={handleSaveCrew}
            onExport={handleExportCrew}
            onRun={handleRunCrew}
          />
        </div>
      )
    },
    {
      key: 'monitor',
      label: (
        <Badge count={activeExecutions.length} size="small" offset={[8, 0]} color={BRAND_GREEN}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            <HistoryOutlined />
            Monitor
          </span>
        </Badge>
      ),
      children: executionId ? (
        <CrewExecutionMonitor
          executionId={executionId}
          workspaceId={currentWorkspace.id}
          autoRefresh
          onComplete={handleExecutionComplete}
        />
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '120px 20px',
          color: TEXT_SECONDARY,
          height: '100%'
        }}>
          <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER_COLOR}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
              <ThunderboltOutlined style={{ fontSize: '32px', color: TEXT_SECONDARY }} />
          </div>
          <Title level={3} style={{ color: '#fff', marginBottom: '8px' }}>No Active Execution</Title>
          <div style={{ fontSize: '14px', marginTop: '8px', marginBottom: '32px' }}>
            Run a crew from the Builder to see live execution details here.
          </div>
          
          {activeExecutions.length > 0 && (
            <div style={{ marginTop: '24px', maxWidth: '400px', margin: '0 auto' }}>
              <div style={{ marginBottom: '12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Executions</div>
              <Space direction="vertical" style={{ width: '100%' }}>
                {activeExecutions.map(execId => (
                  <Button 
                    key={execId}
                    type="default"
                    block
                    icon={<ClockCircleOutlined />}
                    onClick={() => setExecutionId(execId)}
                    style={{ textAlign: 'left', borderColor: BORDER_COLOR, height: 'auto', padding: '12px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{execId}</span>
                        <RightOutlined style={{ fontSize: '10px', color: TEXT_SECONDARY }} />
                    </div>
                  </Button>
                ))}
              </Space>
            </div>
          )}
        </div>
      )
    }
  ];

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
          Tabs: {
            itemColor: TEXT_SECONDARY,
            itemSelectedColor: '#fff',
            itemHoverColor: '#fff',
            inkBarColor: BRAND_GREEN,
            titleFontSize: 13,
          },
          Button: { fontWeight: 600, defaultBg: 'transparent', defaultBorderColor: BORDER_COLOR },
          Drawer: { colorBgElevated: SURFACE_CARD }
        }
      }}
    >
      <Layout style={{ minHeight: '100vh', background: DARK_BG, fontFamily: 'Manrope, sans-serif' }}>
        <Content style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {/* Header */}
          <div style={{ 
            padding: '0 24px', 
            borderBottom: `1px solid ${BORDER_COLOR}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            backgroundColor: DARK_BG
          }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems.map(item => ({ key: item.key, label: item.label }))}
              style={{ marginBottom: -16 }}
              tabBarStyle={{ borderBottom: 'none' }}
            />
            
            <Space>
              {executionId && (
                <Button
                  icon={<MessageOutlined />}
                  onClick={() => setShowChatDrawer(true)}
                  style={{ color: TEXT_SECONDARY }}
                >
                  Chat
                </Button>
              )}
              
              <Button 
                type="primary"
                icon={<PlusOutlined style={{ color: '#000' }} />}
                onClick={handleNewCrew}
                style={{ backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000', fontWeight: 600 }}
              >
                New Automation
              </Button>
            </Space>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {tabItems.find(t => t.key === activeTab)?.children}
          </div>
        </Content>

        {/* Chat Drawer */}
        <Drawer
          title={
            <Space>
              <RocketOutlined style={{ color: BRAND_GREEN }} />
              <span style={{ fontFamily: 'Manrope' }}>Live Crew Chat</span>
            </Space>
          }
          placement="right"
          width={500}
          open={showChatDrawer}
          onClose={() => setShowChatDrawer(false)}
          bodyStyle={{ padding: 0 }}
          headerStyle={{ borderBottom: `1px solid ${BORDER_COLOR}`, backgroundColor: SURFACE_CARD }}
          closeIcon={<RightOutlined style={{ color: TEXT_SECONDARY }} />}
        >
          {executionId && selectedCrew && (
            <CrewChatInterface
              executionId={executionId}
              workspaceId={currentWorkspace.id}
              crewId={selectedCrew.id}
              agents={selectedCrew.agents || []}
              onExecutionComplete={handleExecutionComplete}
            />
          )}
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
}