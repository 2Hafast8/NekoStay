"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/hooks/useLanguage";

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [userId, setUserId] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    loadUser();
  }, [supabase]);

  const { notifications, unreadCount, markAllRead } = useNotifications(userId);

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>{t("tab_notif")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {t("notif_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("notif_desc")}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 border border-border hover:bg-muted text-xs font-bold text-foreground rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            {t("notif_mark_read")}
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="text-center py-20 p-8 space-y-4">
            <div className="p-4 bg-secondary text-primary rounded-full w-fit mx-auto">
              <Bell className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                {t("notif_empty")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {t("notif_empty_desc")}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-6 hover:bg-muted/15 transition-all flex gap-4 ${
                  !n.is_read
                    ? "bg-primary/5 border-l-4 border-l-primary"
                    : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                      {new Date(n.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {n.message}
                  </p>

                  {n.booking_id && (
                    <div className="pt-2">
                      <Link
                        href={`/booking/${n.booking_id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        Lihat Rincian Pesanan
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
