import { useQuery } from '@tanstack/react-query';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  return useQuery(
    ['userProfile'],
    async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000, // Changed from gcTime
      retry: (failureCount: number, error: Error) => {
        if (error.message === 'Authentication required') {
          return false;
        }
        return failureCount < 3;
      }
    }
  );
};