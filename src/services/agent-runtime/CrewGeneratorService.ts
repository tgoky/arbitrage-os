// services/agent-runtime/CrewGeneratorService.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { prisma } from '@/lib/prisma';
import { ToolRegistry } from './UniversalAgentPlatform';

interface GenerationRequest {
  userPrompt: string;
  workspaceId: string;
  userId: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface GeneratedCrew {
  name: string;
  description: string;
  agents: Array<{
    id: string;
    name: string;
    role: string;
    goal: string;
    backstory: string;
    tools: string[]; // Tool IDs
    avatar?: string;
    color?: string;
  }>;
  tasks: Array<{
    id: string;
    description: string;
    expectedOutput: string;
    assignedAgentId: string;
    dependencies?: string[];
  }>;
  process: 'sequential' | 'hierarchical' | 'parallel';
  variables?: Record<string, any>;
}

export class CrewGeneratorService {
  private openRouter: OpenRouterClient;

  constructor() {
    this.openRouter = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
  }

  // ==================== MAIN GENERATION METHOD ====================

  async generateCrewFromPrompt(request: GenerationRequest): Promise<GeneratedCrew> {
    console.log(`🧠 Generating crew from prompt: ${request.userPrompt}`);

    // Step 1: Analyze user intent
    const intent = await this.analyzeIntent(request.userPrompt);

    // Step 2: Select relevant tools
    const relevantTools = await this.selectRelevantTools(intent, request.workspaceId);

    // Step 3: Generate crew structure
    const crew = await this.generateCrewStructure(
      request.userPrompt,
      intent,
      relevantTools,
      request.conversationHistory
    );

    // Step 4: Validate and refine
    const validatedCrew = await this.validateCrew(crew);

    console.log(` Generated crew: ${validatedCrew.name}`);

    return validatedCrew;
  }

  // ==================== STEP 1: INTENT ANALYSIS ====================

  private async analyzeIntent(userPrompt: string): Promise<{
    category: string;
    complexity: 'simple' | 'medium' | 'complex';
    requiredCapabilities: string[];
    suggestedAgentCount: number;
    keywords: string[];
  }> {
    const systemPrompt = `You are an AI crew planning expert. Analyze the user's request and determine:
1. What category of work is this? (content, research, sales, marketing, data, communication, automation)
2. How complex is this? (simple, medium, complex)
3. What capabilities are needed? (web_search, email, database, file_operations, etc.)
4. How many agents are recommended? (1-5)
5. Key keywords from the request

Respond ONLY with valid JSON in this exact format:
{
  "category": "string",
  "complexity": "simple|medium|complex",
  "requiredCapabilities": ["capability1", "capability2"],
  "suggestedAgentCount": number,
  "keywords": ["keyword1", "keyword2"]
}`;

    const response = await this.openRouter.complete({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    let intent;
    try {
      // Extract JSON from response
      const content = response.content;
      
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      intent = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse intent:', error);
      // Fallback to defaults
      intent = {
        category: 'automation',
        complexity: 'medium',
        requiredCapabilities: ['web_search', 'database_query'],
        suggestedAgentCount: 2,
        keywords: userPrompt.split(' ').slice(0, 5)
      };
    }

    console.log('🎯 Intent Analysis:', intent);

    return intent;
  }

  // ==================== STEP 2: TOOL SELECTION ====================

  private async selectRelevantTools(
    intent: any,
    workspaceId: string
  ): Promise<Array<{ id: string; name: string; description: string; category: string }>> {
    // Get all available tools
    const allTools = ToolRegistry.getAllTools();

    // Load custom tools for this workspace
    const customTools = await prisma.deliverable.findMany({
      where: {
        workspace_id: workspaceId,
        type: 'custom_tool'
      }
    });

    const customToolsParsed = customTools.map(ct => {
      const content = JSON.parse(ct.content);
      return {
        id: ct.id,
        name: content.name,
        description: content.description,
        category: 'custom'
      };
    });

    const allAvailableTools = [
      ...allTools.map(t => ({
        id: t.name,
        name: t.name,
        description: t.description,
        category: t.category
      })),
      ...customToolsParsed
    ];

    // Use AI to select most relevant tools
    const systemPrompt = `You are a tool selection expert. Given the user's intent and available tools, select the 5-10 most relevant tools.

User Intent:
${JSON.stringify(intent, null, 2)}

Available Tools:
${allAvailableTools.slice(0, 50).map(t => `- ${t.id}: ${t.description}`).join('\n')}

Return ONLY a JSON object with this format:
{
  "tools": ["tool_id_1", "tool_id_2", "tool_id_3"]
}`;

    const response = await this.openRouter.complete({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Select the most relevant tools.' }
      ],
      temperature: 0.2,
      max_tokens: 500
    });

    let selectedToolIds: string[] = [];
    try {
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        selectedToolIds = parsed.tools || [];
      }
    } catch (error) {
      console.error('Failed to parse tool selection:', error);
      // Fallback: select based on capabilities
      selectedToolIds = allAvailableTools
        .filter(t => intent.requiredCapabilities.some((cap: string) => 
          t.name.toLowerCase().includes(cap.toLowerCase()) ||
          t.description.toLowerCase().includes(cap.toLowerCase())
        ))
        .slice(0, 8)
        .map(t => t.id);
    }

    const selectedTools = allAvailableTools.filter(t => selectedToolIds.includes(t.id));

    // If no tools selected, add some defaults
    if (selectedTools.length === 0) {
      selectedTools.push(
        ...allAvailableTools.filter(t => 
          t.name === 'web_search' || 
          t.name === 'database_query' ||
          t.name === 'http_request'
        )
      );
    }

    console.log(`🔧 Selected ${selectedTools.length} relevant tools`);

    return selectedTools;
  }

  // ==================== STEP 3: CREW GENERATION ====================

  private async generateCrewStructure(
    userPrompt: string,
    intent: any,
    tools: any[],
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<GeneratedCrew> {
    const systemPrompt = `You are an expert at designing multi-agent AI systems. Create a crew of AI agents to accomplish the user's goal.

CRITICAL RULES:
1. Create ${intent.suggestedAgentCount} agents with distinct roles
2. Each agent needs: id, name, role, goal, backstory, and tools (from available tools list)
3. Create sequential tasks that build on each other
4. Each task must be assigned to an agent by their ID
5. Tasks can have dependencies (other task IDs)
6. Give agents personality through their backstory
7. Choose appropriate avatars (emojis)
8. Return ONLY valid JSON - no markdown, no explanations

Available Tools (use these IDs exactly):
${tools.map(t => `- ${t.id}: ${t.description}`).join('\n')}

YOU MUST RETURN THIS EXACT JSON STRUCTURE:
{
  "name": "Crew Name Here",
  "description": "What this crew does",
  "agents": [
    {
      "id": "agent_id_lowercase",
      "name": "Agent Display Name",
      "role": "Agent Role Title",
      "goal": "What this agent aims to achieve",
      "backstory": "Agent's background and expertise",
      "tools": ["tool_id_1", "tool_id_2"],
      "avatar": "🤖",
      "color": "#5CC49D"
    }
  ],
  "tasks": [
    {
      "id": "task_id_lowercase",
      "description": "Detailed task description with {{variables}} if needed",
      "expectedOutput": "What format/content the output should be",
      "assignedAgentId": "agent_id_that_exists",
      "dependencies": []
    }
  ],
  "process": "sequential",
  "variables": {}
}`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory.slice(-4)); // Last 2 turns
    }

    messages.push({
      role: 'user',
      content: `User Request: ${userPrompt}\n\nIntent: ${JSON.stringify(intent, null, 2)}\n\nCreate the crew configuration. Return ONLY the JSON object, no markdown.`
    });

    const response = await this.openRouter.complete({
      model: 'openai/gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 4000
    });

    let crewConfig: GeneratedCrew;

    try {
      const content = response.content;
      
      // Remove markdown code blocks
      let cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to extract JSON if it's embedded in text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }
      
      crewConfig = JSON.parse(cleanedContent);

      // Ensure required fields exist
      if (!crewConfig.name) crewConfig.name = 'Generated Crew';
      if (!crewConfig.description) crewConfig.description = 'AI-generated crew for automation';
      if (!crewConfig.agents) crewConfig.agents = [];
      if (!crewConfig.tasks) crewConfig.tasks = [];
      if (!crewConfig.process) crewConfig.process = 'sequential';
      if (!crewConfig.variables) crewConfig.variables = {};

    } catch (error) {
      console.error('Failed to parse crew config:', error);
      console.error('Raw response:', response.content);
      
      // Generate a minimal fallback crew
      crewConfig = this.generateFallbackCrew(userPrompt, tools);
    }

    console.log('🏗️ Generated crew structure:', crewConfig.name);

    return crewConfig;
  }

  // ==================== FALLBACK CREW ====================

  private generateFallbackCrew(userPrompt: string, tools: any[]): GeneratedCrew {
    console.log('⚠️ Using fallback crew generation');

    return {
      name: 'Automation Crew',
      description: `Crew to help with: ${userPrompt.substring(0, 100)}`,
      agents: [
        {
          id: 'executor',
          name: 'Task Executor',
          role: 'Automation Specialist',
          goal: 'Execute the requested automation task',
          backstory: 'An experienced automation expert who can handle various tasks efficiently.',
          tools: tools.slice(0, 3).map(t => t.id),
          avatar: '🤖',
          color: '#5CC49D'
        }
      ],
      tasks: [
        {
          id: 'main_task',
          description: userPrompt,
          expectedOutput: 'Completed task with results',
          assignedAgentId: 'executor',
          dependencies: []
        }
      ],
      process: 'sequential',
      variables: {}
    };
  }

  // ==================== STEP 4: VALIDATION ====================

  private async validateCrew(crew: GeneratedCrew): Promise<GeneratedCrew> {
    // Validate structure
    if (!crew.agents || crew.agents.length === 0) {
      throw new Error('Crew must have at least one agent');
    }

    if (!crew.tasks || crew.tasks.length === 0) {
      throw new Error('Crew must have at least one task');
    }

    // Ensure all task assignments are valid
    const agentIds = new Set(crew.agents.map(a => a.id));
    for (const task of crew.tasks) {
      if (!agentIds.has(task.assignedAgentId)) {
        console.warn(`Task ${task.id} assigned to non-existent agent ${task.assignedAgentId}, assigning to first agent`);
        task.assignedAgentId = crew.agents[0].id;
      }
    }

    // Validate task dependencies
    const taskIds = new Set(crew.tasks.map(t => t.id));
    for (const task of crew.tasks) {
      if (task.dependencies) {
        task.dependencies = task.dependencies.filter(depId => {
          if (!taskIds.has(depId)) {
            console.warn(`Task ${task.id} has invalid dependency ${depId}, removing`);
            return false;
          }
          return true;
        });
      }
    }

    // Ensure tools exist
    const allTools = ToolRegistry.getAllTools();
    const toolIds = new Set(allTools.map(t => t.name));

    for (const agent of crew.agents) {
      if (!agent.tools) {
        agent.tools = [];
      }
      agent.tools = agent.tools.filter(toolId => {
        if (!toolIds.has(toolId)) {
          console.warn(`Agent ${agent.id} has invalid tool ${toolId}, removing`);
          return false;
        }
        return true;
      });

      // Ensure each agent has at least one tool
      if (agent.tools.length === 0 && allTools.length > 0) {
        agent.tools = [allTools[0].name];
      }

      // Set defaults if missing
      if (!agent.avatar) agent.avatar = '🤖';
      if (!agent.color) agent.color = '#5CC49D';
    }

    console.log(' Crew validated successfully');

    return crew;
  }

  // ==================== ITERATIVE REFINEMENT ====================

  async refineCrewWithFeedback(
    currentCrew: GeneratedCrew,
    userFeedback: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<GeneratedCrew> {
    const systemPrompt = `You are refining an AI crew based on user feedback. 

Current Crew Configuration:
${JSON.stringify(currentCrew, null, 2)}

User Feedback: ${userFeedback}

Modify the crew configuration based on the feedback. Return the complete updated configuration in JSON format.
Return ONLY the JSON object, no markdown code blocks.`;

    const response = await this.openRouter.complete({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-4),
        { role: 'user', content: userFeedback }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    let refinedCrew: GeneratedCrew;

    try {
      const content = response.content;
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        refinedCrew = JSON.parse(jsonMatch[0]);
      } else {
        refinedCrew = JSON.parse(cleanedContent);
      }
    } catch (error) {
      console.error('Failed to parse refined crew:', error);
      // Return current crew if refinement fails
      refinedCrew = currentCrew;
    }

    return await this.validateCrew(refinedCrew);
  }

  // ==================== SAVE TO DATABASE ====================

  async saveGeneratedCrew(
    crew: GeneratedCrew,
    workspaceId: string,
    userId: string
  ): Promise<string> {
    const savedCrew = await prisma.deliverable.create({
      data: {
        title: crew.name,
        content: JSON.stringify(crew),
        type: 'agent_crew',
        workspace_id: workspaceId,
        user_id: userId,
        metadata: {
          category: 'custom',
          agentCount: crew.agents.length,
          taskCount: crew.tasks.length,
          isGenerated: true,
          generatedAt: new Date().toISOString()
        }
      }
    });

    console.log(`💾 Saved crew: ${savedCrew.id}`);

    return savedCrew.id;
  }
}