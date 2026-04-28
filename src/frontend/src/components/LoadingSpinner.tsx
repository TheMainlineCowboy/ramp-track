/**
 * LoadingSpinner — minimal, dark-mode-compatible spinner with optional label.
 * Sizes: sm (16px), md (24px), lg (32px).
 */

type SpinnerSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
};

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  label,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
    >
      <div
        className={`${SIZE_MAP[size]} rounded-full border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent animate-spin`}
        role="status"
        aria-label={label ?? "Loading"}
      />
      {label && (
        <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>
          {label}
        </p>
      )}
    </div>
  );
}
