"use client";

import { useEffect } from "react";

/**
 * Handles the landing page's client-side behavior so the page itself
 * can stay a server component:
 * 1. Reveals `.fade-section` elements with an IntersectionObserver.
 * 2. Smooth-scrolls in-page anchor links instead of jumping.
 */
export default function LandingAnimations() {
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".fade-section"),
    );

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      sections.forEach((section) => section.classList.add("fade-in"));
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );

    if (!reduceMotion) {
      sections.forEach((section) => observer.observe(section));
    }

    function handleAnchorClick(event: MouseEvent) {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!anchor) return;
      const target = document.querySelector(anchor.getAttribute("href") ?? "");
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }

    document.addEventListener("click", handleAnchorClick);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return null;
}
