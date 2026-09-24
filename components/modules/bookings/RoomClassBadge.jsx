import React from "react";

export function RoomClassBadge({ roomClass }) {
  const normalized = (roomClass || "").toLowerCase();
  let badgeStyles = "bg-muted text-foreground border-border";

  if (normalized.includes("basic")) {
    badgeStyles =
      "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700";
  } else if (normalized.includes("standard")) {
    badgeStyles =
      "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900";
  } else if (normalized.includes("premium") || normalized.includes("vip")) {
    badgeStyles =
      "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badgeStyles}`}
    >
      {roomClass}
    </span>
  );
}

