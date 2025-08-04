"use client";

import React, { useState } from "react";
import Link from "next/link";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import AppointmentList from "@/components/calendar/AppointmentList";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import { useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type ViewType = "Liste" | "Woche" | "Monat";

const HomePage: React.FC = () => {
  const [view, setView] = useState<ViewType>("Liste");
  // ...existing code...

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-4">
        <CalendarHeader view={view} setView={setView} />

        {/* ⏬ Render Active View */}

        {view === "Liste" && <AppointmentList />}
        {view === "Woche" && <WeekView />}
        {view === "Monat" && <MonthView />}
      </div>
    </div>
  );
};

export default HomePage;
