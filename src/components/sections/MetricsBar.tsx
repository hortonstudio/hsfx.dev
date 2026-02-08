'use client';

import { useRef } from 'react';
import { useCountUp, useFadeUp, useStagger } from '@/lib/animations';

interface Stat {
  value: string;
  numericValue?: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

const stats: Stat[] = [
  { value: '40+', numericValue: 40, label: 'Modules', suffix: '+' },
  { value: '< 50kb', numericValue: 50, label: 'Bundle Size', prefix: '< ', suffix: 'kb' },
  { value: 'Zero', label: 'Custom JS Required' },
  { value: '100%', label: 'EM Based' },
];

function NumericStatValue({
  stat,
  delay,
}: {
  stat: Stat & { numericValue: number };
  delay: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, stat.numericValue, { delay, duration: 2 });

  return (
    <span className="text-3xl md:text-4xl font-medium text-text-primary">
      {stat.prefix}
      <span ref={ref}>0</span>
      {stat.suffix}
    </span>
  );
}

function TextStatValue({ stat, delay }: { stat: Stat; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useFadeUp(ref, { delay, duration: 0.6, y: 20 });

  return (
    <span
      ref={ref}
      className="text-3xl md:text-4xl font-medium text-text-primary"
    >
      {stat.value}
    </span>
  );
}

function StatValue({ stat, delay }: { stat: Stat; delay: number }) {
  if (stat.numericValue !== undefined) {
    return (
      <NumericStatValue
        stat={stat as Stat & { numericValue: number }}
        delay={delay}
      />
    );
  }

  return <TextStatValue stat={stat} delay={delay} />;
}

function StatItem({ stat, index, isLast }: { stat: Stat; index: number; isLast: boolean }) {
  return (
    <div className="stat-item relative flex flex-col items-center text-center py-4 md:py-0">
      <StatValue stat={stat} delay={index * 0.15} />
      <span className="text-sm text-text-muted uppercase tracking-wider mt-1">
        {stat.label}
      </span>
      {/* Vertical divider - hidden on mobile and for last item */}
      {!isLast && (
        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-border" />
      )}
    </div>
  );
}

export function MetricsBar() {
  const containerRef = useRef<HTMLDivElement>(null);

  useStagger(containerRef, '.stat-item', {
    stagger: 0.1,
    duration: 0.6,
    y: 20,
  });

  return (
    <section className="w-full bg-[#0D0D0D] border-y border-border py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div
          ref={containerRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0"
        >
          {stats.map((stat, index) => (
            <StatItem
              key={stat.label}
              stat={stat}
              index={index}
              isLast={index === stats.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
