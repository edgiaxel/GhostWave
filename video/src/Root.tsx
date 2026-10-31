import React from 'react';
import { Composition } from 'remotion';
import { GhostWaveProductFilm } from './Composition';
import { FPS, TOTAL_DURATION_IN_FRAMES, VIDEO_HEIGHT, VIDEO_WIDTH } from './config/timeline';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GhostWaveProductFilm"
        component={GhostWaveProductFilm}
        durationInFrames={TOTAL_DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    </>
  );
};
