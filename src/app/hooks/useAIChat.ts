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

    const isSalesAnalysis = item.type === 'sales_analysis';
    const isProposal = item.type === 'gamma_proposal' || item.type === 'proposal';

    let welcomeContent: string;
    if (isSalesAnalysis) {
      welcomeContent = `Loaded **"${item.title}"** into context.\n\nI can help you with this sales call analysis:\n- "Generate a proposal from this call"\n- "What were the main pain points?"\n- "Strengthen the recommendations"\n- "Add action items for follow-up"\n- "What's the deal grade?"\n\nWhen I generate changes, you'll see two options:\n- **Apply Changes** — updates the original directly\n- **Save as New Version** — creates a copy, original preserved\n\nWhat would you like to do?`;
    } else if (isProposal) {
      welcomeContent = `Loaded **"${item.title}"** into context.\n\nTell me what to change in plain English:\n- "Make the tone more aggressive and urgent"\n- "Add a solution for social media automation at $500/mo"\n- "Strengthen the ROI section with real numbers"\n- "Rewrite the closing slide to create urgency"\n\nWhen I generate changes, you'll see two options:\n- **Apply Changes** — updates the original directly\n- **Save as New Version** — creates a copy, original preserved\n\nWhat would you like to modify?`;
    } else {
      welcomeContent = `Loaded **"${item.title}"** into context. The full content is now available for me to work with.\n\nDescribe what you'd like to change and I'll generate an updated version.\n\nYou'll have two options: **Apply Changes** to update the original, or **Save as New Version** to keep the original intact.`;
    }

    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: welcomeContent,
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
   * Internal helper — calls the apply API with the given mode.
   */
  const applyWithMode = useCallback(
    async (messageId: string, mode: 'overwrite' | 'new_version') => {
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
            mode,
          }),
        });

        const resData = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(resData?.error || `Apply failed (${res.status})`);
        }

        // Mark this message as applied
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, applied: true } : m))
        );

        // Build confirmation based on mode
        let confirmationMessage: string;
        if (mode === 'overwrite') {
          confirmationMessage = `Changes applied directly to **"${deliverable.title}"**. The original has been updated.`;
        } else {
          const revisionTitle = resData?.data?.title || deliverable.title;
          confirmationMessage = `New version created: **"${revisionTitle}"**. Your original **"${deliverable.title}"** is preserved.`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: confirmationMessage,
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
   * Apply changes — overwrites the original deliverable.
   */
  const applyChanges = useCallback(
    (messageId: string) => applyWithMode(messageId, 'overwrite'),
    [applyWithMode]
  );

  /**
   * Save as new version — creates a new revision, original stays untouched.
   */
  const saveAsNewVersion = useCallback(
    (messageId: string) => applyWithMode(messageId, 'new_version'),
    [applyWithMode]
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
          // Only show Sales Analysis and Proposals/Gamma in chat search
          types: 'sales_analysis,gamma_proposal,proposal',
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
    saveAsNewVersion,
    searchDeliverables,
    clearError: useCallback(() => setError(null), []),
  };
}