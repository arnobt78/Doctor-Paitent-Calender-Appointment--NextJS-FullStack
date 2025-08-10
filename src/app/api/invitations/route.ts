import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { sendInvitationEmail } from "@/lib/email";
import { InvitationRequest } from "@/types/invitation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Placeholder for DB and email logic

// POST /api/invitations - Send invitation (appointment or dashboard)
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = (await req.json()) as InvitationRequest;
  const { type, email, resourceId, permission, invitedUserId } = body;
    if (!type || !email || !resourceId || !permission) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const token = uuidv4();
    // Debug log for insert values
    console.log("Inserting invitation:", {
      appointment: resourceId,
      invited_email: email,
      status: "pending",
      invitation_token: token,
      permission,
      created_at: new Date().toISOString(),
      invited_by: user.id,
    });
    // Save invitation to DB (appointment_assignee or dashboard_access)
    if (type === "appointment") {
      const { data, error } = await supabaseAdmin.from("appointment_assignee").insert({
        appointment: resourceId,
        user: invitedUserId || null,
        invited_email: email,
        status: "pending",
        invitation_token: token,
        permission,
        created_at: new Date().toISOString(),
        invited_by: user.id,
      });
      console.log("Insert result (appointment_assignee):", { data, error });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (type === "dashboard") {
      const { data, error } = await supabaseAdmin.from("dashboard_access").insert({
        owner_user_id: resourceId,
        invited_user_id: invitedUserId || null,
        invited_email: email,
        status: "pending",
        invitation_token: token,
        permission,
        created_at: new Date().toISOString(),
        invited_by: user.id,
      });
      console.log("Insert result (dashboard_access):", { data, error });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Invalid invitation type" }, { status: 400 });
    }
    const link = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/accept-invitation?token=${token}`;
    await sendInvitationEmail({
      to: email,
      subject: `You are invited to access a ${type}`,
      html: `<p>You have been invited to access a ${type} with ${permission} permission.<br />Click <a href="${link}">here</a> to accept the invitation.</p>`
    });
    return NextResponse.json({ message: "Invitation sent", token });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  // Auth required: get user from session (using cookies)
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Query both tables for invitations for this user (by email or user id)
  const email = user.email;
  const userId = user.id;
  const [appointmentInv, dashboardInv] = await Promise.all([
    supabaseAdmin.from("appointment_assignee").select("*", { count: "exact" }).or(`invited_email.eq.${email},user.eq.${userId}`),
    supabaseAdmin.from("dashboard_access").select("*", { count: "exact" }).or(`invited_email.eq.${email},invited_user_id.eq.${userId}`),
  ]);
  return NextResponse.json({
    appointmentInvitations: appointmentInv.data || [],
    dashboardInvitations: dashboardInv.data || [],
  });
}
