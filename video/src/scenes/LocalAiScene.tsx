import React from 'react';
import { interpolate, staticFile, useCurrentFrame, Video } from 'remotion';
import { AppWindowFrame } from '../components/AppWindowFrame';
import { FeatureCallout } from '../components/FeatureCallout';
import { GhostParticles } from '../components/GhostParticles';
import { SectionLabel } from '../components/SectionLabel';
import { THEME } from '../config/theme';

export const LocalAiScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Gentle cinematic zoom into the AI interaction
  const zoom = interpolate(frame, [0, 300, 700, 1100], [1, 1.05, 1.05, 1], {
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
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <GhostParticles />
      <SectionLabel
        sceneNumber="03"
        category="OPEN-WEIGHT AI CENTERPIECE"
        sceneTitle="Gemma 3 4B via Ollama"
      />

      {/* Prominent Centerpiece Header Badge */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          right: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 20px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          border: '1px solid #a855f7',
          color: '#e9d5ff',
          fontFamily: THEME.typography.monoFamily,
          fontSize: '13px',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
          zIndex: 25,
        }}
      >
        <span style={{ fontSize: '16px' }}>🤖</span> 100% OFFLINE INFERENCE
      </div>

      <AppWindowFrame
        title="GhostWave — Local AI Assistant (Google Gemma 3 4B via Ollama)"
        zoom={zoom}
        origin="center 40%"
      >
        <Video
          src={staticFile('ghostwave_product_demo.mp4')}
          startFrom={1350} // 45s * 30fps
          playbackRate={0.65} // Elegantly paces the inference and proposal preview
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AppWindowFrame>

      {/* Dynamic Callouts */}
      {frame < 400 && (
        <FeatureCallout
          title="Open-Weight Local Intelligence"
          description="Powered by Google's Gemma 3 4B running on your local machine via Ollama. No cloud APIs, no subscriptions, zero data leakage."
          icon="🧠"
          accentColor={THEME.colors.orange}
          position="bottom-left"
          delay={20}
        />
      )}

      {frame >= 380 && frame < 760 && (
        <FeatureCallout
          title="Strict Structured Schema"
          description="Natural language prompts are translated into deterministic JSON schemas containing validated track IDs, descriptions, and rationales."
          icon="📐"
          accentColor={THEME.colors.purple}
          position="bottom-right"
          delay={390}
        />
      )}

      {frame >= 740 && (
        <FeatureCallout
          title="Deterministic Hallucination Shield"
          description="GhostWave validates every proposed track against your real IndexedDB vault. Fictional suggestions are rejected before saving."
          icon="🛡️"
          accentColor={THEME.colors.cyan}
          position="bottom-left"
          delay={750}
        />
      )}
    </div>
  );
};
