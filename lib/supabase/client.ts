import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://flowmetrics-demo.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-supabase-anon-key-flowmetrics-2026";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
