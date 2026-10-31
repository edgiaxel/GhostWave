import React from 'react';
import { staticFile, Video } from 'remotion';
import { AppWindowFrame } from '../components/AppWindowFrame';
import { FeatureCallout } from '../components/FeatureCallout';
import { GhostParticles } from '../components/GhostParticles';
import { SectionLabel } from '../components/SectionLabel';
import { THEME } from '../config/theme';

export const HistoryScene: React.FC = () => {
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
        sceneNumber="05"
        category="LISTENING ANALYTICS"
        sceneTitle="History & Transparent Recommendations"
      />

      <AppWindowFrame title="GhostWave — Listening History & Discovery" zoom={1}>
        <Video
          src={staticFile('ghostwave_product_demo.mp4')}
          startFrom={2340} // 78s * 30fps
          playbackRate={0.8}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AppWindowFrame>

      <FeatureCallout
        title="Local Scrobbling & Privacy"
        description="Tracks listening sessions and skip rates locally. Data never leaves your machine and can be cleared or paused at any time."
        icon="📊"
        accentColor={THEME.colors.orange}
        position="bottom-left"
        delay={20}
      />

      <FeatureCallout
        title="Transparent Discovery"
        description="Offline recommendation engine highlights unplayed gems in your vault with clear, explainable rationales."
        icon="💡"
        accentColor={THEME.colors.purple}
        position="bottom-right"
        delay={200}
      />
    </div>
  );
};
