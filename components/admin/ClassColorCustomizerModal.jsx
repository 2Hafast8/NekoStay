"use client";

import { Palette, RotateCcw, X, Check } from "lucide-react";
import { EXTENDED_COLOR_PALETTE, getClassColor } from "@/lib/constants";

export const QUICK_SWATCHES = [
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#d946ef", // Fuchsia
  "#84cc16", // Lime
  "#0284c7", // Sky
  "#e11d48", // Rose
  "#64748b", // Slate
];

export function ClassColorCustomizerModal({
  isOpen,
  onClose,
  classData = [],
  customColors = {},
  onUpdateColor,
  onResetColors,
  language = "id",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 dark:border-zinc-800/60 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground dark:text-zinc-100">
                {language === "en" ? "Customize Room Class Colors" : "Sesuaikan Warna Kelas Kamar"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === "en"
                  ? "Change chart display colors for each room class"
                  : "Atur warna tampilan grafik lingkaran untuk setiap kelas kamar"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Classes List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 divide-y divide-border/40 dark:divide-zinc-800/60">
          {classData.map((cls, idx) => {
            const currentColor = cls.color;
            const defaultCol = getClassColor(cls.name, idx, {});
            const isCustom = customColors[cls.name] && customColors[cls.name] !== defaultCol;

            return (
              <div key={cls.name} className="pt-3.5 first:pt-0 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs border border-black/10 dark:border-white/20"
                      style={{ backgroundColor: currentColor }}
                    />
                    <span className="text-sm font-bold text-foreground dark:text-zinc-100 truncate">
                      {cls.name}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 bg-muted dark:bg-zinc-800 rounded-md shrink-0">
                      {cls.value} {language === "en" ? "bookings" : "pesanan"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Native Color Picker */}
                    <div className="relative flex items-center gap-1.5 bg-muted/40 dark:bg-zinc-800/40 px-2 py-1 rounded-xl border border-border/60 dark:border-zinc-700/60">
                      <input
                        type="color"
                        id={`color-${cls.name}`}
                        value={currentColor}
                        onChange={(e) => onUpdateColor(cls.name, e.target.value)}
                        className="w-6 h-6 rounded-lg cursor-pointer border border-border/80 dark:border-zinc-700 p-0 bg-transparent"
                        title={language === "en" ? "Pick custom HEX color" : "Pilih warna HEX bebas"}
                      />
                      <span className="text-[11px] font-mono font-bold text-foreground dark:text-zinc-200 uppercase">
                        {currentColor}
                      </span>
                    </div>

                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => onUpdateColor(cls.name, defaultCol, true)}
                        title={language === "en" ? "Reset to default" : "Kembalikan ke warna bawaan"}
                        className="text-[11px] text-muted-foreground hover:text-rose-500 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Swatches */}
                <div className="flex items-center gap-1.5 pl-6.5 overflow-x-auto py-1">
                  {QUICK_SWATCHES.map((swatch) => {
                    const isSelected = currentColor.toLowerCase() === swatch.toLowerCase();
                    return (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => onUpdateColor(cls.name, swatch)}
                        className={`w-4 h-4 rounded-full transition-all hover:scale-125 cursor-pointer shrink-0 relative flex items-center justify-center ${
                          isSelected
                            ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-900 scale-110"
                            : "opacity-85 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: swatch }}
                        title={swatch}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60 dark:border-zinc-800/60 shrink-0">
          <button
            type="button"
            onClick={onResetColors}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Reset All" : "Reset Semua"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-black rounded-xl hover:bg-primary/90 transition-colors cursor-pointer shadow-md"
          >
            {language === "en" ? "Save & Close" : "Simpan & Tutup"}
          </button>
        </div>
      </div>
    </div>
  );
}

