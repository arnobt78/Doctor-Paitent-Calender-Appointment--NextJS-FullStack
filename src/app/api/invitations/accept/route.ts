import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/invitations/accept - Accept invitation by token
export async function POST(req: NextRequest) {
  try {
    const { token, userId } = await req.json();
    if (!token || !userId) {
      return NextResponse.json({ error: "Missing token or userId" }, { status: 400 });
    }
    // Try appointment_assignee first
    let { data, error } = await supabaseAdmin
      .from("appointment_assignee")
      .update({ status: "accepted", user: userId })
      .eq("invitation_token", token)
      .eq("status", "pending")
      .select();
    if (data && data.length > 0) {
      return NextResponse.json({ message: "Appointment invitation accepted" });
    }
    // Try dashboard_access
    ({ data, error } = await supabaseAdmin
      .from("dashboard_access")
      .update({ status: "accepted", invited_user_id: userId })
      .eq("invitation_token", token)
      .eq("status", "pending")
      .select());
    if (data && data.length > 0) {
      return NextResponse.json({ message: "Dashboard invitation accepted" });
    }
    return NextResponse.json({ error: "Invalid or already accepted invitation" }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
