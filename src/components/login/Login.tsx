"use client";
import { useState } from "react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed Dialog imports for full-page layout
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { useSearchParams } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

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
      if (redirect) {
        // Always reload the page after redirect to ensure invitation page is shown
        window.location.href = redirect;
        return;
      }
      router.push("/");
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    // If there's a redirect param, pass it through the OAuth flow
    let redirectTo = window.location.origin;
    if (redirect) {
      redirectTo += redirect.startsWith("/") ? redirect : `/${redirect}`;
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
    setLoading(false);
    if (error) setError(error.message);
    // After Google OAuth, Supabase will send a confirmation email if required by project settings
    // The user will be redirected back after OAuth, so AuthGuard will enforce email verification
    // Upsert user will be handled after redirect in AuthGuard or on next login
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 relative">
        <h1 className="text-3xl font-bold mb-2 text-center">Sign in</h1>
        <p className="text-gray-500 mb-6 text-center">Sign in to your account to access your calendar.</p>
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
        </form>
        <div className="text-center pt-4 text-sm">
          Not yet have an account?{' '}
          <Link href="/register" className="text-blue-600 underline">Register</Link>
        </div>
        <Button variant="ghost" className="absolute top-4 right-4 p-2" aria-label="Close" onClick={() => router.push("/")}>✕</Button>
      </div>
    </div>
  );
}
