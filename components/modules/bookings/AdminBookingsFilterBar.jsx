"use client";

import React from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Check,
  RotateCcw,
  List,
  LayoutGrid,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function AdminBookingsFilterBar({
  activeTab,
  setActiveTab,
  statusTabs,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedClass,
  setSelectedClass,
  availableClasses = [],
  isFiltersActive,
  onResetFilters,
  totalFiltered,
  totalBookings,
  pagePendingCount = 0,
  isAllPagePendingSelected = false,
  onSelectAllPagePending,
}) {
  const yearOptions = [
    { value: "all", label: "Semua Tahun" },
    { value: "2024", label: "2024" },
    { value: "2025", label: "2025" },
    { value: "2026", label: "2026" },
    { value: "2027", label: "2027" },
    { value: "2028", label: "2028" },
  ];

  const monthOptions = [
    { value: "all", label: "Semua Bulan" },
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const currentYearLabel =
    yearOptions.find((o) => o.value === selectedYear)?.label ?? selectedYear;
  const currentMonthLabel =
    monthOptions.find((o) => o.value === selectedMonth)?.label ?? selectedMonth;
  const isMonthDisabled = selectedYear === "all";

  return (
    <div className="space-y-4">
      {/* Status Tabs & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        {/* Horizontal Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-black transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs" />
                )}
              </button>
            );
          })}
        </div>

        {/* Table / Grid Switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-2xl shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "table"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tampilan Tabel"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tabel</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "grid"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tampilan Grid Kartu"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-card border border-border p-4 rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama kucing atau pemilik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-2xl text-xs focus:outline-hidden focus:border-primary/60 text-foreground font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-bold mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            {/* Year Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all min-w-[110px] justify-between cursor-pointer">
                <span className="text-muted-foreground font-normal">Tahun:</span>
                <span className="font-bold">{currentYearLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" sideOffset={6} className="p-1">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Pilih Tahun
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {yearOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setSelectedYear(opt.value)}
                    className={`text-xs font-semibold cursor-pointer ${
                      selectedYear === opt.value ? "text-primary font-bold bg-primary/5" : ""
                    }`}
                  >
                    {selectedYear === opt.value ? (
                      <Check className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    )}
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Month Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={isMonthDisabled}
                className={`flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all min-w-[130px] justify-between cursor-pointer ${
                  isMonthDisabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                }`}
              >
                <span className="text-muted-foreground font-normal">Bulan:</span>
                <span className="font-bold">{currentMonthLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" sideOffset={6} className="p-1">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Pilih Bulan
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {monthOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setSelectedMonth(opt.value)}
                    className={`text-xs font-semibold cursor-pointer ${
                      selectedMonth === opt.value ? "text-primary font-bold bg-primary/5" : ""
                    }`}
                  >
                    {selectedMonth === opt.value ? (
                      <Check className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    )}
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Class Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all min-w-[120px] justify-between cursor-pointer">
                <span className="text-muted-foreground font-normal">Kelas:</span>
                <span className="font-bold">{selectedClass}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" sideOffset={6} className="p-1">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Pilih Kelas
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["Semua", ...availableClasses].map((cls) => (
                  <DropdownMenuItem
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`text-xs font-semibold cursor-pointer ${
                      selectedClass === cls ? "text-primary font-bold bg-primary/5" : ""
                    }`}
                  >
                    {selectedClass === cls ? (
                      <Check className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    )}
                    {cls}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset Filters Button */}
            {isFiltersActive && (
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted border border-border transition-all cursor-pointer"
                title="Reset semua pencarian & filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter results info banner */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-1 border-t border-border/50">
          <span>
            Menampilkan{" "}
            <strong className="text-foreground font-bold">{totalFiltered}</strong>{" "}
            pesanan dari total{" "}
            <strong className="text-foreground font-bold">{totalBookings}</strong>
          </span>
          {pagePendingCount > 0 && (
            <button
              onClick={onSelectAllPagePending}
              className="text-primary hover:underline font-bold cursor-pointer text-xs"
            >
              {isAllPagePendingSelected
                ? "Batal Pilih Menunggu"
                : `Pilih Semua Menunggu (${pagePendingCount})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

