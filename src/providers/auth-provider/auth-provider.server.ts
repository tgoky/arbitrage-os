// src/authProviderServer.ts
import type { AuthProvider } from "@refinedev/core";
import { createSupabaseServerClient } from "../../utils/supabase/server";

export const authProviderServer: Pick<AuthProvider, "check" | "getIdentity"> = {
  check: async () => {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      return { authenticated: true };
    }
    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
    };
  },

  getIdentity: async () => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata.full_name,
        avatar: user.user_metadata.avatar || "https://i.pravatar.cc/150?img=1",
      };
    }
    return null;
  },
};