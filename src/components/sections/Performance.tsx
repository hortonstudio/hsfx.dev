'use client';

import { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useFadeUp } from '@/lib/animations';

gsap.registerPlugin(ScrollTrigger);

interface FeatureItem {
  title: string;
  description: string;
}

interface MetricBar {
  label: string;
  value: string;
  percentage: number;
}

const features: FeatureItem[] = [
  {
    title: 'Intersection Observer Preloading',
    description: 'Assets load just before they enter viewport',
  },
  {
    title: 'Gzipped Under 50kb',
    description: 'The entire codebase compressed and optimized',
  },
  {
    title: 'Container Query Breakpoints',
    description: 'Modern responsive design without media query bloat',
  },
  {
    title: 'Zero Render Blocking',
    description: 'Async loading with deferred initialization',
  },
];

const metrics: MetricBar[] = [
  { label: 'Bundle Size', value: '< 50kb', percentage: 15 },
  { label: 'Load Time', value: '0.8s', percentage: 90 },
  { label: 'Accessibility', value: '100', percentage: 100 },
  { label: 'Best Practices', value: '95', percentage: 95 },
];

export function Performance() {
  const contentRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const barsContainerRef = useRef<HTMLDivElement>(null);

  useFadeUp(contentRef, { delay: 0 });
  useFadeUp(visualRef, { delay: 0.15 });

  useEffect(() => {
    const container = barsContainerRef.current;
    if (!container) return;

    const bars = container.querySelectorAll('[data-metric-bar]');
    if (bars.length === 0) return;

    const ctx = gsap.context(() => {
      bars.forEach((bar, index) => {
        const fillElement = bar.querySelector('[data-bar-fill]');
        const valueElement = bar.querySelector('[data-bar-value]');

        if (fillElement) {
          gsap.fromTo(
            fillElement,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1,
              delay: index * 0.15,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: container,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        if (valueElement) {
          gsap.fromTo(
            valueElement,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.4,
              delay: index * 0.15 + 0.6,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: container,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });
    }, container);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className="py-section-sm md:py-section">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div ref={contentRef}>
            <h2 className="text-3xl md:text-4xl font-serif text-text-primary">
              Built for speed
            </h2>

            <p className="text-text-muted text-lg mt-4 leading-relaxed">
              Every byte counts. HSFX is engineered for performance from the
              ground up, ensuring your sites load fast and run smooth.
            </p>

            <ul className="mt-8 space-y-5">
              {features.map((feature) => (
                <li key={feature.title} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <span className="text-text-secondary font-medium">
                      {feature.title}
                    </span>
                    <span className="text-text-muted"> - {feature.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column - Performance Visual */}
          <div ref={visualRef}>
            <div className="bg-surface border border-border rounded-xl p-8">
              <div ref={barsContainerRef} className="space-y-6">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    data-metric-bar
                    data-percentage={metric.percentage}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-text-muted">
                        {metric.label}
                      </span>
                      <span
                        data-bar-value
                        className="text-lg font-bold text-text-primary opacity-0"
                      >
                        {metric.value}
                      </span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        data-bar-fill
                        className="h-full bg-accent rounded-full origin-left"
                        style={{ width: `${metric.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
