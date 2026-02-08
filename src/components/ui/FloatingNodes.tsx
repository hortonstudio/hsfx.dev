'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  direction: number;
}

function generateNodes(count: number): Node[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
    direction: Math.random() > 0.5 ? 1 : -1,
  }));
}

export function FloatingNodes() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setNodes(generateNodes(30));
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute rounded-full bg-accent/20"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.size,
            height: node.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15 * node.direction, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: node.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: node.delay,
          }}
        />
      ))}

      {/* Connection lines that fade in and out */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(74, 158, 255, 0)" />
            <stop offset="50%" stopColor="rgba(74, 158, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(74, 158, 255, 0)" />
          </linearGradient>
        </defs>
        {[...Array(5)].map((_, i) => (
          <motion.line
            key={i}
            x1={`${10 + i * 20}%`}
            y1={`${20 + i * 15}%`}
            x2={`${30 + i * 15}%`}
            y2={`${40 + i * 10}%`}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 1, 0],
              opacity: [0, 0.5, 0.5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 2,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
