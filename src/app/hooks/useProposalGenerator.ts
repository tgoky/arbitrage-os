
// hooks/useProposalGenerator.ts
import { useState, useCallback } from 'react';
import type { ProposalGeneratorInput, ProposalGeneratorOutput } from '@/types/proposalGenerator';

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

  return {
    generatePrompt,
    loading,
    error,
    clearError: useCallback(() => setError(null), []),
  };
}
