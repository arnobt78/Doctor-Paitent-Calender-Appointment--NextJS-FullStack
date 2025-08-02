"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    <div className="flex items-center justify-center min-h-[60vh]">
      <Dialog open>
        <DialogContent className="sm:max-w-[400px] p-8">
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Button onClick={handleLogout} className="w-full" disabled={loading}>
              {loading ? "Logging out..." : "Logout"}
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
