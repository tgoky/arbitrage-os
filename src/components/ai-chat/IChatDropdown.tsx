"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  Sparkles,
  ChevronDown,
  Search,
  MessageSquare,
  FileText,
  Terminal,
  Square,
  Check,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useAIChat, type ChatMessage, type SearchResult } from "@/app/hooks/useAIChat";

// ─── Constants ───
const DROPDOWN_WIDTH = 460;
const DROPDOWN_HEIGHT = 620;

// ─── Type label helper ───
function typeIcon(type: string) {
  if (type.includes("proposal") || type.includes("gamma")) return "P";
  if (type.includes("email")) return "E";
  if (type.includes("ad")) return "A";
  if (type.includes("growth")) return "G";
  if (type.includes("sales") || type.includes("analysis")) return "S";
  if (type.includes("contract")) return "C";
  return "D";
}

function typeBadgeColor(type: string) {
  if (type.includes("proposal") || type.includes("gamma")) return "bg-emerald-500/20 text-emerald-400";
  if (type.includes("email")) return "bg-blue-500/20 text-blue-400";
  if (type.includes("ad")) return "bg-purple-500/20 text-purple-400";
  if (type.includes("growth")) return "bg-amber-500/20 text-amber-400";
  if (type.includes("sales") || type.includes("analysis")) return "bg-rose-500/20 text-rose-400";
  return "bg-gray-500/20 text-gray-400";
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ─── Props ───
interface AIChatDropdownProps {
  workspaceId?: string;
}

export const AIChatDropdown: React.FC<AIChatDropdownProps> = ({ workspaceId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"chat" | "search">("chat");
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const {
    messages,
    streamingContent,
    isStreaming,
    error,
    deliverable,
    isApplying,
    searchResults,
    isSearching,
    sendMessage,
    loadDeliverable,
    startFreshChat,
    stopStreaming,
    clearChat,
    applyChanges,
    searchDeliverables,
    clearError,
  } = useAIChat({ workspaceId });

  // ─── Mount ───
  useEffect(() => {
    setMounted(true);
    if (!document.querySelector("#manrope-font")) {
      const link = document.createElement("link");
      link.id = "manrope-font";
      link.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  // ─── Auto-init chat when opened ───
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startFreshChat();
    }
  }, [isOpen, messages.length, startFreshChat]);

  // ─── Position ───
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right - DROPDOWN_WIDTH;
    if (left < 16) left = 16;
    if (left + DROPDOWN_WIDTH > vw - 16) left = vw - DROPDOWN_WIDTH - 16;

    let top = rect.bottom + 12;
    if (top + DROPDOWN_HEIGHT > vh - 16) top = rect.top - DROPDOWN_HEIGHT - 12;

    setDropdownPos({ top, left });
  }, []);

  // ─── Outside click / resize ───
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      )
        return;
      setIsOpen(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // ─── Auto-scroll chat ───
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // ─── Focus textarea when switching to chat ───
  useEffect(() => {
    if (activeView === "chat" && isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [activeView, isOpen]);

  // ─── Focus search input ───
  useEffect(() => {
    if (activeView === "search" && isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [activeView, isOpen]);

  // ─── Debounced search ───
  const handleSearchInput = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        searchDeliverables(value);
      }, 300);
    },
    [searchDeliverables]
  );

  // ─── Initial search load ───
  useEffect(() => {
    if (activeView === "search" && isOpen && searchResults.length === 0 && !isSearching) {
      searchDeliverables("");
    }
  }, [activeView, isOpen, searchResults.length, isSearching, searchDeliverables]);

  // ─── Send handler ───
  const handleSend = useCallback(() => {
    if (!chatInput.trim() || isStreaming) return;
    const msg = chatInput;
    setChatInput("");
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    sendMessage(msg);
    if (activeView !== "chat") setActiveView("chat");
  }, [chatInput, isStreaming, sendMessage, activeView]);

  // ─── Enter to send ───
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ─── Load deliverable from search ───
  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      loadDeliverable({
        id: result.id,
        title: result.title,
        type: result.type,
      });
      setActiveView("chat");
    },
    [loadDeliverable]
  );

  // ─── Auto-resize textarea ───
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  return (
    <div className="relative antialiased" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* ─── Trigger ─── */}
      <button
        ref={triggerRef}
        onClick={() => {
          updatePosition();
          setIsOpen(!isOpen);
        }}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 text-[12px] font-bold tracking-tight ${
          isOpen
            ? "bg-white text-black shadow-lg scale-[1.02]"
            : "text-gray-500 hover:text-white hover:bg-white/5"
        }`}
      >
        <Sparkles className={`w-3.5 h-3.5 ${isOpen ? "text-black" : "text-[#5CC49D]"}`} />
        <span>AI</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* ─── Portal Panel ─── */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] flex flex-col overflow-hidden"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: DROPDOWN_WIDTH,
              height: DROPDOWN_HEIGHT,
              background: "#0A0A0A",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
              animation: "aichat-entry 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
            }}
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[#5CC49D] animate-pulse shrink-0" />
                <span className="text-white text-[13px] font-bold shrink-0">Arbitrage AI</span>
                {deliverable && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#5CC49D]/15 text-[#5CC49D] font-semibold truncate max-w-[180px]">
                    {deliverable.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {deliverable && (
                  <button
                    onClick={() => { clearChat(); startFreshChat(); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-white/5 hover:text-white transition-all"
                    title="Clear context & start fresh"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ─── Tab Bar ─── */}
            <div className="px-4 py-2 border-b border-white/5 shrink-0">
              <div className="flex gap-1 p-0.5 bg-white/[0.03] rounded-lg">
                {[
                  { id: "chat" as const, icon: MessageSquare, label: "Chat" },
                  { id: "search" as const, icon: Search, label: "Search" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-bold transition-all duration-200 ${
                      activeView === tab.id
                        ? "bg-white text-black"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Content ─── */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {activeView === "chat" && (
                <ChatView
                  messages={messages}
                  streamingContent={streamingContent}
                  isStreaming={isStreaming}
                  isApplying={isApplying}
                  deliverable={deliverable}
                  error={error}
                  onApply={applyChanges}
                  onClearError={clearError}
                  chatEndRef={chatEndRef}
                />
              )}

              {activeView === "search" && (
                <SearchView
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  isSearching={isSearching}
                  onSearchInput={handleSearchInput}
                  onSelect={handleSelectResult}
                  searchInputRef={searchInputRef}
                />
              )}
            </div>

            {/* ─── Input Footer ─── */}
            <div className="p-3 border-t border-white/5 bg-[#0A0A0A] shrink-0">
              {!workspaceId ? (
                <div className="text-center text-[11px] text-gray-600 py-2">
                  No workspace selected. Open a workspace to use AI chat.
                </div>
              ) : (
                <div className="flex items-end gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06] focus-within:border-[#5CC49D]/40 transition-colors">
                  <textarea
                    ref={textareaRef}
                    value={chatInput}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      deliverable
                        ? `Modify "${deliverable.title}"...`
                        : "Ask anything or search for a deliverable..."
                    }
                    className="w-full bg-transparent text-[13px] text-white outline-none px-3 py-2.5 resize-none min-h-[40px] max-h-[120px] placeholder:text-gray-600 font-medium leading-relaxed"
                    rows={1}
                  />
                  {isStreaming ? (
                    <button
                      onClick={stopStreaming}
                      className="mb-1 mr-1 p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all shrink-0"
                      title="Stop generating"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={!chatInput.trim()}
                      className={`mb-1 mr-1 p-2.5 rounded-xl transition-all shrink-0 ${
                        chatInput.trim()
                          ? "bg-white text-black hover:bg-[#5CC49D] hover:text-black"
                          : "bg-white/5 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      <style>{`
        @keyframes aichat-entry {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════
// CHAT VIEW — Messages, streaming, apply buttons
// ═══════════════════════════════════════════════
interface ChatViewProps {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  isApplying: boolean;
  deliverable: { id: string; title: string; type: string } | null;
  error: string | null;
  onApply: (messageId: string) => void;
  onClearError: () => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatView: React.FC<ChatViewProps> = ({
  messages,
  streamingContent,
  isStreaming,
  isApplying,
  deliverable,
  error,
  onApply,
  onClearError,
  chatEndRef,
}) => {
  return (
    <div className="px-4 py-3 space-y-3">
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.role === "user" ? (
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-white text-black px-4 py-2.5 rounded-2xl rounded-br-md text-[13px] font-medium leading-relaxed">
                {msg.content}
              </div>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#5CC49D]/15 flex items-center justify-center shrink-0 mt-0.5">
                <Terminal className="w-3 h-3 text-[#5CC49D]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-gray-300 leading-relaxed font-medium whitespace-pre-wrap break-words">
                  <FormattedContent content={msg.content} />
                </div>

                {/* Apply button — only shows when the message is a modification */}
                {msg.isModification && deliverable && (
                  <div className="mt-2">
                    {msg.applied ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5CC49D]/10 text-[#5CC49D] text-[11px] font-bold">
                        <Check className="w-3 h-3" />
                        Applied to {deliverable.title}
                      </div>
                    ) : (
                      <button
                        onClick={() => onApply(msg.id)}
                        disabled={isApplying}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5CC49D] text-black text-[11px] font-bold hover:bg-[#4DB88D] disabled:opacity-50 transition-all"
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Apply Changes
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Streaming in progress */}
      {streamingContent && (
        <div className="flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#5CC49D]/15 flex items-center justify-center shrink-0 mt-0.5">
            <Loader2 className="w-3 h-3 text-[#5CC49D] animate-spin" />
          </div>
          <div className="flex-1 min-w-0 text-[13px] text-gray-300 leading-relaxed font-medium whitespace-pre-wrap break-words">
            <FormattedContent content={streamingContent} />
            <span className="inline-block w-1.5 h-4 bg-[#5CC49D] ml-0.5 animate-pulse rounded-sm" />
          </div>
        </div>
      )}

      {/* Typing indicator */}
      {isStreaming && !streamingContent && (
        <div className="flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#5CC49D]/15 flex items-center justify-center shrink-0 mt-0.5">
            <Loader2 className="w-3 h-3 text-[#5CC49D] animate-spin" />
          </div>
          <div className="flex items-center gap-1 py-2">
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <span className="text-[11px] text-red-400 font-medium flex-1">{error}</span>
          <button onClick={onClearError} className="text-red-400 hover:text-red-300">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
};

// ═══════════════════════════════════════════════
// SEARCH VIEW — Real-time deliverable search
// ═══════════════════════════════════════════════
interface SearchViewProps {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  onSearchInput: (value: string) => void;
  onSelect: (result: SearchResult) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  searchResults,
  isSearching,
  onSearchInput,
  onSelect,
  searchInputRef,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchInput(e.target.value)}
            placeholder='Search "Sandra sales call", proposals...'
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-[#5CC49D]/40 transition-colors font-medium"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5CC49D] animate-spin" />
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: "none" }}>
        {searchResults.length > 0 ? (
          <div className="space-y-1">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => onSelect(result)}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all text-left group"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${typeBadgeColor(
                    result.type
                  )}`}
                >
                  {typeIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-white font-semibold truncate group-hover:text-[#5CC49D] transition-colors">
                    {result.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500 font-medium">
                      {result.typeLabel}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {timeAgo(result.updatedAt || result.createdAt)}
                    </span>
                  </div>
                </div>
                <FileText className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#5CC49D] shrink-0 mt-1.5 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mb-2" />
            <span className="text-[12px] font-medium">Searching...</span>
          </div>
        ) : searchQuery ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Search className="w-5 h-5 mb-2 opacity-40" />
            <span className="text-[12px] font-medium">No results for &ldquo;{searchQuery}&rdquo;</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Search className="w-5 h-5 mb-2 opacity-40" />
            <span className="text-[12px] font-medium">Search your deliverables</span>
            <span className="text-[11px] text-gray-600 mt-1">Proposals, emails, transcripts and more</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
// FORMATTED CONTENT — Basic markdown rendering
// ═══════════════════════════════════════════════
const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        // Bold
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
        // Inline code
        const withCode = formatted.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-white/10 rounded text-[12px] text-[#5CC49D]">$1</code>');
        // Bullet points
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="text-[#5CC49D] shrink-0 mt-0.5">&#8226;</span>
              <span dangerouslySetInnerHTML={{ __html: withCode.slice(2) }} />
            </div>
          );
        }
        // Headers
        if (line.startsWith("# ")) {
          return <div key={i} className="text-white font-bold text-[14px] mt-2 mb-1">{line.slice(2)}</div>;
        }
        if (line.startsWith("## ")) {
          return <div key={i} className="text-white font-bold text-[13px] mt-1.5 mb-0.5">{line.slice(3)}</div>;
        }
        // Empty line
        if (!line.trim()) {
          return <div key={i} className="h-2" />;
        }
        return <div key={i} dangerouslySetInnerHTML={{ __html: withCode }} />;
      })}
    </>
  );
};