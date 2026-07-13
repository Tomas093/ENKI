import { useState, useEffect } from "react";

export function useGameTimer(questionData: any, selected: number | null, onTimeout: () => void) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(30);

  useEffect(() => {
    if (selected !== null || timeLeft <= 0 || !questionData) return;
    const t = setInterval(() => setTimeLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [selected, timeLeft, questionData]);

  useEffect(() => {
    if (timeLeft <= 0 && selected === null && questionData) {
      onTimeout();
    }
  }, [timeLeft, selected, questionData, onTimeout]);

  return {
    timeLeft,
    setTimeLeft,
    totalTime,
    setTotalTime
  };
}
