import { ChevronLeft, MapPin, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { type EquipmentEvent, getAllEvents } from "../lib/equipmentHistory";
import { formatOperatorName } from "../lib/formatOperatorName";

type MapFilter = "ALL" | "CHECK_IN" | "CHECK_OUT" | "OUTSIDE_AREA";
const FILTERS: { label: string; value: MapFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Checked In", value: "CHECK_IN" },
  { label: "Checked Out", value: "CHECK_OUT" },
  { label: "Out of Area", value: "OUTSIDE_AREA" },
];

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

// Mercator lat to normalized y (0=top, 1=bottom)
function latToY(lat: number, minLat: number, maxLat: number): number {
  const mercY = (l: number) =>
    Math.log(Math.tan(Math.PI / 4 + (l * Math.PI) / 360));
  const yMin = mercY(minLat);
  const yMax = mercY(maxLat);
  const y = mercY(lat);
  return 1 - (y - yMin) / (yMax - yMin);
}

function lonToX(lon: number, minLon: number, maxLon: number): number {
  return (lon - minLon) / (maxLon - minLon);
}

interface PinGroup {
  key: string;
  lat: number;
  lon: number;
  events: EquipmentEvent[];
  color: string;
}

const SVG_W = 800;
const SVG_H = 500;
const PADDING = 0.12;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function EquipmentMapScreen({
  currentUser,
  onBack,
  onViewEquipmentDetail,
}: {
  currentUser: { roles: string[] };
  onBack: () => void;
  onViewEquipmentDetail: (id: string) => void;
}) {
  const [filter, setFilter] = useState<MapFilter>("ALL");
  const [search, setSearch] = useState("");
  const [recentOnly, setRecentOnly] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinGroup | null>(null);
  const [selectedEventIdx, setSelectedEventIdx] = useState(0);

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

  const positions = useMemo<{ x: number; y: number }[]>(() => {
    if (pinGroups.length === 0) return [];
    if (pinGroups.length === 1) return [{ x: SVG_W / 2, y: SVG_H / 2 }];
    const lats = pinGroups.map((p) => p.lat);
    const lons = pinGroups.map((p) => p.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const padLat = (maxLat - minLat || 0.01) * PADDING;
    const padLon = (maxLon - minLon || 0.01) * PADDING;
    const bMinLat = minLat - padLat;
    const bMaxLat = maxLat + padLat;
    const bMinLon = minLon - padLon;
    const bMaxLon = maxLon + padLon;
    return pinGroups.map((p) => ({
      x: lonToX(p.lon, bMinLon, bMaxLon) * SVG_W,
      y: latToY(p.lat, bMinLat, bMaxLat) * SVG_H,
    }));
  }, [pinGroups]);

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
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "#1e293b", borderColor: "rgba(255,255,255,0.1)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "rgba(255,255,255,0.08)", color: "#cbd5f5" }}
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
        className="px-4 pt-3 pb-2 space-y-2"
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
          style={{ WebkitOverflowScrolling: "touch" }}
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

      {/* Map */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ minHeight: "300px" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,120,210,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,120,210,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {pinGroups.length === 0 ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
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
        ) : (
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-full"
            style={{ display: "block" }}
            role="img"
            aria-label="Map showing equipment transaction pin locations"
          >
            <title>Equipment transaction locations</title>
            <rect width={SVG_W} height={SVG_H} fill="rgba(0,120,210,0.04)" />

            {pinGroups.length > 1 &&
              positions.map((pos, i) =>
                i > 0 ? (
                  <line
                    key={`line-${pinGroups[i].key}`}
                    x1={positions[i - 1].x}
                    y1={positions[i - 1].y}
                    x2={pos.x}
                    y2={pos.y}
                    stroke="rgba(0,120,210,0.12)"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />
                ) : null,
              )}

            {pinGroups.map((pin, i) => {
              const pos = positions[i];
              if (!pos) return null;
              const { x, y } = pos;
              const isSelected = selectedPin?.key === pin.key;
              const count = pin.events.length;
              return (
                <g
                  key={pin.key}
                  transform={`translate(${x},${y})`}
                  onClick={() => {
                    setSelectedPin(isSelected ? null : pin);
                    setSelectedEventIdx(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedPin(isSelected ? null : pin);
                      setSelectedEventIdx(0);
                    }
                  }}
                  tabIndex={0}
                  style={{ cursor: "pointer", outline: "none" }}
                  data-ocid={`equipment-map.pin.${i + 1}`}
                  aria-label={`${pin.events[0].equipmentId} — ${getEventLabel(pin.events[0].eventType)}`}
                >
                  <circle r="20" fill="transparent" />
                  {isSelected && (
                    <circle
                      r="18"
                      fill="none"
                      stroke={pin.color}
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  )}
                  <circle r="12" fill="rgba(0,0,0,0.4)" cy="2" />
                  <circle
                    r="12"
                    fill={pin.color}
                    stroke={isSelected ? "#ffffff" : "rgba(255,255,255,0.3)"}
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                  />
                  <circle r="4" fill="rgba(255,255,255,0.7)" />
                  {count > 1 && (
                    <>
                      <circle
                        cx="10"
                        cy="-10"
                        r="7"
                        fill="#0078D2"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <text
                        x="10"
                        y="-10"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="7"
                        fontWeight="bold"
                        fontFamily="system-ui, sans-serif"
                      >
                        {count > 9 ? "9+" : count}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Legend */}
        <div
          className="absolute bottom-3 left-3 flex flex-col gap-1.5 px-3 py-2 rounded-xl text-xs"
          style={{
            background: "rgba(15,23,42,0.88)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(4px)",
          }}
        >
          {[
            { color: "#22c55e", label: "Checked In" },
            { color: "#ef4444", label: "Checked Out" },
            { color: "#f97316", label: "Out of Area" },
            { color: "#94a3b8", label: "Other" },
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
          className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium"
          style={{
            background: "rgba(15,23,42,0.85)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#94a3b8",
          }}
        >
          {pinGroups.length} location{pinGroups.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Info card */}
      {selectedPin && selectedEvent && (
        <div
          className="px-4 py-3 border-t"
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
            {selectedEvent.lat !== undefined &&
              selectedEvent.lon !== undefined && (
                <a
                  href={`https://www.google.com/maps?q=${selectedEvent.lat},${selectedEvent.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 rounded-md text-sm font-medium"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#94a3b8",
                    border: "1px solid rgba(255,255,255,0.12)",
                    textDecoration: "none",
                    minHeight: "36px",
                  }}
                  data-ocid="equipment-map.info_card.open_maps_link"
                >
                  <MapPin className="w-4 h-4" />
                  Maps
                </a>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
