import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { SCENES } from './config/timeline';
import { ClosingScene } from './scenes/ClosingScene';
import { HistoryScene } from './scenes/HistoryScene';
import { IntelligenceScene } from './scenes/IntelligenceScene';
import { IntroScene } from './scenes/IntroScene';
import { LibraryScene } from './scenes/LibraryScene';
import { LocalAiScene } from './scenes/LocalAiScene';
import { PlayerScene } from './scenes/PlayerScene';
import { ProblemScene } from './scenes/ProblemScene';

export const GhostWaveProductFilm: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#08080a',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Original Synthesized Soundtrack */}
      <Audio src={staticFile('soundtrack.wav')} />

      {/* Scene 1: The Storm (00:00 - 00:18) */}
      <Sequence from={SCENES.INTRO.startFrame} durationInFrames={SCENES.INTRO.durationInFrames}>
        <IntroScene />
      </Sequence>

      {/* Scene 2: The Problem & Awakening (00:18 - 00:35) */}
      <Sequence from={SCENES.PROBLEM.startFrame} durationInFrames={SCENES.PROBLEM.durationInFrames}>
        <ProblemScene />
      </Sequence>

      {/* Scene 3: Crate Deck - Local Vault (00:35 - 00:55) */}
      <Sequence from={SCENES.CRATE_DECK.startFrame} durationInFrames={SCENES.CRATE_DECK.durationInFrames}>
        <LibraryScene />
      </Sequence>

      {/* Scene 4: Audio Deck & Visualizer (00:55 - 01:18) */}
      <Sequence from={SCENES.AUDIO_DECK.startFrame} durationInFrames={SCENES.AUDIO_DECK.durationInFrames}>
        <PlayerScene />
      </Sequence>

      {/* Scene 5: Local AI - Gemma 3 Centerpiece (01:18 - 01:55) */}
      <Sequence from={SCENES.LOCAL_AI.startFrame} durationInFrames={SCENES.LOCAL_AI.durationInFrames}>
        <LocalAiScene />
      </Sequence>

      {/* Scene 6: Library Intelligence & Audits (01:55 - 02:20) */}
      <Sequence from={SCENES.INTELLIGENCE.startFrame} durationInFrames={SCENES.INTELLIGENCE.durationInFrames}>
        <IntelligenceScene />
      </Sequence>

      {/* Scene 7: History & Recommendations (02:20 - 02:35) */}
      <Sequence from={SCENES.HISTORY.startFrame} durationInFrames={SCENES.HISTORY.durationInFrames}>
        <HistoryScene />
      </Sequence>

      {/* Scene 8: Closing & Digital Sovereignty (02:35 - 02:50) */}
      <Sequence from={SCENES.CLOSING.startFrame} durationInFrames={SCENES.CLOSING.durationInFrames}>
        <ClosingScene />
      </Sequence>
    </div>
  );
};
