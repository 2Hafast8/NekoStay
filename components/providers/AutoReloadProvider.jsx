"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AutoReloadProvider() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      // Delay full reload for 5 seconds (5000ms) after page transition
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}
