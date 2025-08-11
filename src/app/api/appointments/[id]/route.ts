import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

type Appointment = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  start: string;
  end: string;
  location?: string | null;
  patient?: string | null;
  attachements?: string[] | null;
  category?: string | null;
  notes?: string | null;
  title: string;
  status?: string;
  user_id: string;
};

// GET /api/appointments/[id] - Get details for a specific appointment
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { data, error } = await supabaseAdmin.from("appointments").select("*").eq("id", id).single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json({ appointment: data });
}

// PUT /api/appointments/[id] - Full update
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin.from("appointments").update(body).eq("id", id).select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ appointment: data[0] });
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/appointments/[id] - Partial update
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin.from("appointments").update(body).eq("id", id).select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ appointment: data[0] });
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/appointments/[id] - Delete an appointment
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { error } = await supabaseAdmin.from("appointments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
