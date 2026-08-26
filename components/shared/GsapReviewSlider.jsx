"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Star, Quote } from "lucide-react";

/**
 * GsapReviewSlider — GSAP automated horizontal scrolling carousel for user reviews.
 * Rotates subset of max 6 reviews every 30 minutes with pause-on-hover.
 */
export function GsapReviewSlider({ reviews = [], currentLanguage = "id" }) {
  const trackRef = useRef(null);
  const tweenRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !reviews.length) return;

    const ctx = gsap.context(() => {
      // Create seamless infinite horizontal scrolling tween
      const tween = gsap.to(track, {
        xPercent: -50,
        ease: "none",
        duration: 25, // smooth scrolling speed
        repeat: -1,
      });

      tweenRef.current = tween;
    }, track);

    return () => ctx.revert();
  }, [reviews]);

  const handleMouseEnter = () => {
    if (tweenRef.current) tweenRef.current.pause();
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) tweenRef.current.play();
  };

  if (!reviews.length) return null;

  // Duplicate items for seamless 100% continuous horizontal looping
  const doubleReviews = [...reviews, ...reviews];

  return (
    <div
      className="relative w-full overflow-hidden py-4 select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left & Right gradient fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-card dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-card dark:from-zinc-950 to-transparent z-10 pointer-events-none" />

      {/* GSAP Animated Track */}
      <div ref={trackRef} className="flex gap-6 w-max">
        {doubleReviews.map((rev, idx) => (
          <div
            key={`${rev.id}-${idx}`}
            className="w-[300px] sm:w-[360px] shrink-0 p-6 bg-background dark:bg-zinc-900/80 border border-border dark:border-zinc-800 rounded-3xl space-y-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 group cursor-pointer"
          >
            {/* Header: Rating & Quote Icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rev.rating
                        ? "fill-amber-500 text-amber-500"
                        : "text-zinc-300 dark:text-zinc-700"
                    }`}
                  />
                ))}
              </div>
              <Quote className="w-5 h-5 text-primary/30 group-hover:text-primary transition-colors" />
            </div>

            {/* Review Content */}
            <p className="text-xs sm:text-sm italic text-muted-foreground dark:text-zinc-300 leading-relaxed line-clamp-3 min-h-[56px]">
              "{rev.review_text}"
            </p>

            {/* Author Footer */}
            <div className="border-t border-border/60 dark:border-zinc-800/60 pt-3 flex justify-between items-center text-xs">
              <span className="font-extrabold text-foreground dark:text-zinc-100">
                {rev.profiles?.full_name || "Tamu Neko"}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground dark:text-zinc-400">
                {new Date(rev.created_at).toLocaleDateString(
                  currentLanguage === "en" ? "en-US" : "id-ID",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
