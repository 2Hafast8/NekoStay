"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  HeartPulse,
  Settings,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

import { useLanguage } from "@/hooks/useLanguage";

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const links = [
    { label: t("side_overview"), href: "/admin/dashboard", icon: LayoutDashboard },
    { label: t("side_all_bookings"), href: "/admin/bookings", icon: CalendarRange },
    { label: t("side_cat_conditions"), href: "/admin/reports", icon: HeartPulse },
    { label: t("side_customer_reviews"), href: "/admin/reviews", icon: MessageSquare },
    { label: t("side_rates_settings"), href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:block w-full md:w-64 bg-card border-r border-border p-6 space-y-6 flex-shrink-0 md:min-h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 pb-6 border-b border-border/60">
        <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("side_panel_admin")}
          </span>
          <h4 className="font-extrabold text-sm text-foreground">
            {t("side_admin_title")}
          </h4>
        </div>
      </div>

      <nav className="space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
