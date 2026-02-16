// app/components/crew/UnifiedCrewBuilder.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Input, 
  Button, 
  Space, 
  message, 
  Typography, 
  Tag, 
  Divider,
  Tooltip,
  Dropdown,
  Modal,
  Form,
  Select,
  Switch,
  ConfigProvider,
  theme as antTheme,
  Avatar,
  Card
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
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
  FileTextOutlined,
  LinkOutlined
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

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_CARD = '#09090b';
const BORDER_COLOR = '#27272a';
const TEXT_SECONDARY = '#a1a1aa';
const TEXT_PRIMARY = '#ffffff';

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
  context: string[];
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
        border: selected ? `2px solid ${BRAND_GREEN}` : `1px solid ${BORDER_COLOR}`,
        backgroundColor: SURFACE_CARD,
        minWidth: '280px',
        maxWidth: '320px',
        boxShadow: selected ? `0 0 20px rgba(92, 196, 157, 0.2)` : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        color: '#fff',
        fontFamily: 'Manrope, sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(92, 196, 157, 0.1)',
            border: `1px solid ${BRAND_GREEN}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            marginRight: '12px',
            color: BRAND_GREEN
          }}
        >
          {data.avatar || <RobotOutlined />}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.name}
          </div>
          <div style={{ fontSize: '12px', color: TEXT_SECONDARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
          <Button type="text" size="small" icon={<MoreOutlined style={{ color: TEXT_SECONDARY }} />} />
        </Dropdown>
      </div>

      {data.goal && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
          <Text style={{ fontSize: '12px', color: TEXT_SECONDARY, display: 'block', lineHeight: '1.5' }}>
            <strong style={{ color: '#fff' }}>Goal:</strong> {data.goal.length > 80 ? data.goal.substring(0, 80) + '...' : data.goal}
          </Text>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
           <Text style={{ fontSize: '10px', color: TEXT_SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOOLS</Text>
           <Text style={{ fontSize: '10px', color: TEXT_SECONDARY }}>{data.tools?.length || 0}</Text>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {data.tools && data.tools.length > 0 ? (
            <>
                {data.tools.slice(0, 3).map((tool: string, idx: number) => (
                <Tag key={idx} style={{ fontSize: '11px', margin: 0, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER_COLOR}`, color: TEXT_SECONDARY }}>
                    {tool}
                </Tag>
                ))}
                {data.tools.length > 3 && (
                <Tag style={{ fontSize: '11px', margin: 0, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER_COLOR}`, color: TEXT_SECONDARY }}>
                    +{data.tools.length - 3}
                </Tag>
                )}
            </>
          ) : (
            <Text style={{ fontSize: '11px', color: '#444', fontStyle: 'italic' }}>No tools assigned</Text>
          )}
        </div>
      </div>

      {/* Connection handles */}
      <div
        className="react-flow__handle react-flow__handle-bottom"
        style={{
          bottom: '-6px',
          width: '10px',
          height: '10px',
          backgroundColor: BRAND_GREEN,
          border: '2px solid #000'
        }}
      />
      <div
        className="react-flow__handle react-flow__handle-top"
        style={{
          top: '-6px',
          width: '10px',
          height: '10px',
          backgroundColor: '#333',
          border: '2px solid #000'
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
        border: selected ? '2px solid #3b82f6' : `1px solid ${BORDER_COLOR}`,
        backgroundColor: '#0f172a', // Slate-950
        minWidth: '280px',
        maxWidth: '320px',
        boxShadow: selected ? '0 0 20px rgba(59, 130, 246, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        color: '#fff',
        fontFamily: 'Manrope, sans-serif'
      }}
    >
      {/* Connection handles */}
      <div
        className="react-flow__handle react-flow__handle-top"
        style={{
          top: '-6px',
          width: '10px',
          height: '10px',
          backgroundColor: '#3b82f6',
          border: '2px solid #000'
        }}
      />
       <div
        className="react-flow__handle react-flow__handle-bottom"
        style={{
          bottom: '-6px',
          width: '10px',
          height: '10px',
          backgroundColor: '#333',
          border: '2px solid #000'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '6px', 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700
          }}>
             {data.index || '#'}
          </div>
          <Text strong style={{ fontSize: '14px', color: '#fff' }}>Task</Text>
          
          {data.config?.async && (
            <Tag color="blue" bordered={false} style={{ fontSize: '10px', margin: 0, padding: '0 4px' }}>
              ASYNC
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
          <Button type="text" size="small" icon={<MoreOutlined style={{ color: TEXT_SECONDARY }} />} />
        </Dropdown>
      </div>

      <div style={{ fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '16px', lineHeight: '1.5' }}>
        {data.description?.length > 100 ? data.description.substring(0, 100) + '...' : data.description}
      </div>

      <div style={{ paddingTop: '12px', borderTop: `1px solid ${BORDER_COLOR}` }}>
        {data.assignedAgentName ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: '11px', color: TEXT_SECONDARY }}>Assigned to</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserOutlined style={{ fontSize: '10px', color: BRAND_GREEN }} />
                    <Text style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{data.assignedAgentName}</Text>
                </div>
            </div>
        ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                 <Text style={{ fontSize: '11px', color: '#ef4444' }}>Unassigned</Text>
            </div>
        )}
      </div>

      {data.context && data.context.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LinkOutlined style={{ fontSize: '10px', color: TEXT_SECONDARY }} />
            <Text style={{ fontSize: '11px', color: TEXT_SECONDARY }}>
                Dependencies: <span style={{ color: '#fff' }}>{data.context.length}</span>
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
          style: { stroke: BRAND_GREEN, strokeWidth: 2 }
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
          style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' }
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);

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
          position: { x: node.position.x + 50, y: node.position.y + 50 },
          data: { ...node.data, id: newId, name: node.data.name + ' (copy)' }
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
      style: { stroke: BRAND_GREEN, strokeWidth: 2 }
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
          existingCrew: currentCrew
        })
      });

      if (!response.body) throw new Error('No response body');

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
      addThought(`  Error: ${error.message}`, 'error');
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
        addThought(`Creating ${data.agent.name}`, 'completed');
        break;
      case 'task_created':
        addTaskToCanvas(data.task);
        addThought(`Creating task: ${data.task.description?.substring(0, 30)}...`, 'completed');
        break;
      case 'crew_complete':
        setCurrentCrew(data.crew);
        addThought('  Crew creation complete!', 'completed');
        setIsBuilding(false);
        setPrompt('');
        message.success('Crew built successfully!');
        break;
      case 'error':
        addThought(`  Error: ${data.message}`, 'error');
        setIsBuilding(false);
        message.error('Failed to build crew');
        break;
    }
  };

  const addThought = (messageText: string, status: ThoughtStep['status']) => {
    setThoughtProcess(prev => [
      ...prev,
      { id: `thought_${Date.now()}`, message: messageText, status, timestamp: new Date() }
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

  const addAgentToCanvas = (agent: Agent) => {
    const agentCount = nodes.filter(n => n.type === 'agent').length;
    const newNode: Node = {
      id: agent.id,
      type: 'agent',
      position: { x: 100 + (agentCount * 350), y: 100 },
      data: { ...agent, onAction: handleNodeAction }
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

    if (task.assignedAgentId) {
      const newEdge: Edge = {
        id: `${task.assignedAgentId}-to-${task.id}`,
        source: task.assignedAgentId,
        target: task.id,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: BRAND_GREEN, strokeWidth: 2 }
      };
      setEdges(prev => [...prev, newEdge]);
    }
  };

  const buildCrewConfig = (): CrewConfig => {
    const agents: Agent[] = nodes.filter(n => n.type === 'agent').map(n => ({
        id: n.id,
        name: n.data.name,
        role: n.data.role,
        goal: n.data.goal,
        backstory: n.data.backstory || '',
        avatar: n.data.avatar,
        color: n.data.color,
        tools: n.data.tools || [],
        llm: n.data.llm || { model: 'openai/gpt-4o-mini', temperature: 0.7 },
        config: n.data.config || { allowDelegation: false, maxIter: 25, verbose: true }
    }));

    const tasks: Task[] = nodes.filter(n => n.type === 'task').map((n, idx) => {
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
      config: { verbose: true, memory: false }
    };
  };

  const handleSave = async () => {
    if (nodes.length === 0) { message.warning('Add some agents and tasks first'); return; }
    const crew = buildCrewConfig();
    if (onSave) { await onSave(crew); } 
    else {
      try {
        const res = await fetch('/api/agent-crews/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, crew })
        });
        if (res.ok) message.success('Crew saved!');
      } catch (error) { message.error('Failed to save crew'); }
    }
  };

  const handleExport = async () => {
    if (nodes.length === 0) { message.warning('Add some agents and tasks first'); return; }
    const crew = buildCrewConfig();
    if (onExport) await onExport(crew);
  };

  const handleRun = async () => {
    if (nodes.length === 0) { message.warning('Add some agents and tasks first'); return; }
    const agents = nodes.filter(n => n.type === 'agent');
    const tasks = nodes.filter(n => n.type === 'task');
    if (agents.length === 0) { message.warning('Add at least one agent'); return; }
    if (tasks.length === 0) { message.warning('Add at least one task'); return; }
    const crew = buildCrewConfig();
    if (onRun) await onRun(crew);
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
          Button: { fontWeight: 600 },
          Input: { colorBgContainer: '#000000', activeBorderColor: BRAND_GREEN },
          Select: { colorBgContainer: '#000000' },
          Modal: { contentBg: SURFACE_CARD, headerBg: SURFACE_CARD },
          Card: { headerBg: 'transparent' }
        }
      }}
    >
      <div style={{ height: '100%', display: 'flex', backgroundColor: DARK_BG, fontFamily: 'Manrope, sans-serif' }}>
        
        {/* Left Panel: AI Chat / Thought Process */}
        <div
          style={{
            width: '380px',
            borderRight: `1px solid ${BORDER_COLOR}`,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: DARK_BG,
            zIndex: 10
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: `1px solid ${BORDER_COLOR}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <Space>
                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(92, 196, 157, 0.1)' }}>
                   <ThunderboltOutlined style={{ fontSize: '18px', color: BRAND_GREEN }} />
                </div>
                <Text strong style={{ fontSize: '16px', color: '#fff' }}>Builder</Text>
              </Space>
              
              <Tooltip title="Crew Settings">
                <Button 
                  type="text" 
                  icon={<SettingOutlined style={{ color: TEXT_SECONDARY }} />}
                  onClick={() => setShowSettingsModal(true)}
                />
              </Tooltip>
            </div>
            
            <Input
              value={crewName}
              onChange={e => setCrewName(e.target.value)}
              placeholder="Crew Name"
              style={{ marginBottom: '12px', fontWeight: 600, fontSize: '14px' }}
              prefix={<EditOutlined style={{ color: TEXT_SECONDARY }} />}
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

          {/* Thought Process Stream */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', scrollbarWidth: 'thin' }}>
            {thoughtProcess.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
                <div style={{ 
                    width: '64px', height: '64px', borderRadius: '50%', 
                    backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                    border: `1px solid ${BORDER_COLOR}`
                }}>
                     <RobotOutlined style={{ fontSize: '24px', color: TEXT_SECONDARY }} />
                </div>
                <Text style={{ color: TEXT_SECONDARY, fontSize: '14px' }}>
                  {initialCrew 
                    ? `"${initialCrew.name}" loaded.`
                    : 'Describe your workflow to auto-build agents & tasks.'
                  }
                </Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {thoughtProcess.map(thought => (
                  <div
                    key={thought.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: thought.status === 'error' ? 'rgba(239, 68, 68, 0.1)' : SURFACE_CARD,
                      border: `1px solid ${thought.status === 'error' ? 'rgba(239, 68, 68, 0.2)' : BORDER_COLOR}`,
                      borderLeft: `3px solid ${
                        thought.status === 'completed' ? BRAND_GREEN :
                        thought.status === 'error' ? '#ef4444' :
                        '#3b82f6'
                      }`,
                      animation: 'fadeIn 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                      <div style={{ marginTop: '2px' }}>
                         {thought.status === 'running' && <LoadingOutlined spin style={{ color: '#3b82f6' }} />}
                         {thought.status === 'completed' && <CheckCircleOutlined style={{ color: BRAND_GREEN }} />}
                         {thought.status === 'error' && <div style={{ color: '#ef4444' }}>!</div>}
                      </div>
                      <Text style={{ fontSize: '13px', color: '#d4d4d8', lineHeight: '1.5' }}>{thought.message}</Text>
                    </div>
                  </div>
                ))}
                <div ref={thoughtsEndRef} />
              </div>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${BORDER_COLOR}` }} />

          {/* Input Area */}
          <div style={{ padding: '20px', backgroundColor: DARK_BG }}>
            <TextArea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your agent workflow..."
              disabled={isBuilding}
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (e.shiftKey) return;
                e.preventDefault();
                buildCrewFromPrompt();
              }}
              style={{ marginBottom: '12px', backgroundColor: '#000', border: `1px solid ${BORDER_COLOR}`, borderRadius: '8px' }}
            />

            <Button
              type="primary"
              block
              icon={<SendOutlined />}
              onClick={buildCrewFromPrompt}
              loading={isBuilding}
              disabled={!prompt.trim()}
              style={{ backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000', height: '40px', fontWeight: 700 }}
            >
              {isBuilding ? 'Building...' : (currentCrew ? 'Refine Crew' : 'Build Crew')}
            </Button>
          </div>
        </div>

        {/* Center: Visual Canvas */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            style={{ backgroundColor: '#000' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#333" />
            <Controls style={{ backgroundColor: SURFACE_CARD, border: `1px solid ${BORDER_COLOR}`, borderRadius: '8px' }} />
            
            {/* Top Toolbar */}
            <Panel position="top-center" style={{ marginTop: '20px' }}>
              <div style={{ 
                  backgroundColor: SURFACE_CARD, 
                  border: `1px solid ${BORDER_COLOR}`, 
                  borderRadius: '12px', 
                  padding: '8px 16px',
                  display: 'flex',
                  gap: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
              }}>
                <Tooltip title="Add Agent">
                    <Button icon={<UserOutlined />} onClick={() => {
                        const newAgent: Agent = {
                            id: `agent_${Date.now()}`,
                            name: 'New Agent',
                            role: 'Role',
                            goal: 'Goal',
                            tools: []
                        };
                        addAgentToCanvas(newAgent);
                    }}>Agent</Button>
                </Tooltip>
                
                <Tooltip title="Add Task">
                    <Button icon={<FileTextOutlined />} onClick={() => {
                        const agents = nodes.filter(n => n.type === 'agent');
                        const newTask: Task = {
                            id: `task_${Date.now()}`,
                            description: 'Task description',
                            expectedOutput: 'Output',
                            assignedAgentId: agents[0]?.id || '',
                            context: []
                        };
                        addTaskToCanvas(newTask);
                    }}>Task</Button>
                </Tooltip>
                
                <Divider type="vertical" style={{ borderColor: BORDER_COLOR, height: '24px', marginTop: '4px' }} />
                
                <Button icon={<SaveOutlined />} onClick={handleSave} disabled={nodes.length === 0} type="text">Save</Button>
                <Button icon={<ExportOutlined />} onClick={handleExport} disabled={nodes.length === 0} type="text">Export</Button>
                
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleRun}
                  disabled={nodes.length === 0}
                  style={{ backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000', fontWeight: 600 }}
                >
                  Run
                </Button>
              </div>
            </Panel>

            {/* Empty state overlay */}
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
                <div style={{ 
                    fontSize: '48px', marginBottom: '24px', 
                    width: '100px', height: '100px', borderRadius: '24px',
                    backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER_COLOR}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                }}>
                    
                </div>
                <Title level={3} style={{ marginBottom: '12px', color: '#fff' }}>
                  {initialCrew ? 'Ready to Edit' : 'Start Building'}
                </Title>
                <Text style={{ color: TEXT_SECONDARY, fontSize: '16px', maxWidth: '400px', display: 'block' }}>
                  {initialCrew 
                    ? 'Modify the template using the chat or controls.'
                    : 'Use the AI chat to generate a crew, or add agents manually.'
                  }
                </Text>
              </div>
            )}
          </ReactFlow>
        </div>

        {/* Right Panel: Tools */}
        <div style={{ width: '350px', borderLeft: `1px solid ${BORDER_COLOR}`, backgroundColor: DARK_BG }}>
          <ToolsPanel
            workspaceId={workspaceId}
            onSelectTool={(tool) => {
              setSelectedTools(prev => {
                if (prev.includes(tool.id)) return prev;
                return [...prev, tool.id];
              });
            }}
            selectedTools={selectedTools}
          />
        </div>

        {/* --- MODALS --- */}

        {/* Settings Modal */}
        <Modal
          title={<span style={{ fontFamily: 'Manrope' }}>Crew Configuration</span>}
          open={showSettingsModal}
          onCancel={() => setShowSettingsModal(false)}
          footer={null}
          width={500}
        >
          <Form layout="vertical" style={{ marginTop: '20px' }}>
            <Form.Item label="Crew Name">
              <Input value={crewName} onChange={e => setCrewName(e.target.value)} />
            </Form.Item>
            
            <Form.Item label="Process Type">
              <Select
                value={processType}
                onChange={setProcessType}
                options={[
                  { value: 'sequential', label: 'Sequential' },
                  { value: 'hierarchical', label: 'Hierarchical' }
                ]}
              />
            </Form.Item>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: '#fff' }}>Enable Memory</span>
                <Switch />
            </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#fff' }}>Verbose Mode</span>
                <Switch defaultChecked />
            </div>
          </Form>
        </Modal>

        {/* Agent Edit Modal */}
        <Modal
          title={<span style={{ fontFamily: 'Manrope' }}>Edit Agent</span>}
          open={!!editingAgent}
          onCancel={() => setEditingAgent(null)}
          onOk={() => {
            agentForm.validateFields().then(values => {
              setNodes(prev => prev.map(n => 
                n.id === editingAgent?.id ? { ...n, data: { ...n.data, ...values } } : n
              ));
              setEditingAgent(null);
            });
          }}
          width={600}
          okButtonProps={{ style: { backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' } }}
        >
          <Form form={agentForm} layout="vertical" style={{ marginTop: '20px' }}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
              <Input placeholder="e.g. Research Analyst" />
            </Form.Item>
            <Form.Item name="goal" label="Goal" rules={[{ required: true }]}>
              <TextArea rows={3} placeholder="What is the agent's objective?" />
            </Form.Item>
            <Form.Item name="backstory" label="Backstory">
              <TextArea rows={3} />
            </Form.Item>
             <Form.Item name="avatar" label="Avatar">
              <Input placeholder="Emoji or URL" style={{ width: '120px' }} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Task Edit Modal */}
        <Modal
          title={<span style={{ fontFamily: 'Manrope' }}>Edit Task</span>}
          open={!!editingTask}
          onCancel={() => setEditingTask(null)}
          onOk={() => {
            taskForm.validateFields().then(values => {
              setNodes(prev => prev.map(n => 
                n.id === editingTask?.id ? { ...n, data: { ...n.data, ...values } } : n
              ));
              setEditingTask(null);
            });
          }}
          width={600}
          okButtonProps={{ style: { backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' } }}
        >
          <Form form={taskForm} layout="vertical" style={{ marginTop: '20px' }}>
            <Form.Item name="description" label="Description" rules={[{ required: true }]}>
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item name="expectedOutput" label="Expected Output" rules={[{ required: true }]}>
              <TextArea rows={2} />
            </Form.Item>
            <Form.Item name="assignedAgentId" label="Assigned Agent">
              <Select
                options={nodes.filter(n => n.type === 'agent').map(n => ({ value: n.id, label: n.data.name }))}
              />
            </Form.Item>
            <div style={{ display: 'flex', gap: '24px' }}>
                 <Form.Item name={['config', 'async']} valuePropName="checked" label="Async Execution">
                    <Switch />
                </Form.Item>
                <Form.Item name={['config', 'humanInput']} valuePropName="checked" label="Human Input">
                    <Switch />
                </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};