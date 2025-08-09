import AppointmentDialog from "./AppointmentDialog";
import { useState } from "react";
import type { Appointment } from "../../types/types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface EditAppointmentDialogProps {
  appointment: Appointment;
  onSuccess: () => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  supabase: SupabaseClient;
  refreshAppointments: () => void;
}

export default function EditAppointmentDialog({
  appointment,
  onSuccess,
  trigger,
  isOpen,
  onOpenChange,
  supabase,
  refreshAppointments,
}: EditAppointmentDialogProps) {
  // Handler to refetch appointments and close dialog
  const handleSuccess = async () => {
    if (onSuccess) onSuccess();
    if (refreshAppointments) await refreshAppointments();
    // Refetch appointments after edit
    const { data } = await supabase
      .from("appointments")
      .select("*, category:category(*)");
    if (data) {
      await refreshAppointments();
    }
  };

  return (
    <AppointmentDialog
      appointment={appointment}
      onSuccess={handleSuccess}
      trigger={trigger}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    />
  );
}
