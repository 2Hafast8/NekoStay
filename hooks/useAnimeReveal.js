"use client";

import { useEffect } from "react";
import { animate, utils } from "animejs";

/**
 * Custom Hook for triggering Anime.js reveal animations when elements scroll into view.
 * @param {React.RefObject} containerRef - Reference to container element
 * @param {Object} options - Animation configuration options
 * @param {string} options.selector - CSS selector for target child elements
 * @param {number} options.translateY - Initial Y offset (default: 30)
 * @param {number} options.stagger - Delay between items in ms (default: 80)
 * @param {number} options.duration - Duration in ms (default: 800)
 * @param {string} options.easing - Easing name (default: 'easeOutCubic')
 * @param {Array} deps - Dependency array to re-run observer
 */
export function useAnimeReveal(
  containerRef,
  options = {},
  deps = []
) {
  const {
    selector = ".anim-item",
    translateY = 30,
    stagger = 80,
    duration = 800,
    easing = "easeOutCubic",
    threshold = 0.15,
  } = options;

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const container = containerRef.current;
    const elements = selector ? container.querySelectorAll(selector) : [container];

    if (!elements || elements.length === 0) return;

    // Set initial hidden styles
    elements.forEach((el) => {
      if (!el.dataset.animeRevealed) {
        el.style.opacity = "0";
        el.style.transform = `translateY(${translateY}px)`;
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targetsToAnimate = [];

            if (selector) {
              const children = entry.target.querySelectorAll(selector);
              children.forEach((child) => {
                if (!child.dataset.animeRevealed) {
                  child.dataset.animeRevealed = "true";
                  targetsToAnimate.push(child);
                }
              });
            } else if (!entry.target.dataset.animeRevealed) {
              entry.target.dataset.animeRevealed = "true";
              targetsToAnimate.push(entry.target);
            }

            if (targetsToAnimate.length > 0) {
              animate(targetsToAnimate, {
                translateY: [translateY, 0],
                opacity: [0, 1],
                duration,
                easing,
                delay: utils.stagger(stagger),
              });
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [containerRef, selector, translateY, stagger, duration, easing, threshold, ...deps]);
}
