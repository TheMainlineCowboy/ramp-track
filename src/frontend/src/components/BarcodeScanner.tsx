import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  mode: "equipment" | "badge";
  onResult: (text: string) => void;
  onClose: () => void;
}

function normalizeEquipment(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");
  const match = cleaned.match(/TV\d{4}/);
  return match ? match[0] : cleaned;
}

function extractBadge(raw: string): string | null {
  const sequences = raw.match(/\d+/g);
  if (!sequences) return null;
  const longest = sequences.reduce(
    (a, b) => (a.length >= b.length ? a : b),
    "",
  );
  return longest.length >= 4 ? longest : null;
}

function beepAndVibrate() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // ignore AudioContext errors
  }
  try {
    navigator.vibrate?.(200);
  } catch {
    // ignore
  }
}

export default function BarcodeScanner({
  mode,
  onResult,
  onClose,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const hasResultRef = useRef(false);
  const [torchOn, setTorchOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const handleResult = useCallback(
    (raw: string) => {
      if (hasResultRef.current) return;
      hasResultRef.current = true;
      beepAndVibrate();
      let normalized: string;
      if (mode === "equipment") {
        normalized = normalizeEquipment(raw);
      } else {
        const badge = extractBadge(raw);
        if (!badge) {
          hasResultRef.current = false;
          return;
        }
        normalized = badge;
      }
      onResult(normalized);
    },
    [mode, onResult],
  );

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    let stopped = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (stopped) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        reader.decodeFromStream(stream, videoRef.current!, (result, err) => {
          if (stopped) return;
          if (result) {
            handleResult(result.getText());
          }
          // suppress NotFoundException — expected on every frame with no code
          void err;
        });
      })
      .catch(() => {
        // camera access denied or unavailable
      });

    return () => {
      stopped = true;
      try {
      } catch {
        // ignore
      }
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
      }
    };
  }, [handleResult]);

  const toggleTorch = async () => {
    const stream = streamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as MediaTrackConstraintSet],
      });
      setTorchOn((v) => !v);
    } catch {
      // torch not supported — silently ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      data-ocid="scanner.modal"
    >
      {/* Video feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
      />

      {/* Orange guide line */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="w-full h-0.5 bg-orange-500 opacity-80" />
      </div>

      {/* Scanning label */}
      <div className="absolute bottom-28 left-0 right-0 flex justify-center pointer-events-none">
        <span className="px-4 py-2 rounded-full bg-black/60 text-orange-400 text-sm font-bold tracking-widest">
          SCANNING...
        </span>
      </div>

      {/* Controls */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
        {/* Flashlight toggle */}
        <button
          type="button"
          data-ocid="scanner.toggle"
          onClick={toggleTorch}
          className="h-12 w-12 rounded-full flex items-center justify-center bg-black/50 border border-white/30 text-white"
          aria-label="Toggle flashlight"
        >
          <Zap
            className={`h-6 w-6 ${torchOn ? "text-yellow-400" : "text-white"}`}
          />
        </button>

        {/* Close button */}
        <button
          type="button"
          data-ocid="scanner.close_button"
          onClick={onClose}
          className="h-12 w-12 rounded-full flex items-center justify-center bg-black/50 border border-white/30 text-white"
          aria-label="Close scanner"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
