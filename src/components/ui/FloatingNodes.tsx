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
    size: Math.random() * 2 + 1,
    duration: Math.random() * 25 + 20,
    delay: Math.random() * 8,
    direction: Math.random() > 0.5 ? 1 : -1,
  }));
}

export function FloatingNodes() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setNodes(generateNodes(15));
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
          className="absolute rounded-full bg-accent/10"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.size,
            height: node.size,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10 * node.direction, 0],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: node.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: node.delay,
          }}
        />
      ))}
    </div>
  );
}
