// src/providers/auth-provider/auth-provider.client.ts
"use client";

import type { AuthProvider } from "@refinedev/core";
import { supabaseBrowserClient as supabase } from "../../utils/supabase/client";

export const authProviderClient: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      // Clear any existing session first
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        console.error('Login error:', error);
        return {
          success: false,
          error: {
            name: "LoginError",
            message: error.message || "Invalid username or password",
          },
        };
      }
      
      if (data?.user && data?.session) {
        return { 
          success: true, 
          redirectTo: "/" 
        };
      }
      
      return { 
        success: false, 
        error: {
          name: "LoginError",
          message: "Invalid response from authentication service",
        },
      };
    } catch (error: any) {
      console.error('Login catch error:', error);
      return { 
        success: false, 
        error: {
          name: "LoginError",
          message: error.message || "Login failed",
        },
      };
    }
  },

  register: async ({ email, password, name }) => {
    try {
      // Clear any existing session first
      await supabase.auth.signOut();
      
      const trimmedEmail = email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { 
          data: { 
            full_name: name || "",
          },
          // Remove emailRedirectTo if it's causing issues
          // emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      
      if (error) {
        console.error('Register error:', error);
        return { 
          success: false, 
          error: {
            name: "RegisterError",
            message: error.message || "Registration failed",
          },
        };
      }
      
      if (data?.user) {
        // Check if email confirmation is required
        if (!data.session && data.user.identities?.length === 0) {
          return { 
            success: true, 
            successNotification: {
              message: "Success",
              description: "Please check your email to confirm your account.",
            },
            redirectTo: "/login" 
          };
        }
        
        // If user is immediately signed in (email confirmation disabled)
        if (data.session) {
          return { 
            success: true, 
            redirectTo: "/" 
          };
        }
        
        // Default case - email confirmation required
        return { 
          success: true,
          successNotification: {
            message: "Registration successful",
            description: "Please check your email to verify your account before signing in.",
          },
          redirectTo: "/login" 
        };
      }
      
      return { 
        success: false, 
        error: {
          name: "RegisterError",
          message: "Registration failed - no user created",
        },
      };
    } catch (error: any) {
      console.error('Register catch error:', error);
      return { 
        success: false, 
        error: {
          name: "RegisterError",
          message: error.message || "Registration failed",
        },
      };
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        return { 
          success: false, 
          error: {
            name: "LogoutError",
            message: error.message || "Logout failed",
          },
        };
      }
      
      return { 
        success: true, 
        redirectTo: "/login" 
      };
    } catch (error: any) {
      console.error('Logout catch error:', error);
      return { 
        success: false, 
        error: {
          name: "LogoutError",
          message: error.message || "Logout failed",
        },
      };
    }
  },

  check: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return { 
          authenticated: false, 
          logout: true, 
          redirectTo: "/login" 
        };
      }
      
      if (session?.user) {
        return { 
          authenticated: true 
        };
      }
      
      return { 
        authenticated: false, 
        logout: true, 
        redirectTo: "/login" 
      };
    } catch (error) {
      console.error('Check catch error:', error);
      return { 
        authenticated: false, 
        logout: true, 
        redirectTo: "/login" 
      };
    }
  },

  getPermissions: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.user_metadata?.roles || [];
    } catch (error) {
      console.error('Get permissions error:', error);
      return [];
    }
  },

  getIdentity: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar: user.user_metadata?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Get identity error:', error);
      return null;
    }
  },

  onError: async (error) => {
    console.error('Auth error:', error);
    
    if (error.status === 401 || error.message?.includes('Invalid JWT')) {
      return { 
        logout: true, 
        redirectTo: "/login" 
      };
    }
    
    return { error };
  },
};