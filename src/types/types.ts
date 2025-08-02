// App User (matches Supabase Auth user and users table)
export interface User {
  id: UUID; // Supabase Auth user id
  email: string;
  role?: string;
  display_name?: string;
  created_at?: string;
}
export type UUID = string;

// Patient
export interface Patient {
  id: UUID;
  firstname: string;
  lastname: string;
  birth_date: string;
  care_level: number;
  pronoun: string;
  email: string;
  active: boolean;
  active_since: string;
  created_at: string;
}

// Relative
export interface Relative {
  id: UUID;
  created_at: string;
  firstname: string;
  lastname: string;
  pronoun: string;
  notes: string;
}

// Category
export interface Category {
  id: UUID;
  created_at: string;
  updated_at: string | null;
  label: string;
  description: string;
  color: string;
  icon: string;
}

// Appointment
export interface Appointment {
  id: UUID;
  created_at: string;
  updated_at: string | null;
  start: string;
  end: string;
  location: string;
  patient: UUID;
  attachements: string[]; // Assuming array of URLs or filenames
  category: UUID;
  notes: string;
  title: string;
  status?: "done" | "pending" | "alert"; // Optional status field added
  user_id: UUID; // The owner (Supabase Auth user id)
}

// Appointment Assignee
export interface AppointmentAssignee {
  id: UUID;
  created_at: string;
  appointment: UUID;
  user: UUID;
  user_type: "relatives" | "patients";
}

// Activity
export interface Activity {
  id: UUID;
  created_at: string;
  created_by: UUID;
  appointment: UUID;
  type: string;
  content: string;
}
