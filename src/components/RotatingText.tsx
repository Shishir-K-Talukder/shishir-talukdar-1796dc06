import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface RotatingTextProps {
  items: string[];
  /** delay between each word appearing (seconds) */
  wordStagger?: number;
  /** how long to hold the full sentence before switching (seconds) */
  holdDuration?: number;
  className?: string;
}

export function RotatingText({
  items,
  wordStagger = 0.14,
  holdDuration = 0.5,
  className = "",
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  const words = items[index]?.split(" ") ?? [];
  const totalMs = (words.length * wordStagger + 0.35 + holdDuration) * 1000;

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % items.length);
    }, totalMs);
    return () => clearTimeout(id);
  }, [index, items.length, totalMs]);

  return (
    <span className={`relative inline-block align-bottom ${className}`} aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: wordStagger } },
          }}
          className="inline-block"
        >
          {words.map((w, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: 8, filter: "blur(6px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)" },
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="inline-block whitespace-pre bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
            >
              {w}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
