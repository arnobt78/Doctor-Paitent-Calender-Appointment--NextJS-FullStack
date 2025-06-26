"use client";

import React, { useEffect, useState } from "react";
import AppointmentDialog from "./AppointmentDialog";
import { Appointment } from "@/types/types";

interface AppointmentDialogTriggerProps {
  trigger?: React.ReactNode;
  appointment?: Appointment;
  onSuccess?: () => void;
}

export default function AppointmentDialogTrigger({
  trigger,
  appointment,
  onSuccess,
}: AppointmentDialogTriggerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (appointment) setOpen(true);
  }, [appointment]);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
  };

  return (
    <>
      {trigger && (
        <span onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      )}
      <AppointmentDialog
        isOpen={open}
        onOpenChange={handleOpenChange}
        appointment={appointment}
        onSuccess={() => {
          setOpen(false);
          onSuccess?.();
        }}
      />
    </>
  );
}
