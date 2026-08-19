"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// Shared timing (skill §9 Timing) — spring physics for a natural, Apple/Miles feel.
const spring = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.9 };

// §6 Slow In/Out + §3 Staging: section fades + eases up when scrolled into view.
export function MotionSection({ children, className, style, delay = 0 }: { children: ReactNode; className?: string; style?: React.CSSProperties; delay?: number }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay }}
    >
      {children}
    </motion.div>
  );
}

// Stagger container (skill: Stagger Children) — reveals items in sequence.
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring },
};

export function MotionGrid({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

// §12 Appeal + §8 Secondary Action: each item eases in, lifts on hover, dips on tap.
export function MotionItem({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={item}
      whileHover={{ y: -6, boxShadow: "0 34px 70px -26px rgba(0,0,0,0.62)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}
