import { useCallback, useEffect, useRef, useState } from "react";

/**
 * RTS Intro Animation
 *
 * Timing:
 *  0 ms        → Component mounts, before image appears instantly
 *  0–200ms     → Hold on dark silhouette (before image)
 *  200–400ms   → Beacon rotation begins — sweep bar starts moving left → right
 *  400–1800ms  → Blue light sweep traverses the logo (1.4s = within 1.5–2s window)
 *  500ms       → After image begins cross-fading in (mid-sweep)
 *  1800ms      → Sweep complete, after image fully revealed
 *  1800–4800ms → Hold on after image (3 full seconds)
 *  4800–5400ms → Fade entire screen to black → onComplete fires
 */

const HOLD_BEFORE_MS = 200;
const SWEEP_DURATION_MS = 1600; // beacon sweep duration
const AFTER_FADE_START_OFFSET = 300; // ms after sweep starts before after-image fades
const AFTER_FADE_DURATION_MS = 1300;
const HOLD_AFTER_MS = 3000;
const FADE_OUT_MS = 600;

export default function RTSIntroScreen({
  onComplete,
}: { onComplete: () => void }) {
  const [sweepActive, setSweepActive] = useState(false);
  const [afterOpacity, setAfterOpacity] = useState(0);
  const [screenOpacity, setScreenOpacity] = useState(1);
  const [beaconRotation, setBeaconRotation] = useState(0);
  // Background fill: #030816 during dark before-phase, transitions to #060F21 as reveal starts
  const [bgColor, setBgColor] = useState("#030816");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const rafRef = useRef<number>(0);
  const rotStartRef = useRef<number>(0);

  // Set document/body background on mount and clean up on unmount
  useEffect(() => {
    document.documentElement.style.backgroundColor = "#030816";
    document.body.style.backgroundColor = "#030816";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Animate beacon rotation during sweep
  const animateBeacon = useCallback((startTime: number) => {
    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed < SWEEP_DURATION_MS) {
        // Rotate ~200° over the sweep duration (implies beacon pointing forward then away)
        setBeaconRotation((elapsed / SWEEP_DURATION_MS) * 200);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setBeaconRotation(200);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Preload both images for instant display
    const imgBefore = new Image();
    const imgAfter = new Image();
    imgBefore.src = "/assets/rts_intro_before.png";
    imgAfter.src = "/assets/rts_intro_after.png";
    void imgBefore;
    void imgAfter;

    // Phase 1: Hold on silhouette
    const t1 = setTimeout(() => {
      if (cancelled) return;

      // Transition background fill from before-color (#030816) to after-color (#060F21)
      // as the sweep begins — by hold time it will be fully #060F21
      setBgColor("#060F21");
      document.documentElement.style.backgroundColor = "#060F21";
      document.body.style.backgroundColor = "#060F21";

      // Start sweep overlay + beacon rotation
      setSweepActive(true);
      rotStartRef.current = performance.now();
      animateBeacon(performance.now());

      // After-image starts fading in partway through the sweep
      const t2 = setTimeout(() => {
        if (cancelled) return;
        setAfterOpacity(1);
      }, AFTER_FADE_START_OFFSET);

      // Phase 3: Sweep done → hold for 3s
      const t3 = setTimeout(() => {
        if (cancelled) return;
        setSweepActive(false);

        // Phase 4: Fade out entire screen
        const t4 = setTimeout(() => {
          if (cancelled) return;
          setScreenOpacity(0);
          const t5 = setTimeout(() => {
            if (!cancelled) onCompleteRef.current();
          }, FADE_OUT_MS + 50);
          return () => clearTimeout(t5);
        }, HOLD_AFTER_MS);

        return () => clearTimeout(t4);
      }, SWEEP_DURATION_MS);

      return () => {
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }, HOLD_BEFORE_MS);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animateBeacon]);

  return (
    <>
      <style>{`
        @keyframes rts-sweep {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(280%); }
        }
        @keyframes rts-beacon-pulse {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.18); }
        }
        .rts-sweep-bar {
          animation: rts-sweep ${SWEEP_DURATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .rts-beacon-pulse {
          animation: rts-beacon-pulse 0.7s ease-in-out infinite;
        }
      `}</style>

      {/* Full-screen fade wrapper — controls final fade-out opacity only */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "hidden",
          opacity: screenOpacity,
          // Use separate transition declarations to avoid shorthand conflicts:
          // opacity fades on exit; background-color transitions during reveal
          backgroundColor: bgColor,
          transition: `opacity ${FADE_OUT_MS}ms ease-out, background-color 1600ms ease-in-out`,
        }}
      >
        {/* Before image — contained, centered, no crop */}
        <img
          src="/assets/rts_intro_before.png"
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center center",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
            margin: 0,
            padding: 0,
            border: "none",
          }}
        />

        {/* After image — contained, centered, no crop, cross-fades in */}
        <img
          src="/assets/rts_intro_after.png"
          alt="Ramp Track Systems"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center center",
            display: "block",
            opacity: afterOpacity,
            transition: `opacity ${AFTER_FADE_DURATION_MS}ms ease-in-out`,
            userSelect: "none",
            pointerEvents: "none",
            margin: 0,
            padding: 0,
            border: "none",
          }}
        />

        {/* Blue beacon light sweep bar — travels left to right across logo */}
        {sweepActive && (
          <div
            aria-hidden="true"
            className="rts-sweep-bar"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "35%",
              background: [
                "linear-gradient(to right,",
                "  transparent 0%,",
                "  rgba(0, 100, 200, 0.08) 15%,",
                "  rgba(0, 130, 220, 0.30) 38%,",
                "  rgba(30, 160, 255, 0.50) 52%,",
                "  rgba(0, 130, 220, 0.30) 66%,",
                "  rgba(0, 100, 200, 0.08) 85%,",
                "  transparent 100%",
                ")",
              ].join(""),
              pointerEvents: "none",
              mixBlendMode: "screen" as const,
            }}
          />
        )}

        {/* Beacon glow — rotating light source at approximate tug roof position */}
        {sweepActive && (
          <>
            {/* Rotating conic beam */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "50%",
                top: "32%",
                width: "160px",
                height: "160px",
                transform: `translate(-50%, -50%) rotate(${beaconRotation}deg)`,
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(0, 150, 255, 0.18) 25deg, rgba(0, 180, 255, 0.28) 40deg, rgba(0, 150, 255, 0.18) 55deg, transparent 80deg)",
                borderRadius: "50%",
                pointerEvents: "none",
                mixBlendMode: "screen" as const,
              }}
            />

            {/* Beacon core glow point */}
            <div
              aria-hidden="true"
              className="rts-beacon-pulse"
              style={{
                position: "absolute",
                left: "50%",
                top: "32%",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(100, 200, 255, 0.90) 0%, rgba(0, 140, 255, 0.55) 45%, transparent 75%)",
                pointerEvents: "none",
                mixBlendMode: "screen" as const,
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
