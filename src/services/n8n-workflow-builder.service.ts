// services/n8nWorkflowBuilder.service.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { 
  N8nWorkflowInput, 
  GeneratedWorkflowPackage, 
  N8nWorkflowConfig,
  N8nNode,
  RequiredCredential,
  WorkflowAnalysis,
  IntegrationTemplate,
  SavedWorkflow,
  WorkflowListItem,
  ExportFormat
} from '../types/n8nWorkflowBuilder';
import { Redis } from '@upstash/redis';

export class N8nWorkflowBuilderService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  async generateWorkflow(input: N8nWorkflowInput): Promise<GeneratedWorkflowPackage> {
    const startTime = Date.now();
    
    // Validate input
    if (!input.workflowName || input.integrations.length === 0) {
      throw new Error('Workflow name and at least one integration are required');
    }
    
    // Check cache first
    const cacheKey = this.generateCacheKey(input);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    // Generate comprehensive workflow
    const workflowPrompt = this.buildWorkflowPrompt(input);
    
    try {
      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: workflowPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8000
      });

      const workflowResults = this.parseWorkflowResponse(response.content, input);
      
      const workflowPackage: GeneratedWorkflowPackage = {
        ...workflowResults,
        tokensUsed: response.usage?.total_tokens || 0,
        processingTime: Date.now() - startTime
      };

      // Cache for 24 hours
      await this.redis.set(cacheKey, JSON.stringify(workflowPackage), { ex: 86400 });
      
      return workflowPackage;
    } catch (error) {
      console.error('Workflow generation failed:', error);
      // Return fallback workflow instead of throwing
      return this.generateFallbackWorkflow(input, Date.now() - startTime);
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert n8n workflow automation specialist with deep expertise in:
- n8n node configuration and best practices
- Integration patterns and API connections
- Workflow optimization and error handling
- Security and credential management
- Performance optimization and scalability

Your task is to generate production-ready n8n workflows that are:
- Properly structured with correct node types and parameters
- Secure with appropriate credential handling
- Error-resistant with proper exception handling
- Well-documented with clear setup instructions
- Optimized for performance and maintainability

You understand all n8n nodes, their parameters, and how to connect them effectively. You provide complete, functional workflows that users can import directly into n8n.

Focus on creating workflows that follow n8n best practices:
- Use appropriate node types for each integration
- Include proper error handling with Error Trigger nodes
- Set up conditional logic with IF nodes when needed
- Use Set nodes for data transformation
- Include proper credential references
- Add helpful node notes and descriptions
- Ensure proper connection flow between nodes
- Consider execution order and dependencies

Always provide complete, importable n8n JSON configurations along with detailed setup instructions.`;
  }

  private buildWorkflowPrompt(input: N8nWorkflowInput): string {
    const contextSection = this.buildContextSection(input);
    const requirementsSection = this.buildRequirementsSection(input);
    const generationRequest = this.buildGenerationRequest(input);

    return `${contextSection}${requirementsSection}${generationRequest}`;
  }

  private buildContextSection(input: N8nWorkflowInput): string {
    return `
N8N WORKFLOW GENERATION REQUEST

WORKFLOW CONTEXT:
- Name: ${input.workflowName}
- Description: ${input.workflowDescription || 'Not provided'}
- Trigger Type: ${input.triggerType.toUpperCase()}
- Trigger Details: ${this.getTriggerDetails(input)}
- Integrations: ${input.integrations.join(', ')}
- Complexity: ${input.complexity || 'Auto-detect'}

ACTION DESCRIPTION:
${input.actionDescription}

ADDITIONAL CONTEXT:
${input.additionalContext || 'No additional context provided'}

SPECIFIC REQUIREMENTS:
${input.specificRequirements?.length ? input.specificRequirements.map(req => `- ${req}`).join('\n') : 'No specific requirements'}

WORKFLOW GOALS:
${input.workflowGoals?.length ? input.workflowGoals.map(goal => `- ${goal}`).join('\n') : 'General automation goals'}`;
  }

  private getTriggerDetails(input: N8nWorkflowInput): string {
    switch (input.triggerType) {
      case 'schedule':
        return input.scheduleDetails || 'Default schedule configuration needed';
      case 'webhook':
        return input.webhookDetails || 'Webhook configuration needed';
      case 'event':
        return input.eventDetails || 'Event-based trigger configuration needed';
      default:
        return 'Trigger configuration needed';
    }
  }

  private buildRequirementsSection(input: N8nWorkflowInput): string {
    return `

TRIGGER DATA AVAILABLE:
${input.triggerData || 'Standard trigger data will be available based on trigger type'}

ESTIMATED RUNTIME:
${input.estimatedRunTime ? `${input.estimatedRunTime} seconds` : 'Auto-calculate based on workflow complexity'}`;
  }

  private buildGenerationRequest(input: N8nWorkflowInput): string {
    return `

GENERATE COMPLETE N8N WORKFLOW PACKAGE:

Please generate a comprehensive n8n workflow package in valid JSON format with the following structure:

{
  "workflowId": "workflow_${Date.now()}",
  "workflowConfig": {
    "id": "<unique_id>",
    "name": "${input.workflowName}",
    "nodes": [
      // Complete array of n8n nodes with proper configuration
      // Include trigger node, integration nodes, Set nodes for data transformation,
      // IF nodes for conditional logic, and proper error handling nodes
    ],
    "connections": {
      // Proper node connections following n8n format
    },
    "active": false,
    "settings": {
      "executionOrder": "v1",
      "saveManualExecutions": true,
      "timezone": "America/New_York"
    },
    "staticData": {},
    "tags": ["generated", "${input.triggerType}", "automation"]
  },
  "setupInstructions": {
    "steps": [
      // Step-by-step setup instructions
    ],
    "credentialSetup": [
      // Required credentials with setup links
    ],
    "testingGuidance": [
      // How to test the workflow
    ],
    "troubleshooting": [
      // Common issues and solutions
    ]
  },
  "exportFormats": {
    "n8nJson": "<complete_n8n_json_string>",
    "documentation": "<markdown_documentation>",
    "setupScript": "<optional_setup_script>"
  },
  "analysis": {
    "nodeCount": <number_of_nodes>,
    "connectionCount": <number_of_connections>,
    "complexity": "<simple|moderate|complex>",
    "estimatedExecutionTime": <seconds>,
    "potentialIssues": ["<issue_1>", "<issue_2>"],
    "optimizationSuggestions": ["<suggestion_1>", "<suggestion_2>"],
    "securityConsiderations": ["<security_1>", "<security_2>"],
    "scalabilityNotes": ["<scalability_1>", "<scalability_2>"]
  },
  "alternatives": {
    "simplified": "<optional_simplified_workflow>",
    "advanced": "<optional_advanced_workflow>"
  }
}

SPECIFIC REQUIREMENTS FOR NODE GENERATION:

1. **Trigger Node**: Create appropriate trigger node based on ${input.triggerType}:
   - For schedule: Use "n8n-nodes-base.cron" with proper cron expression
   - For webhook: Use "n8n-nodes-base.webhook" with authentication if needed
   - For event: Use appropriate event trigger node based on event type

2. **Integration Nodes**: For each integration in [${input.integrations.join(', ')}]:
   - Use correct node type (e.g., "n8n-nodes-base.slack", "n8n-nodes-base.googleSheets")
   - Configure parameters appropriate for the action
   - Include credential references
   - Add descriptive names and notes

3. **Data Processing**: Include Set nodes for data transformation and IF nodes for conditional logic

4. **Error Handling**: Add error handling with appropriate error workflows

5. **Node Positioning**: Set proper x,y coordinates for clean workflow layout

6. **Connections**: Ensure all nodes are properly connected with correct connection types

7. **Security**: Reference credentials properly, never hardcode sensitive data

INTEGRATION-SPECIFIC GUIDANCE:
${this.getIntegrationGuidance(input.integrations)}

Make every node production-ready with proper error handling, data validation, and security considerations. The workflow should be immediately importable into n8n and functional after credential setup.`;
  }

  private getIntegrationGuidance(integrations: string[]): string {
    const guidance = integrations.map(integration => {
      const lowerIntegration = integration.toLowerCase();
      
      if (lowerIntegration.includes('slack')) {
        return '- Slack: Use "n8n-nodes-base.slack" with OAuth2 credentials, include channel/user selection';
      } else if (lowerIntegration.includes('gmail')) {
        return '- Gmail: Use "n8n-nodes-base.gmail" with Google OAuth2, handle attachments if needed';
      } else if (lowerIntegration.includes('google sheets')) {
        return '- Google Sheets: Use "n8n-nodes-base.googleSheets" with service account or OAuth2';
      } else if (lowerIntegration.includes('google drive')) {
        return '- Google Drive: Use "n8n-nodes-base.googleDrive" for file operations';
      } else if (lowerIntegration.includes('stripe')) {
        return '- Stripe: Use "n8n-nodes-base.stripe" with API key, handle webhooks securely';
      } else if (lowerIntegration.includes('postgresql') || lowerIntegration.includes('mysql')) {
        return `- ${integration}: Use "n8n-nodes-base.postgres" or "n8n-nodes-base.mySql" with proper connection strings`;
      } else if (lowerIntegration.includes('webhook') || lowerIntegration.includes('http')) {
        return '- HTTP Request: Use "n8n-nodes-base.httpRequest" with proper headers and authentication';
      } else {
        return `- ${integration}: Use appropriate n8n node type with proper configuration`;
      }
    });
    
    return guidance.join('\n');
  }

  private parseWorkflowResponse(content: string, input: N8nWorkflowInput): Omit<GeneratedWorkflowPackage, 'tokensUsed' | 'processingTime'> {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required structure
        if (parsed.workflowConfig && parsed.setupInstructions && parsed.analysis) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, generating fallback workflow:', error);
    }

    // Fallback to structured generation
    return this.generateStructuredFallback(input);
  }

  private generateStructuredFallback(input: N8nWorkflowInput): Omit<GeneratedWorkflowPackage, 'tokensUsed' | 'processingTime'> {
    const workflowId = `workflow_${Date.now()}`;
    const nodes = this.generateNodes(input);
    const connections = this.generateConnections(nodes);
    
    const workflowConfig: N8nWorkflowConfig = {
      id: workflowId,
      name: input.workflowName,
      nodes,
      connections,
      active: false,
      settings: {
        executionOrder: 'v1',
        saveManualExecutions: true,
        timezone: 'UTC'
      },
      staticData: {},
      tags: ['generated', input.triggerType, 'automation']
    };

    return {
      workflowId,
      workflowConfig,
      setupInstructions: this.generateSetupInstructions(input),
      exportFormats: {
        n8nJson: JSON.stringify(workflowConfig, null, 2),
        documentation: this.generateDocumentation(input, workflowConfig),
        setupScript: this.generateSetupScript(input)
      },
      analysis: this.analyzeWorkflow(workflowConfig, input),
      alternatives: {
        simplified: this.generateSimplifiedWorkflow(input),
        advanced: this.generateAdvancedWorkflow(input)
      }
    };
  }

  private generateNodes(input: N8nWorkflowInput): N8nNode[] {
    const nodes: N8nNode[] = [];
    let xPosition = 250;
    const yPosition = 300;
    const xSpacing = 200;

    // Generate trigger node
    const triggerNode = this.generateTriggerNode(input, [xPosition, yPosition]);
    nodes.push(triggerNode);
    xPosition += xSpacing;

    // Generate integration nodes
    input.integrations.forEach((integration, index) => {
      const integrationNode = this.generateIntegrationNode(
        integration, 
        index, 
        [xPosition, yPosition]
      );
      nodes.push(integrationNode);
      xPosition += xSpacing;
    });

    // Add a Set node for data transformation if needed
    if (input.actionDescription.toLowerCase().includes('transform') || 
        input.actionDescription.toLowerCase().includes('format')) {
      const setNode = this.generateSetNode([xPosition, yPosition]);
      nodes.push(setNode);
      xPosition += xSpacing;
    }

    return nodes;
  }

  private generateTriggerNode(input: N8nWorkflowInput, position: [number, number]): N8nNode {
    const baseNode = {
      id: 'trigger',
      name: 'Trigger',
      typeVersion: 1,
      position,
      parameters: {} as Record<string, any>
    };

    switch (input.triggerType) {
      case 'schedule':
        return {
          ...baseNode,
          type: 'n8n-nodes-base.cron',
          parameters: {
            triggerTimes: {
              item: [
                {
                  hour: 9,
                  minute: 0
                }
              ]
            }
          }
        };
      
      case 'webhook':
        return {
          ...baseNode,
          type: 'n8n-nodes-base.webhook',
          parameters: {
            httpMethod: 'POST',
            path: `webhook-${Date.now()}`,
            responseMode: 'onReceived'
          },
          webhookId: `webhook-${Date.now()}`
        };
      
      case 'event':
        return {
          ...baseNode,
          type: 'n8n-nodes-base.manualTrigger',
          parameters: {}
        };
      
      default:
        return {
          ...baseNode,
          type: 'n8n-nodes-base.manualTrigger',
          parameters: {}
        };
    }
  }

  private generateIntegrationNode(integration: string, index: number, position: [number, number]): N8nNode {
    const nodeId = `integration_${index}`;
    const nodeName = integration;
    
    // Map integration to n8n node type
    const nodeType = this.mapIntegrationToNodeType(integration);
    const parameters = this.generateIntegrationParameters(integration);

    return {
      id: nodeId,
      name: nodeName,
      type: nodeType,
      typeVersion: 1,
      position,
      parameters,
      credentials: this.generateCredentials(integration)
    };
  }

  private mapIntegrationToNodeType(integration: string): string {
    const lowerIntegration = integration.toLowerCase();
    
    if (lowerIntegration.includes('slack')) return 'n8n-nodes-base.slack';
    if (lowerIntegration.includes('gmail')) return 'n8n-nodes-base.gmail';
    if (lowerIntegration.includes('google sheets')) return 'n8n-nodes-base.googleSheets';
    if (lowerIntegration.includes('google drive')) return 'n8n-nodes-base.googleDrive';
    if (lowerIntegration.includes('google calendar')) return 'n8n-nodes-base.googleCalendar';
    if (lowerIntegration.includes('stripe')) return 'n8n-nodes-base.stripe';
    if (lowerIntegration.includes('paypal')) return 'n8n-nodes-base.payPal';
    if (lowerIntegration.includes('twilio')) return 'n8n-nodes-base.twilio';
    if (lowerIntegration.includes('postgresql')) return 'n8n-nodes-base.postgres';
    if (lowerIntegration.includes('mysql')) return 'n8n-nodes-base.mySql';
    if (lowerIntegration.includes('mongodb')) return 'n8n-nodes-base.mongoDb';
    if (lowerIntegration.includes('airtable')) return 'n8n-nodes-base.airtable';
    if (lowerIntegration.includes('notion')) return 'n8n-nodes-base.notion';
    if (lowerIntegration.includes('trello')) return 'n8n-nodes-base.trello';
    if (lowerIntegration.includes('asana')) return 'n8n-nodes-base.asana';
    if (lowerIntegration.includes('github')) return 'n8n-nodes-base.github';
    if (lowerIntegration.includes('discord')) return 'n8n-nodes-base.discord';
    if (lowerIntegration.includes('telegram')) return 'n8n-nodes-base.telegram';
    if (lowerIntegration.includes('mailchimp')) return 'n8n-nodes-base.mailchimp';
    if (lowerIntegration.includes('sendgrid')) return 'n8n-nodes-base.sendGrid';
    if (lowerIntegration.includes('hubspot')) return 'n8n-nodes-base.hubspot';
    if (lowerIntegration.includes('salesforce')) return 'n8n-nodes-base.salesforce';
    if (lowerIntegration.includes('shopify')) return 'n8n-nodes-base.shopify';
    if (lowerIntegration.includes('woocommerce')) return 'n8n-nodes-base.wooCommerce';
    if (lowerIntegration.includes('aws')) return 'n8n-nodes-base.awsS3';
    if (lowerIntegration.includes('dropbox')) return 'n8n-nodes-base.dropbox';
    if (lowerIntegration.includes('zendesk')) return 'n8n-nodes-base.zendesk';
    if (lowerIntegration.includes('jira')) return 'n8n-nodes-base.jira';
    if (lowerIntegration.includes('microsoft') || lowerIntegration.includes('outlook')) return 'n8n-nodes-base.microsoftOutlook';
    if (lowerIntegration.includes('zoom')) return 'n8n-nodes-base.zoom';
    if (lowerIntegration.includes('calendly')) return 'n8n-nodes-base.calendly';
    if (lowerIntegration.includes('typeform')) return 'n8n-nodes-base.typeform';
    if (lowerIntegration.includes('openai')) return 'n8n-nodes-base.openAi';
    
    // Default to HTTP Request for custom APIs
    return 'n8n-nodes-base.httpRequest';
  }

  private generateIntegrationParameters(integration: string): Record<string, any> {
    const lowerIntegration = integration.toLowerCase();
    
    if (lowerIntegration.includes('slack')) {
      return {
        operation: 'post',
        resource: 'message',
        channel: '#general',
        text: '=Hello from n8n workflow!'
      };
    } else if (lowerIntegration.includes('gmail')) {
      return {
        operation: 'send',
        resource: 'message',
        subject: 'Automated Email from n8n',
        message: 'This email was sent automatically by your n8n workflow.'
      };
    } else if (lowerIntegration.includes('google sheets')) {
      return {
        operation: 'append',
        resource: 'spreadsheet',
        range: 'A:Z'
      };
    } else if (lowerIntegration.includes('http')) {
      return {
        url: 'https://api.example.com/endpoint',
        authentication: 'none',
        requestMethod: 'POST',
        jsonParameters: true
      };
    } else {
      return {
        operation: 'create',
        resource: 'item'
      };
    }
  }

  private generateCredentials(integration: string): Record<string, string> {
    const lowerIntegration = integration.toLowerCase();
    
    if (lowerIntegration.includes('slack')) {
      return { slackApi: 'Slack API' };
    } else if (lowerIntegration.includes('gmail') || lowerIntegration.includes('google')) {
      return { googleApi: 'Google OAuth2 API' };
    } else if (lowerIntegration.includes('stripe')) {
      return { stripeApi: 'Stripe API' };
    } else if (lowerIntegration.includes('postgresql')) {
      return { postgres: 'PostgreSQL' };
    } else if (lowerIntegration.includes('mysql')) {
      return { mySql: 'MySQL' };
    } else {
      return {};
    }
  }

  private generateSetNode(position: [number, number]): N8nNode {
    return {
      id: 'set_data',
      name: 'Transform Data',
      type: 'n8n-nodes-base.set',
      typeVersion: 1,
      position,
      parameters: {
        values: {
          string: [
            {
              name: 'processedAt',
              value: '={{ new Date().toISOString() }}'
            }
          ]
        },
        options: {}
      }
    };
  }

  private generateConnections(nodes: N8nNode[]): Record<string, any> {
    const connections: Record<string, any> = {};
    
    for (let i = 0; i < nodes.length - 1; i++) {
      const currentNode = nodes[i];
      const nextNode = nodes[i + 1];
      
      connections[currentNode.id] = {
        main: [[{
          node: nextNode.id,
          type: 'main',
          index: 0
        }]]
      };
    }
    
    return connections;
  }

  private generateSetupInstructions(input: N8nWorkflowInput) {
    const credentials = this.getRequiredCredentials(input.integrations);
    
    return {
      steps: [
        'Import this workflow JSON into your n8n instance',
        'Set up required credentials for each integration',
        'Configure trigger settings according to your needs',
        'Test the workflow with sample data',
        'Activate the workflow when ready'
      ],
      credentialSetup: credentials,
      testingGuidance: [
        'Use the Execute Workflow button to test manually',
        'Check each node\'s output for proper data flow',
        'Verify integrations are connecting successfully',
        'Test error scenarios to ensure proper handling'
      ],
      troubleshooting: [
        'Check credential configuration if nodes fail',
        'Verify API permissions and rate limits',
        'Review node-specific documentation for parameter requirements',
        'Use n8n\'s execution log to debug issues'
      ]
    };
  }

  private getRequiredCredentials(integrations: string[]): RequiredCredential[] {
    return integrations.map(integration => {
      const lowerIntegration = integration.toLowerCase();
      
      if (lowerIntegration.includes('slack')) {
        return {
          name: 'Slack API',
          type: 'OAuth2',
          service: integration,
          setupLink: 'https://docs.n8n.io/integrations/builtin/credentials/slack/',
          priority: 'required' as const,
          description: 'OAuth2 credentials for Slack API access'
        };
      } else if (lowerIntegration.includes('google')) {
        return {
          name: 'Google OAuth2 API',
          type: 'OAuth2',
          service: integration,
          setupLink: 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
          priority: 'required' as const,
          description: 'Google OAuth2 credentials for API access'
        };
      } else if (lowerIntegration.includes('stripe')) {
        return {
          name: 'Stripe API',
          type: 'API Key',
          service: integration,
          setupLink: 'https://docs.n8n.io/integrations/builtin/credentials/stripe/',
          priority: 'required' as const,
          description: 'Stripe API key for payment processing'
        };
      } else {
        return {
          name: `${integration} API`,
          type: 'API Key',
          service: integration,
          setupLink: 'https://docs.n8n.io/integrations/builtin/credentials/',
          priority: 'required' as const,
          description: `API credentials for ${integration}`
        };
      }
    });
  }

  private generateDocumentation(input: N8nWorkflowInput, config: N8nWorkflowConfig): string {
    return `# ${input.workflowName}

## Description
${input.workflowDescription || 'N8n workflow generated automatically'}

## Workflow Overview
- **Trigger**: ${input.triggerType} - ${this.getTriggerDetails(input)}
- **Integrations**: ${input.integrations.join(', ')}
- **Nodes**: ${config.nodes.length}
- **Complexity**: ${this.calculateComplexity(config)}

## What This Workflow Does
${input.actionDescription}

## Setup Requirements
${this.getRequiredCredentials(input.integrations).map(cred => `- ${cred.name} (${cred.type})`).join('\n')}

## Installation Steps
1. Copy the workflow JSON below
2. In n8n, go to Workflows → Import from JSON
3. Paste the JSON and import
4. Configure required credentials
5. Test and activate

## Workflow JSON
\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\`

## Additional Context
${input.additionalContext || 'No additional context provided'}

## Goals
${input.workflowGoals?.map(goal => `- ${goal}`).join('\n') || 'General automation goals'}

---
*Generated by n8n Workflow Builder*`;
  }

  private generateSetupScript(input: N8nWorkflowInput): string {
    return `#!/bin/bash
# n8n Workflow Setup Script for: ${input.workflowName}

echo "Setting up n8n workflow: ${input.workflowName}"

# Check if n8n is running
if ! curl -f -s http://localhost:5678/healthz > /dev/null; then
  echo "Error: n8n is not running or not accessible at localhost:5678"
  exit 1
fi

echo "n8n is running successfully"

# Note: Credential setup must be done manually via the UI
echo "Please set up the following credentials manually in n8n:"
${input.integrations.map(integration => `echo "- ${integration}"`).join('\n')}

echo "Setup script completed. Import the workflow JSON manually."`;
  }

  private analyzeWorkflow(config: N8nWorkflowConfig, input: N8nWorkflowInput): WorkflowAnalysis {
    const nodeCount = config.nodes.length;
    const connectionCount = Object.keys(config.connections).length;
    const complexity = this.calculateComplexity(config);
    
    return {
      nodeCount,
      connectionCount,
      complexity,
      estimatedExecutionTime: this.estimateExecutionTime(config, input),
      potentialIssues: this.identifyPotentialIssues(config, input),
      optimizationSuggestions: this.generateOptimizationSuggestions(config, input),
      securityConsiderations: this.generateSecurityConsiderations(input),
      scalabilityNotes: this.generateScalabilityNotes(config, input)
    };
  }

  private calculateComplexity(config: N8nWorkflowConfig): 'simple' | 'moderate' | 'complex' {
    const nodeCount = config.nodes.length;
    const connectionCount = Object.keys(config.connections).length;
    const hasConditionalLogic = config.nodes.some(node => node.type.includes('if'));
    const hasLoops = config.nodes.some(node => node.type.includes('splitInBatches'));
    
    if (nodeCount <= 5 && connectionCount <= 4 && !hasConditionalLogic && !hasLoops) {
      return 'simple';
    } else if (nodeCount <= 15 && connectionCount <= 20) {
      return 'moderate';
    } else {
      return 'complex';
    }
  }

  private estimateExecutionTime(config: N8nWorkflowConfig, input: N8nWorkflowInput): number {
    let baseTime = 5; // Base 5 seconds
    
    // Add time per node
    baseTime += config.nodes.length * 2;
    
    // Add time for complex integrations
    const complexIntegrations = ['salesforce', 'sap', 'workday'];
    const hasComplexIntegrations = input.integrations.some(integration =>
      complexIntegrations.some(complex => integration.toLowerCase().includes(complex))
    );
    
    if (hasComplexIntegrations) baseTime += 15;
    
    // Add time for database operations
    const hasDatabaseOps = input.integrations.some(integration =>
      ['postgresql', 'mysql', 'mongodb'].some(db => integration.toLowerCase().includes(db))
    );
    
    if (hasDatabaseOps) baseTime += 10;
    
    return baseTime;
  }

  private identifyPotentialIssues(config: N8nWorkflowConfig, input: N8nWorkflowInput): string[] {
    const issues: string[] = [];
    
    // Check for missing error handling
    const hasErrorHandling = config.nodes.some(node => node.type.includes('errorTrigger'));
    if (!hasErrorHandling && config.nodes.length > 3) {
      issues.push('No error handling nodes detected - consider adding error workflows');
    }
    
    // Check for rate limiting concerns
    const hasApiIntegrations = input.integrations.some(integration =>
      !['postgresql', 'mysql', 'mongodb', 'file'].some(local => integration.toLowerCase().includes(local))
    );
    
    if (hasApiIntegrations) {
      issues.push('API rate limiting may affect execution - consider implementing delays');
    }
    
    // Check for data transformation without Set nodes
    if (input.actionDescription.toLowerCase().includes('transform') || 
        input.actionDescription.toLowerCase().includes('format')) {
      const hasSetNodes = config.nodes.some(node => node.type.includes('set'));
      if (!hasSetNodes) {
        issues.push('Data transformation mentioned but no Set nodes found');
      }
    }
    
    return issues;
  }

  private generateOptimizationSuggestions(config: N8nWorkflowConfig, input: N8nWorkflowInput): string[] {
    const suggestions: string[] = [];
    
    if (config.nodes.length > 10) {
      suggestions.push('Consider breaking large workflows into sub-workflows for better maintainability');
    }
    
    if (input.integrations.length > 5) {
      suggestions.push('Multiple integrations detected - consider batching operations where possible');
    }
    
    suggestions.push('Add descriptive names and notes to nodes for better documentation');
    suggestions.push('Set up monitoring and alerting for critical workflow paths');
    
    return suggestions;
  }

  private generateSecurityConsiderations(input: N8nWorkflowInput): string[] {
    const considerations: string[] = [];
    
    considerations.push('Store all sensitive data in n8n credentials, never in node parameters');
    considerations.push('Use environment variables for configuration that may change between environments');
    
    const hasPaymentIntegrations = input.integrations.some(integration =>
      ['stripe', 'paypal', 'square'].some(payment => integration.toLowerCase().includes(payment))
    );
    
    if (hasPaymentIntegrations) {
      considerations.push('Payment integrations detected - ensure PCI compliance and proper webhook validation');
    }
    
    if (input.triggerType === 'webhook') {
      considerations.push('Webhook triggers should include proper authentication and input validation');
    }
    
    return considerations;
  }

  private generateScalabilityNotes(config: N8nWorkflowConfig, input: N8nWorkflowInput): string[] {
    const notes: string[] = [];
    
    if (config.nodes.length > 8) {
      notes.push('Large workflows may benefit from queue-based processing for high-volume scenarios');
    }
    
    notes.push('Monitor execution times and consider horizontal scaling for high-frequency workflows');
    notes.push('Implement proper logging and metrics collection for production monitoring');
    
    return notes;
  }

  private generateSimplifiedWorkflow(input: N8nWorkflowInput): N8nWorkflowConfig | undefined {
    if (input.integrations.length <= 3) return undefined; // Already simple
    
    // Create simplified version with core integrations only
    const coreIntegrations = input.integrations.slice(0, 2);
    const simplifiedInput = {
      ...input,
      integrations: coreIntegrations,
      actionDescription: `Simplified version: ${input.actionDescription.substring(0, 100)}...`
    };
    
    const nodes = this.generateNodes(simplifiedInput);
    const connections = this.generateConnections(nodes);
    
    return {
      id: `simplified_${Date.now()}`,
      name: `${input.workflowName} (Simplified)`,
      nodes,
      connections,
      active: false,
      settings: {
        executionOrder: 'v1',
        saveManualExecutions: true
      },
      tags: ['simplified', 'generated']
    };
  }

  private generateAdvancedWorkflow(input: N8nWorkflowInput): N8nWorkflowConfig | undefined {
    // Add advanced features like error handling, conditional logic, etc.
    const nodes = this.generateNodes(input);
    
    // Add error handling node
    const errorNode: N8nNode = {
      id: 'error_handler',
      name: 'Error Handler',
      type: 'n8n-nodes-base.errorTrigger',
      typeVersion: 1,
      position: [250, 500],
      parameters: {
        workflowId: '{{ $workflow.id }}'
      }
    };
    
    // Add notification node for errors
    const notificationNode: N8nNode = {
      id: 'error_notification',
      name: 'Error Notification',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 1,
      position: [450, 500],
      parameters: {
        url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
        requestMethod: 'POST',
        jsonParameters: true,
        bodyParameters: {
          text: `Workflow ${input.workflowName} failed: {{ $json.error.message }}`
        }
      }
    };
    
    nodes.push(errorNode, notificationNode);
    
    const connections = this.generateConnections(nodes);
    // Connect error handler to notification
    connections[errorNode.id] = {
      main: [[{
        node: notificationNode.id,
        type: 'main',
        index: 0
      }]]
    };
    
    return {
      id: `advanced_${Date.now()}`,
      name: `${input.workflowName} (Advanced)`,
      nodes,
      connections,
      active: false,
      settings: {
        executionOrder: 'v1',
        saveManualExecutions: true,
        errorWorkflow: errorNode.id
      },
      tags: ['advanced', 'error-handling', 'generated']
    };
  }

  // Service management methods
  async saveWorkflow(userId: string, workspaceId: string, workflowPackage: GeneratedWorkflowPackage, input: N8nWorkflowInput): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `n8n Workflow - ${input.workflowName}`,
          content: JSON.stringify(workflowPackage),
          type: 'n8n_workflow',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: {
            workflowName: input.workflowName,
            workflowDescription: input.workflowDescription,
            triggerType: input.triggerType,
            integrations: input.integrations,
            complexity: workflowPackage.analysis.complexity,
            nodeCount: workflowPackage.analysis.nodeCount,
            connectionCount: workflowPackage.analysis.connectionCount,
            estimatedExecutionTime: workflowPackage.analysis.estimatedExecutionTime,
            estimatedSetupTime: input.complexity === 'simple' ? 30 : input.complexity === 'moderate' ? 60 : 120,
            requiredCredentials: workflowPackage.setupInstructions.credentialSetup.length,
            generatedAt: new Date().toISOString(),
            tokensUsed: workflowPackage.tokensUsed,
            processingTime: workflowPackage.processingTime,
            workflowId: workflowPackage.workflowId,
            hasErrorHandling: workflowPackage.workflowConfig.nodes.some(node => node.type.includes('errorTrigger')),
            securityLevel: this.calculateSecurityLevel(input.integrations),
            status: 'draft'
          },
          tags: [
            'n8n-workflow',
            input.triggerType,
            workflowPackage.analysis.complexity,
            'automation',
            ...input.integrations.slice(0, 3).map(i => i.toLowerCase().replace(/\s+/g, '-'))
          ]
        }
      });

      return deliverable.id;
    } catch (error) {
      console.error('Error saving n8n workflow:', error);
      throw new Error('Failed to save workflow');
    }
  }

  private calculateSecurityLevel(integrations: string[]): string {
    const highSecurityIntegrations = ['stripe', 'paypal', 'aws', 'azure', 'banking', 'postgresql', 'mysql'];
    const hasHighSecurity = integrations.some(integration =>
      highSecurityIntegrations.some(secure => integration.toLowerCase().includes(secure))
    );
    
    return hasHighSecurity ? 'high' : integrations.length > 5 ? 'medium' : 'low';
  }

  async getWorkflow(userId: string, workflowId: string): Promise<SavedWorkflow | null> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.findFirst({
        where: {
          id: workflowId,
          user_id: userId,
          type: 'n8n_workflow'
        },
        include: {
          workspace: true
        }
      });

      if (!deliverable) {
        return null;
      }

      const workflowPackage = JSON.parse(deliverable.content);
      const metadata = deliverable.metadata as any;

      return {
        id: deliverable.id,
        title: deliverable.title,
        workflowName: metadata.workflowName,
        workflowDescription: metadata.workflowDescription,
        triggerType: metadata.triggerType,
        integrations: metadata.integrations || [],
        complexity: metadata.complexity,
        nodeCount: metadata.nodeCount,
        status: metadata.status || 'draft',
        workflowConfig: workflowPackage.workflowConfig,
        analysis: workflowPackage.analysis,
        setupInstructions: workflowPackage.setupInstructions,
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        workspace: deliverable.workspace
      };
    } catch (error) {
      console.error('Error retrieving workflow:', error);
      throw new Error('Failed to retrieve workflow');
    }
  }

  async getUserWorkflows(userId: string, workspaceId?: string): Promise<WorkflowListItem[]> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'n8n_workflow'
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const workflows = await prisma.deliverable.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        include: {
          workspace: true
        }
      });

      return workflows.map(workflow => {
        const metadata = workflow.metadata as any;
        
        return {
          id: workflow.id,
          title: workflow.title,
          workflowName: metadata?.workflowName || 'Untitled Workflow',
          triggerType: metadata?.triggerType || 'unknown',
          integrations: metadata?.integrations || [],
          complexity: metadata?.complexity || 'unknown',
          nodeCount: metadata?.nodeCount || 0,
          status: metadata?.status || 'draft',
          lastRun: metadata?.lastRun ? new Date(metadata.lastRun) : undefined,
          totalRuns: metadata?.totalRuns || 0,
          successRate: metadata?.successRate || 0,
          createdAt: workflow.created_at,
          updatedAt: workflow.updated_at,
          workspace: workflow.workspace
        };
      });
    } catch (error) {
      console.error('Error fetching user workflows:', error);
      return [];
    }
  }

  async updateWorkflow(userId: string, workflowId: string, updates: Partial<N8nWorkflowInput>): Promise<SavedWorkflow> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      // Get existing workflow
      const existingWorkflow = await this.getWorkflow(userId, workflowId);
      if (!existingWorkflow) {
        throw new Error('Workflow not found');
      }

      // If major changes, regenerate workflow
      if (updates.integrations || updates.actionDescription || updates.triggerType) {
        const originalInput = existingWorkflow.workflowConfig as any;
        const updatedInput = { ...originalInput, ...updates, userId };

        const newWorkflowPackage = await this.generateWorkflow(updatedInput);

        const updated = await prisma.deliverable.update({
          where: { id: workflowId },
          data: {
            content: JSON.stringify(newWorkflowPackage),
            title: updates.workflowName ? `n8n Workflow - ${updates.workflowName}` : undefined,
            metadata: {
              ...(existingWorkflow.workflowConfig as any),
              ...updates,
              updatedAt: new Date().toISOString(),
              tokensUsed: newWorkflowPackage.tokensUsed,
              processingTime: newWorkflowPackage.processingTime,
              nodeCount: newWorkflowPackage.analysis.nodeCount,
              connectionCount: newWorkflowPackage.analysis.connectionCount,
              complexity: newWorkflowPackage.analysis.complexity
            }
          },
          include: { workspace: true }
        });

        const workflowPackage = JSON.parse(updated.content);
        const metadata = updated.metadata as any;

        return {
          id: updated.id,
          title: updated.title,
          workflowName: metadata.workflowName,
          workflowDescription: metadata.workflowDescription,
          triggerType: metadata.triggerType,
          integrations: metadata.integrations || [],
          complexity: metadata.complexity,
          nodeCount: metadata.nodeCount,
          status: metadata.status || 'draft',
          workflowConfig: workflowPackage.workflowConfig,
          analysis: workflowPackage.analysis,
          setupInstructions: workflowPackage.setupInstructions,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
          workspace: updated.workspace
        };
      } else {
        // Simple metadata update
        const updated = await prisma.deliverable.update({
          where: { id: workflowId },
          data: {
            title: updates.workflowName ? `n8n Workflow - ${updates.workflowName}` : undefined,
            metadata: {
              ...(existingWorkflow.workflowConfig as any),
              ...updates,
              updatedAt: new Date().toISOString()
            }
          },
          include: { workspace: true }
        });

        return existingWorkflow;
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw new Error('Failed to update workflow');
    }
  }

  async deleteWorkflow(userId: string, workflowId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: workflowId,
          user_id: userId,
          type: 'n8n_workflow'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      return false;
    }
  }

  async exportWorkflow(userId: string, workflowId: string, format: ExportFormat): Promise<string> {
    const workflow = await this.getWorkflow(userId, workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    switch (format) {
      case 'summary':
        return this.generateWorkflowSummary(workflow);
      case 'detailed':
        return this.generateDetailedExport(workflow);
      case 'json':
        return JSON.stringify(workflow.workflowConfig, null, 2);
      case 'setup-guide':
        return this.generateSetupGuide(workflow);
      case 'troubleshooting':
        return this.generateTroubleshootingGuide(workflow);
      default:
        return this.generateWorkflowSummary(workflow);
    }
  }

  private generateWorkflowSummary(workflow: SavedWorkflow): string {
    return `# ${workflow.workflowName}

**Type**: ${workflow.triggerType.toUpperCase()} Workflow
**Complexity**: ${workflow.complexity.toUpperCase()}
**Nodes**: ${workflow.nodeCount}
**Status**: ${workflow.status.toUpperCase()}
**Created**: ${workflow.createdAt.toLocaleDateString()}

## Description
${workflow.workflowDescription || 'No description provided'}

## Integrations
${workflow.integrations.map(integration => `• ${integration}`).join('\n')}

## Setup Requirements
${workflow.setupInstructions.credentialSetup.map((cred: RequiredCredential) => `### ${cred.name}`).join('\n')}

## Analysis
• **Estimated Execution Time**: ${workflow.analysis.estimatedExecutionTime} seconds
• **Complexity**: ${workflow.analysis.complexity}
• **Security Level**: ${workflow.analysis.securityConsiderations.length > 2 ? 'High' : 'Medium'}

## Quick Setup
1. Import the workflow JSON into n8n
2. Configure required credentials
3. Test the workflow
4. Activate when ready

---
*Generated by n8n Workflow Builder*`;
  }

  private generateDetailedExport(workflow: SavedWorkflow): string {
    return `# ${workflow.workflowName} - Detailed Documentation

## Overview
- **Workflow ID**: ${workflow.id}
- **Created**: ${workflow.createdAt.toLocaleDateString()}
- **Last Updated**: ${workflow.updatedAt.toLocaleDateString()}
- **Trigger Type**: ${workflow.triggerType}
- **Status**: ${workflow.status}

## Description
${workflow.workflowDescription || 'No description provided'}

## Technical Details
- **Node Count**: ${workflow.nodeCount}
- **Complexity**: ${workflow.complexity}
- **Estimated Execution Time**: ${workflow.analysis.estimatedExecutionTime}s

## Integrations
${workflow.integrations.map(integration => `### ${integration}\n- Required for core functionality\n- See setup guide for credential configuration`).join('\n\n')}

## Workflow Configuration
\`\`\`json
${JSON.stringify(workflow.workflowConfig, null, 2)}
\`\`\`

## Setup Instructions
${workflow.setupInstructions.steps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}

## Required Credentials
${workflow.setupInstructions.credentialSetup.map((cred: RequiredCredential) => `### ${cred.name}\n- **Type**: ${cred.type}\n- **Service**: ${cred.service}\n- **Setup Guide**: [${cred.setupLink}](${cred.setupLink})\n- **Priority**: ${cred.priority}`).join('\n\n')}

## Testing Guidelines
${workflow.setupInstructions.testingGuidance.map((guide: string) => `• ${guide}`).join('\n')}

## Troubleshooting
${workflow.setupInstructions.troubleshooting.map((trouble: string) => `• ${trouble}`).join('\n')}

## Analysis & Recommendations

### Potential Issues
${workflow.analysis.potentialIssues.map(issue => `• ${issue}`).join('\n')}

### Optimization Suggestions
${workflow.analysis.optimizationSuggestions.map(suggestion => `• ${suggestion}`).join('\n')}

### Security Considerations
${workflow.analysis.securityConsiderations.map(security => `• ${security}`).join('\n')}

### Scalability Notes
${workflow.analysis.scalabilityNotes.map(note => `• ${note}`).join('\n')}

---
*Generated by n8n Workflow Builder on ${new Date().toLocaleDateString()}*`;
  }

  private generateSetupGuide(workflow: SavedWorkflow): string {
    return `# Setup Guide: ${workflow.workflowName}

## Prerequisites
- n8n instance (cloud or self-hosted)
- Admin access to configure credentials
- Access to required third-party services

## Step-by-Step Setup

${workflow.setupInstructions.steps.map((step: string, i: number) => `### Step ${i + 1}: ${step}\n\nDetailed instructions for this step...`).join('\n\n')}

## Credential Configuration

${workflow.setupInstructions.credentialSetup.map((cred: RequiredCredential)=> `### ${cred.name}
1. Go to n8n Credentials page
2. Click "Add Credential"
3. Select "${cred.type}"
4. Follow the setup guide: [${cred.setupLink}](${cred.setupLink})
5. Test the connection
6. Save the credential`).join('\n\n')}

## Testing Your Workflow

${workflow.setupInstructions.testingGuidance.map((test: string, i: number) => `${i + 1}. ${test}`).join('\n')}

## Going Live
1. Complete all testing
2. Set up monitoring (recommended)
3. Configure error notifications
4. Activate the workflow
5. Monitor initial executions

---
*Setup completed? Return to n8n and activate your workflow!*`;
  }

  private generateTroubleshootingGuide(workflow: SavedWorkflow): string {
    return `# Troubleshooting Guide: ${workflow.workflowName}

## Common Issues

${workflow.setupInstructions.troubleshooting.map((trouble: string) => `### Issue: ${trouble}\n\n**Solution**: Check the specific configuration mentioned in the error.\n\n**Prevention**: Regular testing and monitoring.\n`).join('\n')}

## Potential Issues

${workflow.analysis.potentialIssues.map(issue => `### ${issue}\n\n**Impact**: May cause workflow failures\n\n**Resolution**: Review workflow configuration and add appropriate error handling.\n`).join('\n')}

## Performance Issues
- **Slow execution**: Check API rate limits and network connectivity
- **Timeouts**: Increase timeout settings or optimize data processing
- **Memory issues**: Consider processing data in smaller batches

## Integration-Specific Troubleshooting

${workflow.integrations.map(integration => `### ${integration}
- Check API credentials and permissions
- Verify service status and rate limits
- Review integration-specific documentation
- Test with minimal data first`).join('\n\n')}

## Getting Help
1. Check n8n documentation
2. Review execution logs in n8n
3. Test individual nodes
4. Check community forums
5. Contact support if needed

---
*Need more help? Check the n8n community at community.n8n.io*`;
  }

  private generateCacheKey(input: N8nWorkflowInput): string {
    const keyData = `${input.workflowName}-${input.triggerType}-${input.integrations.join(',')}-${input.actionDescription.substring(0, 50)}`;
    return Buffer.from(keyData).toString('base64').substring(0, 50);
  }

  private generateFallbackWorkflow(input: N8nWorkflowInput, processingTime: number): GeneratedWorkflowPackage {
    return {
      ...this.generateStructuredFallback(input),
      tokensUsed: Math.floor(input.actionDescription.length / 4), // Rough estimate
      processingTime
    };
  }

  // Analytics and reporting methods
  async getWorkflowAnalyticsSummary(userId: string, workspaceId?: string, timeframe: 'week' | 'month' | 'quarter' = 'month') {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const dateFilter = new Date();
      switch (timeframe) {
        case 'week':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case 'month':
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
        case 'quarter':
          dateFilter.setMonth(dateFilter.getMonth() - 3);
          break;
      }

      const whereClause: any = {
        user_id: userId,
        type: 'n8n_workflow',
        created_at: {
          gte: dateFilter
        }
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const workflows = await prisma.deliverable.findMany({
        where: whereClause,
        select: {
          metadata: true,
          created_at: true
        }
      });

      return this.calculateWorkflowAnalyticsSummary(workflows, timeframe);
    } catch (error) {
      console.error('Error generating workflow analytics:', error);
      throw new Error('Failed to generate analytics summary');
    }
  }

private calculateWorkflowAnalyticsSummary(workflows: any[], timeframe: string) {
  const totalWorkflows = workflows.length;
  
  if (totalWorkflows === 0) {
    return {
      totalWorkflows: 0,
      averageComplexity: 'simple',
      averageNodeCount: 0,
      mostUsedTrigger: 'schedule',
      mostUsedIntegrations: [],
      timeframe,
      complexityDistribution: {},
      triggerDistribution: {},
      integrationUsage: {}
    };
  }

  const complexityCount: Record<string, number> = workflows.reduce((acc: Record<string, number>, workflow) => {
    const metadata = workflow.metadata as any;
    const complexity = metadata?.complexity || 'simple';
    acc[complexity] = (acc[complexity] || 0) + 1;
    return acc;
  }, {});

  const triggerCount: Record<string, number> = workflows.reduce((acc: Record<string, number>, workflow) => {
    const metadata = workflow.metadata as any;
    const trigger = metadata?.triggerType || 'schedule';
    acc[trigger] = (acc[trigger] || 0) + 1;
    return acc;
  }, {});

  const integrationCount: Record<string, number> = workflows.reduce((acc: Record<string, number>, workflow) => {
    const metadata = workflow.metadata as any;
    const integrations = metadata?.integrations || [];
    integrations.forEach((integration: string) => {
      acc[integration] = (acc[integration] || 0) + 1;
    });
    return acc;
  }, {});

  const averageNodeCount = Math.round(
    workflows.reduce((sum, workflow) => {
      const metadata = workflow.metadata as any;
      return sum + (metadata?.nodeCount || 0);
    }, 0) / totalWorkflows
  );

  const mostUsedTrigger = Object.entries(triggerCount)
    .sort(([aKey, aValue]: [string, number], [bKey, bValue]: [string, number]) => bValue - aValue)[0]?.[0] || 'schedule';

  const mostUsedIntegrations = Object.entries(integrationCount)
    .sort(([aKey, aValue]: [string, number], [bKey, bValue]: [string, number]) => bValue - aValue)
    .slice(0, 5)
    .map(([integration, count]: [string, number]) => ({ integration, count }));

  const dominantComplexity = Object.entries(complexityCount)
    .sort(([aKey, aValue]: [string, number], [bKey, bValue]: [string, number]) => bValue - aValue)[0]?.[0] || 'simple';

  return {
    totalWorkflows,
    averageComplexity: dominantComplexity,
    averageNodeCount,
    mostUsedTrigger,
    mostUsedIntegrations,
    timeframe,
    complexityDistribution: complexityCount,
    triggerDistribution: triggerCount,
    integrationUsage: integrationCount
  };
}
}