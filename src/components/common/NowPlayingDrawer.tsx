import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Track } from '../../types';

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  hue: number;
}

export const NowPlayingDrawer: React.FC = () => {
  const {
    isVisualizerOpen,
    setIsVisualizerOpen,
    playbackState,
    tracks,
    playbackEngine,
    queue,
    removeFromQueue,
    moveQueueItem,
    clearQueue,
    playQueueItem,
    layout,
    settings,
    updateSettings,
    setRoute,
  } = useApp();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Local preset & sensitivity synced with settings
  const [preset, setPreset] = useState<'ghost_pulse' | 'spectral_bars' | 'waveform_rings' | 'pumpkin_pulse'>(
    settings.visualizer.preset || 'ghost_pulse'
  );
  const [sensitivity, setSensitivity] = useState(settings.visualizer.sensitivity || 75);
  const [halloweenMotifs, setHalloweenMotifs] = useState(
    settings.visualizer.halloweenMotifs ?? true
  );

  const currentTrack: Track | null = useMemo(() => {
    return tracks.find((t) => t.id === playbackState.currentTrackId) || null;
  }, [tracks, playbackState.currentTrackId]);

  // Update settings when visualizer controls change
  const handlePresetChange = (newPreset: typeof preset) => {
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

  const handleToggleMotifs = () => {
    const next = !halloweenMotifs;
    setHalloweenMotifs(next);
    updateSettings({
      visualizer: {
        ...settings.visualizer,
        halloweenMotifs: next,
      },
    });
  };

  // Check prefers-reduced-motion
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }, []);

  // Audio-reactive visualizer canvas animation loop
  useEffect(() => {
    if (!isVisualizerOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    // Particles for Halloween motif (spooky spectral embers)
    const particles: Particle[] = [];
    const maxParticles = prefersReducedMotion.current ? 12 : 36;
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * (canvas.clientWidth || 800),
        y: Math.random() * (canvas.clientHeight || 500),
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.3 - Math.random() * 0.7,
        radius: 1 + Math.random() * 2.5,
        alpha: 0.1 + Math.random() * 0.5,
        hue: Math.random() > 0.5 ? 270 : 35, // Violet or Pumpkin orange
      });
    }

    const analyser = playbackEngine?.getAnalyser();
    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const timeData = analyser ? new Uint8Array(analyser.fftSize) : null;

    const render = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Dark background trail with spooky ambiance
      ctx.fillStyle = 'rgba(12, 13, 20, 0.28)';
      ctx.fillRect(0, 0, width, height);

      // Measure real audio amplitude from AnalyserNode if playing
      let bassAmp = 0;
      let midAmp = 0;
      let trebleAmp = 0;

      if (analyser && freqData && playbackState.isPlaying && !playbackState.isMuted) {
        analyser.getByteFrequencyData(freqData);

        // Bass (0 - 16)
        let bassSum = 0;
        for (let i = 0; i < 16; i++) bassSum += freqData[i];
        bassAmp = (bassSum / 16 / 255) * (sensitivity / 50);

        // Mids (16 - 64)
        let midSum = 0;
        for (let i = 16; i < 64; i++) midSum += freqData[i];
        midAmp = (midSum / 48 / 255) * (sensitivity / 50);

        // Treble (64 - 160)
        let trebleSum = 0;
        for (let i = 64; i < 160; i++) trebleSum += freqData[i];
        trebleAmp = (trebleSum / 96 / 255) * (sensitivity / 50);
      }

      const isReduced = prefersReducedMotion.current;
      const speed = isReduced ? 0.005 : playbackState.isPlaying ? 0.03 : 0.01;
      phase += speed;

      const effectiveBass = playbackState.isPlaying && !playbackState.isMuted ? Math.max(0.15, bassAmp) : 0.1;
      const effectiveMid = playbackState.isPlaying && !playbackState.isMuted ? Math.max(0.15, midAmp) : 0.1;
      const effectiveTreble = playbackState.isPlaying && !playbackState.isMuted ? Math.max(0.15, trebleAmp) : 0.1;

      // 1. Halloween Embers Motif (if enabled)
      if (halloweenMotifs) {
        for (const p of particles) {
          p.x += p.vx * (1 + effectiveBass * 0.8);
          p.y += p.vy * (1 + effectiveBass * 1.5);

          if (p.y < 0) {
            p.y = height;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;

          if (typeof ctx.arc === 'function') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * (1 + effectiveBass * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.alpha * (0.6 + effectiveMid * 0.4)})`;
            ctx.fill();
          } else {
            ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.alpha * (0.6 + effectiveMid * 0.4)})`;
            ctx.fillRect(p.x, p.y, p.radius * 2, p.radius * 2);
          }
        }
      }

      // 2. Preset Rendering
      const centerX = width / 2;
      const centerY = height / 2;

      if (preset === 'ghost_pulse') {
        // Multi-ring spooky spectral pulse
        const baseRadius = Math.min(width, height) * 0.22;
        const rings = [
          { color: '#ddb7ff', offset: 0, mult: 1.0, freqMult: effectiveBass },
          { color: '#60ff99', offset: 32, mult: 1.2, freqMult: effectiveMid },
          { color: '#ffb68d', offset: 64, mult: 1.4, freqMult: effectiveTreble },
        ];

        ctx.lineWidth = 2.5;
        for (let rIdx = 0; rIdx < rings.length; rIdx++) {
          const ring = rings[rIdx];
          ctx.beginPath();
          ctx.strokeStyle = ring.color;
          const points = 72;

          for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const freqVal = freqData && playbackState.isPlaying ? (freqData[(i * 3) % freqData.length] / 255) : 0;
            const wave = Math.sin(angle * 7 + phase + rIdx) * 16 * ring.freqMult * ring.mult;
            const dynamicRadius = baseRadius + ring.offset + wave + freqVal * 30 * (sensitivity / 50);

            const x = centerX + Math.cos(angle) * dynamicRadius;
            const y = centerY + Math.sin(angle) * dynamicRadius;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      } else if (preset === 'spectral_bars') {
        // Frequency Equalizer Bars with peak highlights
        const numBars = 48;
        const totalSpacing = 4;
        const barWidth = Math.max(3, (width - (numBars + 1) * totalSpacing) / numBars);

        for (let i = 0; i < numBars; i++) {
          let barHeight: number;
          if (freqData && playbackState.isPlaying && !playbackState.isMuted) {
            const dataIdx = Math.floor((i / numBars) * 128);
            const val = freqData[dataIdx] / 255;
            barHeight = Math.max(6, val * height * 0.72 * (sensitivity / 50));
          } else {
            barHeight = (Math.sin(i * 0.28 + phase) * 0.5 + 0.5) * height * 0.35;
          }

          const x = totalSpacing + i * (barWidth + totalSpacing);
          const y = height - barHeight;

          // Gradient from secondary to primary
          if (typeof ctx.createLinearGradient === 'function') {
            const grad = ctx.createLinearGradient(x, y, x, height);
            grad.addColorStop(0, i % 2 === 0 ? '#ddb7ff' : '#60ff99');
            grad.addColorStop(1, '#1b122c');
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = i % 2 === 0 ? '#ddb7ff' : '#60ff99';
          }
          ctx.fillRect(x, y, barWidth, barHeight);

          // Top luminous cap
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y - 2, barWidth, 2);
        }
      } else if (preset === 'waveform_rings') {
        // Real-time Audio Waveform Oscilloscope Ring
        if (analyser && timeData && playbackState.isPlaying && !playbackState.isMuted) {
          analyser.getByteTimeDomainData(timeData);
        }

        const baseRadius = Math.min(width, height) * 0.28;
        ctx.beginPath();
        ctx.strokeStyle = '#ddb7ff';
        ctx.lineWidth = 3;

        const points = 120;
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          let waveOffset = 0;
          if (timeData && playbackState.isPlaying && !playbackState.isMuted) {
            const timeIdx = Math.floor((i / points) * timeData.length);
            waveOffset = ((timeData[timeIdx] - 128) / 128) * 45 * (sensitivity / 50);
          } else {
            waveOffset = Math.sin(angle * 8 + phase) * 15 * effectiveMid;
          }

          const r = baseRadius + waveOffset;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner glowing core
        if (typeof ctx.arc === 'function') {
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius * 0.5 * (1 + effectiveBass * 0.3), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(221, 183, 255, 0.08)';
          ctx.fill();
          ctx.strokeStyle = '#ffb68d';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      } else if (preset === 'pumpkin_pulse') {
        // Pumpkin pulse: spooky jack-o'-lantern audio aura with bass punch
        const baseRadius = Math.min(width, height) * 0.24 * (1 + effectiveBass * 0.4);

        if (typeof ctx.arc === 'function') {
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
          if (typeof ctx.createRadialGradient === 'function') {
            const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
            grad.addColorStop(0, 'rgba(255, 182, 141, 0.45)');
            grad.addColorStop(0.7, 'rgba(255, 138, 76, 0.2)');
            grad.addColorStop(1, 'rgba(255, 138, 76, 0)');
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = 'rgba(255, 182, 141, 0.3)';
          }
          ctx.fill();
        }

        // Radiating pumpkin rays
        const rays = 16;
        ctx.strokeStyle = '#ffb68d';
        ctx.lineWidth = 2;
        for (let i = 0; i < rays; i++) {
          const angle = (i / rays) * Math.PI * 2 + phase * 0.5;
          const rayLength = baseRadius * (1.2 + Math.sin(i * 3 + phase) * 0.3 * effectiveBass);
          const x1 = centerX + Math.cos(angle) * baseRadius;
          const y1 = centerY + Math.sin(angle) * baseRadius;
          const x2 = centerX + Math.cos(angle) * rayLength;
          const y2 = centerY + Math.sin(angle) * rayLength;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisualizerOpen, playbackState.isPlaying, playbackState.isMuted, preset, sensitivity, halloweenMotifs, playbackEngine]);

  if (!isVisualizerOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Now Playing Visualizer and Queue View"
      style={{
        top: `${layout.headerHeight}px`,
        bottom: `${layout.bottomPlayerHeight}px`,
      }}
      className={`fixed left-0 right-0 z-40 bg-surface/98 backdrop-blur-xl border-t border-outline-variant/30 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
        isVisualizerOpen
          ? 'translate-y-0 opacity-100 pointer-events-auto shadow-2xl'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Top Drawer Toolbar */}
      <div className="h-13 px-4 sm:px-6 border-b border-outline-variant/20 flex items-center justify-between gap-3 bg-surface-container-lowest/80 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shrink-0" />
            <span className="font-headline font-bold text-sm sm:text-base text-on-surface truncate">
              Live Visualizer
            </span>
          </div>
          {currentTrack && (
            <span className="text-xs text-on-surface-variant font-medium truncate hidden md:inline">
              &bull; {currentTrack.title} by {currentTrack.artist}
            </span>
          )}
        </div>

        {/* Preset Selector Buttons & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden sm:flex items-center gap-1 bg-surface-container p-0.5 rounded-full border border-outline-variant/20">
            <button
              onClick={() => handlePresetChange('ghost_pulse')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                preset === 'ghost_pulse'
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Ghost Pulse
            </button>
            <button
              onClick={() => handlePresetChange('spectral_bars')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                preset === 'spectral_bars'
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Spectral Bars
            </button>
            <button
              onClick={() => handlePresetChange('waveform_rings')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                preset === 'waveform_rings'
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Waveform Rings
            </button>
            <button
              onClick={() => handlePresetChange('pumpkin_pulse')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                preset === 'pumpkin_pulse'
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Pumpkin Pulse
            </button>
          </div>

          {/* Halloween Motifs Toggle */}
          <button
            onClick={handleToggleMotifs}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
              halloweenMotifs
                ? 'bg-secondary/15 text-secondary border-secondary/30'
                : 'bg-surface-container text-outline border-outline-variant/20 hover:text-on-surface'
            }`}
            title="Toggle Halloween spectral embers & glow"
          >
            <span className="material-symbols-outlined text-sm">sparkles</span>
            <span className="hidden md:inline">Spooky Glow</span>
          </button>

          {/* Sensitivity Slider */}
          <div className="hidden lg:flex items-center gap-2 bg-surface-container px-3 py-1 rounded-full border border-outline-variant/20 text-xs">
            <span className="material-symbols-outlined text-outline text-sm">tune</span>
            <input
              type="range"
              min={20}
              max={150}
              value={sensitivity}
              onChange={(e) => handleSensitivityChange(Number(e.target.value))}
              className="w-16 h-1 accent-primary cursor-pointer"
              aria-label="Visualizer sensitivity"
            />
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setIsVisualizerOpen(false)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all border border-outline-variant/30"
            title="Collapse visualizer drawer"
            aria-label="Collapse visualizer drawer"
          >
            <span className="material-symbols-outlined text-base">expand_more</span>
            <span>Collapse</span>
          </button>
        </div>
      </div>

      {/* Main Drawer Body: Visualizer on Left, Queue on Right */}
      <div className="flex-1 w-full flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left: Audio Visualizer Canvas */}
        <div className="flex-1 relative flex flex-col bg-surface-container-lowest overflow-hidden min-h-[300px]">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Floating Now Playing Track Card on Canvas */}
          {currentTrack && (
            <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-md bg-surface-container-low/90 backdrop-blur-md p-3.5 rounded-2xl border border-outline-variant/30 flex items-center gap-3.5 shadow-xl">
              {currentTrack.pictureDataUrl ? (
                <img
                  src={currentTrack.pictureDataUrl}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-outline-variant/20 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-primary border border-outline-variant/20">
                  <span className="material-symbols-outlined text-2xl">graphic_eq</span>
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-headline font-bold text-sm text-on-surface truncate">
                  {currentTrack.title}
                </span>
                <span className="text-xs text-on-surface-variant font-medium truncate">
                  {currentTrack.artist} {currentTrack.album ? `\u2022 ${currentTrack.album}` : ''}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-mono text-[10px] uppercase font-semibold">
                    {currentTrack.format}
                  </span>
                  <span className="text-[11px] font-mono text-outline">
                    {formatDuration(playbackState.currentTimeSeconds)} / {formatDuration(currentTrack.durationSeconds)}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-secondary ml-auto">
                    {playbackState.isPlaying ? 'PLAYING' : 'PAUSED'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Current Song Queue Panel */}
        <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-outline-variant/20 bg-surface-container-lowest/80 flex flex-col h-[280px] md:h-full shrink-0">
          {/* Queue Header */}
          <div className="p-3.5 border-b border-outline-variant/20 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">queue_music</span>
              <h2 className="font-headline font-bold text-xs sm:text-sm text-on-surface">
                Up Next Queue
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary font-mono text-[11px] font-semibold">
                {queue.length}
              </span>
            </div>

            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-[11px] font-medium text-outline hover:text-error transition-colors"
                title="Clear all queued tracks"
              >
                Clear Queue
              </button>
            )}
          </div>

          {/* Queue Track List */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {/* Highlighted Currently Playing Track */}
            {currentTrack && (
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-base text-primary animate-pulse shrink-0">
                    volume_up
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-primary truncate">
                      {currentTrack.title}
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {currentTrack.artist}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold shrink-0">
                  Now Playing
                </span>
              </div>
            )}

            {/* Upcoming Queue Items */}
            {queue.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2 text-outline">
                <span className="material-symbols-outlined text-3xl">playlist_play</span>
                <p className="text-xs font-medium text-on-surface-variant">Queue is empty</p>
                <p className="text-[11px] text-outline max-w-[200px]">
                  Playing tracks from Library or Playlists automatically populates upcoming songs.
                </p>
                <button
                  onClick={() => {
                    setIsVisualizerOpen(false);
                    setRoute('library');
                  }}
                  className="mt-2 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-primary/30 transition-colors"
                >
                  Browse Library
                </button>
              </div>
            ) : (
              queue.map((item, idx) => {
                const trk = tracks.find((t) => t.id === item.trackId);
                if (!trk) return null;

                return (
                  <div
                    key={item.queueId}
                    className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container/80 border border-outline-variant/15 flex items-center justify-between gap-2.5 transition-colors group"
                  >
                    <div
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      onClick={() => playQueueItem(item.queueId)}
                      title={`Play "${trk.title}" now`}
                    >
                      <span className="font-mono text-[11px] text-outline w-4 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-on-surface group-hover:text-primary transition-colors truncate">
                          {trk.title}
                        </span>
                        <span className="text-[10px] text-on-surface-variant truncate">
                          {trk.artist} &bull; {formatDuration(trk.durationSeconds)}
                        </span>
                      </div>
                    </div>

                    {/* Reorder and Remove Actions */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                        <button
                          onClick={() => moveQueueItem(idx, idx - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                          title="Move Up"
                          aria-label={`Move ${trk.title} up in queue`}
                        >
                          <span className="material-symbols-outlined text-sm">arrow_upward</span>
                        </button>
                      )}
                      {idx < queue.length - 1 && (
                        <button
                          onClick={() => moveQueueItem(idx, idx + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                          title="Move Down"
                          aria-label={`Move ${trk.title} down in queue`}
                        >
                          <span className="material-symbols-outlined text-sm">arrow_downward</span>
                        </button>
                      )}
                      <button
                        onClick={() => removeFromQueue(item.queueId)}
                        className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-error"
                        title="Remove from queue"
                        aria-label={`Remove ${trk.title} from queue`}
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
