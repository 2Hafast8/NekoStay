"use client";

import { useEffect } from "react";
import { animate, utils } from "animejs";

/**
 * useGsapReveal — Animates elements into view when they enter the viewport.
 * Now powered by Anime.js + IntersectionObserver (drop-in replacement for the GSAP version).
 *
 * @param {React.RefObject} containerRef - Ref to the container wrapping the animated elements
 * @param {Object} options
 * @param {string}  [options.selector]   - CSS selector for children to animate (default: "> *")
 * @param {number}  [options.y]          - Initial Y offset in px (default: 36)
 * @param {number}  [options.opacity]    - Initial opacity (default: 0)
 * @param {number}  [options.scale]      - Initial scale (default: 1, set < 1 for scale-in)
 * @param {number}  [options.duration]   - Animation duration in seconds (default: 0.65)
 * @param {number}  [options.stagger]    - Stagger delay between children in seconds (default: 0.1)
 * @param {number}  [options.delay]      - Delay before animation starts in seconds (default: 0)
 * @param {string}  [options.start]      - Viewport trigger threshold (kept for API compat, maps to rootMargin)
 * @param {boolean} [options.once]       - Only trigger once (default: true)
 */
export function useGsapReveal(containerRef, options = {}, deps = []) {
  const {
    selector = ":scope > *",
    y = 36,
    opacity = 0,
    scale = 1,
    duration = 0.65,
    stagger = 0.1,
    delay = 0,
    start = "top 88%",
    once = true,
  } = options;

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const el = containerRef?.current;
    if (!el) return;

    const targets = el.querySelectorAll(selector);
    if (!targets.length) return;

    // Parse start string to rootMargin (e.g. "top 88%" → "0px 0px -12% 0px")
    let rootMarginBottom = "-12%";
    const match = start.match(/(\d+)%/);
    if (match) {
      const pct = parseInt(match[1], 10);
      rootMarginBottom = `-${100 - pct}%`;
    }

    // Set initial styles
    targets.forEach((t) => {
      t.style.opacity = String(opacity);
      t.style.transform = `translateY(${y}px) scale(${scale})`;
    });

    let hasAnimated = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!once || !hasAnimated)) {
            hasAnimated = true;

            animate(Array.from(targets), {
              translateY: [y, 0],
              opacity: [opacity, 1],
              scale: [scale, 1],
              duration: duration * 1000,
              delay: utils.stagger(stagger * 1000, { start: delay * 1000 }),
              easing: "easeOutCubic",
              complete: () => {
                // Clean up inline styles after animation
                targets.forEach((t) => {
                  t.style.transform = "";
                  t.style.opacity = "";
                });
              },
            });

            if (once) {
              observer.disconnect();
            }
          }
        });
      },
      {
        rootMargin: `0px 0px ${rootMarginBottom} 0px`,
        threshold: 0,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [containerRef.current, selector, y, opacity, scale, duration, stagger, delay, start, once, ...deps]);
}

/**
 * useGsapCounter — Animates a number counting up when element enters viewport.
 * Now powered by Anime.js + IntersectionObserver.
 *
 * @param {React.RefObject} ref  - Ref to the element whose textContent will be updated
 * @param {number} target        - The final number to count to
 * @param {Object} options
 * @param {string} [options.prefix]   - Text before the number
 * @param {string} [options.suffix]   - Text after the number (e.g. "+", "%")
 * @param {number} [options.decimals] - Decimal places to show (default: 0)
 * @param {number} [options.duration] - Duration in seconds (default: 1.8)
 */
export function useGsapCounter(ref, target, options = {}) {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const el = ref?.current;
    if (!el) return;

    const {
      prefix = "",
      suffix = "",
      decimals = 0,
      duration = 1.8,
    } = options;

    let hasAnimated = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;

            const obj = { val: 0 };
            animate(obj, {
              val: target,
              duration: duration * 1000,
              easing: "easeOutQuad",
              round: decimals === 0 ? 1 : false,
              update: () => {
                el.textContent = prefix + obj.val.toFixed(decimals) + suffix;
              },
            });

            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [ref, target, options]);
}
