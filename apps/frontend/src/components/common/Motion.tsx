import type { ComponentProps } from "react";

import { motion, useReducedMotion } from "framer-motion";

type MotionFadeProps = ComponentProps<typeof motion.div> & {
  y?: number;
  duration?: number;
};

export function MotionFade({
  children,
  y = 8,
  duration = 0.18,
  ...props
}: MotionFadeProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <motion.div {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y }}
      transition={{ duration, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
