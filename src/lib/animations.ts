'use client';

import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// Types
// ============================================================================

interface FadeUpOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  y?: number;
  triggerStart?: string;
  triggerEnd?: string;
  toggleActions?: string;
}

interface StaggerOptions {
  duration?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
  y?: number;
  triggerStart?: string;
}

interface TextRevealOptions {
  duration?: number;
  stagger?: number;
  ease?: string;
  splitBy?: 'words' | 'lines';
  triggerStart?: string;
}

interface CountUpOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  triggerStart?: string;
  separator?: string;
  decimals?: number;
}

interface ParallaxOptions {
  amount?: number;
  triggerStart?: string;
  triggerEnd?: string;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fade up animation triggered on scroll.
 * Animates from opacity 0 + translateY(40px) to visible.
 */
export function useFadeUp<T extends HTMLElement>(
  ref: RefObject<T>,
  options: FadeUpOptions = {}
): void {
  const {
    duration = 0.8,
    delay = 0,
    ease = 'power3.out',
    y = 40,
    triggerStart = 'top 85%',
    triggerEnd = 'bottom 20%',
    toggleActions = 'play none none none',
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease,
          scrollTrigger: {
            trigger: element,
            start: triggerStart,
            end: triggerEnd,
            toggleActions,
          },
        }
      );
    }, element);

    return () => {
      ctx.revert();
    };
  }, [ref, duration, delay, ease, y, triggerStart, triggerEnd, toggleActions]);
}

/**
 * Stagger animation for child elements.
 * Animates children sequentially with a delay between each.
 */
export function useStagger<T extends HTMLElement>(
  containerRef: RefObject<T>,
  childSelector: string,
  options: StaggerOptions = {}
): void {
  const {
    duration = 0.6,
    delay = 0,
    stagger = 0.1,
    ease = 'power3.out',
    y = 30,
    triggerStart = 'top 85%',
  } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = container.querySelectorAll(childSelector);
    if (children.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        children,
        {
          opacity: 0,
          y,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger,
          ease,
          scrollTrigger: {
            trigger: container,
            start: triggerStart,
            toggleActions: 'play none none none',
          },
        }
      );
    }, container);

    return () => {
      ctx.revert();
    };
  }, [containerRef, childSelector, duration, delay, stagger, ease, y, triggerStart]);
}

/**
 * Text reveal animation using clip-path.
 * Reveals text word-by-word or line-by-line.
 */
export function useTextReveal<T extends HTMLElement>(
  ref: RefObject<T>,
  options: TextRevealOptions = {}
): void {
  const {
    duration = 0.8,
    stagger = 0.05,
    ease = 'power3.out',
    splitBy = 'words',
    triggerStart = 'top 85%',
  } = options;

  const originalContentRef = useRef<string>('');

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Store original content
    originalContentRef.current = element.innerHTML;
    const text = element.textContent || '';

    // Split text into words or lines
    let items: string[];
    if (splitBy === 'words') {
      items = text.split(/\s+/).filter(Boolean);
    } else {
      // For lines, we need to handle this differently
      // We'll wrap each word and let CSS handle line breaks
      items = text.split(/\s+/).filter(Boolean);
    }

    // Create wrapper spans
    element.innerHTML = items
      .map(
        (item) =>
          `<span style="display: inline-block; overflow: hidden;"><span class="text-reveal-item" style="display: inline-block;">${item}</span></span>&nbsp;`
      )
      .join('');

    const ctx = gsap.context(() => {
      const revealItems = element.querySelectorAll('.text-reveal-item');

      gsap.fromTo(
        revealItems,
        {
          y: '100%',
          clipPath: 'inset(100% 0% 0% 0%)',
        },
        {
          y: '0%',
          clipPath: 'inset(0% 0% 0% 0%)',
          duration,
          stagger,
          ease,
          scrollTrigger: {
            trigger: element,
            start: triggerStart,
            toggleActions: 'play none none none',
          },
        }
      );
    }, element);

    return () => {
      ctx.revert();
      // Restore original content
      if (element && originalContentRef.current) {
        element.innerHTML = originalContentRef.current;
      }
    };
  }, [ref, duration, stagger, ease, splitBy, triggerStart]);
}

/**
 * Count up animation for numbers.
 * Animates from 0 to the end value.
 */
export function useCountUp<T extends HTMLElement>(
  ref: RefObject<T>,
  endValue: number,
  options: CountUpOptions = {}
): void {
  const {
    duration = 2,
    delay = 0,
    ease = 'power2.out',
    triggerStart = 'top 85%',
    separator = ',',
    decimals = 0,
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const counter = { value: 0 };

    const ctx = gsap.context(() => {
      gsap.to(counter, {
        value: endValue,
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: element,
          start: triggerStart,
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          const formattedValue = counter.value.toFixed(decimals);
          const parts = formattedValue.split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
          element.textContent = parts.join('.');
        },
      });
    }, element);

    return () => {
      ctx.revert();
    };
  }, [ref, endValue, duration, delay, ease, triggerStart, separator, decimals]);
}

/**
 * Parallax effect triggered on scroll.
 * Creates subtle vertical movement based on scroll position.
 */
export function useParallax<T extends HTMLElement>(
  ref: RefObject<T>,
  options: ParallaxOptions = {}
): void {
  const {
    amount = 20,
    triggerStart = 'top bottom',
    triggerEnd = 'bottom top',
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        element,
        {
          y: -amount,
        },
        {
          y: amount,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: triggerStart,
            end: triggerEnd,
            scrub: true,
          },
        }
      );
    }, element);

    return () => {
      ctx.revert();
    };
  }, [ref, amount, triggerStart, triggerEnd]);
}

// ============================================================================
// Utility: Refresh ScrollTrigger
// ============================================================================

/**
 * Refreshes all ScrollTrigger instances.
 * Useful after dynamic content changes.
 */
export function refreshScrollTrigger(): void {
  ScrollTrigger.refresh();
}
