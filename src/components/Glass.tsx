"use client";

import { useEffect, useRef, useState } from "react";

/* Contenedor con el efecto Liquid Glass de Apple:
   blur + saturación + borde luminoso interior + brillo
   especular que sigue el cursor. Cero dependencias. */

export default function Glass({
  children,
  className = "",
  strength = "regular",
  onClick,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: "subtle" | "regular" | "strong";
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [glare, setGlare] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    function onMove(this: HTMLDivElement, e: MouseEvent) {
      const rect = this.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setGlare({ x, y });
    }

    el.addEventListener("mousemove", onMove);

    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  const blur =
    strength === "subtle" ? 10 : strength === "strong" ? 26 : 16;

  return (
    <div
      ref={ref}
      className={`lg-glass ${className}`}
      onClick={onClick}
      style={{
        ...style,
        "--lg-blur": `${blur}px`,
        "--lg-glare-x": `${glare.x}%`,
        "--lg-glare-y": `${glare.y}%`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
