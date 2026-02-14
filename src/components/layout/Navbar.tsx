"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserMenu } from "@/components/auth/UserMenu";
import { brand } from "@/config";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 h-16 md:h-20 transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-md border-b border-border bg-background/80"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src={brand.logo.light}
              alt={brand.name}
              width={100}
              height={40}
              priority
              className="h-7 md:h-8 w-auto"
            />
          </Link>

          <div className="flex items-center gap-4">
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium rounded-lg
                      bg-gradient-to-r from-accent to-blue-400
                      text-white shadow-lg shadow-accent/25
                      hover:shadow-accent/40 hover:scale-[1.02]
                      transition-all duration-200"
                  >
                    Login
                  </button>
                )}
              </>
            )}
          </div>
        </nav>
      </motion.header>

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
