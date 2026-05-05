import { useEffect, useState } from "react";

/**
 * RTSIntroScreen — Forward-facing beacon sweep animation
 *
 * Timing:
 *  0–200ms     : Phase 0 — dark hold, no sweep
 *  200–1800ms  : Phase 1 — beacon sweep left→right, 1600ms
 *  1800–4800ms : Phase 2 — final hold on fully revealed image, 3000ms
 *  4800–5200ms : Phase 3 — 400ms fade to black, then onComplete fires
 *
 * All visual elements derive from a single normalized progress value `t` (0→1)
 * driven by a requestAnimationFrame loop.
 */

export default function RTSIntroScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  // sweepProgress: 0→1, drives all visual elements during the sweep
  const [sweepProgress, setSweepProgress] = useState(0);
  // fadeOpacity: 0→1, drives the black overlay during phase 3
  const [fadeOpacity, setFadeOpacity] = useState(0);
  // bgProgress: 0→1, drives background color interpolation
  const [bgProgress, setBgProgress] = useState(0);

  useEffect(() => {
    // Apply matching background to html/body so no color bleed
    document.documentElement.style.background = "#030816";
    document.body.style.background = "#030816";
    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, []);

  useEffect(() => {
    let animFrameId: number;
    let startTime: number | null = null;

    const DARK_HOLD = 200;
    const SWEEP_DURATION = 1600;
    const FINAL_HOLD = 3000;
    const FADE_DURATION = 400;
    const TOTAL = DARK_HOLD + SWEEP_DURATION + FINAL_HOLD + FADE_DURATION;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      if (elapsed < DARK_HOLD) {
        // Phase 0: dark hold — nothing moves
        setSweepProgress(0);
        setFadeOpacity(0);
        setBgProgress(0);
      } else if (elapsed < DARK_HOLD + SWEEP_DURATION) {
        // Phase 1: sweep
        const raw = (elapsed - DARK_HOLD) / SWEEP_DURATION;
        const t = Math.min(1, raw);
        setSweepProgress(t);
        setFadeOpacity(0);
        setBgProgress(t);
      } else if (elapsed < DARK_HOLD + SWEEP_DURATION + FINAL_HOLD) {
        // Phase 2: hold fully revealed
        setSweepProgress(1);
        setFadeOpacity(0);
        setBgProgress(1);
      } else if (elapsed < TOTAL) {
        // Phase 3: fade out
        const ft =
          (elapsed - DARK_HOLD - SWEEP_DURATION - FINAL_HOLD) / FADE_DURATION;
        setSweepProgress(1);
        setFadeOpacity(Math.min(1, ft));
        setBgProgress(1);
      } else {
        // Done
        setFadeOpacity(1);
        onComplete();
        return;
      }
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [onComplete]);

  // ─── Derive visual values from sweepProgress ─────────────────────────────

  const t = sweepProgress;

  // Ease-in-out for sweep position
  const sweepX = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  const isFullyRevealed = t >= 1.0;

  // Light-image mask: linear gradient revealing from left as sweep passes
  const maskStyle: React.CSSProperties = isFullyRevealed
    ? { maskImage: "none", WebkitMaskImage: "none", opacity: 1 }
    : {
        maskImage: `linear-gradient(to right, white 0%, white calc(${Math.max(0, sweepX - 0.05) * 100}%), rgba(255,255,255,0.6) calc(${sweepX * 100}%), transparent calc(${Math.min(1, sweepX + 0.1) * 100}%))`,
        WebkitMaskImage: `linear-gradient(to right, white 0%, white calc(${Math.max(0, sweepX - 0.05) * 100}%), rgba(255,255,255,0.6) calc(${sweepX * 100}%), transparent calc(${Math.min(1, sweepX + 0.1) * 100}%))`,
        opacity: 1,
      };

  // Cone opacity: peaks at midpoint of sweep
  const coneOpacity = Math.sin(t * Math.PI) * 0.6;

  // Vertical beam opacity
  const beamOpacity = Math.sin(t * Math.PI) * 0.9;

  // Beacon glow opacity: ramps up fast, stays high, fades slightly
  const beaconOpacity =
    t < 0.3 ? (t / 0.3) * 0.8 : t < 0.7 ? 0.8 : 0.8 * (1 - (t - 0.7) / 0.3);

  // ─── Background color (two stacked layers) ───────────────────────────────
  // Layer A: #030816 always (base)
  // Layer B: #060F21 fades in as bgProgress goes 0→1

  const bgLayerBOpacity = bgProgress;

  // ─── Horizontal light cone position ──────────────────────────────────────
  // Cone fans out to the right from the current sweep leading edge
  const coneLeftPct = sweepX * 100;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      {/* ── Layer 1: Background color A (#030816 base) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#030816",
          zIndex: 0,
        }}
      />

      {/* ── Layer 2: Background color B (#060F21 transition) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#060F21",
          opacity: bgLayerBOpacity,
          zIndex: 1,
        }}
      />

      {/* ── Layer 3: Dark image (always visible) ── */}
      <img
        src="/assets/rts_intro_dark.png"
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ── Layer 4: Light image with moving reveal mask ── */}
      <img
        src="/assets/rts_intro_light.png"
        alt="Ramp Track Systems"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
          zIndex: 3,
          ...maskStyle,
        }}
      />

      {/* ── Layer 5: Forward-facing horizontal light cone ── */}
      {/* Simulates the beacon projecting a spotlight forward (left→right) */}
      {t > 0 && t < 1 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "12%",
            // Place the cone's left edge at the sweep origin, clip trailing side
            left: `${Math.max(0, coneLeftPct - 30)}%`,
            width: "60%",
            height: "40%",
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(100, 160, 255, 0.22) 0%, rgba(80, 140, 240, 0.12) 40%, transparent 75%)",
            opacity: coneOpacity,
            pointerEvents: "none",
            zIndex: 4,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* ── Layer 6: Vertical sweep beam (wide, soft-edged wash) ── */}
      {t > 0 && t < 1 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: `calc(${sweepX * 100}% - 60px)`,
            width: "120px",
            height: "100%",
            background:
              "linear-gradient(to right, transparent 0%, rgba(120, 180, 255, 0.06) 20%, rgba(140, 200, 255, 0.18) 40%, rgba(150, 210, 255, 0.22) 50%, rgba(140, 200, 255, 0.18) 60%, rgba(120, 180, 255, 0.06) 80%, transparent 100%)",
            filter: "blur(4px)",
            opacity: beamOpacity,
            pointerEvents: "none",
            zIndex: 5,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* ── Layer 7: Beacon glow (circular, at rooftop position) ── */}
      {t > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "calc(50% - 24px)",
            top: "calc(32% - 24px)",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(100, 180, 255, 0.9) 0%, rgba(60, 120, 220, 0.4) 40%, transparent 70%)",
            filter: "blur(6px)",
            opacity: beaconOpacity,
            pointerEvents: "none",
            zIndex: 6,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* ── Layer 8: Final fade overlay (black, fades in during phase 3) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          opacity: fadeOpacity,
          pointerEvents: fadeOpacity > 0 ? "auto" : "none",
          zIndex: 10,
        }}
      />
    </div>
  );
}
