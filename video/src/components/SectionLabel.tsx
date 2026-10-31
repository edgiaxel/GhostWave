import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { THEME } from '../config/theme';

interface SectionLabelProps {
  sceneNumber: string;
  category: string;
  sceneTitle: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  sceneNumber,
  category,
  sceneTitle,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '36px',
        left: '48px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        opacity,
        zIndex: 25,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: 'rgba(255, 107, 0, 0.15)',
          border: '1px solid rgba(255, 107, 0, 0.4)',
          color: THEME.colors.orange,
          fontFamily: THEME.typography.monoFamily,
          fontSize: '15px',
          fontWeight: 800,
        }}
      >
        {sceneNumber}
      </div>
      <div>
        <div
          style={{
            fontFamily: THEME.typography.monoFamily,
            fontSize: '11px',
            fontWeight: 700,
            color: THEME.colors.orange,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          {category}
        </div>
        <div
          style={{
            fontFamily: THEME.typography.fontFamily,
            fontSize: '18px',
            fontWeight: 700,
            color: THEME.colors.textPrimary,
            letterSpacing: '-0.01em',
          }}
        >
          {sceneTitle}
        </div>
      </div>
    </div>
  );
};
