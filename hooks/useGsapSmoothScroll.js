"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * useGsapSmoothScroll — Smooth scrolling & GSAP ScrollTrigger sync hook.
 * Exclusively used on Landing Page wrapper (#smooth-wrapper & #smooth-content).
 *
 * @param {Object} options
 * @param {number} [options.duration=1.2] - Smooth scroll duration
 */
export function useGsapSmoothScroll(options = {}) {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    // Initialize Lenis smooth scroller for landing page
    const lenis = new Lenis({
      duration: options.duration || 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth cubic easeOut
      direction: "vertical",
      gestureDirection: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      smoothTouch: false,
    });

    lenisRef.current = lenis;

    // Sync Lenis scroll updates with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    const updateRaf = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateRaf);
    gsap.ticker.lagSmoothing(0);

    // Smooth scroll positions for inner anchor links (e.g. #services, #faqs, #why-us)
    const handleAnchorClick = (e) => {
      const target = e.target.closest("a[href^='#']");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href === "#") return;

      const targetEl = document.querySelector(href);
      if (targetEl) {
        e.preventDefault();
        lenis.scrollTo(targetEl, {
          offset: -80, // Offset header
          duration: 1.4,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      gsap.ticker.remove(updateRaf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [options.duration]);

  const scrollTo = (target, customOptions = {}) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: customOptions.offset ?? -80,
        duration: customOptions.duration ?? 1.4,
        ...customOptions,
      });
    }
  };

  return { lenis: lenisRef.current, scrollTo };
}
