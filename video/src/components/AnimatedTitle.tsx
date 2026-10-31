import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../config/theme';

interface AnimatedTitleProps {
  headline: string;
  subheadline?: string;
  tagline?: string;
  badge?: string;
  align?: 'center' | 'left' | 'right';
  highlightColor?: string;
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  headline,
  subheadline,
  tagline,
  badge,
  align = 'center',
  highlightColor = THEME.colors.orange,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const subtitleProgress = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end',
        textAlign: align,
        opacity,
        zIndex: 10,
      }}
    >
      {badge && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 107, 0, 0.12)',
            border: `1px solid ${highlightColor}`,
            color: highlightColor,
            fontFamily: THEME.typography.monoFamily,
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            boxShadow: `0 0 16px ${highlightColor}33`,
          }}
        >
          <span style={{ fontSize: '18px' }}>⚡</span> {badge}
        </div>
      )}

      <h1
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: '64px',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          color: THEME.colors.textPrimary,
          margin: 0,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [30, 0])}px)`,
          textShadow: '0 4px 24px rgba(0,0,0,0.8)',
        }}
      >
        {headline}
      </h1>

      {subheadline && (
        <h2
          style={{
            fontFamily: THEME.typography.fontFamily,
            fontSize: '28px',
            fontWeight: 500,
            color: THEME.colors.textSecondary,
            margin: '16px 0 0 0',
            maxWidth: '960px',
            lineHeight: 1.4,
            transform: `translateY(${interpolate(subtitleProgress, [0, 1], [20, 0])}px)`,
            opacity: subtitleProgress,
          }}
        >
          {subheadline}
        </h2>
      )}

      {tagline && (
        <p
          style={{
            fontFamily: THEME.typography.monoFamily,
            fontSize: '18px',
            color: highlightColor,
            margin: '12px 0 0 0',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {tagline}
        </p>
      )}
    </div>
  );
};
