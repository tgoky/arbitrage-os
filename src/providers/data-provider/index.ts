"use client";

import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import { supabaseBrowserClient } from "@/utils/supabase/client";

export const dataProvider = supabaseDataProvider(supabaseBrowserClient);