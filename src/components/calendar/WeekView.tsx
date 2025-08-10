"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, addDays, setHours, setMinutes } from "date-fns";
import { Appointment, Category } from "@/types/types";
import { getUserAppointmentPermission } from "@/lib/permissions";
import AppointmentDialog from "./AppointmentDialog";
import EditAppointmentDialog from "./EditAppointmentDialog";
import { useDateContext } from "@/context/DateContext";

import type {
  Patient,
  Relative,
  AppointmentAssignee,
  Activity,
} from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import AppointmentHoverCard from "./AppointmentHoverCard";
import { useAppointmentColor } from "@/context/AppointmentColorContext";

type AppointmentWithCategory = Appointment & {
  category_data?: Category;
  appointment_assignee?: AppointmentAssignee[];
};

export default function WeekView() {
  const [appointments, setAppointments] = useState<AppointmentWithCategory[]>([]);
  const supabase = createClientComponentClient();
  const { currentDate } = useDateContext();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [editAppt, setEditAppt] = useState<AppointmentWithCategory | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  // Store current userId and userEmail for permission checks
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Add state for patients, relatives, assignees, activities
  const [patients, setPatients] = useState<Patient[]>([]);
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [assignees, setAssignees] = useState<AppointmentAssignee[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [ownerUsers, setOwnerUsers] = useState<{ id: string, email: string }[]>([]);

  const { randomBgColor } = useAppointmentColor();

  useEffect(() => {
    // Fetch all patients, relatives, assignees, and activities for mapping
    (async () => {
      const { data: pats } = await supabase.from("patients").select("*");
      const { data: rels } = await supabase.from("relatives").select("*");
      const { data: assigns } = await supabase
        .from("appointment_assignee")
        .select("*");
      const { data: acts } = await supabase.from("activities").select("*");
      setPatients(pats || []);
      setRelatives(rels || []);
      setAssignees(assigns || []);
      setActivities(acts || []);
    })();
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      const email = userData?.user?.email || null;
      if (!uid && !email) return;
      setUserId(uid || null);
      setUserEmail(email);
      // Fetch owned appointments
      const { data: owned } = await supabase
        .from("appointments")
        .select("*, category:category(*), appointment_assignee:appointment_assignee(*)")
        .eq("user_id", uid);

      // --- NEW: Fetch dashboard access for invited users ---
      const { data: dashboardAccess } = await supabase
        .from("dashboard_access")
        .select("owner_user_id")
        .eq("invited_user_id", uid)
        .eq("status", "accepted");
      // Define type for dashboardAccess rows
      type DashboardAccessRow = { owner_user_id: string };
      // Define type for shared appointments (AppointmentWithCategory)
      let sharedAppointments: AppointmentWithCategory[] = [];
      if (dashboardAccess && dashboardAccess.length > 0) {
        const ownerIds = (dashboardAccess as DashboardAccessRow[]).map((d) => d.owner_user_id).filter(Boolean);
        if (ownerIds.length > 0) {
          const { data: shared } = await supabase
            .from("appointments")
            .select("*, category:category(*), appointment_assignee:appointment_assignee(*)")
            .in("user_id", ownerIds);
          sharedAppointments = (shared || []) as AppointmentWithCategory[];
        }
      }

      // Fetch assigned appointments by user
      const { data: assignedByUser } = await supabase
        .from("appointment_assignee")
        .select("appointment, permission, status, appointment_data:appointment(*), invited_email, id, created_at, user, user_type")
        .eq("user", uid)
        .eq("status", "accepted");
      // Fetch assigned appointments by invited_email
      let assignedByEmail: (AppointmentAssignee & { appointment_data: Appointment })[] = [];
      if (email) {
        const { data: assignedEmail } = await supabase
          .from("appointment_assignee")
          .select("appointment, permission, status, appointment_data:appointment(*), invited_email, id, created_at, user, user_type")
          .eq("invited_email", email)
          .eq("status", "accepted");
        assignedByEmail = (assignedEmail || []).map((a) => ({
          ...a,
          appointment_data: Array.isArray(a.appointment_data)
            ? a.appointment_data[0]
            : a.appointment_data,
        }));
      }

      // Merge assigned appointments
      type AppointmentWithAssignees = AppointmentWithCategory & { appointment_assignee?: AppointmentAssignee[] };
      type AssigneeWithAppointmentData = AppointmentAssignee & { appointment_data: Appointment };

      // Process assignedByUser to match the same structure as assignedByEmail
      const processedAssignedByUser: AssigneeWithAppointmentData[] = (assignedByUser || []).map((a) => ({
        ...a,
        appointment_data: Array.isArray(a.appointment_data)
          ? a.appointment_data[0]
          : a.appointment_data,
      }));

      const assignedAppointments: AppointmentWithAssignees[] = [...processedAssignedByUser, ...assignedByEmail]
        .filter((a) => typeof a.permission === "string" && ["read", "write", "full"].includes(a.permission))
        .map((a: AssigneeWithAppointmentData) => {
          const apptData = Array.isArray(a.appointment_data)
            ? a.appointment_data[0]
            : a.appointment_data;
          return { ...apptData, appointment_assignee: [a] };
        });

      // Collect all unique user IDs from appointments to get owner emails
      const allUserIds = new Set<string>();
      if (owned) {
        owned.forEach(appt => {
          if (appt.user_id) allUserIds.add(appt.user_id);
        });
      }
      if (sharedAppointments && sharedAppointments.length > 0) {
        sharedAppointments.forEach(appt => {
          if (appt.user_id) allUserIds.add(appt.user_id);
        });
      }
      assignedAppointments.forEach(appt => {
        if (appt.user_id) allUserIds.add(appt.user_id);
      });

      // Fetch user data for all owners
      const { data: allOwnerUsers } = await supabase
        .from("users")
        .select("id, email")
        .in("id", Array.from(allUserIds));

      setOwnerUsers(allOwnerUsers || []);
      // Merge and deduplicate, always include all assignees for each appointment
      const allAppointments: AppointmentWithAssignees[] = [...(owned || []), ...sharedAppointments, ...assignedAppointments].map((appt) => ({ ...appt }));
      const deduped: AppointmentWithAssignees[] = allAppointments.reduce((acc: AppointmentWithAssignees[], curr: AppointmentWithAssignees) => {
        if (!curr || !curr.id) return acc;
        const existing = acc.find((a) => a.id === curr.id);
        if (existing) {
          existing.appointment_assignee = [
            ...(existing.appointment_assignee || []),
            ...(curr.appointment_assignee || [])
          ].filter((v, i, arr) => v && v.id && arr.findIndex((b) => b.id === v.id) === i);
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);
      if (deduped) setAppointments(deduped as AppointmentWithCategory[]);
    })();
  }, [currentDate, supabase]);

  // Helper: get permission for current user on an appointment
  // Use shared permission helper
  function getUserPermission(
    appt: AppointmentWithCategory & { appointment_assignee?: AppointmentAssignee[] },
    uid: string | null
  ): "owner" | "full" | "write" | "read" | null {
    return getUserAppointmentPermission({
      appointment: appt,
      assignees: appt.appointment_assignee,
      userId: uid,
    });
  }

  const toggleStatus = async (id: string, newStatus: string) => {
    await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: newStatus as typeof a.status } : a
      )
    );
  };

  const deleteAppt = async (id: string) => {
    if (!confirm("Termin wirklich löschen?")) return;
    await supabase.from("appointments").delete().eq("id", id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  // Helper for lighter color
  function lightenColor(hex: string, percent: number) {
    // Simple lighten for hex colors
    const num = parseInt(hex.replace("#", ""), 16);
    const r = (num >> 16) + Math.round(2.55 * percent);
    const g = ((num >> 8) & 0x00ff) + Math.round(2.55 * percent);
    const b = (num & 0x0000ff) + Math.round(2.55 * percent);
    return (
      "#" +
      (
        0x1000000 +
        (r < 255 ? (r < 1 ? 0 : r) : 255) * 0x10000 +
        (g < 255 ? (g < 1 ? 0 : g) : 255) * 0x100 +
        (b < 255 ? (b < 1 ? 0 : b) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  // Tag logic (Heute, Demnächst, Einen Tag später, Datum überschritten)
  function getDateTag(date: Date) {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0)
      return (
        <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
          Heute
        </span>
      );
    if (diffDays === 1)
      return (
        <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">
          Demnächst
        </span>
      );
    if (diffDays > 1)
      return (
        <span className="ml-2 px-2 py-0.5 rounded bg-sky-100 text-sky-700 text-xs font-medium">
          Einen Tag später
        </span>
      );
    if (diffDays < 0)
      return (
        <span className="ml-2 px-2 py-0.5 rounded bg-gray-200 text-gray-500 text-xs font-medium">
          Datum überschritten
        </span>
      );
    return null;
  }

  // --- UI update: Only one outer scrollbar, calendar stretches naturally ---
  // Set hourHeight and dayWidth for grid and card calculations
  const hourHeight = 120; // px per hour
  const dayWidth = 240; // px per day column, increased for better fit
  const headerRowHeight = hourHeight; // px, matches hour row height for now

  // --- Real-time red current time line feature ---
  // State for current time (updates every minute)
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper: is today in this week?
  const isTodayInWeek = () => {
    const weekEnd = addDays(weekStart, 6);
    return now >= weekStart && now <= weekEnd;
  };

  // Helper: get position of red line (in px from top)
  const getRedLinePosition = () => {
    const hour = now.getHours();
    const minute = now.getMinutes();
    return hour * hourHeight + (minute / 60) * hourHeight;
  };

  const handleEditDialogChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) setEditAppt(null);
  };

  return (
    <div className="p-6 sm:p-8 bg-[#f5f5f6] min-h-[calc(100vh-80px)] overflow-auto">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-800 mb-4">
        Wochenansicht
      </h2>
      <div
        style={{
          overflow: "auto",
          width: "100%",
          maxHeight: "calc(100vh - 160px)",
        }}
      >
        <div
          className="inline-grid border border-gray-200 text-sm relative"
          style={{
            minWidth: 60 + 7 * dayWidth,
            gridTemplateColumns: `60px repeat(7, minmax(0, ${dayWidth}px))`,
          }}
        >
          {/* --- Red current time line (always visible) --- */}
          <div
            style={{
              position: "absolute",
              left: 60, // after time column
              width: 7 * dayWidth, // span all 7 days
              // Subtract 40 minutes from the red line position for testing
              top:
                headerRowHeight +
                getRedLinePosition() -
                (42 / 60) * hourHeight,
              height: 0,
              zIndex: 50,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                borderTop: "2px solid #ef4444",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: -44,
                  top: -10,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "#ef4444",
                  padding: "0 4px",
                  borderRadius: 4,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                {format(now, "HH:mm")}
              </span>
            </div>
          </div>
          {/* Top-left sticky cell */}
          <div
            className="bg-gray-50 border-r border-b"
            style={{
              width: 60,
              position: "sticky",
              left: 0,
              top: 0,
              zIndex: 30,
            }}
          />

          {/* Date/day header row */}
          {Array.from({ length: 7 }).map((_, i) => {
            const day = addDays(weekStart, i);
            // Only highlight and show 'Heute' if today is in this week
            const isToday = day.toDateString() === new Date().toDateString();
            const isCurrentWeek = (() => {
              const today = new Date();
              const weekStartDate = startOfWeek(today, { weekStartsOn: 1 });
              const weekEndDate = addDays(weekStartDate, 6);
              return weekStart.getTime() === weekStartDate.setHours(0, 0, 0, 0);
            })();
            return (
              <div
                key={i}
                className={
                  "border-r border-b p-2 text-center font-medium text-gray-600 bg-gray-50" +
                  (isToday && isCurrentWeek ? " bg-green-50" : "")
                }
                style={{
                  width: dayWidth,
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                  background: isToday && isCurrentWeek ? "#e6f9ed" : "#f9fafb",
                }}
              >
                {format(day, "EEE dd.MM.")}
                {isToday && isCurrentWeek && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
                    Heute
                  </span>
                )}
              </div>
            );
          })}
          {/* Calendar grid */}
          {hours.map((hour) => (
            <div key={hour} className="contents">
              {/* Time column sticky */}
              <div
                className="border-r border-b px-2 py-2 text-xs bg-gray-50 text-gray-500"
                style={{
                  height: hourHeight,
                  width: 60,
                  position: "sticky",
                  left: 0,
                  zIndex: 15,
                  background: "#f9fafb",
                }}
              >{`${hour}:00`}
              </div>
              {Array.from({ length: 7 }).map((_, i) => {
                const day = addDays(weekStart, i);
                // Only highlight current day column if today is in this week
                const today = new Date();
                const weekStartDate = startOfWeek(today, { weekStartsOn: 1 });
                const isCurrentWeek = weekStart.getTime() === weekStartDate.setHours(0, 0, 0, 0);
                const isTodayCol = day.toDateString() === today.toDateString() && isCurrentWeek;
                const slotStart = setMinutes(setHours(day, hour), 0);
                const slotEnd = setMinutes(setHours(day, hour + 1), 0);
                // Find all appointments that overlap this hour slot
                const matches = appointments.filter((a) => {
                  const start = new Date(a.start);
                  const end = new Date(a.end);
                  return (
                    start < slotEnd &&
                    end > slotStart &&
                    start.toDateString() === day.toDateString()
                  );
                });
                return (
                  <div
                    key={i}
                    className={
                      "border-r border-b relative" +
                      (isTodayCol ? " bg-green-50" : "")
                    }
                    style={{
                      height: hourHeight,
                      width: dayWidth,
                      background: isTodayCol ? "#e6f9ed" : undefined,
                    }}
                  >

                    {/* Inject your code here: */}
                    {matches.map((a) => {
                      const color = randomBgColor(a.id);
                      const start = new Date(a.start);
                      const end = new Date(a.end);
                      const hourStart = start.getHours() + start.getMinutes() / 60;
                      const hourEnd = end.getHours() + end.getMinutes() / 60;
                      // Only render in the slot where the appointment starts
                      if (start.getHours() !== hour || start.toDateString() !== day.toDateString()) return null;
                      const slotTop = (hourStart - hour) * hourHeight;
                      const slotHeight = Math.max(30, (hourEnd - hourStart) * hourHeight); // 30px min height
                      return (
                        <div
                          key={a.id}
                          style={{
                            position: "absolute",
                            left: 4,
                            right: 4,
                            top: slotTop,
                            height: slotHeight,
                            minHeight: 30,
                            zIndex: 2,
                            // Add border and background for the card
                          }}
                        >
                          <AppointmentHoverCard
                            appointment={a}
                            patients={patients}
                            relatives={relatives}
                            assignees={assignees.filter((ass) => ass.appointment === a.id)}
                            activities={activities}
                            userEmail={userEmail}
                            userId={userId}
                            ownerUsers={ownerUsers}
                            getDateTag={getDateTag}
                            onEdit={setEditAppt}
                            onDelete={deleteAppt}
                            onToggleStatus={toggleStatus}
                            supabase={supabase}
                            showDetails={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Edit dialog */}
      {editAppt && (
        <EditAppointmentDialog
          appointment={editAppt}
          onSuccess={() => {
            setEditAppt(null);
          }}
          trigger={null}
          isOpen={editOpen}
          onOpenChange={handleEditDialogChange}
          supabase={supabase}
          refreshAppointments={() => {
            supabase
              .from("appointments")
              .select("*, category:category(*)")
              .then(({ data }) => {
                if (data) setAppointments(data);
              });
          }}
        />
      )}
    </div>
  );
}
