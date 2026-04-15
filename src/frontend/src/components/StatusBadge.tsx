import { cn } from "@/lib/utils";

type EquipmentStatus = "AVAILABLE" | "ASSIGNED" | "MAINTENANCE";

const STATUS_STYLES: Record<EquipmentStatus, string> = {
  AVAILABLE: "bg-green-600 text-white",
  ASSIGNED: "bg-amber-500 text-black",
  MAINTENANCE: "bg-red-600 text-white",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const style =
    STATUS_STYLES[status as EquipmentStatus] ?? "bg-slate-600 text-white";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
        style,
        className,
      )}
    >
      {status}
    </span>
  );
}
