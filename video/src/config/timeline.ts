export const FPS = 30;

export interface SceneConfig {
  id: string;
  name: string;
  startFrame: number;
  durationInFrames: number;
  sourceVideoStartSec?: number;
  sourceVideoDurationSec?: number;
}

export const SCENES: Record<string, SceneConfig> = {
  INTRO: {
    id: 'intro',
    name: 'The Storm',
    startFrame: 0,
    durationInFrames: 540, // 18s (00:00 - 00:18)
  },
  PROBLEM: {
    id: 'problem',
    name: 'The Problem & Awakening',
    startFrame: 540,
    durationInFrames: 510, // 17s (00:18 - 00:35)
  },
  CRATE_DECK: {
    id: 'crate_deck',
    name: 'Crate Deck - Local Vault',
    startFrame: 1050,
    durationInFrames: 600, // 20s (00:35 - 00:55)
    sourceVideoStartSec: 5,
    sourceVideoDurationSec: 20,
  },
  AUDIO_DECK: {
    id: 'audio_deck',
    name: 'Audio Deck & Visualizer',
    startFrame: 1650,
    durationInFrames: 690, // 23s (00:55 - 01:18)
    sourceVideoStartSec: 25,
    sourceVideoDurationSec: 20,
  },
  LOCAL_AI: {
    id: 'local_ai',
    name: 'Local AI - Gemma 3 Centerpiece',
    startFrame: 2340,
    durationInFrames: 1110, // 37s (01:18 - 01:55)
    sourceVideoStartSec: 45,
    sourceVideoDurationSec: 20,
  },
  INTELLIGENCE: {
    id: 'intelligence',
    name: 'Library Intelligence & Audits',
    startFrame: 3450,
    durationInFrames: 750, // 25s (01:55 - 02:20)
    sourceVideoStartSec: 65,
    sourceVideoDurationSec: 13,
  },
  HISTORY: {
    id: 'history',
    name: 'History & Recommendations',
    startFrame: 4200,
    durationInFrames: 450, // 15s (02:20 - 02:35)
    sourceVideoStartSec: 78,
    sourceVideoDurationSec: 10,
  },
  CLOSING: {
    id: 'closing',
    name: 'Digital Sovereignty Closing',
    startFrame: 4650,
    durationInFrames: 450, // 15s (02:35 - 02:50)
  },
};

export const TOTAL_DURATION_IN_FRAMES = 5100; // 170s = 2m 50s
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
