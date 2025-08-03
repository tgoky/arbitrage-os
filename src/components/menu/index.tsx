"use client";

import { useLogout, useMenu } from "@refinedev/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../menu/ThemeToggle";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Building2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap,
  Wrench,
  Users,
  Settings,
  Home,
  Sparkles,
  FileText,
  Tag
} from "lucide-react";
import { Portal } from "../portal/portal";
import { useTheme } from "../../providers/ThemeProvider";

const menuGroups = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Home className="h-4 w-4" />,
    items: ['blog_posts']
  },
  {
    id: 'content',
    label: 'Content Management',
    icon: <FileText className="h-4 w-4" />,
    items: ['categories']
  },
  {
    id: 'automations',
    label: 'Automations',
    icon: <Zap className="h-4 w-4" />,
    items: []
  }
];

interface Workspace {
  name: string;
  color: string;
}

export const Menu = () => {
  const { mutate: logout } = useLogout();
  const { menuItems, selectedKey } = useMenu();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [currentWorkspace, setCurrentWorkspace] = useState("Beeps");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { name: "Beeps", color: 'bg-indigo-500' }
  ]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['overview', 'content', 'automations']);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) {
      alert("Workspace name cannot be empty");
      return;
    }

    if (workspaces.some(w => w.name === newWorkspaceName)) {
      alert("Workspace name must be unique");
      return;
    }

    const colors = ['bg-blue-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500', 'bg-cyan-500', 'bg-purple-500', 'bg-green-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newWorkspace = { name: newWorkspaceName, color: randomColor };
    setWorkspaces([...workspaces, newWorkspace]);
    setCurrentWorkspace(newWorkspaceName);
    setNewWorkspaceName("");
    setCreateWorkspaceModalOpen(false);
  };

  const switchWorkspace = (workspaceName: string) => {
    setCurrentWorkspace(workspaceName);
    setWorkspaceDropdownOpen(false);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getCurrentWorkspaceColor = () => {
    return workspaces.find(w => w.name === currentWorkspace)?.color || 'bg-indigo-500';
  };

  const getMenuItemsByGroup = (groupItems: string[]) => {
    return menuItems.filter(item => groupItems.includes(item.name));
  };

  return (
    <div className={`
      h-screen sticky top-0 
      ${theme === 'dark' ? 
        'bg-gray-900 border-gray-700' : 
        'bg-white border-gray-200'
      }
      border-r flex flex-col transition-all duration-300
      ${collapsed ? "w-20" : "w-72"}
    `}>
      {/* Workspace Header */}
      <div className={`p-4 border-b ${
        theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
      }`}>
        {!collapsed ? (
          <div className="relative">
            <button
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                theme === 'dark' ? 
                  'bg-gray-900 hover:bg-gray-800' : 
                  'bg-white hover:bg-gray-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${getCurrentWorkspaceColor()} flex items-center justify-center text-white font-medium text-sm flex-shrink-0 shadow-sm`}>
                {currentWorkspace.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className={`font-semibold truncate ${
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {currentWorkspace}
                </div>
                <div className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Workspace
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                workspaceDropdownOpen ? "rotate-180" : ""
              } ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </button>

            {/* Workspace Dropdown */}
            {workspaceDropdownOpen && (
              <div className={`absolute left-0 right-0 mt-2 rounded-xl shadow-lg z-50 overflow-hidden backdrop-blur-sm ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border`}>
                <div className={`p-3 border-b ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <div className={`text-xs font-medium uppercase tracking-wide ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Your Workspaces
                  </div>
                </div>
                <div className="py-2">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.name}
                      onClick={() => switchWorkspace(workspace.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 ${
                        workspace.name === currentWorkspace
                          ? theme === 'dark' 
                            ? "bg-gray-700 border-r-2 border-indigo-500" 
                            : "bg-gray-100 border-r-2 border-indigo-500"
                          : theme === 'dark'
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg ${workspace.color} flex items-center justify-center text-white font-medium text-sm shadow-sm`}>
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`font-medium text-sm ${
                          workspace.name === currentWorkspace
                            ? theme === 'dark'
                              ? "text-indigo-300"
                              : "text-indigo-600"
                            : theme === 'dark'
                              ? "text-gray-200"
                              : "text-gray-700"
                        }`}>
                          {workspace.name}
                        </div>
                      </div>
                      {workspace.name === currentWorkspace && (
                        <div className={`w-2 h-2 rounded-full ${
                          theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-500'
                        }`}></div>
                      )}
                    </button>
                  ))}
                </div>
                <div className={`border-t p-2 ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <button
                    onClick={() => {
                      setWorkspaceDropdownOpen(false);
                      setCreateWorkspaceModalOpen(true);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                      theme === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg border-2 border-dashed ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                    } flex items-center justify-center`}>
                      <Plus className={`h-3 w-3 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <span className="font-medium text-sm">Create workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <div className={`w-10 h-10 rounded-xl ${getCurrentWorkspaceColor()} flex items-center justify-center text-white font-bold shadow-sm`}>
              {currentWorkspace.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={`flex items-center justify-between p-4 border-b ${
        theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
      }`}>
        {!collapsed && (
          <div className={`text-xs font-medium uppercase tracking-wide ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Navigation
          </div>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-2 rounded-lg ${
              theme === 'dark' 
                ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-600'
            } transition-colors`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className={`px-4 space-y-6 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}>
          {isClient && menuGroups.map((group) => {
            const groupItems = getMenuItemsByGroup(group.items);
            const isExpanded = expandedGroups.includes(group.id);
            
            if (groupItems.length === 0 && group.items.length > 0) {
              return null;
            }
            
            return (
              <div key={group.id}>
                <button
                  onClick={() => !collapsed && toggleGroup(group.id)}
                  className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-800' 
                      : 'text-gray-700 hover:bg-gray-100'
                  } transition-colors ${
                    collapsed ? "justify-center" : "justify-between"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      {group.icon}
                    </span>
                    {!collapsed && (
                      <span className="font-medium text-sm">
                        {group.label}
                      </span>
                    )}
                  </div>
                  {!collapsed && groupItems.length > 0 && (
                    <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  )}
                </button>

                {/* Group Items */}
                {(!collapsed && isExpanded && groupItems.length > 0) && (
                  <div className={`mt-2 ml-7 space-y-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {groupItems.map((item) => (
                      <Link
                        key={item.key}
                        href={item.route ?? "/"}
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm no-underline ${
                          selectedKey === item.key || pathname === item.route
                            ? theme === 'dark'
                              ? "bg-gray-800 text-indigo-300 font-medium border-r-2 border-indigo-500"
                              : "bg-gray-100 text-indigo-600 font-medium border-r-2 border-indigo-500"
                            : theme === 'dark'
                              ? "hover:bg-gray-800 hover:text-gray-100"
                              : "hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <MenuIcon name={item.name} />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Collapsed view - show items on hover */}
                {collapsed && groupItems.length > 0 && (
                  <div className="group relative">
                    <div className={`absolute left-full top-0 ml-2 hidden group-hover:block z-50 ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } border rounded-xl shadow-lg py-2 min-w-48 backdrop-blur-sm`}>
                      <div className={`px-3 py-2 border-b ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                      }`}>
                        <div className={`text-xs font-medium uppercase tracking-wide ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {group.label}
                        </div>
                      </div>
                      {groupItems.map((item) => (
                        <Link
                          key={item.key}
                          href={item.route ?? "/"}
                          className={`flex items-center gap-3 py-2.5 px-3 text-sm no-underline ${
                            selectedKey === item.key || pathname === item.route
                              ? theme === 'dark'
                                ? "bg-gray-700 text-indigo-300 font-medium"
                                : "bg-gray-100 text-indigo-600 font-medium"
                              : theme === 'dark'
                                ? "hover:bg-gray-700 text-gray-300"
                                : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <MenuIcon name={item.name} />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className={`p-4 border-t ${
        theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
                U
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  John Doe
                </p>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Administrator
                </p>
              </div>
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
              U
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`p-2.5 rounded-lg ${
              theme === 'dark' 
                ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-600'
            } transition-colors ${collapsed ? "mt-2" : ""}`}
            aria-label="Logout"
            title="Logout"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {createWorkspaceModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className={`rounded-2xl shadow-2xl w-full max-w-md border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-indigo-100'
                  }`}>
                    <Building2 className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Create workspace
                    </h2>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Set up a new workspace for your team
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="workspace-name" className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Workspace name
                    </label>
                    <input
                      type="text"
                      id="workspace-name"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'border-gray-300'
                      }`}
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      placeholder="Enter workspace name"
                    />
                  </div>
                  
                  <div className={`rounded-xl p-4 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Sparkles className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'
                      }`} />
                      <div>
                        <p className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Pro tip
                        </p>
                        <p className={`text-xs mt-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Choose a descriptive name that reflects your team or project. You can add members and customize settings after creation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => {
                      setCreateWorkspaceModalOpen(false);
                      setNewWorkspaceName("");
                    }}
                    className={`flex-1 px-4 py-3 border rounded-xl text-sm font-medium ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWorkspace}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                  >
                    Create workspace
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

const MenuIcon = ({ name }: { name: string }) => {
  const iconMap: Record<string, JSX.Element> = {
    blog_posts: <FileText className="h-4 w-4" />,
    categories: <Tag className="h-4 w-4" />,
    default: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  };

  return iconMap[name] || iconMap.default;
};