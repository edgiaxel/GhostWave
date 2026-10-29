import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

export const VisualizerScreen: React.FC = () => {
  const { playbackState, tracks, togglePlayPause } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [preset, setPreset] = useState<'ghost_pulse' | 'spectral_bars' | 'waveform_rings'>('ghost_pulse');
  const [sensitivity, setSensitivity] = useState(75);

  const currentTrack = tracks.find((t) => t.id === playbackState.currentTrackId) || tracks[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Dark trailing fade
      ctx.fillStyle = 'rgba(18, 19, 26, 0.25)';
      ctx.fillRect(0, 0, width, height);

      const ampMultiplier = playbackState.isPlaying ? sensitivity / 50 : 0.2;
      phase += playbackState.isPlaying ? 0.04 : 0.01;

      if (preset === 'ghost_pulse') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22;

        ctx.lineWidth = 2.5;

        for (let ring = 0; ring < 3; ring++) {
          ctx.beginPath();
          const rOffset = ring * 36;
          ctx.strokeStyle = ring === 0 ? '#ddb7ff' : ring === 1 ? '#60ff99' : '#ffb68d';

          const points = 64;
          for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const wave = Math.sin(angle * 6 + phase + ring) * 14 * ampMultiplier;
            const r = baseRadius + rOffset + wave;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      } else if (preset === 'spectral_bars') {
        const numBars = 48;
        const barWidth = (width - numBars * 4) / numBars;

        for (let i = 0; i < numBars; i++) {
          const freqHeight = (Math.sin(i * 0.3 + phase) * 0.5 + 0.5) * height * 0.55 * ampMultiplier;
          const x = i * (barWidth + 4);
          const y = height - freqHeight;

          ctx.fillStyle = i % 2 === 0 ? '#ddb7ff' : '#60ff99';
          ctx.fillRect(x, y, barWidth, freqHeight);
        }
      } else {
        ctx.beginPath();
        ctx.strokeStyle = '#ddb7ff';
        ctx.lineWidth = 3;
        for (let x = 0; x < width; x += 4) {
          const y =
            height / 2 +
            Math.sin(x * 0.015 + phase) * 50 * ampMultiplier +
            Math.cos(x * 0.03 - phase) * 25 * ampMultiplier;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [playbackState.isPlaying, preset, sensitivity]);

  return (
    <div className="flex flex-col w-full gap-5 pb-6">
      {/* Streamlined Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-mono text-secondary uppercase font-semibold">
              Live Visualizer
            </span>
          </div>
          <h1 className="font-headline font-bold text-xl text-on-surface truncate mt-0.5">
            {currentTrack.title}{' '}
            <span className="text-on-surface-variant font-normal text-sm">
              / {currentTrack.artist}
            </span>
          </h1>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-full border border-outline-variant/20 self-start sm:self-auto">
          <button
            onClick={() => setPreset('ghost_pulse')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              preset === 'ghost_pulse'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Ghost Pulse
          </button>
          <button
            onClick={() => setPreset('spectral_bars')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              preset === 'spectral_bars'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Spectral Bars
          </button>
          <button
            onClick={() => setPreset('waveform_rings')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              preset === 'waveform_rings'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Waveform
          </button>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div className="relative w-full rounded-2xl bg-surface-container-lowest border border-outline-variant/30 overflow-hidden shadow-xl min-h-[460px] h-[55vh] flex flex-col justify-between">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair z-0" />

        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-surface-container-lowest via-transparent to-surface-container-lowest/60 z-10" />

        {/* Floating Top Meter */}
        <div className="relative z-20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-surface-container-low/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-outline-variant/20 shadow-sm">
            <span className="material-symbols-outlined text-primary text-base">graphic_eq</span>
            <span className="text-xs font-medium text-on-surface capitalize">
              {preset.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-sm">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-outline">
              <span>Sub</span>
              <div className="w-1.5 h-3 bg-secondary/80 rounded-full" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-outline">
              <span>Bass</span>
              <div className="w-1.5 h-3 bg-primary/80 rounded-full" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-outline">
              <span>Mid</span>
              <div className="w-1.5 h-3 bg-tertiary/80 rounded-full" />
            </div>
          </div>
        </div>

        {/* Clean Bottom Floating Strip */}
        <div className="relative z-20 p-4 flex items-center justify-between bg-surface-container-lowest/70 backdrop-blur-md border-t border-outline-variant/20">
          <div className="flex items-center gap-3 text-xs text-outline">
            <span>Sensitivity</span>
            <input
              type="range"
              min={10}
              max={100}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-24 h-1 bg-surface-container-high rounded appearance-none cursor-pointer accent-primary"
            />
            <span className="font-mono text-on-surface font-semibold">{sensitivity}%</span>
          </div>

          <button
            onClick={togglePlayPause}
            className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5 border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-sm">
              {playbackState.isPlaying ? 'pause' : 'play_arrow'}
            </span>
            <span>{playbackState.isPlaying ? 'Pause' : 'Play'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
