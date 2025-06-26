"use client";

import { createContext, useContext, useState } from "react";

const DateContext = createContext<{
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
} | null>(null);

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <DateContext.Provider value={{ currentDate, setCurrentDate }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDateContext() {
  const context = useContext(DateContext);
  if (!context) throw new Error("DateContext not found");
  return context;
}
