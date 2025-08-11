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

// GET /api/appointments - List all appointments
export async function GET(req: NextRequest) {
  // Optional: Add filtering, pagination, etc.
  const { searchParams } = new URL(req.url);
  // Example: filter by user_id
  const userId = searchParams.get("user_id");
  let query = supabaseAdmin.from("appointments").select("*");
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ appointments: data });
}

// POST /api/appointments - Create a new appointment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validate required fields
    if (!body.title || !body.start || !body.end || !body.user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from("appointments").insert([body]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const appointments = data as Appointment[] | null;
    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ error: "Appointment not found or could not be created." }, { status: 404 });
    }
    return NextResponse.json({ appointment: appointments[0] });
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/appointments/[id] - Get details for a specific appointment
export async function GET_BY_ID(req: NextRequest, { params }: { params: { id: string } }) {
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
export async function DELETE_BY_ID(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { error } = await supabaseAdmin.from("appointments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

