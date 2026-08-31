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
  MessageSquareCode,
  ScanLine,
  Cat,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/hooks/useLanguage";

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const links = [
    { label: t("side_overview"), href: "/admin/dashboard", icon: LayoutDashboard },
    { label: t("side_all_bookings"), href: "/admin/bookings", icon: CalendarRange },
    { label: t("side_scan_qr"), href: "/admin/scanner", icon: ScanLine },
    { label: t("side_cat_conditions"), href: "/admin/reports", icon: HeartPulse },
    { label: t("side_customer_reviews"), href: "/admin/reviews", icon: MessageSquare },
    { label: t("side_whatsapp_logs") || "Log WhatsApp", href: "/admin/whatsapp", icon: MessageSquareCode },
    { label: t("side_rates_settings"), href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-950 text-foreground dark:text-zinc-200 border-r border-border dark:border-zinc-800/80 p-5 space-y-6 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-border dark:border-zinc-800/80">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary via-brand-via to-brand-to flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 shrink-0 font-black text-lg">
          <Cat className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/15 border border-primary/20">
              ADMIN PANEL
            </span>
          </div>
          <h4 className="font-extrabold text-sm text-foreground dark:text-zinc-100 truncate mt-0.5">
            NekoStay Manager
          </h4>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 group cursor-pointer relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-extrabold"
                  : "text-muted-foreground hover:bg-muted dark:hover:bg-zinc-900 hover:text-foreground dark:hover:text-zinc-100"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                <span>{link.label}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="pt-4 border-t border-border dark:border-zinc-800/80 text-[11px] text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-muted-foreground">Status Sistem Aktif</span>
        </div>
        <p className="text-[10px] text-muted-foreground/60">NekoStay Workspace v2.4</p>
      </div>
    </aside>
  );
}
