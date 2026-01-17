// app/dashboard/[workspace]/crews/page.tsx
"use client";

import { useState } from 'react';
import { Tabs, Layout } from 'antd';
import {
  AppstoreOutlined,
  BuildOutlined,
  HistoryOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { CrewTemplateGallery } from '../../components/crew/CrewTemplateGallery';
import { VisualCrewBuilder } from '../../components/crew/VisualCrewBuilder';
import { CrewExecutionMonitor } from '../../components/crew/CrewExecutionMonitor';
import { CrewChatInterface } from '../../components/crew/CrewChatInterface';
import { useWorkspaceContext } from '@/app/hooks/useWorkspaceContext';

const { Content } = Layout;
const { TabPane } = Tabs;

export default function CrewsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const [activeTab, setActiveTab] = useState('gallery');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);

  if (!currentWorkspace) {
    return <div>Loading...</div>;
  }

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setActiveTab('builder');
  };

  const handleExecutionStart = (execId: string) => {
    setExecutionId(execId);
    setActiveTab('monitor');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Content style={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ padding: '0 24px' }}
        >
          <TabPane
            tab={
              <span>
                <AppstoreOutlined />
                Template Gallery
              </span>
            }
            key="gallery"
          >
            <CrewTemplateGallery
              workspaceId={currentWorkspace.id}
              onSelectTemplate={setSelectedTemplate}
              onUseTemplate={handleUseTemplate}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <BuildOutlined />
                Crew Builder
              </span>
            }
            key="builder"
          >
            <VisualCrewBuilder
              workspaceId={currentWorkspace.id}
              initialCrew={selectedTemplate}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <MessageOutlined />
                Chat & Execute
              </span>
            }
            key="chat"
          >
            <div style={{ height: 'calc(100vh - 120px)' }}>
              <CrewChatInterface
                workspaceId={currentWorkspace.id}
                agents={selectedTemplate?.agents || []}
                onExecutionStart={handleExecutionStart}
              />
            </div>
          </TabPane>

          {executionId && (
            <TabPane
              tab={
                <span>
                  <HistoryOutlined />
                  Execution Monitor
                </span>
              }
              key="monitor"
            >
              <CrewExecutionMonitor
                executionId={executionId}
                workspaceId={currentWorkspace.id}
                autoRefresh
              />
            </TabPane>
          )}
        </Tabs>
      </Content>
    </Layout>
  );
}