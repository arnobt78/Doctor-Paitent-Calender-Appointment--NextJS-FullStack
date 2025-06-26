import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { FiFilter } from "react-icons/fi";

import AppointmentDialogTrigger from "@/components/calendar/AppointmentDialogTrigger";
import { Button } from "@/components/ui/button";

import { DateProvider } from "@/context/DateContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vocare Kalender – Terminplanung & Monatsansicht für Deutschland",
  description:
    "Vocare Kalender: Intelligente Terminplanung, Monats-, Wochen- und Listenansicht. Perfekt für Praxen, Teams und Einzelpersonen in Deutschland.",
  keywords: [
    "Kalender",
    "Terminplanung",
    "Monatsansicht",
    "Wochenansicht",
    "Listenansicht",
    "Vocare",
    "Deutschland",
    "Appointments",
    "Praxis",
    "Team",
    "Patienten",
    "React",
    "Next.js",
    "Supabase",
    "Tech Challenge",
  ],
  authors: [{ name: "Arnob Mahmud" }],
  creator: "Vocare Team",
  openGraph: {
    title: "Vocare Kalender – Terminplanung & Monatsansicht für Deutschland",
    description:
      "Vocare Kalender: Intelligente Terminplanung, Monats-, Wochen- und Listenansicht. Perfekt für Praxen, Teams und Einzelpersonen in Deutschland.",
    url: "https://vocare-kalender.de/",
    siteName: "Vocare Kalender",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vocare Kalender – Terminplanung & Monatsansicht für Deutschland",
    description:
      "Vocare Kalender: Intelligente Terminplanung, Monats-, Wochen- und Listenansicht. Perfekt für Praxen, Teams und Einzelpersonen in Deutschland.",
    creator: "@vocarekalender",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body
        className={cn("min-h-screen bg-gray-50 text-gray-900", inter.className)}
      >
        <header className="w-full p-4 shadow-sm bg-white border-b flex justify-between items-center">
          <div className="text-xl font-bold">📅 Vocare Kalender</div>
          <div className="flex gap-2">
            {/* <Button variant="outline">
              <FiFilter className="inline-block mr-2 -mt-0.5" /> Termine filtern
            </Button> */}
            <AppointmentDialogTrigger
              trigger={
                <Button className="hover:bg-gray-400 hover:text-black cursor-pointer">
                  + Neuer Termin
                </Button>
              }
            />
          </div>
        </header>

        <DateProvider>
          <main className="max-w-6xl mx-auto mt-6 px-4">{children}</main>
        </DateProvider>
      </body>
    </html>
  );
}
