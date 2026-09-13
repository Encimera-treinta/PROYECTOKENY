"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BlobAvatar from "./BlobAvatar";

type Me = {
  authenticated: boolean;
  firstName?: string;
  email?: string;
};

/* Chip de sesión con Blobatar.
   Visible solo con sesión iniciada.
   Saluda de vez en cuando (1 de cada 4 visitas). */
export default function UserChip() {
  const [me, setMe] = useState<Me | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/customer/me")
      .then((r) => r.json())
      .then((data: Me) => setMe(data))
      .catch(() => setMe({ authenticated: false }));
  }, [pathname]);

  useEffect(() => {
    if (!me?.authenticated) return;

    const greet = Math.random() < 0.25;
    setShowGreeting(greet);

    if (greet) {
      const t = setTimeout(() => setShowGreeting(false), 6000);
      return () => clearTimeout(t);
    }
  }, [me, pathname]);

  if (!me?.authenticated || !me.email) {
    return null;
  }

  /* El blob se deriva del correo: único y estable por usuario. */
  return (
    <a href="/cuenta" className="user-chip" aria-label="Mi cuenta">
      <BlobAvatar seed={me.email} size={26} />
      <span>
        {showGreeting
          ? `HOLA, ${(me.firstName ?? "").toUpperCase()}`
          : (me.firstName ?? "MI CUENTA").toUpperCase()}
      </span>
    </a>
  );
}
