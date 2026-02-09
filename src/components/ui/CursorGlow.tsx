'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CursorGlow() {
  const [mounted, setMounted] = useState(false);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 150 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cursorX, cursorY]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden hidden md:block"
      aria-hidden="true"
    >
      {/* Simple cursor dot */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: '-50%',
          y: '-50%',
          width: 6,
          height: 6,
          backgroundColor: 'rgba(74, 158, 255, 0.6)',
          boxShadow: '0 0 12px rgba(74, 158, 255, 0.3)',
        }}
      />

      {/* Subtle outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: '-50%',
          y: '-50%',
          width: 80,
          height: 80,
          background:
            'radial-gradient(circle, rgba(74, 158, 255, 0.03) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
