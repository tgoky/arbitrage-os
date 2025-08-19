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
            
            const value = cookie.split('=')[1]
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

// Utility to clear all auth-related cookies
export const clearAuthCookies = () => {
  if (typeof window !== 'undefined') {
    const authCookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase.auth.token'
    ]
    
    authCookieNames.forEach(cookieName => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
    })
  }
}