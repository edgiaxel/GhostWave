import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { GhostParticles } from '../components/GhostParticles';
import { WaveformGraphic } from '../components/WaveformGraphic';
import { THEME } from '../config/theme';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Lightning flash effect
  const lightningFlash =
    frame === 45 || frame === 48 || frame === 140 || frame === 143 || frame === 280
      ? 0.35
      : 0;

  const titleSpring = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const text1Opacity = interpolate(frame, [15, 35, 120, 140], [0, 1, 1, 0]);
  const text2Opacity = interpolate(frame, [145, 165, 260, 280], [0, 1, 1, 0]);
  const text3Opacity = interpolate(frame, [290, 310, 500, 530], [0, 1, 1, 0]);

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
      }}
    >
      {/* Background ambient lightning & gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 50% 45%, rgba(168, 85, 247, ${0.15 + lightningFlash}) 0%, rgba(8, 8, 10, 1) 75%)`,
          pointerEvents: 'none',
        }}
      />

      <GhostParticles />

      {/* Part 1: Thunderstorm atmospheric setup */}
      {frame < 145 && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: text1Opacity,
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: THEME.typography.monoFamily,
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '0.25em',
              color: THEME.colors.orange,
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            OCTOBER 31 // 23:42 PM
          </div>
          <h1
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '76px',
              fontWeight: 900,
              color: THEME.colors.textPrimary,
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            HALLOWEEN NIGHT
          </h1>
          <p
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '32px',
              fontWeight: 500,
              color: THEME.colors.textSecondary,
              marginTop: '16px',
            }}
          >
            A seasonal thunderstorm approaches. The power flickers.
          </p>
        </div>
      )}

      {/* Part 2: The internet dies */}
      {frame >= 140 && frame < 290 && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: text2Opacity,
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: '56px',
              marginBottom: '16px',
            }}
          >
            ⚡
          </div>
          <h1
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '76px',
              fontWeight: 900,
              color: '#ef4444',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.1,
              textShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
            }}
          >
            THE INTERNET GOES DARK.
          </h1>
          <p
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '32px',
              fontWeight: 600,
              color: THEME.colors.textPrimary,
              marginTop: '16px',
            }}
          >
            Cloud streaming stops dead. Error 404: No connection.
          </p>
        </div>
      )}

      {/* Part 3: GhostWave Awakening */}
      {frame >= 280 && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: text3Opacity,
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '96px',
              height: '96px',
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 107, 0, 0.15)',
              border: '2px solid #ff6b00',
              boxShadow: '0 0 40px rgba(255, 107, 0, 0.5)',
              fontSize: '48px',
              marginBottom: '24px',
              transform: `scale(${interpolate(titleSpring, [0, 1], [0.8, 1])})`,
            }}
          >
            👻
          </div>
          <h1
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '84px',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ff6b00 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              lineHeight: 1,
            }}
          >
            YOUR MUSIC SHOULDN'T.
          </h1>
          <p
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '28px',
              fontWeight: 600,
              color: THEME.colors.textSecondary,
              marginTop: '20px',
              maxWidth: '800px',
            }}
          >
            The ghost in the machine awakens. Local-first audio intelligence.
          </p>
          <div style={{ marginTop: '36px' }}>
            <WaveformGraphic bars={36} height={50} color={THEME.colors.orange} active={true} />
          </div>
        </div>
      )}
    </div>
  );
};
