import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/appointments/search?query=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  // Get current user from session (pass cookies as required by Next.js app dir)
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Search appointments by title or id, but only for this user
  function isValidUUID(str: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }
  let orFilter = `title.ilike.*${query}*`;
  if (isValidUUID(query)) {
    orFilter += `,id.eq.${query}`;
  }
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("id, title")
    .eq("user_id", user.id)
    .or(orFilter);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ appointments: data });
// (no trailing brace)
}
