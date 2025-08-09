"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";


const ALLOWED_PATHS = ["/login", "/register", "/accept-invitation"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);

  useEffect(() => {
    const supabase = createClientComponentClient();
    supabase.auth.getUser().then(
      async ({ data }: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
        setUser(data?.user || null);
        setChecked(true);
        // If not logged in, redirect to login
        if (!data?.user && !ALLOWED_PATHS.includes(pathname)) {
          router.replace("/login");
          return;
        }
        // If logged in but email not confirmed, force sign out and show message
        if (data?.user && !data.user.email_confirmed_at && !ALLOWED_PATHS.includes(pathname)) {
          await supabase.auth.signOut();
          router.replace("/login?verify=1");
          return;
        }
        // If logged in and on login/register, redirect to main app, but NOT if on /accept-invitation
        if (
          data?.user &&
          data.user.email_confirmed_at &&
          ["/login", "/register"].includes(pathname)
        ) {
          router.replace("/");
        }
        // Always upsert user into users table after successful login and email verification
        if (data?.user && data.user.email_confirmed_at) {
          const { id, email } = data.user;
          if (id && email) {
            await supabase.from("users").upsert({ id, email }, { onConflict: "id" });
          }
        }
      }
    );
  }, [pathname, router]);

  if (!checked && !ALLOWED_PATHS.includes(pathname)) {
    return null;
  }
  return <>{children}</>;
}
