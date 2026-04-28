import type { ReactNode } from "react";

/**
 * PageTransition — wraps a screen in a subtle 200ms fade + slight upward slide.
 * Uses tailwindcss-animate utility classes (animate-in, fade-in-0, slide-in-from-bottom-2).
 * No bounce, no zoom, no dramatic effects — native mobile app feel.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 ease-out">
      {children}
    </div>
  );
}
