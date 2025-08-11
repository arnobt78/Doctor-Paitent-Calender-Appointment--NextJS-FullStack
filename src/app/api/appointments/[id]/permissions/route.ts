import { NextRequest, NextResponse } from "next/server";

// GET /api/appointments/[id]/permissions - Check appointment permissions for current user
export async function GET(req: NextRequest) {
  // Extract params from URL
  const url = new URL(req.url);
  const id = url.pathname.split("/").at(-2);
  // Auth required: get user from session
  // Query DB for appointment_assignee or owner
  // Return permission level (read, write, full) for this appointment
  // (To be implemented)
  return NextResponse.json({ permission: "read", id });
}

// DELETE /api/appointments/[id]/permissions - Discard appointment invitation
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").at(-2);
  if (!id) {
    return NextResponse.json({ error: "Missing appointment ID" }, { status: 400 });
  }
  // TODO: Auth check (ensure user is sender or receiver)
  // TODO: Connect to DB and delete appointment_assignee by id
  // Example using supabaseAdmin (adjust as needed for your DB setup)
  try {
    const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
    const { data, error } = await supabaseAdmin
      .from("appointment_assignee")
      .delete()
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
