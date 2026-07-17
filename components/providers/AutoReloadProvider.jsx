"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AutoReloadProvider() {
  const pathname = usePathname();
  const router = useRouter();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      // Use Next.js soft refresh instead of hard reload
      // This re-fetches server data without destroying the browser session/cookies
      const timer = setTimeout(() => {
        router.refresh();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [pathname, router]);

  return null;
}
