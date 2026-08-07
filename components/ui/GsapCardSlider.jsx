"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";

export function GsapCardSlider({ items = [], renderItem, className = "" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);

  const total = items.length;

  const updateCardPositions = useCallback(() => {
    if (!cardsRef.current || total === 0) return;

    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      // Calculate distance relative to activeIndex considering wrapping
      let diff = index - activeIndex;

      // Normalize diff for circular loop if total > 2
      if (total > 2) {
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;
      }

      const isActive = diff === 0;
      const isPrev = diff === -1 || (activeIndex === 0 && index === total - 1 && total > 2);
      const isNext = diff === 1 || (activeIndex === total - 1 && index === 0 && total > 2);

      let xPercent = 0;
      let scale = 0.82;
      let opacity = 0.4;
      let zIndex = 1;

      if (isActive) {
        xPercent = 0;
        scale = 1;
        opacity = 1;
        zIndex = 20;
      } else if (diff === 1) {
        xPercent = 75;
        scale = 0.88;
        opacity = 0.65;
        zIndex = 10;
      } else if (diff === -1) {
        xPercent = -75;
        scale = 0.88;
        opacity = 0.65;
        zIndex = 10;
      } else if (diff > 1) {
        xPercent = 140;
        scale = 0.75;
        opacity = 0;
        zIndex = 1;
      } else if (diff < -1) {
        xPercent = -140;
        scale = 0.75;
        opacity = 0;
        zIndex = 1;
      }

      gsap.to(card, {
        xPercent,
        scale,
        opacity,
        zIndex,
        duration: 0.45,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  }, [activeIndex, total]);

  useEffect(() => {
    updateCardPositions();
  }, [activeIndex, updateCardPositions]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  // Touch / Drag Navigation Handlers
  const handleTouchStart = (e) => {
    dragStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
  };

  const handleTouchEnd = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const deltaX = endX - dragStartX.current;

    if (deltaX < -40) {
      handleNext();
    } else if (deltaX > 40) {
      handlePrev();
    }
  };

  if (total === 0) return null;

  return (
    <div className={`relative w-full overflow-hidden py-8 select-none ${className}`}>
      {/* Slider Stage Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        className="relative w-full min-h-[460px] sm:min-h-[480px] flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        {items.map((item, index) => (
          <div
            key={item.id || item.name || index}
            ref={(el) => (cardsRef.current[index] = el)}
            className="absolute w-[88%] max-w-[380px] sm:max-w-[420px] transition-shadow duration-300"
            style={{
              transformOrigin: "center center",
              willChange: "transform, opacity",
            }}
          >
            {renderItem(item, index, index === activeIndex)}
          </div>
        ))}
      </div>

      {/* Navigation Controls: Prev / Next Buttons & Indicators */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="p-3 rounded-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 text-foreground dark:text-zinc-200 hover:bg-primary hover:text-primary-foreground transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dots Indicator */}
        <div className="flex items-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? "w-8 bg-primary shadow-xs shadow-primary/30"
                  : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Slide"
          className="p-3 rounded-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 text-foreground dark:text-zinc-200 hover:bg-primary hover:text-primary-foreground transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
