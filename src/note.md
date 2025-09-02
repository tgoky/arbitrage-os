git add .
git commit -m "fix: resolve authentication flow and workspace access issues

🔐 Authentication & Session Management
- Fix magic link authentication flow to properly redirect to workspace home page
- Implement auth callback route handler at /api/auth/callback/route.ts
- Add bearer token authentication to workspace service API calls
- Fix session persistence and cookie handling in auth provider
- Update redirect URL to point to correct callback endpoint

🏢 Workspace Service Improvements
- Add getAuthToken() method to fetch current session token
- Include Authorization header in all API requests
- Fix TypeScript HeadersInit type errors using Record<string, string>
- Add credentials: 'include' for proper cookie handling
- Implement robust error handling for 401 responses

🔄 API Route Authentication
- Implement multi-method authentication in workspace API routes
- Add fallback auth methods (Bearer token, SSR cookies, Route handler)
- Fix corrupted base64 cookie handling
- Add proper error responses with cookie cleanup

🎯 Navigation & Routing
- Fix redirect flow: login → magic link → callback → workspace home
- Update emailRedirectTo to use /api/auth/callback with next parameter
- Create dashboard redirect to workspace home page
- Fix workspace switching and validation logic

🐛 Bug Fixes
- Resolve 'Can't perform React state update' warning in AuthPage
- Fix useState timer to useEffect for proper lifecycle management
- Fix workspace loading state race conditions
- Handle edge cases for users with no workspaces

📝 Type Safety
- Fix HeadersInit TypeScript errors in workspace service
- Add proper typing for workspace interfaces
- Ensure type safety across auth provider methods

Breaking Changes: None
Migration: Update Supabase redirect URLs to include /api/auth/callback"