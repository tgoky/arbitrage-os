// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createClient = () => {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          
          try {
            const cookies = document.cookie.split(';')
            const cookie = cookies.find(c => c.trim().startsWith(`${name}=`))
            if (!cookie) return undefined
            
            const value = cookie.split('=').slice(1).join('=')
            return value ? decodeURIComponent(value) : undefined
          } catch (error) {
            console.warn(`Error reading cookie ${name}:`, error)
            return undefined
          }
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return
          
          try {
            let cookieString = `${name}=${encodeURIComponent(value)}`
            
            // Default options
            cookieString += '; path=/'
            cookieString += '; SameSite=Lax'
            
            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`
            }
            if (options?.expires) {
              cookieString += `; expires=${options.expires.toUTCString()}`
            }
            if (options?.secure || window.location.protocol === 'https:') {
              cookieString += '; secure'
            }
            
            document.cookie = cookieString
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          
          try {
            let cookieString = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`
            }
            document.cookie = cookieString
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error)
          }
        }
      },
      auth: {
        // Ensure proper auth flow
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  )
}

export const supabaseBrowserClient = createClient()

// Utility to clear all auth-related cookies and localStorage
export const clearAuthCookies = () => {
  if (typeof window === 'undefined') return

  // Base cookie names to clear
  const authCookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token'
  ]

  // Get project reference from URL to clear project-specific cookies
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\./)?.[1]
  if (projectRef) {
    authCookieNames.push(`sb-${projectRef}-auth-token`)
    authCookieNames.push(`sb-${projectRef}-auth-token-code-verifier`)
  }

  // Also find any cookies that start with 'sb-' dynamically
  const allCookies = document.cookie.split(';')
  allCookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim()
    if (cookieName.startsWith('sb-') && !authCookieNames.includes(cookieName)) {
      authCookieNames.push(cookieName)
    }
  })

  // Clear all auth cookies with various domain combinations
  authCookieNames.forEach(cookieName => {
    // Clear without domain (current domain only)
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
    // Clear with explicit domain
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`
    // Clear with dot-prefixed domain (for subdomains)
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=.${window.location.hostname}`
  })
}

// Utility to clear all auth data (cookies + localStorage)
export const clearAllAuthData = () => {
  if (typeof window === 'undefined') return

  // Clear cookies first
  clearAuthCookies()

  // Clear auth-related localStorage keys
  const keysToRemove = Object.keys(localStorage).filter(key =>
    key.startsWith('sb-') ||
    key.includes('supabase') ||
    key.includes('auth-token')
  )

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn(`Failed to remove localStorage key ${key}:`, e)
    }
  })
}