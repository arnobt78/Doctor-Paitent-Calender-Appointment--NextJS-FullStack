"use client";

import { Category, Patient } from "@/types/types";

type FiltersProps = {
  category: string | null;
  setCategory: (v: string | null) => void;
  patient: string | null;
  setPatient: (v: string | null) => void;
  date: string | null;
  setDate: (v: string | null) => void;
  status: string | null;
  setStatus: (v: string | null) => void;
  categories: Category[];
  patients: Patient[];
};

export default function Filters({
  category,
  setCategory,
  patient,
  setPatient,
  date,
  setDate,
  status,
  setStatus,
  categories,
  patients,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 my-4">
      <select
        className="border px-3 py-1 rounded cursor-pointer hover:bg-gray-100 transition-colors"
        onChange={(e) => setCategory(e.target.value || null)}
        value={category || ""}
      >
        <option value="">Kategorie</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        className="border px-3 py-1 rounded cursor-pointer hover:bg-gray-100 transition-colors"
        onChange={(e) => setPatient(e.target.value || null)}
        value={patient || ""}
      >
        <option value="">Klient</option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.firstname} {p.lastname}
          </option>
        ))}
      </select>

      <input
        type="date"
        className="border px-3 py-1 rounded hover:bg-gray-100 transition-colors"
        onChange={(e) => setDate(e.target.value || null)}
        value={date || ""}
      />

      <select
        className="border px-3 py-1 rounded cursor-pointer hover:bg-gray-100 transition-colors"
        onChange={(e) => setStatus(e.target.value || null)}
        value={status || ""}
      >
        <option value="">Status</option>
        <option value="pending">Offen</option>
        <option value="done">Erledigt</option>
        <option value="alert">Alarm</option>
      </select>
    </div>
  );
}
