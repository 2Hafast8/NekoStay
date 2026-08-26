"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * GsapDashboardCurveUnveil — Plays Blake Bowen organic curve wave unveil strictly 1 time right after login on User & Admin dashboards.
 * Does not re-trigger on page refresh.
 */
export function GsapDashboardCurveUnveil() {
  const pathOverlay1Ref = useRef(null);
  const pathOverlay2Ref = useRef(null);
  const svgOverlayRef = useRef(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // Check if user just logged in
    if (typeof window !== "undefined") {
      const justLoggedIn = sessionStorage.getItem("just_logged_in");
      if (justLoggedIn === "true") {
        // Clear flag immediately so it won't repeat on refresh
        sessionStorage.removeItem("just_logged_in");
        setShouldAnimate(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!shouldAnimate) return;

    const p1 = pathOverlay1Ref.current;
    const p2 = pathOverlay2Ref.current;
    const svgEl = svgOverlayRef.current;
    if (!p1 || !p2 || !svgEl) return;

    svgEl.style.visibility = "visible";

    const numPoints = 10;
    const paths = [p1, p2];
    const numPaths = paths.length;
    const delayPointsMax = 0.3;
    const delayPerPath = 0.25;

    let pointsDelay = [];
    let allPoints = [];

    // Initial state: 0 (full screen cover)
    for (let i = 0; i < numPaths; i++) {
      let points = [];
      allPoints.push(points);
      for (let j = 0; j < numPoints; j++) {
        points.push(0);
      }
    }

    for (let i = 0; i < numPoints; i++) {
      pointsDelay[i] = Math.random() * delayPointsMax;
    }

    const renderWave = () => {
      for (let i = 0; i < numPaths; i++) {
        let path = paths[i];
        let points = allPoints[i];
        if (!path) continue;

        let d = `M 0 0 V ${points[0]} C`;

        for (let j = 0; j < numPoints - 1; j++) {
          let p = ((j + 1) / (numPoints - 1)) * 100;
          let cp = p - (1 / (numPoints - 1) * 100) / 2;
          d += ` ${cp} ${points[j]} ${cp} ${points[j + 1]} ${p} ${points[j + 1]}`;
        }

        d += ` V 100 H 0`;
        path.setAttribute("d", d);
      }
    };

    // Render initial full cover
    renderWave();

    // Construct GSAP timeline to unveil (points from 0 to 100)
    const tl = gsap.timeline({
      delay: 0.05,
      onUpdate: renderWave,
      onComplete: () => {
        gsap.set(svgEl, { visibility: "hidden" });
      },
      defaults: {
        ease: "power2.inOut",
        duration: 0.85,
      },
    });

    for (let i = 0; i < numPaths; i++) {
      let points = allPoints[i];
      let pathDelay = delayPerPath * (numPaths - i - 1);

      for (let j = 0; j < numPoints; j++) {
        let delay = pointsDelay[j];
        tl.to(
          points,
          {
            [j]: 100,
          },
          delay + pathDelay
        );
      }
    }
  }, [shouldAnimate]);

  if (!shouldAnimate) return null;

  return (
    <svg
      ref={svgOverlayRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50 shape-overlays"
      style={{ visibility: "visible" }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        {/* orange crush */}
        <linearGradient id="dashGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff8709" />
          <stop offset="100%" stopColor="#f7bdf8" />
        </linearGradient>
        {/* svg gradient */}
        <linearGradient id="dashGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffd9b0" />
          <stop offset="100%" stopColor="#ff8709" />
        </linearGradient>
      </defs>
      <path
        ref={pathOverlay1Ref}
        className="shape-overlays__path"
        fill="url(#dashGrad2)"
      />
      <path
        ref={pathOverlay2Ref}
        className="shape-overlays__path"
        fill="url(#dashGrad1)"
      />
    </svg>
  );
}
