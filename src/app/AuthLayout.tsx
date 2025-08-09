"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar/Navbar";
import AuthGuard from "@/components/AuthGuard";
import { DateProvider } from "@/context/DateContext";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { AppointmentColorProvider } from "@/context/AppointmentColorContext";

const inter = Inter({ subsets: ["latin"] });

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  useEffect(() => {
    import("@supabase/auth-helpers-nextjs").then(({ createClientComponentClient }) => {
      const supabase = createClientComponentClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser({ id: data.user.id, email: data.user.email ?? "" });
        } else {
          setUser(null);
        }
      });
    });
  }, []);

  // Show only the page content (no Navbar, no dashboard) for these routes if not logged in
  const isAuthPage = ["/login", "/register", "/accept-invitation"].some((p) => pathname.startsWith(p));
  if (isAuthPage && !user) {
    return (
      <div className={cn("min-h-screen bg-gray-50 text-gray-900", inter.className)}>
        {children}
      </div>
    );
  }
  // Otherwise, show full app
  return (
    <div className={cn("min-h-screen bg-gray-50 text-gray-900", inter.className)}>
      <AuthGuard>
        <AppointmentColorProvider>
          <DateProvider>
            <Navbar />
            {children}
          </DateProvider>
        </AppointmentColorProvider>
      </AuthGuard>
    </div>
  );
}
