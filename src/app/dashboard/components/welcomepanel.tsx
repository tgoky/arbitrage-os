"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Button, Grid, Space, Spin, message, ConfigProvider, Tooltip } from 'antd';
import { 
  CalendarOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined, 
  FileDoneOutlined,
  ReloadOutlined,
  ThunderboltFilled,
  BellOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { useWorkItems } from '../../hooks/useDashboardData';
import { NotificationBell } from '../../../components/notification/NotificationBell';

const { useBreakpoint } = Grid;

// --- STYLING CONSTANTS ---
const MINT_COLOR = '#5CC49D';
const STEEL_COLOR = '#9DA2B3';
const GLASS_BG = 'rgba(255, 255, 255, 0.03)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.08)';
const GLASS_HOVER = 'rgba(255, 255, 255, 0.06)';

interface WelcomePanelProps {
  workspaceName: string;
  workspaceId?: string;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({
  workspaceName,
  workspaceId
}) => {
  const { theme } = useTheme();
  const screens = useBreakpoint();
  
  // Use React Query for work items
  const {
    data: workItems = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt
  } = useWorkItems();

  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      setLastRefreshTime(new Date());
      message.success('Statistics refreshed successfully');
    } catch (err) {
      message.error('Failed to refresh statistics');
    }
  }, [refetch]);

  const summaryStats = useMemo(() => {
    if (!Array.isArray(workItems) || workItems.length === 0) {
      return [
        { title: 'This Month', value: 0, icon: <CalendarOutlined />, color: MINT_COLOR, sub: '0 generated' },
        { title: 'Most Recent Tool', value: 'None', icon: <ToolOutlined />, color: '#1890ff', sub: 'Start creating' },
        { title: 'Last Active', value: 'N/A', icon: <ClockCircleOutlined />, color: '#faad14', sub: 'No activity' },
      ];
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthItems = workItems.filter(item => {
      try {
        if (!item.createdAt) return false;
        const itemDate = new Date(item.createdAt);
        return !isNaN(itemDate.getTime()) && itemDate >= thisMonth;
      } catch { return false; }
    });
    
    // Sort for most recent
    const sortedItems = [...workItems].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const mostRecentItem = sortedItems[0];

    // Tool display names
    const toolNames: Record<string, string> = {
      'sales-call': 'Sales Call',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calc',
      'niche-research': 'Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offer Creator',
      'ad-writer': 'Ad Writer',
      'n8n-workflow': 'Workflow',
      'proposal': 'Proposal',
      'lead-generation': 'Lead Gen'
    };

    const recentToolName = mostRecentItem ? toolNames[mostRecentItem.type] || 'Tool' : 'None';
    const recentToolTime = mostRecentItem?.createdAt || null;
    
    // Calculate relative time
    let relativeTime = 'N/A';
    if (recentToolTime) {
      const diffMs = now.getTime() - new Date(recentToolTime).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) relativeTime = 'Just now';
      else if (diffMins < 60) relativeTime = `${diffMins}m ago`;
      else if (diffHours < 24) relativeTime = `${diffHours}h ago`;
      else relativeTime = `${diffDays}d ago`;
    }

    return [
      { 
        title: 'This Month', 
        value: thisMonthItems.length, 
        icon: <CalendarOutlined />, 
        color: MINT_COLOR,
        sub: 'Total Generated'
      },
      { 
        title: 'Most Recent Tool', 
        value: recentToolName, 
        icon: <ToolOutlined />, 
        color: '#1890ff',
        isText: true,
        sub: 'Latest Action'
      },
      { 
        title: 'Last Active', 
        value: relativeTime, 
        icon: <ClockCircleOutlined />, 
        color: '#faad14',
        isText: true,
        sub: 'Session Time'
      },
    ];
  }, [workItems]);

  // --- RENDERING ---

  if (isError) {
    return (
      <div className="p-6 rounded-xl border border-red-900/30 bg-red-900/10 text-center text-red-400 font-manrope">
        <p>Unable to load workspace statistics.</p>
        <Button type="text" onClick={handleRefresh} className="text-red-400 underline">Retry</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-12 rounded-xl border flex flex-col items-center justify-center gap-4"
           style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}>
        <Spin size="large" />
        <span style={{ color: STEEL_COLOR }} className="font-manrope text-sm">Synchronizing workspace...</span>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Manrope', sans-serif",
          colorPrimary: MINT_COLOR,
        }
      }}
    >
      <div className="w-full mb-6 font-manrope">
        
        {/* HEADER ROW */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          
          {/* LOGO / TITLE AREA */}
          <div>
            <div className="flex items-center gap-2 mb-1">
               <div className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-white/5 border border-white/10 text-gray-400">
                  Workspace Dashboard
               </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white m-0 tracking-tight leading-tight uppercase">
              <span className="text-[#5CC49D] animate-pulse" style={{ textShadow: '0 0 10px rgba(92,196,157,0.4)' }}>a</span>rb
              <span className="text-[#5CC49D] animate-pulse" style={{ textShadow: '0 0 10px rgba(92,196,157,0.4)' }}>i</span>trageOS
              <span className="text-gray-500 text-lg ml-2 font-medium normal-case tracking-normal">by GrowAI</span>
            </h1>
          </div>

          {/* ACTIONS AREA */}
          <div className="flex items-center gap-3">
             <div className="hidden md:block text-right mr-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Data Freshness</div>
                <div className="text-xs text-[#9DA2B3]">
                   {(lastRefreshTime || new Date(dataUpdatedAt || Date.now())).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
             </div>
             
             <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>
             
             <NotificationBell />
             
             <Tooltip title="Refresh Data">
                <Button 
                    type="text" 
                    icon={<ReloadOutlined spin={isFetching} />} 
                    onClick={handleRefresh}
                    className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                />
             </Tooltip>
          </div>
        </div>

        {/* MAIN STATS CONTAINER */}
        <div 
          className="rounded-2xl p-1 relative overflow-hidden group"
          style={{ 
            background: `linear-gradient(135deg, ${GLASS_BORDER}, transparent)`,
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
          }}
        >
          {/* Inner Glass Layer */}
          <div 
            className="rounded-xl p-5 md:p-6"
            style={{ 
              background: 'rgba(11, 12, 16, 0.85)', // Darker opaque bg for contrast
              backdropFilter: 'blur(20px)',
            }}
          >
             
             {/* STATS GRID */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {summaryStats.map((stat, idx) => (
                   <div 
                      key={idx}
                      className="rounded-xl p-4 flex items-center gap-4 transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/5"
                   >
                      {/* Icon Box */}
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg"
                        style={{ 
                           background: `linear-gradient(135deg, ${stat.color}20, transparent)`,
                           color: stat.color,
                           border: `1px solid ${stat.color}30`
                        }}
                      >
                         {stat.icon}
                      </div>

                      {/* Text Content */}
                      <div>
                         <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">
                            {stat.title}
                         </div>
                         <div className="text-xl md:text-2xl font-bold text-white leading-none">
                            {stat.value}
                         </div>
                         <div className="text-[10px] text-[#5CC49D] mt-1 font-medium">
                            {stat.sub}
                         </div>
                      </div>
                   </div>
                ))}
             </div>

             {/* FOOTER / METADATA ROW */}
             <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                
                {/* Workspace ID */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                   <FolderOpenOutlined style={{ color: MINT_COLOR }} />
                   <span className="text-gray-400 font-semibold">Workspace:</span>
                   <span className="text-white font-bold tracking-wide">{workspaceName}</span>
                   {workspaceId && <span className="text-gray-600 font-mono text-[10px] ml-1 opacity-60">#{workspaceId.slice(0,6)}</span>}
                </div>

                {/* Status Items */}
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 text-gray-400">
                      <ThunderboltFilled style={{ color: '#faad14' }} />
                      <span>Pro Plan Active</span>
                   </div>
                   <div className="flex items-center gap-2 text-gray-400">
                      <FileDoneOutlined style={{ color: MINT_COLOR }} />
                      <span className="text-white font-semibold">{workItems.length}</span> Total Items
                   </div>
                </div>

             </div>

          </div>
        </div>

      </div>
    </ConfigProvider>
  );
};

export default WelcomePanel;