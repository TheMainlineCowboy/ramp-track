import { CheckCircle2, ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
const homescreenBackground =
  "/assets/homescreenbackground-019d2e4a-c901-72bd-837b-8409f84ded93.jpg";
import BarcodeScanner from "../components/BarcodeScanner";
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

export default function CheckInScreen({
  onBack,
  currentUser,
}: { onBack: () => void; currentUser: { username: string; badge: string } }) {
  const [selected, setSelected] = useState<EquipmentRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [outsideArea, setOutsideArea] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Auto-open scanner on mount
  useEffect(() => {
    setScannerOpen(true);
  }, []);

  // Auto-navigate back after success
  useEffect(() => {
    if (!successId) return;
    const timer = setTimeout(() => {
      onBack();
    }, 2500);
    return () => clearTimeout(timer);
  }, [successId, onBack]);

  const handleConfirm = async () => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const geoResult = await getLocationWithGeofence();
      setLocationLabel(geoResult.locationLabel);
      setOutsideArea(!geoResult.insideArea);
      recordEvent({
        equipmentId: selected.id,
        eventType: "CHECK_IN",
        operator: currentUser.badge,
        timestamp: Date.now(),
        location: geoResult.locationLabel,
        lat: geoResult.lat,
        lon: geoResult.lon,
        outsideArea: !geoResult.insideArea,
      });
      updateEquipment(selected.id, {
        status: "AVAILABLE",
        returnTime: Date.now(),
        location: geoResult.locationLabel,
      });
      setSuccessId(selected.id);
    } catch {
      toast.error("Failed to check in equipment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanResult = (id: string) => {
    setScannerOpen(false);
    const eq = findById(id);
    if (eq && eq.status === "ASSIGNED") {
      setSelected(eq);
    } else if (eq) {
      toast.error(`${id} is not currently checked out (status: ${eq.status})`);
    } else {
      toast.error(`Equipment ${id} not found in registry`);
    }
  };

  return (
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
                Return Equipment
              </h1>
              <p className="text-sm text-muted-foreground">Check In</p>
            </div>
            <Button
              variant="outline"
              onClick={onBack}
              data-ocid="checkin.back.button"
            >
              ← Back
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          {successId ? (
            // SUCCESS STATE
            <Card
              className="border shadow-2xl"
              style={{
                background: "rgba(15,23,42,0.95)",
                borderColor: "rgba(34,197,94,0.6)",
                borderRadius: "16px",
                borderWidth: "2px",
              }}
              data-ocid="checkin.success_state"
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
                    Checked In
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {successId} checked in successfully
                  </p>
                  <p className="text-sm" style={{ color: "#64748b" }}>
                    Returning to home screen…
                  </p>
                </div>
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
                  Confirm Check In
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
                  <p className="text-xl font-bold text-white">{selected.id}</p>
                  {selected.label && (
                    <p className="text-sm" style={{ color: "#cbd5f5" }}>
                      {selected.label}
                    </p>
                  )}
                  {selected.lastOperator && (
                    <p className="text-sm mt-1" style={{ color: "#cbd5f5" }}>
                      Last operator: {selected.lastOperator}
                    </p>
                  )}
                  <StatusBadge status="ASSIGNED" className="mt-2" />
                </div>
                <p style={{ color: "#cbd5f5" }}>
                  Returning as:{" "}
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
                    data-ocid="checkin.outside_area_warning"
                    className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{
                      background: "rgba(217,119,6,0.15)",
                      border: "1px solid rgba(217,119,6,0.5)",
                      color: "#fbbf24",
                    }}
                  >
                    <span className="mt-0.5">⚠️</span>
                    <span>
                      You are outside the designated area. The transaction will
                      still be saved.
                    </span>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setScannerOpen(true)}
                    disabled={isProcessing}
                    data-ocid="checkin.cancel.button"
                  >
                    Scan Again
                  </Button>
                  <Button
                    className="flex-1 bg-green-700 hover:bg-green-600"
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    data-ocid="checkin.confirm.button"
                  >
                    {isProcessing ? "Getting location..." : "✓ Confirm Return"}
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
                    style={{ color: "#4ade80" }}
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
                  className="bg-green-700 hover:bg-green-600 px-8 py-3 text-lg"
                  data-ocid="checkin.scan.button"
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
  );
}
