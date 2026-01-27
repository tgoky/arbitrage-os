"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Grid, ConfigProvider } from 'antd';
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
    isLoading: dataLoading,
    isError,
    error,
    refetchAll
  } = useDashboardData();

  const isDark = theme === 'dark';
  const fontFamily = "'Manrope', sans-serif";
  const bgStyle = isDark ? '#000000' : '#f8fafc';

  // Handle workspace switching from URL
  useEffect(() => {
    if (!workspaceLoading && workspaceSlug && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.slug === workspaceSlug);
      if (workspace && (!currentWorkspace || currentWorkspace.slug !== workspaceSlug)) {
        console.log('URL workspace found, switching to:', workspace);
        switchWorkspace(workspaceSlug);
      }
    }
  }, [workspaceSlug, workspaces, currentWorkspace, workspaceLoading, switchWorkspace]);

  // --- CRITICAL: Check if URL matches current workspace ---
  const isWorkspaceMismatch = currentWorkspace && workspaceSlug && currentWorkspace.slug !== workspaceSlug;
  const isLoading = workspaceLoading || dataLoading || isWorkspaceMismatch;

  // --- Render States ---

  if (validationError) return <WorkspaceValidationError />;

  if (isLoading) {
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: bgStyle }}>
        <EnhancedLoadingState theme={theme} />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center" style={{ backgroundColor: bgStyle, fontFamily }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h1 style={{ color: isDark ? '#fff' : '#000', fontSize: '24px', fontWeight: 700 }}>Workspace Not Found</h1>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Go to Workspaces
          </button>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: bgStyle, fontFamily }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Unable to Load Dashboard</h2>
          <p className="mt-2 text-sm opacity-80">{(error as Error)?.message}</p>
          <button 
            onClick={refetchAll}
            className="mt-4 px-6 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // At this point, workspace is guaranteed to exist and match URL
  const workspace = currentWorkspace;

  // --- Data Transformation ---
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

  const recentActivity: ActivityItem[] = (workItems || []).slice(0, 10).map((item, index) => ({
    id: index + 1,
    type: item.type,
    action: item.title,
    client: item.subtitle.split('•')[0]?.trim() || 'Unknown Client',
    timestamp: new Date(item.createdAt),
    status: item.status,
  }));

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: fontFamily,
          colorBgBase: isDark ? '#000000' : '#ffffff',
          colorTextBase: isDark ? '#ffffff' : '#000000',
        }
      }}
    >
      <div
        style={{
          backgroundColor: bgStyle,
          minHeight: '100vh',
          padding: screens.xs ? '16px' : '32px',
          fontFamily: fontFamily,
          transition: 'background-color 0.3s ease'
        }}
      >
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          
          {/* 1. Welcome Panel */}
          <div style={{ marginBottom: 32 }}>
            <WelcomePanel
              workspaceName={workspace.name}
              workspaceId={workspace.id}
            />
          </div>

          {/* 2. Quick Actions */}
          <div style={{ marginBottom: 32 }}>
            <QuickStartActions workspaceId={workspace.id} />
          </div>

          {/* 3. Activity & Deliverables Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: screens.xl ? '1fr 1fr' : '1fr',
              gap: 24,
              marginBottom: 32,
              alignItems: 'stretch'
            }}
          >
            <div style={{ minHeight: '450px' }}>
              <ActivityFeed 
                recentActivity={recentActivity}
                workspaceId={workspace.id}
                maxItems={8}
              />
            </div>

            <div style={{ minHeight: '450px' }}>
              <RecentDeliverables 
                deliverables={recentDeliverables}
                workspaceId={workspace.id}
                maxItems={6}
              />
            </div>
          </div>

          {/* 4. Analytics & Heatmaps Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: screens.xl ? '1fr 1fr' : '1fr',
              gap: 24,
              marginBottom: 32,
            }}
          >
            <div>
              <CelebrationMilestonesPanel 
                currentWorkspace={workspace}
              />
            </div>

            <div>
              <ActivityHeatmap 
                currentWorkspace={workspace}
              />
            </div>
          </div>
          
        </div>
      </div>
    </ConfigProvider>
  );
};

export default WorkspaceDashboard;