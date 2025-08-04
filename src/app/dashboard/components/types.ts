// app/dashboard/components/types.ts
import { BaseRecord, BaseKey } from '@refinedev/core';

export type AutomationItem = {
  id: BaseKey; // Use BaseKey from refinedev for IDs
  name: string;
  type: 'agent' | 'workflow';
  description?: string;
  assignedClient?: string;
  status?: string;
  eta?: string;
};

export type ActivityItem = {
  id: number;
  type: string;
  action: string;
  client: string;
  timestamp: Date;
  status: string;
};

export type Deliverable = {
  id: BaseKey;
  title: string;
  clientId: string;
};

// Extend BaseRecord to include expected properties for agents, workflows, and deliverables
export interface AgentRecord extends BaseRecord {
  id: BaseKey;
  name: string;
  description?: string;
  assignedClient?: string;
  status?: string;
  eta?: string;
}

export interface WorkflowRecord extends BaseRecord {
  id: BaseKey;
  name: string;
  description?: string;
  assignedClient?: string;
  status?: string;
  eta?: string;
}

export interface DeliverableRecord extends BaseRecord {
  id: BaseKey;
  title: string;
  clientId: string;
}