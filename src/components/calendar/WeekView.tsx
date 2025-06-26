"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, addDays, setHours, setMinutes } from "date-fns";
import clsx from "clsx";
import { Appointment, Category } from "@/types/types";
import { supabase } from "@/lib/supabaseClient";
import AppointmentDialog from "./AppointmentDialog";
import { useDateContext } from "@/context/DateContext";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
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
import type {
  Patient,
  Relative,
  AppointmentAssignee,
  Activity,
} from "@/types/types";

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

type AppointmentWithCategory = Appointment & {
  category_data?: Category;
};

export default function WeekView() {
  const [appointments, setAppointments] = useState<AppointmentWithCategory[]>(
    []
  );
  const { currentDate } = useDateContext();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [editAppt, setEditAppt] = useState<AppointmentWithCategory | null>(
    null
  );
  const [editOpen, setEditOpen] = useState(false);

  // Add state for patients, relatives, assignees, activities
  const [patients, setPatients] = useState<Patient[]>([]);
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [assignees, setAssignees] = useState<AppointmentAssignee[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

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
  }, []);

  useEffect(() => {
    supabase
      .from("appointments")
      .select("*, category:category(*)")
      .then(
        ({ data }) => data && setAppointments(data as AppointmentWithCategory[])
      );
  }, [currentDate]);

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
          {/* --- Red current time line (if today in week) --- */}
          {isTodayInWeek() && (
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
                    left: -48,
                    top: -10,
                    color: "#ef4444",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "#fff",
                    padding: "0 4px",
                    borderRadius: 4,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  {format(now, "HH:mm")}
                </span>
              </div>
            </div>
          )}
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
            const isToday = day.toDateString() === currentDate.toDateString();
            return (
              <div
                key={i}
                className={
                  "border-r border-b p-2 text-center font-medium text-gray-600 bg-gray-50" +
                  (isToday ? " bg-green-50" : "")
                }
                style={{
                  width: dayWidth,
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                  background: isToday ? "#e6f9ed" : "#f9fafb",
                }}
              >
                {format(day, "EEE dd.MM.")}
                {isToday && (
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
              >{`${hour}:00`}</div>
              {Array.from({ length: 7 }).map((_, i) => {
                const day = addDays(weekStart, i);
                const isTodayCol =
                  day.toDateString() === currentDate.toDateString();
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
                    {matches.map((a) => {
                      const color =
                        a.category_data?.color || randomBgColor(a.id);
                      const isDone = a.status === "done";
                      const start = new Date(a.start);
                      const end = new Date(a.end);
                      const hourStart =
                        start.getHours() + start.getMinutes() / 60;
                      const hourEnd = end.getHours() + end.getMinutes() / 60;
                      const slotHour = hour;
                      const slotTop = Math.max(
                        0,
                        (hourStart - slotHour) * hourHeight
                      );
                      const minCardHeight = 180;
                      const slotHeight = Math.max(
                        minCardHeight,
                        (hourEnd - hourStart) * hourHeight
                      );
                      if (Math.floor(hourStart) !== slotHour) return null;
                      const cardBg = lightenColor(color, 70);
                      // Helper to trim text
                      const trimText = (text: string, max: number) =>
                        text && text.length > max
                          ? text.slice(0, max) + "..."
                          : text;
                      return (
                        <HoverCard key={a.id}>
                          <HoverCardTrigger asChild>
                            <div
                              className={clsx(
                                "absolute left-1 right-1 rounded-xl shadow flex flex-col group transition hover:shadow-lg border overflow-hidden items-start text-left",
                                isDone && "opacity-60"
                              )}
                              style={{
                                zIndex: 2,
                                top: slotTop,
                                height: slotHeight,
                                minHeight: minCardHeight,
                                background: cardBg,
                                borderColor: color,
                              }}
                            >
                              {/* Color bar spans full card height */}
                              <div
                                className="w-2 rounded-l-xl h-full absolute left-0 top-0 bottom-0"
                                style={{ backgroundColor: color }}
                              />
                              {/* Main content: title, tag, date, time, notes */}
                              <div className="pl-6 pr-2 py-3 flex-1 flex flex-col justify-start items-start text-left w-full">
                                {/* Title and tag on separate rows */}
                                <div className="flex flex-col gap-1 mb-1 w-full">
                                  <span
                                    className={clsx(
                                      "text-base font-semibold text-gray-700 truncate",
                                      isDone && "line-through text-gray-400"
                                    )}
                                  >
                                    {trimText(a.title, 18)}
                                  </span>
                                  {getDateTag(start)}
                                </div>

                                {/* Date row */}
                                {/* <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 w-full">
                                  <FiFileText className="inline-block align-middle text-gray-400" />
                                  <span
                                    className={
                                      isDone
                                        ? "line-through text-gray-400"
                                        : undefined
                                    }
                                  >
                                    {format(start, "dd.MM.yyyy")}
                                  </span>
                                </div> */}
                                {/* Time row */}
                                {/* <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 w-full">
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
                                      isDone
                                        ? "line-through text-gray-400"
                                        : undefined
                                    }
                                  >
                                    {format(start, "HH:mm")} –{" "}
                                    {format(end, "HH:mm")}
                                  </span>
                                </div> */}

                                {/* Date and Time with icon */}
                                <div className="flex flex-col gap-1 text-sm text-gray-500 mb-1">
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
                                        isDone
                                          ? "line-through text-gray-400"
                                          : undefined
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
                                        isDone
                                          ? "line-through text-gray-400"
                                          : undefined
                                      }
                                    >
                                      {format(start, "HH:mm")} –{" "}
                                      {format(new Date(a.end), "HH:mm")}
                                    </span>
                                  </span>
                                </div>

                                {/* Notes row (if present) */}
                                {a.notes && (
                                  <div className="flex items-center gap-2 text-xs text-gray-700 mb-1 w-full">
                                    <svg
                                      width="16"
                                      height="16"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      className="inline-block align-middle text-gray-400"
                                    >
                                      <path
                                        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19M17 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                    {trimText(a.notes, 30)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="relative text-sm min-w-[340px] bg-white rounded-xl shadow-lg p-4">
                            <div
                              className="absolute left-2 top-2 bottom-2 w-1 rounded"
                              style={{ backgroundColor: color }}
                            />
                            <div className="pl-6">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl font-semibold text-gray-800 flex items-center">
                                  {a.title}
                                  {getDateTag(new Date(a.start))}
                                </span>
                              </div>
                              {/* <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-1">
                                <span className="flex items-center gap-1">
                                  <FiFileText />
                                  {format(new Date(a.start), "dd.MM.yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FiFlag />
                                  {format(new Date(a.start), "HH:mm")} –{" "}
                                  {format(new Date(a.end), "HH:mm")}
                                </span>
                              </div> */}
                              <div className="flex flex-col gap-1 text-sm text-gray-500 mb-1">
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
                                      isDone
                                        ? "line-through text-gray-400"
                                        : undefined
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
                                      isDone
                                        ? "line-through text-gray-400"
                                        : undefined
                                    }
                                  >
                                    {format(start, "HH:mm")} –{" "}
                                    {format(new Date(a.end), "HH:mm")}
                                  </span>
                                </span>
                              </div>
                              {a.notes && (
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                  <FiFileText />
                                  <span className="text-xs text-gray-700">
                                    {a.notes}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-400 italic mb-1">
                                <FiUser /> Klient:{" "}
                                <span className="not-italic text-gray-700">
                                  {a.patient && patients.length > 0
                                    ? (() => {
                                        const p = patients.find(
                                          (x) => x.id === a.patient
                                        );
                                        return p
                                          ? `${p.firstname} ${p.lastname}`
                                          : "--";
                                      })()
                                    : "--"}
                                </span>
                              </div>
                              {a.location && (
                                <div className="flex items-center gap-2 text-xs text-gray-400 italic mb-1">
                                  <FiMapPin /> Ort:{" "}
                                  <span className="not-italic text-gray-700">
                                    {a.location}
                                  </span>
                                </div>
                              )}
                              {a.attachements && a.attachements.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                  <FiPaperclip /> Anhänge:
                                  {a.attachements.map((file, idx) => {
                                    const { data } = supabase.storage
                                      .from("attachments")
                                      .getPublicUrl(file);
                                    const fileName =
                                      file.split("/").pop() || file;
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
                              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                <FiFlag /> Status:{" "}
                                <span className="not-italic text-gray-700">
                                  {a.status}
                                </span>
                              </div>
                              {assignees.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                  <FiUsers /> Zugewiesen:
                                  {assignees
                                    .filter((ass) => ass.appointment === a.id)
                                    .map((ass, idx) => {
                                      let name = ass.user;
                                      if (ass.user_type === "patients") {
                                        const p = patients.find(
                                          (x) => x.id === ass.user
                                        );
                                        if (p)
                                          name = `Patient: ${p.firstname} ${p.lastname}`;
                                      } else if (
                                        ass.user_type === "relatives"
                                      ) {
                                        const r = relatives.find(
                                          (x) => x.id === ass.user
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
                              {activities.length > 0 && (
                                <div className="flex flex-col gap-1 text-xs text-gray-400 mb-1">
                                  <span>Aktivitäten:</span>
                                  {activities
                                    .filter((act) => act.appointment === a.id)
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
                              <div className="flex items-center gap-3 mt-2">
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    className="accent-green-600 w-5 h-5"
                                    checked={isDone}
                                    onChange={() =>
                                      toggleStatus(
                                        a.id,
                                        isDone ? "pending" : "done"
                                      )
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
                                  onClick={() => setEditAppt(a)}
                                  aria-label="Bearbeiten"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="rounded-full"
                                  onClick={() => deleteAppt(a.id)}
                                  aria-label="Löschen"
                                >
                                  <FiTrash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
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
        <AppointmentDialog
          appointment={editAppt}
          onSuccess={() => {
            setEditAppt(null);
            // refetch appointments
            supabase
              .from("appointments")
              .select("*, category:category(*)")
              .then(
                ({ data }) =>
                  data && setAppointments(data as AppointmentWithCategory[])
              );
          }}
          trigger={null}
          isOpen={editOpen}
          onOpenChange={handleEditDialogChange}
        />
      )}
    </div>
  );
}
