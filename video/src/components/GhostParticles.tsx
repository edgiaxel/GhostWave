import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  opacity: number;
}

const PARTICLES: Particle[] = Array.from({ length: 45 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const x = (seed % 1920);
  const y = ((seed * 7) % 1080);
  const size = 2 + (seed % 6);
  const speed = 0.5 + ((seed % 10) / 10) * 1.5;
  const color = i % 3 === 0 ? '#ff6b00' : i % 3 === 1 ? '#a855f7' : '#06b6d4';
  const opacity = 0.15 + (seed % 50) / 100;
  return { x, y, size, speed, color, opacity };
});

export const GhostParticles: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      {PARTICLES.map((p, idx) => {
        const currentY = (p.y - frame * p.speed + 1080 * 10) % 1080;
        const drift = Math.sin((frame + idx * 20) / 40) * 20;
        const currentX = (p.x + drift + 1920) % 1920;
        const pulse = 0.7 + 0.3 * Math.sin((frame + idx * 10) / 25);

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: currentX,
              top: currentY,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              opacity: p.opacity * pulse,
              filter: `blur(${p.size > 5 ? 2 : 1}px)`,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        );
      })}
    </div>
  );
};
