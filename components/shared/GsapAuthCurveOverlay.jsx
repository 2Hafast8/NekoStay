"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { gsap } from "gsap";

/**
 * GsapAuthCurveOverlay — Dynamic SVG Morphing Entrance & Organic Blake Bowen Curve Swipe Transition.
 * Rebuilt using Blake Bowen's multi-point Bezier liquid wave generator algorithm for button clicks & page navigation.
 */
export const GsapAuthCurveOverlay = forwardRef(function GsapAuthCurveOverlay(
  { onCompleteEntrance },
  ref
) {
  const pathMorphRef = useRef(null);
  const pathOverlay1Ref = useRef(null);
  const pathOverlay2Ref = useRef(null);
  const svgOverlayRef = useRef(null);

  const hasRunEntranceRef = useRef(false);
  const onCompleteRef = useRef(onCompleteEntrance);

  useEffect(() => {
    onCompleteRef.current = onCompleteEntrance;
  }, [onCompleteEntrance]);

  // Exact path definitions matching opening entrance specification
  const D_FLAT_BOTTOM = "M 0 100 V 100 Q 50 100 100 100 V 100 z";
  const D_CURVE_START = "M 0 100 V 50 Q 50 0 100 50 V 100 z";
  const D_FULL_END    = "M 0 100 V 0 Q 50 0 100 0 V 100 z";

  // Blake Bowen organic curve swipe implementation for button clicks
  const triggerCurveSwipe = (onComplete) => {
    const p1 = pathOverlay1Ref.current;
    const p2 = pathOverlay2Ref.current;
    if (!p1 || !p2) {
      if (onComplete) onComplete();
      return;
    }

    if (svgOverlayRef.current) {
      svgOverlayRef.current.style.visibility = "visible";
    }

    const numPoints = 10;
    const paths = [p1, p2];
    const numPaths = paths.length;
    const delayPointsMax = 0.3;
    const delayPerPath = 0.25;

    let pointsDelay = [];
    let allPoints = [];

    for (let i = 0; i < numPaths; i++) {
      let points = [];
      allPoints.push(points);
      for (let j = 0; j < numPoints; j++) {
        points.push(100);
      }
    }

    for (let i = 0; i < numPoints; i++) {
      pointsDelay[i] = Math.random() * delayPointsMax;
    }

    const renderWave = (isOpened) => {
      for (let i = 0; i < numPaths; i++) {
        let path = paths[i];
        let points = allPoints[i];

        if (!path) continue;

        let d = "";
        d += isOpened ? `M 0 0 V ${points[0]} C` : `M 0 ${points[0]} C`;

        for (let j = 0; j < numPoints - 1; j++) {
          let p = ((j + 1) / (numPoints - 1)) * 100;
          let cp = p - (1 / (numPoints - 1) * 100) / 2;
          d += ` ${cp} ${points[j]} ${cp} ${points[j + 1]} ${p} ${points[j + 1]}`;
        }

        d += isOpened ? ` V 100 H 0` : ` V 0 H 0`;
        path.setAttribute("d", d);
      }
    };

    // Construct GSAP timeline for organic wave swipe
    const tl = gsap.timeline({
      onUpdate: () => renderWave(true),
      onComplete: () => {
        if (onComplete) onComplete();
      },
      defaults: {
        ease: "power2.inOut",
        duration: 0.9,
      },
    });

    for (let i = 0; i < numPaths; i++) {
      let points = allPoints[i];
      let pathDelay = delayPerPath * i;

      for (let j = 0; j < numPoints; j++) {
        let delay = pointsDelay[j];
        tl.to(
          points,
          {
            [j]: 0,
          },
          delay + pathDelay
        );
      }
    }
  };

  useImperativeHandle(ref, () => ({
    triggerCurveSwipe,
  }));

  useEffect(() => {
    // Dynamic Morphing Entrance on initial page load / refresh (unveils DOWN: D_FULL_END -> D_CURVE_START -> D_FLAT_BOTTOM)
    if (hasRunEntranceRef.current) return;
    hasRunEntranceRef.current = true;

    const pMorph = pathMorphRef.current;
    if (!pMorph) return;

    gsap.set(pMorph, { attr: { d: D_FULL_END }, visibility: "visible" });

    const tl = gsap.timeline({
      delay: 0.05,
      onComplete: () => {
        gsap.set(pMorph, { visibility: "hidden" });
        if (onCompleteRef.current) onCompleteRef.current();
      },
    });

    tl.to(pMorph, {
      duration: 0.5,
      attr: { d: D_CURVE_START },
      ease: "power2.in",
    }).to(pMorph, {
      duration: 0.4,
      attr: { d: D_FLAT_BOTTOM },
      ease: "power2.out",
    });
  }, []);

  return (
    <>
      {/* 1. Dynamic Morphing Entrance Layer */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-50 transition"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <linearGradient
            id="grad"
            x1="0"
            y1="0"
            x2="99"
            y2="99"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.2" stopColor="rgb(255, 135, 9)" />
            <stop offset="0.7" stopColor="rgb(247, 189, 248)" />
          </linearGradient>
        </defs>
        <path
          ref={pathMorphRef}
          className="path"
          stroke="url(#grad)"
          fill="url(#grad)"
          strokeWidth="2px"
          vectorEffect="non-scaling-stroke"
          d={D_FULL_END}
        />
      </svg>

      {/* 2. Blake Bowen Organic Dynamic Curve Swipe Multi-Layer Wave Overlay */}
      <svg
        ref={svgOverlayRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-50 shape-overlays"
        style={{ visibility: "hidden" }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* orange crush */}
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff8709" />
            <stop offset="100%" stopColor="#f7bdf8" />
          </linearGradient>
          {/* svg gradient */}
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffd9b0" />
            <stop offset="100%" stopColor="#ff8709" />
          </linearGradient>
        </defs>
        <path
          ref={pathOverlay1Ref}
          className="shape-overlays__path"
          fill="url(#gradient2)"
        />
        <path
          ref={pathOverlay2Ref}
          className="shape-overlays__path"
          fill="url(#gradient1)"
        />
      </svg>
    </>
  );
});
