"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed Dialog imports for full-page layout
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

  export function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClientComponentClient();
  
    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      setSuccess("");
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) setError(error.message);
      else {
        setSuccess("Check your email to confirm your registration. You must verify your email before logging in.");
        // If user is returned and email is confirmed instantly (rare), upsert into users table
        if (data?.user && data.user.email_confirmed_at) {
          await supabase.from("users").upsert({
            id: data.user.id,
            email: data.user.email,
            display_name: data.user.user_metadata?.full_name || data.user.email,
          });
        }
        // Otherwise, upsert will happen after first login
      }
    };
  
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 relative">
          <h1 className="text-3xl font-bold mb-2 text-center">Register</h1>
          <p className="text-gray-500 mb-6 text-center">Create a new account to manage your appointments.</p>
          <form onSubmit={handleRegister} className="space-y-4">
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">Email</label>
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">Password</label>
            <Input
              id="register-password"
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
          <div className="text-center pt-4 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 underline">Login</Link>
          </div>
          <Button variant="ghost" className="absolute top-4 right-4 p-2" aria-label="Close" onClick={() => router.push("/login")}>✕</Button>
        </div>
      </div>
    );
  }

