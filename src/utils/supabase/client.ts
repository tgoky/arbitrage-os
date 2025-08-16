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
          try {
            const cookies = document.cookie.split(';')
            const cookie = cookies.find(c => c.trim().startsWith(`${name}=`))
            if (!cookie) return undefined
            
            const value = cookie.split('=')[1]
            if (!value) return undefined
            
            // Validate the cookie value before returning
            if (value.startsWith('base64-')) {
              try {
                const decoded = atob(value.substring(7))
                JSON.parse(decoded) // Validate it's valid JSON
                return value
              } catch (e) {
                console.warn(`Invalid cookie ${name}, clearing...`)
                document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
                return undefined
              }
            }
            return value
          } catch (error) {
            console.warn(`Error reading cookie ${name}:`, error)
            return undefined
          }
        },
        set(name: string, value: string, options: any) {
          try {
            // Validate the value before setting
            if (value.startsWith('base64-')) {
              const decoded = atob(value.substring(7))
              JSON.parse(decoded) // This will throw if invalid
            }
            
            let cookieString = `${name}=${value}; path=/`
            if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`
            if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`
            if (options?.secure) cookieString += `; secure`
            
            document.cookie = cookieString
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
        }
      }
    }
  )
}

export const supabaseBrowserClient = createClient()

// Alternative: Force clear corrupted cookies on initialization
export const clearCorruptedCookies = () => {
  if (typeof window !== 'undefined') {
    const cookiesToCheck = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'supabase.auth.token'
    ]
    
    cookiesToCheck.forEach(cookieName => {
      const cookies = document.cookie.split(';')
      const cookie = cookies.find(c => c.trim().startsWith(`${cookieName}=`))
      
      if (cookie) {
        const value = cookie.split('=')[1]
        if (value?.startsWith('base64-')) {
          try {
            const decoded = atob(value.substring(7))
            JSON.parse(decoded)
          } catch (e) {
            console.warn(`Clearing corrupted cookie: ${cookieName}`)
            document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
          }
        }
      }
    })
  }
}

// Debug: Log configuration (remove in production)
console.log('🔧 Supabase Config:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing'
})