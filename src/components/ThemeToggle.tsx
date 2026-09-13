"use client";

import { useTheme } from "./ThemeProvider";

/* Toggle minimal: pastilla flotante con sol/luna.
   Sin texturas — solo el símbolo y un punto de estado. */
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
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      {/* Sol */}
      <svg viewBox="0 0 24 24" className="tt-sun" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <line x1="12" y1="2.5" x2="12" y2="4.7" />
          <line x1="12" y1="19.3" x2="12" y2="21.5" />
          <line x1="2.5" y1="12" x2="4.7" y2="12" />
          <line x1="19.3" y1="12" x2="21.5" y2="12" />
          <line x1="5.3" y1="5.3" x2="6.8" y2="6.8" />
          <line x1="17.2" y1="17.2" x2="18.7" y2="18.7" />
          <line x1="5.3" y1="18.7" x2="6.8" y2="17.2" />
          <line x1="17.2" y1="6.8" x2="18.7" y2="5.3" />
        </g>
      </svg>

      {/* Luna */}
      <svg viewBox="0 0 24 24" className="tt-moon" aria-hidden="true">
        <path
          d="M20.4 14.3A8.9 8.9 0 0 1 9.7 3.6a8.9 8.9 0 1 0 10.7 10.7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
