import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CountUpProps {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

/** Animated number counter. Eases from 0 to `to` when scrolled into view. */
export function CountUp({ to, suffix = "+", duration = 1500, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [pulse, setPulse] = useState(false);
  const startedRef = useRef(false);
  const toRef = useRef(to);
  useEffect(() => {
    toRef.current = to;
  }, [to]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const animate = () => {
      const start = performance.now();
      const from = 0;
      const target = toRef.current;
      const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
      let raf = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setValue(Math.round(from + (target - from) * ease(t)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            animate();
          }
        });
      },
      { threshold: 0.3 },
    );
    obs.observe(node);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-pulse + recount when `to` changes after first reveal
  useEffect(() => {
    if (!startedRef.current) {
      // Not visible yet — keep value at 0 so the entrance animation can play.
      // The IntersectionObserver will animate to the latest `to` via toRef.
      return;
    }
    const start = performance.now();
    const from = value;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(from + (to - from) * ease(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    setPulse(true);
    const p = setTimeout(() => setPulse(false), 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(p);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tabular-nums transition-transform duration-300",
        pulse && "scale-110 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]",
        className,
      )}
    >
      {value}
      {suffix}
    </span>
  );
}