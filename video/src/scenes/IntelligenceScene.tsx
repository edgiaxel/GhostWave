import React from 'react';
import { staticFile, Video } from 'remotion';
import { AppWindowFrame } from '../components/AppWindowFrame';
import { FeatureCallout } from '../components/FeatureCallout';
import { GhostParticles } from '../components/GhostParticles';
import { SectionLabel } from '../components/SectionLabel';
import { THEME } from '../config/theme';

export const IntelligenceScene: React.FC = () => {
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
        sceneNumber="04"
        category="LIBRARY HEALTH & AUDITS"
        sceneTitle="Metadata Health & Candidate Review"
      />

      <AppWindowFrame title="GhostWave — Library Health Audit & Tag Proposals" zoom={1}>
        <Video
          src={staticFile('ghostwave_product_demo.mp4')}
          startFrom={1950} // 65s * 30fps
          playbackRate={0.8}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AppWindowFrame>

      <FeatureCallout
        title="Repair Your Metadata"
        description="Automated library audits diagnose missing tags, naming inconsistencies, and duplicate hashes across your collection."
        icon="🩺"
        accentColor={THEME.colors.orange}
        position="bottom-left"
        delay={20}
      />

      <FeatureCallout
        title="Review Before Applying"
        description="Inspect side-by-side tag diffs, artwork previews, and lyrics in a safe human-in-the-loop candidate workflow. No silent overwrites."
        icon="🔍"
        accentColor={THEME.colors.purple}
        position="bottom-right"
        delay={320}
      />
    </div>
  );
};
