"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Category,
  Patient,
  Appointment,
  AppointmentAssignee,
  Activity,
  Relative,
} from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Props = {
  trigger?: React.ReactNode;
  appointment?: Appointment;
  onSuccess?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function AppointmentDialog({
  trigger,
  appointment,
  onSuccess,
  isOpen,
  onOpenChange,
}: Props) {
  const isEditMode = Boolean(appointment);
  const supabase = createClientComponentClient();
  const [open, setOpen] = useState(isEditMode);

  // Sync open state with parent if controlled
  useEffect(() => {
    if (typeof isOpen === "boolean") setOpen(isOpen);
  }, [isOpen]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignees, setAssignees] = useState<AppointmentAssignee[]>([]); // type-safe
  const [activityType, setActivityType] = useState("");
  const [activityContent, setActivityContent] = useState("");
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const [relatives, setRelatives] = useState<Relative[]>([]);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [patientId, setPatientId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [attachements, setattachements] = useState(""); // comma-separated string
  const [status, setStatus] = useState("pending");
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: pats } = await supabase.from("patients").select("*");
      const { data: cats } = await supabase.from("categories").select("*");
      const { data: rels } = await supabase.from("relatives").select("*");
      setPatients(pats || []);
      setCategories(cats || []);
      setRelatives(rels || []);
    };

    load();
  }, [supabase]);

  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title || "");
      setNotes(appointment.notes || "");
      setStart(utcToLocalInputValue(appointment.start));
      setEnd(utcToLocalInputValue(appointment.end));
      setPatientId(appointment.patient || "");
      setCategoryId(appointment.category || "");
      setLocation(appointment.location || "");
      setattachements((appointment.attachements || []).join(", "));
      setStatus(appointment.status || "pending");
      setOpen(true);
      (async () => {
        if (appointment.id) {
          // Prefill assignees with all fields
          const { data: assigneesData } = await supabase
            .from("appointment_assignee")
            .select("id, created_at, appointment, user, user_type")
            .eq("appointment", appointment.id);
          setAssignees((assigneesData as AppointmentAssignee[]) || []);
          // Prefill activities with all fields
          const { data: acts } = await supabase
            .from("activities")
            .select("id, type, content, created_at, created_by, appointment")
            .eq("appointment", appointment.id);
          setActivityList((acts as Activity[]) || []);
        }
      })();
    } else {
      setAssignees([]);
      setActivityList([]);
    }
  }, [appointment, supabase]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (
        !isEditMode &&
        (!title || !start || !end || !patientId || !categoryId)
      ) {
        setError("Bitte alle Pflichtfelder ausfüllen.");
        setLoading(false);
        return;
      }
      const safeStart = localInputValueToUTC(start);
      const safeEnd = localInputValueToUTC(end);
      const attachementArray = attachements
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      let apptId = appointment?.id;
      if (isEditMode) {
        const updates: Partial<Appointment> = {};
        if (title !== appointment?.title) updates.title = title;
        if (notes !== appointment?.notes) updates.notes = notes;
        if (start !== utcToLocalInputValue(appointment?.start || ""))
          updates.start = safeStart;
        if (end !== utcToLocalInputValue(appointment?.end || ""))
          updates.end = safeEnd;
        if (patientId !== appointment?.patient) updates.patient = patientId;
        if (categoryId !== appointment?.category) updates.category = categoryId;
        if (location !== appointment?.location) updates.location = location;
        if (attachements !== (appointment?.attachements || []).join(", "))
          updates.attachements = attachementArray;
        if (status !== appointment?.status)
          updates.status = status as "pending" | "done" | "alert";
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("appointments")
            .update(updates)
            .eq("id", appointment!.id);
          if (error) throw new Error("Fehler beim Speichern");
        }
        // Remove old assignees/activities atomically
        await Promise.all([
          supabase
            .from("appointment_assignee")
            .delete()
            .eq("appointment", appointment!.id),
          supabase
            .from("activities")
            .delete()
            .eq("appointment", appointment!.id),
        ]);
      } else {
        // Insert new appointment and get ID, set user_id to current user
        const user_id = await getCurrentUserId();
        const { data, error } = await supabase
          .from("appointments")
          .insert([
            {
              title,
              notes,
              start: safeStart,
              end: safeEnd,
              patient: patientId,
              category: categoryId,
              location,
              attachements: attachementArray,
              status,
              user_id,
            },
          ])
          .select();
        if (error || !data || !data[0])
          throw new Error("Fehler beim Speichern");
        apptId = data[0].id;
      }
      // Save assignees (all fields)
      if (assignees.length > 0) {
        await supabase.from("appointment_assignee").insert(
          assignees.map((a) => ({
            appointment: apptId,
            user: a.user,
            user_type: a.user_type,
          }))
        );
      }
      // Save activities (all fields)
      if (activityList.length > 0) {
        await supabase.from("activities").insert(
          await Promise.all(
            activityList.map(async (act) => ({
              appointment: apptId,
              type: act.type,
              content: act.content,
              created_by: act.created_by || (await getCurrentUserId()),
            }))
          )
        );
      }
      setSuccess(true);
      setOpen(false);
      onSuccess?.();
      window.location.reload();
    } catch (e: unknown) {
      if (typeof e === "object" && e && "message" in e) {
        setError((e as { message: string }).message || "Unbekannter Fehler");
      } else {
        setError("Unbekannter Fehler");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setError(null);
    const files = Array.from(e.target.files);
    const uploadedFileNames: string[] = [];
    for (const file of files) {
      const filePath = `${Date.now()}_${file.name}`;
      setFileProgress((prev) => ({ ...prev, [file.name]: 0 }));
      const uploadPromise = supabase.storage
        .from("attachments")
        .upload(filePath, file);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setFileProgress((prev) => ({
          ...prev,
          [file.name]: Math.min(progress, 100),
        }));
      }, 100);
      const { error } = await uploadPromise;
      clearInterval(interval);
      setFileProgress((prev) => ({ ...prev, [file.name]: 100 }));
      if (error) {
        setError(`Fehler beim Hochladen: ${file.name}`);
        continue;
      }
      // Store only the file path, not the public URL
      uploadedFileNames.push(filePath);
    }
    setUploadedFiles((prev) => [...prev, ...uploadedFileNames]);
    setattachements((prev: string) =>
      prev
        ? prev + ", " + uploadedFileNames.join(", ")
        : uploadedFileNames.join(", ")
    );
    setUploading(false);
  };

  const handleRemoveUploadedFile = (url: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f !== url));
    setattachements((prev) =>
      prev
        .split(",")
        .map((s) => s.trim())
        .filter((f) => f && f !== url)
        .join(", ")
    );
    // Optionally: remove from Supabase storage (not just UI)
    // const path = url.split("/attachments/")[1];
    // if (path) supabase.storage.from("attachments").remove([`attachments/${path}`]);
  };

  // Helper: get current user (if available)
  const getCurrentUserId = async (): Promise<string> => {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id || "";
    } catch {
      return "";
    }
  };

  const handleAddAssignee = (userId: string) => {
    if (!userId) return;
    if (assignees.some((a) => a.user === userId)) return;
    const user_type = patients.find((p) => p.id === userId)
      ? "patients"
      : "relatives";
    setAssignees((prev) => [
      ...prev,
      {
        id: "temp-" + Date.now(),
        created_at: new Date().toISOString(),
        appointment: appointment?.id || "",
        user: userId,
        user_type,
      },
    ]);
  };
  const handleRemoveAssignee = (userId: string) => {
    setAssignees((prev) => prev.filter((a) => a.user !== userId));
  };
  const handleAddActivity = async () => {
    if (!activityType || !activityContent) return;
    // Prevent duplicate activities (same type/content)
    if (
      activityList.some(
        (a) => a.type === activityType && a.content === activityContent
      )
    )
      return;
    const created_by = await getCurrentUserId();
    setActivityList((prev) => [
      ...prev,
      {
        id: "temp-" + Date.now(),
        created_at: new Date().toISOString(),
        created_by,
        appointment: appointment?.id || "",
        type: activityType,
        content: activityContent,
      },
    ]);
    setActivityType("");
    setActivityContent("");
  };
  const handleRemoveActivity = (id: string) => {
    setActivityList((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange ? onOpenChange : setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg" aria-describedby="">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Termin bearbeiten" : "Neuen Termin erstellen"}
          </DialogTitle>
        </DialogHeader>
        {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
        {success && (
          <div className="text-green-600 text-xs mb-2">
            Erfolgreich gespeichert!
          </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start</Label>
              <Input
                type="datetime-local"
                id="start"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Ende</Label>
              <Input
                type="datetime-local"
                id="end"
                value={end}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  if (start && newEnd < start) {
                    setEnd(start);
                  } else {
                    setEnd(newEnd);
                  }
                }}
                min={start || undefined}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Klient</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger className="cursor-pointer hover:bg-gray-100 transition-colors">
                <SelectValue placeholder="Klient auswählen" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.firstname} {p.lastname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="cursor-pointer hover:bg-gray-100 transition-colors">
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ort</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachements">Anhänge (Kommagetrennt)</Label>
            <Input
              id="attachements"
              value={attachements}
              onChange={(e) => setattachements(e.target.value)}
              className="cursor-pointer"
            />
            <Input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
            {uploading && (
              <div className="text-xs text-blue-600">Hochladen...</div>
            )}
            {Object.keys(fileProgress).length > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                {Object.entries(fileProgress).map(([name, prog]) => (
                  <div key={name}>
                    {name}: {prog}%
                  </div>
                ))}
              </div>
            )}
            {uploadedFiles.length > 0 && (
              <div className="text-xs text-green-600 mt-1">
                Hochgeladen:{" "}
                {uploadedFiles.map((f) => (
                  <span key={f} className="inline-flex items-center mr-2">
                    <a
                      href={f}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline cursor-pointer hover:text-blue-700"
                    >
                      Datei
                    </a>
                    <button
                      type="button"
                      className="ml-1 text-red-500 cursor-pointer hover:bg-red-100 rounded"
                      onClick={() => handleRemoveUploadedFile(f)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="cursor-pointer hover:bg-gray-100 transition-colors">
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Offen</SelectItem>
                <SelectItem value="done">Erledigt</SelectItem>
                <SelectItem value="alert">Alarm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignees UI */}
          <div className="space-y-2">
            <Label>Zuweisen (Patienten/Angehörige)</Label>
            <Select onValueChange={handleAddAssignee}>
              <SelectTrigger className="cursor-pointer hover:bg-gray-100 transition-colors">
                <SelectValue placeholder="Person auswählen" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    Patient: {p.firstname} {p.lastname}
                  </SelectItem>
                ))}
                {relatives.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    Angehörige: {r.firstname} {r.lastname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-1">
              {assignees.map((a) => {
                const p = patients.find((x) => x.id === a.user);
                const r = relatives.find((x) => x.id === a.user);
                return (
                  <span
                    key={a.user}
                    className="bg-gray-200 px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    {p
                      ? `Patient: ${p.firstname} ${p.lastname}`
                      : r
                      ? `Angehörige: ${r.firstname} ${r.lastname}`
                      : a.user}
                    <span className="ml-1 text-gray-400">[{a.user_type}]</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignee(a.user)}
                      className="ml-1 text-red-500 cursor-pointer hover:bg-red-100 rounded"
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
          {/* Activities UI */}
          <div className="space-y-2">
            <Label>Aktivität hinzufügen</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Typ (z.B. Telefon, Besuch)"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="cursor-pointer"
              />
              <Input
                placeholder="Inhalt"
                value={activityContent}
                onChange={(e) => setActivityContent(e.target.value)}
                className="cursor-pointer"
              />
              <Button
                type="button"
                onClick={handleAddActivity}
                disabled={loading}
                className="cursor-pointer transition-colors"
              >
                Hinzufügen
              </Button>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              {activityList.map((a) => (
                <span
                  key={a.id}
                  className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center gap-1"
                >
                  {a.type}: {a.content}
                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(a.id)}
                    className="ml-1 text-red-500 cursor-pointer hover:bg-red-100 rounded"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading || uploading}
          className="cursor-pointer transition-colors"
        >
          {loading
            ? "Speichern..."
            : isEditMode
            ? "Änderungen speichern"
            : "Speichern"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Helper: Convert UTC ISO string to local datetime-local input value (YYYY-MM-DDTHH:mm)
function utcToLocalInputValue(utcString: string) {
  if (!utcString) return "";
  const date = new Date(utcString);
  // Get local time in YYYY-MM-DDTHH:mm
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}
// Helper: Convert local datetime-local input value to UTC ISO string
function localInputValueToUTC(localValue: string) {
  if (!localValue) return "";
  // localValue is YYYY-MM-DDTHH:mm
  const date = new Date(localValue);
  return date.toISOString();
}
