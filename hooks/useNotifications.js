"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;

    async function loadInitial() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!isCancelled && data) {
        setNotifications(data);
      }
    }

    loadInitial();

    // Subscribe realtime INSERT with unique channel ID to avoid collisions when multiple hooks are mounted
    const channelUniqueId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`notifications-${userId}-${channelUniqueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return {
    notifications,
    unreadCount,
    markAllRead,
    refetch: fetchNotifications,
  };
}
