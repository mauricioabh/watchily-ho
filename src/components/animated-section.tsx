"use client";

import { motion } from "framer-motion";

const defaultVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function AnimatedSection({
  children,
  className,
  delay = 0,
  as: Component = "section",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "section" | "div" | "main";
}) {
  const MotionComp = motion[Component] as typeof motion.section;
  return (
    <MotionComp
      initial="initial"
      animate="animate"
      variants={defaultVariants}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </MotionComp>
  );
}
