"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, CalendarPlus, Bell, User } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/hooks/useLanguage";

export function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { unreadCount } = useNotifications(user?.id);
  const { t } = useLanguage();

  const isTabActive = (href) => {
    if (href === "/dashboard") {
      // Active on dashboard or on booking details (/booking/[id])
      return (
        pathname === "/dashboard" ||
        (pathname.startsWith("/booking/") && pathname !== "/booking/new")
      );
    }
    if (href === "/booking/new") {
      return pathname === "/booking/new";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const tabs = [
    {
      id: "home",
      href: "/dashboard",
      label: t("tab_home"),
      icon: Home,
    },
    {
      id: "booking",
      href: "/booking/new",
      label: t("tab_bookings"),
      icon: CalendarPlus,
    },
    {
      id: "notifications",
      href: "/notifications",
      label: t("tab_notif"),
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: "profile",
      href: "/profile",
      label: t("tab_profile"),
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Pengguna Mobile"
      className="fixed bottom-3 inset-x-0 z-40 md:hidden px-3.5 pointer-events-none transition-all duration-300"
    >
      <div className="max-w-sm mx-auto pointer-events-auto">
        <div className="bg-card/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-border/80 dark:border-zinc-800/80 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/50 p-1.5 flex items-center justify-between gap-1">
          {tabs.map((tab) => {
            const isActive = isTabActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 group active:scale-90 select-none ${
                  isActive
                    ? "bg-primary/10 dark:bg-primary/15 text-primary font-extrabold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground font-semibold"
                }`}
              >
                <div className="relative mb-0.5">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? "scale-105 stroke-[2.5]" : "group-hover:scale-105 stroke-[2]"
                    }`}
                  />
                  {tab.badge && (
                    <>
                      <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping opacity-75" />
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs shadow-rose-500/50">
                        {tab.badge > 9 ? "9+" : tab.badge}
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[10px] tracking-tight leading-none truncate max-w-full">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-primary mt-1 animate-in zoom-in-50 duration-200" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
