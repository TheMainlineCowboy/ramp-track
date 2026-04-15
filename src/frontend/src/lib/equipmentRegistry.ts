import {
  EQUIPMENT_LIST,
  getAllEquipmentIds,
  getEquipmentType,
} from "../data/equipmentList";

export type EquipmentType =
  | "DIESEL_TUG"
  | "ELECTRIC_TUG"
  | "STANDUP_PUSHBACK"
  | "SITDOWN_PUSHBACK";
export type EquipmentStatus = "AVAILABLE" | "ASSIGNED" | "MAINTENANCE";

export interface EquipmentRecord {
  id: string;
  type: EquipmentType;
  label?: string;
  status: EquipmentStatus;
  lastOperator?: string;
  checkoutTime?: number;
  returnTime?: number;
  location?: string;
  maintenanceNotes?: string;
  createdAt: number;
}

const STORAGE_KEY = "ramptrack_equipment_registry";

function typeFromCategory(
  cat: ReturnType<typeof getEquipmentType>,
): EquipmentType {
  switch (cat) {
    case "dieselTug":
      return "DIESEL_TUG";
    case "electricTug":
      return "ELECTRIC_TUG";
    case "standupPushback":
      return "STANDUP_PUSHBACK";
    case "sitdownPushback":
      return "SITDOWN_PUSHBACK";
    default:
      return "DIESEL_TUG";
  }
}

function labelFromType(type: EquipmentType): string {
  switch (type) {
    case "DIESEL_TUG":
      return "Diesel Tug";
    case "ELECTRIC_TUG":
      return "Electric Tug";
    case "STANDUP_PUSHBACK":
      return "Standup Pushback";
    case "SITDOWN_PUSHBACK":
      return "Sitdown Pushback";
  }
}

function buildSeedData(): EquipmentRecord[] {
  const now = Date.now();
  return getAllEquipmentIds().map((id) => {
    const cat = getEquipmentType(id);
    const type = typeFromCategory(cat);
    return {
      id,
      type,
      label: labelFromType(type),
      status: "AVAILABLE",
      createdAt: now,
    };
  });
}

// Pattern to detect old-format labels that included the ID, e.g. "Diesel Tug TV0096"
const OLD_LABEL_RE =
  /^(Diesel Tug|Electric Tug|Standup Pushback|Sitdown Pushback) TV\d+$/i;

function load(): EquipmentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const records: EquipmentRecord[] = JSON.parse(raw);
      const allIds = getAllEquipmentIds();
      let dirty = false;

      // Fix any existing records whose label still contains the ID
      for (const rec of records) {
        if (rec.label && OLD_LABEL_RE.test(rec.label)) {
          rec.label = labelFromType(rec.type);
          dirty = true;
        }
      }

      // Ensure all canonical IDs are present; add any that are missing
      for (const id of allIds) {
        if (!records.find((r) => r.id === id)) {
          const cat = getEquipmentType(id);
          const type = typeFromCategory(cat);
          records.push({
            id,
            type,
            label: labelFromType(type),
            status: "AVAILABLE",
            createdAt: Date.now(),
          });
          dirty = true;
        }
      }

      if (dirty) localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return records;
    }
  } catch {}
  const seed = buildSeedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function save(records: EquipmentRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getAllEquipment(): EquipmentRecord[] {
  return load();
}

export function findById(id: string): EquipmentRecord | null {
  return load().find((r) => r.id === id) ?? null;
}

export function addEquipment(data: {
  id: string;
  type: EquipmentType;
  label?: string;
}): { success: boolean; error?: string } {
  const records = load();
  if (records.find((r) => r.id === data.id))
    return { success: false, error: `Equipment "${data.id}" already exists.` };
  save([...records, { ...data, status: "AVAILABLE", createdAt: Date.now() }]);
  return { success: true };
}

export function updateEquipment(
  id: string,
  updates: Partial<EquipmentRecord>,
): { success: boolean; error?: string } {
  const records = load();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1)
    return { success: false, error: `Equipment "${id}" not found.` };
  records[idx] = { ...records[idx], ...updates };
  save(records);
  return { success: true };
}

export {
  EQUIPMENT_LIST,
  getAllEquipmentIds,
  isValidEquipmentId,
} from "../data/equipmentList";
