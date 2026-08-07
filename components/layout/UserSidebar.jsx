"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, User, Bell, Cat, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function UserSidebar() {
  const pathname = usePathname();

  const links = [
    { label: "Daftar Pesanan", href: "/dashboard", icon: LayoutDashboard },
    { label: "Pesan Penitipan", href: "/booking/new", icon: PlusCircle },
    { label: "Profil Saya", href: "/profile", icon: User },
    { label: "Notifikasi", href: "/notifications", icon: Bell },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-950 text-foreground dark:text-zinc-200 border-r border-border dark:border-zinc-800/80 p-5 space-y-6 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-border dark:border-zinc-800/80">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary via-brand-via to-brand-to flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 shrink-0 font-black text-lg">
          <Cat className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <span className="text-[9px] font-black uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/15 border border-primary/20">
            GUEST PORTAL
          </span>
          <h4 className="font-extrabold text-sm text-foreground dark:text-zinc-100 truncate mt-0.5">
            NekoStay Guest
          </h4>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="space-y-1.5 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 group cursor-pointer",
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
                <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-white bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-4 border-t border-border dark:border-zinc-800/80 text-[11px] text-muted-foreground space-y-1">
        <p className="font-semibold text-muted-foreground">Penitipan Kucing Premium</p>
        <p className="text-[10px] text-muted-foreground/60">Layanan Siaga 24/7</p>
      </div>
    </aside>
  );
}
