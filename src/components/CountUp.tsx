import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";

interface CountUpProps {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

/**
 * Animated number counter. Springs from 0 to `to` when scrolled into view.
 * Re-animates when `to` changes (e.g. when admin adds new records).
 */
export function CountUp({ to, suffix = "+", duration = 1.4, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false, margin: "-20% 0px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0.15,
  });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  const [text, setText] = useState("0");

  useEffect(() => {
    const unsub = display.on("change", setText);
    return () => unsub();
  }, [display]);

  useEffect(() => {
    if (inView) {
      motionValue.set(0);
      const t = setTimeout(() => motionValue.set(to), 50);
      return () => clearTimeout(t);
    }
  }, [inView, to, motionValue]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.4 }}
    >
      {text}
      {suffix}
    </motion.span>
  );
}