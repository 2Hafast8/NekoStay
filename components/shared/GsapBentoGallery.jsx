"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { Cat } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, Flip);

export const DEFAULT_BENTO_IMAGES = [
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1561948955-570b270e7c36?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=1000&auto=format&fit=crop",
];

/**
 * GsapBentoGallery — Reversed Scrubbed Bento Gallery with anime.js Opening Logo Reveal:
 * - Starts in full-screen zoomed state featuring an anime.js animated medium-large NekoStay logo & title overlay.
 * - As the user scrolls down, the logo overlay fades out and the images zoom OUT into the 8-item compact Bento grid layout.
 * - Pinned at opening of Landing Page on Desktop (hidden on mobile).
 */
export function GsapBentoGallery({ images = DEFAULT_BENTO_IMAGES }) {
  const wrapRef = useRef(null);
  const galleryRef = useRef(null);
  const logoOverlayRef = useRef(null);

  const displayImages =
    Array.isArray(images) && images.length >= 8
      ? images.slice(0, 8)
      : DEFAULT_BENTO_IMAGES;

  // Trigger Anime.js Opening Logo Reveal Animation
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth < 768) return;

    import("animejs").then(({ animate }) => {
      if (!logoOverlayRef.current) return;

      animate(".bento-logo-icon", {
        scale: [0.2, 1],
        opacity: [0, 1],
        rotate: ["-20deg", "0deg"],
        duration: 1100,
        ease: "outBack",
      });

      animate(".bento-logo-title", {
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 950,
        delay: 220,
        ease: "outExpo",
      });

      animate(".bento-logo-sub", {
        translateY: [25, 0],
        opacity: [0, 1],
        duration: 850,
        delay: 420,
        ease: "outExpo",
      });
    });
  }, []);

  useEffect(() => {
    // Hidden on Mobile/HP devices
    if (typeof window === "undefined" || window.innerWidth < 768) return;

    const galleryElement = galleryRef.current;
    if (!galleryElement) return;

    const galleryItems = galleryElement.querySelectorAll(".gallery__item");
    if (galleryItems.length === 0) return;

    let flipCtx;

    const createTween = () => {
      flipCtx && flipCtx.revert();

      // Set initial full-screen zoomed class to capture initial state
      galleryElement.classList.add("gallery--final");

      flipCtx = gsap.context(() => {
        // 1. Capture full-screen zoomed state
        const initialZoomedState = Flip.getState(galleryItems);

        // 2. Remove gallery--final so target DOM layout is compact Bento grid
        galleryElement.classList.remove("gallery--final");

        // 3. Create Flip animation FROM zoomed state TO compact Bento grid
        const flip = Flip.from(initialZoomedState, {
          simple: true,
          ease: "expoScale(5, 1)",
        });

        // 4. Create scrubbed ScrollTrigger timeline
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: galleryElement,
            start: "center center",
            end: "+=100%",
            scrub: true,
            pin: galleryElement.parentNode,
            onUpdate: (self) => {
              // Fade out Anime.js logo overlay as user scrolls down
              if (logoOverlayRef.current) {
                const fadeOpacity = Math.max(0, 1 - self.progress * 3.5);
                gsap.to(logoOverlayRef.current, {
                  opacity: fadeOpacity,
                  y: -self.progress * 80,
                  scale: 1 - self.progress * 0.15,
                  duration: 0.1,
                  overwrite: "auto",
                });
              }

              const navbar = document.querySelector("header");
              if (navbar) {
                if (self.progress > 0.05 && self.progress < 0.95) {
                  gsap.to(navbar, {
                    yPercent: -120,
                    opacity: 0,
                    duration: 0.25,
                    ease: "power2.out",
                  });
                } else {
                  gsap.to(navbar, {
                    yPercent: 0,
                    opacity: 1,
                    duration: 0.25,
                    ease: "power2.out",
                  });
                }
              }
            },
            onLeave: () => {
              const navbar = document.querySelector("header");
              if (navbar)
                gsap.to(navbar, {
                  yPercent: 0,
                  opacity: 1,
                  duration: 0.3,
                  ease: "power2.out",
                });
            },
            onLeaveBack: () => {
              const navbar = document.querySelector("header");
              if (navbar)
                gsap.to(navbar, {
                  yPercent: 0,
                  opacity: 1,
                  duration: 0.3,
                  ease: "power2.out",
                });
            },
          },
        });

        tl.add(flip);
        return () => gsap.set(galleryItems, { clearProps: "all" });
      });
    };

    createTween();

    window.addEventListener("resize", createTween);
    return () => {
      window.removeEventListener("resize", createTween);
      flipCtx && flipCtx.revert();
    };
  }, [displayImages]);

  return (
    <div
      ref={wrapRef}
      className="hidden md:flex gallery-wrap relative w-full h-screen items-center justify-center overflow-hidden bg-background border-b border-border/40"
    >
      {/* Anime.js Initial Logo & Brand Name Overlay (Medium-Large Size) */}
      <div
        ref={logoOverlayRef}
        className="absolute z-30 inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center bg-black/30 backdrop-blur-[2px] transition-all"
      >
        <div className="bento-logo-icon flex items-center justify-center p-5 rounded-3xl bg-primary/20 backdrop-blur-xl border border-primary/30 shadow-2xl mb-4 text-primary opacity-0">
          <Cat className="w-14 h-14 sm:w-16 sm:h-16 text-primary" />
        </div>
        <h1 className="bento-logo-title text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-xl flex items-center gap-2 opacity-0">
          <span>Neko</span>
          <span className="text-primary">Stay</span>
        </h1>
        <p className="bento-logo-sub text-xs sm:text-sm font-bold text-white/90 bg-black/50 backdrop-blur-md px-5 py-2 rounded-full mt-3 border border-white/20 tracking-widest uppercase opacity-0 shadow-lg">
          Premium Cat Boarding & Care
        </p>
      </div>

      <div
        ref={galleryRef}
        id="gallery-8"
        className="gallery gallery--bento gallery--switch relative w-full h-full flex-none"
      >
        {displayImages.map((imgUrl, idx) => (
          <div
            key={idx}
            className="gallery__item overflow-hidden rounded-3xl shadow-lg border border-border/40 bg-muted/20"
          >
            <img
              src={imgUrl}
              alt={`NekoStay Bento ${idx + 1}`}
              className="w-full h-full object-cover brightness-[0.85]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
