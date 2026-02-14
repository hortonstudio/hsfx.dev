'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { CodeBlock } from '@/components/ui';
import { messages } from '@/config';

type TabId = 'slider' | 'grid' | 'schema' | 'animation';
type Breakpoint = 'desktop' | 'tablet' | 'mobile';
type SchemaType = 'LocalBusiness' | 'Product' | 'FAQPage';
type AnimationType = 'fade-up' | 'fade-down' | 'slide-left' | 'slide-right';

interface SliderToggles {
  infinite: boolean;
  snap: boolean;
  freeScroll: boolean;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'slider', label: 'Slider' },
  { id: 'grid', label: 'Grid' },
  { id: 'schema', label: 'Schema' },
  { id: 'animation', label: 'Animation' },
];

// Code generators for each tab
function generateSliderCode(toggles: SliderToggles): React.ReactNode {
  return (
    <>
      <span className="syntax-tag">&lt;div</span>
      {'\n  '}
      <span className="syntax-attr">{messages.interactiveDemo.slider}</span>
      {'\n  '}
      <span className="syntax-attr">data-slides-lg</span>
      <span className="syntax-tag">=</span>
      <span className="syntax-string">&quot;3&quot;</span>
      {toggles.snap && (
        <>
          {'\n  '}
          <span className="syntax-attr">data-snap</span>
          <span className="syntax-tag">=</span>
          <span className="syntax-string">&quot;true&quot;</span>
        </>
      )}
      {toggles.infinite && (
        <>
          {'\n  '}
          <span className="syntax-attr">data-infinite</span>
          <span className="syntax-tag">=</span>
          <span className="syntax-string">&quot;true&quot;</span>
        </>
      )}
      {toggles.freeScroll && (
        <>
          {'\n  '}
          <span className="syntax-attr">data-free-scroll</span>
          <span className="syntax-tag">=</span>
          <span className="syntax-string">&quot;true&quot;</span>
        </>
      )}
      <span className="syntax-tag">&gt;</span>
      {'\n  '}
      <span className="syntax-comment">{`<!-- slides -->`}</span>
      {'\n'}
      <span className="syntax-tag">&lt;/div&gt;</span>
    </>
  );
}

function generateGridCode(breakpoint: Breakpoint): React.ReactNode {
  const cols = { desktop: '3', tablet: '2', mobile: '1' };
  return (
    <>
      <span className="syntax-tag">&lt;div</span>
      {'\n  '}
      <span className="syntax-attr">{messages.interactiveDemo.grid}</span>
      {'\n  '}
      <span className="syntax-attr">data-large-screen</span>
      <span className="syntax-tag">=</span>
      <span className="syntax-string">&quot;{cols.desktop}&quot;</span>
      {'\n  '}
      <span className="syntax-attr">data-medium-screen</span>
      <span className="syntax-tag">=</span>
      <span className="syntax-string">&quot;{cols.tablet}&quot;</span>
      {'\n  '}
      <span className="syntax-attr">data-small-screen</span>
      <span className="syntax-tag">=</span>
      <span className="syntax-string">&quot;{cols.mobile}&quot;</span>
      <span className="syntax-tag">&gt;</span>
      {'\n  '}
      <span className="syntax-comment">{`<!-- ${breakpoint}: showing ${cols[breakpoint]} cols -->`}</span>
      {'\n'}
      <span className="syntax-tag">&lt;/div&gt;</span>
    </>
  );
}

function generateSchemaCode(schemaType: SchemaType): React.ReactNode {
  const configs: Record<SchemaType, string> = {
    LocalBusiness: 'data-name="ACME Corp"\n  data-address="123 Main St"',
    Product: 'data-name="Widget Pro"\n  data-price="99.99"',
    FAQPage: 'data-source="cms"\n  data-collection="faq-items"',
  };
  return (
    <>
      <span className="syntax-tag">&lt;div</span>
      {'\n  '}
      <span className="syntax-attr">{messages.interactiveDemo.schema}</span>
      <span className="syntax-tag">=</span>
      <span className="syntax-string">&quot;{schemaType}&quot;</span>
      {'\n  '}
      {configs[schemaType].split('\n').map((line, i) => {
        const [attr, val] = line.split('=');
        return (
          <span key={i}>
            <span className="syntax-attr">{attr}</span>
            <span className="syntax-tag">=</span>
            <span className="syntax-string">{val}</span>
            {i < configs[schemaType].split('\n').length - 1 && '\n  '}
          </span>
        );
      })}
      <span className="syntax-tag">&gt;</span>
      {'\n'}
      <span className="syntax-tag">&lt;/div&gt;</span>
    </>
  );
}

function generateAnimationCode(animationType: AnimationType): React.ReactNode {
  return (
    <>
      <span className="syntax-tag">&lt;div</span>
      {'\n  '}
      <span className="syntax-attr">{messages.interactiveDemo.entrance}</span>
      <span className="syntax-tag">=</span>
      <span className="syntax-string">&quot;{animationType}&quot;</span>
      {'\n  '}
      <span className="syntax-attr">data-delay</span>
      <span className="syntax-tag">=</span>
      <span className="syntax-string">&quot;0.1&quot;</span>
      {'\n  '}
      <span className="syntax-attr">data-duration</span>
      <span className="syntax-tag">=</span>
      <span className="syntax-string">&quot;0.6&quot;</span>
      <span className="syntax-tag">&gt;</span>
      {'\n  '}
      <span className="syntax-comment">{`<!-- content -->`}</span>
      {'\n'}
      <span className="syntax-tag">&lt;/div&gt;</span>
    </>
  );
}

// Schema JSON outputs
function getSchemaJson(schemaType: SchemaType): string {
  const schemas: Record<SchemaType, object> = {
    LocalBusiness: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'ACME Corp',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Main St',
      },
    },
    Product: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Widget Pro',
      offers: {
        '@type': 'Offer',
        price: '99.99',
        priceCurrency: 'USD',
      },
    },
    FAQPage: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does it work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Simply add the attribute...',
          },
        },
      ],
    },
  };
  return JSON.stringify(schemas[schemaType], null, 2);
}

// Toggle component
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent' : 'bg-border'
        }`}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 w-4 h-4 bg-text-primary rounded-full"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      <span className="text-sm text-text-secondary">{label}</span>
    </label>
  );
}

// Preview components
function SliderPreview({ toggles }: { toggles: SliderToggles }) {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="flex-shrink-0 w-[calc(33.333%-8px)] bg-surface border border-border rounded-lg h-24 flex items-center justify-center"
              animate={{
                x: toggles.freeScroll ? 0 : -activeSlide * 10,
                scale: activeSlide === i ? 1 : 0.98,
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-3 bg-border rounded" />
            </motion.div>
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={() => setActiveSlide((p) => Math.max(0, p - 1))}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center transition-opacity ${
            toggles.infinite ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <ChevronLeft className="w-3 h-3 text-text-muted" />
        </button>
        <button
          onClick={() => setActiveSlide((p) => Math.min(2, p + 1))}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center transition-opacity ${
            toggles.infinite ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <ChevronRight className="w-3 h-3 text-text-muted" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              activeSlide === i ? 'bg-accent' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Snap indicator */}
      {toggles.snap && (
        <div className="text-center">
          <span className="text-xs text-accent">Snap points enabled</span>
        </div>
      )}
    </div>
  );
}

function GridPreview({ breakpoint }: { breakpoint: Breakpoint }) {
  const cols = { desktop: 3, tablet: 2, mobile: 1 };
  const colCount = cols[breakpoint];

  return (
    <motion.div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
      layout
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="bg-surface border border-border rounded-lg h-20 flex items-center justify-center"
          layout
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="space-y-1">
            <div className="w-10 h-2 bg-border rounded" />
            <div className="w-6 h-2 bg-border rounded" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function SchemaPreview({ schemaType }: { schemaType: SchemaType }) {
  return (
    <div className="bg-[#0D0D0D] border border-border rounded-lg p-4 overflow-auto max-h-64">
      <pre className="text-xs font-mono text-text-secondary whitespace-pre">
        {getSchemaJson(schemaType)}
      </pre>
    </div>
  );
}

function AnimationPreview({
  animationType,
  animationKey,
}: {
  animationType: AnimationType;
  animationKey: number;
}) {
  const getInitial = () => {
    switch (animationType) {
      case 'fade-up':
        return { opacity: 0, y: 20 };
      case 'fade-down':
        return { opacity: 0, y: -20 };
      case 'slide-left':
        return { opacity: 0, x: 40 };
      case 'slide-right':
        return { opacity: 0, x: -40 };
    }
  };

  const getAnimate = () => {
    switch (animationType) {
      case 'fade-up':
      case 'fade-down':
        return { opacity: 1, y: 0 };
      case 'slide-left':
      case 'slide-right':
        return { opacity: 1, x: 0 };
    }
  };

  return (
    <div className="flex items-center justify-center h-48">
      <motion.div
        key={animationKey}
        className="bg-surface border border-border rounded-lg p-6 w-48"
        initial={getInitial()}
        animate={getAnimate()}
        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
      >
        <div className="space-y-2">
          <div className="w-full h-3 bg-border rounded" />
          <div className="w-3/4 h-3 bg-border rounded" />
          <div className="w-1/2 h-3 bg-border rounded" />
        </div>
      </motion.div>
    </div>
  );
}

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<TabId>('slider');
  const [sliderToggles, setSliderToggles] = useState<SliderToggles>({
    infinite: false,
    snap: true,
    freeScroll: false,
  });
  const [gridBreakpoint, setGridBreakpoint] = useState<Breakpoint>('desktop');
  const [schemaType, setSchemaType] = useState<SchemaType>('LocalBusiness');
  const [animationType, setAnimationType] =
    useState<AnimationType>('fade-up');
  const [animationKey, setAnimationKey] = useState(0);

  const handleSliderToggle = useCallback(
    (key: keyof SliderToggles) => (checked: boolean) => {
      setSliderToggles((prev) => ({ ...prev, [key]: checked }));
    },
    []
  );

  const replayAnimation = useCallback(() => {
    setAnimationKey((k) => k + 1);
  }, []);

  const renderCode = () => {
    switch (activeTab) {
      case 'slider':
        return generateSliderCode(sliderToggles);
      case 'grid':
        return generateGridCode(gridBreakpoint);
      case 'schema':
        return generateSchemaCode(schemaType);
      case 'animation':
        return generateAnimationCode(animationType);
    }
  };

  const renderControls = () => {
    switch (activeTab) {
      case 'slider':
        return (
          <div className="flex flex-wrap gap-4 mt-4">
            <Toggle
              label="Infinite"
              checked={sliderToggles.infinite}
              onChange={handleSliderToggle('infinite')}
            />
            <Toggle
              label="Snap"
              checked={sliderToggles.snap}
              onChange={handleSliderToggle('snap')}
            />
            <Toggle
              label="Free Scroll"
              checked={sliderToggles.freeScroll}
              onChange={handleSliderToggle('freeScroll')}
            />
          </div>
        );
      case 'grid':
        return (
          <div className="flex gap-2 mt-4">
            {(['desktop', 'tablet', 'mobile'] as Breakpoint[]).map((bp) => (
              <button
                key={bp}
                onClick={() => setGridBreakpoint(bp)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                  gridBreakpoint === bp
                    ? 'bg-surface text-text-primary border border-border'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {bp}
              </button>
            ))}
          </div>
        );
      case 'schema':
        return (
          <div className="mt-4">
            <select
              value={schemaType}
              onChange={(e) => setSchemaType(e.target.value as SchemaType)}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="LocalBusiness">LocalBusiness</option>
              <option value="Product">Product</option>
              <option value="FAQPage">FAQPage</option>
            </select>
          </div>
        );
      case 'animation':
        return (
          <div className="flex items-center gap-3 mt-4">
            <select
              value={animationType}
              onChange={(e) => {
                setAnimationType(e.target.value as AnimationType);
                setAnimationKey((k) => k + 1);
              }}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="fade-up">fade-up</option>
              <option value="fade-down">fade-down</option>
              <option value="slide-left">slide-left</option>
              <option value="slide-right">slide-right</option>
            </select>
            <button
              onClick={replayAnimation}
              className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <Play className="w-3 h-3" />
              Replay
            </button>
          </div>
        );
    }
  };

  const renderPreview = () => {
    switch (activeTab) {
      case 'slider':
        return <SliderPreview toggles={sliderToggles} />;
      case 'grid':
        return <GridPreview breakpoint={gridBreakpoint} />;
      case 'schema':
        return <SchemaPreview schemaType={schemaType} />;
      case 'animation':
        return (
          <AnimationPreview
            animationType={animationType}
            animationKey={animationKey}
          />
        );
    }
  };

  return (
    <section className="py-section-sm md:py-section">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-serif text-text-primary text-center mb-4">
          A Glimpse of What&apos;s Coming
        </h2>
        <p className="text-text-muted text-center mb-16 max-w-md mx-auto">
          Interactive preview of the attribute system
        </p>

        {/* Tab Bar */}
        <div className="flex justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-surface text-text-primary border border-border'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
          >
            {/* Left Column - Code */}
            <div>
              <CodeBlock code={renderCode()} language="html" />
              {renderControls()}
            </div>

            {/* Right Column - Preview */}
            <div className="bg-background border border-border rounded-xl p-6">
              <div className="text-xs text-text-dim uppercase tracking-wide mb-4">
                Preview
              </div>
              {renderPreview()}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
