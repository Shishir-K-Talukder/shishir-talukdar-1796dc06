import { useEffect, useState } from "react";

interface RotatingTextProps {
  items: string[];
  interval?: number;
  className?: string;
}

export function RotatingText({ items, interval = 2600, className = "" }: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
      setAnimKey((k) => k + 1);
    }, interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  return (
    <span className={`relative inline-block align-bottom ${className}`} aria-live="polite">
      <span
        key={animKey}
        className="inline-block animate-fade-in bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
      >
        {items[index]}
      </span>
    </span>
  );
}