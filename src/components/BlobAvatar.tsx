"use client";

/* Blobatar oficial (@blobatar/react):
   carita geométrica determinista por nombre.
   Siempre viva y MUY expresiva: respira fuerte,
   flota, se inclina, se menea, parpadea y sus
   ojos siguen el cursor. */

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
    travel: 5,
    lookAt: "pointer",
  });

  return (
    <Blobatar
      ref={ref}
      name={seed || "sportcrz"}
      size={size}
      animate="always"
      className={`blobatar blobatar-alive ${className}`}
      style={
        {
          /* Más vida: amplitud y velocidad al máximo
             dentro de lo natural. */
          "--mo-amp": "1.8",
          "--mo-rate": "1.35",
          "--mo-tilt": "1.6",
          "--mo-shake": "1.5",
          "--mo-rock": "1.4",
          "--mo-bob": "1.5",
        } as React.CSSProperties
      }
    />
  );
}
