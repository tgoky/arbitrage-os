// services/agent-runtime/UniversalAgentPlatform.ts
import { Redis } from '@upstash/redis';
import { prisma } from '@/lib/prisma';
import { OpenRouterClient } from '@/lib/openrouter';

// ==================== UNIVERSAL TYPES ====================

interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  avatar?: string;
  color?: string;
  tools: ToolDefinition[];
  allowDelegation?: boolean;
  maxIterations?: number;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  category: 'research' | 'communication' | 'data' | 'file' | 'web' | 'custom';
  execute: (params: any, context: AgentContext) => Promise<any>;
}

interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

interface TaskDefinition {
  id: string;
  description: string;
  expectedOutput: string;
  assignedAgentId: string;
  context?: any;
  dependencies?: string[];
  async?: boolean; // Can run in parallel
}

interface CrewDefinition {
  id: string;
  name: string;
  description: string;
  category: string; // 'marketing', 'sales', 'research', 'content', 'data', 'custom'
  agents: AgentDefinition[];
  tasks: TaskDefinition[];
  process: 'sequential' | 'hierarchical' | 'parallel';
  verbose?: boolean;
  memory?: boolean;
}

interface AgentContext {
  conversationId?: string;
  workspaceId: string;
  userId: string;
  sharedMemory: Map<string, any>;
  userVariables: Map<string, any>;
}

// ==================== TOOL REGISTRY ====================

export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  static registerTool(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
    console.log(`🔧 Registered tool: ${tool.name}`);
  }

  static getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  static getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  static getToolsByCategory(category: string): ToolDefinition[] {
    return Array.from(this.tools.values()).filter(t => t.category === category);
  }

  static searchTools(query: string): ToolDefinition[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tools.values()).filter(
      t => t.name.toLowerCase().includes(lowerQuery) ||
           t.description.toLowerCase().includes(lowerQuery)
    );
  }
}

// ==================== BUILT-IN TOOLS ====================

// Research Tools
ToolRegistry.registerTool({
  name: 'web_search',
  description: 'Search the web for current information',
  category: 'research',
  parameters: [
    { name: 'query', type: 'string', description: 'Search query', required: true },
    { name: 'num_results', type: 'number', description: 'Number of results', required: false, default: 5 }
  ],
  execute: async (params, context) => {
    // Integrate with your preferred search API (Google, Bing, etc.)
    const response = await fetch(`https://api.search.com/search?q=${encodeURIComponent(params.query)}`);
    const data = await response.json();
    return data.results;
  }
});

ToolRegistry.registerTool({
  name: 'web_scrape',
  description: 'Scrape content from a webpage',
  category: 'research',
  parameters: [
    { name: 'url', type: 'string', description: 'URL to scrape', required: true },
    { name: 'selector', type: 'string', description: 'CSS selector (optional)', required: false }
  ],
  execute: async (params, context) => {
    // Use Cheerio or Puppeteer for scraping
    const response = await fetch(params.url);
    const html = await response.text();
    // Parse with cheerio or similar
    return { content: html.substring(0, 5000) }; // Truncate for token limits
  }
});

// Data Tools
ToolRegistry.registerTool({
  name: 'database_query',
  description: 'Query the workspace database',
  category: 'data',
  parameters: [
    { name: 'model', type: 'string', description: 'Database model name', required: true },
    { name: 'operation', type: 'string', description: 'findMany, findUnique, create, update', required: true },
    { name: 'where', type: 'object', description: 'Query conditions', required: false },
    { name: 'data', type: 'object', description: 'Data for create/update', required: false }
  ],
  execute: async (params, context) => {
    const { model, operation, where, data } = params;
    
    // Security: Only allow queries for user's workspace
    const secureWhere = {
      ...where,
      workspace_id: context.workspaceId
    };

    const result = await (prisma as any)[model][operation]({
      where: secureWhere,
      data
    });

    return result;
  }
});

ToolRegistry.registerTool({
  name: 'read_file',
  description: 'Read file contents from workspace storage',
  category: 'file',
  parameters: [
    { name: 'fileId', type: 'string', description: 'File ID or path', required: true }
  ],
  execute: async (params, context) => {
    // Read from your file storage system
    const file = await prisma.deliverable.findFirst({
      where: {
        id: params.fileId,
        workspace_id: context.workspaceId
      }
    });

    if (!file) throw new Error('File not found');

    return { content: file.content };
  }
});

ToolRegistry.registerTool({
  name: 'write_file',
  description: 'Write content to a file in workspace',
  category: 'file',
  parameters: [
    { name: 'filename', type: 'string', description: 'File name', required: true },
    { name: 'content', type: 'string', description: 'File content', required: true },
    { name: 'type', type: 'string', description: 'File type', required: false }
  ],
  execute: async (params, context) => {
    const file = await prisma.deliverable.create({
      data: {
        title: params.filename,
        content: params.content,
        type: params.type || 'document',
        workspace_id: context.workspaceId,
        user_id: context.userId
      }
    });

    return { fileId: file.id, success: true };
  }
});

// Communication Tools
ToolRegistry.registerTool({
  name: 'send_email',
  description: 'Send an email using workspace email account',
  category: 'communication',
  parameters: [
    { name: 'to', type: 'string', description: 'Recipient email', required: true },
    { name: 'subject', type: 'string', description: 'Email subject', required: true },
    { name: 'body', type: 'string', description: 'Email body', required: true },
    { name: 'emailAccountId', type: 'string', description: 'Email account ID', required: false }
  ],
  execute: async (params, context) => {
    const { EmailConnectionService } = await import('@/services/emailConnection.service');
    const emailService = new EmailConnectionService();

    // Get first available email account if not specified
    let accountId = params.emailAccountId;
    if (!accountId) {
      const accounts = await emailService.getWorkspaceEmailAccounts(context.workspaceId);
      if (accounts.length === 0) {
        throw new Error('No email account connected');
      }
      accountId = accounts[0].id;
    }

    await emailService.sendEmail(
      accountId,
      params.to,
      params.subject,
      params.body
    );

    return { sent: true, to: params.to };
  }
});

ToolRegistry.registerTool({
  name: 'send_slack_message',
  description: 'Send a message to Slack',
  category: 'communication',
  parameters: [
    { name: 'channel', type: 'string', description: 'Slack channel', required: true },
    { name: 'message', type: 'string', description: 'Message text', required: true },
    { name: 'webhook_url', type: 'string', description: 'Slack webhook URL', required: false }
  ],
  execute: async (params, context) => {
    const webhookUrl = params.webhook_url || context.userVariables.get('slack_webhook');
    
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: params.channel,
        text: params.message
      })
    });

    return { sent: true };
  }
});

// Web/API Tools
ToolRegistry.registerTool({
  name: 'http_request',
  description: 'Make HTTP request to any API',
  category: 'web',
  parameters: [
    { name: 'url', type: 'string', description: 'API URL', required: true },
    { name: 'method', type: 'string', description: 'HTTP method (GET, POST, etc.)', required: false, default: 'GET' },
    { name: 'headers', type: 'object', description: 'HTTP headers', required: false },
    { name: 'body', type: 'object', description: 'Request body', required: false }
  ],
  execute: async (params, context) => {
    const response = await fetch(params.url, {
      method: params.method || 'GET',
      headers: params.headers || {},
      body: params.body ? JSON.stringify(params.body) : undefined
    });

    const data = await response.json();

    return { status: response.status, data };
  }
});

// Custom User Tools (users can add their own)
ToolRegistry.registerTool({
  name: 'custom_action',
  description: 'Execute custom user-defined action',
  category: 'custom',
  parameters: [
    { name: 'actionName', type: 'string', description: 'Custom action name', required: true },
    { name: 'params', type: 'object', description: 'Action parameters', required: false }
  ],
  execute: async (params, context) => {
    // Load custom action from database
    const action = await prisma.deliverable.findFirst({
      where: {
        workspace_id: context.workspaceId,
        type: 'custom_action',
        title: params.actionName
      }
    });

    if (!action) {
      throw new Error(`Custom action ${params.actionName} not found`);
    }

    const actionConfig = JSON.parse(action.content);

    // Execute custom action logic
    // This could be a webhook call, n8n trigger, etc.
    return { executed: true, result: actionConfig };
  }
});

// ==================== CREW TEMPLATES ====================

export class CrewTemplates {
  private static templates: Map<string, CrewDefinition> = new Map();

  static registerTemplate(crew: CrewDefinition) {
    this.templates.set(crew.id, crew);
    console.log(`📋 Registered crew template: ${crew.name}`);
  }

  static getTemplate(id: string): CrewDefinition | undefined {
    return this.templates.get(id);
  }

  static getAllTemplates(): CrewDefinition[] {
    return Array.from(this.templates.values());
  }

  static getTemplatesByCategory(category: string): CrewDefinition[] {
    return Array.from(this.templates.values()).filter(c => c.category === category);
  }
}

// ==================== EXAMPLE CREW TEMPLATES ====================

// 1. Blog Writing Crew
CrewTemplates.registerTemplate({
  id: 'blog_writing_crew',
  name: 'Blog Writing Auto',
  description: 'Research and write SEO-optimized blog posts',
  category: 'content',
  process: 'sequential',
  agents: [
    {
      id: 'researcher',
      name: 'Research Specialist',
      role: 'Content Researcher',
      goal: 'Find accurate, relevant information on the topic',
      backstory: 'Expert at finding credible sources and synthesizing information',
      tools: [
        ToolRegistry.getTool('web_search')!,
        ToolRegistry.getTool('web_scrape')!
      ]
    },
    {
      id: 'writer',
      name: 'Content Writer',
      role: 'Blog Post Writer',
      goal: 'Write engaging, SEO-optimized blog posts',
      backstory: 'Award-winning content writer with 10 years of experience',
      tools: [
        ToolRegistry.getTool('write_file')!
      ]
    },
    {
      id: 'editor',
      name: 'Editor',
      role: 'Content Editor',
      goal: 'Ensure quality, consistency, and SEO optimization',
      backstory: 'Meticulous editor focused on clarity and impact',
      tools: []
    }
  ],
  tasks: [
    {
      id: 'research',
      description: 'Research {{topic}} and gather key information, statistics, and expert opinions',
      expectedOutput: 'Comprehensive research summary with sources',
      assignedAgentId: 'researcher'
    },
    {
      id: 'write',
      description: 'Write a 1500-word blog post on {{topic}} using the research',
      expectedOutput: 'Complete blog post in markdown format',
      assignedAgentId: 'writer',
      dependencies: ['research']
    },
    {
      id: 'edit',
      description: 'Review and improve the blog post for clarity, SEO, and engagement',
      expectedOutput: 'Final edited blog post',
      assignedAgentId: 'editor',
      dependencies: ['write']
    }
  ]
});

// 2. Market Research Crew
CrewTemplates.registerTemplate({
  id: 'market_research_crew',
  name: 'Market Research Auto',
  description: 'Conduct comprehensive market analysis',
  category: 'research',
  process: 'parallel',
  agents: [
    {
      id: 'competitor_analyst',
      name: 'Competitor Analyst',
      role: 'Competitive Intelligence Specialist',
      goal: 'Analyze competitors and market positioning',
      backstory: 'Expert at competitive analysis and market intelligence',
      tools: [
        ToolRegistry.getTool('web_search')!,
        ToolRegistry.getTool('web_scrape')!
      ]
    },
    {
      id: 'trend_analyst',
      name: 'Trend Analyst',
      role: 'Market Trend Researcher',
      goal: 'Identify emerging trends and opportunities',
      backstory: 'Data-driven analyst focused on market trends',
      tools: [
        ToolRegistry.getTool('web_search')!,
        ToolRegistry.getTool('http_request')!
      ]
    },
    {
      id: 'report_writer',
      name: 'Report Writer',
      role: 'Business Analyst',
      goal: 'Synthesize findings into actionable insights',
      backstory: 'Strategic thinker who translates data into recommendations',
      tools: [
        ToolRegistry.getTool('write_file')!
      ]
    }
  ],
  tasks: [
    {
      id: 'competitor_analysis',
      description: 'Analyze top 5 competitors in {{industry}} for {{company}}',
      expectedOutput: 'Competitor analysis report with strengths, weaknesses, and market share',
      assignedAgentId: 'competitor_analyst',
      async: true
    },
    {
      id: 'trend_analysis',
      description: 'Identify emerging trends in {{industry}} for next 12 months',
      expectedOutput: 'Trend analysis with opportunities and threats',
      assignedAgentId: 'trend_analyst',
      async: true
    },
    {
      id: 'final_report',
      description: 'Create comprehensive market research report combining competitor and trend analysis',
      expectedOutput: 'Executive summary with actionable recommendations',
      assignedAgentId: 'report_writer',
      dependencies: ['competitor_analysis', 'trend_analysis']
    }
  ]
});

// 3. Customer Support Crew
CrewTemplates.registerTemplate({
  id: 'customer_support_crew',
  name: 'Customer Support Auto',
  description: 'Automated customer support and ticket resolution',
  category: 'communication',
  process: 'sequential',
  agents: [
    {
      id: 'ticket_classifier',
      name: 'Ticket Classifier',
      role: 'Support Ticket Analyst',
      goal: 'Classify and prioritize support tickets',
      backstory: 'Expert at understanding customer issues and routing them appropriately',
      tools: [
        ToolRegistry.getTool('database_query')!
      ]
    },
    {
      id: 'solution_finder',
      name: 'Solution Finder',
      role: 'Technical Support Specialist',
      goal: 'Find solutions to customer problems',
      backstory: 'Experienced support engineer with deep product knowledge',
      tools: [
        ToolRegistry.getTool('web_search')!,
        ToolRegistry.getTool('read_file')!
      ]
    },
    {
      id: 'response_writer',
      name: 'Response Writer',
      role: 'Customer Success Manager',
      goal: 'Write helpful, empathetic responses to customers',
      backstory: 'Skilled communicator focused on customer satisfaction',
      tools: [
        ToolRegistry.getTool('send_email')!
      ]
    }
  ],
  tasks: [
    {
      id: 'classify',
      description: 'Classify support ticket {{ticketId}} by urgency and category',
      expectedOutput: 'Ticket classification with priority and category',
      assignedAgentId: 'ticket_classifier'
    },
    {
      id: 'find_solution',
      description: 'Find solution for the classified ticket',
      expectedOutput: 'Detailed solution with steps',
      assignedAgentId: 'solution_finder',
      dependencies: ['classify']
    },
    {
      id: 'respond',
      description: 'Write and send response to customer',
      expectedOutput: 'Customer response sent',
      assignedAgentId: 'response_writer',
      dependencies: ['find_solution']
    }
  ]
});

// 4. Data Analysis Crew
CrewTemplates.registerTemplate({
  id: 'data_analysis_crew',
  name: 'Data Analysis Auto',
  description: 'Analyze data and generate insights',
  category: 'data',
  process: 'sequential',
  agents: [
    {
      id: 'data_collector',
      name: 'Data Collector',
      role: 'Data Engineer',
      goal: 'Collect and prepare data for analysis',
      backstory: 'Expert at data extraction and transformation',
      tools: [
        ToolRegistry.getTool('database_query')!,
        ToolRegistry.getTool('http_request')!,
        ToolRegistry.getTool('read_file')!
      ]
    },
    {
      id: 'analyst',
      name: 'Data Analyst',
      role: 'Business Intelligence Analyst',
      goal: 'Analyze data and find patterns',
      backstory: 'Statistical expert skilled at finding insights in data',
      tools: []
    },
    {
      id: 'visualizer',
      name: 'Data Visualizer',
      role: 'Data Visualization Specialist',
      goal: 'Create compelling visualizations',
      backstory: 'Designer who makes data easy to understand',
      tools: [
        ToolRegistry.getTool('write_file')!
      ]
    }
  ],
  tasks: [
    {
      id: 'collect',
      description: 'Collect {{dataType}} data from {{source}}',
      expectedOutput: 'Clean, structured dataset',
      assignedAgentId: 'data_collector'
    },
    {
      id: 'analyze',
      description: 'Analyze the collected data for {{goal}}',
      expectedOutput: 'Statistical analysis with key findings',
      assignedAgentId: 'analyst',
      dependencies: ['collect']
    },
    {
      id: 'visualize',
      description: 'Create visualizations and report',
      expectedOutput: 'Interactive dashboard or report',
      assignedAgentId: 'visualizer',
      dependencies: ['analyze']
    }
  ]
});

// 5. Social Media Manager Crew
CrewTemplates.registerTemplate({
  id: 'social_media_crew',
  name: 'Social Media Manager Auto',
  description: 'Plan and execute social media strategy',
  category: 'marketing',
  process: 'sequential',
  agents: [
    {
      id: 'strategist',
      name: 'Social Media Strategist',
      role: 'Social Media Strategy Expert',
      goal: 'Plan engaging social media campaigns',
      backstory: 'Marketing expert with proven track record of viral content',
      tools: [
        ToolRegistry.getTool('web_search')!
      ]
    },
    {
      id: 'content_creator',
      name: 'Content Creator',
      role: 'Social Media Content Writer',
      goal: 'Create engaging posts for each platform',
      backstory: 'Creative writer who understands platform-specific best practices',
      tools: [
        ToolRegistry.getTool('write_file')!
      ]
    },
    {
      id: 'scheduler',
      name: 'Post Scheduler',
      role: 'Social Media Manager',
      goal: 'Schedule posts for optimal engagement',
      backstory: 'Data-driven manager who knows the best times to post',
      tools: [
        ToolRegistry.getTool('http_request')!,
        ToolRegistry.getTool('database_query')!
      ]
    }
  ],
  tasks: [
    {
      id: 'strategy',
      description: 'Create 7-day social media strategy for {{brand}} targeting {{audience}}',
      expectedOutput: 'Content calendar with themes and topics',
      assignedAgentId: 'strategist'
    },
    {
      id: 'create_content',
      description: 'Write posts for each day based on the strategy',
      expectedOutput: 'Platform-specific posts (Twitter, LinkedIn, Instagram)',
      assignedAgentId: 'content_creator',
      dependencies: ['strategy']
    },
    {
      id: 'schedule',
      description: 'Schedule all posts at optimal times',
      expectedOutput: 'Posts scheduled with confirmation',
      assignedAgentId: 'scheduler',
      dependencies: ['create_content']
    }
  ]
});

// 6. Email Lead Outreach Crew (Your original one)
CrewTemplates.registerTemplate({
  id: 'email_lead_crew',
  name: 'Email Lead Outreach Auto',
  description: 'Research leads and execute email campaigns',
  category: 'sales',
  process: 'sequential',
  agents: [
    {
      id: 'researcher',
      name: 'Lead Researcher',
      role: 'Lead Research Specialist',
      goal: 'Find and qualify high-value leads',
      backstory: 'Expert at B2B lead research and qualification',
      tools: [
        ToolRegistry.getTool('web_search')!,
        ToolRegistry.getTool('database_query')!
      ]
    },
    {
      id: 'copywriter',
      name: 'Email Copywriter',
      role: 'Cold Email Expert',
      goal: 'Write personalized, high-converting emails',
      backstory: 'Master of persuasive B2B email copy',
      tools: []
    },
    {
      id: 'campaign_manager',
      name: 'Campaign Manager',
      role: 'Email Campaign Orchestrator',
      goal: 'Execute and track email campaigns',
      backstory: 'Expert at email deliverability and campaign management',
      tools: [
        ToolRegistry.getTool('send_email')!,
        ToolRegistry.getTool('database_query')!
      ]
    }
  ],
  tasks: [
    {
      id: 'research',
      description: 'Research and qualify leads for {{campaign}}',
      expectedOutput: 'List of qualified leads with insights',
      assignedAgentId: 'researcher'
    },
    {
      id: 'write_emails',
      description: 'Write personalized email templates',
      expectedOutput: 'Email templates with personalization',
      assignedAgentId: 'copywriter',
      dependencies: ['research']
    },
    {
      id: 'send_campaign',
      description: 'Create and execute email campaign',
      expectedOutput: 'Campaign execution report',
      assignedAgentId: 'campaign_manager',
      dependencies: ['write_emails']
    }
  ]
});