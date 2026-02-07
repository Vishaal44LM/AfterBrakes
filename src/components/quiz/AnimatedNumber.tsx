import { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

const AnimatedNumber = ({ value, duration = 800, suffix = '', className = '' }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startRef = useRef(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const start = startRef.current;
    const diff = value - start;
    if (diff === 0) { setDisplayValue(value); return; }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value, duration]);

  return <span className={className}>{displayValue}{suffix}</span>;
};

export default AnimatedNumber;
