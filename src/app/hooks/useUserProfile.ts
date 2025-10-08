import { useQuery } from '@tanstack/react-query';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data: UserProfile;
}

export const useUserProfile = () => {
  return useQuery<UserProfile, Error>(
    ['userProfile'],
    async () => {
      const response = await fetch('/api/profile');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch profile');
      }
      
      const result: ApiResponse = await response.json();
      
      // Return only the data property, not the entire response
      return result.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount: number, error: Error) => {
        if (error.message === 'Authentication required') {
          return false;
        }
        return failureCount < 3;
      }
    }
  );
};