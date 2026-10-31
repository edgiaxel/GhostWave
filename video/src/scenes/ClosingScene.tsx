import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { GhostParticles } from '../components/GhostParticles';
import { WaveformGraphic } from '../components/WaveformGraphic';
import { THEME } from '../config/theme';

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const taglineSpring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const urlSpring = spring({
    frame: Math.max(0, frame - 50),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: THEME.colors.bgDark,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      <GhostParticles />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity,
          zIndex: 10,
        }}
      >
        {/* Animated Ghost Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100px',
            height: '100px',
            borderRadius: '26px',
            backgroundColor: 'rgba(255, 107, 0, 0.15)',
            border: '2px solid #ff6b00',
            boxShadow: '0 0 50px rgba(255, 107, 0, 0.5)',
            fontSize: '52px',
            marginBottom: '28px',
            transform: `scale(${interpolate(logoSpring, [0, 1], [0.8, 1])})`,
          }}
        >
          👻
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: THEME.typography.fontFamily,
            fontSize: '84px',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #ff6b00 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 16px 0',
            lineHeight: 1,
          }}
        >
          GHOSTWAVE
        </h1>

        {/* Core Pillars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontFamily: THEME.typography.monoFamily,
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: THEME.colors.textPrimary,
            textTransform: 'uppercase',
            transform: `translateY(${interpolate(taglineSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          <span style={{ color: THEME.colors.orange }}>LOCAL-FIRST MUSIC</span>
          <span style={{ color: THEME.colors.textMuted }}>•</span>
          <span style={{ color: THEME.colors.purple }}>OPEN-WEIGHT AI</span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: THEME.typography.fontFamily,
            fontSize: '24px',
            fontWeight: 500,
            color: THEME.colors.textSecondary,
            marginTop: '16px',
            maxWidth: '700px',
            letterSpacing: '-0.01em',
          }}
        >
          Built to keep the music playing when the cloud goes dark.
        </p>

        {/* Audio Waveform */}
        <div style={{ margin: '28px 0' }}>
          <WaveformGraphic bars={32} height={40} color={THEME.colors.orange} active={true} />
        </div>

        {/* GitHub Repository Box */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 28px',
            borderRadius: '14px',
            backgroundColor: 'rgba(18, 17, 26, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            transform: `translateY(${interpolate(urlSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          <span style={{ fontSize: '20px' }}>📦</span>
          <span
            style={{
              fontFamily: THEME.typography.monoFamily,
              fontSize: '18px',
              fontWeight: 700,
              color: THEME.colors.textPrimary,
              letterSpacing: '0.04em',
            }}
          >
            github.com/edgiaxel/GhostWave
          </span>
        </div>

        <div
          style={{
            fontFamily: THEME.typography.monoFamily,
            fontSize: '13px',
            color: THEME.colors.textMuted,
            marginTop: '24px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Hacktoberfest 2026 // Ghost in the Machine
        </div>
      </div>
    </div>
  );
};
