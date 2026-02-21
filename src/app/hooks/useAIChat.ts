// hooks/useAIChat.ts
import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DeliverableRef {
  id: string;
  title: string;
  type: string;
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

  const abortRef = useRef<AbortController | null>(null);

  /**
   * Load a deliverable into context and reset the conversation
   */
  const loadDeliverable = useCallback((item: DeliverableRef) => {
    setDeliverable(item);
    setError(null);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I've loaded "${item.title}". I can analyze, optimize, and modify it based on your feedback.\n\nTry things like:\n- "Make the tone more aggressive and urgent"\n- "Add a solution for social media automation at $500/mo"\n- "Strengthen the ROI section with harder numbers"\n- "Rewrite the CTA slide to create real urgency"\n\nWhat would you like to optimize?`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  /**
   * Start a fresh chat without a deliverable
   */
  const startFreshChat = useCallback(() => {
    setDeliverable(null);
    setError(null);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hey! I'm your Arbitrage AI assistant. Ask me anything — or search for a deliverable to load it for optimization.\n\nYou can paste proposal content directly here and I'll analyze it for improvements.`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  /**
   * Send a message and stream the AI response via SSE
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming || !options.workspaceId) return;

      // Cancel any in-flight request
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
        // Build conversation history for the API (only user + assistant messages)
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

        // Parse the SSE stream
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

            if (trimmed === 'data: [DONE]') {
              break;
            }

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

        // Finalize: move streamed content into a proper message
        if (accumulated) {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: accumulated,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }

        setStreamingContent('');
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;

        const msg = err instanceof Error ? err.message : 'Connection error. Please try again.';
        setError(msg);

        // Add error as a system-style assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Sorry, something went wrong: ${msg}`,
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
   * Stop a streaming response mid-flight
   */
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);

    // Commit whatever we have so far
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
   * Clear the entire chat state
   */
  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    setError(null);
    setDeliverable(null);
  }, []);

  return {
    messages,
    streamingContent,
    isStreaming,
    error,
    deliverable,
    sendMessage,
    loadDeliverable,
    startFreshChat,
    stopStreaming,
    clearChat,
    clearError: useCallback(() => setError(null), []),
  };
}