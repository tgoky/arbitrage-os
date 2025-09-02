// app/auth/auth-code-error/page.tsx
"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCodeErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(10)
  
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const getErrorMessage = () => {
    switch (error) {
      case 'access_denied':
        return 'Access was denied. This usually means the magic link has expired.'
      case 'otp_expired':
        return 'The magic link has expired. Please request a new one.'
      case 'exchange_failed':
        return 'Failed to complete sign-in. The link may be invalid or expired.'
      case 'server_error':
        return 'A server error occurred during authentication.'
      case 'missing_code':
        return 'Missing authentication code. Please try signing in again.'
      default:
        return message || 'An authentication error occurred. Please try again.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-6">
            {getErrorMessage()}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to login in {countdown} seconds...
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}