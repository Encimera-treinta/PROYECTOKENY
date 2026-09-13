"use client";

/* Blobatar oficial (@blobatar/react):
   carita geométrica determinista por nombre,
   con animación (respira, parpadea, mira el cursor). */

import { Blobatar } from "@blobatar/react";
import "blobatar/motion.css";

export default function BlobAvatar({
  seed,
  size = 32,
  className = "",
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  return (
    <Blobatar
      name={seed || "sportcrz"}
      size={size}
      animate="hover"
      className={`blobatar ${className}`}
    />
  );
}
