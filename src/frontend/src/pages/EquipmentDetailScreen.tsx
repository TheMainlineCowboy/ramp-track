const homescreenBackground =
  "/assets/homescreenbackground-019d2e4a-c901-72bd-837b-8409f84ded93.jpg";
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
import { getHistoryForEquipment } from "../lib/equipmentHistory";
import { findById } from "../lib/equipmentRegistry";
import { formatOperatorName } from "../lib/formatOperatorName";

const formatEquipmentType = (type: string) =>
  type === "ELECTRIC_TUG"
    ? "ELECTRIC TUG"
    : type === "TUG"
      ? "TUG"
      : type.replace("_", " ");
const formatEventType = (t: string) => t.replace("_", " ");

export default function EquipmentDetailScreen({
  equipmentId,
  onBack,
}: { equipmentId: string; onBack: () => void }) {
  const equipment = findById(equipmentId);
  const history = getHistoryForEquipment(equipmentId);

  const bg = {
    backgroundImage: `url(${homescreenBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  };
  const card = {
    background: "rgba(15,23,42,0.92)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: "16px",
    boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
  };

  if (!equipment) {
    return (
      <div className="min-h-screen relative" style={bg}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/40 to-black/30 backdrop-blur-[1px]" />
        <div className="relative z-10">
          <header className="bg-card/95 backdrop-blur-sm border-b shadow-lg">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold" style={{ color: "#0078D2" }}>
                Equipment Not Found
              </h1>
              <Button variant="outline" onClick={onBack}>
                ← Back
              </Button>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6">
            <Card className="border shadow-2xl" style={card}>
              <CardContent className="py-12 text-center">
                <p style={{ color: "#cbd5f5" }}>
                  Equipment "{equipmentId}" not found.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={bg}>
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/40 to-black/30 backdrop-blur-[1px]" />
      <div className="relative z-10">
        <header className="bg-card/95 backdrop-blur-sm border-b shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#0078D2" }}>
                Equipment Details
              </h1>
              <p className="text-sm text-muted-foreground">{equipment.id}</p>
            </div>
            <Button
              variant="outline"
              onClick={onBack}
              data-ocid="equipdetail.back.button"
            >
              ← Back
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 space-y-6">
          <Card className="border shadow-2xl" style={card}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle style={{ color: "#ffffff" }}>
                  {equipment.id}
                </CardTitle>
                <StatusBadge status={equipment.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label style={{ color: "#cbd5f5" }}>Equipment ID</Label>
                <p
                  className="text-lg font-semibold mt-1"
                  style={{ color: "#ffffff" }}
                >
                  {equipment.id}
                </p>
              </div>
              <div>
                <Label style={{ color: "#cbd5f5" }}>Type</Label>
                <p className="mt-1" style={{ color: "#ffffff" }}>
                  {formatEquipmentType(equipment.type)}
                </p>
              </div>
              {equipment.label && (
                <div>
                  <Label style={{ color: "#cbd5f5" }}>Label</Label>
                  <p className="mt-1" style={{ color: "#ffffff" }}>
                    {equipment.label}
                  </p>
                </div>
              )}
              {equipment.lastOperator && (
                <div>
                  <Label style={{ color: "#cbd5f5" }}>Last Operator</Label>
                  <p className="mt-1" style={{ color: "#ffffff" }}>
                    {formatOperatorName(equipment.lastOperator)}
                  </p>
                </div>
              )}
              {equipment.checkoutTime && (
                <div>
                  <Label style={{ color: "#cbd5f5" }}>Last Checkout</Label>
                  <p className="mt-1" style={{ color: "#ffffff" }}>
                    {new Date(equipment.checkoutTime).toLocaleString()}
                  </p>
                </div>
              )}
              {equipment.returnTime && (
                <div>
                  <Label style={{ color: "#cbd5f5" }}>Last Return</Label>
                  <p className="mt-1" style={{ color: "#ffffff" }}>
                    {new Date(equipment.returnTime).toLocaleString()}
                  </p>
                </div>
              )}
              {equipment.location && (
                <div>
                  <Label style={{ color: "#cbd5f5" }}>Location</Label>
                  <p className="mt-1" style={{ color: "#ffffff" }}>
                    {equipment.location}
                  </p>
                </div>
              )}
              {equipment.maintenanceNotes && (
                <div>
                  <Label style={{ color: "#cbd5f5" }}>Maintenance Notes</Label>
                  <p className="mt-1" style={{ color: "#ffffff" }}>
                    {equipment.maintenanceNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border shadow-2xl" style={card}>
            <CardHeader>
              <CardTitle style={{ color: "#ffffff" }}>Event History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div
                  data-ocid="equipdetail.history.empty_state"
                  className="text-center py-12"
                  style={{ color: "#cbd5f5" }}
                >
                  <p className="text-lg font-medium mb-2">No events recorded</p>
                  <p className="text-sm">
                    Events will appear as operations are performed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {history.map((ev, i) => (
                    <div
                      key={ev.id}
                      data-ocid={`equipdetail.history.item.${i + 1}`}
                      className="p-4 rounded-lg border"
                      style={{
                        background: "rgba(30,41,59,0.5)",
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant={
                            ev.eventType === "CHECK_OUT"
                              ? "secondary"
                              : ev.eventType === "CHECK_IN"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {formatEventType(ev.eventType)}
                        </Badge>
                        <p className="text-xs" style={{ color: "#cbd5f5" }}>
                          {new Date(ev.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm" style={{ color: "#cbd5f5" }}>
                          <span className="font-medium">Operator:</span>{" "}
                          {formatOperatorName(ev.operator)}
                        </p>
                        {ev.location && (
                          <p className="text-sm" style={{ color: "#cbd5f5" }}>
                            <span className="font-medium">Location:</span>{" "}
                            {ev.location}
                            {ev.outsideArea && (
                              <span
                                className="ml-2 inline-block px-1.5 py-0.5 rounded text-xs font-semibold"
                                style={{
                                  background: "rgba(217,119,6,0.2)",
                                  color: "#fb923c",
                                  border: "1px solid rgba(217,119,6,0.4)",
                                }}
                              >
                                Out of designated area
                              </span>
                            )}
                          </p>
                        )}
                        {ev.lat !== undefined &&
                          ev.lon !== undefined &&
                          ev.lat !== 0 &&
                          ev.lon !== 0 && (
                            <a
                              href={`https://www.google.com/maps?q=${ev.lat},${ev.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium"
                              style={{ color: "#0078D2" }}
                              data-ocid={`equipdetail.history.maps_link.${ev.id}`}
                            >
                              📍 Open in Maps
                            </a>
                          )}
                        {ev.notes && (
                          <p className="text-sm" style={{ color: "#cbd5f5" }}>
                            <span className="font-medium">Notes:</span>{" "}
                            {ev.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <footer className="py-6 text-center text-sm text-white/90 drop-shadow-lg">
          Built by Jayson James and Ramp Track Systems.
        </footer>
      </div>
    </div>
  );
}
