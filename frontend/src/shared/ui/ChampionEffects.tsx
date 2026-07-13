'use client';

import { useEffect } from 'react';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

interface ChampionEffectsProps {
  isWinner: boolean;
}

export function ChampionEffects({ isWinner }: ChampionEffectsProps) {
  useEffect(() => {
    if (!isWinner) return;

    // Play "We Are the Champions"
    const sound = new Howl({
      src: ['/champions.mp3'],
      volume: 0.5,
    });

    sound.play();

    // Trigger confetti explosion
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // since particles fall down, start a bit higher than random
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      );
    }, 250);

    return () => {
      sound.unload(); // Stop sound when component unmounts
      clearInterval(interval);
    };
  }, [isWinner]);

  return null; // This component doesn't render anything visual itself
}
