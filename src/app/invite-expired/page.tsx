// app/invite-expired/page.tsx
"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function InviteExpiredPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const searchParams = useSearchParams();
  const inviteId = searchParams.get('invite_id');
  const errorType = searchParams.get('error');

  const handleResendRequest = async () => {
    if (!inviteId) {
      alert('Missing invite information. Please contact your admin.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSent(true);
      } else {
        alert(result.error || 'Failed to resend invite');
      }
    } catch (error) {
      alert('Failed to resend invite');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">New Link Sent!</h1>
          <p className="text-gray-600">
            Check your email for a fresh magic link.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            This link will expire in 1 hour, so click it soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Expired</h1>
          
          <p className="text-gray-600 mb-6">
            {errorType === 'invite_expired' 
              ? 'This invite has expired (7 days have passed). Please contact your admin for a new invitation.' 
              : 'This magic link has expired. Magic links are only valid for 1 hour after being sent.'}
          </p>

          {errorType !== 'invite_expired' && (
            <button
              onClick={handleResendRequest}
              disabled={loading || !inviteId}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {loading ? 'Sending...' : 'Send Me a New Link'}
            </button>
          )}

          {!inviteId && (
            <p className="text-red-600 text-sm mb-4">
              Missing invite information. Please contact your admin.
            </p>
          )}

          <p className="text-sm text-gray-500">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}