'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 h-16 md:h-20 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-md border-b border-border bg-background/80'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto h-full px-6 flex items-center justify-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-w.svg"
            alt="HSFX"
            width={100}
            height={40}
            priority
            className="h-7 md:h-8 w-auto"
          />
        </Link>
      </nav>
    </motion.header>
  );
}
