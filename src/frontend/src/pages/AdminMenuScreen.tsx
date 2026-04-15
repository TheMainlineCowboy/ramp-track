import { useState } from "react";
const homescreenBackground =
  "/assets/homescreenbackground-019d2e4a-c901-72bd-837b-8409f84ded93.jpg";
import { Search } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { getAllEvents } from "../lib/equipmentHistory";
import { getAllEquipment } from "../lib/equipmentRegistry";
import type { EquipmentType } from "../lib/equipmentRegistry";
import { formatOperatorName } from "../lib/formatOperatorName";

type FilterType = "ALL" | "AVAILABLE" | "ASSIGNED" | "MAINTENANCE";
type TypeFilterType = "ALL" | EquipmentType;

function formatUserDisplayName(user: {
  name?: string;
  username: string;
  badge: string;
}) {
  const raw = user.name || user.username || user.badge || "";
  if (!raw) return "";
  const parts = raw.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (/[a-zA-Z]/.test(first)) {
      return first;
    }
    return `${first.charAt(0).toUpperCase()}. ${last}`;
  }
  return raw;
}

const TYPE_FILTERS: { label: string; value: TypeFilterType }[] = [
  { label: "All Types", value: "ALL" },
  { label: "Diesel", value: "DIESEL_TUG" },
  { label: "Electric", value: "ELECTRIC_TUG" },
  { label: "Standup", value: "STANDUP_PUSHBACK" },
  { label: "Sitdown", value: "SITDOWN_PUSHBACK" },
];

export default function AdminMenuScreen({
  onManageEquipment,
  onViewEquipment,
  onBack,
  onLogout,
  currentUser,
}: {
  onManageEquipment: () => void;
  onViewEquipment: (id: string) => void;
  onBack: () => void;
  onLogout: () => void;
  currentUser: {
    name?: string;
    username: string;
    badge: string;
    roles: string[];
  };
}) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilterType>("ALL");
  const [idSearch, setIdSearch] = useState("");
  const equipment = getAllEquipment();
  const events = getAllEvents().slice(0, 10);
  const available = equipment.filter((e) => e.status === "AVAILABLE").length;
  const assigned = equipment.filter((e) => e.status === "ASSIGNED").length;
  const maintenance = equipment.filter(
    (e) => e.status === "MAINTENANCE",
  ).length;

  const filteredEquipment = equipment.filter((e) => {
    const statusMatch = activeFilter === "ALL" || e.status === activeFilter;
    const typeMatch = typeFilter === "ALL" || e.type === typeFilter;
    const idMatch =
      idSearch.trim() === "" ||
      e.id.toUpperCase().includes(idSearch.trim().toUpperCase());
    return statusMatch && typeMatch && idMatch;
  });

  const stats: {
    label: string;
    value: number;
    color: string;
    filter: FilterType;
  }[] = [
    {
      label: "Total",
      value: equipment.length,
      color: "#cbd5f5",
      filter: "ALL",
    },
    {
      label: "Available",
      value: available,
      color: "#4ade80",
      filter: "AVAILABLE",
    },
    {
      label: "Assigned",
      value: assigned,
      color: "#60a5fa",
      filter: "ASSIGNED",
    },
    {
      label: "Maintenance",
      value: maintenance,
      color: "#f87171",
      filter: "MAINTENANCE",
    },
  ];

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
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/40 to-black/30 backdrop-blur-[1px]" />
      <div className="relative z-10">
        <header className="bg-card/95 backdrop-blur-sm border-b shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#0078D2" }}>
                Admin Menu
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatUserDisplayName(currentUser)} &middot; Management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onBack}
                data-ocid="admin.back.button"
              >
                &larr; Back
              </Button>
              <Button
                variant="outline"
                onClick={onLogout}
                data-ocid="admin.logout.button"
              >
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setActiveFilter(s.filter)}
                className="rounded-xl p-4 border text-center transition-all cursor-pointer"
                style={{
                  background:
                    activeFilter === s.filter
                      ? "rgba(0,120,210,0.25)"
                      : "rgba(15,23,42,0.92)",
                  borderColor:
                    activeFilter === s.filter
                      ? "#0078D2"
                      : "rgba(255,255,255,0.18)",
                  boxShadow:
                    activeFilter === s.filter ? "0 0 0 2px #0078D2" : undefined,
                }}
              >
                <p className="text-3xl font-bold" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-sm mt-1" style={{ color: "#cbd5f5" }}>
                  {s.label}
                </p>
              </button>
            ))}
          </div>
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
                Management Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                data-ocid="admin.manage_equipment.button"
                className="h-16 text-lg bg-blue-700 hover:bg-blue-600"
                onClick={onManageEquipment}
              >
                &#128295; Manage Equipment
              </Button>
              <Button
                data-ocid="admin.view_all.button"
                variant="outline"
                className="h-16 text-lg"
                onClick={() => equipment[0] && onViewEquipment(equipment[0].id)}
              >
                &#128203; View Equipment Details
              </Button>
            </CardContent>
          </Card>
          <Card
            className="border shadow-2xl"
            style={{
              background: "rgba(15,23,42,0.92)",
              borderColor: "rgba(255,255,255,0.18)",
              borderRadius: "16px",
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle style={{ color: "#ffffff" }}>
                {activeFilter === "ALL"
                  ? "All Equipment"
                  : `${activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()} Equipment`}
                <span
                  className="ml-2 text-base font-normal"
                  style={{ color: "#94a3b8" }}
                >
                  ({filteredEquipment.length})
                </span>
              </CardTitle>
              {/* Type filter segmented control */}
              <div
                className="overflow-x-auto mt-3"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="flex flex-nowrap gap-2 pb-1">
                  {TYPE_FILTERS.map((tf) => (
                    <button
                      key={tf.value}
                      type="button"
                      onClick={() => setTypeFilter(tf.value)}
                      data-ocid={`admin.type_filter.${tf.value.toLowerCase()}.tab`}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                      style={{
                        background:
                          typeFilter === tf.value
                            ? "rgba(0,120,210,0.25)"
                            : "rgba(30,41,59,0.6)",
                        borderColor:
                          typeFilter === tf.value
                            ? "#0078D2"
                            : "rgba(255,255,255,0.15)",
                        color: typeFilter === tf.value ? "#60b4ff" : "#94a3b8",
                        boxShadow:
                          typeFilter === tf.value
                            ? "0 0 0 1px #0078D2"
                            : undefined,
                        minHeight: "36px",
                      }}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Equipment ID search */}
              <div className="relative mt-3">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#94a3b8" }}
                />
                <Input
                  data-ocid="admin.equipment.search_input"
                  value={idSearch}
                  onChange={(e) => setIdSearch(e.target.value)}
                  placeholder="Search equipment ID"
                  className="pl-10"
                  style={{
                    background: "rgba(30,41,59,0.6)",
                    borderColor: "rgba(255,255,255,0.15)",
                    color: "#ffffff",
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredEquipment.length === 0 ? (
                  <p
                    className="text-center py-4"
                    style={{ color: "#94a3b8" }}
                    data-ocid="admin.equipment.empty_state"
                  >
                    No equipment in this category.
                  </p>
                ) : (
                  filteredEquipment.map((eq, i) => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => onViewEquipment(eq.id)}
                      data-ocid={`admin.equipment.item.${i + 1}`}
                      className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                      style={{
                        background: "rgba(30,41,59,0.5)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <div>
                        <p className="font-semibold text-white">{eq.id}</p>
                        {eq.label && (
                          <p className="text-xs" style={{ color: "#cbd5f5" }}>
                            {eq.label}
                          </p>
                        )}
                        {eq.status === "ASSIGNED" && eq.location && (
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "#94a3b8" }}
                          >
                            &#128205; {eq.location}
                          </p>
                        )}
                        {eq.status === "ASSIGNED" && eq.checkoutTime && (
                          <p className="text-xs" style={{ color: "#94a3b8" }}>
                            &#128336;{" "}
                            {new Date(eq.checkoutTime).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={eq.status} />
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
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
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div
                  data-ocid="admin.events.empty_state"
                  className="text-center py-8"
                  style={{ color: "#cbd5f5" }}
                >
                  <p>No events yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {events.map((ev, i) => (
                    <div
                      key={ev.id}
                      data-ocid={`admin.events.item.${i + 1}`}
                      className="flex items-start justify-between p-3 rounded-lg"
                      style={{
                        background: "rgba(30,41,59,0.5)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {ev.equipmentId}
                        </p>
                        <p className="text-xs" style={{ color: "#cbd5f5" }}>
                          by {formatOperatorName(ev.operator)}
                        </p>
                        {ev.location && (
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "#94a3b8" }}
                          >
                            &#128205; {ev.location}
                          </p>
                        )}
                        {ev.notes && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "#cbd5f5" }}
                          >
                            {ev.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <Badge
                          variant={
                            ev.eventType === "CHECK_OUT"
                              ? "secondary"
                              : ev.eventType === "CHECK_IN"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {ev.eventType.replace("_", " ")}
                        </Badge>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "#cbd5f5" }}
                        >
                          {new Date(ev.timestamp).toLocaleString()}
                        </p>
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
