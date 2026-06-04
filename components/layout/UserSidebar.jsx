"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, User, Bell, Cat } from "lucide-react";
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
    <aside className="hidden md:block w-full md:w-64 bg-card border-r border-border p-6 space-y-6 flex-shrink-0 md:min-h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 pb-6 border-b border-border/60">
        <div className="p-2 bg-secondary text-primary rounded-xl">
          <Cat className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Menu Pemilik
          </span>
          <h4 className="font-extrabold text-sm text-foreground">
            NekoStay Guest
          </h4>
        </div>
      </div>

      <nav className="space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

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
