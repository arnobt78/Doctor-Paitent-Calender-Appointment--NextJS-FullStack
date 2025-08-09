// Helper to get Supabase user id on the client
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export async function getSupabaseUserId(): Promise<string | null> {
  const supabase = createClientComponentClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}
