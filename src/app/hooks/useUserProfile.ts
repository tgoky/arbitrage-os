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
  return useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount: number, error: Error) => {
      // Don't retry on auth errors
      if (error.message === 'Authentication required') {
        return false;
      }
      return failureCount < 3;
    }
  });
};