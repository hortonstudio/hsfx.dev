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

const codeChars = [
  '</>',
  '{}',
  'fn',
  '=>',
  '::',
  '&&',
  '||',
  '===',
  'data',
  'hsfx',
  'attr',
  'init',
  'true',
  'null',
  '[ ]',
  '...',
];

function generateColumns(count: number): CodeColumn[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i / count) * 100 + Math.random() * 5,
    chars: Array.from(
      { length: Math.floor(Math.random() * 8) + 4 },
      () => codeChars[Math.floor(Math.random() * codeChars.length)]
    ),
    speed: Math.random() * 10 + 12,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.06 + 0.02,
  }));
}

export function CodeRain() {
  const [columns, setColumns] = useState<CodeColumn[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setColumns(generateColumns(20));
    setMounted(true);
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
          className="absolute flex flex-col items-center gap-3 font-mono text-[10px] tracking-wider"
          style={{
            left: `${column.x}%`,
            opacity: column.opacity,
          }}
          initial={{ y: '-100%' }}
          animate={{ y: '120vh' }}
          transition={{
            duration: column.speed,
            repeat: Infinity,
            ease: 'linear',
            delay: column.delay,
          }}
        >
          {column.chars.map((char, i) => (
            <motion.span
              key={i}
              className="block text-accent whitespace-nowrap"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      ))}

      {/* Glowing lead characters */}
      {columns.slice(0, 8).map((column) => (
        <motion.div
          key={`glow-${column.id}`}
          className="absolute font-mono text-xs font-bold"
          style={{
            left: `${column.x}%`,
            textShadow: '0 0 10px rgba(74, 158, 255, 0.8), 0 0 20px rgba(74, 158, 255, 0.4)',
            color: '#4A9EFF',
          }}
          initial={{ y: '-20px', opacity: 0 }}
          animate={{ y: '120vh', opacity: [0, 1, 1, 0] }}
          transition={{
            duration: column.speed * 0.8,
            repeat: Infinity,
            ease: 'linear',
            delay: column.delay + 2,
          }}
        >
          {column.chars[0]}
        </motion.div>
      ))}
    </div>
  );
}
