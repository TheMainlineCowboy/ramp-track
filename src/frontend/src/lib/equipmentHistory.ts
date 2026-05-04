export type EventType = "CHECK_OUT" | "CHECK_IN" | "REPORT_ISSUE";

export interface EquipmentEvent {
  id: string;
  equipmentId: string;
  eventType: EventType;
  operator: string;
  timestamp: number;
  location?: string;
  notes?: string;
  lat?: number;
  lon?: number;
  outsideArea?: boolean;
  // Part 2 — check-in acknowledgment (optional; older records omit these)
  acknowledged?: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: { name: string; id: string };
  // Part 3 — report issue selection method (optional; older records omit these)
  selectionMethod?: "qr_scan" | "manual";
  scannedEquipmentId?: string;
  selectedEquipmentId?: string;
  manualSelectionReason?: string;
  reportedBy?: { name: string; id: string };
}

const STORAGE_KEY = "ramptrack_history";

function load(): EquipmentEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(events: EquipmentEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function recordEvent(data: Omit<EquipmentEvent, "id">): EquipmentEvent {
  const event: EquipmentEvent = {
    ...data,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
  save([event, ...load()]);
  return event;
}

export function getHistoryForEquipment(equipmentId: string): EquipmentEvent[] {
  return load()
    .filter((e) => e.equipmentId === equipmentId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getAllEvents(): EquipmentEvent[] {
  return load().sort((a, b) => b.timestamp - a.timestamp);
}
