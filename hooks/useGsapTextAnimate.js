"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(TextPlugin);
}

/**
 * useGsapTextAnimate — Hook to animate text replacement on a target ref using GSAP TextPlugin.
 *
 * @param {React.RefObject} targetRef - Ref of element whose textContent will be replaced
 * @param {string} targetText - The target text to animate to
 * @param {Object} [options]
 * @param {number} [options.duration=0.6] - Duration in seconds
 * @param {string} [options.type="diff"] - Replacement type ("diff" | "words" | "chars")
 * @param {string} [options.ease="sine.inOut"] - Easing function
 */
export function useGsapTextAnimate(targetRef, targetText, options = {}) {
  const { duration = 0.6, type = "diff", ease = "sine.inOut" } = options;
  const prevTextRef = useRef(targetText);

  useEffect(() => {
    const el = targetRef?.current;
    if (!el || !targetText) return;

    if (prevTextRef.current !== targetText) {
      gsap.to(el, {
        duration,
        text: {
          value: targetText,
          type,
        },
        ease,
      });
      prevTextRef.current = targetText;
    }
  }, [targetRef, targetText, duration, type, ease]);
}
