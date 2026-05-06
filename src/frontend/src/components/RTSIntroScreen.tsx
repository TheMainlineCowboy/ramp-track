import type React from "react";
import { useCallback, useEffect, useRef } from "react";

interface RTSIntroScreenProps {
  onComplete: () => void;
}

// Pre-seeded fog particles — fixed offsets so they're deterministic
const FOG_PARTICLES = [
  { relAngle: -0.22, relDist: 0.28, size: 38 },
  { relAngle: 0.15, relDist: 0.45, size: 30 },
  { relAngle: -0.08, relDist: 0.6, size: 42 },
  { relAngle: 0.27, relDist: 0.32, size: 25 },
  { relAngle: -0.18, relDist: 0.52, size: 34 },
];

const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// Interpolate two hex colors by factor 0→1
function lerpColor(a: string, b: string, t: number): string {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 0xff;
  const ag = (pa >> 8) & 0xff;
  const ab = pa & 0xff;
  const br = (pb >> 16) & 0xff;
  const bg = (pb >> 8) & 0xff;
  const bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

const RTSIntroScreen: React.FC<RTSIntroScreenProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeImgRef = useRef<HTMLImageElement | null>(null);
  const afterImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const imagesLoadedRef = useRef(0);
  const containerOpacityRef = useRef(1);
  const doneRef = useRef(false);

  // Layout cache — recalculated on resize
  const layoutRef = useRef({
    drawWidth: 0,
    drawHeight: 0,
    imgOffsetX: 0,
    imgOffsetY: 0,
  });

  const computeLayout = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !beforeImgRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const naturalW = beforeImgRef.current.naturalWidth || 1200;
    const naturalH = beforeImgRef.current.naturalHeight || 675;
    const scale = Math.min(cw / naturalW, ch / naturalH);
    const drawWidth = naturalW * scale;
    const drawHeight = naturalH * scale;
    layoutRef.current = {
      drawWidth,
      drawHeight,
      imgOffsetX: (cw - drawWidth) / 2,
      imgOffsetY: (ch - drawHeight) / 2,
    };
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    computeLayout();
  }, [computeLayout]);

  const drawFrame = useCallback((progress: number, beamFade: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const beforeImg = beforeImgRef.current;
    const afterImg = afterImgRef.current;
    if (!beforeImg || !afterImg) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const { drawWidth, drawHeight, imgOffsetX, imgOffsetY } = layoutRef.current;
    if (drawWidth === 0) return;

    // ── LAYER 0: Background fill ──────────────────────────────────────────
    ctx.fillStyle = lerpColor("#030816", "#060F21", progress);
    ctx.fillRect(0, 0, cw, ch);

    // ── LAYER 1: Dark image (base) ────────────────────────────────────────
    ctx.drawImage(beforeImg, imgOffsetX, imgOffsetY, drawWidth, drawHeight);

    // ── LAYER 2: Reveal mask (after image, clipped to swept area) ─────────
    // Approach: draw after image, then use destination-out to erase the
    // un-revealed right portion with a soft gradient boundary.
    {
      const easedProgress = easeInOut(Math.min(1, progress));
      const revealX = imgOffsetX + drawWidth * easedProgress;
      const penumbraWidth = drawWidth * 0.12;

      ctx.save();
      // Draw the after image fully first
      ctx.drawImage(afterImg, imgOffsetX, imgOffsetY, drawWidth, drawHeight);

      // Erase everything to the right of the sweep's soft edge
      const maskGrad = ctx.createLinearGradient(
        revealX - penumbraWidth,
        0,
        revealX + penumbraWidth,
        0,
      );
      maskGrad.addColorStop(0, "rgba(0,0,0,0)"); // keep revealed
      maskGrad.addColorStop(0.5, "rgba(0,0,0,0.5)"); // soft beam edge
      maskGrad.addColorStop(1, "rgba(0,0,0,1)"); // fully erase right

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = maskGrad;
      // Fill from the penumbra start all the way to the right edge
      const fillLeft = revealX - penumbraWidth;
      const fillWidth = cw - fillLeft + penumbraWidth;
      ctx.fillRect(fillLeft, imgOffsetY, fillWidth, drawHeight);

      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    }

    // If fully revealed and beam is fading, skip beam layers
    const beamAlpha = beamFade; // 1 during sweep, fades out after
    if (beamAlpha <= 0) return;

    // Derived beam values
    const easedProgress = easeInOut(Math.min(1, progress));
    const beamIntensity = Math.sin(easedProgress * Math.PI) * beamAlpha;

    // Beacon position (tug rooftop center)
    const beaconX = imgOffsetX + drawWidth * 0.5;
    const beaconY = imgOffsetY + drawHeight * 0.385;

    // Sweep angle: -70° to +70° (radians: -1.2217 to +1.2217)
    const SWEEP_START = -1.2217;
    const SWEEP_RANGE = 2.4435;
    const currentAngle = SWEEP_START + easedProgress * SWEEP_RANGE;
    const coneHalfAngle = 0.384; // 22°
    const beamLength = Math.max(cw, ch) * 1.5;

    // ── LAYER 3: Main beam cone ───────────────────────────────────────────
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Clip to cone wedge
    ctx.beginPath();
    ctx.moveTo(beaconX, beaconY);
    const leftAngle = currentAngle - coneHalfAngle;
    const rightAngle = currentAngle + coneHalfAngle;
    ctx.lineTo(
      beaconX + Math.cos(leftAngle) * beamLength,
      beaconY + Math.sin(leftAngle) * beamLength,
    );
    ctx.arc(beaconX, beaconY, beamLength, leftAngle, rightAngle);
    ctx.closePath();
    ctx.clip();

    // Radial gradient from beacon outward
    const beamGrad = ctx.createRadialGradient(
      beaconX,
      beaconY,
      0,
      beaconX,
      beaconY,
      beamLength,
    );
    beamGrad.addColorStop(0, `rgba(120, 200, 255, ${0.55 * beamAlpha})`);
    beamGrad.addColorStop(0.08, `rgba(80, 160, 255, ${0.4 * beamAlpha})`);
    beamGrad.addColorStop(0.25, `rgba(60, 130, 255, ${0.25 * beamAlpha})`);
    beamGrad.addColorStop(0.55, `rgba(40, 100, 220, ${0.12 * beamAlpha})`);
    beamGrad.addColorStop(1, "rgba(20, 60, 180, 0)");

    ctx.fillStyle = beamGrad;
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();

    // ── LAYER 3b: Inner bright core of cone (screen blend) ───────────────
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.18 * beamIntensity;

    ctx.beginPath();
    ctx.moveTo(beaconX, beaconY);
    const innerLeftAngle = currentAngle - coneHalfAngle * 0.45;
    const innerRightAngle = currentAngle + coneHalfAngle * 0.45;
    ctx.lineTo(
      beaconX + Math.cos(innerLeftAngle) * beamLength,
      beaconY + Math.sin(innerLeftAngle) * beamLength,
    );
    ctx.arc(beaconX, beaconY, beamLength, innerLeftAngle, innerRightAngle);
    ctx.closePath();

    const innerGrad = ctx.createRadialGradient(
      beaconX,
      beaconY,
      0,
      beaconX,
      beaconY,
      beamLength * 0.4,
    );
    innerGrad.addColorStop(0, "rgba(180, 220, 255, 1)");
    innerGrad.addColorStop(1, "rgba(100, 160, 255, 0)");
    ctx.fillStyle = innerGrad;
    ctx.fill();
    ctx.restore();

    // ── LAYER 4: Fog/haze particles ───────────────────────────────────────
    for (const p of FOG_PARTICLES) {
      const pAngle = currentAngle + p.relAngle;
      const pX = beaconX + Math.cos(pAngle) * beamLength * p.relDist;
      const pY = beaconY + Math.sin(pAngle) * beamLength * p.relDist;
      const scaledSize = p.size * (drawWidth / 800);
      const grad = ctx.createRadialGradient(pX, pY, 0, pX, pY, scaledSize);
      grad.addColorStop(0, `rgba(100, 180, 255, ${0.12 * beamIntensity})`);
      grad.addColorStop(1, "rgba(100, 180, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pX, pY, scaledSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── LAYER 5: Beacon glow ──────────────────────────────────────────────
    const glowSize = drawWidth * (0.04 + beamIntensity * 0.04);
    const glowGrad = ctx.createRadialGradient(
      beaconX,
      beaconY,
      0,
      beaconX,
      beaconY,
      glowSize,
    );
    glowGrad.addColorStop(0, `rgba(150, 210, 255, ${0.85 * beamIntensity})`);
    glowGrad.addColorStop(0.3, `rgba(80, 160, 255, ${0.45 * beamIntensity})`);
    glowGrad.addColorStop(1, "rgba(40, 100, 220, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(beaconX, beaconY, glowSize, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const tick = useCallback(
    (now: number) => {
      if (doneRef.current) return;

      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;

      const DARK_HOLD = 200;
      const SWEEP_DURATION = 1600;
      const FINAL_HOLD = 3000;
      const FADE_DURATION = 400;
      const BEAM_FADE_DURATION = 400; // beam fades out over first 400ms of final hold

      let progress = 0;
      let beamFade = 1;

      if (elapsed < DARK_HOLD) {
        // Phase 0: dark hold
        progress = 0;
        beamFade = 0;
      } else if (elapsed < DARK_HOLD + SWEEP_DURATION) {
        // Phase 1: sweep
        progress = (elapsed - DARK_HOLD) / SWEEP_DURATION;
        beamFade = 1;
      } else if (elapsed < DARK_HOLD + SWEEP_DURATION + FINAL_HOLD) {
        // Phase 2: hold — beam fades out during first BEAM_FADE_DURATION ms
        progress = 1;
        const holdElapsed = elapsed - DARK_HOLD - SWEEP_DURATION;
        beamFade = Math.max(0, 1 - holdElapsed / BEAM_FADE_DURATION);
      } else if (
        elapsed <
        DARK_HOLD + SWEEP_DURATION + FINAL_HOLD + FADE_DURATION
      ) {
        // Phase 3: container fade out
        progress = 1;
        beamFade = 0;
        const ft =
          (elapsed - DARK_HOLD - SWEEP_DURATION - FINAL_HOLD) / FADE_DURATION;
        containerOpacityRef.current = Math.max(0, 1 - ft);
        if (containerRef.current) {
          containerRef.current.style.opacity = String(
            containerOpacityRef.current,
          );
        }
      } else {
        // Done
        progress = 1;
        beamFade = 0;
        if (containerRef.current) containerRef.current.style.opacity = "0";
        if (!doneRef.current) {
          doneRef.current = true;
          onComplete();
        }
        return;
      }

      drawFrame(progress, beamFade);
      rafRef.current = requestAnimationFrame(tick);
    },
    [drawFrame, onComplete],
  );

  useEffect(() => {
    // Set html/body background to match before-phase color
    document.documentElement.style.background = "#030816";
    document.body.style.background = "#030816";

    const beforeImg = new Image();
    const afterImg = new Image();
    beforeImgRef.current = beforeImg;
    afterImgRef.current = afterImg;

    const onImageLoad = () => {
      imagesLoadedRef.current += 1;
      if (imagesLoadedRef.current === 2) {
        resizeCanvas();
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    beforeImg.onload = onImageLoad;
    afterImg.onload = onImageLoad;
    beforeImg.onerror = onImageLoad; // graceful fallback — still run animation
    afterImg.onerror = onImageLoad;

    beforeImg.src = "/assets/rts_intro_before.png";
    afterImg.src = "/assets/rts_intro_after.png";

    const handleResize = () => {
      resizeCanvas();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, [tick, resizeCanvas]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        background: "#030816",
        opacity: 1,
        transition: "none", // opacity controlled imperatively for performance
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
};

export default RTSIntroScreen;
