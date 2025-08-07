// app/dashboard/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '../hooks/useWorkspace';

const DashboardRedirect = () => {
  const router = useRouter();
  const { workspaces, isLoading } = useWorkspace();

  useEffect(() => {
    if (!isLoading) {
      if (workspaces.length > 0) {
        // If user has workspaces, redirect to the first one
        router.replace(`/dashboard/${workspaces[0].slug}`);
      } else {
        // If no workspaces, redirect to home page to create one
        router.replace('/');
      }
    }
  }, [workspaces, isLoading, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );
};

export default DashboardRedirect;