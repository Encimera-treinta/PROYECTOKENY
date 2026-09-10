"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function HomeAnimations() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      /* =====================================
         HERO — entrada al cargar la página
      ===================================== */

      const heroTitle = document.querySelector(
        ".hero-title span"
      );

      const heroTl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      if (heroTitle) {
        heroTl
          .fromTo(
            ".home-hero-video",
            { scale: 1.15, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.4 },
            0
          )
          .fromTo(
            ".hero-kicker",
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7 },
            0.2
          )
          .fromTo(
            ".hero-title span",
            { yPercent: 110, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.9,
              stagger: 0.12,
            },
            0.35
          )
          .fromTo(
            ".hero-bottom",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 },
            0.75
          )
          .fromTo(
            ".hero-footer",
            { opacity: 0 },
            { opacity: 1, duration: 0.8 },
            1.05
          );
      }

      /* =====================================
         SECCIONES — reveal al hacer scroll
      ===================================== */

      const revealTargets = [
        ".home-intro .intro-layout h2",
        ".home-intro .intro-copy",
        ".categories-grid .category-card",
        ".drop-grid .drop-card",
        ".story-person",
        ".story-copy",
      ];

      revealTargets.forEach((selector) => {
        gsap.utils.toArray<HTMLElement>(selector).forEach((el) => {
          gsap.fromTo(
            el,
            { y: 48, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                once: true,
              },
            }
          );
        });
      });

      /* =====================================
         SECTION HEADINGS
      ===================================== */

      gsap.utils
        .toArray<HTMLElement>(".section-heading")
        .forEach((el) => {
          gsap.fromTo(
            el.querySelectorAll(".section-index, h2"),
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.15,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                once: true,
              },
            }
          );
        });

      /* =====================================
         MANIFIESTO — líneas gigantes
      ===================================== */

      gsap.utils
        .toArray<HTMLElement>(".manifesto-line")
        .forEach((line, index) => {
          gsap.fromTo(
            line,
            { xPercent: index % 2 === 0 ? -8 : 8, opacity: 0 },
            {
              xPercent: 0,
              opacity: 1,
              duration: 1.1,
              ease: "power4.out",
              scrollTrigger: {
                trigger: line,
                start: "top 90%",
                once: true,
              },
            }
          );
        });

      /* =====================================
         BANNER REBAJAS
      ===================================== */

      const saleBanner = document.querySelector(".sale-banner");

      if (saleBanner) {
        gsap.fromTo(
          ".sale-content > *",
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.14,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".sale-banner",
              start: "top 75%",
              once: true,
            },
          }
        );

        gsap.to(".sale-background img", {
          yPercent: -12,
          ease: "none",
          scrollTrigger: {
            trigger: ".sale-banner",
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      /* =====================================
         FOOTER
      ===================================== */

      gsap.fromTo(
        ".footer-top h2",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".home-footer",
            start: "top 90%",
            once: true,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return null;
}
