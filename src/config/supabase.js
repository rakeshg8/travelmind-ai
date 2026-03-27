import { createClient } from "@supabase/supabase-js";
import { KEYS } from "./keys";

export const supabase = createClient(KEYS.SUPABASE_URL, KEYS.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
