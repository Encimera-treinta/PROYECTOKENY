"use client";

import { useEffect, useState } from "react";

/**
 * Fuerza el autoplay del video del hero en iOS/Safari,
 * donde el atributo `autoplay` puede no bastar (p. ej. con
 * el modo de batería baja). Si el navegador bloquea el play,
 * se hace un único intento con el primer toque/scroll del
 * usuario — imperceptible, sin que se vea como reproductor.
 */
export default function HeroVideoAutoplay() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>(
      ".home-hero-video"
    );

    if (!video) return;

    let started = false;

    const setVideoState = (state: "playing" | "waiting") => {
      video.dataset.videoState = state;
    };

    const cleanup = () => {
      window.removeEventListener("touchend", onGesture);
      window.removeEventListener("click", onGesture);
      document.removeEventListener("scroll", onGesture, true);
      window.removeEventListener("pointerdown", onGesture);
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
            setVideoState("playing");
            setIsPlaying(true);
            cleanup();
          })
          .catch(() => {
            setVideoState("waiting");
          });
      }
    };

    const onGesture = () => tryPlay();

    setVideoState("waiting");

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    window.addEventListener("touchend", onGesture);
    window.addEventListener("click", onGesture);
    document.addEventListener("scroll", onGesture, true);
    window.addEventListener("pointerdown", onGesture, { passive: true });

    tryPlay();

    return () => {
      cleanup();
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, []);

  const toggleVideo = () => {
    const video = document.querySelector<HTMLVideoElement>(".home-hero-video");
    if (!video) return;

    if (video.paused) {
      video.muted = true;
      void video.play().then(() => setIsPlaying(true));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <button
      type="button"
      className={`hero-video-toggle${isPlaying ? " is-visible" : ""}`}
      onClick={toggleVideo}
      aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
      aria-hidden={!isPlaying}
      tabIndex={isPlaying ? 0 : -1}
    >
      <span aria-hidden="true">Ⅱ</span>
    </button>
  );
}
