import { useState, useCallback, useRef } from 'react';

export function useSimulation<T>(generator: () => T) {
  const [data, setData] = useState<T[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const generatorRef = useRef(generator);
  generatorRef.current = generator;

  const run = useCallback((count: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    const results: T[] = Array.from({ length: count }, () => generatorRef.current());
    setTimeout(() => {
      setData(prev => [...prev, ...results]);
      setIsAnimating(false);
    }, 1100);
  }, [isAnimating]);

  const reset = useCallback(() => setData([]), []);

  return { data, run, reset, isAnimating };
}