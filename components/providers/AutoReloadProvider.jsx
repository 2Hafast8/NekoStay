"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AutoReloadProvider() {
  const pathname = usePathname();
  const router = useRouter();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Only auto-refresh during local development if explicitly needed
    if (process.env.NODE_ENV !== "development") return;

    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      const timer = setTimeout(() => {
        router.refresh();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [pathname, router]);

  return null;
}
