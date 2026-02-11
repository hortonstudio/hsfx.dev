"use client";

import { useState, useEffect } from "react";

export function useActiveSection(sectionIds: string[]): string | undefined {
  const [activeSection, setActiveSection] = useState<string | undefined>();

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observers: IntersectionObserver[] = [];
    const visibleSections = new Map<string, number>();

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSections.set(id, entry.intersectionRatio);
            } else {
              visibleSections.delete(id);
            }

            // Find the first visible section (in document order)
            const firstVisible = sectionIds.find((sectionId) =>
              visibleSections.has(sectionId)
            );
            setActiveSection(firstVisible);
          });
        },
        {
          rootMargin: "-80px 0px -60% 0px",
          threshold: [0, 0.25, 0.5, 0.75, 1],
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sectionIds]);

  return activeSection;
}
