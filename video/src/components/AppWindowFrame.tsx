import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../config/theme';

interface AppWindowFrameProps {
  children: React.ReactNode;
  title?: string;
  zoom?: number;
  origin?: string;
}

export const AppWindowFrame: React.FC<AppWindowFrameProps> = ({
  children,
  title = 'GhostWave — Local-First Music Manager',
  zoom = 1,
  origin = 'center center',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 90 },
  });

  const scale = interpolate(windowSpring, [0, 1], [0.94, 1]);
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '1720px',
        height: '968px',
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: THEME.colors.bgSurface,
        border: '1px solid rgba(255, 107, 0, 0.3)',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85), 0 0 32px rgba(255, 107, 0, 0.15)',
        transform: `scale(${scale})`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}
    >
      {/* Window Titlebar */}
      <div
        style={{
          height: '40px',
          backgroundColor: '#0e0d14',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          userSelect: 'none',
        }}
      >
        {/* Window controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: THEME.typography.fontFamily,
            fontSize: '13px',
            fontWeight: 600,
            color: THEME.colors.textSecondary,
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </div>

        {/* Right status badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: THEME.typography.monoFamily,
            fontSize: '11px',
            fontWeight: 700,
            color: '#10b981',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          OFFLINE READY
        </div>
      </div>

      {/* Window Body with Video / Children */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${zoom})`,
            transformOrigin: origin,
            transition: 'transform 0.5s ease-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
