"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const permissions = [
  { value: "read", label: "Read Only" },
  { value: "write", label: "Read-Write" },
  { value: "full", label: "Full Access (CRUD)" },
];

export default function AppointmentAccessPermission() {
  const [email, setEmail] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; title: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [permission, setPermission] = useState("read");
  const [status, setStatus] = useState<string | null>(null);


  // Autocomplete appointments
  async function handleSearch(q: string) {
    setSearch(q);
    setShowDropdown(true);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/appointments/search?query=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.appointments || []);
  }

  const handleSend = async () => {
    setStatus(null);
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "appointment",
        email,
        resourceId: appointmentId,
        permission,
      }),
    });
    const data = await res.json();
    if (res.ok) setStatus("Invitation sent!");
    else setStatus(data.error || "Error sending invitation");
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-bold mb-2">Appointment Access Invitation</h2>
      <label className="block font-medium">Invitee Email</label>
      <input
        className="w-full border rounded px-3 py-2 mb-2"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="user@email.com"
      />
      <label className="block font-medium">Appointment</label>
      <input
        className="w-full border rounded px-3 py-2 mb-2"
        type="text"
        value={search}
        onChange={e => handleSearch(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        placeholder="Search appointment by title or ID"
        autoComplete="off"
      />
      {showDropdown && results.length > 0 && (
        <ul className="border rounded bg-white shadow max-h-40 overflow-y-auto absolute z-10 w-[90%]">
          {results.map((a) => (
            <li
              key={a.id}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
              onClick={() => {
                setAppointmentId(a.id);
                setSearch(a.title || a.id);
                setShowDropdown(false);
              }}
            >
              {a.title} <span className="text-xs text-gray-500">({a.id})</span>
            </li>
          ))}
        </ul>
      )}
      {appointmentId && (
        <div className="text-xs text-gray-600 mb-2">Selected: {appointmentId}</div>
      )}
      <label className="block font-medium">Permission</label>
      <div className="flex gap-4 mb-2">
        {permissions.map(p => (
          <label key={p.value} className="flex items-center gap-1">
            <input
              type="radio"
              name="permission"
              value={p.value}
              checked={permission === p.value}
              onChange={() => setPermission(p.value)}
            />
            {p.label}
          </label>
        ))}
      </div>
      <Button onClick={handleSend}>Send Appointment Access Invitation</Button>
      {status && <div className="mt-2 text-sm text-blue-700">{status}</div>}
    </div>
  );
}
