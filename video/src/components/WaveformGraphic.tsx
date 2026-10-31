import React from 'react';
import { useCurrentFrame } from 'remotion';

interface WaveformGraphicProps {
  bars?: number;
  height?: number;
  color?: string;
  active?: boolean;
}

export const WaveformGraphic: React.FC<WaveformGraphicProps> = ({
  bars = 48,
  height = 80,
  color = '#ff6b00',
  active = true,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        height: `${height}px`,
      }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const offset = i * 0.25;
        const speed = 0.08;
        const factor = active
          ? Math.sin(frame * speed + offset) * 0.4 +
            Math.cos(frame * speed * 1.5 - offset * 0.5) * 0.3 +
            0.5
          : 0.1;

        const barHeight = Math.max(6, Math.min(height, factor * height));
        const isOrange = i % 2 === 0;
        const barColor = isOrange ? color : '#a855f7';

        return (
          <div
            key={i}
            style={{
              width: '4px',
              height: `${barHeight}px`,
              borderRadius: '2px',
              backgroundColor: barColor,
              boxShadow: `0 0 8px ${barColor}66`,
              transition: 'height 0.05s ease-out',
            }}
          />
        );
      })}
    </div>
  );
};
