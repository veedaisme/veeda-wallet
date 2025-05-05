"use client";
import { useUser } from "@/hooks/useUser";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const segments = pathname.split("/").filter(Boolean);
      const locale = segments[0] === "en" || segments[0] === "id" ? segments[0] : null;
      const isAuthRoute = locale ? segments[1] === "auth" : segments[0] === "auth";
      if (!isAuthRoute) {
        const target = locale ? `/${locale}/auth` : "/auth";
        router.replace(target);
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
