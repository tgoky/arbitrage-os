"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Grid } from 'antd';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useDashboardData } from '../../hooks/useDashboardData';
import { WorkspaceValidationError } from '../../../components/WorkspaceValidationError';
import WelcomePanel from '../components/welcomepanel';
import QuickStartActions from '../components/quickactions';
import ActivityFeed from '../components/activityfeed';
import RecentDeliverables from '../components/recentdeliveries';
import CelebrationMilestonesPanel from '../../../components/heatmaps/celebrationmilestones';
import ActivityHeatmap from '../../../components/heatmaps/activityheatmap';
import { ActivityItem, Deliverable } from '../components/types';
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
    isLoading: workspaceLoading,
    validationError,
    switchWorkspace
  } = useWorkspace();

  const {
    workItems,
    clients,
    agents,
    workflows,
    deliverables,
    isLoading: dataLoading,
    isError,
    error,
    refetchAll,
    queries
  } = useDashboardData();

  const isLoading = workspaceLoading || dataLoading;

  useEffect(() => {
    if (!workspaceLoading && workspaceSlug && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.slug === workspaceSlug);
      if (workspace && (!currentWorkspace || currentWorkspace.slug !== workspaceSlug)) {
        console.log('URL workspace found, switching to:', workspace);
        switchWorkspace(workspaceSlug);
      } else if (!workspace) {
        console.log('Workspace not found in user workspaces');
      }
    }
  }, [workspaceSlug, workspaces, currentWorkspace, workspaceLoading, switchWorkspace]);

  if (validationError) {
    return <WorkspaceValidationError />;
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-slate-50'}`}>
        <EnhancedLoadingState theme={theme} />
      </div>
    );
  }

  if (!currentWorkspace && !workspaceLoading) {
    return (
      <div 
        className={`min-h-screen flex flex-col items-center justify-center ${
          theme === 'dark' ? 'bg-black text-white' : 'bg-slate-50 text-gray-900'
        }`}
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.3) 0%, rgba(0, 0, 0, 1) 70%)'
            : 'radial-gradient(ellipse at center, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 1) 70%)',
        }}
      >
        <div 
          className="text-center p-8 rounded-2xl backdrop-blur-xl"
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
            boxShadow: theme === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Workspace Not Found
          </h1>
          <p className={`mb-8 text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            The workspace {workspaceSlug} could not be found or you do not have access to it.
          </p>
          <div className="space-y-4">
            {workspaces.length > 0 && (
              <button
                onClick={() => router.push(`/dashboard/${workspaces[0].slug}`)}
                className={`px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                Go to Available Workspace
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className={`px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-lg hover:shadow-xl'
              }`}
            >
              Go to Workspaces
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div 
        className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-slate-50'}`}
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.3) 0%, rgba(0, 0, 0, 1) 70%)'
            : 'radial-gradient(ellipse at center, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 1) 70%)',
        }}
      >
        <div className={`max-w-4xl mx-auto p-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <div 
            className="text-center p-8 rounded-2xl backdrop-blur-xl"
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
              boxShadow: theme === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-500 to-orange-600 bg-clip-text text-transparent">
              Unable to Load Dashboard
            </h1>
            <p className={`mb-8 text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {(error as Error)?.message || 'An error occurred while loading your dashboard data.'}
            </p>
            <button
              onClick={refetchAll}
              className={`px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const recentDeliverables: Deliverable[] = (workItems || []).slice(0, 6).map((item) => ({
    id: item.id,
    title: item.title,
    clientId: item.subtitle.split('•')[0]?.trim() || 'Unknown Client',
    type: item.type,
    content: item.rawData.content,
    workspace_id: item.metadata.workspace_id,
    created_at: item.createdAt,
    updated_at: item.rawData.updatedAt,
  }));

  const recentActivity: ActivityItem[] = (workItems || []).slice(0, 8).map((item, index) => ({
    id: index + 1,
    type: item.type,
    action: item.title,
    client: item.subtitle.split('•')[0]?.trim() || 'Unknown Client',
    timestamp: new Date(item.createdAt),
    status: item.status,
  }));

  return (
    <div
      className="w-full h-full"
      style={{
        background: theme === 'dark' 
          ? 'radial-gradient(ellipse at top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 1) 50%)'
          : 'radial-gradient(ellipse at top, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 1) 50%)',
        padding: screens.xs ? '16px' : '24px',
        paddingTop: screens.xs ? '8px' : '12px',
        minHeight: '100vh',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Slim WelcomePanel at the very top */}
      {currentWorkspace && (
        <div
          style={{
            marginBottom: 16,
            borderRadius: '12px',
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
            boxShadow: theme === 'dark'
              ? '0 2px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : '0 2px 16px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <WelcomePanel
            workspaceName={currentWorkspace.name}
            workspaceId={currentWorkspace.id}
          />
        </div>
      )}

      {/* QuickStartActions Container */}
      <div
        style={{
          marginBottom: 24,
          borderRadius: '16px',
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
          boxShadow: theme === 'dark'
            ? '0 4px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 4px 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <QuickStartActions workspaceId={currentWorkspace?.id} />
      </div>

      {/* Cards Grid Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: screens.lg ? 'repeat(2, 1fr)' : '1fr',
          gap: 24,
          marginBottom: 24,
          height: '450px',
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
          borderRadius: '20px',
          padding: '12px',
          backdropFilter: 'blur(20px)',
          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          boxShadow: theme === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        }}
      >
        <div
          style={{
            background: theme === 'dark' 
              ? 'rgba(17, 24, 39, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            boxShadow: theme === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)'
              : '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(16px)',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            overflow: 'hidden',
            height: '100%',
          }}
        >
          <ActivityFeed 
            recentActivity={recentActivity}
            workspaceId={currentWorkspace?.id}
            maxItems={8}
          />
        </div>

        <div
          style={{
            background: theme === 'dark' 
              ? 'rgba(17, 24, 39, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            boxShadow: theme === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)'
              : '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(16px)',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            overflow: 'hidden',
            height: '100%',
          }}
        >
          <RecentDeliverables 
            deliverables={recentDeliverables}
            workspaceId={currentWorkspace?.id}
            maxItems={6}
          />
        </div>
      </div>

      {/* New Celebration & Analytics Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: screens.lg ? 'repeat(2, 1fr)' : '1fr',
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Celebration & Milestones Panel */}
        <div
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
            borderRadius: '16px',
            boxShadow: theme === 'dark'
              ? '0 4px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : '0 4px 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(16px)',
            padding: '16px',
          }}
        >
          <CelebrationMilestonesPanel 
            currentWorkspace={currentWorkspace}
          />
        </div>

        {/* Activity Heatmap */}
        <div
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
            borderRadius: '16px',
            boxShadow: theme === 'dark'
              ? '0 4px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : '0 4px 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(16px)',
            padding: '16px',
          }}
        >
          <ActivityHeatmap 
            currentWorkspace={currentWorkspace}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;