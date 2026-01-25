// src/providers/auth-provider/auth-provider.client.ts
"use client";

import type { AuthProvider } from "@refinedev/core";
import { supabaseBrowserClient as supabase } from "../../utils/supabase/client";

export const authProviderClient: AuthProvider = {
  login: async ({ email, password, useMagicLink }) => {
    try {
      // Basic email validation
      if (!email || !email.includes('@')) {
        return {
          success: false,
          error: {
            name: "InvalidEmail",
            message: "Please enter a valid email address.",
          },
        };
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Check if user has a valid invite before attempting login
      const inviteCheck = await fetch('/api/auth/check-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const inviteResult = await inviteCheck.json();

      if (!inviteResult.hasValidInvite) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: inviteResult.error || "You don't have access to this platform. Contact team@growaiagency.io to request access.",
          },
        };
      }

      // Magic link login
      if (useMagicLink) {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent('/')}`,
            shouldCreateUser: false,
          },
        });

        if (error) {
          console.error("Magic link error:", error);
          return {
            success: false,
            error: {
              name: error.name || "LoginError",
              message: error.message || "Failed to send magic link",
            },
          };
        }

        return {
          success: true,
          successNotification: {
            message: "Magic link sent!",
            description: "Check your email for the magic link. It may take a moment to arrive.",
          },
        };
      }

      // Password-based login
      if (!password) {
        return {
          success: false,
          error: {
            name: "InvalidPassword",
            message: "Please enter your password.",
          },
        };
      }

      // Check if user has a password set before attempting password login
      try {
        const passwordCheck = await fetch('/api/auth/check-password-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail }),
        });

        const passwordStatus = await passwordCheck.json();

        // If user exists but hasn't set a password yet, guide them to magic link
        if (passwordStatus.userExists && !passwordStatus.hasPassword) {
          return {
            success: false,
            error: {
              name: "PasswordNotSet",
              message: "You haven't set up a password yet. Please use 'Sign in with magic link' instead.",
            },
          };
        }
      } catch (checkError) {
        // Non-blocking - continue with password login attempt if check fails
        console.error("Password status check failed:", checkError);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (error) {
        console.error("Password login error:", error);

        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: {
              name: "LoginError",
              message: "Invalid email or password. If you haven't set a password yet, use 'Sign in with magic link' first.",
            },
          };
        }

        return {
          success: false,
          error: {
            name: error.name || "LoginError",
            message: error.message || "Login failed",
          },
        };
      }

      if (!data.session) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "Failed to create session",
          },
        };
      }

      // Update last login in database
      try {
        await fetch('/api/auth/update-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail }),
        });
      } catch (updateError) {
        // Non-blocking - don't fail login if this fails
        console.error("Failed to update last login:", updateError);
      }

      return {
        success: true,
        redirectTo: "/",
        successNotification: {
          message: "Login successful!",
          description: "Welcome back to ArbitrageOS.",
        },
      };
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        error: {
          name: "LoginError",
          message: error?.message || "Login failed",
        },
      };
    }
  },

  register: async ({ email }) => {
    // Registration is invite-only, redirect to request access
    return {
      success: false,
      error: {
        name: "RegistrationClosed",
        message: "ArbitrageOS is invite-only. Contact team@growaiagency.io to request access.",
      },
    };
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

  forgotPassword: async ({ email }) => {
    try {
      if (!email || !email.includes('@')) {
        return {
          success: false,
          error: {
            name: "InvalidEmail",
            message: "Please enter a valid email address.",
          },
        };
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: {
            name: "ForgotPasswordError",
            message: error.message || "Failed to send reset email",
          },
        };
      }

      return {
        success: true,
        successNotification: {
          message: "Password reset email sent!",
          description: "Check your email for the password reset link.",
        },
      };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: {
          name: "ForgotPasswordError",
          message: error?.message || "Failed to send reset email",
        },
      };
    }
  },

  updatePassword: async ({ password }) => {
    try {
      if (!password || password.length < 6) {
        return {
          success: false,
          error: {
            name: "InvalidPassword",
            message: "Password must be at least 6 characters long.",
          },
        };
      }

      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        return {
          success: false,
          error: {
            name: "UpdatePasswordError",
            message: error.message || "Failed to update password",
          },
        };
      }

      return {
        success: true,
        redirectTo: "/",
        successNotification: {
          message: "Password updated successfully!",
          description: "You can now login with your new password.",
        },
      };
    } catch (error: any) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: {
          name: "UpdatePasswordError",
          message: error?.message || "Failed to update password",
        },
      };
    }
  },
};