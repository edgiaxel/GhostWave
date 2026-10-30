import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

export const VisualizerScreen: React.FC = () => {
  const { playbackState, tracks, playbackEngine, togglePlayPause, settings, updateSettings } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [preset, setPreset] = useState<'ghost_pulse' | 'spectral_bars' | 'waveform_rings' | 'pumpkin_pulse'>(
    settings.visualizer.preset || 'ghost_pulse'
  );
  const [sensitivity, setSensitivity] = useState(settings.visualizer.sensitivity || 75);

  const handlePresetSelect = (newPreset: typeof preset) => {
    setPreset(newPreset);
    updateSettings({
      visualizer: {
        ...settings.visualizer,
        preset: newPreset,
      },
    });
  };

  const handleSensitivityChange = (val: number) => {
    setSensitivity(val);
    updateSettings({
      visualizer: {
        ...settings.visualizer,
        sensitivity: val,
      },
    });
  };

  const currentTrack = tracks.find((t) => t.id === playbackState.currentTrackId) || tracks[0] || null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const analyser = playbackEngine?.getAnalyser();
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

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

      // Real audio frequency data if analyser is active and playing
      let realAmp = 0;
      if (analyser && dataArray && playbackState.isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 32; i++) {
          sum += dataArray[i];
        }
        realAmp = (sum / 32 / 255) * (sensitivity / 50);
      }

      const ampMultiplier = playbackState.isPlaying ? Math.max(0.4, realAmp || sensitivity / 50) : 0.2;
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
          const freqVal = dataArray && playbackState.isPlaying ? dataArray[i * 2] / 255 : 0;
          const simulatedHeight = (Math.sin(i * 0.3 + phase) * 0.5 + 0.5) * height * 0.55 * ampMultiplier;
          const freqHeight = freqVal > 0 ? freqVal * height * 0.7 * (sensitivity / 50) : simulatedHeight;

          const x = i * (barWidth + 4);
          const y = height - Math.max(4, freqHeight);

          ctx.fillStyle = i % 2 === 0 ? '#ddb7ff' : '#60ff99';
          ctx.fillRect(x, y, barWidth, Math.max(4, freqHeight));
        }
      } else if (preset === 'pumpkin_pulse') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22 * (1 + ampMultiplier * 0.35);

        if (typeof ctx.arc === 'function') {
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
          if (typeof ctx.createRadialGradient === 'function') {
            const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
            grad.addColorStop(0, 'rgba(255, 182, 141, 0.4)');
            grad.addColorStop(0.7, 'rgba(255, 138, 76, 0.2)');
            grad.addColorStop(1, 'rgba(255, 138, 76, 0)');
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = 'rgba(255, 182, 141, 0.3)';
          }
          ctx.fill();
        }

        const rays = 16;
        ctx.strokeStyle = '#ffb68d';
        ctx.lineWidth = 2;
        for (let i = 0; i < rays; i++) {
          const angle = (i / rays) * Math.PI * 2 + phase * 0.5;
          const rayLength = baseRadius * (1.2 + Math.sin(i * 3 + phase) * 0.25 * ampMultiplier);
          const x1 = centerX + Math.cos(angle) * baseRadius;
          const y1 = centerY + Math.sin(angle) * baseRadius;
          const x2 = centerX + Math.cos(angle) * rayLength;
          const y2 = centerY + Math.sin(angle) * rayLength;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
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
  }, [playbackState.isPlaying, preset, sensitivity, playbackEngine]);

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
            {currentTrack ? currentTrack.title : 'GhostWave Ambient Pulse'}{' '}
            <span className="text-on-surface-variant font-normal text-sm">
              / {currentTrack ? currentTrack.artist : 'Offline Visualizer'}
            </span>
          </h1>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-full border border-outline-variant/20 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => handlePresetSelect('ghost_pulse')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              preset === 'ghost_pulse'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Ghost Pulse
          </button>
          <button
            onClick={() => handlePresetSelect('spectral_bars')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              preset === 'spectral_bars'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Spectral Bars
          </button>
          <button
            onClick={() => handlePresetSelect('waveform_rings')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              preset === 'waveform_rings'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Waveform Rings
          </button>
          <button
            onClick={() => handlePresetSelect('pumpkin_pulse')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              preset === 'pumpkin_pulse'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Pumpkin Pulse
          </button>
        </div>
      </div>

      {/* Main Canvas Display */}
      <div className="relative w-full aspect-video min-h-[380px] rounded-2xl bg-surface-container-lowest border border-outline-variant/20 overflow-hidden shadow-md flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating Quick Action Overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-surface-container-low/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-sm">
          <span className="material-symbols-outlined text-outline text-sm">tune</span>
          <span className="text-[11px] font-mono text-outline">Sensitivity</span>
          <input
            type="range"
            min={10}
            max={100}
            value={sensitivity}
            onChange={(e) => handleSensitivityChange(Number(e.target.value))}
            className="w-20 h-1 bg-surface-container-high rounded appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Minimal Playback Transport Quick Strip */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayPause}
            className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-sm"
            aria-label={playbackState.isPlaying ? 'Pause' : 'Play'}
          >
            <span className="material-symbols-outlined text-xl font-bold">
              {playbackState.isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-on-surface">
              {currentTrack ? currentTrack.title : 'Ready to Play'}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {playbackState.isPlaying ? 'Audio Reactive Spectral Engine Active' : 'Transport Paused'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-outline">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span>Web Audio FFT 2048</span>
        </div>
      </div>
    </div>
  );
};
