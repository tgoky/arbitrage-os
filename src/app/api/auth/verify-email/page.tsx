// app/auth/verify-email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmail() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Check Your Email
          </h2>
          <p className="text-gray-600 mb-6">
            We sent you a magic link to sign in. Click the link in your email to continue.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Magic links expire after a few minutes for security. 
              If your link has expired, please request a new one.
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Returning to login in {countdown} seconds...
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}