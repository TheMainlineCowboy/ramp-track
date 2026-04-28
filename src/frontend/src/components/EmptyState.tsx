import type { LucideIcon } from "lucide-react";

/**
 * EmptyState — centered, polished empty state with icon + text.
 * Consistent with Ramp Track dark theme.
 */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center ${className}`}
    >
      <Icon
        className="mb-3"
        style={{ width: 48, height: 48, color: "rgba(148,163,184,0.4)" }}
        aria-hidden="true"
      />
      <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.6)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
