import { create } from 'zustand';

export interface Client {
  id: string;
  name: string;
  stage: 'Idea' | 'Prelaunch' | 'Active' | 'Scaling';
  services: string[];
  lastActivity: Date;
  tags: string[];
  
  // Core Business Information
  offerSummary?: string;
  industry?: string;
  targetAudience?: string;
  pricing?: string;
  
  // Detailed Business Information
  businessModel?: string;
  revenueModel?: string;
  competitiveAdvantage?: string;
  uniqueValueProposition?: string;
  
  // Market Information
  marketSize?: string;
  targetMarket?: string;
  customerSegments?: string;
  geographicFocus?: string;
  
  // Financial Information
  monthlyRevenue?: string;
  customerLifetimeValue?: string;
  customerAcquisitionCost?: string;
  profitMargin?: string;
  
  // Operational Information
  teamSize?: string;
  fundingStage?: string;
  technologyStack?: string;
  keyPartnerships?: string;
  
  // Marketing & Sales
  marketingChannels?: string[];
  salesProcess?: string;
  conversionRate?: string;
  averageDealSize?: string;
  
  // Customer Information
  customerPainPoints?: string;
  customerGoals?: string;
  customerFeedback?: string;
  customerSuccessMetrics?: string;
  
  // Competitive Landscape
  competitors?: string;
  competitiveAnalysis?: string;
  marketPosition?: string;
  differentiationStrategy?: string;
  
  // Services & Products
  products?: string[];
  serviceDelivery?: string;
  qualityMetrics?: string;
  
  // Goals & Objectives
  shortTermGoals?: string;
  longTermGoals?: string;
  keyPerformanceIndicators?: string;
  successMetrics?: string;
  
  // Contact & Communication
  primaryContact?: string;
  communicationPreferences?: string;
  meetingFrequency?: string;
  reportingRequirements?: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  inputs: Record<string, any>;
  outputs: any[];
  lastUsed?: Date;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  platform: string;
  status: 'active' | 'paused' | 'stopped';
  assignedClient?: string;
  trigger: 'schedule' | 'manual' | 'webhook';
  eta?: string;
}

export interface Workflow {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'paused' | 'stopped';
  assignedClient?: string;
  trigger: string;
  lastRun?: Date;
}

export interface Deliverable {
  id: string;
  title: string;
  type: string;
  clientId: string;
  toolId: string;
  content: any;
  createdAt: Date;
  status: 'draft' | 'completed' | 'exported';
}

interface AppState {
  // State
  clients: Client[];
  tools: Tool[];
  agents: Agent[];
  workflows: Workflow[];
  deliverables: Deliverable[];
  selectedClient?: Client;
  sidebarCollapsed: boolean;
  darkMode: boolean;
  
  // Actions
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  setSelectedClient: (client?: Client) => void;
  
  addTool: (tool: Omit<Tool, 'id'>) => void;
  updateTool: (id: string, updates: Partial<Tool>) => void;
  
  addAgent: (agent: Omit<Agent, 'id'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  
  addWorkflow: (workflow: Omit<Workflow, 'id'>) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  
  addDeliverable: (deliverable: Omit<Deliverable, 'id'>) => void;
  updateDeliverable: (id: string, updates: Partial<Deliverable>) => void;
  
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  clients: [],
  tools: [],
  agents: [],
  workflows: [],
  deliverables: [],
  sidebarCollapsed: false,
  darkMode: typeof window !== 'undefined' ? localStorage.getItem('darkMode') === 'true' : false,
  
  // Actions
  addClient: (client) => set((state) => ({
    clients: [...state.clients, { ...client, id: Date.now().toString() }]
  })),
  
  updateClient: (id, updates) => set((state) => ({
    clients: state.clients.map(client => 
      client.id === id ? { ...client, ...updates } : client
    )
  })),
  
  deleteClient: (id) => set((state) => ({
    clients: state.clients.filter(client => client.id !== id)
  })),
  
  setSelectedClient: (client) => set({ selectedClient: client }),
  
  addTool: (tool) => set((state) => ({
    tools: [...state.tools, { ...tool, id: Date.now().toString() }]
  })),
  
  updateTool: (id, updates) => set((state) => ({
    tools: state.tools.map(tool => 
      tool.id === id ? { ...tool, ...updates } : tool
    )
  })),
  
  addAgent: (agent) => set((state) => ({
    agents: [...state.agents, { ...agent, id: Date.now().toString() }]
  })),
  
  updateAgent: (id, updates) => set((state) => ({
    agents: state.agents.map(agent => 
      agent.id === id ? { ...agent, ...updates } : agent
    )
  })),
  
  deleteAgent: (id) => set((state) => ({
    agents: state.agents.filter(agent => agent.id !== id)
  })),
  
  addWorkflow: (workflow) => set((state) => ({
    workflows: [...state.workflows, { ...workflow, id: Date.now().toString() }]
  })),
  
  updateWorkflow: (id, updates) => set((state) => ({
    workflows: state.workflows.map(workflow => 
      workflow.id === id ? { ...workflow, ...updates } : workflow
    )
  })),
  
  deleteWorkflow: (id) => set((state) => ({
    workflows: state.workflows.filter(workflow => workflow.id !== id)
  })),
  
  addDeliverable: (deliverable) => set((state) => ({
    deliverables: [...state.deliverables, { ...deliverable, id: Date.now().toString() }]
  })),
  
  updateDeliverable: (id, updates) => set((state) => ({
    deliverables: state.deliverables.map(deliverable => 
      deliverable.id === id ? { ...deliverable, ...updates } : deliverable
    )
  })),
  
  toggleSidebar: () => set((state) => ({ 
    sidebarCollapsed: !state.sidebarCollapsed 
  })),
  
  toggleDarkMode: () => set((state) => {
    const newDarkMode = !state.darkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', newDarkMode.toString());
    }
    return { darkMode: newDarkMode };
  }),
})); 