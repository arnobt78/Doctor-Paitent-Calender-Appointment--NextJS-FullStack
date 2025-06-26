"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Category, Patient } from "@/types/types";

type FiltersProps = {
  onChange: (filters: {
    category: string | null;
    patient: string | null;
    date: string | null;
    status: string | null;
  }) => void;
};

export default function Filters({ onChange }: FiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [category, setCategory] = useState<string | null>(null);
  const [patient, setPatient] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: catData } = await supabase.from("categories").select("*");
      const { data: patData } = await supabase.from("patients").select("*");
      setCategories(catData || []);
      setPatients(patData || []);
    };

    fetchData();
  }, []);

  useEffect(() => {
    onChange({ category, patient, date, status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, patient, date, status]);

  return (
    <div className="flex flex-wrap gap-4 my-4">
      <select
        className="border px-3 py-1 rounded"
        onChange={(e) => setCategory(e.target.value || null)}
        defaultValue=""
      >
        <option value="">Kategorie</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        className="border px-3 py-1 rounded"
        onChange={(e) => setPatient(e.target.value || null)}
        defaultValue=""
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
        className="border px-3 py-1 rounded"
        onChange={(e) => setDate(e.target.value || null)}
      />

      <select
        className="border px-3 py-1 rounded"
        onChange={(e) => setStatus(e.target.value || null)}
        defaultValue=""
      >
        <option value="">Status</option>
        <option value="pending">Offen</option>
        <option value="done">Erledigt</option>
        <option value="alert">Alarm</option>
      </select>
    </div>
  );
}
