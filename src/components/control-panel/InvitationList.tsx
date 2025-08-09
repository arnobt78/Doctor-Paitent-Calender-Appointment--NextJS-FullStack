"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AppointmentAssignee } from "@/types/types";


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
      // In a real app, get user info from auth/session
      const res = await fetch("/api/invitations", {
        headers: {
          // Replace with real user info in production
          "x-user-email": window.localStorage.getItem("userEmail") || "",
          "x-user-id": window.localStorage.getItem("userId") || "",
        },
      });
      const data = await res.json();
      setInvitations(data[type + "Invitations"] || []);
      setLoading(false);
    }
    fetchInvitations();
  }, [type]);

  if (loading) return <div>Loading invitations...</div>;
  if (!invitations.length) return <div className="text-gray-500">No invitations found.</div>;

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
            displayValue = inv.appointment;
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
