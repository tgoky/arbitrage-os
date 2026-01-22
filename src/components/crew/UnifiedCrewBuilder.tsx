// app/components/crew/UnifiedCrewBuilder.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  message, 
  Spin, 
  Typography, 
  Tag, 
  Divider,
  Tooltip,
  Dropdown,
  Modal,
  Form,
  Select,
  Switch
} from 'antd';
import { 
  SendOutlined, 
  ThunderboltOutlined, 
  CheckCircleOutlined, 
  LoadingOutlined,
  SettingOutlined,
  SaveOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  MoreOutlined,
  DeleteOutlined,
  CopyOutlined,
  EditOutlined,
  PlusOutlined
} from '@ant-design/icons';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  NodeTypes,
  Connection,
  addEdge,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ToolsPanel } from './ToolsPanel';

const { TextArea } = Input;
const { Text, Title } = Typography;

// ==================== TYPES ====================

interface ThoughtStep {
  id: string;
  message: string;
  status: 'running' | 'completed' | 'error';
  timestamp: Date;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory?: string;
  avatar?: string;
  color?: string;
  tools: string[];
  llm?: {
    model: string;
    temperature: number;
  };
  config?: {
    allowDelegation: boolean;
    maxIter: number;
    verbose: boolean;
  };
}

interface Task {
  id: string;
  description: string;
  expectedOutput: string;
  assignedAgentId: string;
  context: string[]; // Task IDs this depends on
  tools?: string[];
  config?: {
    async: boolean;
    humanInput: boolean;
  };
}

interface CrewConfig {
  id: string;
  name: string;
  description: string;
  version: number;
  process: 'sequential' | 'hierarchical';
  agents: Agent[];
  tasks: Task[];
  triggers: any[];
  variables: Record<string, any>;
  config: {
    verbose: boolean;
    memory: boolean;
    managerLlm?: any;
  };
}

interface UnifiedCrewBuilderProps {
  workspaceId: string;
  initialCrew?: CrewConfig | null;
  onSave?: (crew: CrewConfig) => Promise<void>;
  onExport?: (crew: CrewConfig) => Promise<void>;
  onRun?: (crew: CrewConfig) => Promise<void>;
}

// ==================== CUSTOM NODE COMPONENTS ====================

const AgentNode = ({ data, selected }: any) => {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: selected ? '2px solid #5CC49D' : '2px solid #e0e0e0',
        backgroundColor: '#fff',
        minWidth: '280px',
        maxWidth: '320px',
        boxShadow: selected ? '0 4px 12px rgba(92, 196, 157, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: data.color || '#5CC49D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            marginRight: '12px'
          }}
        >
          {data.avatar || '🤖'}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#000' }}>
            {data.name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {data.role}
          </div>
        </div>

        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: 'Edit Agent', icon: <EditOutlined /> },
              { key: 'duplicate', label: 'Duplicate', icon: <CopyOutlined /> },
              { type: 'divider' },
              { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true }
            ],
            onClick: ({ key }) => data.onAction?.(key, data.id)
          }}
          trigger={['click']}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      </div>

      {data.goal && (
        <div style={{ marginBottom: '12px' }}>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            <strong>Goal:</strong> {data.goal.substring(0, 80)}
            {data.goal.length > 80 && '...'}
          </Text>
        </div>
      )}

      <div>
        <Text style={{ fontSize: '11px', color: '#999' }}>TOOLS:</Text>
        <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {data.tools && data.tools.length > 0 ? (
            data.tools.slice(0, 3).map((tool: string, idx: number) => (
              <Tag key={idx} style={{ fontSize: '10px', margin: 0 }}>
                {tool}
              </Tag>
            ))
          ) : (
            <Text style={{ fontSize: '11px', color: '#999' }}>No tools</Text>
          )}
          {data.tools && data.tools.length > 3 && (
            <Tag style={{ fontSize: '10px', margin: 0 }}>
              +{data.tools.length - 3} more
            </Tag>
          )}
        </div>
      </div>

      {/* Connection handles */}
      <div
        className="react-flow__handle react-flow__handle-bottom"
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#5CC49D',
          border: '2px solid #fff'
        }}
      />
    </div>
  );
};

const TaskNode = ({ data, selected }: any) => {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: selected ? '2px solid #1890ff' : '2px solid #e0e0e0',
        backgroundColor: '#f8f9fa',
        minWidth: '280px',
        maxWidth: '320px',
        boxShadow: selected ? '0 4px 12px rgba(24, 144, 255, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s'
      }}
    >
      {/* Connection handle top */}
      <div
        className="react-flow__handle react-flow__handle-top"
        style={{
          position: 'absolute',
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#1890ff',
          border: '2px solid #fff'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <Text strong style={{ fontSize: '14px' }}>
            Task {data.index || ''}
          </Text>
          {data.config?.async && (
            <Tag color="blue" style={{ marginLeft: '8px', fontSize: '10px' }}>
              Async
            </Tag>
          )}
        </div>
        
        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: 'Edit Task', icon: <EditOutlined /> },
              { key: 'duplicate', label: 'Duplicate', icon: <CopyOutlined /> },
              { type: 'divider' },
              { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true }
            ],
            onClick: ({ key }) => data.onAction?.(key, data.id)
          }}
          trigger={['click']}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      </div>

      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
        {data.description?.substring(0, 100)}
        {data.description?.length > 100 && '...'}
      </div>

      {data.assignedAgentName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Text style={{ fontSize: '11px', color: '#999' }}>
            Assigned to:
          </Text>
          <Tag style={{ fontSize: '10px', margin: 0 }}>
            {data.assignedAgentName}
          </Tag>
        </div>
      )}

      {data.context && data.context.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <Text style={{ fontSize: '11px', color: '#999' }}>
            Depends on: {data.context.length} task(s)
          </Text>
        </div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  task: TaskNode
};

// ==================== MAIN COMPONENT ====================

export const UnifiedCrewBuilder: React.FC<UnifiedCrewBuilderProps> = ({ 
  workspaceId,
  initialCrew,
  onSave,
  onExport,
  onRun
}) => {
  // Canvas state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Chat/building state
  const [prompt, setPrompt] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [thoughtProcess, setThoughtProcess] = useState<ThoughtStep[]>([]);
  
  // Crew state
  const [currentCrew, setCurrentCrew] = useState<CrewConfig | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [crewName, setCrewName] = useState('Untitled Crew');
  const [processType, setProcessType] = useState<'sequential' | 'hierarchical'>('sequential');
  
  // Modal state
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const thoughtsEndRef = useRef<HTMLDivElement>(null);
  const [agentForm] = Form.useForm();
  const [taskForm] = Form.useForm();

  // ==================== LOAD INITIAL CREW ====================

  useEffect(() => {
    if (initialCrew) {
      loadCrewFromConfig(initialCrew);
    }
  }, [initialCrew]);

  const loadCrewFromConfig = (crew: CrewConfig) => {
    setCurrentCrew(crew);
    setCrewName(crew.name);
    setProcessType(crew.process);
    
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create agent nodes
    crew.agents?.forEach((agent, idx) => {
      newNodes.push({
        id: agent.id,
        type: 'agent',
        position: { x: 100 + (idx * 350), y: 100 },
        data: {
          ...agent,
          onAction: handleNodeAction
        }
      });
    });

    // Create task nodes
    crew.tasks?.forEach((task, idx) => {
      const assignedAgent = crew.agents?.find(a => a.id === task.assignedAgentId);
      
      newNodes.push({
        id: task.id,
        type: 'task',
        position: { x: 100 + (idx * 350), y: 350 },
        data: {
          ...task,
          index: idx + 1,
          assignedAgentName: assignedAgent?.name,
          onAction: handleNodeAction
        }
      });

      // Connect task to assigned agent
      if (task.assignedAgentId) {
        newEdges.push({
          id: `${task.id}-to-${task.assignedAgentId}`,
          source: task.assignedAgentId,
          target: task.id,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#5CC49D', strokeWidth: 2 }
        });
      }

      // Connect task dependencies (context)
      task.context?.forEach(depTaskId => {
        newEdges.push({
          id: `${depTaskId}-to-${task.id}`,
          source: depTaskId,
          target: task.id,
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#1890ff', strokeWidth: 2, strokeDasharray: '5,5' }
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);

    // Collect all tools from agents
    const toolIds: string[] = crew.agents?.flatMap(a => a.tools || []) || [];
    setSelectedTools([...new Set(toolIds)]);

    addThought(`Loaded crew: ${crew.name}`, 'completed');
  };

  // ==================== NODE ACTIONS ====================

  const handleNodeAction = useCallback((action: string, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    switch (action) {
      case 'edit':
        if (node.type === 'agent') {
          setEditingAgent(node.data);
          agentForm.setFieldsValue(node.data);
        } else if (node.type === 'task') {
          setEditingTask(node.data);
          taskForm.setFieldsValue(node.data);
        }
        break;
        
      case 'duplicate':
        const newId = `${node.type}_${Date.now()}`;
        const newNode = {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50
          },
          data: {
            ...node.data,
            id: newId,
            name: node.data.name + ' (copy)'
          }
        };
        setNodes(prev => [...prev, newNode]);
        break;
        
      case 'delete':
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
        break;
    }
  }, [nodes, agentForm, taskForm]);

  // ==================== EDGE CONNECTION ====================

  const onConnect = useCallback((params: Connection) => {
    setEdges(prev => addEdge({
      ...params,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#5CC49D', strokeWidth: 2 }
    }, prev));
  }, [setEdges]);

  // ==================== AUTO-SCROLL THOUGHTS ====================

  useEffect(() => {
    thoughtsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thoughtProcess]);

  // ==================== STREAMING CREW BUILDING ====================

  const buildCrewFromPrompt = async () => {
    if (!prompt.trim()) return;

    setIsBuilding(true);
    setThoughtProcess([]);

    // Don't clear existing nodes if we're refining
    if (!currentCrew) {
      setNodes([]);
      setEdges([]);
      setSelectedTools([]);
    }

    try {
      const response = await fetch('/api/agent-crews/build-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          workspaceId,
          existingCrew: currentCrew // Pass existing crew for refinement
        })
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              handleStreamEvent(data);
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Build failed:', error);
      addThought(`❌ Error: ${error.message}`, 'error');
      setIsBuilding(false);
      message.error('Failed to build crew');
    }
  };

  const handleStreamEvent = (data: any) => {
    switch (data.type) {
      case 'thought':
        addThought(data.message, 'running');
        break;

      case 'thought_complete':
        updateLastThought('completed');
        break;

      case 'crew_name':
        setCrewName(data.name);
        break;

      case 'process_type':
        setProcessType(data.process);
        break;

      case 'tools_selected':
        setSelectedTools(data.tools);
        addThought(`Selected ${data.tools.length} tools`, 'completed');
        break;

      case 'agent_created':
        addAgentToCanvas(data.agent);
        addThought(`Creating ${data.agent.name} (${data.agent.role})`, 'completed');
        break;

      case 'task_created':
        addTaskToCanvas(data.task);
        addThought(`Creating task: ${data.task.description?.substring(0, 50)}...`, 'completed');
        break;

      case 'crew_complete':
        setCurrentCrew(data.crew);
        addThought('✅ Crew creation complete!', 'completed');
        setIsBuilding(false);
        setPrompt(''); // Clear prompt
        message.success('Crew built successfully!');
        break;

      case 'error':
        addThought(`❌ Error: ${data.message}`, 'error');
        setIsBuilding(false);
        message.error('Failed to build crew');
        break;
    }
  };

  // ==================== THOUGHT MANAGEMENT ====================

  const addThought = (messageText: string, status: ThoughtStep['status']) => {
    setThoughtProcess(prev => [
      ...prev,
      {
        id: `thought_${Date.now()}`,
        message: messageText,
        status,
        timestamp: new Date()
      }
    ]);
  };

  const updateLastThought = (status: ThoughtStep['status']) => {
    setThoughtProcess(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1].status = status;
      return updated;
    });
  };

  // ==================== CANVAS MANAGEMENT ====================

  const addAgentToCanvas = (agent: Agent) => {
    const agentCount = nodes.filter(n => n.type === 'agent').length;
    
    const newNode: Node = {
      id: agent.id,
      type: 'agent',
      position: { x: 100 + (agentCount * 350), y: 100 },
      data: {
        ...agent,
        onAction: handleNodeAction
      }
    };

    setNodes(prev => [...prev, newNode]);
  };

  const addTaskToCanvas = (task: Task) => {
    const taskCount = nodes.filter(n => n.type === 'task').length;
    const assignedAgent = nodes.find(n => n.id === task.assignedAgentId);
    
    const newNode: Node = {
      id: task.id,
      type: 'task',
      position: { x: 100 + (taskCount * 350), y: 350 },
      data: {
        ...task,
        index: taskCount + 1,
        assignedAgentName: assignedAgent?.data?.name,
        onAction: handleNodeAction
      }
    };

    setNodes(prev => [...prev, newNode]);

    // Add edge to assigned agent
    if (task.assignedAgentId) {
      const newEdge: Edge = {
        id: `${task.assignedAgentId}-to-${task.id}`,
        source: task.assignedAgentId,
        target: task.id,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#5CC49D', strokeWidth: 2 }
      };
      setEdges(prev => [...prev, newEdge]);
    }
  };

  // ==================== BUILD CREW CONFIG ====================

  const buildCrewConfig = (): CrewConfig => {
    const agents: Agent[] = nodes
      .filter(n => n.type === 'agent')
      .map(n => ({
        id: n.id,
        name: n.data.name,
        role: n.data.role,
        goal: n.data.goal,
        backstory: n.data.backstory || '',
        avatar: n.data.avatar || '🤖',
        color: n.data.color || '#5CC49D',
        tools: n.data.tools || [],
        llm: n.data.llm || { model: 'openai/gpt-4o-mini', temperature: 0.7 },
        config: n.data.config || { allowDelegation: false, maxIter: 25, verbose: true }
      }));

    const tasks: Task[] = nodes
      .filter(n => n.type === 'task')
      .map((n, idx) => {
        // Find dependencies from edges
        const incomingEdges = edges.filter(e => e.target === n.id && e.source !== n.data.assignedAgentId);
        const context = incomingEdges.map(e => e.source);
        
        return {
          id: n.id,
          description: n.data.description,
          expectedOutput: n.data.expectedOutput || '',
          assignedAgentId: n.data.assignedAgentId,
          context,
          tools: n.data.tools || [],
          config: n.data.config || { async: false, humanInput: false }
        };
      });

    return {
      id: currentCrew?.id || `crew_${Date.now()}`,
      name: crewName,
      description: currentCrew?.description || `AI crew with ${agents.length} agents and ${tasks.length} tasks`,
      version: (currentCrew?.version || 0) + 1,
      process: processType,
      agents,
      tasks,
      triggers: currentCrew?.triggers || [{ id: 'trigger_manual', type: 'manual', config: {}, enabled: true }],
      variables: currentCrew?.variables || {},
      config: {
        verbose: true,
        memory: false
      }
    };
  };

  // ==================== ACTION HANDLERS ====================

  const handleSave = async () => {
    if (nodes.length === 0) {
      message.warning('Add some agents and tasks first');
      return;
    }

    const crew = buildCrewConfig();
    
    if (onSave) {
      await onSave(crew);
    } else {
      // Default save behavior
      try {
        const res = await fetch('/api/agent-crews/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, crew })
        });
        
        if (res.ok) {
          message.success('Crew saved!');
        }
      } catch (error) {
        message.error('Failed to save crew');
      }
    }
  };

  const handleExport = async () => {
    if (nodes.length === 0) {
      message.warning('Add some agents and tasks first');
      return;
    }

    const crew = buildCrewConfig();
    
    if (onExport) {
      await onExport(crew);
    }
  };

  const handleRun = async () => {
    if (nodes.length === 0) {
      message.warning('Add some agents and tasks first');
      return;
    }

    const agents = nodes.filter(n => n.type === 'agent');
    const tasks = nodes.filter(n => n.type === 'task');
    
    if (agents.length === 0) {
      message.warning('Add at least one agent');
      return;
    }
    
    if (tasks.length === 0) {
      message.warning('Add at least one task');
      return;
    }

    const crew = buildCrewConfig();
    
    if (onRun) {
      await onRun(crew);
    }
  };

  // ==================== RENDER ====================

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {/* Left Panel: AI Chat / Thought Process */}
      <div
        style={{
          width: '400px',
          borderRight: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fafafa'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e8e8e8', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              <ThunderboltOutlined style={{ fontSize: '20px', color: '#5CC49D' }} />
              <Text strong>AI Crew Builder</Text>
            </Space>
            
            <Space>
              <Tooltip title="Crew Settings">
                <Button 
                  type="text" 
                  icon={<SettingOutlined />}
                  onClick={() => setShowSettingsModal(true)}
                />
              </Tooltip>
            </Space>
          </div>
          
          {/* Crew name and process type */}
          <div style={{ marginTop: '12px' }}>
            <Input
              value={crewName}
              onChange={e => setCrewName(e.target.value)}
              placeholder="Crew name..."
              style={{ marginBottom: '8px' }}
            />
            <Select
              value={processType}
              onChange={setProcessType}
              style={{ width: '100%' }}
              options={[
                { value: 'sequential', label: '📋 Sequential Process' },
                { value: 'hierarchical', label: '🏢 Hierarchical Process' }
              ]}
            />
          </div>
        </div>

        {/* Thought Process Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {thoughtProcess.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <Text type="secondary">
                {initialCrew 
                  ? `"${initialCrew.name}" loaded. Describe changes or continue building.`
                  : 'Describe what you want your crew to do, and I\'ll build it for you.'
                }
              </Text>
              <div style={{ marginTop: '16px', textAlign: 'left' }}>
                <Text strong style={{ fontSize: '12px' }}>Examples:</Text>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  • Research companies and write cold emails<br/>
                  • Create SEO blog posts from trending topics<br/>
                  • Analyze support tickets and categorize by priority<br/>
                  • Monitor competitors and send weekly reports
                </div>
              </div>
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {thoughtProcess.map(thought => (
                <Card
                  key={thought.id}
                  size="small"
                  style={{
                    backgroundColor: thought.status === 'error' ? '#fff1f0' : '#fff',
                    borderLeft: `4px solid ${
                      thought.status === 'completed' ? '#52c41a' :
                      thought.status === 'error' ? '#ff4d4f' :
                      '#1890ff'
                    }`
                  }}
                >
                  <Space>
                    {thought.status === 'running' && <LoadingOutlined spin style={{ color: '#1890ff' }} />}
                    {thought.status === 'completed' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    <Text style={{ fontSize: '13px' }}>{thought.message}</Text>
                  </Space>
                </Card>
              ))}
              <div ref={thoughtsEndRef} />
            </Space>
          )}
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Input Area */}
        <div style={{ padding: '16px', backgroundColor: '#fff' }}>
          <TextArea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your automation workflow... e.g., 'Create a crew that researches prospects on LinkedIn and writes personalized outreach emails'"
            disabled={isBuilding}
            autoSize={{ minRows: 3, maxRows: 6 }}
            onPressEnter={(e) => {
              if (e.shiftKey) return;
              e.preventDefault();
              buildCrewFromPrompt();
            }}
            style={{ marginBottom: '12px' }}
          />

          <Button
            type="primary"
            block
            icon={<SendOutlined />}
            onClick={buildCrewFromPrompt}
            loading={isBuilding}
            disabled={!prompt.trim()}
            style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
            size="large"
          >
            {isBuilding ? 'Building...' : (currentCrew ? 'Refine Crew' : 'Build Crew')}
          </Button>

          <Text type="secondary" style={{ fontSize: '11px', marginTop: '8px', display: 'block' }}>
            Press Enter to send • Shift+Enter for new line
          </Text>
        </div>
      </div>

      {/* Center: Visual Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          
          {/* Top action bar */}
          <Panel position="top-right">
            <Space>
              <Button
                icon={<PlusOutlined />}
                onClick={() => {
                  // Add new agent
                  const newAgent: Agent = {
                    id: `agent_${Date.now()}`,
                    name: 'New Agent',
                    role: 'Specialist',
                    goal: 'Complete assigned tasks',
                    tools: []
                  };
                  addAgentToCanvas(newAgent);
                }}
              >
                Add Agent
              </Button>
              
              <Button
                icon={<PlusOutlined />}
                onClick={() => {
                  // Add new task
                  const agents = nodes.filter(n => n.type === 'agent');
                  const newTask: Task = {
                    id: `task_${Date.now()}`,
                    description: 'New task description',
                    expectedOutput: 'Expected output',
                    assignedAgentId: agents[0]?.id || '',
                    context: []
                  };
                  addTaskToCanvas(newTask);
                }}
              >
                Add Task
              </Button>
              
              <Divider type="vertical" />
              
              <Button
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={nodes.length === 0}
              >
                Save
              </Button>
              
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
                disabled={nodes.length === 0}
              >
                Export
              </Button>
              
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleRun}
                disabled={nodes.length === 0}
                style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
              >
                Run Crew
              </Button>
            </Space>
          </Panel>

          {/* Empty state */}
          {nodes.length === 0 && !isBuilding && (
            <div 
              style={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center', 
                padding: '40px',
                zIndex: 10,
                pointerEvents: 'none'
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚀</div>
              <Title level={4} style={{ marginBottom: '8px' }}>
                {initialCrew ? 'Template Ready' : 'Build Your AI Crew'}
              </Title>
              <Text type="secondary">
                {initialCrew 
                  ? 'Your template is loaded. Modify it using the chat or add nodes manually.'
                  : 'Describe your workflow in the chat panel, or add agents and tasks manually.'
                }
              </Text>
            </div>
          )}
        </ReactFlow>
      </div>

      {/* Right Panel: Tools */}
      <div style={{ width: '350px', borderLeft: '1px solid #e8e8e8' }}>
        <ToolsPanel
          workspaceId={workspaceId}
          onSelectTool={(tool) => {
            // Add tool to selected tools
            setSelectedTools(prev => {
              if (prev.includes(tool.id)) return prev;
              return [...prev, tool.id];
            });
          }}
          selectedTools={selectedTools}
        />
      </div>

      {/* Settings Modal */}
      <Modal
        title="Crew Settings"
        open={showSettingsModal}
        onCancel={() => setShowSettingsModal(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Crew Name">
            <Input 
              value={crewName} 
              onChange={e => setCrewName(e.target.value)}
            />
          </Form.Item>
          
          <Form.Item label="Process Type">
            <Select
              value={processType}
              onChange={setProcessType}
              options={[
                { 
                  value: 'sequential', 
                  label: '📋 Sequential - Tasks run one after another' 
                },
                { 
                  value: 'hierarchical', 
                  label: '🏢 Hierarchical - Manager agent coordinates tasks' 
                }
              ]}
            />
          </Form.Item>
          
          <Form.Item label="Enable Memory">
            <Switch />
            <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
              Agents remember context across executions
            </Text>
          </Form.Item>
          
          <Form.Item label="Verbose Mode">
            <Switch defaultChecked />
            <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
              Show detailed agent thought process
            </Text>
          </Form.Item>
        </Form>
      </Modal>

      {/* Agent Edit Modal */}
      <Modal
        title="Edit Agent"
        open={!!editingAgent}
        onCancel={() => setEditingAgent(null)}
        onOk={() => {
          agentForm.validateFields().then(values => {
            setNodes(prev => prev.map(n => 
              n.id === editingAgent?.id 
                ? { ...n, data: { ...n.data, ...values } }
                : n
            ));
            setEditingAgent(null);
          });
        }}
        width={600}
      >
        <Form form={agentForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Input placeholder="e.g., Research Analyst, Content Writer" />
          </Form.Item>
          <Form.Item name="goal" label="Goal" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="What is this agent trying to achieve?" />
          </Form.Item>
          <Form.Item name="backstory" label="Backstory">
            <TextArea rows={3} placeholder="Background context that shapes agent behavior" />
          </Form.Item>
          <Form.Item name="avatar" label="Avatar (Emoji)">
            <Input maxLength={2} style={{ width: '80px' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Task Edit Modal */}
      <Modal
        title="Edit Task"
        open={!!editingTask}
        onCancel={() => setEditingTask(null)}
        onOk={() => {
          taskForm.validateFields().then(values => {
            setNodes(prev => prev.map(n => 
              n.id === editingTask?.id 
                ? { ...n, data: { ...n.data, ...values } }
                : n
            ));
            setEditingTask(null);
          });
        }}
        width={600}
      >
        <Form form={taskForm} layout="vertical">
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="What should this task accomplish?" />
          </Form.Item>
          <Form.Item name="expectedOutput" label="Expected Output" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="What should the output look like?" />
          </Form.Item>
          <Form.Item name="assignedAgentId" label="Assigned Agent">
            <Select
              options={nodes
                .filter(n => n.type === 'agent')
                .map(n => ({ value: n.id, label: n.data.name }))
              }
            />
          </Form.Item>
          <Form.Item name={['config', 'async']} valuePropName="checked" label="Async Execution">
            <Switch />
          </Form.Item>
          <Form.Item name={['config', 'humanInput']} valuePropName="checked" label="Require Human Input">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};