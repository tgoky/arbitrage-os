// services/agent-runtime/CrewExecutionService.ts
// Service for executing CrewAI-compatible crews

import { prisma } from '@/lib/prisma';
import { OpenRouterClient } from '@/lib/openrouter';

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  llm: {
    model: string;
    temperature: number;
  };
  config?: {
    allowDelegation?: boolean;
    maxIter?: number;
    verbose?: boolean;
  };
}

interface TaskConfig {
  id: string;
  name?: string;
  description: string;
  expectedOutput: string;
  assignedAgentId: string;
  context?: string[]; // Task IDs this depends on
  config?: {
    async?: boolean;
    humanInput?: boolean;
    outputFile?: string;
  };
}

interface CrewConfig {
  id: string;
  name: string;
  description?: string;
  agents: AgentConfig[];
  tasks: TaskConfig[];
  process: 'sequential' | 'hierarchical' | 'parallel';
  config?: {
    verbose?: boolean;
    memory?: boolean;
  };
  variables?: Record<string, string>;
}

interface ExecutionStep {
  id: string;
  type: 'task_start' | 'agent_thinking' | 'agent_response' | 'tool_call' | 'tool_result' | 'task_complete' | 'error' | 'delegation';
  taskId?: string;
  agentId?: string;
  agentName?: string;
  toolName?: string;
  content: string;
  timestamp: Date;
  duration?: number;
  metadata?: any;
}

interface ExecutionResult {
  executionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  taskResults: Record<string, any>;
  finalOutput: any;
  steps: ExecutionStep[];
  error?: string;
}

interface ExecutionContext {
  executionId: string;
  workspaceId: string;
  userId: string;
  inputs: Record<string, any>;
  taskResults: Map<string, any>;
  agentMemory: Map<string, any[]>;
  steps: ExecutionStep[];
  onStep?: (step: ExecutionStep) => void;
}

export class CrewExecutionService {
  private openRouter: OpenRouterClient;

  constructor() {
    this.openRouter = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
  }

  // ==================== MAIN EXECUTION ====================

  async executeCrew(
    crew: CrewConfig,
    workspaceId: string,
    userId: string,
    inputs: Record<string, any> = {},
    onStep?: (step: ExecutionStep) => void
  ): Promise<ExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    const context: ExecutionContext = {
      executionId,
      workspaceId,
      userId,
      inputs,
      taskResults: new Map(),
      agentMemory: new Map(),
      steps: [],
      onStep
    };

    // Create execution record in database
    await this.createExecutionRecord(executionId, crew, workspaceId, userId, inputs);

    try {
      let finalOutput: any;

      // Execute based on process type
      switch (crew.process) {
        case 'sequential':
          finalOutput = await this.executeSequential(crew, context);
          break;
        case 'parallel':
          finalOutput = await this.executeParallel(crew, context);
          break;
        case 'hierarchical':
          finalOutput = await this.executeHierarchical(crew, context);
          break;
        default:
          finalOutput = await this.executeSequential(crew, context);
      }

      const endTime = new Date();

      // Update execution record
      await this.updateExecutionRecord(executionId, {
        status: 'completed',
        endTime: endTime.toISOString(),
        totalDuration: endTime.getTime() - startTime.getTime(),
        taskResults: Object.fromEntries(context.taskResults),
        finalOutput,
        steps: context.steps
      });

      return {
        executionId,
        status: 'completed',
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        taskResults: Object.fromEntries(context.taskResults),
        finalOutput,
        steps: context.steps
      };

    } catch (error: any) {
      const endTime = new Date();

      // Update execution record with error
      await this.updateExecutionRecord(executionId, {
        status: 'failed',
        endTime: endTime.toISOString(),
        error: error.message,
        steps: context.steps
      });

      return {
        executionId,
        status: 'failed',
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        taskResults: Object.fromEntries(context.taskResults),
        finalOutput: null,
        steps: context.steps,
        error: error.message
      };
    }
  }

  // ==================== SEQUENTIAL EXECUTION ====================

  private async executeSequential(
    crew: CrewConfig,
    context: ExecutionContext
  ): Promise<any> {
    let lastResult: any = null;

    for (const task of crew.tasks) {
      const agent = crew.agents.find(a => a.id === task.assignedAgentId);
      
      if (!agent) {
        throw new Error(`Agent ${task.assignedAgentId} not found for task ${task.id}`);
      }

      // Gather context from dependent tasks
      const taskContext: any[] = [];
      if (task.context && task.context.length > 0) {
        for (const depTaskId of task.context) {
          const depResult = context.taskResults.get(depTaskId);
          if (depResult) {
            taskContext.push(depResult);
          }
        }
      }

      // Execute task
      lastResult = await this.executeTask(task, agent, crew, context, taskContext);
      context.taskResults.set(task.id, lastResult);
    }

    return lastResult;
  }

  // ==================== PARALLEL EXECUTION ====================

  private async executeParallel(
    crew: CrewConfig,
    context: ExecutionContext
  ): Promise<any> {
    // Group tasks by dependency level
    const levels = this.getTaskLevels(crew.tasks);
    const results: any[] = [];

    for (const levelTasks of levels) {
      // Execute all tasks in this level in parallel
      const levelPromises = levelTasks.map(async (task) => {
        const agent = crew.agents.find(a => a.id === task.assignedAgentId);
        
        if (!agent) {
          throw new Error(`Agent ${task.assignedAgentId} not found for task ${task.id}`);
        }

        // Gather context
        const taskContext: any[] = [];
        if (task.context && task.context.length > 0) {
          for (const depTaskId of task.context) {
            const depResult = context.taskResults.get(depTaskId);
            if (depResult) {
              taskContext.push(depResult);
            }
          }
        }

        const result = await this.executeTask(task, agent, crew, context, taskContext);
        context.taskResults.set(task.id, result);
        return result;
      });

      const levelResults = await Promise.all(levelPromises);
      results.push(...levelResults);
    }

    return results[results.length - 1];
  }

  // ==================== HIERARCHICAL EXECUTION ====================

  private async executeHierarchical(
    crew: CrewConfig,
    context: ExecutionContext
  ): Promise<any> {
    // In hierarchical, a "manager" agent coordinates other agents
    // For simplicity, use the first agent as manager
    const managerAgent = crew.agents[0];
    const workerAgents = crew.agents.slice(1);

    // Manager creates execution plan
    const planStep = this.addStep(context, {
      type: 'agent_thinking',
      agentId: managerAgent.id,
      agentName: managerAgent.name,
      content: 'Creating execution plan for the crew...'
    });

    // Execute tasks with manager coordination
    let lastResult: any = null;

    for (const task of crew.tasks) {
      const assignedAgent = crew.agents.find(a => a.id === task.assignedAgentId) || managerAgent;
      
      const taskContext: any[] = [];
      if (task.context && task.context.length > 0) {
        for (const depTaskId of task.context) {
          const depResult = context.taskResults.get(depTaskId);
          if (depResult) {
            taskContext.push(depResult);
          }
        }
      }

      // Manager delegates to appropriate agent
      this.addStep(context, {
        type: 'delegation',
        agentId: managerAgent.id,
        agentName: managerAgent.name,
        content: `Delegating task to ${assignedAgent.name}: ${task.description.substring(0, 100)}...`
      });

      lastResult = await this.executeTask(task, assignedAgent, crew, context, taskContext);
      context.taskResults.set(task.id, lastResult);
    }

    return lastResult;
  }

  // ==================== TASK EXECUTION ====================

  private async executeTask(
    task: TaskConfig,
    agent: AgentConfig,
    crew: CrewConfig,
    context: ExecutionContext,
    taskContext: any[]
  ): Promise<any> {
    const taskStartTime = Date.now();

    // Log task start
    this.addStep(context, {
      type: 'task_start',
      taskId: task.id,
      agentId: agent.id,
      agentName: agent.name,
      content: `Starting task: ${task.name || task.description.substring(0, 50)}...`
    });

    // Interpolate variables in task description
    let taskDescription = this.interpolateVariables(task.description, context.inputs);
    let expectedOutput = this.interpolateVariables(task.expectedOutput, context.inputs);

    // Build agent prompt
    const systemPrompt = this.buildAgentSystemPrompt(agent, crew);
    const userPrompt = this.buildTaskPrompt(task, taskDescription, expectedOutput, taskContext);

    // Log agent thinking
    this.addStep(context, {
      type: 'agent_thinking',
      taskId: task.id,
      agentId: agent.id,
      agentName: agent.name,
      content: `${agent.name} is working on the task...`
    });

    // Execute with LLM
    let result: string;
    let iterations = 0;
    const maxIterations = agent.config?.maxIter || 25;

    try {
      // Initial LLM call
      const response = await this.openRouter.complete({
        model: agent.llm?.model || 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: agent.llm?.temperature || 0.7,
        max_tokens: 4000
      });

      result = response.content;

      // Check if agent wants to use tools
      if (agent.tools && agent.tools.length > 0) {
        // Simple tool detection - in production, use function calling
        const toolMentions = agent.tools.filter(tool => 
          result.toLowerCase().includes(tool.toLowerCase()) ||
          result.includes('I need to use') ||
          result.includes('Let me search') ||
          result.includes('I will read')
        );

        for (const toolName of toolMentions) {
          this.addStep(context, {
            type: 'tool_call',
            taskId: task.id,
            agentId: agent.id,
            agentName: agent.name,
            toolName,
            content: `Using tool: ${toolName}`
          });

          // Execute tool (simplified - would integrate with actual tools)
          const toolResult = await this.executeTool(toolName, {}, context);

          this.addStep(context, {
            type: 'tool_result',
            taskId: task.id,
            agentId: agent.id,
            toolName,
            content: `Tool ${toolName} completed`,
            metadata: { result: toolResult }
          });
        }
      }

      // Log agent response
      this.addStep(context, {
        type: 'agent_response',
        taskId: task.id,
        agentId: agent.id,
        agentName: agent.name,
        content: result.substring(0, 500) + (result.length > 500 ? '...' : '')
      });

    } catch (error: any) {
      this.addStep(context, {
        type: 'error',
        taskId: task.id,
        agentId: agent.id,
        agentName: agent.name,
        content: `Error: ${error.message}`
      });
      throw error;
    }

    const taskDuration = Date.now() - taskStartTime;

    // Log task complete
    this.addStep(context, {
      type: 'task_complete',
      taskId: task.id,
      agentId: agent.id,
      agentName: agent.name,
      content: `Task completed in ${Math.round(taskDuration / 1000)}s`,
      duration: taskDuration
    });

    return {
      taskId: task.id,
      agentId: agent.id,
      output: result,
      duration: taskDuration
    };
  }

  // ==================== TOOL EXECUTION ====================

  private async executeTool(
    toolName: string,
    params: any,
    context: ExecutionContext
  ): Promise<any> {
    // Map tool names to implementations
    switch (toolName) {
      case 'FileReadTool':
        return this.executeFileReadTool(params, context);
      
      case 'web_search':
      case 'SerperDevTool':
        return this.executeWebSearchTool(params, context);
      
      case 'ScrapeWebsiteTool':
        return this.executeScrapeWebsiteTool(params, context);
      
      case 'database_query':
        return this.executeDatabaseQueryTool(params, context);
      
      default:
        return { result: `Tool ${toolName} executed (mock)`, success: true };
    }
  }

  private async executeFileReadTool(params: any, context: ExecutionContext): Promise<any> {
    try {
      // Read from workspace files
      const file = await prisma.deliverable.findFirst({
        where: {
          workspace_id: context.workspaceId,
          id: params.fileId
        }
      });

      if (file) {
        return { content: file.content, success: true };
      }

      return { error: 'File not found', success: false };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }

  private async executeWebSearchTool(params: any, context: ExecutionContext): Promise<any> {
    // Integrate with your search API
    try {
      const query = params.query || params.search_query;
      
      // Mock search results - replace with actual API
      return {
        results: [
          { title: 'Search Result 1', snippet: 'Sample search result...', url: 'https://example.com/1' },
          { title: 'Search Result 2', snippet: 'Another result...', url: 'https://example.com/2' }
        ],
        success: true
      };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }

  private async executeScrapeWebsiteTool(params: any, context: ExecutionContext): Promise<any> {
    try {
      const url = params.url;
      
      // In production, use puppeteer or similar
      const response = await fetch(url);
      const html = await response.text();
      
      return {
        content: html.substring(0, 5000),
        success: true
      };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }

  private async executeDatabaseQueryTool(params: any, context: ExecutionContext): Promise<any> {
    try {
      const { model, operation, where, data } = params;
      
      // Security: scope to workspace
      const secureWhere = {
        ...where,
        workspace_id: context.workspaceId
      };

      const result = await (prisma as any)[model][operation]({
        where: secureWhere,
        data
      });

      return { result, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }

  // ==================== HELPER METHODS ====================

  private buildAgentSystemPrompt(agent: AgentConfig, crew: CrewConfig): string {
    return `You are ${agent.name}, a ${agent.role}.

Your Goal: ${agent.goal}

Your Backstory: ${agent.backstory}

${agent.tools && agent.tools.length > 0 ? `
You have access to these tools:
${agent.tools.map(t => `- ${t}`).join('\n')}

When you need to use a tool, clearly state which tool you're using and why.
` : ''}

Guidelines:
- Focus on achieving your goal efficiently
- Be thorough but concise in your responses
- If you encounter obstacles, explain them clearly
- Provide actionable outputs that can be used by other team members

You are part of the "${crew.name}" crew working on: ${crew.description || 'various tasks'}`;
  }

  private buildTaskPrompt(
    task: TaskConfig,
    description: string,
    expectedOutput: string,
    context: any[]
  ): string {
    let prompt = `## Your Task

${description}

## Expected Output

${expectedOutput}`;

    if (context && context.length > 0) {
      prompt += `

## Context from Previous Tasks

${context.map((c, i) => `### Previous Task ${i + 1} Output:
${typeof c === 'object' ? (c.output || JSON.stringify(c)) : c}`).join('\n\n')}`;
    }

    prompt += `

Please complete this task thoroughly and provide your output in a clear, structured format.`;

    return prompt;
  }

  private interpolateVariables(text: string, inputs: Record<string, any>): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return inputs[key] !== undefined ? String(inputs[key]) : match;
    });
  }

  private getTaskLevels(tasks: TaskConfig[]): TaskConfig[][] {
    const levels: TaskConfig[][] = [];
    const completed = new Set<string>();
    const remaining = [...tasks];

    while (remaining.length > 0) {
      const level: TaskConfig[] = [];

      for (let i = remaining.length - 1; i >= 0; i--) {
        const task = remaining[i];
        const dependencies = task.context || [];
        
        // Check if all dependencies are completed
        if (dependencies.every(dep => completed.has(dep))) {
          level.push(task);
          remaining.splice(i, 1);
        }
      }

      if (level.length === 0 && remaining.length > 0) {
        // Circular dependency or missing dependency - add remaining
        level.push(...remaining);
        remaining.length = 0;
      }

      // Mark level tasks as completed
      level.forEach(t => completed.add(t.id));
      levels.push(level);
    }

    return levels;
  }

  private addStep(context: ExecutionContext, step: Omit<ExecutionStep, 'id' | 'timestamp'>): ExecutionStep {
    const fullStep: ExecutionStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...step
    };

    context.steps.push(fullStep);
    
    // Notify listener if provided
    if (context.onStep) {
      context.onStep(fullStep);
    }

    return fullStep;
  }

  // ==================== DATABASE OPERATIONS ====================

  private async createExecutionRecord(
    executionId: string,
    crew: CrewConfig,
    workspaceId: string,
    userId: string,
    inputs: Record<string, any>
  ): Promise<void> {
    await prisma.deliverable.create({
      data: {
        title: `Execution: ${crew.name}`,
        content: JSON.stringify({
          executionId,
          crewId: crew.id,
          crewName: crew.name,
          status: 'running',
          startTime: new Date().toISOString(),
          agents: crew.agents.map(a => ({ id: a.id, name: a.name, role: a.role })),
          tasks: crew.tasks.map(t => ({ id: t.id, name: t.name, description: t.description?.substring(0, 100) })),
          inputs,
          steps: []
        }),
        type: 'crew_execution',
        workspace_id: workspaceId,
        user_id: userId,
        metadata: {
          executionId,
          crewId: crew.id,
          status: 'running'
        }
      }
    });
  }

  private async updateExecutionRecord(
    executionId: string,
    updates: any
  ): Promise<void> {
    const execution = await prisma.deliverable.findFirst({
      where: {
        type: 'crew_execution',
        metadata: {
          path: ['executionId'],
          equals: executionId
        }
      }
    });

    if (execution) {
      const currentContent = JSON.parse(execution.content);
      
      await prisma.deliverable.update({
        where: { id: execution.id },
        data: {
          content: JSON.stringify({
            ...currentContent,
            ...updates
          }),
          metadata: {
            ...(execution.metadata as any),
            status: updates.status
          }
        }
      });
    }
  }

  // ==================== STREAMING EXECUTION ====================

  async *executeCrewStreaming(
    crew: CrewConfig,
    workspaceId: string,
    userId: string,
    inputs: Record<string, any> = {}
  ): AsyncGenerator<ExecutionStep, ExecutionResult, unknown> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    const context: ExecutionContext = {
      executionId,
      workspaceId,
      userId,
      inputs,
      taskResults: new Map(),
      agentMemory: new Map(),
      steps: []
    };

    // Create execution record
    await this.createExecutionRecord(executionId, crew, workspaceId, userId, inputs);

    try {
      // Execute each task and yield steps
      for (const task of crew.tasks) {
        const agent = crew.agents.find(a => a.id === task.assignedAgentId);
        
        if (!agent) {
          const errorStep = this.addStep(context, {
            type: 'error',
            taskId: task.id,
            content: `Agent ${task.assignedAgentId} not found`
          });
          yield errorStep;
          continue;
        }

        // Gather context
        const taskContext: any[] = [];
        if (task.context && task.context.length > 0) {
          for (const depTaskId of task.context) {
            const depResult = context.taskResults.get(depTaskId);
            if (depResult) taskContext.push(depResult);
          }
        }

        // Yield task start
        const startStep = this.addStep(context, {
          type: 'task_start',
          taskId: task.id,
          agentId: agent.id,
          agentName: agent.name,
          content: `Starting: ${task.name || task.description.substring(0, 50)}...`
        });
        yield startStep;

        // Execute task
        const result = await this.executeTask(task, agent, crew, context, taskContext);
        context.taskResults.set(task.id, result);

        // Yield all steps that were added during execution
        for (const step of context.steps.slice(-5)) {
          yield step;
        }
      }

      const endTime = new Date();

      // Update execution record
      await this.updateExecutionRecord(executionId, {
        status: 'completed',
        endTime: endTime.toISOString(),
        totalDuration: endTime.getTime() - startTime.getTime(),
        taskResults: Object.fromEntries(context.taskResults),
        steps: context.steps
      });

      return {
        executionId,
        status: 'completed',
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        taskResults: Object.fromEntries(context.taskResults),
        finalOutput: context.taskResults.get(crew.tasks[crew.tasks.length - 1]?.id),
        steps: context.steps
      };

    } catch (error: any) {
      const endTime = new Date();

      await this.updateExecutionRecord(executionId, {
        status: 'failed',
        endTime: endTime.toISOString(),
        error: error.message,
        steps: context.steps
      });

      return {
        executionId,
        status: 'failed',
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        taskResults: Object.fromEntries(context.taskResults),
        finalOutput: null,
        steps: context.steps,
        error: error.message
      };
    }
  }
}

export default CrewExecutionService;