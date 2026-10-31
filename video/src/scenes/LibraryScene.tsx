import React from 'react';
import { staticFile, Video } from 'remotion';
import { AppWindowFrame } from '../components/AppWindowFrame';
import { FeatureCallout } from '../components/FeatureCallout';
import { GhostParticles } from '../components/GhostParticles';
import { SectionLabel } from '../components/SectionLabel';
import { THEME } from '../config/theme';

export const LibraryScene: React.FC = () => {
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
      <SectionLabel sceneNumber="01" category="LOCAL MUSIC STORAGE" sceneTitle="Crate Deck Vault" />

      <AppWindowFrame title="GhostWave — Crate Deck (74 Tracks Loaded)" zoom={1}>
        <Video
          src={staticFile('ghostwave_product_demo.mp4')}
          startFrom={150} // 5s * 30fps
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AppWindowFrame>

      {/* Feature Callouts */}
      <FeatureCallout
        title="Zero-Cloud Audio Vault"
        description="Reads local MP3, FLAC, and WAV files directly into an indexed offline catalog. Your files are never uploaded."
        icon="📁"
        accentColor={THEME.colors.orange}
        position="bottom-left"
        delay={20}
      />

      <FeatureCallout
        title="Search & Dual Views"
        description="Instant multi-field fuzzy search with format pills and seamless toggle between DJ Table and Album Art Grid."
        icon="🔍"
        accentColor={THEME.colors.purple}
        position="bottom-right"
        delay={260}
      />
    </div>
  );
};
