"use client";

/* Blobatar oficial (@blobatar/react):
   carita geométrica determinista por nombre,
   siempre viva: respira, flota, parpadea
   y sus ojos siguen el cursor. */

import { Blobatar } from "@blobatar/react";
import { useGaze } from "@blobatar/react/gaze";
import "blobatar/motion.css";
import "blobatar/gaze.css";

export default function BlobAvatar({
  seed,
  size = 32,
  className = "",
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const { ref } = useGaze({
    travel: 3,
    lookAt: "pointer",
  });

  return (
    <Blobatar
      ref={ref}
      name={seed || "sportcrz"}
      size={size}
      animate="always"
      className={`blobatar ${className}`}
    />
  );
}
