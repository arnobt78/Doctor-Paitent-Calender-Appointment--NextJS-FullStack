import React from "react";
import clsx from "clsx";
import { format } from "date-fns";
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
  Appointment,
  Category,
  Patient,
  Relative,
  AppointmentAssignee,
  Activity,
} from "@/types/types";
import { useAppointmentColor } from "@/context/AppointmentColorContext";



export interface AppointmentHoverCardProps {
  appointment: Appointment & { category_data?: Category; appointment_assignee?: AppointmentAssignee[] };
  patients: Patient[];
  relatives: Relative[];
  assignees: AppointmentAssignee[];
  activities: Activity[];
  userEmail: string | null;
  userId: string | null;
  ownerUsers: { id: string, email: string }[]; // Add owner users data
  getDateTag: (date: Date) => React.ReactNode;
  onEdit: (appt: Appointment & { category_data?: Category; appointment_assignee?: AppointmentAssignee[] }) => void;
  supabase: unknown; // Supabase client instance
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: string) => void;
  showDetails?: boolean; // default false
}

export function dedupeAssignees(
  assignees: AppointmentAssignee[],
  appointmentId: string
): AppointmentAssignee[] {
  const filteredAssignees = assignees.filter((ass) => ass.appointment === appointmentId);
  const dedupedMap = new Map<string, AppointmentAssignee>();
  for (const ass of filteredAssignees) {
    const key = `${ass.user || ''}|${ass.invited_email || ''}`;
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, ass);
    } else {
      // Prefer accepted over pending, prefer higher permission
      const prev = dedupedMap.get(key)!;
      const statusOrder: Record<string, number> = { accepted: 2, pending: 1, declined: 0 };
      const permOrder: Record<string, number> = { full: 3, write: 2, read: 1 };
      const prevStatus = typeof prev.status === 'string' && statusOrder[prev.status] !== undefined ? statusOrder[prev.status] : 0;
      const currStatus = typeof ass.status === 'string' && statusOrder[ass.status] !== undefined ? statusOrder[ass.status] : 0;
      const prevPerm = typeof prev.permission === 'string' && permOrder[prev.permission] !== undefined ? permOrder[prev.permission] : 0;
      const currPerm = typeof ass.permission === 'string' && permOrder[ass.permission] !== undefined ? permOrder[ass.permission] : 0;
      if (
        currStatus > prevStatus ||
        (currStatus === prevStatus && currPerm > prevPerm)
      ) {
        dedupedMap.set(key, ass);
      }
    }
  }
  return Array.from(dedupedMap.values());
}

const AppointmentHoverCard: React.FC<AppointmentHoverCardProps> = ({
  appointment: a,
  patients,
  relatives,
  assignees,
  activities,
  userEmail,
  userId,
  ownerUsers,
  getDateTag,
  onEdit,
  onDelete,
  onToggleStatus,
  supabase,
  showDetails = false,
}) => {
  const { randomBgColor } = useAppointmentColor();
  const color = randomBgColor(a.id);
  const isDone = a.status === "done";
  const dedupedAssignees = dedupeAssignees(assignees, a.id);

  return (
    <HoverCard key={a.id}>
      <HoverCardTrigger asChild>
        {showDetails ? (
          // WeekView: Rich details card
          <div className={clsx(
            "flex flex-col w-full h-full rounded-md font-medium cursor-pointer shadow-sm transition hover:brightness-110 border border-gray-200 bg-white",
            { "line-through opacity-60": isDone }
          )}
            style={{ padding: "4px 4px" }}
          >
            <span className="block w-1.5 h-full rounded-l-md absolute left-0 top-0 bottom-0" style={{ backgroundColor: color }} />
            <div style={{ marginLeft: 8, position: "relative", zIndex: 1 }}>

              <div>
                <div className="flex flex-col w-full">
                  <span
                    className={clsx(
                      "text-base font-semibold text-gray-600 truncate mb-1",
                      isDone && "line-through text-gray-400"
                    )}
                  >
                    {a.title.length > 18 ? a.title.slice(0, 18) + "..." : a.title}
                    {getDateTag(new Date(a.start))}
                  </span>
                </div>
                <div className="flex flex-col text-xs text-gray-500">
                  <span className="flex items-center gap-1 mb-1">
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
                    <span className={isDone ? "line-through text-gray-400" : undefined}>
                      {format(new Date(a.start), "dd.MM.yyyy")}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 mb-1">
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
                    <span className={isDone ? "line-through text-gray-400" : undefined}>
                      {format(new Date(a.start), "HH:mm")} – {format(new Date(a.end), "HH:mm")}
                    </span>
                  </span>
                </div>
                {a.notes && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1 w-full">
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
                    {a.notes.length > 30 ? a.notes.slice(0, 30) + "..." : a.notes}
                  </div>
                )}
                {a.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 w-full">
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="inline-block align-middle text-gray-400"
                    >
                      <path
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {a.location}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // MonthView: Simple card
          <div
            className={clsx(
              "flex items-center w-full rounded-md font-medium cursor-pointer shadow-sm transition hover:brightness-110 border border-gray-200 bg-white",
              { "line-through opacity-60": isDone }
            )}
            style={{ minHeight: 24 }}
          >
            <span className="block w-1.5 h-6 rounded-l-md mr-2" style={{ backgroundColor: color }} />
            <span className="truncate text-xs text-gray-700 text-left">
              {a.title}
            </span>
          </div>
        )}
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

          {/* Appointment details */}
          <div className="flex flex-col gap-1 text-sm text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="inline-block align-middle text-gray-400">
                <path d="M8 7V3M16 7V3M3 11H21M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={isDone ? "line-through text-gray-400" : undefined}>
                {format(new Date(a.start), "dd.MM.yyyy")}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="inline-block align-middle text-gray-400">
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className={isDone ? "line-through text-gray-400" : undefined}>
                {format(new Date(a.start), "HH:mm")} – {format(new Date(a.end), "HH:mm")}
              </span>
            </span>
          </div>

          {a.notes && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <span className="flex-shrink-0 flex items-center justify-center">
                <FiFileText className="w-4 h-4" />
              </span>
              <span className="text-xs text-gray-700 break-words">{a.notes}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-400 italic mb-1">
            <FiUser /> Klient:{" "}
            <span className="not-italic text-gray-700">
              {a.patient && patients.length > 0
                ? (() => {
                  const p = patients.find((x) => x.id === a.patient);
                  return p ? `${p.firstname} ${p.lastname}` : "--";
                })()
                : "--"}
            </span>
          </div>

          {a.location && (
            <div className="flex items-center gap-2 text-xs text-gray-400 italic mb-1">
              <FiMapPin /> Ort:{" "}
              <span className="not-italic text-gray-700">{a.location}</span>
            </div>
          )}

          {a.attachements && a.attachements.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <FiPaperclip /> Anhänge:
              {a.attachements.map((file, idx) => {
                // @ts-expect-error: supabase type is unknown, but storage API is available
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
            <span className="not-italic text-gray-700">{a.status}</span>
          </div>

          {/* Refer to: patient name from appointment.patient field */}
          {a.patient && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <FiUsers /> Refer to:
              {(() => {
                try {
                  // Debug: Log the patient data
                  console.log('DEBUG - HoverCard Patient data:', {
                    patient: a.patient,
                    patientType: typeof a.patient,
                    isObject: typeof a.patient === 'object',
                    hasFirstname: a.patient && typeof a.patient === 'object' && 'firstname' in a.patient,
                    hasLastname: a.patient && typeof a.patient === 'object' && 'lastname' in a.patient
                  });

                  // If patient is already an object with firstname/lastname
                  if (a.patient &&
                    typeof a.patient === 'object' &&
                    'firstname' in a.patient &&
                    'lastname' in a.patient) {
                    const patientObj = a.patient as Patient;
                    return (
                      <span className="not-italic text-purple-700">
                        Patient: {patientObj.firstname} {patientObj.lastname}
                      </span>
                    );
                  }

                  // If patient is a string ID and patients are loaded
                  if (typeof a.patient === 'string' && patients.length > 0) {
                    const patient = patients.find((p) => p.id === a.patient);
                    if (patient && patient.firstname && patient.lastname) {
                      return (
                        <span className="not-italic text-purple-700">
                          Patient: {patient.firstname} {patient.lastname}
                        </span>
                      );
                    }
                  }

                  // Fallback
                  return (
                    <span className="not-italic text-red-700">
                      Patient data not available
                    </span>
                  );
                } catch (error) {
                  console.error('Error in HoverCard patient lookup:', error);
                  return (
                    <span className="not-italic text-red-700">
                      Error loading patient
                    </span>
                  );
                }
              })()}
            </div>
          )}

          {/* Assigned by: invited_email, user id, or owner */}
          {/* {dedupedAssignees.length > 0 && (
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
                    } else if (ass.user === a.user_id) {
                      // Owner
                      return (
                        <span key={ass.id || idx} className="not-italic text-green-700">
                          you ({userEmail || "owner"})
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
              
              {dedupedAssignees.every(ass => ass.user !== a.user_id) && a.user_id && (
                <span key={a.user_id} className="not-italic text-green-700">
                  you ({userEmail || "owner"})
                </span>
              )}
            </div>
          )} */}
          {dedupedAssignees.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <FiUsers /> Assigned by:
              {a.user_id === userId ? (
                // Owner view
                <span className="not-italic text-green-700">
                  you ({userEmail || "owner"})
                </span>
              ) : (
                // Invitee view: show owner's email
                <span className="not-italic text-blue-700">
                  {(() => {
                    // Find owner's email from ownerUsers
                    const owner = ownerUsers.find(u => u.id === a.user_id);
                    return owner?.email || a.user_id;
                  })()}
                </span>
              )}
            </div>
          )}

          {activities.length > 0 && (
            <div className="flex flex-col gap-1 text-xs text-gray-400 mb-1">
              <span>Aktivitäten:</span>
              {activities
                .filter((act) => act.appointment === a.id)
                .map((act, idx) => (
                  <span key={idx} className="not-italic text-pink-700">
                    {act.type}: {act.content}
                  </span>
                ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            {/* Status checkbox - only show if user is owner, full, or write permission */}
            {(() => {
              // Check if user is the owner
              const isOwner = a.user_id === userId;

              // Get user permission from assignees if not owner
              let userPermission: "full" | "write" | "read" | null = null;

              if (!isOwner && assignees && assignees.length > 0) {
                // Find the current user's assignment
                const userAssignment = assignees.find(
                  (ass) =>
                    (ass.user === userId || ass.invited_email === userId) &&
                    ass.appointment === a.id &&
                    ass.status === "accepted"
                );
                userPermission = userAssignment?.permission || null;

                // Debug logging
                console.log('DEBUG - HoverCard Permission Check:', {
                  appointmentId: a.id,
                  userId: userId,
                  userEmail: userEmail,
                  assignees: assignees,
                  userAssignment: userAssignment,
                  userPermission: userPermission,
                  isOwner: isOwner
                });
              }

              // Only owner, full, or write can toggle status
              if (isOwner || userPermission === "full" || userPermission === "write") {
                return (
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      className="accent-green-600 w-5 h-5"
                      checked={isDone}
                      onChange={() => onToggleStatus(a.id, isDone ? "pending" : "done")}
                    />
                    <span className="text-xs text-gray-500 select-none">
                      {isDone ? "Erledigt" : "Offen"}
                    </span>
                  </label>
                );
              }
              return null;
            })()}

            {/* Edit button - only show if user is owner or has full permission */}
            {(() => {
              // Check if user is the owner
              const isOwner = a.user_id === userId;

              // Get user permission from assignees if not owner
              let userPermission: "full" | "write" | "read" | null = null;

              if (!isOwner && assignees && assignees.length > 0) {
                // Find the current user's assignment
                const userAssignment = assignees.find(
                  (ass) =>
                    (ass.user === userId || ass.invited_email === userId) &&
                    ass.appointment === a.id &&
                    ass.status === "accepted"
                );
                userPermission = userAssignment?.permission || null;

                // Debug logging for edit button
                console.log('DEBUG - HoverCard Edit Permission:', {
                  appointmentId: a.id,
                  userId: userId,
                  userEmail: userEmail,
                  userPermission: userPermission,
                  canEdit: isOwner || userPermission === "full"
                });
              }

              // Only owner or full can edit
              if (isOwner || userPermission === "full") {
                return (
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full border-gray-300"
                    onClick={() => onEdit(a)}
                    aria-label="Bearbeiten"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </Button>
                );
              }
              return null;
            })()}

            {/* Delete button - only show if user is owner or has full permission */}
            {(() => {
              // Get user permission for this appointment
              let userPermission: "owner" | "full" | "write" | "read" | null = null;

              if (a.user_id === userId) {
                userPermission = "owner";
              } else if (assignees && assignees.length > 0) {
                // Find the current user's assignment
                const userAssignment = assignees.find(
                  (ass) =>
                    (ass.user === userId || ass.invited_email === userId) &&
                    ass.appointment === a.id &&
                    ass.status === "accepted"
                );
                userPermission = userAssignment?.permission || null;
              }

              // Only owner or full can delete
              if (userPermission === "owner" || userPermission === "full") {
                return (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => onDelete(a.id)}
                    aria-label="Löschen"
                  >
                    <FiTrash2 className="w-4 h-4 text-red-500" />
                  </Button>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default AppointmentHoverCard;
