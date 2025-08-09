import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/users/search?query=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  // Search users by email or display_name
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, email, display_name")
    .or(`email.ilike.%${query}%,display_name.ilike.%${query}%`);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}
