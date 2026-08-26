"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(TextPlugin);
}

/**
 * GsapTextButton — Button component with GSAP Text Replacement animation during loading/submission states.
 *
 * @param {Object} props
 * @param {boolean} props.isLoading - Whether the button is in loading/submitting state
 * @param {string} props.idleText - Normal button label (e.g. "Simpan Pengaturan")
 * @param {string} [props.loadingText="Memproses..."] - Text during loading state (e.g. "Menyimpan...")
 * @param {string} [props.successText] - Text when action succeeds (e.g. "Tersimpan!")
 * @param {boolean} [props.isSuccess=false] - Temporary success state trigger
 * @param {React.ReactNode} [props.icon] - Optional icon element
 * @param {string} [props.className] - Extra Tailwind styling
 * @param {function} [props.onClick] - Click event handler
 * @param {boolean} [props.disabled] - Disabled flag
 * @param {string} [props.type="button"] - HTML button type
 */
export function GsapTextButton({
  isLoading = false,
  idleText = "Kirim",
  loadingText = "Memproses...",
  successText,
  isSuccess = false,
  icon,
  className = "",
  onClick,
  disabled = false,
  type = "button",
  children,
  ...rest
}) {
  const textRef = useRef(null);
  const prevLoading = useRef(isLoading);
  const prevSuccess = useRef(isSuccess);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    // Detect state changes for GSAP Text Replacement Animation
    if (isLoading && !prevLoading.current) {
      // Transition from idle -> loading with GSAP diff text replacement animation
      gsap.to(el, {
        duration: 0.6,
        text: {
          value: loadingText,
          type: "diff",
        },
        ease: "sine.inOut",
      });
    } else if (!isLoading && prevLoading.current && isSuccess && successText) {
      // Transition from loading -> success
      gsap.to(el, {
        duration: 0.5,
        text: {
          value: successText,
          type: "diff",
        },
        ease: "sine.out",
      });
    } else if (!isLoading && !isSuccess && (prevLoading.current || prevSuccess.current)) {
      // Transition back to idle
      gsap.to(el, {
        duration: 0.4,
        text: {
          value: idleText,
          type: "diff",
        },
        ease: "sine.out",
      });
    }

    prevLoading.current = isLoading;
    prevSuccess.current = isSuccess;
  }, [isLoading, isSuccess, idleText, loadingText, successText]);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...rest}
    >
      {icon && <span className={isLoading ? "animate-spin" : ""}>{icon}</span>}
      <span ref={textRef} className="whitespace-nowrap">
        {isLoading ? loadingText : isSuccess && successText ? successText : idleText}
      </span>
      {children}
    </button>
  );
}
