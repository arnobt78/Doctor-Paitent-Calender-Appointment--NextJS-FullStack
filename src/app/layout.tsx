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
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body className={cn("min-h-screen bg-gray-50 text-gray-900", inter.className)}>
        <AuthGuard>
          <DateProvider>
            <Navbar />
            {children}
          </DateProvider>
        </AuthGuard>
      </body>
    </html>
  );
}
