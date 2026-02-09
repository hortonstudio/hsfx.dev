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

const codeChars = ['<>', '{}', '=>', '::', '[]', '//'];

function generateColumns(count: number): CodeColumn[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i / count) * 100 + Math.random() * 5,
    chars: Array.from(
      { length: Math.floor(Math.random() * 4) + 2 },
      () => codeChars[Math.floor(Math.random() * codeChars.length)]
    ),
    speed: Math.random() * 15 + 20,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.02 + 0.01,
  }));
}

export function CodeRain() {
  const [columns, setColumns] = useState<CodeColumn[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setColumns(generateColumns(10));
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
          className="absolute flex flex-col items-center gap-4 font-mono text-[9px] tracking-wider text-accent"
          style={{
            left: `${column.x}%`,
            opacity: column.opacity,
          }}
          initial={{ y: '-50px' }}
          animate={{ y: '110vh' }}
          transition={{
            duration: column.speed,
            repeat: Infinity,
            ease: 'linear',
            delay: column.delay,
          }}
        >
          {column.chars.map((char, i) => (
            <span key={i} className="block whitespace-nowrap">
              {char}
            </span>
          ))}
        </motion.div>
      ))}
    </div>
  );
}
