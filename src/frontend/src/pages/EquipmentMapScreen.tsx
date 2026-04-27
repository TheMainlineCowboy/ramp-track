import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ChevronLeft, MapPin, Navigation, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { type EquipmentEvent, getAllEvents } from "../lib/equipmentHistory";
import { formatOperatorName } from "../lib/formatOperatorName";

// Fix Leaflet default marker icon path (Vite build issue)
// biome-ignore lint/performance/noDelete: required to patch Leaflet's internal icon resolution
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url,
  ).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
});

type MapFilter = "ALL" | "CHECK_IN" | "CHECK_OUT" | "OUTSIDE_AREA";
const FILTERS: { label: string; value: MapFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Checked In", value: "CHECK_IN" },
  { label: "Checked Out", value: "CHECK_OUT" },
  { label: "Out of Area", value: "OUTSIDE_AREA" },
];

// PHX Sky Harbor default center
const DEFAULT_CENTER: [number, number] = [33.4342, -112.0116];
const DEFAULT_ZOOM = 15;

function getPinColor(ev: EquipmentEvent): string {
  if (ev.outsideArea) return "#f97316";
  if (ev.eventType === "CHECK_IN") return "#22c55e";
  if (ev.eventType === "CHECK_OUT") return "#ef4444";
  return "#94a3b8";
}

function getEventLabel(eventType: EquipmentEvent["eventType"]): string {
  if (eventType === "CHECK_IN") return "Check In";
  if (eventType === "CHECK_OUT") return "Check Out";
  return "Issue Report";
}

function formatTs(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PinGroup {
  key: string;
  lat: number;
  lon: number;
  events: EquipmentEvent[];
  color: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Re-centers the map when pins change
function MapRecenter({
  center,
  zoom,
}: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useMemo(() => {
    map.setView(center, zoom, { animate: false });
  }, [map, center, zoom]);
  return null;
}

// Flies map to a target location (used for initialEquipmentId centering)
function MapFlyTo({
  target,
  onDone,
}: { target: [number, number] | null; onDone: () => void }) {
  const map = useMap();
  const doneRef = useRef(false);
  useEffect(() => {
    if (target && !doneRef.current) {
      doneRef.current = true;
      map.flyTo(target, DEFAULT_ZOOM + 1, { animate: true, duration: 1 });
      onDone();
    }
  }, [target, map, onDone]);
  return null;
}

// User-location blue dot rendered inside the map
function UserLocationMarker({
  position,
}: { position: [number, number] | null }) {
  if (!position) return null;
  return (
    <CircleMarker
      center={position}
      radius={10}
      pathOptions={{
        color: "#1d4ed8",
        weight: 3,
        opacity: 1,
        fillColor: "#3b82f6",
        fillOpacity: 0.9,
      }}
    />
  );
}

export default function EquipmentMapScreen({
  currentUser,
  onBack,
  onViewEquipmentDetail,
  initialEquipmentId,
}: {
  currentUser: { roles: string[] };
  onBack: () => void;
  onViewEquipmentDetail: (id: string) => void;
  initialEquipmentId?: string;
}) {
  const [filter, setFilter] = useState<MapFilter>("ALL");
  const [search, setSearch] = useState("");
  const [recentOnly, setRecentOnly] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinGroup | null>(null);
  const [selectedEventIdx, setSelectedEventIdx] = useState(0);

  // My Location state — purely visual, never saved
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Fly-to target derived from initialEquipmentId
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const flyApplied = useRef(false);

  const isAdmin = currentUser.roles.includes("admin");
  const now = Date.now();

  const filteredEvents = useMemo(() => {
    if (!isAdmin) return [];
    let evs = getAllEvents().filter(
      (e) =>
        e.lat !== undefined &&
        e.lon !== undefined &&
        e.lat !== 0 &&
        e.lon !== 0,
    );
    if (recentOnly) evs = evs.filter((e) => now - e.timestamp <= DAY_MS);
    if (filter === "CHECK_IN")
      evs = evs.filter((e) => !e.outsideArea && e.eventType === "CHECK_IN");
    else if (filter === "CHECK_OUT")
      evs = evs.filter((e) => !e.outsideArea && e.eventType === "CHECK_OUT");
    else if (filter === "OUTSIDE_AREA") evs = evs.filter((e) => e.outsideArea);
    const q = search.trim().toLowerCase();
    if (q) {
      evs = evs.filter(
        (e) =>
          e.equipmentId.toLowerCase().includes(q) ||
          (e.operator ?? "").toLowerCase().includes(q) ||
          formatOperatorName(e.operator).toLowerCase().includes(q),
      );
    }
    return evs;
  }, [filter, search, recentOnly, isAdmin, now]);

  const pinGroups = useMemo<PinGroup[]>(() => {
    const map = new Map<string, EquipmentEvent[]>();
    for (const ev of filteredEvents) {
      const key = `${(ev.lat!).toFixed(3)},${(ev.lon!).toFixed(3)}`;
      const group = map.get(key) ?? [];
      group.push(ev);
      map.set(key, group);
    }
    return Array.from(map.entries()).map(([key, evs]) => ({
      key,
      lat: evs[0].lat!,
      lon: evs[0].lon!,
      events: evs,
      color: getPinColor(evs[0]),
    }));
  }, [filteredEvents]);

  // Compute map center from pin centroid, fall back to PHX
  const mapCenter = useMemo<[number, number]>(() => {
    if (pinGroups.length === 0) return DEFAULT_CENTER;
    const avgLat = pinGroups.reduce((s, p) => s + p.lat, 0) / pinGroups.length;
    const avgLon = pinGroups.reduce((s, p) => s + p.lon, 0) / pinGroups.length;
    return [avgLat, avgLon];
  }, [pinGroups]);

  // Resolve the fly-to target once pin groups are available
  useEffect(() => {
    if (!initialEquipmentId || flyApplied.current) return;
    // Find the most recent event for this equipment with GPS
    const allEvs = getAllEvents().filter(
      (e) =>
        e.equipmentId === initialEquipmentId &&
        e.lat !== undefined &&
        e.lon !== undefined &&
        e.lat !== 0 &&
        e.lon !== 0,
    );
    if (allEvs.length > 0) {
      const latest = allEvs.sort((a, b) => b.timestamp - a.timestamp)[0];
      setFlyTarget([latest.lat!, latest.lon!]);
    } else {
      // No GPS data for this equipment — use PHX fallback
      setFlyTarget(DEFAULT_CENTER);
    }
    // Also auto-select the pin group for this equipment if present
    const targetGroup = pinGroups.find((pg) =>
      pg.events.some((e) => e.equipmentId === initialEquipmentId),
    );
    if (targetGroup) {
      setSelectedPin(targetGroup);
      setSelectedEventIdx(0);
    }
  }, [initialEquipmentId, pinGroups]);

  // Handle "My Location" button
  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this device.");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setUserLocation(coords);
        setLocationLoading(false);
        // Fly the map to user's location — trigger via flyTarget
        setFlyTarget(coords);
        flyApplied.current = false;
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            "Location access denied. Enable location permission to use this feature.",
          );
        } else {
          setLocationError(
            "Unable to retrieve your location. Please try again.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0f172a" }}
      >
        <p style={{ color: "#94a3b8" }}>Access restricted to management.</p>
      </div>
    );
  }

  const selectedEvent = selectedPin
    ? (selectedPin.events[selectedEventIdx] ?? selectedPin.events[0])
    : null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0f172a", color: "#f1f5f9" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ background: "#1e293b", borderColor: "rgba(255,255,255,0.1)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors text-white hover:bg-[rgba(0,120,210,0.25)]"
          style={{
            background: "rgba(10,20,50,0.75)",
            borderColor: "rgba(0,120,210,0.4)",
          }}
          data-ocid="equipment-map.back_button"
          aria-label="Back to admin menu"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ color: "#0078D2" }}>
          Equipment Map
        </h1>
        <button
          type="button"
          onClick={() => setRecentOnly((v) => !v)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
          style={{
            background: recentOnly
              ? "rgba(0,120,210,0.2)"
              : "rgba(255,255,255,0.06)",
            borderColor: recentOnly ? "#0078D2" : "rgba(255,255,255,0.15)",
            color: recentOnly ? "#60b4ff" : "#94a3b8",
          }}
          data-ocid="equipment-map.recent_only.toggle"
          aria-pressed={recentOnly}
        >
          Last 24h
        </button>
      </header>

      {/* Search + Filters */}
      <div
        className="px-4 pt-3 pb-2 space-y-2 flex-shrink-0"
        style={{
          background: "#1e293b",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: "#64748b" }}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment ID or operator..."
            className="pl-9 text-sm"
            style={{
              background: "rgba(15,23,42,0.7)",
              borderColor: "rgba(255,255,255,0.12)",
              color: "#ffffff",
            }}
            data-ocid="equipment-map.search_input"
          />
        </div>
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                background:
                  filter === f.value
                    ? "rgba(0,120,210,0.25)"
                    : "rgba(15,23,42,0.5)",
                borderColor:
                  filter === f.value ? "#0078D2" : "rgba(255,255,255,0.15)",
                color: filter === f.value ? "#60b4ff" : "#94a3b8",
                boxShadow: filter === f.value ? "0 0 0 1px #0078D2" : undefined,
                minHeight: "32px",
              }}
              data-ocid={`equipment-map.filter.${f.value.toLowerCase()}.tab`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative" style={{ minHeight: "300px" }}>
        {pinGroups.length === 0 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none"
            data-ocid="equipment-map.empty_state"
          >
            <MapPin className="w-12 h-12" style={{ color: "#334155" }} />
            <p className="text-base font-medium" style={{ color: "#64748b" }}>
              No transaction locations available
            </p>
            <p className="text-sm" style={{ color: "#475569" }}>
              {search || filter !== "ALL"
                ? "Try clearing search or filters"
                : "Check-in/out with GPS enabled to see pins here"}
            </p>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%", minHeight: "300px" }}
          zoomControl={true}
          scrollWheelZoom={true}
          dragging={true}
          touchZoom={true}
          doubleClickZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Re-center when pin data changes */}
          <MapRecenter center={mapCenter} zoom={DEFAULT_ZOOM} />

          {/* Fly-to for initialEquipmentId or My Location */}
          <MapFlyTo
            target={flyTarget}
            onDone={() => {
              flyApplied.current = true;
              setFlyTarget(null);
            }}
          />

          {/* User location blue dot — purely visual, not saved */}
          <UserLocationMarker position={userLocation} />

          {pinGroups.map((pin, i) => (
            <CircleMarker
              key={pin.key}
              center={[pin.lat, pin.lon]}
              radius={12}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                opacity: 0.9,
                fillColor: pin.color,
                fillOpacity: 0.95,
              }}
              eventHandlers={{
                click: () => {
                  setSelectedPin(pin);
                  setSelectedEventIdx(0);
                },
              }}
              data-ocid={`equipment-map.pin.${i + 1}`}
            >
              <Popup
                className="leaflet-popup-ramptrack"
                closeButton={false}
                autoPan={false}
              >
                <div
                  style={{
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    minWidth: "180px",
                    color: "#f1f5f9",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: pin.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>
                      {pin.events[0].equipmentId}
                    </span>
                    {pin.events.length > 1 && (
                      <span
                        style={{
                          fontSize: "11px",
                          background: "rgba(0,120,210,0.25)",
                          color: "#60b4ff",
                          borderRadius: "4px",
                          padding: "1px 5px",
                        }}
                      >
                        {pin.events.length} events
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginBottom: "3px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Status: </span>
                    <span style={{ color: pin.color, fontWeight: 600 }}>
                      {getEventLabel(pin.events[0].eventType)}
                      {pin.events[0].outsideArea && " · Out of area"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginBottom: "3px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Operator: </span>
                    {formatOperatorName(pin.events[0].operator) ||
                      pin.events[0].operator}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Time: </span>
                    {formatTs(pin.events[0].timestamp)}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPin(pin);
                      setSelectedEventIdx(0);
                      onViewEquipmentDetail(pin.events[0].equipmentId);
                    }}
                    style={{
                      width: "100%",
                      background: "#0078D2",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend overlay */}
        <div
          className="absolute bottom-3 left-3 flex flex-col gap-1.5 px-3 py-2 rounded-xl text-xs z-[1000]"
          style={{
            background: "rgba(15,23,42,0.88)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(4px)",
            pointerEvents: "none",
          }}
        >
          {[
            { color: "#22c55e", label: "Checked In" },
            { color: "#ef4444", label: "Checked Out" },
            { color: "#f97316", label: "Out of Area" },
            { color: "#94a3b8", label: "Other" },
            { color: "#3b82f6", label: "My Location" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              <span style={{ color: "#cbd5f5" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Pin count */}
        <div
          className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium z-[1000]"
          style={{
            background: "rgba(15,23,42,0.85)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#94a3b8",
            pointerEvents: "none",
          }}
        >
          {pinGroups.length} location{pinGroups.length !== 1 ? "s" : ""}
        </div>

        {/* My Location button */}
        <div
          className="absolute z-[1000] flex flex-col items-end gap-1"
          style={{ bottom: "80px", right: "12px" }}
        >
          <button
            type="button"
            onClick={handleMyLocation}
            disabled={locationLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: userLocation
                ? "rgba(59,130,246,0.25)"
                : "rgba(15,23,42,0.9)",
              border: userLocation
                ? "1.5px solid #3b82f6"
                : "1.5px solid rgba(255,255,255,0.18)",
              color: userLocation ? "#93c5fd" : "#cbd5f5",
              backdropFilter: "blur(6px)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
              opacity: locationLoading ? 0.6 : 1,
              cursor: locationLoading ? "wait" : "pointer",
            }}
            data-ocid="equipment-map.my_location_button"
            aria-label="Center map on my current location"
          >
            <Navigation className="w-4 h-4" />
            {locationLoading ? "Locating…" : "My Location"}
          </button>
          {locationError && (
            <div
              className="text-xs px-2 py-1 rounded-lg max-w-[220px] text-center"
              style={{
                background: "rgba(15,23,42,0.92)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
              }}
              role="alert"
            >
              {locationError}
            </div>
          )}
        </div>
      </div>

      {/* Info card — shows details for the last tapped pin */}
      {selectedPin && selectedEvent && (
        <div
          className="px-4 py-3 border-t flex-shrink-0"
          style={{
            background: "#1e293b",
            borderColor: "rgba(255,255,255,0.1)",
          }}
          data-ocid="equipment-map.info_card"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: getPinColor(selectedEvent) }}
              />
              <p className="text-base font-bold text-white">
                {selectedEvent.equipmentId}
              </p>
              {selectedPin.events.length > 1 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{
                    background: "rgba(0,120,210,0.2)",
                    color: "#60b4ff",
                  }}
                >
                  {selectedPin.events.length} events
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedPin(null)}
              className="p-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8" }}
              data-ocid="equipment-map.info_card.close_button"
              aria-label="Close info card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
            <div>
              <span style={{ color: "#64748b" }}>Status: </span>
              <span
                className="font-medium"
                style={{ color: getPinColor(selectedEvent) }}
              >
                {getEventLabel(selectedEvent.eventType)}
                {selectedEvent.outsideArea && (
                  <span
                    className="ml-1 inline-block px-1.5 py-0.5 rounded text-xs"
                    style={{
                      background: "rgba(249,115,22,0.2)",
                      color: "#f97316",
                    }}
                  >
                    Out of area
                  </span>
                )}
              </span>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Operator: </span>
              <span style={{ color: "#e2e8f0" }}>
                {formatOperatorName(selectedEvent.operator) ||
                  selectedEvent.operator}
              </span>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Time: </span>
              <span style={{ color: "#e2e8f0" }}>
                {formatTs(selectedEvent.timestamp)}
              </span>
            </div>
            {selectedEvent.location && (
              <div>
                <span style={{ color: "#64748b" }}>Gate: </span>
                <span style={{ color: "#e2e8f0" }}>
                  {selectedEvent.location}
                </span>
              </div>
            )}
          </div>

          {selectedPin.events.length > 1 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs" style={{ color: "#64748b" }}>
                Event {selectedEventIdx + 1} of {selectedPin.events.length}
              </span>
              <button
                type="button"
                disabled={selectedEventIdx === 0}
                onClick={() => setSelectedEventIdx((idx) => idx - 1)}
                className="px-2 py-0.5 rounded text-xs"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color: selectedEventIdx === 0 ? "#334155" : "#94a3b8",
                }}
                data-ocid="equipment-map.info_card.prev_event_button"
              >
                ‹ Prev
              </button>
              <button
                type="button"
                disabled={selectedEventIdx === selectedPin.events.length - 1}
                onClick={() => setSelectedEventIdx((idx) => idx + 1)}
                className="px-2 py-0.5 rounded text-xs"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color:
                    selectedEventIdx === selectedPin.events.length - 1
                      ? "#334155"
                      : "#94a3b8",
                }}
                data-ocid="equipment-map.info_card.next_event_button"
              >
                Next ›
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              className="flex-1 h-9 text-sm font-semibold"
              style={{ background: "#0078D2", color: "#ffffff" }}
              onClick={() => onViewEquipmentDetail(selectedEvent.equipmentId)}
              data-ocid="equipment-map.info_card.view_details_button"
            >
              View Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
