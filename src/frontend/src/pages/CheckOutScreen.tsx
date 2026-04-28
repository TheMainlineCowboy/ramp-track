import { AlertCircle, CheckCircle2, ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
const homescreenBackground =
  "/assets/homescreenbackground-019d2e4a-c901-72bd-837b-8409f84ded93.jpg";
import BarcodeScanner from "../components/BarcodeScanner";
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
import { recordEvent } from "../lib/equipmentHistory";
import {
  type EquipmentRecord,
  findById,
  updateEquipment,
} from "../lib/equipmentRegistry";
import { getLocationWithGeofence } from "../lib/gateLocator";

export default function CheckOutScreen({
  onBack,
  currentUser,
}: { onBack: () => void; currentUser: { username: string; badge: string } }) {
  const [selected, setSelected] = useState<EquipmentRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [outsideArea, setOutsideArea] = useState(false);
  const [blockedId, setBlockedId] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    id: string;
    location: string | null;
  } | null>(null);

  // Auto-open scanner on mount
  useEffect(() => {
    setScannerOpen(true);
  }, []);

  // Auto-navigate back after success
  useEffect(() => {
    if (!successInfo) return;
    const timer = setTimeout(() => {
      onBack();
    }, 2500);
    return () => clearTimeout(timer);
  }, [successInfo, onBack]);

  const handleConfirm = async () => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const geoResult = await getLocationWithGeofence();
      setLocationLabel(geoResult.locationLabel);
      setOutsideArea(!geoResult.insideArea);
      recordEvent({
        equipmentId: selected.id,
        eventType: "CHECK_OUT",
        operator: currentUser.badge,
        timestamp: Date.now(),
        location: geoResult.locationLabel,
        lat: geoResult.lat,
        lon: geoResult.lon,
        outsideArea: !geoResult.insideArea,
      });
      updateEquipment(selected.id, {
        status: "ASSIGNED",
        lastOperator: currentUser.badge,
        checkoutTime: Date.now(),
        location: geoResult.locationLabel,
      });
      setSuccessInfo({ id: selected.id, location: geoResult.locationLabel });
      toast.success("Equipment checked out");
    } catch {
      toast.error("Failed to check out equipment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanResult = (id: string) => {
    setScannerOpen(false);
    const eq = findById(id);
    if (!eq) {
      toast.error(`Equipment ${id} not found in registry`);
      return;
    }
    if (eq.status !== "AVAILABLE") {
      // Block checkout — show blocked state, no override allowed
      setBlockedId(id);
      setSelected(null);
      return;
    }
    setBlockedId(null);
    setSelected(eq);
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
        {scannerOpen && (
          <BarcodeScanner
            mode="equipment"
            onResult={handleScanResult}
            onClose={() => setScannerOpen(false)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/40 to-black/30 backdrop-blur-[1px]" />
        <div className="relative z-10">
          <header className="bg-card/95 backdrop-blur-sm border-b shadow-lg">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#0078D2" }}>
                  Take Equipment
                </h1>
                <p className="text-sm text-muted-foreground">Check Out</p>
              </div>
              <Button
                onClick={onBack}
                data-ocid="checkout.back.button"
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
          <main className="container mx-auto px-4 py-6">
            {successInfo ? (
              // SUCCESS STATE
              <Card
                className="border shadow-2xl"
                style={{
                  background: "rgba(15,23,42,0.95)",
                  borderColor: "rgba(34,197,94,0.6)",
                  borderRadius: "16px",
                  borderWidth: "2px",
                }}
                data-ocid="checkout.success_state"
              >
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div
                    className="rounded-full p-5"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      border: "2px solid rgba(34,197,94,0.5)",
                    }}
                  >
                    <CheckCircle2
                      className="h-14 w-14"
                      style={{ color: "#22c55e" }}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#22c55e" }}
                    >
                      Checked Out
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {successInfo.id} checked out successfully
                    </p>
                    {successInfo.location && (
                      <p
                        className="text-base font-normal"
                        style={{ color: "#94a3b8" }}
                      >
                        Assigned to {successInfo.location}
                      </p>
                    )}
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      Returning to home screen…
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : blockedId ? (
              // BLOCKED STATE — equipment is not available
              <Card
                className="border shadow-2xl"
                style={{
                  background: "rgba(15,23,42,0.95)",
                  borderColor: "rgba(239,68,68,0.6)",
                  borderRadius: "16px",
                  borderWidth: "2px",
                }}
              >
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div
                    className="rounded-full p-5"
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      border: "2px solid rgba(239,68,68,0.5)",
                    }}
                  >
                    <AlertCircle
                      className="h-12 w-12"
                      style={{ color: "#ef4444" }}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#ef4444" }}
                    >
                      Cannot Check Out
                    </p>
                    <p className="text-lg font-semibold text-white">
                      This equipment is already checked out
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
                      {blockedId}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setBlockedId(null);
                      setScannerOpen(true);
                    }}
                    className="bg-blue-700 hover:bg-blue-600 px-8 py-3 text-lg w-full max-w-xs"
                    data-ocid="checkout.scan-again.button"
                  >
                    <ScanLine className="h-5 w-5 mr-2" />
                    Scan Different Equipment
                  </Button>
                </CardContent>
              </Card>
            ) : selected ? (
              <Card
                className="border shadow-2xl"
                style={{
                  background: "rgba(15,23,42,0.92)",
                  borderColor: "rgba(255,255,255,0.18)",
                  borderRadius: "16px",
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: "#ffffff" }}>
                    Confirm Check Out
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      background: "rgba(30,41,59,0.5)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <p className="text-xl font-bold text-white">
                      {selected.id}
                    </p>
                    {selected.label && (
                      <p className="text-sm" style={{ color: "#cbd5f5" }}>
                        {selected.label}
                      </p>
                    )}
                    <StatusBadge status="AVAILABLE" className="mt-2" />
                  </div>
                  <p style={{ color: "#cbd5f5" }}>
                    Operator:{" "}
                    <span className="text-white font-medium">
                      {currentUser.badge}
                    </span>
                  </p>
                  {locationLabel && (
                    <p style={{ color: "#94a3b8" }} className="text-sm">
                      📍 {locationLabel}
                    </p>
                  )}
                  {outsideArea && (
                    <div
                      data-ocid="checkout.outside_area_warning"
                      className="flex items-start gap-2 p-3 rounded-lg text-sm"
                      style={{
                        background: "rgba(217,119,6,0.15)",
                        border: "1px solid rgba(217,119,6,0.5)",
                        color: "#fbbf24",
                      }}
                    >
                      <span className="mt-0.5">⚠️</span>
                      <span>
                        You are outside the designated area. The transaction
                        will still be saved.
                      </span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setScannerOpen(true)}
                      disabled={isProcessing}
                      data-ocid="checkout.cancel.button"
                    >
                      Scan Again
                    </Button>
                    <Button
                      className="flex-1 bg-blue-700 hover:bg-blue-600"
                      onClick={handleConfirm}
                      disabled={isProcessing}
                      data-ocid="checkout.confirm.button"
                    >
                      {isProcessing
                        ? "Getting location..."
                        : "✓ Confirm Check Out"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card
                className="border shadow-2xl"
                style={{
                  background: "rgba(15,23,42,0.92)",
                  borderColor: "rgba(255,255,255,0.18)",
                  borderRadius: "16px",
                }}
              >
                <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
                  <div
                    className="rounded-full p-6"
                    style={{
                      background: "rgba(30,41,59,0.7)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    <ScanLine
                      className="h-12 w-12"
                      style={{ color: "#60a5fa" }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white mb-2">
                      Scan Equipment
                    </p>
                    <p className="text-sm" style={{ color: "#cbd5f5" }}>
                      Point your camera at the equipment barcode or QR code
                    </p>
                  </div>
                  <Button
                    onClick={() => setScannerOpen(true)}
                    className="bg-blue-700 hover:bg-blue-600 px-8 py-3 text-lg"
                    data-ocid="checkout.scan.button"
                  >
                    <ScanLine className="h-5 w-5 mr-2" />
                    Open Scanner
                  </Button>
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
