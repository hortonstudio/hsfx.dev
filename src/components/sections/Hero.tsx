'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useFadeUp } from '@/lib/animations';
import { Button } from '@/components/ui/Button';

export function Hero() {
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useFadeUp(badgeRef, { delay: 0.1 });
  useFadeUp(headlineRef, { delay: 0.2 });
  useFadeUp(subtitleRef, { delay: 0.3 });
  useFadeUp(statusRef, { delay: 0.4 });

  return (
    <section className="min-h-[90vh] flex items-center justify-center py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Status Badge */}
        <div ref={badgeRef} className="inline-flex items-center gap-2 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          <span className="text-xs uppercase tracking-widest text-text-muted">
            Under Development
          </span>
        </div>

        {/* Main Headline */}
        <h1
          ref={headlineRef}
          className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-text-primary leading-[1.1] tracking-tight"
        >
          Build faster.
          <br />
          <span className="text-text-secondary">Ship cleaner.</span>
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="mt-8 text-lg md:text-xl text-text-muted max-w-xl mx-auto leading-relaxed"
        >
          A component-driven Webflow framework with attribute modules,
          CMS automation, and a complete developer toolkit.
        </p>

        {/* Style Guide Link */}
        <div ref={statusRef} className="mt-12">
          <Link href="/styleguide">
            <Button variant="ghost">
              View Style Guide
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Button>
          </Link>
        </div>

        {/* Development Status */}
        <div
          className="mt-12 inline-flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-sm text-text-dim"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>Components</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>Attributes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
            <span>Kit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-text-dim"></div>
            <span>Documentation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
