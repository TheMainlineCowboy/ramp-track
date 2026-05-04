import { BrowserMultiFormatReader } from "@zxing/browser";
import { AlertCircle, ChevronDown, ScanLine, X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
const homescreenBackground =
  "/assets/homescreenbackground-019d2e4a-c901-72bd-837b-8409f84ded93.jpg";
import PageTransition from "../components/PageTransition";
import { StatusBadge } from "../components/StatusBadge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { recordEvent } from "../lib/equipmentHistory";
import {
  type EquipmentRecord,
  findById,
  getAllEquipment,
  updateEquipment,
} from "../lib/equipmentRegistry";
import {
  resolveOperatorDisplay,
  resolveOperatorName,
} from "../lib/resolveOperatorName";

type Step = "scan" | "form";

const ISSUE_CATEGORIES = [
  "Low fuel / needs refueling",
  "Mechanical issue / won't start",
  "Brake issue",
  "Electrical / battery issue",
  "Damage — body / exterior",
  "Tire / wheel issue",
  "Hydraulic system issue",
  "Safety concern",
  "Other operational concern",
];

const MANUAL_REASONS = [
  "Equipment missing",
  "QR code damaged / unscannable",
] as const;

type ManualReason = (typeof MANUAL_REASONS)[number];

function normalizeEquipmentId(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");
  const match = cleaned.match(/TV\d{4}/);
  return match ? match[0] : cleaned;
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
    // ignore
  }
  try {
    navigator.vibrate?.(200);
  } catch {
    // ignore
  }
}

export default function ReportIssueScreen({
  onBack,
  currentUser,
}: { onBack: () => void; currentUser: { username: string; badge: string } }) {
  // --- Workflow state ---
  const [step, setStep] = useState<Step>("scan");
  const [selected, setSelected] = useState<EquipmentRecord | null>(null);
  const [selectionMethod, setSelectionMethod] = useState<"qr_scan" | "manual">(
    "qr_scan",
  );
  const [manualSelectionReason, setManualSelectionReason] = useState<
    ManualReason | ""
  >("");
  const [scanError, setScanError] = useState("");

  // --- Manual fallback state ---
  const [manualExpanded, setManualExpanded] = useState(false);
  const [manualEquipmentId, setManualEquipmentId] = useState("");
  const allEquipment = getAllEquipment();

  // --- Form state ---
  const [issueCategory, setIssueCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Scanner state ---
  const [cameraActive, setCameraActive] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const hasResultRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
  }, []);

  const handleScanResult = useCallback(
    (rawText: string) => {
      if (hasResultRef.current) return;
      hasResultRef.current = true;
      beepAndVibrate();
      const normalized = normalizeEquipmentId(rawText);
      const eq = findById(normalized);
      if (!eq) {
        setScanError(
          `Equipment "${normalized}" not found. Try scanning again.`,
        );
        hasResultRef.current = false;
        return;
      }
      stopCamera();
      setCameraActive(false);
      setScanError("");
      setSelected(eq);
      setSelectionMethod("qr_scan");
      setStep("form");
    },
    [stopCamera],
  );

  // Start camera when on scan step and cameraActive
  useEffect(() => {
    if (step !== "scan" || !cameraActive) return;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    hasResultRef.current = false;
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
          if (result) handleScanResult(result.getText());
          void err;
        });
      })
      .catch(() => {
        setScanError("Camera not available. Use manual selection below.");
      });

    return () => {
      stopped = true;
      stopCamera();
    };
  }, [step, cameraActive, handleScanResult, stopCamera]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

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
      // not supported
    }
  };

  const handleManualContinue = () => {
    if (!manualEquipmentId || !manualSelectionReason) return;
    const eq = findById(manualEquipmentId);
    if (!eq) {
      toast.error("Equipment not found");
      return;
    }
    stopCamera();
    setCameraActive(false);
    setSelected(eq);
    setSelectionMethod("manual");
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!selected) return;
    if (!issueCategory) {
      setNotesError("Please select an issue category.");
      return;
    }
    if (!notes.trim()) {
      setNotesError("Please describe the issue.");
      return;
    }
    setNotesError("");
    setIsProcessing(true);
    try {
      const fullNotes = `[${issueCategory}] ${notes.trim()}`;
      recordEvent({
        equipmentId: selected.id,
        eventType: "REPORT_ISSUE",
        operator: currentUser.badge,
        timestamp: Date.now(),
        notes: fullNotes,
        selectionMethod,
        scannedEquipmentId:
          selectionMethod === "qr_scan" ? selected.id : undefined,
        selectedEquipmentId:
          selectionMethod === "manual" ? selected.id : undefined,
        manualSelectionReason:
          selectionMethod === "manual"
            ? (manualSelectionReason as string)
            : undefined,
        reportedBy: {
          name: resolveOperatorName(currentUser.badge),
          id: currentUser.badge,
        },
      });
      updateEquipment(selected.id, {
        status: "MAINTENANCE",
        maintenanceNotes: fullNotes,
      });
      toast.success(`Issue reported for ${selected.id}`);
      onBack();
    } catch {
      toast.error("Failed to report issue");
    } finally {
      setIsProcessing(false);
    }
  };

  const card = {
    background: "rgba(15,23,42,0.92)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: "16px",
  };

  return (
    <PageTransition>
      <div
        className="min-h-screen relative"
        style={{
          backgroundImage: `url(${homescreenBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/40 to-black/30 backdrop-blur-[1px]" />
        <div className="relative z-10">
          <header className="bg-card/95 backdrop-blur-sm border-b shadow-lg">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#0078D2" }}>
                  Report Issue
                </h1>
                <p className="text-sm text-muted-foreground">
                  Flag equipment for maintenance
                </p>
              </div>
              <Button
                onClick={onBack}
                data-ocid="reportissue.back.button"
                className="rounded-lg border text-white transition-colors hover:bg-[rgba(0,120,210,0.25)]"
                style={{
                  background: "rgba(10,20,50,0.75)",
                  borderColor: "rgba(0,120,210,0.4)",
                }}
              >
                ← Back
              </Button>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6 space-y-6">
            {step === "scan" ? (
              <>
                {/* PRIMARY: QR scan */}
                <Card className="border shadow-2xl" style={card}>
                  <CardHeader>
                    <CardTitle style={{ color: "#ffffff" }}>
                      Scan Equipment QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Camera preview */}
                    <div
                      className="relative rounded-xl overflow-hidden"
                      style={{
                        background: "#000",
                        border: "2px solid rgba(0,120,210,0.5)",
                        minHeight: "240px",
                      }}
                    >
                      <video
                        ref={videoRef}
                        className="w-full object-cover"
                        style={{ minHeight: "240px", maxHeight: "320px" }}
                        muted
                        playsInline
                      />
                      {/* orange guide line */}
                      <div className="absolute inset-0 flex items-center pointer-events-none">
                        <div className="w-full h-0.5 bg-orange-500 opacity-80" />
                      </div>
                      {/* SCANNING label */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                        <span className="px-4 py-1.5 rounded-full bg-black/60 text-orange-400 text-xs font-bold tracking-widest">
                          SCANNING...
                        </span>
                      </div>
                      {/* Torch button */}
                      <button
                        type="button"
                        data-ocid="reportissue.scanner.torch_button"
                        onClick={toggleTorch}
                        className="absolute top-3 right-3 h-10 w-10 rounded-full flex items-center justify-center bg-black/50 border border-white/30 text-white"
                        aria-label="Toggle flashlight"
                      >
                        <Zap
                          className={`h-5 w-5 ${
                            torchOn ? "text-yellow-400" : "text-white"
                          }`}
                        />
                      </button>
                    </div>

                    {scanError && (
                      <div
                        data-ocid="reportissue.scanner.error_state"
                        className="flex items-center gap-2 p-3 rounded-lg text-sm"
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.4)",
                          color: "#f87171",
                        }}
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {scanError}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SECONDARY: Manual fallback */}
                <Card className="border shadow-2xl" style={card}>
                  <CardHeader>
                    <button
                      type="button"
                      data-ocid="reportissue.manual_fallback.toggle"
                      className="flex items-center justify-between w-full text-left"
                      onClick={() => setManualExpanded((v) => !v)}
                    >
                      <CardTitle style={{ color: "#94a3b8", fontSize: "1rem" }}>
                        Can't scan QR code?
                      </CardTitle>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          manualExpanded ? "rotate-180" : ""
                        }`}
                        style={{ color: "#94a3b8" }}
                      />
                    </button>
                  </CardHeader>
                  {manualExpanded && (
                    <CardContent className="space-y-4">
                      <p className="text-sm" style={{ color: "#94a3b8" }}>
                        Manual entry is only allowed when the QR code cannot be
                        scanned.
                      </p>

                      {/* Equipment dropdown */}
                      <div>
                        <Label style={{ color: "#cbd5f5" }}>Equipment *</Label>
                        <select
                          data-ocid="reportissue.manual.equipment_select"
                          value={manualEquipmentId}
                          onChange={(e) => setManualEquipmentId(e.target.value)}
                          className="mt-1 w-full rounded-lg px-3 py-2 text-white text-sm"
                          style={{
                            background: "rgba(30,41,59,0.8)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            outline: "none",
                          }}
                        >
                          <option value="" disabled>
                            — Select equipment —
                          </option>
                          {allEquipment.map((eq) => (
                            <option
                              key={eq.id}
                              value={eq.id}
                              style={{ background: "#1e293b", color: "#fff" }}
                            >
                              {eq.id}
                              {eq.label ? ` — ${eq.label}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Reason dropdown */}
                      <div>
                        <Label style={{ color: "#cbd5f5" }}>
                          Reason for manual selection *
                        </Label>
                        <select
                          data-ocid="reportissue.manual.reason_select"
                          value={manualSelectionReason}
                          onChange={(e) =>
                            setManualSelectionReason(
                              e.target.value as ManualReason | "",
                            )
                          }
                          className="mt-1 w-full rounded-lg px-3 py-2 text-white text-sm"
                          style={{
                            background: "rgba(30,41,59,0.8)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            outline: "none",
                          }}
                        >
                          <option value="" disabled>
                            — Select reason —
                          </option>
                          {MANUAL_REASONS.map((r) => (
                            <option
                              key={r}
                              value={r}
                              style={{ background: "#1e293b", color: "#fff" }}
                            >
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button
                        data-ocid="reportissue.manual.continue_button"
                        className="w-full"
                        style={{
                          background:
                            manualEquipmentId && manualSelectionReason
                              ? "rgba(0,120,210,0.85)"
                              : "rgba(30,41,59,0.6)",
                          opacity:
                            manualEquipmentId && manualSelectionReason
                              ? 1
                              : 0.5,
                          cursor:
                            manualEquipmentId && manualSelectionReason
                              ? "pointer"
                              : "not-allowed",
                        }}
                        disabled={!manualEquipmentId || !manualSelectionReason}
                        onClick={handleManualContinue}
                      >
                        Continue with Manual Selection
                      </Button>
                    </CardContent>
                  )}
                </Card>
              </>
            ) : (
              /* FORM STEP */
              <Card className="border shadow-2xl" style={card}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{ color: "#ffffff" }}>
                      Issue Details
                    </CardTitle>
                    <button
                      type="button"
                      data-ocid="reportissue.form.back_button"
                      onClick={() => {
                        setStep("scan");
                        setSelected(null);
                        setScanError("");
                        setIssueCategory("");
                        setNotes("");
                        setNotesError("");
                        setCameraActive(true);
                        hasResultRef.current = false;
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border"
                      style={{
                        background: "rgba(30,41,59,0.7)",
                        borderColor: "rgba(255,255,255,0.2)",
                        color: "#94a3b8",
                      }}
                    >
                      ← Rescan
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Locked equipment ID */}
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      background: "rgba(30,41,59,0.5)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-white">
                          {selected?.id}
                        </p>
                        {selected?.label && (
                          <p className="text-sm" style={{ color: "#cbd5f5" }}>
                            {selected.label}
                          </p>
                        )}
                      </div>
                      {selected && <StatusBadge status={selected.status} />}
                    </div>
                    {/* Selection method badge */}
                    <div className="mt-2">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          background:
                            selectionMethod === "qr_scan"
                              ? "rgba(0,120,210,0.2)"
                              : "rgba(120,80,0,0.25)",
                          color:
                            selectionMethod === "qr_scan"
                              ? "#60b4ff"
                              : "#fbbf24",
                          border:
                            selectionMethod === "qr_scan"
                              ? "1px solid rgba(0,120,210,0.4)"
                              : "1px solid rgba(217,119,6,0.4)",
                        }}
                      >
                        {selectionMethod === "qr_scan"
                          ? "Selected by QR scan"
                          : `Manual selection: ${manualSelectionReason}`}
                      </span>
                    </div>
                  </div>

                  {/* Issue category */}
                  <div>
                    <Label style={{ color: "#cbd5f5" }}>Issue Category *</Label>
                    <select
                      data-ocid="reportissue.issue_category.select"
                      value={issueCategory}
                      onChange={(e) => {
                        setIssueCategory(e.target.value);
                        setNotesError("");
                      }}
                      className="mt-1 w-full rounded-lg px-3 py-2 text-white text-sm"
                      style={{
                        background: "rgba(30,41,59,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        outline: "none",
                      }}
                    >
                      <option value="" disabled>
                        — Select issue category —
                      </option>
                      {ISSUE_CATEGORIES.map((cat) => (
                        <option
                          key={cat}
                          value={cat}
                          style={{ background: "#1e293b", color: "#fff" }}
                        >
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="notes" style={{ color: "#cbd5f5" }}>
                      Description *
                    </Label>
                    <Textarea
                      data-ocid="reportissue.notes.textarea"
                      id="notes"
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        setNotesError("");
                      }}
                      placeholder="Describe the issue in detail..."
                      rows={4}
                      className="mt-1"
                      disabled={isProcessing}
                    />
                    {notesError && (
                      <div
                        data-ocid="reportissue.notes.error_state"
                        className="flex items-center gap-2 mt-2 text-red-400 text-sm"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {notesError}
                      </div>
                    )}
                  </div>

                  <p style={{ color: "#cbd5f5" }}>
                    Reported by:{" "}
                    <span className="text-white font-medium">
                      {resolveOperatorDisplay(currentUser.badge)}
                    </span>
                  </p>
                  <p className="text-sm" style={{ color: "#f87171" }}>
                    ⚠️ This will set equipment status to MAINTENANCE
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setStep("scan");
                        setSelected(null);
                        setScanError("");
                        setIssueCategory("");
                        setNotes("");
                        setNotesError("");
                        setCameraActive(true);
                        hasResultRef.current = false;
                      }}
                      disabled={isProcessing}
                      data-ocid="reportissue.cancel.button"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-orange-700 hover:bg-orange-600"
                      onClick={handleSubmit}
                      disabled={isProcessing || !issueCategory || !notes.trim()}
                      data-ocid="reportissue.submit_button"
                    >
                      {isProcessing ? "Submitting..." : "⚠️ Submit Report"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
          <footer className="py-6 text-center text-sm text-white/90 drop-shadow-lg">
            Built by Jayson James and Ramp Track Systems.
          </footer>
        </div>
      </div>
    </PageTransition>
  );
}
