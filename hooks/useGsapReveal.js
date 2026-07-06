"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * useGsapReveal — Animates elements into view when they enter the viewport.
 * Supports stagger, custom easing, and respects prefers-reduced-motion.
 *
 * @param {React.RefObject} containerRef - Ref to the container wrapping the animated elements
 * @param {Object} options
 * @param {string}  [options.selector]   - CSS selector for children to animate (default: "> *")
 * @param {number}  [options.y]          - Initial Y offset in px (default: 36)
 * @param {number}  [options.opacity]    - Initial opacity (default: 0)
 * @param {number}  [options.scale]      - Initial scale (default: 1, set < 1 for scale-in)
 * @param {number}  [options.duration]   - Animation duration in seconds (default: 0.65)
 * @param {number}  [options.stagger]    - Stagger delay between children (default: 0.1)
 * @param {number}  [options.delay]      - Delay before animation starts (default: 0)
 * @param {string}  [options.ease]       - GSAP ease string (default: "power3.out")
 * @param {string}  [options.start]      - ScrollTrigger start (default: "top 88%")
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
    ease = "power3.out",
    start = "top 88%",
    once = true,
  } = options;

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const el = containerRef?.current;
    if (!el) return;

    const targets = el.querySelectorAll(selector);
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { y, opacity, scale },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration,
          stagger,
          delay,
          ease,
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: once
              ? "play none none none"
              : "play none none reverse",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [containerRef.current, selector, y, opacity, scale, duration, stagger, delay, ease, start, once, ...deps]);
}

/**
 * useGsapCounter — Animates a number counting up when element enters viewport.
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

    const ctx = gsap.context(() => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none none",
        },
        onUpdate() {
          el.textContent =
            prefix + obj.val.toFixed(decimals) + suffix;
        },
      });
    }, el);

    return () => ctx.revert();
  }, [ref, target, options]);
}
