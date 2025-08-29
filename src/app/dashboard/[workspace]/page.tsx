"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useList } from '@refinedev/core';
import { Grid } from 'antd';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkspace } from '../../hooks/useWorkspace';
import { WorkspaceValidationError } from '../../../components/WorkspaceValidationError';
import WelcomePanel from '../components/welcomepanel';
import QuickStartActions from '../components/quickactions';
import ActivityFeed from '../components/activityfeed';
import RecentDeliverables from '../components/recentdeliveries';
import { AutomationItem, ActivityItem, Deliverable, AgentRecord, WorkflowRecord, DeliverableRecord } from '../components/types';
import { EnhancedLoadingState } from '../../../components/loadingui/loading';

const { useBreakpoint } = Grid;

const WorkspaceDashboard = () => {
  const params = useParams();
  const router = useRouter();
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const workspaceSlug = params?.workspace as string;


  const {
    currentWorkspace,
    workspaces,
    isLoading,
    validationError,
    
    switchWorkspace
  } = useWorkspace();

  // Always call hooks unconditionally - move early returns after all hooks
  const shouldFetchData = !!currentWorkspace && !validationError;

  const { data: clientsData, isLoading: isClientsLoading } = useList({
    resource: 'clients',
    filters: currentWorkspace ? [
      { field: 'workspace_id', operator: 'eq', value: currentWorkspace.id }
    ] : [],
    queryOptions: {
      enabled: shouldFetchData
    }
  });

  const { data: agentsData, isLoading: isAgentsLoading } = useList<AgentRecord>({
    resource: 'agents',
    filters: currentWorkspace ? [
      { field: 'workspace_id', operator: 'eq', value: currentWorkspace.id }
    ] : [],
    queryOptions: {
      enabled: shouldFetchData
    }
  });

  const { data: workflowsData, isLoading: isWorkflowsLoading } = useList<WorkflowRecord>({
    resource: 'workflows',
    filters: currentWorkspace ? [
      { field: 'workspace_id', operator: 'eq', value: currentWorkspace.id }
    ] : [],
    queryOptions: {
      enabled: shouldFetchData
    }
  });

  const { data: deliverablesData, isLoading: isDeliverablesLoading } = useList<DeliverableRecord>({
    resource: 'deliverables',
    filters: currentWorkspace ? [
      { field: 'workspace_id', operator: 'eq', value: currentWorkspace.id }
    ] : [],
    queryOptions: {
      enabled: shouldFetchData
    }
  });

  // Effects must be called before any conditional returns
// useEffect(() => {
//   if (!isLoading && workspaceSlug && workspaces.length > 0) {
//     const workspace = workspaces.find(w => w.slug === workspaceSlug);
//     if (workspace && (!currentWorkspace || currentWorkspace.slug !== workspaceSlug)) {
//       console.log('URL workspace found, switching to:', workspace);
//       switchWorkspace(workspaceSlug);
//     } else if (!workspace) {
//       console.log('Workspace not found in user workspaces, redirecting...');
//       // setValidationError('Workspace not found or access denied');
//     }
//   }
// }, [workspaceSlug, workspaces, currentWorkspace, isLoading, switchWorkspace])

  // Now handle conditional renders AFTER all hooks
  if (validationError) {
    return <WorkspaceValidationError />;
  }

  const isDataLoading = isLoading || isClientsLoading || isAgentsLoading || isWorkflowsLoading || isDeliverablesLoading;

  if (isDataLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <EnhancedLoadingState theme={theme} />
      </div>
    );
  }

  if (!currentWorkspace && !isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${
        theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Workspace Not Found</h1>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            The workspace {workspaceSlug} could not be found or you dont have access to it.
          </p>
          <div className="space-y-3">
            {workspaces.length > 0 && (
              <button
                onClick={() => router.push(`/dashboard/${workspaces[0].slug}`)}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Go to Available Workspace
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className={`px-6 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Go to Workspaces
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safe to use currentWorkspace here since we've handled null cases above
  const clients = clientsData?.data || [];
  const agents = agentsData?.data || [];
  const workflows = workflowsData?.data || [];
  const deliverables = deliverablesData?.data || [];

  const recentDeliverables: Deliverable[] = deliverables.slice(0, 4).map((item) => ({
    id: item.id,
    title: item.title || 'Untitled Deliverable',
    clientId: item.clientId || 'Unknown Client',
  }));

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

  // Mock activity data - currentWorkspace is guaranteed to exist here
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

  return (
    <div
      className="w-full h-full"
      style={{
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        padding: screens.xs ? '16px' : '24px',
        minHeight: '100vh',
      }}
    >
  {currentWorkspace && (
  <WelcomePanel
    workspaceName={currentWorkspace.name}
    workspaceId={currentWorkspace.id}
  />
)}
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
    </div>
  );
};

export default WorkspaceDashboard;