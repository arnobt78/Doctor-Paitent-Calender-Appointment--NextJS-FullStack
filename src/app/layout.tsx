import "../styles/globals.css";
import Navbar from "@/components/navbar/Navbar";
import AuthGuard from "@/components/AuthGuard";
import { DateProvider } from "@/context/DateContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vocare Kalender – Terminplanung & Monatsansicht für Deutschland",
  description:
    "Vocare Kalender: Intelligente Terminplanung, Monats-, Wochen- und Listenansicht. Perfekt für Praxen, Teams und Einzelpersonen in Deutschland. Modern Next.js, React, Supabase, Tailwind CSS, Healthcare, Tech Challenge.",
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
    "Healthcare",
    "Tailwind CSS",
    "shadcn/ui",
    "Radix UI",
    "TypeScript",
    "Fullstack",
    "CRUD",
    "Responsive",
    "Filtering",
    "Search",
    "Modern UI",
    "Vercel",
    "Invitation",
    "Permission",
    "RESTful API",
    "OpenAPI",
    "Accessibility",
    "Arnob Mahmud",
  ],
  authors: [
    {
      name: "Arnob Mahmud",
      url: "https://arnob-mahmud.vercel.app/",
    },
  ],
  creator: "Vocare Team",
  openGraph: {
    title: "Vocare Kalender – Terminplanung & Monatsansicht für Deutschland",
    description:
      "Vocare Kalender: Intelligente Terminplanung, Monats-, Wochen- und Listenansicht. Perfekt für Praxen, Teams und Einzelpersonen in Deutschland. Modern Next.js, React, Supabase, Tailwind CSS, Healthcare, Tech Challenge.",
    url: "https://doctor-patient-calendar-appointment.vercel.app/",
    siteName: "Vocare Kalender",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "/favicon.ico",
        width: 64,
        height: 64,
        alt: "Vocare Kalender Icon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vocare Kalender – Terminplanung & Monatsansicht für Deutschland",
    description:
      "Vocare Kalender: Intelligente Terminplanung, Monats-, Wochen- und Listenansicht. Perfekt für Praxen, Teams und Einzelpersonen in Deutschland. Modern Next.js, React, Supabase, Tailwind CSS, Healthcare, Tech Challenge.",
    creator: "@vocarekalender",
    images: ["/favicon.ico"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

import AuthLayout from "./AuthLayout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body>
        <AuthLayout>{children}</AuthLayout>
      </body>
    </html>
  );
}
