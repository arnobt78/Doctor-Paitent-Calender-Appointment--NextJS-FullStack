"use client";

import React, { useState } from "react";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import AppointmentList from "@/components/calendar/AppointmentList";
import CalendarHeader from "@/components/calendar/CalendarHeader";

type ViewType = "Liste" | "Woche" | "Monat";

export default function HomePage() {
  const [view, setView] = useState<ViewType>("Liste");

  return (
    <div className="p-4 space-y-4">
      <CalendarHeader view={view} setView={setView} />

      {/* ⏬ Render Active View */}

      {view === "Liste" && <AppointmentList />}
      {view === "Woche" && <WeekView />}
      {view === "Monat" && <MonthView />}
    </div>
  );
}
