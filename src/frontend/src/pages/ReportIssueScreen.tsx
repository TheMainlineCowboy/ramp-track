import { AlertCircle } from "lucide-react";
import { useState } from "react";
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
  getAllEquipment,
  updateEquipment,
} from "../lib/equipmentRegistry";

export default function ReportIssueScreen({
  onBack,
  currentUser,
}: { onBack: () => void; currentUser: { username: string; badge: string } }) {
  const [selected, setSelected] = useState<EquipmentRecord | null>(null);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const equipment = getAllEquipment();

  const handleSubmit = async () => {
    if (!selected) return;
    if (!notes.trim()) {
      setNotesError("Notes are required to report an issue");
      return;
    }
    setNotesError("");
    setIsProcessing(true);
    try {
      recordEvent({
        equipmentId: selected.id,
        eventType: "REPORT_ISSUE",
        operator: currentUser.badge,
        timestamp: Date.now(),
        notes: notes.trim(),
      });
      updateEquipment(selected.id, {
        status: "MAINTENANCE",
        maintenanceNotes: notes.trim(),
      });
      toast.success(`Issue reported for ${selected.id}`);
      onBack();
    } catch {
      toast.error("Failed to report issue");
    } finally {
      setIsProcessing(false);
    }
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
                  Select Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {equipment.map((eq, i) => (
                    <button
                      key={eq.id}
                      type="button"
                      data-ocid={`reportissue.item.${i + 1}`}
                      className={`w-full text-left flex items-center justify-between p-3 rounded-lg transition-colors ${selected?.id === eq.id ? "ring-2 ring-orange-400" : "hover:bg-white/5"}`}
                      style={{
                        background:
                          selected?.id === eq.id
                            ? "rgba(194,65,12,0.3)"
                            : "rgba(30,41,59,0.5)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      onClick={() => setSelected(eq)}
                    >
                      <div>
                        <p className="font-semibold text-white">{eq.id}</p>
                        {eq.label && (
                          <p className="text-xs" style={{ color: "#cbd5f5" }}>
                            {eq.label}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={eq.status} />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            {selected && (
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
                    Issue Details — {selected.id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notes" style={{ color: "#cbd5f5" }}>
                      Description of Issue *
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
                      {currentUser.badge}
                    </span>
                  </p>
                  <p className="text-sm" style={{ color: "#f87171" }}>
                    ⚠️ This will set equipment status to MAINTENANCE
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelected(null)}
                      disabled={isProcessing}
                      data-ocid="reportissue.cancel.button"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-orange-700 hover:bg-orange-600"
                      onClick={handleSubmit}
                      disabled={isProcessing || !notes.trim()}
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
