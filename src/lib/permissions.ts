import { Appointment, AppointmentAssignee } from "@/types/types";

/**
 * Returns the permission level for the current user on a given appointment.
 * - "owner": user is the creator
 * - "full", "write", "read": as assigned
 * - null: no access
 */
export function getUserAppointmentPermission({
  appointment,
  assignees,
  userId,
}: {
  appointment: Appointment;
  assignees?: AppointmentAssignee[];
  userId: string | null | undefined;
}): "owner" | "full" | "write" | "read" | null {
  if (!userId) return null;
  if (appointment.user_id === userId) return "owner";
  // Check for accepted assignee by userId or invited_email
  const assignee = assignees?.find(
    (a) =>
      (a.user === userId || a.invited_email === userId) &&
      a.status === "accepted"
  );
  return assignee?.permission || null;
}
