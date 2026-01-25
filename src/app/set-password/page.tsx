// src/app/set-password/page.tsx
import { SetPasswordPage } from "@/components/set-password-page";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SetPassword({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // User must be authenticated to set password
  if (!session) {
    redirect("/login");
  }

  // Get email from session or searchParams
  const email = session.user.email || searchParams.email || "";

  return <SetPasswordPage email={email} />;
}
