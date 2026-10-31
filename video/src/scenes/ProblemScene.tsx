import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { GhostParticles } from '../components/GhostParticles';
import { THEME } from '../config/theme';

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const card1Spring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const card2Spring = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const bannerSpring = spring({
    frame: Math.max(0, frame - 180),
    fps,
    config: { damping: 12, stiffness: 85 },
  });

  const problemCardsOpacity = interpolate(frame, [0, 20, 220, 250], [0, 1, 1, 0]);
  const solutionOpacity = interpolate(frame, [240, 270, 480, 500], [0, 1, 1, 0]);

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
      <GhostParticles />

      {/* Part 1: The Dilemma */}
      {frame < 260 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: problemCardsOpacity,
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: THEME.typography.monoFamily,
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.2em',
              color: '#ef4444',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            THE LOCAL AUDIO DILEMMA
          </div>
          <h2
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '54px',
              fontWeight: 900,
              color: THEME.colors.textPrimary,
              letterSpacing: '-0.02em',
              margin: '0 0 40px 0',
              textAlign: 'center',
            }}
          >
            Why Should Playing Local Music Be So Frustrating?
          </h2>

          <div
            style={{
              display: 'flex',
              gap: '32px',
              maxWidth: '1200px',
            }}
          >
            {/* Card 1: Cloud Streaming Trap */}
            <div
              style={{
                flex: 1,
                padding: '36px',
                borderRadius: '24px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                transform: `translateY(${interpolate(card1Spring, [0, 1], [40, 0])}px)`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>☁️❌</div>
              <h3
                style={{
                  fontFamily: THEME.typography.fontFamily,
                  fontSize: '26px',
                  fontWeight: 800,
                  color: '#f87171',
                  margin: '0 0 12px 0',
                }}
              >
                Closed Cloud Streaming
              </h3>
              <ul
                style={{
                  fontFamily: THEME.typography.fontFamily,
                  fontSize: '18px',
                  color: THEME.colors.textSecondary,
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  margin: 0,
                }}
              >
                <li>You own zero files; tracks vanish with licensing disputes</li>
                <li>Fails completely when offline or connection blinks</li>
                <li>Cloud AI services scrape your listening telemetry</li>
              </ul>
            </div>

            {/* Card 2: Offline Vault Chaos */}
            <div
              style={{
                flex: 1,
                padding: '36px',
                borderRadius: '24px',
                backgroundColor: 'rgba(255, 107, 0, 0.08)',
                border: '1px solid rgba(255, 107, 0, 0.3)',
                transform: `translateY(${interpolate(card2Spring, [0, 1], [40, 0])}px)`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📁🌪️</div>
              <h3
                style={{
                  fontFamily: THEME.typography.fontFamily,
                  fontSize: '26px',
                  fontWeight: 800,
                  color: THEME.colors.orange,
                  margin: '0 0 12px 0',
                }}
              >
                Offline Vault Chaos
              </h3>
              <ul
                style={{
                  fontFamily: THEME.typography.fontFamily,
                  fontSize: '18px',
                  color: THEME.colors.textSecondary,
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  margin: 0,
                }}
              >
                <li>Unindexed unicode filenames and missing ID3 metadata</li>
                <li>Manual playlist creation takes hours of tedious clicking</li>
                <li>Generic file managers lack audio-reactive beauty</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Part 2: Introducing GhostWave */}
      {frame >= 230 && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: solutionOpacity,
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: '8px 24px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 107, 0, 0.15)',
              border: '1px solid #ff6b00',
              color: THEME.colors.orange,
              fontFamily: THEME.typography.monoFamily,
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}
          >
            THE SOLUTION
          </div>

          <h1
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '88px',
              fontWeight: 900,
              color: THEME.colors.textPrimary,
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1,
              transform: `scale(${interpolate(bannerSpring, [0, 1], [0.85, 1])})`,
            }}
          >
            MEET <span style={{ color: THEME.colors.orange }}>GHOSTWAVE</span>
          </h1>

          <p
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '32px',
              fontWeight: 600,
              color: THEME.colors.purple,
              marginTop: '20px',
              letterSpacing: '-0.01em',
            }}
          >
            Your Music. Your Machine. Your Rules.
          </p>

          <p
            style={{
              fontFamily: THEME.typography.fontFamily,
              fontSize: '20px',
              fontWeight: 400,
              color: THEME.colors.textSecondary,
              maxWidth: '840px',
              lineHeight: 1.5,
              marginTop: '12px',
            }}
          >
            A local-first music manager pairing high-fidelity Web Audio playback with Google's Gemma 3 4B running entirely on your own device.
          </p>
        </div>
      )}
    </div>
  );
};
