'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface Trail {
  id: number;
  x: number;
  y: number;
}

export function CursorGlow() {
  const [mounted, setMounted] = useState(false);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isMoving, setIsMoving] = useState(false);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Outer glow follows slower
  const outerSpringConfig = { damping: 40, stiffness: 90 };
  const outerXSpring = useSpring(cursorX, outerSpringConfig);
  const outerYSpring = useSpring(cursorY, outerSpringConfig);

  useEffect(() => {
    setMounted(true);
    let trailId = 0;
    let moveTimeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsMoving(true);

      // Add trail point
      trailId++;
      const newTrail = { id: trailId, x: e.clientX, y: e.clientY };
      setTrails((prev) => [...prev.slice(-12), newTrail]);

      // Clear moving state after pause
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => setIsMoving(false), 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(moveTimeout);
    };
  }, [cursorX, cursorY]);

  // Clean up old trails
  useEffect(() => {
    const interval = setInterval(() => {
      setTrails((prev) => prev.slice(-8));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {/* Trail particles */}
      {trails.map((trail) => (
        <motion.div
          key={trail.id}
          className="absolute rounded-full bg-accent"
          style={{
            left: trail.x,
            top: trail.y,
            width: 4,
            height: 4,
            x: '-50%',
            y: '-50%',
          }}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}

      {/* Inner cursor dot */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: '-50%',
          y: '-50%',
          width: 8,
          height: 8,
          backgroundColor: 'rgba(74, 158, 255, 0.8)',
          boxShadow: '0 0 20px rgba(74, 158, 255, 0.5)',
        }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute rounded-full border border-accent/30"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: '-50%',
          y: '-50%',
          width: isMoving ? 40 : 24,
          height: isMoving ? 40 : 24,
        }}
        animate={{
          width: isMoving ? 40 : 24,
          height: isMoving ? 40 : 24,
          opacity: isMoving ? 0.5 : 0.3,
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Outer glow ring - follows slower */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: outerXSpring,
          top: outerYSpring,
          x: '-50%',
          y: '-50%',
          width: 120,
          height: 120,
          background:
            'radial-gradient(circle, rgba(74, 158, 255, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Magnetic field effect - very subtle outer ring */}
      <motion.div
        className="absolute rounded-full border border-accent/10"
        style={{
          left: outerXSpring,
          top: outerYSpring,
          x: '-50%',
          y: '-50%',
        }}
        animate={{
          width: isMoving ? 200 : 80,
          height: isMoving ? 200 : 80,
          opacity: isMoving ? 0.3 : 0,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}
