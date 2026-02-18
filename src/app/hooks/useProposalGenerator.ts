// hooks/useProposalGenerator.ts
import { useState, useCallback } from 'react';
import type { ProposalGeneratorInput, ProposalGeneratorOutput } from '@/types/proposalGenerator';

const STORAGE_KEY = 'proposal_generator_prefill';

export function useProposalGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Call the API to generate a Gamma prompt from structured input.
   */
  const generatePrompt = useCallback(
    async (input: ProposalGeneratorInput): Promise<ProposalGeneratorOutput> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/proposal-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to generate proposal prompt');
        }

        return result.data as ProposalGeneratorOutput;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'An error occurred';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Store prefill data in sessionStorage so the Proposal Generator page
   * can read it on mount. This avoids URL length limits.
   */
  const storePrefill = useCallback((data: ProposalGeneratorInput) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      console.error('Failed to store proposal prefill data');
    }
  }, []);

  /**
   * Read and clear prefill data from sessionStorage.
   * Returns null if nothing is stored.
   */
  const consumePrefill = useCallback((): ProposalGeneratorInput | null => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(STORAGE_KEY);
      return JSON.parse(raw) as ProposalGeneratorInput;
    } catch {
      console.error('Failed to read proposal prefill data');
      return null;
    }
  }, []);

  return {
    generatePrompt,
    storePrefill,
    consumePrefill,
    loading,
    error,
    clearError: useCallback(() => setError(null), []),
  };
}