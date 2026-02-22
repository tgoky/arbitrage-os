"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Zap,
  Terminal,
  Search,
  MessageSquare,
  FileText,
  Command,
  ArrowUpRight
} from "lucide-react";

// ─── Constants ───
const BRAND_COLOR = "#5CC49D"; // Mint Green
const ACCENT_DARK = "#4AA080";
const BG_VOID = "#050505";     // Deepest Black
const BG_CARD_WHITE = "#FFFFFF"; // Pure White
const TEXT_ON_WHITE = "#000000";
const BORDER_DIM = "rgba(255, 255, 255, 0.15)";
const DROPDOWN_WIDTH = 480;
const DROPDOWN_HEIGHT = 600;

export const AIChatDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"instructions" | "search" | "chat">("instructions");
  const [chatInput, setChatInput] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Load Manrope Font
  useEffect(() => {
    setMounted(true);
    if (!document.querySelector('#manrope-font')) {
      const link = document.createElement('link');
      link.id = 'manrope-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // 2. Position Logic
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right - DROPDOWN_WIDTH;
    if (left < 16) left = 16;
    if (left + DROPDOWN_WIDTH > vw - 16) left = vw - DROPDOWN_WIDTH - 16;

    let top = rect.bottom + 16;
    if (top + DROPDOWN_HEIGHT > vh - 16) top = rect.top - DROPDOWN_HEIGHT - 16;
    
    setDropdownPos({ top, left });
  }, []);

  // 3. Event Listeners (Outside Click / Resize)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || panelRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  return (
    <div className="relative antialiased font-manrope" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* ─── Trigger Button ─── */}
      <button
        ref={triggerRef}
        onClick={() => { updatePosition(); setIsOpen(!isOpen); }}
        className={`group flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 shadow-xl border ${
            isOpen 
            ? "bg-white text-black border-white scale-105" 
            : "bg-black text-white border-white/20 hover:border-white/50"
        }`}
      >
        <div className={`flex items-center justify-center ${isOpen ? "text-black" : "text-[#5CC49D]"}`}>
            {isOpen ? <Terminal className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
        <span className="text-[13px] font-bold tracking-tight">
          Arbitrage.ai
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* ─── Portal Panel ─── */}
      {isOpen && mounted && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999] flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: DROPDOWN_WIDTH,
            height: DROPDOWN_HEIGHT,
            background: BG_VOID,
            borderRadius: "24px",
            border: `1px solid ${BORDER_DIM}`,
            animation: "swiss-entry 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 shrink-0">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5CC49D] animate-pulse" />
                <span className="text-white text-xs font-bold tracking-widest uppercase opacity-60">System Ready</span>
             </div>
             <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-all"
            >
                <X className="w-4 h-4" />
             </button>
          </div>

          {/* Tab Navigation (Pill Style) */}
          <div className="px-6 mb-2 shrink-0">
            <div className="flex p-1 bg-[#1A1A1A] rounded-full border border-white/5">
                {[
                    { id: "instructions", icon: Zap, label: "Actions" },
                    { id: "search", icon: Search, label: "Knowledge" },
                    { id: "chat", icon: MessageSquare, label: "Chat" }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveView(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[12px] font-bold transition-all duration-300 ${
                            activeView === tab.id
                            ? "bg-white text-black shadow-lg scale-[1.02]"
                            : "text-gray-500 hover:text-white"
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            {activeView === "instructions" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* The White Card You Requested */}
                    <div className="relative bg-white text-black p-6 rounded-[20px] shadow-2xl group overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mb-4 text-white">
                                <Command className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-extrabold mb-2 tracking-tight">Context Injection</h3>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed mb-6">
                                Load workspace data to enable high-fidelity responses. Connect your knowledge base below.
                            </p>
                            <button 
                                onClick={() => setActiveView('search')}
                                className="w-full py-3.5 rounded-xl bg-black text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
                            >
                                Browse Data <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Decorative Pattern on White Card */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 rounded-bl-[100px] -z-0 opacity-50 transition-transform group-hover:scale-110" />
                    </div>

                    {/* Secondary High-Contrast Actions */}
                    <div className="grid grid-cols-2 gap-3">
                         {["ROI Audit", "Market Synthesis", "Draft Email", "Code Review"].map((action) => (
                            <button key={action} className="p-4 bg-[#111] border border-[#222] hover:bg-[#5CC49D] hover:border-[#5CC49D] hover:text-black rounded-2xl text-left transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-2">
                                    <Sparkles className="w-4 h-4 text-gray-500 group-hover:text-black" />
                                    <ArrowUpRight className="w-3 h-3 text-gray-600 group-hover:text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-[13px] font-bold text-gray-300 group-hover:text-black">{action}</span>
                            </button>
                         ))}
                    </div>
                </div>
            )}

            {activeView === "search" && (
                <div className="animate-in fade-in zoom-in-95 duration-300 h-full flex flex-col items-center justify-center text-center opacity-80">
                    <Search className="w-12 h-12 text-[#333] mb-4" />
                    <h4 className="text-white font-bold text-lg mb-2">Knowledge Base</h4>
                    <p className="text-gray-500 text-sm max-w-[200px]">Connect your data sources to begin.</p>
                </div>
            )}

            {activeView === "chat" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center shrink-0">
                             <Terminal className="w-4 h-4 text-[#5CC49D]" />
                        </div>
                        {/* AI Bubble - Transparent/Dark */}
                        <div className="p-0 text-sm text-gray-300 leading-relaxed font-medium pt-1">
                            <p>Arbitrage OS initialized.</p>
                            <p className="mt-2 text-white">How can I assist with your workflow today?</p>
                        </div>
                    </div>

                    {/* Example User Bubble - White Card Style */}
                    <div className="flex flex-row-reverse gap-4">
                        <div className="max-w-[80%] bg-white text-black p-4 rounded-2xl rounded-tr-sm shadow-lg text-sm font-semibold">
                            Analyze the Q3 performance metrics.
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-5 border-t border-white/10 bg-black shrink-0">
            <div className="relative flex items-end gap-2 p-1.5 rounded-3xl bg-[#111] border border-[#222] focus-within:border-[#5CC49D] focus-within:ring-1 focus-within:ring-[#5CC49D] transition-all duration-300">
              <textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your instruction..."
                className="w-full bg-transparent text-sm text-white outline-none px-4 py-3 resize-none min-h-[50px] placeholder:text-gray-600 font-medium"
              />
              <button 
                className="mb-1 mr-1 p-3 rounded-full bg-white text-black hover:bg-[#5CC49D] hover:scale-110 active:scale-90 transition-all duration-300 shadow-lg"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Styles */}
      <style>{`
        @keyframes swiss-entry {
          from { opacity: 0; transform: translateY(20px) scale(0.96); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
};