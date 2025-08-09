"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSupabaseUserId } from "./helper";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    getSupabaseUserId().then(uid => {
      setUserId(uid);
      setCheckingAuth(false);
    });
  }, [token]);

  const handleAccept = async () => {
    if (!token || !userId) {
      setStatus("error");
      setMessage("Missing invitation token or user session. Please log in.");
      return;
    }
    setStatus("loading");
    const res = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, userId }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      setMessage(data.message || "Invitation accepted!");
    } else {
      setStatus("error");
      setMessage(data.error || "Failed to accept invitation.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Accept Invitation</h1>
      {checkingAuth ? (
        <p>Checking authentication...</p>
      ) : !userId ? (
        <>
          <p className="mb-4 text-red-600">You must be logged in to accept this invitation.</p>
          <Button asChild className="w-full mb-2">
            <Link href={`/login?redirect=/accept-invitation${token ? `?token=${encodeURIComponent(token)}` : ""}`}>Login to continue</Link>
          </Button>
        </>
      ) : status === "idle" ? (
        <>
          <p className="mb-4">Click below to accept your invitation.</p>
          <Button onClick={handleAccept} disabled={!token || !userId}>
            Accept Invitation
          </Button>
        </>
      ) : status === "loading" ? (
        <p>Accepting invitation...</p>
      ) : status === "success" ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-green-700">{message}</p>
          <Button onClick={() => router.push("/")}>Go to Dashboard</Button>
        </div>
      ) : (
        <p className="text-red-700">{message}</p>
      )}
    </div>
  );
}
