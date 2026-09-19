"use client";

import { useEffect } from "react";

/**
 * Fuerza el autoplay del video del hero en iOS/Safari,
 * donde el atributo `autoplay` puede no bastar (p. ej. con
 * el modo de batería baja). Si el navegador bloquea el play,
 * se hace un único intento con el primer toque/scroll del
 * usuario — imperceptible, sin que se vea como reproductor.
 */
export default function HeroVideoAutoplay() {
  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>(
      ".home-hero-video"
    );

    if (!video) return;

    let started = false;

    const cleanup = () => {
      window.removeEventListener("touchend", onGesture);
      window.removeEventListener("click", onGesture);
      document.removeEventListener("scroll", onGesture, true);
    };

    const tryPlay = () => {
      if (started) return;

      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");

      const result = video.play();

      if (result !== undefined) {
        result
          .then(() => {
            started = true;
            cleanup();
          })
          .catch(() => {
            /* Bloqueado por el navegador: se reintenta con
               el primer gesto del usuario. */
          });
      }
    };

    const onGesture = () => tryPlay();

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    window.addEventListener("touchend", onGesture);
    window.addEventListener("click", onGesture);
    document.addEventListener("scroll", onGesture, true);

    tryPlay();

    return () => {
      cleanup();
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, []);

  return null;
}