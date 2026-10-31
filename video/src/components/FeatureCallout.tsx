import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../config/theme';

interface FeatureCalloutProps {
  title: string;
  description: string;
  icon?: string;
  accentColor?: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-right' | 'bottom-center';
  delay?: number;
}

export const FeatureCallout: React.FC<FeatureCalloutProps> = ({
  title,
  description,
  icon = '👻',
  accentColor = THEME.colors.orange,
  position = 'bottom-left',
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);
  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'bottom-left':
        return { bottom: '48px', left: '64px' };
      case 'bottom-right':
        return { bottom: '48px', right: '64px' };
      case 'top-right':
        return { top: '48px', right: '64px' };
      case 'bottom-center':
        return { bottom: '48px', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...getPositionStyles(),
        opacity,
        zIndex: 25,
        maxWidth: '560px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          padding: '18px 24px',
          borderRadius: '16px',
          backgroundColor: 'rgba(18, 17, 26, 0.92)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${accentColor}55`,
          boxShadow: `0 20px 40px rgba(0,0,0,0.7), 0 0 20px ${accentColor}22`,
          transform: `translateY(${interpolate(progress, [0, 1], [24, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: '32px',
            lineHeight: 1,
            padding: '8px',
            borderRadius: '12px',
            backgroundColor: `${accentColor}18`,
            border: `1px solid ${accentColor}33`,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '20px',
              fontWeight: 800,
              color: THEME.colors.textPrimary,
              letterSpacing: '-0.01em',
              marginBottom: '4px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '15px',
              fontWeight: 500,
              color: THEME.colors.textSecondary,
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};
