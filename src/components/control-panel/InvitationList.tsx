"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AppointmentAssignee as BaseAppointmentAssignee } from "@/types/types";

type AppointmentAssignee = BaseAppointmentAssignee & {
  appointment_title?: string;
};


// Dashboard invitation type (minimal, based on API response)
type DashboardInvitation = {
  id?: string;
  owner_user_id: string;
  invited_email: string;
  status?: "pending" | "accepted" | "declined";
  permission?: "read" | "write" | "full";
  invitation_token?: string;
};

type Invitation = AppointmentAssignee | DashboardInvitation;

function isDashboardInvitation(inv: Invitation): inv is DashboardInvitation {
  return (
    typeof inv === "object" &&
    "owner_user_id" in inv &&
    typeof (inv as DashboardInvitation).owner_user_id === "string"
  );
}

function isAppointmentAssignee(inv: Invitation): inv is AppointmentAssignee {
  return (
    typeof inv === "object" &&
    "appointment" in inv &&
    typeof (inv as AppointmentAssignee).appointment === "string"
  );
}

export default function InvitationList({ type }: { type: "appointment" | "dashboard" }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvitations() {
      setLoading(true);
      const res = await fetch("/api/invitations");
      const data = await res.json();
      console.log("API /api/invitations response:", data);
      // Use all invitations from API directly (already filtered for current user)
      setInvitations(data[type + "Invitations"] || []);
      setLoading(false);
    }
    fetchInvitations();
  }, [type]);

  if (loading) return <div>Loading invitations...</div>;
  if (!invitations.length) return <div className="mt-4 text-gray-500">No invitations found.</div>;

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Your {type === "appointment" ? "Appointment" : "Dashboard"} Invitations</h3>
      <ul className="divide-y">
        {invitations.map((inv) => {
          let key: string | undefined = undefined;
          let displayValue = "";
          let invitationToken: string | undefined = undefined;
          if (isAppointmentAssignee(inv)) {
            key = inv.id;
            // Show appointment title and UUID
            displayValue = `${inv.appointment_title || "Untitled"} (${inv.appointment})`;
            invitationToken = undefined;
          } else if (isDashboardInvitation(inv)) {
            key = inv.id || inv.invitation_token;
            displayValue = inv.owner_user_id;
            invitationToken = inv.invitation_token;
          }
          return (
            <li key={key} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{displayValue}</div>
                <div className="text-xs text-gray-600">Status: {inv.status}</div>
                <div className="text-xs text-gray-600">Permission: {inv.permission}</div>
              </div>
              {inv.status === "pending" && invitationToken && (
                <Button size="sm" onClick={() => window.open(`/accept-invitation?token=${invitationToken}`, "_blank")}>Accept</Button>
              )}
              {inv.status === "pending" && !invitationToken && isAppointmentAssignee(inv) && (
                <Button size="sm" onClick={() => window.open(`/accept-invitation?token=${inv.id}`, "_blank")}>Accept</Button>
              )}
              {/* Discard Invitation button for appointment invitations (sender or receiver) */}
              {type === "appointment" && key && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!key) return;
                    const res = await fetch(`/api/appointments/${key}/permissions`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      setInvitations((prev) => prev.filter((i) => (isAppointmentAssignee(i) ? i.id !== key : true)));
                    } else {
                      const errorData = await res.json();
                      alert(errorData.error || "Failed to discard appointment invitation");
                    }
                  }}
                >
                  Discard Appointment Invitation
                </Button>
              )}
              {/* Discard Invitation button for dashboard invitations (sender or receiver) */}
              {type === "dashboard" && key && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!key) return;
                    const res = await fetch(`/api/dashboard/${key}/permissions`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      setInvitations((prev) => prev.filter((i) => (isDashboardInvitation(i) ? i.id !== key : true)));
                    } else {
                      const errorData = await res.json();
                      alert(errorData.error || "Failed to discard dashboard invitation");
                    }
                  }}
                >
                  Discard Dashboard Invitation
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
