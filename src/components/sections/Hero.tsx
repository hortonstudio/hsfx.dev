"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useFadeUp } from "@/lib/animations";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

// Check for dev bypass
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export function Hero() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useFadeUp(badgeRef, { delay: 0.1 });
  useFadeUp(headlineRef, { delay: 0.2 });
  useFadeUp(subtitleRef, { delay: 0.3 });
  useFadeUp(statusRef, { delay: 0.4 });

  return (
    <>
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
            A component-driven Webflow framework with attribute modules, CMS
            automation, and a complete developer toolkit.
          </p>

          {/* Buttons */}
          <div ref={statusRef} className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {/* Dev mode: Show Styleguide button */}
            {DEV_AUTH_BYPASS && (
              <Link
                href="/styleguide"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg
                  bg-gradient-to-r from-accent to-blue-400
                  text-white shadow-lg shadow-accent/25
                  hover:shadow-accent/40 hover:scale-[1.02]
                  transition-all duration-200"
              >
                View Styleguide
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            )}
            {/* Normal mode: Show Login button if not authenticated */}
            {!isLoading && !isAuthenticated && !DEV_AUTH_BYPASS && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg
                  bg-gradient-to-r from-accent to-blue-400
                  text-white shadow-lg shadow-accent/25
                  hover:shadow-accent/40 hover:scale-[1.02]
                  transition-all duration-200"
              >
                Login
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            )}
          </div>

          {/* Development Status */}
          <div className="mt-12 inline-flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-sm text-text-dim">
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

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
