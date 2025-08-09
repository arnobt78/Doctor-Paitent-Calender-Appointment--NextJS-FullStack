"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Appointment,
  Category,
  Patient,
  AppointmentAssignee,
  Activity,
  Relative,
} from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect as useAuthEffect, useState as useAuthState } from "react";
import type { User } from "@supabase/supabase-js";
import Filters from "./Filters";
import AppointmentDialog from "./AppointmentDialog";
import EditAppointmentDialog from "./EditAppointmentDialog";
import { useDateContext } from "@/context/DateContext";
import { Button } from "@/components/ui/button";
import { getUserAppointmentPermission } from "@/lib/permissions";
import {
  FiEdit2,
  FiTrash2,
  FiFileText,
  FiUser,
  FiMapPin,
  FiPaperclip,
  FiFlag,
  FiUsers,
} from "react-icons/fi";
import { MdCategory } from "react-icons/md";
import AppointmentListSkeleton from "./AppointmentListSkeleton";
import SearchBar from "./SearchBar";
import { useAppointmentColor } from "@/context/AppointmentColorContext";

type FullAppointment = Appointment & {
  category_data?: Category;
  patient_data?: Patient;
  appointment_assignee?: (AppointmentAssignee & { invited_email?: string })[];
  activities?: Activity[];
};

// Reusable component for date headline
function DateHeadline({ date }: { date: Date }) {
  return (
    <div className="text-lg font-bold text-gray-700 mt-8 mb-2 flex items-center gap-2">
      {format(date, "EEEE, dd. MMMM", { locale: de })}
      {(() => {
        const now = new Date();
        if (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate()
        ) {
          return (
            <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
              Heute
            </span>
          );
        }
        return null;
      })()}
    </div>
  );
}

// Helper to group appointments by date (ascending, today first)
function groupAppointmentsByDate(appts: FullAppointment[]) {
  const groups: { [date: string]: FullAppointment[] } = {};
  appts.forEach((appt) => {
    const d = new Date(appt.start);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(appt);
  });

  // Removed stray today.setHours(0, 0, 0, 0); // 'today' is not defined here and not needed
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    return da.getTime() - db.getTime();
  });
  return sortedKeys.map((key) => ({ date: new Date(key), appts: groups[key] }));
}

// Tag logic for date (Heute, Demnächst, Einen Tag später, Datum überschritten)
function getDateTag(date: Date) {
  const today = new Date();
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

export default function AppointmentList() {
  // State for current user
  const [user, setUser] = useAuthState<User | null>(null);
  // Create a Supabase client for all calls
  const supabase = createClientComponentClient();
  const [appointments, setAppointments] = useState<FullAppointment[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [patient, setPatient] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentDate } = useDateContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editAppt, setEditAppt] = useState<FullAppointment | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { randomBgColor } = useAppointmentColor();

  // Fetch categories, patients, relatives on mount
  useEffect(() => {
    (async () => {
      const { data: catData } = await supabase.from("categories").select("*");
      setCategories(catData || []);
      const { data: patData } = await supabase.from("patients").select("*");
      setPatients(patData || []);
      const { data: rels } = await supabase.from("relatives").select("*");
      setRelatives(rels || []);
    })();
  }, [supabase]);

  // Fetch current user on mount
  useAuthEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    })();
  }, [supabase]);

  // Compose filters object for query
  const filters = { category, patient, date, status };

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    if (!user) return;
    setLoading(true);
    // Fetch owned appointments
    const { data: owned } = await supabase
      .from("appointments")
      .select("*, category:category(*), patient:patients(*), appointment_assignee:appointment_assignee(*), activities:activities(*)")
      .eq("user_id", user.id)
      .order("start", { ascending: true });

    // Fetch assigned appointments by user
    const { data: assignedByUser } = await supabase
      .from("appointment_assignee")
      .select("appointment, permission, status, appointment_data:appointment(*), invited_email, id, created_at, user, user_type")
      .eq("user", user.id)
      .eq("status", "accepted");

    // Fetch assigned appointments by invited_email
    let userEmail: string | null = null;
    const { data: userData } = await supabase.auth.getUser();
    userEmail = userData?.user?.email || null;
    let assignedByEmail: (AppointmentAssignee & { appointment_data: Appointment })[] = [];
    if (userEmail) {
      const { data: assignedEmail } = await supabase
        .from("appointment_assignee")
        .select("appointment, permission, status, appointment_data:appointment(*), invited_email, id, created_at, user, user_type")
        .eq("invited_email", userEmail)
        .eq("status", "accepted");
      assignedByEmail = (assignedEmail || []).map((a) => ({
        ...a,
        appointment_data: Array.isArray(a.appointment_data)
          ? a.appointment_data[0]
          : a.appointment_data,
      }));
    }
    // Merge assigned appointments
    type AppointmentWithAssignees = FullAppointment & { appointment_assignee?: AppointmentAssignee[] };
    const assignedAppointments: AppointmentWithAssignees[] = [...(assignedByUser || []), ...assignedByEmail]
      .filter((a) => typeof a.permission === "string" && ["read", "write", "full"].includes(a.permission))
      .map((a) => {
        const apptData = Array.isArray(a.appointment_data)
          ? a.appointment_data[0]
          : a.appointment_data;
        return { ...apptData, appointment_assignee: [a] };
      });
    // Merge and deduplicate, always include all assignees for each appointment
    const allAppointments: AppointmentWithAssignees[] = [...(owned || []), ...assignedAppointments].map((appt) => ({ ...appt }));
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

    // Apply filters
    let filtered = deduped;
    if (date) {
      const day = new Date(date);
      day.setHours(0, 0, 0, 0);
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      filtered = filtered.filter((a: AppointmentWithAssignees) =>
        new Date(a.start) >= dayStart &&
        new Date(a.start) <= dayEnd
      );
    }
    if (category) filtered = filtered.filter((a: AppointmentWithAssignees) => a.category === category);
    if (patient) filtered = filtered.filter((a: AppointmentWithAssignees) => a.patient === patient);
    if (status) filtered = filtered.filter((a: AppointmentWithAssignees) => a.status === status);
    setAppointments(filtered as FullAppointment[]);
    setLoading(false);
  }, [category, patient, date, status, user, supabase]);
  // Helper: get permission for current user on an appointment
  // Use shared permission helper
  function getUserPermission(appt: FullAppointment): "owner" | "full" | "write" | "read" | null {
    return getUserAppointmentPermission({
      appointment: appt,
      assignees: appt.appointment_assignee,
      userId: user?.id,
    });
  }

  useEffect(() => {
    if (user) fetchAppointments();
  }, [fetchAppointments, currentDate, user]);

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

  const isEmpty = appointments.length === 0;

  // Filtered appointments based on search
  const filteredAppointments = appointments.filter((appt) => {
    if (!search.trim()) return true;
    const lower = search.toLowerCase();
    // Helper to check if a string includes the search
    const match = (val?: string) => !!val && val.toLowerCase().includes(lower);
    // Check all relevant fields
    // Patient name: handle both patient_data and patient as object
    let patientNameMatch = false;
    if (appt.patient_data) {
      patientNameMatch =
        !!match(appt.patient_data.firstname) ||
        !!match(appt.patient_data.lastname) ||
        !!match(appt.patient_data.email);
    } else if (
      appt.patient &&
      typeof appt.patient === "object" &&
      "firstname" in appt.patient &&
      "lastname" in appt.patient
    ) {
      const patientObj = appt.patient as {
        firstname?: string;
        lastname?: string;
      };
      patientNameMatch =
        !!match(patientObj.firstname) || !!match(patientObj.lastname);
    }
    return (
      match(appt.title) ||
      match(appt.notes) ||
      match(appt.location) ||
      match(appt.status) ||
      (appt.category_data &&
        (match(appt.category_data.label) ||
          match(appt.category_data.description))) ||
      patientNameMatch ||
      (appt.appointment_assignee &&
        appt.appointment_assignee.some((a) => match(a.user))) ||
      (appt.activities &&
        appt.activities.some((a) => match(a.type) || match(a.content))) ||
      (appt.attachements && appt.attachements.some((a) => match(a)))
    );
  });

  // Helper to handle edit dialog close and refresh
  const handleEditSuccess = () => {
    setEditAppt(null);
    fetchAppointments();
  };

  const handleEdit = (appt: FullAppointment) => {
    setEditAppt(appt);
    setEditOpen(true);
  };
  const handleEditDialogChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) setEditAppt(null);
  };

  // --- DEBUG: Log Supabase Storage buckets and env at runtime ---
  useEffect(() => {
    (async () => {
      // List all buckets
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        console.error("[DEBUG] Error listing buckets:", error);
      } else {
        console.log("[DEBUG] Supabase buckets:", buckets);
      }
    })();
  }, [supabase.storage]);

  // Group appointments by date (descending)
  const grouped = groupAppointmentsByDate(filteredAppointments);

  if (loading) {
    return <AppointmentListSkeleton />;
  }

  // ...existing code for rendering the list...
  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#f5f5f6] min-h-[calc(100vh-80px)]">
      {/* <ListCalendarHeader /> */}
      <h2 className="text-2xl font-semibold tracking-tight text-gray-800 mb-2">
        Terminliste
      </h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1 min-w-[220px]">
          <SearchBar value={search} setValue={setSearch} />
        </div>
        <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
          <Filters
            category={category}
            setCategory={setCategory}
            patient={patient}
            setPatient={setPatient}
            date={date}
            setDate={setDate}
            status={status}
            setStatus={setStatus}
            categories={categories}
            patients={patients}
          />
          <Button
            variant="outline"
            className="ml-2 bg-black text-white hover:bg-gray-400 cursor-pointer"
            onClick={() => {
              setCategory(null);
              setPatient(null);
              setDate(null);
              setStatus(null);
              setSearch(""); // Clear search bar as well
            }}
          >
            Reset
          </Button>
        </div>
      </div>
      {/* Only show the 'Kein Treffer gefunden' message if there is a search term */}
      {/* {filteredAppointments.length === 0 && search.trim() && ( */}
      
      {/* Show empty state if no appointments at all (before filtering) */}
      {appointments.length === 0 && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center text-gray-500 text-lg">
              Kein Termin gefunden!
          </div>
      </div>
      )}

      {/* Only show the 'Kein Treffer gefunden' message if there are appointments but none match the filter/search */}
      {appointments.length > 0 && filteredAppointments.length === 0 && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center text-gray-500 text-lg">
            ❌ Kein Treffer gefunden für Ihre Suche nach &quot;{search}&quot;
          </div>
        </div>
      )}

      {/* Render grouped appointments */}

      {filteredAppointments.length > 0 && (
        <div className="flex flex-col gap-4">
          {grouped.map(({ date, appts }) => (
            <div key={date.toISOString()}>
              <DateHeadline date={date} />
              <div className="flex flex-col gap-4">
                {appts.map((appt, i) => {
                  // console.log('[AppointmentList] Appointment Card:', appt);
                  // --- Begin: Restored full-featured appointment card ---
                const start = new Date(appt.start);
                const now = new Date();
                const isToday =
                  start.getFullYear() === now.getFullYear() &&
                  start.getMonth() === now.getMonth() &&
                  start.getDate() === now.getDate();
                // Always use a stable random color from bgColors for the left border if no category color is set
                const color = appt.category_data?.color || randomBgColor(appt.id);
                const isDone = appt.status === "done";
                const categoryIcon = appt.category_data?.icon ? (
                  <span className="inline-flex items-center mr-1">
                    <MdCategory className="w-4 h-4 text-gray-400" />
                  </span>
                ) : null;

// Deduplicate assignees by user + invited_email
const filteredAssignees = appt.appointment_assignee || [];
const dedupedMap = new Map();
for (const ass of filteredAssignees) {
  const key = `${ass.user || ""}|${ass.invited_email || ""}`;
  if (!dedupedMap.has(key)) {
    dedupedMap.set(key, ass);
    continue;
  }
  // Prefer accepted over pending, prefer higher permission
  const prev = dedupedMap.get(key) as AppointmentAssignee;
  const statusOrder: Record<'accepted' | 'pending', number> = { accepted: 2, pending: 1 };
  const permOrder: Record<'full' | 'write' | 'read', number> = { full: 3, write: 2, read: 1 };
  // Type guards for status and permission
  const isValidStatus = (s: unknown): s is 'accepted' | 'pending' => s === 'accepted' || s === 'pending';
  const isValidPerm = (p: unknown): p is 'full' | 'write' | 'read' => p === 'full' || p === 'write' || p === 'read';
  const prevStatus = isValidStatus(prev.status) ? statusOrder[prev.status] : 0;
  const currStatus = isValidStatus(ass.status) ? statusOrder[ass.status] : 0;
  const prevPerm = isValidPerm(prev.permission) ? permOrder[prev.permission] : 0;
  const currPerm = isValidPerm(ass.permission) ? permOrder[ass.permission] : 0;
  if (
    currStatus > prevStatus ||
    (currStatus === prevStatus && currPerm > prevPerm)
  ) {
    dedupedMap.set(key, ass);
  }
}
const dedupedAssignees = Array.from(dedupedMap.values());
                


                return (
                  <div
                    key={appt.id}
                    data-today={isToday ? "true" : undefined}
                    ref={isToday && i === 0 ? scrollRef : null}
                    className={`relative border rounded-xl shadow bg-white p-0 flex items-stretch transition hover:shadow-lg min-h-[110px]`}
                    style={{ '--appt-color': color } as React.CSSProperties}
                  >
                    {/* Color bar */}
                    <div
                      className="w-2 rounded-l-xl h-full absolute left-0 top-0 bottom-0 transition-colors"
                      style={{ backgroundColor: 'var(--appt-color)' }}
                    />
                    {/* Main content */}
                    <div className="pl-6 pr-2 py-4 flex-1 flex flex-col justify-center min-h-[110px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-base font-semibold text-gray-700">
                          <span
                            className={
                              isDone ? "line-through text-gray-400" : undefined
                            }
                          >
                            {appt.title}
                          </span>
                        </div>
                        {getDateTag(start)}
                      </div>
                      {/* Date and Time with icon */}
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-1">
                        <span className="flex items-center gap-1">
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                            className="inline-block align-middle text-gray-400"
                          >
                            <path
                              d="M8 7V3M16 7V3M3 11H21M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span
                            className={
                              isDone ? "line-through text-gray-400" : undefined
                            }
                          >
                            {format(start, "dd.MM.yyyy")}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                            className="inline-block align-middle text-gray-400"
                          >
                            <path
                              d="M12 6V12L16 14"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                          <span
                            className={
                              isDone ? "line-through text-gray-400" : undefined
                            }
                          >
                            {format(start, "HH:mm")} – {format(new Date(appt.end), "HH:mm")}
                          </span>
                        </span>
                      </div>

                      {/* Notes with icon */}
                      {appt.notes && (
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <FiFileText
                            className={`w-4 h-4 ${
                              isDone ? "text-gray-300" : "text-gray-400"
                            }`}
                          />
                          <span
                            className={
                              isDone
                                ? "line-through text-gray-400"
                                : "text-gray-600"
                            }
                          >
                            {appt.notes}
                          </span>
                        </div>
                      )}

                      {/* Category with icon */}
                      {appt.category_data && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          {categoryIcon}
                          <span>{appt.category_data.label}</span>
                        </div>
                      )}

                      {/* Client name with icon */}
                      <div className="flex items-center gap-2 text-xs text-gray-400 italic mt-1">
                        <FiUser className="w-4 h-4" />
                        <span>Klient:</span>
                        <span className="not-italic text-gray-700">
                          {appt.patient &&
                          typeof appt.patient === "object" &&
                          "firstname" in appt.patient &&
                          "lastname" in appt.patient
                            ? `${(appt.patient as Patient).firstname} ${(appt.patient as Patient).lastname}`
                            : appt.patient && patients.length > 0
                            ? (() => {
                                const p = patients.find(
                                  (x) => x.id === appt.patient
                                );
                                return p
                                  ? `${p.firstname} ${p.lastname}`
                                  : "--";
                              })()
                            : "--"}
                        </span>
                      </div>

                      {/* Location with icon */}
                      <div className="flex items-center gap-2 text-xs text-gray-400 italic mt-1">
                        <FiMapPin className="w-4 h-4" />
                        <span>Ort:</span>
                        <span className="not-italic text-gray-700">
                          {appt.location || "--"}
                        </span>
                      </div>

                      {/* Attachments with icon */}
                      {appt.attachements && appt.attachements.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <FiPaperclip className="w-4 h-4" />
                          <span>Anhänge:</span>
                          {appt.attachements.map((file, idx) => {
                            if (typeof window !== "undefined") {
                              console.log("Supabase bucket:", "attachments");
                              console.log("Attachment file:", file);
                            }
                            const { data } = supabase.storage
                              .from("attachments")
                              .getPublicUrl(file);
                            if (typeof window !== "undefined") {
                              console.log(
                                "Generated publicUrl:",
                                data?.publicUrl
                              );
                            }
                            const fileName = file.split("/").pop() || file;
                            return data && data.publicUrl ? (
                              <a
                                key={idx}
                                href={data.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="not-italic text-blue-700 underline"
                              >
                                {fileName}
                              </a>
                            ) : (
                              <span key={idx} className="text-red-600">
                                [Fehler: Datei nicht gefunden]
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Status with icon */}
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <FiFlag className="w-4 h-4" />
                        <span>Status:</span>
                        <span className="not-italic text-gray-700">
                          {appt.status || "pending"}
                        </span>
                      </div>

                      {/* Refer to: patient/relative names */}
                    {dedupedAssignees.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <FiUsers /> Refer to:
                        {dedupedAssignees
                          .map((ass, idx) => {
                            let patientName = "";
                            if (ass.user_type === "patients") {
                              const p = patients.find((x) => x.id === ass.user);
                              if (p) patientName = `Patient: ${p.firstname} ${p.lastname}`;
                            } else if (ass.user_type === "relatives") {
                              const r = relatives.find((x) => x.id === ass.user);
                              if (r) patientName = `Angehörige: ${r.firstname} ${r.lastname}`;
                            }
                            return patientName ? (
                              <span key={ass.id || idx} className="not-italic text-purple-700">
                                {patientName}
                              </span>
                            ) : null;
                          })
                          .filter(Boolean)}
                      </div>
                    )}
                    {/* Assigned by: invited_email, user id, or owner */}
                    {dedupedAssignees.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <FiUsers /> Assigned by:
                        {dedupedAssignees
                          .map((ass, idx) => {
                            let patientName = "";
                            if (ass.user_type === "patients") {
                              const p = patients.find((x) => x.id === ass.user);
                              if (p) patientName = `Patient: ${p.firstname} ${p.lastname}`;
                            } else if (ass.user_type === "relatives") {
                              const r = relatives.find((x) => x.id === ass.user);
                              if (r) patientName = `Angehörige: ${r.firstname} ${r.lastname}`;
                            }
                            // Only show if not patient/relative
                            if (!patientName) {
                              if (ass.invited_email) {
                                return (
                                  <span key={ass.id || idx} className="not-italic text-blue-700">
                                    {ass.invited_email}
                                  </span>
                                );
                              } else if (ass.user === appt.user_id) {
                                // Owner
                                return (
                                  <span key={ass.id || idx} className="not-italic text-green-700">
                                    you ({user?.email || "owner"})
                                  </span>
                                );
                              } else if (ass.user) {
                                return (
                                  <span key={ass.id || idx} className="not-italic text-gray-700">
                                    {ass.user}
                                  </span>
                                );
                              }
                            }
                            return null;
                          })
                          .filter(Boolean)}
                        {/* If no assignee matched owner, show owner explicitly */}
                        {dedupedAssignees.every(ass => ass.user !== appt.user_id) && appt.user_id && (
                          <span key={appt.user_id} className="not-italic text-green-700">
                            you ({user?.email || "owner"})
                          </span>
                        )}
                      </div>
                    )}
                      
                      {appt.activities && appt.activities.length > 0 && (
                      <div className="flex flex-col gap-1 text-xs text-gray-400 mb-1">
                        <span>Aktivitäten:</span>
                        {appt.activities
                          .map((act, idx) => (
                            <span
                              key={idx}
                              className="not-italic text-pink-700"
                            >
                              {act.type}: {act.content}
                            </span>
                          ))}
                      </div>
                    )}
                    </div>

                    {/* Actions column */}
                    <div className="flex flex-col items-center gap-3 min-w-[56px] py-4 px-2 justify-center">
                      <label className="flex flex-col items-center gap-1">
                        <input
                          type="checkbox"
                          className="mb-1 accent-green-600 w-5 h-5 cursor-pointer hover:ring-2 hover:ring-green-300"
                          checked={isDone}
                          onChange={() =>
                            toggleStatus(appt.id, isDone ? "pending" : "done")
                          }
                          disabled={(() => {
                            const perm = getUserPermission(appt);
                            // Only owner, full, or write can toggle status
                            return perm !== "owner" && perm !== "full" && perm !== "write";
                          })()}
                        />
                        <span className="text-xs text-gray-500 select-none">
                          {isDone ? "Erledigt" : "Offen"}
                        </span>
                      </label>
                      {/* Only show edit/delete if user is owner or has 'full' permission */}
                      {(() => {
                        const perm = getUserPermission(appt);
                        // Only owner or full can edit/delete
                        if (perm === "owner" || perm === "full") {
                          return <>
                            <Button
                              size="icon"
                              variant="outline"
                              className="rounded-full border-gray-300 cursor-pointer hover:bg-gray-100"
                              onClick={() => handleEdit(appt)}
                              aria-label="Bearbeiten"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="rounded-full cursor-pointer hover:bg-red-100"
                              onClick={() => deleteAppt(appt.id)}
                              aria-label="Löschen"
                            >
                              <FiTrash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
                // --- End: Restored full-featured appointment card ---
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editAppt ? (
        <EditAppointmentDialog
          appointment={editAppt}
          onSuccess={handleEditSuccess}
          trigger={undefined}
          isOpen={editOpen}
          onOpenChange={handleEditDialogChange}
          supabase={supabase}
          refreshAppointments={fetchAppointments}
        />
      ) : null}
    </div>
  );
}
