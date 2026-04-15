import { useEffect, useState } from "react";

const rampTrackSplash =
  "/assets/ramptracksplash-019d2e4b-1a18-736f-a7f6-8bff4344c78b.png";

export default function LandingScreen({ onLogin }: { onLogin: () => void }) {
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0"
      style={{
        backgroundImage: `url(${rampTrackSplash})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Gradient overlay — transparent at top, darker toward bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.60) 100%)",
        }}
      />

      {/* Button anchored to bottom quarter */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center"
        style={{
          paddingBottom: "12vh",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.65s ease, transform 0.65s ease",
        }}
      >
        <button
          type="button"
          onClick={onLogin}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          style={{
            minWidth: "240px",
            padding: pressed ? "19px 48px 17px" : "18px 48px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.18)",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: 800,
            letterSpacing: "0.07em",
            color: "#ffffff",
            background: pressed
              ? "linear-gradient(180deg, #0070c4 0%, #00508f 100%)"
              : "linear-gradient(180deg, #1a9eff 0%, #0078D2 55%, #005faa 100%)",
            boxShadow: pressed
              ? "0 2px 6px rgba(0,100,200,0.25)"
              : [
                  "0 4px 16px rgba(0,80,180,0.38)" /* drop shadow */,
                  "0 1px 0 rgba(0,0,0,0.18)" /* bottom edge darkening */,
                  "inset 0 1px 0 rgba(255,255,255,0.28)" /* top highlight */,
                  "inset 0 -1px 0 rgba(0,0,0,0.15)" /* bottom inner shadow */,
                ].join(", "),
            transform: pressed
              ? "scale(0.975) translateY(1px)"
              : "scale(1) translateY(0)",
            transition:
              "background 0.12s ease, box-shadow 0.12s ease, transform 0.1s ease, padding 0.1s ease",
            textShadow: "0 1px 3px rgba(0,0,0,0.35)",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          Login
        </button>
      </div>

      {/* Footer */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pb-4 text-center"
        style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.02em",
        }}
      >
        © Jayson James &amp; Ramp Track Systems
      </div>
    </div>
  );
}
