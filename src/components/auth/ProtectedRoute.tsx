"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { Spinner } from "@/components/ui/Spinner";
import { GridBackground } from "@/components/ui";
import { brand } from "@/config";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <GridBackground />
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-3">
              Authentication required
            </h1>
            <p className="text-text-muted mb-8 leading-relaxed">
              This content is only available to authenticated users. Please sign
              in to continue.
            </p>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg
                bg-gradient-to-r from-accent to-blue-400
                text-white shadow-lg shadow-accent/25
                hover:shadow-accent/40 hover:scale-[1.02]
                transition-all duration-200"
            >
              Sign in to continue
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

            <p className="mt-8 text-sm text-text-dim">
              Don&apos;t have access?{" "}
              <a href={`mailto:${brand.email}`} className="text-accent hover:text-accent-hover transition-colors">
                Request access
              </a>
            </p>
          </div>
        </div>

        <AuthModal
          open={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  return <>{children}</>;
}
