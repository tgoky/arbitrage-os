// src/providers/auth-provider/auth-provider.client.ts
"use client";

import type { AuthProvider } from "@refinedev/core";
import { supabaseBrowserClient as supabase } from "../../utils/supabase/client";

export const authProviderClient: AuthProvider = {
  login: async ({ email }) => {
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

      // Send magic link via our server-side route (Supabase Admin generateLink + Resend).
      // This replaces the old client-side signInWithOtp + check-invite two-step flow.
      // The server route handles invite validation, link generation, and email delivery.
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: result.error || "Failed to send magic link. Please try again.",
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
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        error: {
          name: "LoginError",
          message: error?.message || "Failed to send magic link",
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
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Auth check error:', error);
        return {
          authenticated: false,
          logout: true,
          redirectTo: "/login"
        };
      }

      if (user) {
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