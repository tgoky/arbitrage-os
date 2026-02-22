"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Zap,
} from "lucide-react";

// ─── Constants ───
const BRAND_GREEN = "#5CC49D";
const VOID_BLACK = "#0A0A0A"; 
const SURFACE_DARK = "#121212";
const BORDER_FLAT = "#222222";

export const AIChatDropdown: React.FC = () => {
  // Logic States
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"instructions" | "search" | "chat">("instructions");
  const [chatInput, setChatInput] = useState("");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [chatInput]);

  return (
    <div ref={dropdownRef} className="relative font-sans antialiased text-white">
      {/* ─── Trigger Button ─── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-xl"
        style={{
          background: isOpen ? BRAND_GREEN : VOID_BLACK,
          border: `1px solid ${isOpen ? BRAND_GREEN : BORDER_FLAT}`,
        }}
      >
        <Sparkles className={`w-4 h-4 ${isOpen ? "text-black" : "text-[#5CC49D]"}`} />
        <span className={`text-[11px] font-black tracking-[0.1em] uppercase ${isOpen ? "text-black" : "text-white"}`}>
          Arbitrage AI
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180 text-black" : "text-gray-500"}`} />
      </button>

      {/* ─── Wide Rectangle Panel ─── */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-4 z-[100] flex flex-col shadow-[0_30px_90px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200"
          style={{
            width: "680px", // WIDE RECTANGLE WIDTH
            height: "440px", // SHORTER HEIGHT FOR RECTANGLE ASPECT
            background: VOID_BLACK,
            borderRadius: "16px",
            border: `1px solid ${BORDER_FLAT}`,
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#0F0F0F]">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <Zap className="w-4 h-4 text-[#5CC49D]" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase">Command Center</h3>
                <p className="text-[9px] text-gray-500 font-medium uppercase tracking-tighter">Latency: 24ms — Status: Ready</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex bg-black p-1 rounded-lg border border-[#222]">
                {["instructions", "search", "chat"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setActiveView(v as any)}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter rounded transition-all ${
                      activeView === v ? "bg-[#222] text-[#5CC49D]" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </nav>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/5 p-1.5 rounded-full transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Wide Body Area */}
          <div className="flex-1 overflow-hidden flex">
            {/* Main Content Pane */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#080808]">
              {activeView === "instructions" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#121212] border border-[#222] flex flex-col justify-between">
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      Load a document from <span className="text-white font-bold underline">Search</span> to perform deep context edits.
                    </p>
                    <button 
                      onClick={() => setActiveView("search")}
                      className="flex items-center gap-2 text-[10px] font-bold text-[#5CC49D] uppercase hover:gap-3 transition-all"
                    >
                      Browse Deliverables <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-gray-600 uppercase mb-2">Preset Commands</p>
                    {["Aggressive Tone", "Add Urgency", "ROI Deep-Dive"].map((cmd) => (
                      <button key={cmd} className="w-full text-left p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-gray-400 hover:bg-white/10 transition-all">
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeView === "chat" && (
                <div className="flex flex-col gap-4">
                   <div className="self-start max-w-[80%] p-4 rounded-2xl bg-[#161616] border border-[#262626] text-[13px] text-gray-300 leading-relaxed">
                    System initialized. I have full access to your workspace context. How can I help you dominate this proposal?
                  </div>
                  {/* Messages would map here */}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Wide Footer Input */}
          <div className="p-6 bg-[#0A0A0A] border-t border-[#222]">
            <div className="relative flex items-end gap-3 p-2.5 rounded-2xl border bg-black border-[#262626] focus-within:border-emerald-500/40 transition-all">
              <textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Enter a prompt or command (e.g. 'Rewrite the closing slide')..."
                className="w-full bg-transparent text-sm text-white outline-none p-2 resize-none min-h-[40px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    // handleSendMessage();
                  }
                }}
              />
              <button 
                className="p-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(92,196,157,0.2)]"
                style={{ background: BRAND_GREEN, color: "#000" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        @keyframes zoom-in-95 {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in { animation: zoom-in-95 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};