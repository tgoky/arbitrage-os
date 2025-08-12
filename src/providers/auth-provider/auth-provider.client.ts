// src/providers/auth-provider/auth-provider.client.ts
"use client";

import type { AuthProvider } from "@refinedev/core";
import { supabaseBrowserClient as supabase } from "../../utils/supabase/client";

export const authProviderClient: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: error.message || "Invalid username or password",
          },
        };
      }
      
      if (data?.user) {
        return { 
          success: true, 
          redirectTo: "/" 
        };
      }
      
      return { 
        success: false, 
        error: {
          name: "LoginError",
          message: "Invalid response from Supabase",
        },
      };
    } catch (error: any) {
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
      // First check if the email already exists
      const { data: existingUser } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            full_name: name || "",
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      
      if (error) {
        return { 
          success: false, 
          error: {
            name: "RegisterError",
            message: error.message || "Signup failed",
          },
        };
      }
      
      if (data?.user) {
        // Check if email confirmation is required
        if (data.user.identities?.length === 0) {
          return { 
            success: true, 
            successNotification: {
              message: "Success",
              description: "Please check your email to confirm your account.",
            },
            redirectTo: "/login" 
          };
        }
        
        return { 
          success: true, 
          redirectTo: "/login" 
        };
      }
      
      return { 
        success: false, 
        error: {
          name: "RegisterError",
          message: "Invalid response from Supabase",
        },
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: {
          name: "RegisterError",
          message: error.message || "Signup failed",
        },
      };
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
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
      return { 
        authenticated: false, 
        logout: true, 
        redirectTo: "/login" 
      };
    }
  },

  getPermissions: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.roles || [];
  },

  getIdentity: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        avatar: user.user_metadata?.avatar || "https://i.pravatar.cc/150?img=1",
      };
    }
    
    return null;
  },

  onError: async (error) => {
    if (error.status === 401) {
      return { 
        logout: true, 
        redirectTo: "/login" 
      };
    }
    return { error };
  },
};