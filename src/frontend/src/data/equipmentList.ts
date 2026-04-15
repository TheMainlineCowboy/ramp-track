export const EQUIPMENT_LIST = {
  dieselTugs: [
    "TV0096",
    "TV0196",
    "TV0434",
    "TV0462",
    "TV0527",
    "TV0561",
    "TV0637",
    "TV0640",
    "TV0641",
    "TV0720",
    "TV0877",
    "TV0878",
    "TV0883",
    "TV0884",
    "TV0887",
    "TV0888",
    "TV0889",
    "TV0890",
    "TV0891",
    "TV0892",
    "TV0893",
    "TV0894",
    "TV0895",
    "TV0896",
    "TV0897",
    "TV0898",
    "TV0899",
    "TV0900",
    "TV0901",
    "TV0902",
    "TV0903",
    "TV0904",
    "TV0905",
    "TV0906",
    "TV0907",
    "TV0908",
    "TV0925",
    "TV0989",
    "TV0990",
    "TV1280",
  ],
  electricTugs: [
    "TV1077",
    "TV1078",
    "TV1079",
    "TV1080",
    "TV1081",
    "TV1082",
    "TV1083",
    "TV1084",
    "TV1088",
    "TV1089",
    "TV1341",
    "TV1342",
    "TV1343",
    "TV1344",
  ],
  standupPushbacks: ["TV1274", "TV1275", "TV1276", "TV1277"],
  sitdownPushbacks: [
    "TV0910",
    "TV0911",
    "TV0912",
    "TV0913",
    "TV0914",
    "TV0915",
    "TV0916",
    "TV0917",
    "TV0918",
    "TV0919",
  ],
};

export function getAllEquipmentIds(): string[] {
  return [
    ...EQUIPMENT_LIST.dieselTugs,
    ...EQUIPMENT_LIST.electricTugs,
    ...EQUIPMENT_LIST.standupPushbacks,
    ...EQUIPMENT_LIST.sitdownPushbacks,
  ];
}

export function isValidEquipmentId(id: string): boolean {
  return getAllEquipmentIds().includes(id.toUpperCase());
}

export function getEquipmentType(
  id: string,
): "dieselTug" | "electricTug" | "standupPushback" | "sitdownPushback" | null {
  const upper = id.toUpperCase();
  if (EQUIPMENT_LIST.dieselTugs.includes(upper)) return "dieselTug";
  if (EQUIPMENT_LIST.electricTugs.includes(upper)) return "electricTug";
  if (EQUIPMENT_LIST.standupPushbacks.includes(upper)) return "standupPushback";
  if (EQUIPMENT_LIST.sitdownPushbacks.includes(upper)) return "sitdownPushback";
  return null;
}
