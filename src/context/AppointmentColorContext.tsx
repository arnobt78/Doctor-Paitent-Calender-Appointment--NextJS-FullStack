import React, { createContext, useContext } from "react";

const bgColors = [
  "#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8B5CF6", "#EF4444",
  "#14B8A6", "#6366F1", "#F97316", "#A78BFA", "#22D3EE",
  "#00FF00", "#FFFF00", "#00FFFF", "#FF00FF",
];

const randomBgColor = (seed: string) =>
  bgColors[
    seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % bgColors.length
  ];

const AppointmentColorContext = createContext({
  bgColors,
  randomBgColor,
});

export const AppointmentColorProvider = ({ children }: { children: React.ReactNode }) => (
  <AppointmentColorContext.Provider value={{ bgColors, randomBgColor }}>
    {children}
  </AppointmentColorContext.Provider>
);

export const useAppointmentColor = () => useContext(AppointmentColorContext);