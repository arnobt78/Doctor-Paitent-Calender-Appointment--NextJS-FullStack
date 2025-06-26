"use client";

import { useEffect, useState, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from "date-fns";
import clsx from "clsx";
import {
  Appointment,
  Category,
  Patient,
  Relative,
  AppointmentAssignee,
  Activity,
} from "@/types/types";
import { supabase } from "@/lib/supabaseClient";
import { useDateContext } from "@/context/DateContext";
import AppointmentDialog from "./AppointmentDialog";
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
import { MdCategory } from "react-icons/md";
import { de } from "date-fns/locale";

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

export default function MonthView() {
  const [calendarDays, setCalendarDays] = useState<
    { date: Date; appointments: AppointmentWithCategory[] }[]
  >([]);
  const { currentDate } = useDateContext();
  const [editAppt, setEditAppt] = useState<AppointmentWithCategory | null>(
    null
  );
  const [patients, setPatients] = useState<Patient[]>([]);
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [assignees, setAssignees] = useState<AppointmentAssignee[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const buildCalendar = useCallback(
    (list: AppointmentWithCategory[]) => {
      const start = startOfWeek(startOfMonth(currentDate), {
        weekStartsOn: 1,
      });
      const end = endOfWeek(endOfMonth(currentDate), {
        weekStartsOn: 1,
      });
      const days: { date: Date; appointments: AppointmentWithCategory[] }[] =
        [];
      for (let d = start; d <= end; d = addDays(d, 1)) {
        days.push({
          date: new Date(d),
          appointments: list.filter((a) => isSameDay(new Date(a.start), d)),
        });
      }
      setCalendarDays(days);
    },
    [currentDate]
  );

  useEffect(() => {
    supabase
      .from("appointments")
      .select("*, category:category(*)")
      .then(
        ({ data }) => data && buildCalendar(data as AppointmentWithCategory[])
      );
  }, [currentDate, buildCalendar]);

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

  const toggleStatus = async (id: string, newStatus: string) => {
    await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);
    setCalendarDays((prev) =>
      prev.map((d) => ({
        ...d,
        appointments: d.appointments.map((a) =>
          a.id === id ? { ...a, status: newStatus as typeof a.status } : a
        ),
      }))
    );
  };

  const deleteAppt = async (id: string) => {
    if (!confirm("Termin wirklich löschen?")) return;
    await supabase.from("appointments").delete().eq("id", id);
    setCalendarDays((prev) =>
      prev.map((d) => ({
        ...d,
        appointments: d.appointments.filter((a) => a.id !== id),
      }))
    );
  };

  // Helper: sort appointments by start time ascending
  const sortByTime = (appts: AppointmentWithCategory[]) =>
    [...appts].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

  // Helper: is today
  const isToday = (date: Date) => {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  // Helper for Heute/Demnächst/Einen Tag später/Datum überschritten tag
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

  return (
    <div className="flex flex-col md:flex-row p-6 sm:p-8 space-y-4 md:space-y-0 md:space-x-8 bg-[#f5f5f6] min-h-[calc(100vh-80px)]">
      <div className="flex-1">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-800 mb-2">
          Monatsansicht
        </h2>
        <div className="grid grid-cols-7 gap-px bg-gray-200 text-sm">
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
            <div
              key={d}
              className="bg-white p-2 font-medium text-gray-600 text-center border-b border-gray-200"
            >
              {d}
            </div>
          ))}
          {calendarDays.map(({ date, appointments }) => {
            const selected = selectedDate && isSameDay(date, selectedDate);
            const isCurrent = isToday(date);
            const hasAppointments = appointments.length > 0;
            return (
              <div
                key={date.toISOString()}
                className={clsx(
                  "min-h-[100px] p-2 border border-gray-200 bg-white relative group transition",
                  !isSameMonth(date, currentDate) &&
                    "bg-gray-100 text-gray-400",
                  isCurrent && !selected && "bg-green-50",
                  selected && "bg-gray-100 border-green-600 z-10",
                  hasAppointments ? "cursor-pointer" : "cursor-default"
                )}
                onClick={() => hasAppointments && setSelectedDate(date)}
              >
                <div className="flex items-center mb-1">
                  <span
                    className={clsx(
                      "text-xs font-semibold text-gray-700 w-6 h-6 flex items-center justify-center rounded",
                      selected && "bg-green-700 text-white",
                      !selected && isCurrent && "bg-green-200 text-green-900"
                    )}
                  >
                    {format(date, "d")}
                  </span>
                </div>
                <div className="space-y-1">
                  {appointments.map((a) => {
                    const color = a.category_data?.color || randomBgColor(a.id);
                    const isDone = a.status === "done";
                    return (
                      <HoverCard key={a.id}>
                        <HoverCardTrigger asChild>
                          <div
                            className={clsx(
                              "flex items-center w-full h-7 rounded-md font-medium truncate cursor-pointer shadow-sm transition hover:brightness-110 border border-gray-200 bg-white",
                              { "line-through opacity-60": isDone }
                            )}
                            style={{ minHeight: 28 }}
                          >
                            <span
                              className="block w-1.5 h-5 rounded-l-md mr-2"
                              style={{ backgroundColor: color }}
                            />
                            <span className="truncate text-xs text-gray-800 text-left">
                              {a.title}
                            </span>
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
                                  {format(new Date(a.start), "dd.MM.yyyy")}
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
                                  {format(new Date(a.start), "HH:mm")} –{" "}
                                  {format(new Date(a.end), "HH:mm")}
                                </span>
                              </span>
                            </div>
                            {a.notes && (
                              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                <FiFileText />{" "}
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
                                    } else if (ass.user_type === "relatives") {
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
              </div>
            );
          })}
        </div>
      </div>
      {/* Side list for selected date */}
      {selectedDate && (
        <div className="w-full md:w-[540px] bg-white rounded-xl shadow-lg p-4 mt-4 md:mt-0 md:ml-4 h-fit sticky top-24">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-green-700 text-white rounded px-2 py-1 text-lg font-bold">
              {format(selectedDate, "d")}
            </span>
            <span className="text-lg font-semibold text-gray-800">
              {format(selectedDate, "EEEE, dd. MMMM", { locale: de })}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto bg-gray-200 hover:bg-gray-300 transition cursor-pointer"
              onClick={() => setSelectedDate(null)}
            >
              Schließen
            </Button>
          </div>
          <div className="space-y-4">
            {sortByTime(
              calendarDays.find((d) => isSameDay(d.date, selectedDate))
                ?.appointments || []
            ).map((a) => {
              const color = a.category_data?.color || randomBgColor(a.id);
              const isDone = a.status === "done";
              return (
                <div
                  key={a.id}
                  className={clsx(
                    "relative border rounded-xl shadow bg-white p-0 flex items-stretch transition hover:shadow-lg min-h-[110px]",
                    isDone && "bg-gray-100 opacity-60"
                  )}
                >
                  {/* Color bar */}
                  <div
                    className="w-2 rounded-l-xl h-full absolute left-0 top-0 bottom-0"
                    style={{ backgroundColor: color }}
                  />
                  {/* Main content */}
                  <div className="pl-6 pr-2 py-4 flex-1 flex flex-col justify-center min-h-[110px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-semibold text-gray-800 flex items-center">
                        {a.title}
                        {getDateTag(new Date(a.start))}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-1">
                      <span className="flex items-center gap-1">
                        <FiFileText />
                        {format(new Date(a.start), "dd.MM.yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiFlag />
                        {format(new Date(a.start), "HH:mm")} –{" "}
                        {format(new Date(a.end), "HH:mm")}
                      </span>
                    </div>
                    {a.notes && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                        <FiFileText /> {a.notes}
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
                              return p ? `${p.firstname} ${p.lastname}` : "--";
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
                              const p = patients.find((x) => x.id === ass.user);
                              if (p)
                                name = `Patient: ${p.firstname} ${p.lastname}`;
                            } else if (ass.user_type === "relatives") {
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
                  </div>
                  {/* Actions column */}
                  <div className="flex flex-col items-center gap-3 min-w-[56px] py-4 px-2 justify-center">
                    <label className="flex flex-col items-center gap-1">
                      <input
                        type="checkbox"
                        className="mb-1 accent-green-600 w-5 h-5 cursor-pointer"
                        checked={isDone}
                        onChange={() =>
                          toggleStatus(a.id, isDone ? "pending" : "done")
                        }
                      />
                      <span className="text-xs text-gray-500 select-none">
                        {isDone ? "Erledigt" : "Offen"}
                      </span>
                    </label>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full border-gray-300 cursor-pointer"
                      onClick={() => setEditAppt(a)}
                      aria-label="Bearbeiten"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full cursor-pointer"
                      onClick={() => deleteAppt(a.id)}
                      aria-label="Löschen"
                    >
                      <FiTrash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {(calendarDays.find((d) => isSameDay(d.date, selectedDate))
              ?.appointments.length || 0) === 0 && (
              <div className="text-gray-400 text-center">Keine Termine</div>
            )}
          </div>
        </div>
      )}
      {/* Edit dialog */}
      {editAppt && (
        <AppointmentDialog
          appointment={editAppt}
          onSuccess={() => {
            setEditAppt(null);
            supabase
              .from("appointments")
              .select("*, category:category(*)")
              .then(
                ({ data }) =>
                  data && buildCalendar(data as AppointmentWithCategory[])
              );
          }}
          trigger={null}
        />
      )}
    </div>
  );
}
