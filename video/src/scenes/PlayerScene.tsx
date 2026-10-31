import React from 'react';
import { staticFile, Video } from 'remotion';
import { AppWindowFrame } from '../components/AppWindowFrame';
import { FeatureCallout } from '../components/FeatureCallout';
import { GhostParticles } from '../components/GhostParticles';
import { SectionLabel } from '../components/SectionLabel';
import { THEME } from '../config/theme';

export const PlayerScene: React.FC = () => {
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
      <SectionLabel sceneNumber="02" category="AUDIO ENGINE & DSP" sceneTitle="Audio Deck & Visualizer" />

      <AppWindowFrame title="GhostWave — Audio Deck Playback & Visualizer" zoom={1}>
        <Video
          src={staticFile('ghostwave_product_demo.mp4')}
          startFrom={750} // 25s * 30fps
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AppWindowFrame>

      <FeatureCallout
        title="Web Audio API Transport"
        description="High-fidelity local playback, elapsed time tracking, seek bar, queue inspector, and repeat modes."
        icon="🎛️"
        accentColor={THEME.colors.orange}
        position="bottom-left"
        delay={20}
      />

      <FeatureCallout
        title="Slide-Up Spectral Drawer"
        description="Real-time 60 FPS audio-reactive visualizer analyzing live audio frequencies with glowing waveforms."
        icon="📊"
        accentColor={THEME.colors.purple}
        position="bottom-right"
        delay={240}
      />
    </div>
  );
};
