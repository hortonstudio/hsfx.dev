'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CodeColumn {
  id: number;
  x: number;
  chars: string[];
  speed: number;
  delay: number;
  opacity: number;
}

const codeChars = ['0', '1', '<', '>', '{', '}', '/', '=', ':', ';', '[', ']', '(', ')'];

function generateColumn(id: number): CodeColumn {
  return {
    id,
    x: Math.random() * 100,
    chars: Array.from(
      { length: Math.floor(Math.random() * 12) + 6 },
      () => codeChars[Math.floor(Math.random() * codeChars.length)]
    ),
    speed: Math.random() * 10 + 15,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.06 + 0.03,
  };
}

function generateColumns(count: number): CodeColumn[] {
  return Array.from({ length: count }, (_, i) => generateColumn(i));
}

export function CodeRain() {
  const [columns, setColumns] = useState<CodeColumn[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setColumns(generateColumns(30));
    setMounted(true);

    // Continuously respawn columns at random positions
    const interval = setInterval(() => {
      setColumns((prev) => {
        const newColumns = [...prev];
        // Randomly pick a column to respawn at a new random X position
        const idx = Math.floor(Math.random() * newColumns.length);
        newColumns[idx] = generateColumn(newColumns[idx].id + 100);
        return newColumns;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {columns.map((column) => (
        <motion.div
          key={column.id}
          className="absolute flex flex-col items-center gap-2 font-mono text-[10px] text-accent"
          style={{
            left: `${column.x}%`,
            opacity: column.opacity,
          }}
          initial={{ y: '-15%' }}
          animate={{ y: '115vh' }}
          transition={{
            duration: column.speed,
            repeat: Infinity,
            ease: 'linear',
            delay: column.delay,
          }}
        >
          {column.chars.map((char, i) => (
            <span key={i} className="block">
              {char}
            </span>
          ))}
        </motion.div>
      ))}
    </div>
  );
}
