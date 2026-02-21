"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { useWorkspaceContext } from "../../app/hooks/useWorkspaceContext";
import { useAIChat } from "../../app/hooks/useAIChat";
import {
  MessageSquare,
  X,
  Search,
  Send,
  Sparkles,
  FileText,
  Loader2,
  ChevronDown,
  Copy,
  Check,
  Info,
  ArrowRight,
  Square,
} from "lucide-react";

// ─── Types ───
interface SearchResult {
  id: string;
  title: string;
  type: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Styling Constants ───
const BRAND_GREEN = "#5CC49D";

// ─── Type badge colors ───
const typeColors: Record<string, { bg: string; text: string }> = {
  gamma_proposal: { bg: "rgba(92,196,157,0.15)", text: BRAND_GREEN },
  cold_email: { bg: "rgba(96,165,250,0.15)", text: "#60A5FA" },
  contract: { bg: "rgba(251,191,36,0.15)", text: "#FBBF24" },
  growth_plan: { bg: "rgba(167,139,250,0.15)", text: "#A78BFA" },
  ad_copy: { bg: "rgba(251,146,60,0.15)", text: "#FB923C" },
  offer: { bg: "rgba(244,114,182,0.15)", text: "#F472B6" },
};

function getTypeBadge(type: string) {
  const colors = typeColors[type] || { bg: "rgba(156,163,175,0.15)", text: "#9CA3AF" };
  const label = type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { ...colors, label };
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ─── Main Component ───
export const AIChatDropdown: React.FC = () => {
  const { theme } = useTheme();
  const { currentWorkspace } = useWorkspaceContext();
  const isDark = theme === "dark";

  // ─── Hook: all chat state + streaming ───
  const {
    messages: chatMessages,
    streamingContent,
    isStreaming,
    deliverable: selectedDeliverable,
    sendMessage,
    loadDeliverable,
    startFreshChat,
    stopStreaming,
    clearChat,
  } = useAIChat({ workspaceId: currentWorkspace?.id });

  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"instructions" | "search" | "chat">("instructions");

  // Search state (stays local — not part of chat logic)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // UI state
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Auto-scroll chat on new messages AND during streaming
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, streamingContent]);

  // Focus inputs on view switch
  useEffect(() => {
    if (activeView === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    if (activeView === "chat") {
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [activeView]);

  // ─── Search Logic ───
  const performSearch = useCallback(
    async (query: string) => {
      if (!currentWorkspace?.id) return;
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          workspaceId: currentWorkspace.id,
          q: query,
          limit: "15",
        });
        const res = await fetch(`/api/deliverables/search?${params}`);
        const result = await res.json();
        if (result.success) {
          setSearchResults(result.data);
        }
      } catch {
        console.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    },
    [currentWorkspace?.id]
  );

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (activeView !== "search") return;

    searchDebounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, activeView, performSearch]);

  useEffect(() => {
    if (activeView === "search" && searchQuery === "") {
      performSearch("");
    }
  }, [activeView, performSearch, searchQuery]);

  // ─── Chat Handlers (thin — delegate to hook) ───
  const handleSelectDeliverable = (item: SearchResult) => {
    loadDeliverable({ id: item.id, title: item.title, type: item.type });
    setActiveView("chat");
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || isStreaming) return;
    sendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleCopy = async (content: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(msgId);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartFreshChat = () => {
    startFreshChat();
    setActiveView("chat");
  };

  const handleToggle = () => {
    if (!isOpen) {
      setActiveView("instructions");
      setSearchQuery("");
      setSearchResults([]);
    }
    setIsOpen(!isOpen);
  };

  // ─── Render ───
  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-300 focus:outline-none"
        style={{
          background: isOpen
            ? isDark
              ? "rgba(92,196,157,0.15)"
              : "rgba(92,196,157,0.1)"
            : "transparent",
          border: `1px solid ${
            isOpen
              ? isDark
                ? "rgba(92,196,157,0.3)"
                : "rgba(92,196,157,0.2)"
              : "transparent"
          }`,
        }}
        title="AI Assistant"
      >
        <Sparkles
          className="w-4 h-4 transition-colors duration-200"
          style={{
            color: isOpen ? BRAND_GREEN : isDark ? "#6B7280" : "#9CA3AF",
          }}
        />
        <span
          className="text-xs font-medium transition-colors duration-200"
          style={{
            color: isOpen ? BRAND_GREEN : isDark ? "#9CA3AF" : "#6B7280",
          }}
        >
          AI
        </span>
        <ChevronDown
          className="w-3 h-3 transition-all duration-200"
          style={{
            color: isOpen ? BRAND_GREEN : isDark ? "#6B7280" : "#9CA3AF",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50 overflow-hidden"
          style={{
            width: "420px",
            maxHeight: "580px",
            borderRadius: "16px",
            background: isDark
              ? "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.95) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(249,250,251,0.98) 100%)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            boxShadow: isDark
              ? "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)"
              : "0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.03)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_GREEN}20, ${BRAND_GREEN}10)`,
                  border: `1px solid ${BRAND_GREEN}30`,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: BRAND_GREEN }} />
              </div>
              <div>
                <p
                  className="text-sm font-semibold leading-none"
                  style={{ color: isDark ? "#F3F4F6" : "#111827" }}
                >
                  Arbitrage AI
                </p>
                <p
                  className="text-[10px] mt-0.5"
                  style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}
                >
                  Optimize &amp; refine your deliverables
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md transition-colors duration-200"
              style={{
                color: isDark ? "#6B7280" : "#9CA3AF",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div
            className="flex px-5 pt-2 gap-1"
            style={{
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"}`,
            }}
          >
            {[
              { key: "instructions" as const, icon: Info, label: "Guide" },
              { key: "search" as const, icon: Search, label: "Search" },
              { key: "chat" as const, icon: MessageSquare, label: "Chat" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveView(tab.key);
                  if (tab.key === "chat" && chatMessages.length === 0) {
                    handleStartFreshChat();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all duration-200"
                style={{
                  color:
                    activeView === tab.key
                      ? BRAND_GREEN
                      : isDark
                      ? "#6B7280"
                      : "#9CA3AF",
                  background:
                    activeView === tab.key
                      ? isDark
                        ? "rgba(92,196,157,0.08)"
                        : "rgba(92,196,157,0.05)"
                      : "transparent",
                  borderBottom:
                    activeView === tab.key
                      ? `2px solid ${BRAND_GREEN}`
                      : "2px solid transparent",
                }}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto" style={{ maxHeight: "460px" }}>
            {/* ─── Instructions View ─── */}
            {activeView === "instructions" && (
              <div className="px-5 py-4 space-y-4">
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: isDark ? "rgba(92,196,157,0.06)" : "rgba(92,196,157,0.04)",
                    border: `1px solid ${isDark ? "rgba(92,196,157,0.12)" : "rgba(92,196,157,0.08)"}`,
                  }}
                >
                  <p
                    className="text-sm font-semibold mb-2"
                    style={{ color: isDark ? "#E5E7EB" : "#1F2937" }}
                  >
                    How to use Arbitrage AI
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        step: "1",
                        title: "Search for a deliverable",
                        desc: 'Use the Search tab to find any proposal, email, or document by name.',
                      },
                      {
                        step: "2",
                        title: "Select & start chatting",
                        desc: "Click on any result to load it into the chat. The AI will have full context.",
                      },
                      {
                        step: "3",
                        title: "Describe what to optimize",
                        desc: '"Make the tone more aggressive", "Strengthen the ROI numbers", "Add urgency to the CTA"',
                      },
                      {
                        step: "4",
                        title: "Copy the optimized result",
                        desc: "The AI streams the full updated version in real-time. Copy when ready.",
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-3">
                        <div
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{
                            background: `${BRAND_GREEN}20`,
                            color: BRAND_GREEN,
                          }}
                        >
                          {item.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-medium"
                            style={{ color: isDark ? "#D1D5DB" : "#374151" }}
                          >
                            {item.title}
                          </p>
                          <p
                            className="text-[11px] mt-0.5 leading-relaxed"
                            style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}
                          >
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example prompts */}
                <div>
                  <p
                    className="text-[10px] uppercase tracking-widest mb-2 font-semibold"
                    style={{ color: isDark ? "#4B5563" : "#D1D5DB" }}
                  >
                    Example prompts
                  </p>
                  <div className="space-y-1.5">
                    {[
                      "Make the proposal tone more aggressive and add urgency throughout",
                      "Add a new solution for email automation at $500/mo with full ROI",
                      "Strengthen the ROI slide — use harder dollar figures and percentages",
                      "Rewrite the CTA to create real fear-of-missing-out urgency",
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (chatMessages.length === 0) handleStartFreshChat();
                          setActiveView("chat");
                          setChatInput(prompt);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-[11px] transition-all duration-200 flex items-center gap-2"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
                          color: isDark ? "#9CA3AF" : "#6B7280",
                        }}
                      >
                        <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: BRAND_GREEN }} />
                        <span className="truncate">{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveView("search")}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                      color: isDark ? "#D1D5DB" : "#4B5563",
                    }}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Search Files
                  </button>
                  <button
                    onClick={handleStartFreshChat}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: `${BRAND_GREEN}15`,
                      border: `1px solid ${BRAND_GREEN}30`,
                      color: BRAND_GREEN,
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Start Chat
                  </button>
                </div>
              </div>
            )}

            {/* ─── Search View ─── */}
            {activeView === "search" && (
              <div className="px-5 py-4 space-y-3">
                {/* Search Input */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
                  }}
                >
                  <Search
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search proposals, emails, contracts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500"
                    style={{ color: isDark ? "#E5E7EB" : "#1F2937" }}
                  />
                  {isSearching && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: BRAND_GREEN }} />
                  )}
                </div>

                {/* Results */}
                <div className="space-y-1">
                  {!currentWorkspace?.id ? (
                    <div className="text-center py-8">
                      <p className="text-xs" style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}>
                        Select a workspace to search deliverables
                      </p>
                    </div>
                  ) : searchResults.length === 0 && !isSearching ? (
                    <div className="text-center py-8">
                      <FileText
                        className="w-8 h-8 mx-auto mb-2"
                        style={{ color: isDark ? "#374151" : "#E5E7EB" }}
                      />
                      <p className="text-xs" style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}>
                        {searchQuery
                          ? "No deliverables found matching your search"
                          : "No deliverables yet. Generate a proposal to get started!"}
                      </p>
                    </div>
                  ) : (
                    searchResults.map((item) => {
                      const badge = getTypeBadge(item.type);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectDeliverable(item)}
                          className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 group"
                          style={{
                            background: "transparent",
                            border: `1px solid transparent`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(0,0,0,0.02)";
                            e.currentTarget.style.borderColor = isDark
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "transparent";
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: isDark ? "#E5E7EB" : "#1F2937" }}
                              >
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                                  style={{ background: badge.bg, color: badge.text }}
                                >
                                  {badge.label}
                                </span>
                                <span
                                  className="text-[10px]"
                                  style={{ color: isDark ? "#4B5563" : "#D1D5DB" }}
                                >
                                  {formatTimeAgo(item.created_at)}
                                </span>
                              </div>
                            </div>
                            <ArrowRight
                              className="w-4 h-4 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: BRAND_GREEN }}
                            />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ─── Chat View ─── */}
            {activeView === "chat" && (
              <div className="flex flex-col" style={{ height: "420px" }}>
                {/* Selected deliverable banner */}
                {selectedDeliverable && (
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{
                      background: isDark ? "rgba(92,196,157,0.06)" : "rgba(92,196,157,0.04)",
                      borderBottom: `1px solid ${isDark ? "rgba(92,196,157,0.1)" : "rgba(92,196,157,0.06)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BRAND_GREEN }} />
                      <span
                        className="text-xs font-medium truncate"
                        style={{ color: isDark ? "#D1D5DB" : "#4B5563" }}
                      >
                        {selectedDeliverable.title}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        clearChat();
                        handleStartFreshChat();
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md"
                      style={{
                        color: isDark ? "#6B7280" : "#9CA3AF",
                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="max-w-[85%] group relative"
                        style={{
                          padding: "10px 14px",
                          borderRadius:
                            msg.role === "user"
                              ? "14px 14px 4px 14px"
                              : "14px 14px 14px 4px",
                          background:
                            msg.role === "user"
                              ? `${BRAND_GREEN}18`
                              : isDark
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(0,0,0,0.03)",
                          border: `1px solid ${
                            msg.role === "user"
                              ? `${BRAND_GREEN}25`
                              : isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.04)"
                          }`,
                        }}
                      >
                        <p
                          className="text-xs leading-relaxed whitespace-pre-wrap"
                          style={{
                            color:
                              msg.role === "user"
                                ? isDark
                                  ? "#E5E7EB"
                                  : "#1F2937"
                                : isDark
                                ? "#D1D5DB"
                                : "#374151",
                          }}
                        >
                          {msg.content}
                        </p>
                        {msg.role === "assistant" && (
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md"
                            style={{
                              background: isDark ? "#1F2937" : "#F9FAFB",
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
                            }}
                          >
                            {copied === msg.id ? (
                              <Check className="w-3 h-3" style={{ color: BRAND_GREEN }} />
                            ) : (
                              <Copy
                                className="w-3 h-3"
                                style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}
                              />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Live streaming bubble */}
                  {isStreaming && streamingContent && (
                    <div className="flex justify-start">
                      <div
                        className="max-w-[85%]"
                        style={{
                          padding: "10px 14px",
                          borderRadius: "14px 14px 14px 4px",
                          background: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(0,0,0,0.03)",
                          border: `1px solid ${
                            isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.04)"
                          }`,
                        }}
                      >
                        <p
                          className="text-xs leading-relaxed whitespace-pre-wrap"
                          style={{
                            color: isDark ? "#D1D5DB" : "#374151",
                          }}
                        >
                          {streamingContent}
                          <span
                            className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse rounded-sm"
                            style={{ background: BRAND_GREEN, verticalAlign: "text-bottom" }}
                          />
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Waiting indicator (before first token arrives) */}
                  {isStreaming && !streamingContent && (
                    <div className="flex justify-start">
                      <div
                        className="px-4 py-3 rounded-2xl"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Loader2
                            className="w-3.5 h-3.5 animate-spin"
                            style={{ color: BRAND_GREEN }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}
                          >
                            Analyzing &amp; optimizing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div
                  className="px-4 py-3"
                  style={{
                    borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
                  }}
                >
                  <div
                    className="flex items-end gap-2 px-3 py-2 rounded-xl"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
                    }}
                  >
                    <textarea
                      ref={chatInputRef}
                      placeholder={
                        selectedDeliverable
                          ? "Describe how to optimize this proposal..."
                          : "Ask anything or paste content to analyze..."
                      }
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className="flex-1 bg-transparent text-xs outline-none resize-none placeholder:text-gray-500 leading-relaxed"
                      style={{
                        color: isDark ? "#E5E7EB" : "#1F2937",
                        maxHeight: "80px",
                      }}
                    />
                    {isStreaming ? (
                      <button
                        onClick={stopStreaming}
                        className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-200"
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          color: "#EF4444",
                        }}
                        title="Stop generating"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim()}
                        className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 disabled:opacity-30"
                        style={{
                          background: chatInput.trim() ? `${BRAND_GREEN}20` : "transparent",
                          color: chatInput.trim() ? BRAND_GREEN : isDark ? "#4B5563" : "#D1D5DB",
                        }}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};