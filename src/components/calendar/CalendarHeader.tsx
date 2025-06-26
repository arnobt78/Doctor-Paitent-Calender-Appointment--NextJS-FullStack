"use client";

import { useDateContext } from "@/context/DateContext";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import React from "react";

// Change tab order to Liste, Woche, Monat
const views = ["Liste", "Woche", "Monat"] as const;
type ViewType = (typeof views)[number];

export default function CalendarHeader({
  view,
  setView,
}: {
  view: ViewType;
  setView: (v: ViewType) => void;
}) {
  const { currentDate, setCurrentDate } = useDateContext();

  // Navigation logic: only change date for Monat/Woche, not for Liste
  const handlePrev = () => {
    if (view === "Monat") setCurrentDate(addDays(currentDate, -30));
    else if (view === "Woche") setCurrentDate(addDays(currentDate, -7));
    // For Liste, do nothing or optionally disable
  };
  const handleNext = () => {
    if (view === "Monat") setCurrentDate(addDays(currentDate, 30));
    else if (view === "Woche") setCurrentDate(addDays(currentDate, 7));
    // For Liste, do nothing or optionally disable
  };

  return (
    <div className="flex items-center justify-between p-4 border-b mb-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={view === "Liste"}
          className="cursor-pointer hover:bg-gray-100 transition-colors"
        >
          ←
        </Button>
        <div className="text-lg font-medium ">
          {format(currentDate, "dd. MMMM yyyy", { locale: de })}
        </div>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={view === "Liste"}
          className="cursor-pointer hover:bg-gray-100 transition-colors"
        >
          →
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {views.map((v) => (
            <Button
              key={v}
              onClick={() => setView(v)}
              variant={v === view ? "default" : "outline"}
              className="cursor-pointer transition-colors"
            >
              {v}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
