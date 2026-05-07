import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface RotatingTextProps {
  items: string[];
  interval?: number;
  className?: string;
}

export function RotatingText({ items, interval = 2600, className = "" }: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  return (
    <span className={`relative inline-block align-bottom ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={items[index]}
          initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="inline-block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
        >
          {items[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}