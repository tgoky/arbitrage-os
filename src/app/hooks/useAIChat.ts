// hooks/useAIChat.ts
// Core AI chat hook — handles streaming, deliverable context, search, and applying modifications.
import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  /** When true, this message contains a deliverable modification the user can apply */
  isModification?: boolean;
  /** Track whether the user already applied this message's content */
  applied?: boolean;
}

export interface DeliverableRef {
  id: string;
  title: string;
  type: string;
}

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  clientName: string | null;
  companyName: string | null;
}

interface UseAIChatOptions {
  workspaceId?: string;
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliverable, setDeliverable] = useState<DeliverableRef | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  /**
   * Load a deliverable into context and reset the conversation.
   * This is what connects user data to the AI — without this, the AI has no context.
   */
  const loadDeliverable = useCallback((item: DeliverableRef) => {
    setDeliverable(item);
    setError(null);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Loaded **"${item.title}"** into context. The full content is now available for me to work with.\n\nYou can tell me what to change in plain English:\n- "Make the tone more aggressive and urgent"\n- "Add a solution for social media automation at $500/mo"\n- "Strengthen the ROI section with real numbers"\n- "Rewrite the closing slide to create urgency"\n\nAfter I generate changes, you'll see an **Apply** button to save them back.\n\nWhat would you like to modify?`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  /**
   * Start a fresh chat without a deliverable loaded.
   */
  const startFreshChat = useCallback(() => {
    setDeliverable(null);
    setError(null);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hey! I'm your Arbitrage AI assistant.\n\nUse the **Search** tab to find and load a deliverable — then I can modify it based on your instructions.\n\nOr just ask me anything directly.`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  /**
   * Send a message and stream the AI response via SSE.
   * This is the core pipeline: message → backend → LLM → streamed response.
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming || !options.workspaceId) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setStreamingContent('');
      setIsStreaming(true);
      setError(null);

      try {
        const conversationHistory = [...messages, userMessage]
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationHistory,
            workspaceId: options.workspaceId,
            deliverableId: deliverable?.id || null,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.error || `Request failed (${res.status})`);
        }

        if (!res.body) {
          throw new Error('No response stream available');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed === 'data: [DONE]') break;

            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                if (json.content) {
                  accumulated += json.content;
                  setStreamingContent(accumulated);
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        }

        // Finalize: determine if this response contains a deliverable modification.
        // Heuristic: if a deliverable is loaded and the response is long (>200 chars),
        // it likely contains modified content the user can apply.
        if (accumulated) {
          const isModification = !!deliverable && accumulated.length > 200;
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: accumulated,
            timestamp: new Date(),
            isModification,
            applied: false,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }

        setStreamingContent('');
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;

        const msg = err instanceof Error ? err.message : 'Connection error. Please try again.';
        setError(msg);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Something went wrong: ${msg}`,
            timestamp: new Date(),
          },
        ]);
        setStreamingContent('');
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, options.workspaceId, messages, deliverable?.id]
  );

  /**
   * Apply AI modifications back to the deliverable.
   * This is the execution layer — it writes changes to the database.
   */
  const applyChanges = useCallback(
    async (messageId: string) => {
      if (!deliverable || !options.workspaceId || isApplying) return;

      const message = messages.find((m) => m.id === messageId);
      if (!message || message.role !== 'assistant') return;

      setIsApplying(true);
      setError(null);

      try {
        const res = await fetch('/api/ai-chat/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliverableId: deliverable.id,
            workspaceId: options.workspaceId,
            modifiedContent: message.content,
            modificationSummary: 'AI modification applied from chat',
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `Apply failed (${res.status})`);
        }

        // Mark this message as applied
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, applied: true } : m))
        );

        // Add confirmation message
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Changes applied to **"${deliverable.title}"**. The deliverable has been updated.`,
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to apply changes';
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Failed to apply changes: ${msg}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsApplying(false);
      }
    },
    [deliverable, options.workspaceId, isApplying, messages]
  );

  /**
   * Search deliverables in the current workspace.
   * Debouncing is handled by the caller (the UI component).
   */
  const searchDeliverables = useCallback(
    async (query: string) => {
      if (!options.workspaceId) {
        setSearchResults([]);
        return;
      }

      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setIsSearching(true);

      try {
        const params = new URLSearchParams({
          q: query,
          workspaceId: options.workspaceId,
          limit: '20',
        });

        const res = await fetch(`/api/deliverables/search?${params}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error('Search failed');

        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data || []);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setSearchResults([]);
      } finally {
        setIsSearching(false);
        searchAbortRef.current = null;
      }
    },
    [options.workspaceId]
  );

  /**
   * Stop a streaming response mid-flight.
   */
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);

    setStreamingContent((current) => {
      if (current) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: current + '\n\n*(stopped)*',
            timestamp: new Date(),
          },
        ]);
      }
      return '';
    });
  }, []);

  /**
   * Clear everything.
   */
  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    searchAbortRef.current?.abort();
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    setError(null);
    setDeliverable(null);
    setSearchResults([]);
    setIsSearching(false);
    setIsApplying(false);
  }, []);

  return {
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
    clearError: useCallback(() => setError(null), []),
  };
}