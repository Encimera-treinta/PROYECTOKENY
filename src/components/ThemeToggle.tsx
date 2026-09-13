"use client";

import { useTheme } from "./ThemeProvider";

/* Toggle light/dark estilo iOS 26 — switch suave. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle ${theme} ${className}`}
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
      aria-pressed={theme === "light"}
    >
      <span className="theme-toggle-knob">
        {/* Sol */}
        <svg viewBox="0 0 24 24" className="icon-sun" aria-hidden="true">
          <circle cx="12" cy="12" r="4.4" />
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="12" y1="2.2" x2="12" y2="4.6" />
            <line x1="12" y1="19.4" x2="12" y2="21.8" />
            <line x1="2.2" y1="12" x2="4.6" y2="12" />
            <line x1="19.4" y1="12" x2="21.8" y2="12" />
            <line x1="5" y1="5" x2="6.7" y2="6.7" />
            <line x1="17.3" y1="17.3" x2="19" y2="19" />
            <line x1="5" y1="19" x2="6.7" y2="17.3" />
            <line x1="17.3" y1="6.7" x2="19" y2="5" />
          </g>
        </svg>
        {/* Luna */}
        <svg viewBox="0 0 24 24" className="icon-moon" aria-hidden="true">
          <path
            d="M20.6 14.2A8.8 8.8 0 0 1 9.8 3.4a8.8 8.8 0 1 0 10.8 10.8Z"
            fill="currentColor"
          />
        </svg>
      </span>
    </button>
  );
}
