"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications(userId);
  const dropdownRef = useRef(null);

  const lastNotifiedId = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    // Request permission for Web Push Notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Web Push simulation trigger
  useEffect(() => {
    if (notifications.length > 0 && typeof window !== "undefined" && "Notification" in window) {
      const latest = notifications[0];
      if (!latest.is_read && latest.id !== lastNotifiedId.current) {
        lastNotifiedId.current = latest.id;
        if (Notification.permission === "granted") {
          try {
            new Notification(latest.title, {
              body: latest.message,
              icon: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=100&auto=format&fit=crop",
            });
          } catch (e) {
            console.error("Error displaying notification:", e);
          }
        }
      }
    }
  }, [notifications]);


  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAllRead();
          }
        }}
        className="relative p-2.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all duration-300 focus:outline-hidden cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 bg-muted/30 border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Notifikasi Anda</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-8 h-8 text-muted-foreground/35 mx-auto mb-2.5" />
                <p className="text-sm font-medium">Belum ada notifikasi baru</p>
                <p className="text-xs mt-1">
                  Kami akan mengabari Anda jika status pesanan berubah.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 hover:bg-muted/30 transition-all flex gap-3 ${!n.is_read ? "bg-primary/5" : ""}`}
                >
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    {n.booking_id && (
                      <Link
                        href={`/booking/${n.booking_id}`}
                        onClick={() => setIsOpen(false)}
                        className="text-[11px] font-bold text-primary hover:underline mt-2 inline-block"
                      >
                        Lihat Pesanan
                      </Link>
                    )}
                    <span className="block text-[10px] text-muted-foreground/80 mt-2 font-medium">
                      {new Date(n.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-muted/15 border-t border-border/80 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Lihat Semua Notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
