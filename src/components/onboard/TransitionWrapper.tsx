"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface TransitionWrapperProps {
  direction: 1 | -1;
  currentKey: string | number;
  children: ReactNode;
}

const variants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    y: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

export function TransitionWrapper({
  direction,
  currentKey,
  children,
}: TransitionWrapperProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={currentKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
