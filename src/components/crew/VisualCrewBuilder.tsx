// app/components/VisualCrewBuilder.tsx (continued)
"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Space, 
  Drawer, 
  Form, 
  Tag, 
  Collapse,
  Typography,
  Badge,
  Popover,
  Divider,
  Tooltip,
  message,
  Modal
} from 'antd';
import {
  PlusOutlined,
  RobotOutlined,
  ToolOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  SendOutlined,
  MessageOutlined,
  ApiOutlined,
  FileTextOutlined,
  SearchOutlined,
  DatabaseOutlined
} from '@ant-design/icons';


import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Panel,
  NodeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel: CollapsePanel } = Collapse;

// ==================== CUSTOM NODE COMPONENTS ====================

// Agent Node Component (matches CrewAI style)
const AgentNode = ({ data, selected }: any) => {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: selected ? '2px solid #5CC49D' : '2px solid #e0e0e0',
        backgroundColor: '#fff',
        minWidth: '280px',
        boxShadow: selected ? '0 4px 12px rgba(92, 196, 157, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s'
      }}
    >
      {/* Agent Header */}
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

        <Tooltip title="Edit Agent">
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => data.onEdit(data.id)}
          />
        </Tooltip>
      </div>

      {/* Agent Goal */}
      <div style={{ marginBottom: '12px' }}>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          <strong>Goal:</strong> {data.goal}
        </Text>
      </div>

      {/* Tools */}
      <div>
        <Text style={{ fontSize: '11px', color: '#999' }}>TOOLS:</Text>
        <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {data.tools && data.tools.length > 0 ? (
            data.tools.slice(0, 3).map((tool: any, idx: number) => (
              <Tag key={idx} style={{ fontSize: '10px', margin: 0 }}>
                {tool.name}
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

      {/* Handles for connections */}
      <div className="react-flow__handle react-flow__handle-top" />
      <div className="react-flow__handle react-flow__handle-bottom" />
    </div>
  );
};

// Task Node Component
const TaskNode = ({ data, selected }: any) => {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: selected ? '2px solid #1890ff' : '2px solid #e0e0e0',
        backgroundColor: '#f8f9fa',
        minWidth: '280px',
        boxShadow: selected ? '0 4px 12px rgba(24, 144, 255, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <FileTextOutlined style={{ fontSize: '20px', marginRight: '8px', color: '#1890ff' }} />
        <div style={{ flex: 1 }}>
          <Text strong style={{ fontSize: '14px' }}>
            Task {data.index || ''}
          </Text>
        </div>
        <Tooltip title="Edit Task">
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => data.onEdit(data.id)}
          />
        </Tooltip>
      </div>

      <Paragraph
        ellipsis={{ rows: 2 }}
        style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}
      >
        {data.description}
      </Paragraph>

      <div>
        <Text style={{ fontSize: '11px', color: '#999' }}>
          Assigned to: <strong>{data.assignedAgentName || 'Unassigned'}</strong>
        </Text>
      </div>

      {/* Handles */}
      <div className="react-flow__handle react-flow__handle-top" />
      <div className="react-flow__handle react-flow__handle-bottom" />
    </div>
  );
};

// Trigger Node Component
const TriggerNode = ({ data }: any) => {
  const icons: any = {
    manual: <PlayCircleOutlined />,
    schedule: <ClockCircleOutlined />,
    event: <ThunderboltOutlined />,
    webhook: <ApiOutlined />
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '20px',
        border: '2px solid #722ed1',
        backgroundColor: '#f9f0ff',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '180px'
      }}
    >
      <div style={{ fontSize: '18px', color: '#722ed1' }}>
        {icons[data.type] || <ThunderboltOutlined />}
      </div>
      <div>
        <Text strong style={{ fontSize: '13px' }}>
          {data.label}
        </Text>
      </div>

      <div className="react-flow__handle react-flow__handle-bottom" />
    </div>
  );
};

// Register custom node types
const nodeTypes: NodeTypes = {
  agent: AgentNode,
  task: TaskNode,
  trigger: TriggerNode
};

// ==================== MAIN COMPONENT ====================

interface VisualCrewBuilderProps {
  workspaceId: string;
  initialCrew?: any;
}

export const VisualCrewBuilder: React.FC<VisualCrewBuilderProps> = ({
  workspaceId,
  initialCrew
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [crewName, setCrewName] = useState(initialCrew?.name || '');
  const [crewDescription, setCrewDescription] = useState(initialCrew?.description || '');
  
  const [showAgentDrawer, setShowAgentDrawer] = useState(false);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(true);
  const [showChatPanel, setShowChatPanel] = useState(false);
  
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  
  const [agentForm] = Form.useForm();
  const [taskForm] = Form.useForm();
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    loadTools();
    
    if (initialCrew) {
      loadCrewFromTemplate(initialCrew);
    }
  }, []);

  const loadTools = async () => {
    try {
      const res = await fetch('/api/agent-tools');
      const data = await res.json();
      
      if (data.success) {
        setAvailableTools(data.tools);
      }
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  };

  const loadCrewFromTemplate = (crew: any) => {
    setCrewName(crew.name);
    setCrewDescription(crew.description);
    
    const agentNodes: Node[] = [];
    const taskNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Create trigger node
    agentNodes.push({
      id: 'trigger',
      type: 'trigger',
      position: { x: 250, y: 50 },
      data: {
        type: 'manual',
        label: 'Manual Trigger'
      }
    });

    // Create agent nodes
    crew.agents.forEach((agent: any, idx: number) => {
      const node: Node = {
        id: agent.id,
        type: 'agent',
        position: { x: 100 + (idx * 320), y: 200 },
        data: {
          ...agent,
          onEdit: handleEditAgent
        }
      };
      agentNodes.push(node);
    });

    // Create task nodes
    crew.tasks.forEach((task: any, idx: number) => {
      const assignedAgent = crew.agents.find((a: any) => a.id === task.assignedAgentId);
      
      const node: Node = {
        id: task.id,
        type: 'task',
        position: { x: 100 + (idx * 320), y: 450 },
        data: {
          ...task,
          index: idx + 1,
          assignedAgentName: assignedAgent?.name,
          onEdit: handleEditTask
        }
      };
      taskNodes.push(node);

      // Connect trigger to first task
      if (idx === 0) {
        newEdges.push({
          id: `trigger-${task.id}`,
          source: 'trigger',
          target: task.id,
          animated: true,
          style: { stroke: '#722ed1', strokeWidth: 2 }
        });
      }

      // Connect task to assigned agent
      if (assignedAgent) {
        newEdges.push({
          id: `${task.id}-${assignedAgent.id}`,
          source: task.id,
          target: assignedAgent.id,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#5CC49D', strokeWidth: 2 }
        });
      }

      // Connect task dependencies
      if (task.dependencies) {
        task.dependencies.forEach((depId: string) => {
          newEdges.push({
            id: `${depId}-${task.id}`,
            source: depId,
            target: task.id,
            animated: true,
            style: { stroke: '#1890ff', strokeWidth: 2, strokeDasharray: '5,5' }
          });
        });
      }
    });

    setNodes([...agentNodes, ...taskNodes]);
    setEdges(newEdges);
    setAgents(crew.agents);
    setTasks(crew.tasks);
  };

  // ==================== AGENT MANAGEMENT ====================

  const handleAddAgent = () => {
    setEditingAgent(null);
    agentForm.resetFields();
    setShowAgentDrawer(true);
  };

  const handleEditAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setEditingAgent(agent);
      agentForm.setFieldsValue({
        name: agent.name,
        role: agent.role,
        goal: agent.goal,
        backstory: agent.backstory,
        tools: agent.tools?.map((t: any) => t.name) || [],
        avatar: agent.avatar,
        color: agent.color
      });
      setShowAgentDrawer(true);
    }
  };

  const handleSaveAgent = async () => {
    try {
      const values = await agentForm.validateFields();
      
      const selectedTools = availableTools.filter(t => 
        values.tools?.includes(t.name)
      );

      const agentData = {
        id: editingAgent?.id || `agent_${Date.now()}`,
        name: values.name,
        role: values.role,
        goal: values.goal,
        backstory: values.backstory,
        tools: selectedTools,
        avatar: values.avatar || '🤖',
        color: values.color || '#5CC49D'
      };

      if (editingAgent) {
        // Update existing agent
        const updatedAgents = agents.map(a => 
          a.id === editingAgent.id ? agentData : a
        );
        setAgents(updatedAgents);

        // Update node
        setNodes(nds => nds.map(node => 
          node.id === editingAgent.id 
            ? { ...node, data: { ...agentData, onEdit: handleEditAgent } }
            : node
        ));
      } else {
        // Add new agent
        setAgents([...agents, agentData]);

        const newNode: Node = {
          id: agentData.id,
          type: 'agent',
          position: { x: 100 + (agents.length * 320), y: 200 },
          data: {
            ...agentData,
            onEdit: handleEditAgent
          }
        };

        setNodes([...nodes, newNode]);
      }

      setShowAgentDrawer(false);
      message.success('Agent saved successfully');
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    Modal.confirm({
      title: 'Delete Agent',
      content: 'Are you sure you want to delete this agent? Associated tasks will need to be reassigned.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setAgents(agents.filter(a => a.id !== agentId));
        setNodes(nodes.filter(n => n.id !== agentId));
        setEdges(edges.filter(e => e.source !== agentId && e.target !== agentId));
        message.success('Agent deleted');
      }
    });
  };

  // ==================== TASK MANAGEMENT ====================

  const handleAddTask = () => {
    setEditingTask(null);
    taskForm.resetFields();
    setShowTaskDrawer(true);
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      taskForm.setFieldsValue({
        description: task.description,
        expectedOutput: task.expectedOutput,
        assignedAgentId: task.assignedAgentId,
        dependencies: task.dependencies || []
      });
      setShowTaskDrawer(true);
    }
  };

  const handleSaveTask = async () => {
    try {
      const values = await taskForm.validateFields();
      
      const assignedAgent = agents.find(a => a.id === values.assignedAgentId);

      const taskData = {
        id: editingTask?.id || `task_${Date.now()}`,
        description: values.description,
        expectedOutput: values.expectedOutput,
        assignedAgentId: values.assignedAgentId,
        assignedAgentName: assignedAgent?.name,
        dependencies: values.dependencies || []
      };

      if (editingTask) {
        // Update existing task
        const updatedTasks = tasks.map(t => 
          t.id === editingTask.id ? taskData : t
        );
        setTasks(updatedTasks);

        // Update node
        setNodes(nds => nds.map(node => 
          node.id === editingTask.id 
            ? { 
                ...node, 
                data: { 
                  ...taskData, 
                  index: tasks.findIndex(t => t.id === editingTask.id) + 1,
                  onEdit: handleEditTask 
                } 
              }
            : node
        ));

        // Update edges
        updateTaskEdges(taskData);
      } else {
        // Add new task
        setTasks([...tasks, taskData]);

        const newNode: Node = {
          id: taskData.id,
          type: 'task',
          position: { x: 100 + (tasks.length * 320), y: 450 },
          data: {
            ...taskData,
            index: tasks.length + 1,
            onEdit: handleEditTask
          }
        };

        setNodes([...nodes, newNode]);
        
        // Add edges for new task
        updateTaskEdges(taskData);
      }

      setShowTaskDrawer(false);
      message.success('Task saved successfully');
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const updateTaskEdges = (task: any) => {
    // Remove old edges for this task
    let newEdges = edges.filter(e => 
      e.source !== task.id && e.target !== task.id
    );

    // Add edge from task to assigned agent
    if (task.assignedAgentId) {
      newEdges.push({
        id: `${task.id}-${task.assignedAgentId}`,
        source: task.id,
        target: task.assignedAgentId,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#5CC49D', strokeWidth: 2 }
      });
    }

    // Add edges for dependencies
    if (task.dependencies) {
      task.dependencies.forEach((depId: string) => {
        newEdges.push({
          id: `${depId}-${task.id}`,
          source: depId,
          target: task.id,
          animated: true,
          style: { stroke: '#1890ff', strokeWidth: 2, strokeDasharray: '5,5' }
        });
      });
    }

    setEdges(newEdges);
  };

  const handleDeleteTask = (taskId: string) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setTasks(tasks.filter(t => t.id !== taskId));
        setNodes(nodes.filter(n => n.id !== taskId));
        setEdges(edges.filter(e => e.source !== taskId && e.target !== taskId));
        message.success('Task deleted');
      }
    });
  };

  // ==================== CREW EXECUTION ====================

  const handleSaveCrew = async () => {
    if (!crewName) {
      message.error('Please enter a crew name');
      return;
    }

    if (agents.length === 0) {
      message.error('Please add at least one agent');
      return;
    }

    if (tasks.length === 0) {
      message.error('Please add at least one task');
      return;
    }

    try {
      const crewData = {
        name: crewName,
        description: crewDescription,
        category: 'custom',
        agents,
        tasks,
        process: 'sequential' as const,
        workspaceId
      };

      const res = await fetch('/api/agent-crews/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crewData)
      });

      const data = await res.json();

      if (data.success) {
        message.success('Crew saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save crew:', error);
      message.error('Failed to save crew');
    }
  };

  const handleRunCrew = async () => {
    if (!crewName) {
      message.error('Please save the crew first');
      return;
    }

    try {
      message.loading({ content: 'Starting crew execution...', key: 'crew-run' });

      const res = await fetch('/api/agent-crews/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          agents,
          tasks,
          crewName
        })
      });

      const data = await res.json();

      if (data.success) {
        message.success({ content: 'Crew execution completed!', key: 'crew-run' });
      }
    } catch (error) {
      console.error('Failed to run crew:', error);
      message.error({ content: 'Crew execution failed', key: 'crew-run' });
    }
  };

  // ==================== CONNECTION HANDLING ====================

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed }
    } as Edge, eds)),
    [setEdges]
  );

  // ==================== RENDER ====================

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Toolbar */}
      <div 
        style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid #e8e8e8',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div style={{ flex: 1 }}>
          <Input
            placeholder="Crew Name"
            value={crewName}
            onChange={e => setCrewName(e.target.value)}
            style={{ maxWidth: '300px', marginRight: '12px' }}
            size="large"
          />
          <Input
            placeholder="Description (optional)"
            value={crewDescription}
            onChange={e => setCrewDescription(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>

        <Space>
          <Button
            icon={<MessageOutlined />}
            onClick={() => setShowChatPanel(!showChatPanel)}
          >
            Chat
          </Button>

          <Button
            icon={<ToolOutlined />}
            onClick={() => setShowToolsPanel(!showToolsPanel)}
          >
            Tools
          </Button>

          <Divider type="vertical" />

          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveCrew}
          >
            Save
          </Button>

          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRunCrew}
            style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
          >
            Run Crew
          </Button>
        </Space>
      </div>

      {/* Main Canvas Area */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Left Sidebar - Chat (optional) */}
        {showChatPanel && (
          <div 
            style={{ 
              width: '350px', 
              borderRight: '1px solid #e8e8e8',
              backgroundColor: '#fafafa',
              padding: '16px',
              overflowY: 'auto'
            }}
          >
            <Title level={5}>Build with Chat</Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Describe what you want your crew to do, and we will help you build it
            </Text>

            <div style={{ marginTop: '16px' }}>
              <TextArea
                rows={4}
                placeholder="e.g., I need a crew that researches companies and writes personalized emails..."
              />
              <Button
                type="primary"
                block
                style={{ marginTop: '8px', backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
                icon={<SendOutlined />}
              >
                Generate Crew
              </Button>
            </div>

            <Divider />

            <Title level={5}>Suggestions</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block size="small">Add researcher agent</Button>
              <Button block size="small">Add email writer agent</Button>
              <Button block size="small">Connect to lead database</Button>
            </Space>
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />

            {/* Floating Action Buttons */}
            <Panel position="top-right" style={{ margin: '10px' }}>
              <Space direction="vertical">
                <Tooltip title="Add Agent" placement="left">
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<RobotOutlined />}
                    onClick={handleAddAgent}
                    style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
                  />
                </Tooltip>

                <Tooltip title="Add Task" placement="left">
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<FileTextOutlined />}
                    onClick={handleAddTask}
                    style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                  />
                </Tooltip>
              </Space>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Sidebar - Tools Panel */}
        {showToolsPanel && (
          <div 
            style={{ 
              width: '300px', 
              borderLeft: '1px solid #e8e8e8',
              backgroundColor: '#fff',
              overflowY: 'auto'
            }}
          >
            <div style={{ padding: '16px' }}>
              <Title level={5}>
                <ToolOutlined style={{ marginRight: '8px' }} />
                Available Tools
              </Title>

              <Input
                placeholder="Search tools..."
                prefix={<SearchOutlined />}
                style={{ marginBottom: '16px' }}
              />

              <Collapse
                defaultActiveKey={['research', 'communication', 'data']}
                bordered={false}
              >
                {['research', 'communication', 'data', 'file', 'web'].map(category => {
                  const categoryTools = availableTools.filter(t => t.category === category);
                  
                  if (categoryTools.length === 0) return null;

                  const categoryIcons: any = {
                    research: <SearchOutlined />,
                    communication: <MessageOutlined />,
                    data: <DatabaseOutlined />,
                    file: <FileTextOutlined />,
                    web: <ApiOutlined />
                  };

                  return (
                    <CollapsePanel
                      key={category}
                      header={
                        <Space>
                          {categoryIcons[category]}
                          <span style={{ textTransform: 'capitalize' }}>{category}</span>
                          <Badge count={categoryTools.length} style={{ backgroundColor: '#5CC49D' }} />
                        </Space>
                      }
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {categoryTools.map(tool => (
                          <Card
                            key={tool.name}
                            size="small"
                            hoverable
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                              <ToolOutlined style={{ marginTop: '2px' }} />
                              <div style={{ flex: 1 }}>
                                <Text strong style={{ fontSize: '13px' }}>
                                  {tool.name}
                                </Text>
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                  {tool.description}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </Space>
                    </CollapsePanel>
                  );
                })}
              </Collapse>
            </div>
          </div>
        )}
      </div>

      {/* Agent Edit Drawer */}
      <Drawer
        title={editingAgent ? 'Edit Agent' : 'Add Agent'}
        open={showAgentDrawer}
        onClose={() => setShowAgentDrawer(false)}
        width={500}
        extra={
          <Space>
            {editingAgent && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  handleDeleteAgent(editingAgent.id);
                  setShowAgentDrawer(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button onClick={() => setShowAgentDrawer(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSaveAgent}
              style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
            >
              Save
            </Button>
          </Space>
        }
      >
        <Form form={agentForm} layout="vertical">
          <Form.Item
            name="name"
            label="Agent Name"
            rules={[{ required: true, message: 'Please enter agent name' }]}
          >
            <Input placeholder="e.g., Research Specialist" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please enter role' }]}
          >
            <Input placeholder="e.g., Content Researcher" />
          </Form.Item>

          <Form.Item
            name="goal"
            label="Goal"
            rules={[{ required: true, message: 'Please enter goal' }]}
          >
            <TextArea
              rows={2}
              placeholder="What is this agent's primary objective?"
            />
          </Form.Item>

          <Form.Item
            name="backstory"
            label="Backstory"
            rules={[{ required: true, message: 'Please enter backstory' }]}
          >
            <TextArea
              rows={3}
              placeholder="Give the agent context and personality"
            />
          </Form.Item>

          <Form.Item name="tools" label="Tools">
            <Select
              mode="multiple"
              placeholder="Select tools for this agent"
              options={availableTools.map(t => ({
                label: `${t.name} - ${t.description}`,
                value: t.name
              }))}
            />
          </Form.Item>

          <Form.Item name="avatar" label="Avatar Emoji">
            <Input placeholder="e.g., 🤖" />
          </Form.Item>

          <Form.Item name="color" label="Color">
            <Input type="color" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Task Edit Drawer */}
      <Drawer
        title={editingTask ? 'Edit Task' : 'Add Task'}
        open={showTaskDrawer}
        onClose={() => setShowTaskDrawer(false)}
        width={500}
        extra={
          <Space>
            {editingTask && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  handleDeleteTask(editingTask.id);
                  setShowTaskDrawer(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button onClick={() => setShowTaskDrawer(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSaveTask}
              style={{ backgroundColor: '#5CC49D', borderColor: '#5CC49D' }}
            >
              Save
            </Button>
          </Space>
        }
      >
        <Form form={taskForm} layout="vertical">
          <Form.Item
            name="description"
            label="Task Description"
            rules={[{ required: true, message: 'Please describe the task' }]}
          >
            <TextArea
              rows={3}
              placeholder="What should this task accomplish?"
            />
          </Form.Item>

          <Form.Item
            name="expectedOutput"
            label="Expected Output"
            rules={[{ required: true, message: 'Please specify expected output' }]}
          >
            <TextArea
              rows={2}
              placeholder="What format/content should the output be?"
            />
          </Form.Item>

          <Form.Item
            name="assignedAgentId"
            label="Assign to Agent"
            rules={[{ required: true, message: 'Please assign an agent' }]}
          >
            <Select
              placeholder="Select agent"
              options={agents.map(a => ({
                label: `${a.name} (${a.role})`,
                value: a.id
              }))}
            />
          </Form.Item>

          <Form.Item name="dependencies" label="Dependencies">
            <Select
              mode="multiple"
              placeholder="Tasks that must complete first"
              options={tasks
                .filter(t => !editingTask || t.id !== editingTask.id)
                .map(t => ({
                  label: t.description,
                  value: t.id
                }))}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};