"use client";
import { useState } from "react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else if (data.user && !data.user.email_confirmed_at) {
      setError("Please verify your email address before logging in. Check your inbox for a confirmation link.");
      await supabase.auth.signOut();
    } else if (data.user) {
      // Upsert user into users table
      await supabase.from("users").upsert({
        id: data.user.id,
        email: data.user.email,
        display_name: data.user.user_metadata?.full_name || data.user.email,
      });
      router.push("/");
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    setLoading(false);
    if (error) setError(error.message);
    // After Google OAuth, Supabase will send a confirmation email if required by project settings
    // The user will be redirected back after OAuth, so AuthGuard will enforce email verification
    // Upsert user will be handled after redirect in AuthGuard or on next login
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Dialog open>
        <DialogContent className="sm:max-w-[400px] p-8" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
            <DialogDescription>
              Sign in to your account to access your calendar.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button variant="ghost" className="absolute top-4 right-4 p-2" aria-label="Close" onClick={() => router.push("/")}>✕</Button>
          </DialogClose>
          <form onSubmit={handleLogin} className="space-y-4">
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Email</label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">Password</label>
            <Input
              id="login-password"
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button type="button" variant="secondary" className="w-full" onClick={handleGoogle} disabled={loading}>
              {loading ? "Redirecting..." : "Login with Google"}
            </Button>
            <div className="text-center pt-2 text-sm">
              Not yet have an account?{' '}
              <Link href="/register" className="text-blue-600 underline">Register</Link>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
