"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
// Removed Dialog imports for full-page layout
import { Button } from "@/components/ui/button";

export default function Logout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const supabase = createClientComponentClient();
  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 relative">
        <h1 className="text-3xl font-bold mb-2 text-center">Logout</h1>
        <p className="text-gray-500 mb-6 text-center">Are you sure you want to log out?</p>
        <div className="flex flex-col gap-4 mt-4">
          <Button onClick={handleLogout} className="w-full" disabled={loading}>
            {loading ? "Logging out..." : "Logout"}
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
