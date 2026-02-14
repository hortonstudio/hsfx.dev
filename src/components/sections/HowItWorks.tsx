'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useFadeUp } from '@/lib/animations';
import { messages } from '@/config';

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// Types
// ============================================================================

interface Step {
  number: string;
  title: string;
  description: string;
}

// ============================================================================
// Data
// ============================================================================

const steps: Step[] = [
  {
    number: '01',
    title: 'Drop in components',
    description:
      messages.howItWorks.step1,
  },
  {
    number: '02',
    title: 'Configure with properties',
    description:
      "Set attributes directly in Webflow's custom attribute panel. No code required—just key-value pairs that control behavior.",
  },
  {
    number: '03',
    title: 'One script handles the rest',
    description:
      'A single script tag loads only the modules you need. Automatic initialization, lazy loading, and zero configuration.',
  },
  {
    number: '04',
    title: 'Ship in hours',
    description:
      'Launch production-ready sites faster than ever. Clean code, optimized performance, and zero technical debt.',
  },
];

// ============================================================================
// Visual Mockup Components
// ============================================================================

function ComponentsPanelMockup() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-text-dim" />
        <span className="text-xs text-text-dim font-mono">Components</span>
      </div>
      {['Layout Block', 'Hero Section', 'Card Grid', 'Slider'].map((name) => (
        <div
          key={name}
          className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
        >
          <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-sm bg-accent/40" />
          </div>
          <span className="text-sm text-text-secondary">{name}</span>
        </div>
      ))}
    </div>
  );
}

function PropertiesPanelMockup() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-text-dim" />
        <span className="text-xs text-text-dim font-mono">Properties</span>
      </div>
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Autoplay</span>
        <div className="w-10 h-5 bg-accent rounded-full relative">
          <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
        </div>
      </div>
      {/* Input */}
      <div className="space-y-1.5">
        <span className="text-sm text-text-secondary">Duration</span>
        <div className="w-full h-9 bg-background rounded border border-border px-3 flex items-center">
          <span className="text-sm text-text-muted font-mono">5000</span>
        </div>
      </div>
      {/* Select */}
      <div className="space-y-1.5">
        <span className="text-sm text-text-secondary">Animation</span>
        <div className="w-full h-9 bg-background rounded border border-border px-3 flex items-center justify-between">
          <span className="text-sm text-text-muted">Fade</span>
          <div className="w-3 h-3 border-r border-b border-text-dim rotate-45 -translate-y-0.5" />
        </div>
      </div>
    </div>
  );
}

function ScriptMockup() {
  const modules = ['slider', 'accordion', 'schema', 'preload', 'forms'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <span className="text-xs text-text-dim font-mono">Script loaded</span>
      </div>
      {/* Script tag visual */}
      <div className="bg-background rounded-lg border border-border p-4 font-mono text-xs">
        <span className="text-text-dim">&lt;</span>
        <span className="text-accent">script</span>
        <span className="text-text-dim">&gt;</span>
        <span className="text-text-muted">{messages.howItWorks.scriptInit}</span>
        <span className="text-text-dim">&lt;/</span>
        <span className="text-accent">script</span>
        <span className="text-text-dim">&gt;</span>
      </div>
      {/* Modules loading */}
      <div className="space-y-2">
        {modules.map((mod, i) => (
          <div
            key={mod}
            className="flex items-center gap-2"
            style={{ opacity: 1 - i * 0.15 }}
          >
            <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
            <span className="text-sm text-text-secondary font-mono">{mod}</span>
            <span className="text-xs text-text-dim ml-auto">loaded</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrowserMockup() {
  return (
    <div className="space-y-3">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 p-2 bg-background rounded-t-lg border border-border border-b-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-text-dim/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-text-dim/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-text-dim/30" />
        </div>
        <div className="flex-1 mx-2">
          <div className="h-5 bg-surface rounded flex items-center px-2">
            <span className="text-xs text-text-dim font-mono">yoursite.com</span>
          </div>
        </div>
      </div>
      {/* Browser content */}
      <div className="bg-background rounded-b-lg border border-border border-t-0 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="w-16 h-4 rounded bg-text-dim/20" />
          <div className="flex gap-2">
            <div className="w-10 h-3 rounded bg-text-dim/10" />
            <div className="w-10 h-3 rounded bg-text-dim/10" />
            <div className="w-10 h-3 rounded bg-text-dim/10" />
          </div>
        </div>
        {/* Hero */}
        <div className="py-6 text-center space-y-2">
          <div className="w-3/4 h-5 rounded bg-text-primary/20 mx-auto" />
          <div className="w-1/2 h-3 rounded bg-text-dim/10 mx-auto" />
          <div className="w-20 h-6 rounded bg-accent/30 mx-auto mt-3" />
        </div>
        {/* Cards */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 rounded bg-surface border border-border" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Mobile Step Component
// ============================================================================

function MobileStep({ step, index }: { step: Step; index: number }) {
  const stepRef = useRef<HTMLDivElement>(null);

  useFadeUp(stepRef, { delay: index * 0.1 });

  const mockups = [
    <ComponentsPanelMockup key="components" />,
    <PropertiesPanelMockup key="properties" />,
    <ScriptMockup key="script" />,
    <BrowserMockup key="browser" />,
  ];

  return (
    <div ref={stepRef} className="mb-16 last:mb-0">
      <div className="mb-6">
        <span className="text-sm text-text-dim font-mono">{step.number}</span>
        <h3 className="text-xl font-medium text-text-primary mt-1">{step.title}</h3>
        <p className="text-text-muted mt-2 leading-relaxed">{step.description}</p>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        {mockups[index]}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check for desktop viewport
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Heading fade up
  useFadeUp(headingRef, { delay: 0.1 });

  // Desktop GSAP ScrollTrigger setup
  useEffect(() => {
    if (!isDesktop || !sectionRef.current || !desktopRef.current) return;

    const ctx = gsap.context(() => {
      // Main ScrollTrigger for the section
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          // Determine active step based on progress (0-25% = step 0, 25-50% = step 1, etc.)
          const stepIndex = Math.min(Math.floor(progress * 4), 3);
          setActiveStep(stepIndex);
        },
      });

      // Pin the left column
      ScrollTrigger.create({
        trigger: leftColumnRef.current,
        start: 'top 120px',
        end: () => {
          const section = sectionRef.current;
          if (!section) return 'bottom bottom';
          return `+=${section.offsetHeight - window.innerHeight}`;
        },
        pin: true,
        pinSpacing: false,
      });

      // Pin the right column
      ScrollTrigger.create({
        trigger: rightColumnRef.current,
        start: 'top 120px',
        end: () => {
          const section = sectionRef.current;
          if (!section) return 'bottom bottom';
          return `+=${section.offsetHeight - window.innerHeight}`;
        },
        pin: true,
        pinSpacing: false,
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [isDesktop]);

  const mockups = [
    <ComponentsPanelMockup key="components" />,
    <PropertiesPanelMockup key="properties" />,
    <ScriptMockup key="script" />,
    <BrowserMockup key="browser" />,
  ];

  return (
    <section
      ref={sectionRef}
      className="py-section-sm md:py-section lg:min-h-[400vh] relative"
    >
      <div className="max-w-6xl mx-auto px-6">
        <h2
          ref={headingRef}
          className="text-3xl md:text-4xl font-serif text-text-primary text-center mb-16"
        >
          How It Works
        </h2>

        {/* Desktop Layout */}
        {isDesktop && (
          <div ref={desktopRef} className="hidden lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Left Column - Steps */}
            <div ref={leftColumnRef} className="space-y-12">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`transition-opacity duration-300 ${
                    activeStep === index ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <span className="text-sm text-text-dim font-mono">{step.number}</span>
                  <h3
                    className={`text-xl md:text-2xl font-medium mt-1 transition-colors duration-300 ${
                      activeStep === index ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-text-muted mt-2 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>

            {/* Right Column - Visuals */}
            <div ref={rightColumnRef} className="relative">
              <div className="bg-surface border border-border rounded-xl p-8">
                {mockups.map((mockup, index) => (
                  <div
                    key={index}
                    className={`transition-opacity duration-500 ${
                      activeStep === index
                        ? 'opacity-100 relative'
                        : 'opacity-0 absolute inset-0 p-8 pointer-events-none'
                    }`}
                  >
                    {mockup}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Layout */}
        {!isDesktop && (
          <div className="lg:hidden">
            {steps.map((step, index) => (
              <MobileStep key={step.number} step={step} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
