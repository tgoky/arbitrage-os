// src/providers/auth-recovery-provider.tsx
// Detects and clears corrupted auth data on app load to prevent blank screens
"use client";

import { useEffect, useState, ReactNode } from 'react';
import { clearAuthCookies } from '@/utils/supabase/client';

interface AuthRecoveryProviderProps {
  children: ReactNode;
}

/**
 * AuthRecoveryProvider
 *
 * This provider runs early in the app initialization to detect and clear
 * corrupted authentication data (cookies and localStorage) that can cause
 * blank screens for users who previously logged in.
 *
 * It checks for:
 * - Corrupted Supabase localStorage keys (sb-* keys that fail to parse)
 * - Invalid session data
 * - Malformed auth tokens
 *
 * If corruption is detected, it clears all auth data and allows the app
 * to continue loading normally (user will be redirected to login).
 */
export function AuthRecoveryProvider({ children }: AuthRecoveryProviderProps) {
  const [isRecoveryComplete, setIsRecoveryComplete] = useState(false);

  useEffect(() => {
    const recoverFromCorruptedAuth = () => {
      if (typeof window === 'undefined') {
        setIsRecoveryComplete(true);
        return;
      }

      try {
        let hasCorruption = false;

        // Check all localStorage keys for Supabase auth data
        const supabaseKeys = Object.keys(localStorage).filter(key =>
          key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('auth-token')
        );

        for (const key of supabaseKeys) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              // Try to parse if it looks like JSON
              if (value.startsWith('{') || value.startsWith('[')) {
                JSON.parse(value);
              }
              // Check for obviously corrupted values
              if (value === 'undefined' || value === 'null' || value === '[object Object]') {
                console.warn(`[AuthRecovery] Corrupted auth data detected in ${key}`);
                hasCorruption = true;
                break;
              }
            }
          } catch (parseError) {
            console.warn(`[AuthRecovery] Failed to parse ${key}:`, parseError);
            hasCorruption = true;
            break;
          }
        }

        // Also check for corrupted cookies by looking for malformed values
        if (!hasCorruption) {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const trimmed = cookie.trim();
            if (trimmed.startsWith('sb-') || trimmed.includes('supabase')) {
              const [, value] = trimmed.split('=');
              if (value) {
                try {
                  const decoded = decodeURIComponent(value);
                  // Check if it looks like JSON and try to parse
                  if (decoded.startsWith('{') || decoded.startsWith('[')) {
                    JSON.parse(decoded);
                  }
                  // Check for obviously corrupted values
                  if (decoded === 'undefined' || decoded === 'null' || decoded === '[object Object]') {
                    console.warn('[AuthRecovery] Corrupted auth cookie detected');
                    hasCorruption = true;
                    break;
                  }
                } catch (e) {
                  console.warn('[AuthRecovery] Malformed auth cookie detected');
                  hasCorruption = true;
                  break;
                }
              }
            }
          }
        }

        // If corruption detected, clear all auth data
        if (hasCorruption) {
          console.log('[AuthRecovery] Clearing corrupted auth data...');
          clearAllAuthData();
          console.log('[AuthRecovery] Auth data cleared. User will need to log in again.');
        }

      } catch (error) {
        // If anything goes wrong during recovery, clear everything to be safe
        console.error('[AuthRecovery] Error during recovery check:', error);
        clearAllAuthData();
      } finally {
        setIsRecoveryComplete(true);
      }
    };

    recoverFromCorruptedAuth();
  }, []);

  // Show nothing while checking - this is very fast
  if (!isRecoveryComplete) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Clears all authentication-related data from localStorage and cookies
 */
function clearAllAuthData() {
  if (typeof window === 'undefined') return;

  // Clear localStorage keys
  const keysToRemove = Object.keys(localStorage).filter(key =>
    key.startsWith('sb-') ||
    key.includes('supabase') ||
    key.includes('auth-token') ||
    key === 'current-workspace' // Also clear workspace cache since it depends on auth
  );

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`[AuthRecovery] Removed localStorage: ${key}`);
    } catch (e) {
      console.warn(`[AuthRecovery] Failed to remove ${key}:`, e);
    }
  });

  // Clear auth cookies using the existing utility
  clearAuthCookies();

  // Also clear any other Supabase-related cookies manually
  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token'
  ];

  // Get the project reference from URL if available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];

  if (projectRef) {
    cookiesToClear.push(`sb-${projectRef}-auth-token`);
    cookiesToClear.push(`sb-${projectRef}-auth-token-code-verifier`);
  }

  cookiesToClear.forEach(cookieName => {
    // Clear with different domain variations
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`;
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=.${window.location.hostname}`;
  });

  console.log('[AuthRecovery] All auth data cleared');
}
