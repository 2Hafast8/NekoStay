"use client";

import { useState } from "react";
import {
  FileText,
  AlertTriangle,
  HeartPulse,
  Utensils,
  Sparkles,
  RotateCcw,
  Pin,
  PinOff,
  Trash2,
  Send,
  User,
  Clock,
  Check,
  Pill,
  Thermometer,
  Calendar,
  Layers,
} from "lucide-react";
import { formatDate } from "@/lib/utils/dates";
import { GsapCardSlider } from "@/components/ui/GsapCardSlider";

export const NOTE_CATEGORIES = [
  {
    id: "urgent",
    label: "Perhatian Kritis",
    shortLabel: "Kritis",
    description: "Instruksi darurat, alergi fatal, atau perilaku agresif yang wajib diwaspadai seluruh staf.",
    icon: AlertTriangle,
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
  {
    id: "medical",
    label: "Medis & Obat",
    shortLabel: "Medis",
    description: "Jadwal dan dosis obat, vitamin, perawatan luka, atau instruksi dokter hewan.",
    icon: HeartPulse,
    badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    dotClass: "bg-purple-500",
  },
  {
    id: "diet",
    label: "Diet & Pakan",
    shortLabel: "Diet",
    description: "Takaran porsi pakan, merek pakan khusus, jadwal makan, atau pantangan pakan anabul.",
    icon: Utensils,
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  {
    id: "behavior",
    label: "Perilaku & Sifat",
    shortLabel: "Perilaku",
    description: "Karakter anabul (pemalu, penakut, aktif), cara pendekatan yang nyaman, atau respon suara.",
    icon: Sparkles,
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  {
    id: "shift_handoff",
    label: "Serah Terima Shift",
    shortLabel: "Shift",
    description: "Laporan operan antar staf/perawat shift mengenai kondisi dan aktivitas terkini anabul.",
    icon: RotateCcw,
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  {
    id: "general",
    label: "Umum",
    shortLabel: "Umum",
    description: "Catatan operasional harian, penitipan perlengkapan mainan, atau info administratif.",
    icon: FileText,
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
];

const QUICK_CHIPS = [
  { label: "Obat Diminumkan", text: "Obat rutin sudah diminumkan sesuai resep dokter.", category: "medical", icon: Pill },
  { label: "Makan Lahap", text: "Porsi pakan habis dimakan dengan lahap.", category: "diet", icon: Utensils },
  { label: "Litterbox Bersih", text: "Litterbox dibersihkan, kondisi feses dan urin normal.", category: "general", icon: Sparkles },
  { label: "Agresif / Stres", text: "Kucing tampak waspada/stres. Pendekatan hati-hati.", category: "urgent", pin: true, icon: AlertTriangle },
  { label: "Suhu Normal", text: "Pemeriksaan suhu & kondisi fisik terpantau normal.", category: "medical", icon: Thermometer },
  { label: "Operan Shift", text: "Operan shift staf: Kucing sehat, aktif, dan terpantau baik.", category: "shift_handoff", icon: RotateCcw },
];


export function AdminNoteCard({
  note,
  catMeta,
  author,
  onTogglePinNote,
  onDeleteNote,
  isActionLoading = false,
  deletingId = null,
  handleDelete,
}) {
  const IconComponent = catMeta.icon;
  const isDeleting = deletingId === note.id;

  return (
    <div
      className={`relative group overflow-hidden bg-card text-card-foreground border rounded-2xl shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between ${
        note.is_pinned
          ? "border-rose-500/40 bg-gradient-to-br from-rose-500/5 via-card to-card ring-1 ring-rose-500/20"
          : "border-border/80 hover:border-primary/40"
      }`}
    >
      {/* Background soft subtle ornament */}
      <div
        className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full -z-10 group-hover:scale-105 transition-transform duration-300 pointer-events-none ${
          note.is_pinned ? "bg-rose-500/10" : "bg-primary/5"
        }`}
      />

      <div className="p-3.5 sm:p-4 space-y-2">
        {/* Header: Icon, Category Name, Timestamp & Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`p-1.5 rounded-xl flex items-center justify-center shrink-0 border ${catMeta.badgeClass}`}
            >
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                  {catMeta.label}
                </h4>
                {note.is_pinned && (
                  <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    <Pin className="w-2.5 h-2.5 fill-rose-500" />
                    <span>Kritis</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <span className="font-semibold text-foreground/80">{author}</span>
                <span>•</span>
                <span>{formatDate(note.created_at)}</span>
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${catMeta.badgeClass}`}
          >
            {catMeta.shortLabel}
          </span>
        </div>

        {/* Note Content */}
        <div className="pt-0.5">
          <p className="text-xs leading-relaxed text-foreground/90 font-medium break-words whitespace-pre-wrap line-clamp-3">
            {note.content}
          </p>
        </div>
      </div>

      {/* Card Footer Actions Bar (Minimalist) */}
      <div className="px-3.5 py-2 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[10px]">
          {note.is_pinned ? (
            <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
              <Pin className="w-3 h-3 fill-rose-500" />
              <span>Banner Aktif</span>
            </span>
          ) : (
            <span className="text-muted-foreground truncate max-w-[140px]">{catMeta.label}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onTogglePinNote && (
            <button
              type="button"
              onClick={() => onTogglePinNote(note.id, note.is_pinned)}
              disabled={isActionLoading}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer border ${
                note.is_pinned
                  ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-500/30"
                  : "bg-background hover:bg-muted text-foreground border-border/70"
              }`}
              title={note.is_pinned ? "Lepas sematan" : "Sematkan"}
            >
              {note.is_pinned ? (
                <>
                  <PinOff className="w-3 h-3" />
                  <span>Lepas</span>
                </>
              ) : (
                <>
                  <Pin className="w-3 h-3" />
                  <span>Pin</span>
                </>
              )}
            </button>
          )}

          {onDeleteNote && (
            <button
              type="button"
              onClick={() => handleDelete(note.id)}
              disabled={isDeleting || isActionLoading}
              className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-40"
              title="Hapus catatan"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminBookingNotesTimeline({
  notes = [],
  onCreateNote,
  onTogglePinNote,
  onDeleteNote,
  isActionLoading = false,
  compact = false,
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isPinned, setIsPinned] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleChipClick = (chip) => {
    setContent((prev) => (prev ? `${prev}\n${chip.text}` : chip.text));
    if (chip.category) setCategory(chip.category);
    if (chip.pin) setIsPinned(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateNote({ category, content: trimmed, isPinned });
      setContent("");
      setIsPinned(false);
      setCategory("general");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Hapus catatan internal admin ini?")) return;
    setDeletingId(noteId);
    try {
      await onDeleteNote(noteId);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredNotes = activeFilter === "all"
    ? notes
    : notes.filter((n) => n.category === activeFilter);

  const getCategoryMeta = (catId) => {
    return NOTE_CATEGORIES.find((c) => c.id === catId) || NOTE_CATEGORIES[5];
  };

  return (
    <div className="space-y-3.5">
      {/* Compose Note Card */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
              Tulis Catatan Internal Tim
            </h4>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            Khusus Admin & Perawat
          </span>
        </div>

        {/* Quick Chips */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Template Cepat
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((chip, idx) => {
              const ChipIcon = chip.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-muted/60 hover:bg-muted hover:text-foreground text-muted-foreground border border-border/60 transition-colors cursor-pointer"
                >
                  <ChipIcon className="w-3 h-3 text-primary shrink-0" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Category Select Buttons with Hover Popups */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Kategori Catatan
              </label>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Arahkan kursor untuk info kategori
              </span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {NOTE_CATEGORIES.map((cat, index) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.id;

                // Smart responsive alignment for tooltip to prevent horizontal overflow
                const smCol = index % 3;
                const smAlignClass =
                  smCol === 0
                    ? "sm:left-0 sm:translate-x-0"
                    : smCol === 2
                    ? "sm:right-0 sm:left-auto sm:translate-x-0"
                    : "sm:left-1/2 sm:-translate-x-1/2";
                const smArrowClass =
                  smCol === 0
                    ? "sm:left-4 sm:translate-x-0"
                    : smCol === 2
                    ? "sm:right-4 sm:left-auto sm:translate-x-0"
                    : "sm:left-1/2 sm:-translate-x-1/2";

                const mobAlignClass =
                  index <= 1
                    ? "left-0 translate-x-0"
                    : index >= 4
                    ? "right-0 left-auto translate-x-0"
                    : "left-1/2 -translate-x-1/2";
                const mobArrowClass =
                  index <= 1
                    ? "left-4 translate-x-0"
                    : index >= 4
                    ? "right-4 left-auto translate-x-0"
                    : "left-1/2 -translate-x-1/2";

                return (
                  <div key={cat.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        if (cat.id === "urgent") setIsPinned(true);
                      }}
                      aria-label={`${cat.label}: ${cat.description}`}
                      className={`w-full flex items-center justify-center sm:justify-start gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? `${cat.badgeClass} ring-1 ring-primary/40 shadow-2xs`
                          : "bg-muted/30 border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline truncate">{cat.label}</span>
                    </button>

                    {/* Hover Popup / Tooltip explaining category */}
                    <div
                      role="tooltip"
                      className={`absolute bottom-full mb-2 w-52 sm:w-60 p-2.5 rounded-xl bg-zinc-900 text-zinc-100 dark:bg-zinc-800 dark:text-zinc-50 border border-zinc-700/80 shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:scale-100 transition-all duration-150 z-30 ${mobAlignClass} ${smAlignClass}`}
                    >
                      <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-800 dark:border-zinc-700">
                        <IconComponent className="w-3.5 h-3.5 shrink-0 text-primary" />
                        <span className="font-extrabold text-[11px] text-white">
                          {cat.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-300 leading-snug mt-1 font-normal">
                        {cat.description}
                      </p>
                      <div
                        className={`absolute top-full -mt-px border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-800 ${mobArrowClass} ${smArrowClass}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active category explanation helper */}
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-0.5 pt-0.5">
              <span className="font-semibold text-foreground shrink-0">
                {NOTE_CATEGORIES.find((c) => c.id === category)?.label}:
              </span>
              <span className="truncate text-muted-foreground text-[10.5px]">
                {NOTE_CATEGORIES.find((c) => c.id === category)?.description}
              </span>
            </p>
          </div>


          {/* Textarea */}
          <div className="space-y-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis instruksi pakan, jadwal obat, pantangan alergi, atau catatan handover shift..."
              rows={compact ? 3 : 4}
              maxLength={1000}
              className="w-full px-3.5 py-2.5 bg-muted/20 border border-border/80 rounded-2xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary font-medium leading-relaxed resize-none transition-all"
            />
            <div className="flex justify-between items-center text-[11px] text-muted-foreground px-1">
              <span>Maksimal 1000 karakter</span>
              <span>{content.length}/1000</span>
            </div>
          </div>

          {/* Pin Checkbox + Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded-md border-border accent-rose-600 cursor-pointer"
              />
              <span className="inline-flex items-center gap-1.5">
                <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-rose-500 fill-rose-500" : "text-muted-foreground"}`} />
                <span>Sematkan sebagai Banner Kritis</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={!content.trim() || isSubmitting || isActionLoading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Menyimpan..." : "Kirim Catatan"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Activity Notes Feed Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <span>Riwayat Aktivitas Catatan</span>
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {notes.length}
              </span>
            </h4>
          </div>

          {/* Filter Chips if notes exist */}
          {notes.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto py-1 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeFilter === "all"
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua
              </button>
              {NOTE_CATEGORIES.map((cat) => {
                const count = notes.filter((n) => n.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveFilter(cat.id)}
                    className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activeFilter === cat.id
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{cat.shortLabel}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes Cards Display with GSAP Card Slider */}
        {filteredNotes.length === 0 ? (
          <div className="bg-card border border-dashed border-border/80 rounded-3xl p-6 text-center space-y-2">
            <div className="w-9 h-9 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <FileText className="w-4 h-4 opacity-70" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {notes.length === 0 ? "Belum ada catatan internal untuk pesanan ini" : "Tidak ada catatan dengan filter ini"}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              {notes.length === 0
                ? "Gunakan form di atas untuk mencatat kondisi medis, pantangan makanan, atau handover shift."
                : "Pilih filter 'Semua' untuk melihat riwayat lengkap."}
            </p>
          </div>
        ) : (
          <div className="pt-0.5">
            {/* GSAP Interactive Card Slider (Langsung aktif di Desktop) */}
            <GsapCardSlider
              key={`notes-slider-${filteredNotes.length}-${activeFilter}`}
              stageHeight="min-h-[185px] sm:min-h-[195px]"
              cardWidth="w-[92%] max-w-[320px]"
              items={filteredNotes}
              renderItem={(note) => {
                const catMeta = getCategoryMeta(note.category);
                const author = note.profiles?.full_name || "Admin Tim";
                return (
                  <AdminNoteCard
                    key={note.id}
                    note={note}
                    catMeta={catMeta}
                    author={author}
                    onTogglePinNote={onTogglePinNote}
                    onDeleteNote={onDeleteNote}
                    isActionLoading={isActionLoading}
                    deletingId={deletingId}
                    handleDelete={handleDelete}
                  />
                );
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

