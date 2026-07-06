"use client";

import { AlertTriangle, X } from "lucide-react";

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  onConfirm,
  onCancel,
  variant = "primary",
  children,
  isLoading = false,
  confirmDisabled = false,
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
    warning: "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-400",
    primary: "bg-primary hover:bg-primary/95 text-white focus:ring-primary",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Content Container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-xl transition-all animate-in fade-in zoom-in duration-200">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-30"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4">
          {variant !== "primary" && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 h-fit self-start">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-bold leading-6 text-foreground">
              {title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            {children}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            className="inline-flex justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading || confirmDisabled}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 ${variantStyles[variant]}`}
            onClick={onConfirm}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Memproses...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
