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
import { supabase } from "@/lib/supabaseClient";
import Filters from "./Filters";
import AppointmentDialog from "./AppointmentDialog";
import { useDateContext } from "@/context/DateContext";
import { Button } from "@/components/ui/button";
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

const bgColors = [
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EC4899",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
];
const randomBgColor = (seed: string) =>
  bgColors[
    seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % bgColors.length
  ];

type FullAppointment = Appointment & {
  category_data?: Category;
  patient_data?: Patient;
  appointment_assignee?: AppointmentAssignee[];
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
  // Sort keys ascending (today first, then future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
  const [appointments, setAppointments] = useState<FullAppointment[]>([]);
  const [filters, setFilters] = useState({
    category: null as string | null,
    patient: null as string | null,
    date: null as string | null,
    status: null as string | null,
  });
  const { currentDate } = useDateContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editAppt, setEditAppt] = useState<FullAppointment | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [loading, setLoading] = useState(true);

  // FIX: fetchAppointments must be stable and not re-created on every render
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("appointments")
      .select(
        "*, category:category(*), patient:patients(*), appointment_assignee:appointment_assignee(*), activities:activities(*)"
      )
      .order("start", { ascending: true });
    // Only filter by date if a date is selected in filters
    if (filters.date) {
      const day = new Date(filters.date);
      day.setHours(0, 0, 0, 0);
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      query = query
        .gte("start", dayStart.toISOString())
        .lte("start", dayEnd.toISOString());
    }
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.patient) query = query.eq("patient", filters.patient);
    if (filters.status) query = query.eq("status", filters.status);
    const { data } = await query;
    setAppointments(data as FullAppointment[]);
    setLoading(false);
  }, [filters.category, filters.patient, filters.date, filters.status]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, currentDate]);

  useEffect(() => {
    // Fetch all patients and relatives for assignee name mapping
    (async () => {
      const { data: pats } = await supabase.from("patients").select("*");
      const { data: rels } = await supabase.from("relatives").select("*");
      setPatients(pats || []);
      setRelatives(rels || []);
    })();
  }, []);

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
      // Log Supabase env using environment variables (not protected properties)
      console.log(
        "[DEBUG] SUPABASE_URL:",
        process.env.NEXT_PUBLIC_SUPABASE_URL
      );

      console.log(
        "[DEBUG] SUPABASE_ANON_KEY:",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      // List all buckets
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        console.error("[DEBUG] Error listing buckets:", error);
      } else {
        console.log("[DEBUG] Supabase buckets:", buckets);
      }
    })();
  }, []);

  // Group appointments by date (descending)
  const grouped = groupAppointmentsByDate(appointments);

  return loading ? (
    <AppointmentListSkeleton />
  ) : (
    <div className="p-6 sm:p-8 space-y-6 bg-[#f5f5f6] min-h-[calc(100vh-80px)]">
      {/* <ListCalendarHeader /> */}
      <h2 className="text-2xl font-semibold tracking-tight text-gray-800 mb-2">
        Terminliste
      </h2>
      <Filters onChange={setFilters} />

      {isEmpty && (
        <div className="text-center text-gray-500 mt-8 text-sm">
          ❌ Keine Termine gefunden für die ausgewählten Filter.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {grouped.map(({ date, appts }) => (
          <div key={date.toISOString()}>
            <DateHeadline date={date} />
            <div className="flex flex-col gap-4">
              {appts.map((appt, i) => {
                // DEBUG: Log patient info for this appointment
                console.log(
                  "[DEBUG] appt.id:",
                  appt.id,
                  "appt.patient:",
                  appt.patient,
                  "appt.patient_data:",
                  appt.patient_data,
                  "patients:",
                  patients
                );
                const start = new Date(appt.start);
                const now = new Date();
                const isToday =
                  start.getFullYear() === now.getFullYear() &&
                  start.getMonth() === now.getMonth() &&
                  start.getDate() === now.getDate();
                const color =
                  appt.category_data?.color || randomBgColor(appt.id);
                const isDone = appt.status === "done";
                const categoryIcon = appt.category_data?.icon ? (
                  <span className="inline-flex items-center mr-1">
                    <MdCategory className="w-4 h-4 text-gray-400" />
                  </span>
                ) : null;

                return (
                  <div
                    key={appt.id}
                    data-today={isToday ? "true" : undefined}
                    ref={isToday && i === 0 ? scrollRef : null}
                    className={`relative border rounded-xl shadow bg-white p-0 flex items-stretch transition hover:shadow-lg min-h-[110px]`}
                  >
                    {/* Color bar */}
                    <div
                      className="w-2 rounded-l-xl h-full absolute left-0 top-0 bottom-0"
                      style={{ backgroundColor: color }}
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
                            {format(start, "HH:mm")} –{" "}
                            {format(new Date(appt.end), "HH:mm")}
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
                            ? `${(appt.patient as Patient).firstname} ${
                                (appt.patient as Patient).lastname
                              }`
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
                      {/* <div className="flex items-center gap-2 text-xs text-gray-400 italic mb-1">
                        <FiUser /> Klient:{" "}
                        <span className="not-italic text-gray-700">
                          {appt.patient && patients.length > 0
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
                      </div> */}
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
                      {/* Assignees with icon */}
                      {appt.appointment_assignee &&
                        appt.appointment_assignee.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <FiUsers className="w-4 h-4" />
                            <span>Zugewiesen:</span>
                            {appt.appointment_assignee.map((assignee, idx) => {
                              let name = assignee.user;
                              if (assignee.user_type === "patients") {
                                const p = patients.find(
                                  (x) => x.id === assignee.user
                                );
                                if (p)
                                  name = `Patient: ${p.firstname} ${p.lastname}`;
                              } else if (assignee.user_type === "relatives") {
                                const r = relatives.find(
                                  (x) => x.id === assignee.user
                                );
                                if (r)
                                  name = `Angehörige: ${r.firstname} ${r.lastname}`;
                              }
                              return (
                                <span
                                  key={idx}
                                  className="not-italic text-purple-700"
                                >
                                  {name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      {/* Activities */}
                      {appt.activities && appt.activities.length > 0 && (
                        <div className="flex flex-col gap-1 text-xs text-gray-400 mt-1">
                          <span>Aktivitäten:</span>
                          {appt.activities.map((act, idx) => (
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
                          className="mb-1 accent-green-600 w-5 h-5"
                          checked={isDone}
                          onChange={() =>
                            toggleStatus(appt.id, isDone ? "pending" : "done")
                          }
                        />
                        <span className="text-xs text-gray-500 select-none">
                          {isDone ? "Erledigt" : "Offen"}
                        </span>
                      </label>
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full border-gray-300"
                        onClick={() => handleEdit(appt)}
                        aria-label="Bearbeiten"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => deleteAppt(appt.id)}
                        aria-label="Löschen"
                      >
                        <FiTrash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* Edit dialog */}
      {editAppt ? (
        <AppointmentDialog
          appointment={editAppt}
          onSuccess={handleEditSuccess}
          trigger={undefined}
          isOpen={editOpen}
          onOpenChange={handleEditDialogChange}
        />
      ) : null}
    </div>
  );
}
