"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useList } from '@refinedev/core';
import { Grid } from 'antd';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkspace } from '../../hooks/useWorkspace';
import WelcomePanel from '../components/welcomepanel';
import QuickStartActions from '../components/quickactions';
import ActivityFeed from '../components/activityfeed';
import RecentDeliverables from '../components/recentdeliveries';
import StatsOverview from '../components/statsoverview';
import { AutomationItem, ActivityItem, Deliverable, AgentRecord, WorkflowRecord, DeliverableRecord } from '../components/types';
import { EnhancedLoadingState } from '../../../components/loadingui/loading'; // Import the EnhancedLoadingState

const { useBreakpoint } = Grid;

const WorkspaceDashboard = () => {
  const params = useParams();
  const router = useRouter();
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const workspaceSlug = params?.workspace as string;
  
  // Use the workspace hook instead of local state
  const { 
    currentWorkspace, 
    workspaces, 
    isLoading, 
    switchWorkspace 
  } = useWorkspace();

  // Ensure we're on the right workspace
  useEffect(() => {
    if (!isLoading && workspaceSlug && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.slug === workspaceSlug);
      if (workspace && (!currentWorkspace || currentWorkspace.slug !== workspaceSlug)) {
        switchWorkspace(workspaceSlug);
      } else if (!workspace) {
        // Workspace not found, redirect to first available workspace or home
        if (workspaces.length > 0) {
          router.push(`/dashboard/${workspaces[0].slug}`);
        } else {
          router.push('/');
        }
      }
    }
  }, [workspaceSlug, workspaces, currentWorkspace, isLoading, switchWorkspace, router]);

  // Fetch data with workspace context
  const { data: clientsData, isLoading: isClientsLoading } = useList({ 
    resource: 'clients',
    filters: currentWorkspace ? [
      { field: 'workspaceId', operator: 'eq', value: currentWorkspace.id }
    ] : []
  });
  
  const { data: agentsData, isLoading: isAgentsLoading } = useList<AgentRecord>({ 
    resource: 'agents',
    filters: currentWorkspace ? [
      { field: 'workspaceId', operator: 'eq', value: currentWorkspace.id }
    ] : []
  });
  
  const { data: workflowsData, isLoading: isWorkflowsLoading } = useList<WorkflowRecord>({ 
    resource: 'workflows',
    filters: currentWorkspace ? [
      { field: 'workspaceId', operator: 'eq', value: currentWorkspace.id }
    ] : []
  });
  
  const { data: deliverablesData, isLoading: isDeliverablesLoading } = useList<DeliverableRecord>({ 
    resource: 'deliverables',
    filters: currentWorkspace ? [
      { field: 'workspaceId', operator: 'eq', value: currentWorkspace.id }
    ] : []
  });

  const clients = clientsData?.data || [];
  const agents = agentsData?.data || [];
  const workflows = workflowsData?.data || [];
  const deliverables = deliverablesData?.data || [];

  // Transform deliverables to match Deliverable type
  const recentDeliverables: Deliverable[] = deliverables.slice(0, 4).map((item) => ({
    id: item.id,
    title: item.title || 'Untitled Deliverable',
    clientId: item.clientId || 'Unknown Client',
  }));

  // Transform agents and workflows to match AutomationItem type
  const runningAutomations: AutomationItem[] = [
    ...agents.slice(0, 2).map((agent) => ({
      id: agent.id,
      name: agent.name || 'Unnamed Agent',
      type: 'agent' as const,
      description: agent.description,
      assignedClient: agent.assignedClient,
      status: agent.status,
      eta: agent.eta,
    })),
    ...workflows.slice(0, 1).map((workflow) => ({
      id: workflow.id,
      name: workflow.name || 'Unnamed Workflow',
      type: 'workflow' as const,
      description: workflow.description,
      assignedClient: workflow.assignedClient,
      status: workflow.status,
      eta: workflow.eta || '2 min',
    })),
  ];

  // Mock activity data (replace with workspace-specific data)
  const recentActivity: ActivityItem[] = [
    {
      id: 1,
      type: 'tool',
      action: 'Clarity Wizard',
      client: 'TechStart Inc',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'completed',
    },
    {
      id: 2,
      type: 'agent',
      action: 'Lead Scorer Bot',
      client: 'GrowthCo',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'running',
    },
    {
      id: 3,
      type: 'workflow',
      action: 'Weekly Report Generator',
      client: 'ScaleUp Agency',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      status: 'completed',
    },
    {
      id: 4,
      type: 'deliverable',
      action: 'Market Analysis Report',
      client: 'InnovateCorp',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      status: 'created',
    },
  ];

  // Check if any data is still loading
  const isDataLoading = isLoading || isClientsLoading || isAgentsLoading || isWorkflowsLoading || isDeliverablesLoading;

 if (isDataLoading) {
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <EnhancedLoadingState theme={theme} />
    </div>
  );
}
  if (!currentWorkspace) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${
        theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Workspace Not Found</h1>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            The workspace {workspaceSlug} could not be found.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Go to Workspaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full"
      style={{
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        padding: screens.xs ? '16px' : '24px',
        minHeight: '100vh',
      }}
    >
      <WelcomePanel
        clientsLength={clients.length}
        agentsLength={agents.length}
        workflowsLength={workflows.length}
        workspaceName={currentWorkspace.name}  
      />
      
      <QuickStartActions />
      
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: screens.lg ? 'repeat(2, 1fr)' : '1fr',
          gap: 24,
          marginBottom: 24,
        }}
      >
        <ActivityFeed recentActivity={recentActivity} />
        <RecentDeliverables deliverables={recentDeliverables} />
      </div>
      
      <StatsOverview
        clientsLength={clients.length}
        agentsLength={agents.length}
        workflowsLength={workflows.length}
        deliverablesLength={deliverables.length}
      />
    </div>
  );
};

export default WorkspaceDashboard;