"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Cat, Sparkles } from "lucide-react";

/**
 * GsapDataLoader — Component to display GSAP-animated loading state for data fetching.
 *
 * @param {Object} props
 * @param {string} [props.type="table"] - Loading layout style: "table" | "cards" | "dashboard" | "detail" | "simple"
 * @param {string} [props.message] - Optional message during loading
 * @param {number} [props.rows=5] - Number of skeleton rows/cards to render
 */
export function GsapDataLoader({ type = "table", message = "Memuat data...", rows = 5 }) {
  const containerRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // 1. Rotate & pulse loading brand icon infinitely
      if (iconRef.current) {
        gsap.to(iconRef.current, {
          rotation: 360,
          duration: 2.5,
          repeat: -1,
          ease: "linear",
        });

        gsap.to(iconRef.current, {
          scale: 1.15,
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // 2. Continuous GSAP shimmer pulse on skeleton items
      const skeletons = el.querySelectorAll(".gsap-skeleton");
      if (skeletons.length > 0) {
        gsap.fromTo(
          skeletons,
          { opacity: 0.35, scale: 0.99 },
          {
            opacity: 0.85,
            scale: 1,
            duration: 0.85,
            stagger: 0.04,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          }
        );
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="w-full space-y-6 py-4 animate-in fade-in duration-300">
      {/* Brand GSAP Loader Header */}
      <div className="flex items-center justify-center gap-3 py-4">
        <div
          ref={iconRef}
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary via-brand-via to-brand-to flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25"
        >
          <Cat className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 font-extrabold text-xs text-muted-foreground uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>{message}</span>
        </div>
      </div>

      {/* Render Skeletons based on type */}
      {type === "dashboard" && (
        <div className="space-y-6">
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="gsap-skeleton h-32 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl p-6 space-y-3"
              >
                <div className="h-4 bg-muted dark:bg-zinc-800 rounded-full w-24" />
                <div className="h-8 bg-muted dark:bg-zinc-800 rounded-xl w-36" />
              </div>
            ))}
          </div>

          {/* Cards & Table Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 gsap-skeleton h-96 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="h-6 bg-muted dark:bg-zinc-800 rounded-xl w-48" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4].map((r) => (
                  <div key={r} className="h-12 bg-muted/60 dark:bg-zinc-800/60 rounded-2xl w-full" />
                ))}
              </div>
            </div>
            <div className="gsap-skeleton h-96 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="h-6 bg-muted dark:bg-zinc-800 rounded-xl w-32" />
              <div className="h-64 bg-muted/60 dark:bg-zinc-800/60 rounded-2xl w-full" />
            </div>
          </div>
        </div>
      )}

      {type === "table" && (
        <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2">
            <div className="gsap-skeleton h-6 bg-muted dark:bg-zinc-800 rounded-xl w-48" />
            <div className="gsap-skeleton h-6 bg-muted dark:bg-zinc-800 rounded-xl w-24" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="gsap-skeleton h-14 bg-muted/40 dark:bg-zinc-800/40 border border-border/50 dark:border-zinc-800/50 rounded-2xl w-full flex items-center px-4 justify-between"
              >
                <div className="h-4 bg-muted dark:bg-zinc-700 rounded-full w-1/4" />
                <div className="h-4 bg-muted dark:bg-zinc-700 rounded-full w-1/6" />
                <div className="h-4 bg-muted dark:bg-zinc-700 rounded-full w-1/5" />
                <div className="h-6 bg-muted dark:bg-zinc-700 rounded-xl w-20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {type === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="gsap-skeleton bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-6 rounded-3xl space-y-4 h-72 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-6 bg-muted dark:bg-zinc-800 rounded-xl w-2/3" />
                <div className="h-28 bg-muted/60 dark:bg-zinc-800/60 rounded-2xl w-full" />
              </div>
              <div className="h-10 bg-muted dark:bg-zinc-800 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {type === "detail" && (
        <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="gsap-skeleton h-8 bg-muted dark:bg-zinc-800 rounded-xl w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="gsap-skeleton h-64 bg-muted/60 dark:bg-zinc-800/60 rounded-2xl" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="gsap-skeleton h-8 bg-muted/60 dark:bg-zinc-800/60 rounded-xl w-full" />
              ))}
            </div>
          </div>
        </div>
      )}

      {type === "simple" && (
        <div className="space-y-3 py-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="gsap-skeleton h-12 bg-muted/50 dark:bg-zinc-800/50 rounded-2xl w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
