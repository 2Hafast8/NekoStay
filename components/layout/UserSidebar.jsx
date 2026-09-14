"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  User,
  Bell,
  Cat,
  ChevronRight,
  MessageSquareCode,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/hooks/useLanguage";
import { useUser } from "@/hooks/useUser";
import { useNotifications } from "@/hooks/useNotifications";

export function UserSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useUser();
  const { unreadCount } = useNotifications(user?.id);

  const isLinkActive = (href) => {
    if (href === "/dashboard") {
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

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "6282371986344";
  const waUrl = `https://wa.me/${waNumber}?text=Halo%20Admin%20NekoStay%2C%20saya%20butuh%20bantuan`;

  const navGroups = [
    {
      title: t("side_user_group_main") || "MENU UTAMA",
      items: [
        {
          label: t("side_user_bookings") || "Daftar Pesanan",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: t("side_user_notifications") || "Notifikasi",
          href: "/notifications",
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : null,
        },
      ],
    },
    {
      title: t("side_user_group_account") || "AKUN & BANTUAN",
      items: [
        {
          label: t("side_user_profile") || "Profil Saya",
          href: "/profile",
          icon: User,
        },
        {
          label: t("side_user_whatsapp") || "WhatsApp Care",
          href: waUrl,
          icon: MessageSquareCode,
          external: true,
        },
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
            {t("side_user_portal") || "GUEST PORTAL"}
          </span>
          <h4 className="font-extrabold text-sm text-foreground dark:text-zinc-100 truncate mt-0.5">
            {t("side_user_brand") || "NekoStay Guest"}
          </h4>
        </div>
      </div>

      {/* Prominent CTA Button: Pesan Baru */}
      <Link
        href="/booking/new"
        className={cn(
          "w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs transition-all duration-200 shadow-md active:scale-95 select-none",
          pathname === "/booking/new"
            ? "bg-linear-to-tr from-primary via-orange-500 to-amber-500 text-white shadow-primary/30 ring-2 ring-primary/40 ring-offset-2 ring-offset-card"
            : "bg-linear-to-tr from-primary via-orange-500 to-amber-500 text-white shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.01]"
        )}
      >
        <CalendarPlus className="w-4 h-4 text-white stroke-[2.5]" />
        <span>{t("side_user_book_cta") || "Pesan Penitipan"}</span>
      </Link>

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
                const active = !item.external && isLinkActive(item.href);

                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group select-none text-muted-foreground hover:bg-muted/70 dark:hover:bg-zinc-900/70 hover:text-foreground dark:hover:text-zinc-100"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 text-muted-foreground group-hover:text-emerald-500" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0" />
                    </a>
                  );
                }

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
                      <div className="relative">
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                            active
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-primary"
                          )}
                        />
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                        )}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                      {active ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-border/70 dark:border-zinc-800/80 text-[11px] text-muted-foreground space-y-0.5 px-1">
        <p className="font-bold text-foreground dark:text-zinc-200">
          {t("side_user_subtitle") || "Penitipan Kucing Premium"}
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          {t("side_system_status") || "Layanan Siaga 24/7"}
        </p>
      </div>
    </aside>
  );
}
