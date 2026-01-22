// app/dashboard/[workspace]/crews/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Tabs, Layout, Button, Space, message, Drawer, Badge } from 'antd';
import {
  AppstoreOutlined,
  BuildOutlined,
  HistoryOutlined,
  MessageOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { CrewTemplateGallery } from '../../components/crew/CrewTemplateGallery';
import { UnifiedCrewBuilder } from '../../components/crew/UnifiedCrewBuilder';
import { CrewExecutionMonitor } from '../../components/crew/CrewExecutionMonitor';
import { CrewChatInterface } from '../../components/crew/CrewChatInterface';
import { useWorkspaceContext } from '@/app/hooks/useWorkspaceContext';

const { Content } = Layout;

/**
 * ARCHITECTURE EXPLANATION:
 * 
 * This page follows CrewAI's core architecture:
 * 
 * 1. TEMPLATE GALLERY - Pre-built crew templates (like CrewAI's marketplace)
 *    - Users can browse, preview, and select templates
 *    - Templates contain: agents[], tasks[], process type, tools
 * 
 * 2. UNIFIED CREW BUILDER - Visual + AI-powered builder
 *    - LEFT PANEL: AI chat interface for building crews via natural language
 *    - CENTER: Visual canvas showing agents and tasks as nodes (ReactFlow)
 *    - RIGHT: Tools panel for assigning tools to agents
 *    - Supports streaming crew generation
 * 
 * 3. CREW CHAT INTERFACE - Execute and interact with built crews
 *    - Real-time execution with SSE streaming
 *    - Human-in-the-loop support (pause/resume)
 *    - Shows agent thoughts and tool calls
 * 
 * 4. EXECUTION MONITOR - Track running/completed executions
 *    - Timeline of steps
 *    - Task progress tracking
 *    - Final results and logs
 * 
 * The flow: Gallery → Builder → Chat/Execute → Monitor
 */

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
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  // ==================== HANDLERS ====================

  /**
   * When user selects "Use Template" from gallery
   * Converts template to full crew config and opens builder
   */
  const handleUseTemplate = (template: any) => {
    // Convert template to full crew config following CrewAI structure
    const crewConfig = {
      id: `crew_${Date.now()}`,
      name: template.name,
      description: template.description,
      version: 1,
      
      // CrewAI Process type: 'sequential' | 'hierarchical'
      process: template.process || 'sequential',
      
      // Agents with CrewAI structure
      agents: template.agents.map((a: any) => ({
        id: a.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: a.name,
        role: a.role,
        goal: a.goal,
        backstory: a.backstory || '',
        avatar: a.avatar || '🤖',
        color: a.color || '#5CC49D',
        tools: a.tools || [],
        // LLM configuration
        llm: a.llm || { 
          model: 'openai/gpt-4o-mini', 
          temperature: 0.7 
        },
        // Agent behavior config
        config: a.config || { 
          allowDelegation: false, 
          maxIter: 25, 
          verbose: true 
        }
      })),
      
      // Tasks with CrewAI structure (context = dependencies)
      tasks: template.tasks.map((t: any, idx: number) => ({
        id: t.id || `task_${Date.now()}_${idx}`,
        description: t.description,
        expectedOutput: t.expectedOutput || t.expected_output,
        assignedAgentId: t.assignedAgentId || t.agent_id,
        // Context is array of task IDs this task depends on
        context: t.dependencies || t.context || [],
        tools: t.tools || [],
        config: t.config || { 
          async: false, 
          humanInput: false 
        }
      })),
      
      // Triggers (manual, schedule, webhook, etc.)
      triggers: [{ 
        id: 'trigger_manual', 
        type: 'manual', 
        config: {}, 
        enabled: true 
      }],
      
      // Variables that can be passed at runtime
      variables: template.variables || {},
      
      // Global crew config
      config: { 
        verbose: true, 
        memory: false,
        // For hierarchical process, manager LLM config
        managerLlm: template.managerLlm || null
      }
    };

    setSelectedCrew(crewConfig);
    setActiveTab('builder');
  };

  /**
   * Start fresh with no template
   */
  const handleNewCrew = () => {
    setSelectedCrew(null);
    setActiveTab('builder');
  };

  /**
   * Save crew to database
   */
  const handleSaveCrew = async (crew: any) => {
    try {
      const res = await fetch('/api/agent-crews/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          crew
        })
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

  /**
   * Execute crew - starts the agents working
   */
  const handleRunCrew = async (crew: any) => {
    try {
      // Save first if not saved
      if (!crew.savedId) {
        await handleSaveCrew(crew);
      }

      const res = await fetch('/api/agent-crews/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          crew
        })
      });

      const data = await res.json();

      if (data.success) {
        setExecutionId(data.executionId);
        setActiveExecutions(prev => [...prev, data.executionId]);
        setShowChatDrawer(true); // Open chat interface
        message.success('Execution started!');
      }
    } catch (error) {
      console.error('Failed to run crew:', error);
      message.error('Failed to start execution');
    }
  };

  /**
   * Export crew as Python CrewAI project
   */
  const handleExportCrew = async (crew: any) => {
    try {
      const res = await fetch('/api/agent-crews/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          crew, 
          format: 'zip',
          // Export as proper CrewAI Python project
          includeCrewaiProject: true
        })
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

  /**
   * When execution completes
   */
  const handleExecutionComplete = (result: any) => {
    setActiveExecutions(prev => prev.filter(id => id !== executionId));
    message.success('Crew execution completed!');
  };

  // ==================== TAB CONFIG ====================

  const tabItems = [
    {
      key: 'gallery',
      label: (
        <span>
          <AppstoreOutlined />
          Template Gallery
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
        <span>
          <BuildOutlined />
          Crew Builder
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 64px)' }}>
          {/* 
            UnifiedCrewBuilder contains:
            - LEFT: AI chat for building via prompts
            - CENTER: Visual canvas (ReactFlow) for agents/tasks
            - RIGHT: Tools panel
          */}
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
        <Badge count={activeExecutions.length} size="small" offset={[8, 0]}>
          <span>
            <HistoryOutlined />
            Executions
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
          padding: '100px 20px',
          color: '#999'
        }}>
          <ThunderboltOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>No active execution selected</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Run a crew from the Builder to see execution details
          </div>
          
          {/* Show recent executions if any */}
          {activeExecutions.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ marginBottom: '8px' }}>Active executions:</div>
              <Space direction="vertical">
                {activeExecutions.map(execId => (
                  <Button 
                    key={execId}
                    type="link"
                    onClick={() => setExecutionId(execId)}
                  >
                    {execId}
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
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Content style={{ padding: 0 }}>
        {/* Header */}
        <div style={{ 
          padding: '12px 24px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems.map(item => ({ 
              key: item.key, 
              label: item.label 
            }))}
            style={{ marginBottom: 0 }}
          />
          
          <Space>
            {/* Quick action to open chat with running execution */}
            {executionId && (
              <Button
                icon={<MessageOutlined />}
                onClick={() => setShowChatDrawer(true)}
              >
                Chat with Crew
              </Button>
            )}
            
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNewCrew}
              style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
            >
              New Crew
            </Button>
          </Space>
        </div>

        {/* Tab Content */}
        <div>
          {tabItems.find(t => t.key === activeTab)?.children}
        </div>
      </Content>

      {/* Chat Drawer - For interacting with running crew */}
      <Drawer
        title={
          <Space>
            <RocketOutlined style={{ color: '#5CC49D' }} />
            Crew Execution Chat
          </Space>
        }
        placement="right"
        width={500}
        open={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
        bodyStyle={{ padding: 0 }}
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
  );
}