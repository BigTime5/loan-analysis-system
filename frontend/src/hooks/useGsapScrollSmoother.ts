import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// ── Module-level Lenis singleton ──────────────────────────────────
let _lenis: Lenis | null = null;

/**
 * Smooth-scroll to a target element/selector/position.
 * Falls back to native scrollTo when Lenis is not mounted.
 */
export function smoothScrollTo(
  target: string | number | HTMLElement,
  options?: { offset?: number; duration?: number; immediate?: boolean }
) {
  if (_lenis) {
    _lenis.scrollTo(target, {
      offset: options?.offset ?? 0,
      duration: options?.duration ?? 1.4,
      immediate: options?.immediate ?? false,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
    });
  } else {
    // Fallback for non-landing pages
    const el =
      typeof target === 'string'
        ? document.querySelector(target)
        : typeof target === 'number'
          ? null
          : target;
    window.scrollTo({
      top: el ? el.getBoundingClientRect().top + window.scrollY + (options?.offset ?? 0) : (target as number),
      behavior: 'smooth',
    });
  }
}

/**
 * Hook: initialises Lenis, syncs it with GSAP's ticker so that
 * ScrollTrigger timelines fire at exactly the right scroll offsets.
 *
 * Call this once inside the landing page component.
 */
export function useGsapScrollSmoother() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect reduced-motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: prefersReduced ? 0.01 : 1.2,    // momentum duration
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      // Smooth on all pointing devices including touchpads
      touchMultiplier: 1.5,
      infinite: false,
    });

    _lenis = lenis;
    lenisRef.current = lenis;

    // ── Sync Lenis → GSAP ScrollTrigger ──────────────────────────
    // Every time Lenis recalculates scroll, tell ScrollTrigger to update.
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis's RAF loop from GSAP's ticker so both run on the
    // same animation frame — no fighting, no jank.
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000); // GSAP gives seconds, Lenis expects ms
    };
    gsap.ticker.add(tickerCallback);

    // Disable GSAP's default lag-smoothing so Lenis is in full control
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      _lenis = null;
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}

/**
 * Utility: create a scroll-triggered entrance animation for a section.
 * Call inside useEffect within each section component.
 */
export function createSectionTimeline(
  triggerElement: string | Element,
  options?: {
    start?: string;
    end?: string;
    scrub?: boolean | number;
  }
) {
  return gsap.timeline({
    scrollTrigger: {
      trigger: triggerElement,
      start: options?.start || 'top 80%',
      end: options?.end || 'top 20%',
      toggleActions: 'play none none none',
      ...(options?.scrub !== undefined ? { scrub: options.scrub } : {}),
    },
  });
}
