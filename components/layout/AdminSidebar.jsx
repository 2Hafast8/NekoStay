"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  HeartPulse,
  Settings,
  MessageSquare,
  MessageSquareCode,
  ScanLine,
  Cat,
  User,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/hooks/useLanguage";

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isLinkActive = (href) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navGroups = [
    {
      title: t("side_group_operational") || "MANAJEMEN OPERASIONAL",
      items: [
        { label: t("side_overview") || "Dashboard & Metrik", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: t("side_all_bookings") || "Semua Pesanan", href: "/admin/bookings", icon: CalendarRange },
        { label: t("side_scan_qr") || "Scan QR Pembayaran", href: "/admin/scanner", icon: ScanLine },
        { label: t("side_cat_conditions") || "Laporan Kondisi Kucing", href: "/admin/reports", icon: HeartPulse },
      ],
    },
    {
      title: t("side_group_communication") || "KOMUNIKASI & LAYANAN",
      items: [
        { label: t("side_customer_reviews") || "Ulasan Pelanggan", href: "/admin/reviews", icon: MessageSquare },
        { label: t("side_whatsapp_logs") || "WhatsApp & Bot Care", href: "/admin/whatsapp", icon: MessageSquareCode },
      ],
    },
    {
      title: t("side_group_settings") || "PENGATURAN & SISTEM",
      items: [
        { label: t("side_rates_settings") || "Kamar & Tarif", href: "/admin/settings", icon: Settings },
        { label: t("side_admin_profile") || "Profil Admin", href: "/admin/profile", icon: User },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card/85 dark:bg-zinc-950/90 backdrop-blur-xl text-foreground dark:text-zinc-200 border-r border-border/70 dark:border-zinc-800/80 p-4 space-y-4 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-3.5 border-b border-border/70 dark:border-zinc-800/80">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0 font-black text-lg">
          <Cat className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <span className="text-[9px] font-black uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/15 border border-primary/20">
            {t("side_panel_admin") || "ADMIN PANEL"}
          </span>
          <h4 className="font-extrabold text-sm text-foreground dark:text-zinc-100 truncate mt-0.5">
            NekoStay Manager
          </h4>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="space-y-4 flex-1">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <h5 className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 select-none">
              {group.title}
            </h5>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isLinkActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group select-none",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-extrabold"
                        : "text-muted-foreground hover:bg-muted/70 dark:hover:bg-zinc-900/70 hover:text-foreground dark:hover:text-zinc-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                          active
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-primary"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {active ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Status Footer */}
      <div className="pt-3 border-t border-border/70 dark:border-zinc-800/80">
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/40 dark:bg-zinc-900/50 text-[11px] border border-border/40 dark:border-zinc-850">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground truncate">
              {t("side_system_status") || "Sistem Normal 24/7"}
            </span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/60">v2.4</span>
        </div>
      </div>
    </aside>
  );
}
