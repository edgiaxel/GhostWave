import React from 'react';
import { useApp } from '../../context/AppContext';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const BottomPlayer: React.FC = () => {
  const {
    tracks,
    playbackState,
    queue,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setRoute,
    setActiveModal,
    layout,
    updateLayout,
    isVisualizerOpen,
    toggleVisualizer,
  } = useApp();

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = layout.bottomPlayerHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Dragging up (negative clientY delta) increases height
      const delta = startY - moveEvent.clientY;
      updateLayout({ bottomPlayerHeight: startH + delta });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      updateLayout({ bottomPlayerHeight: layout.bottomPlayerHeight + 2 });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateLayout({ bottomPlayerHeight: layout.bottomPlayerHeight - 2 });
    }
  };

  const currentTrack = tracks.find((t) => t.id === playbackState.currentTrackId) || null;

  return (
    <footer
      role="region"
      aria-label="Audio Playback Controls"
      style={{ height: `${layout.bottomPlayerHeight}px` }}
      className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 z-50 flex items-center justify-between px-space-md sm:px-space-lg shadow-2xl select-none"
    >
      {/* Resize Handle: Top Border */}
      <div
        onMouseDown={handleResizeStart}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize Bottom Player Height"
        aria-valuenow={layout.bottomPlayerHeight}
        aria-valuemin={68}
        aria-valuemax={120}
        title="Drag to resize bottom player height (68px - 120px)"
        className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-primary/50 active:bg-primary transition-colors flex items-center justify-center group focus:outline-none focus:bg-primary/40 z-50"
      >
        <div className="w-8 h-0.5 rounded-full bg-outline-variant/30 group-hover:bg-primary transition-colors" />
      </div>
      {/* Left: Track Information & Thumbnail */}
      <div className="flex items-center gap-3 w-[200px] sm:w-[260px] md:w-[300px] max-w-[320px] shrink-0 min-w-0 z-10">
        <div
          className="w-12 h-12 rounded bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/30 overflow-hidden relative group cursor-pointer"
          onClick={() => setRoute('audio-visualizer')}
          title="Open Visualizer for current track"
          tabIndex={0}
          role="button"
          onKeyDown={(e) => {
            if (e.key === 'Enter') setRoute('audio-visualizer');
          }}
          aria-label="View track in Audio Visualizer"
        >
          {currentTrack?.pictureDataUrl ? (
            <img
              src={currentTrack.pictureDataUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />
          ) : (
            <span className="material-symbols-outlined text-2xl text-primary group-hover:scale-110 transition-transform">
              graphic_eq
            </span>
          )}
          {playbackState.isPlaying && (
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-secondary animate-ping" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate tracking-tight text-on-surface">
              {currentTrack ? currentTrack.title : 'No track selected'}
            </span>
            {currentTrack?.format && (
              <span className="px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono text-[9px] font-bold uppercase shrink-0">
                {currentTrack.format}
              </span>
            )}
          </div>
          <span className="text-xs text-on-surface-variant truncate">
            {currentTrack ? currentTrack.artist : 'Select a track to start playback'}
          </span>
        </div>
      </div>

      {/* Center: Playback Transport Controls & Seekbar */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 w-full max-w-xs sm:max-w-md md:max-w-xl px-2 z-20 pointer-events-auto">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Shuffle Toggle */}
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded transition-colors ${
              playbackState.shuffle
                ? 'text-primary'
                : 'text-outline hover:text-on-surface'
            }`}
            aria-label={playbackState.shuffle ? 'Disable shuffle' : 'Enable shuffle'}
            title={playbackState.shuffle ? 'Shuffle is ON' : 'Shuffle is OFF'}
          >
            <span className="material-symbols-outlined text-base">shuffle</span>
          </button>

          {/* Previous Track */}
          <button
            onClick={prevTrack}
            disabled={tracks.length === 0}
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40"
            aria-label="Previous track"
            title="Previous track"
          >
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={togglePlayPause}
            disabled={tracks.length === 0 && !currentTrack}
            className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50"
            aria-label={playbackState.isPlaying ? 'Pause playback' : 'Start playback'}
            title={playbackState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            <span className="material-symbols-outlined text-2xl font-bold">
              {playbackState.status === 'loading'
                ? 'sync'
                : playbackState.isPlaying
                ? 'pause'
                : 'play_arrow'}
            </span>
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            disabled={tracks.length === 0}
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40"
            aria-label="Next track"
            title="Next track"
          >
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>

          {/* Repeat Toggle */}
          <button
            onClick={toggleRepeat}
            className={`p-1.5 rounded transition-colors ${
              playbackState.repeatMode !== 'off'
                ? 'text-primary'
                : 'text-outline hover:text-on-surface'
            }`}
            aria-label={`Repeat mode: ${playbackState.repeatMode}`}
            title={`Repeat mode: ${playbackState.repeatMode}`}
          >
            <span className="material-symbols-outlined text-base">
              {playbackState.repeatMode === 'one' ? 'repeat_one' : 'repeat'}
            </span>
          </button>
        </div>

        {/* Seekbar & Duration */}
        <div className="w-full flex items-center gap-2 text-xs font-mono text-outline">
          <span className="w-9 text-right">{formatTime(playbackState.currentTimeSeconds)}</span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={playbackState.durationSeconds > 0 ? playbackState.durationSeconds : 100}
              value={Math.min(playbackState.currentTimeSeconds, playbackState.durationSeconds || 100)}
              onChange={(e) => seekTrack(Number(e.target.value))}
              disabled={!currentTrack}
              aria-label="Seek position in track"
              className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-40"
            />
          </div>
          <span className="w-9">{formatTime(playbackState.durationSeconds)}</span>
        </div>
      </div>

      {/* Right: Audio Levels, Volume & Queue */}
      <div className="hidden md:flex items-center gap-3 w-[200px] sm:w-[260px] md:w-[300px] max-w-[320px] shrink-0 justify-end z-10">
        {/* Visualizer Shortcut */}
        <button
          onClick={() => setRoute('audio-visualizer')}
          className="p-1.5 text-on-surface-variant hover:text-primary transition-colors"
          title="Switch to Audio Visualizer Stage"
          aria-label="Open Visualizer"
        >
          <span className="material-symbols-outlined text-xl">equalizer</span>
        </button>

        {/* Volume Mute & Slider */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label={playbackState.isMuted ? 'Unmute volume' : 'Mute volume'}
            title={playbackState.isMuted ? 'Unmute' : 'Mute'}
          >
            <span className="material-symbols-outlined text-lg">
              {playbackState.isMuted || playbackState.volume === 0
                ? 'volume_off'
                : playbackState.volume < 0.5
                ? 'volume_down'
                : 'volume_up'}
            </span>
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={playbackState.isMuted ? 0 : playbackState.volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Adjust audio volume"
            className="w-20 h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Queue Drawer Button */}
        <button
          onClick={() => setActiveModal('queue-drawer')}
          className="relative p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
          title="Open Current Queue"
          aria-label="Open Playback Queue"
        >
          <span className="material-symbols-outlined text-xl">playlist_play</span>
          {queue.length > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-primary text-on-primary text-[10px] font-bold font-mono">
              {queue.length}
            </span>
          )}
        </button>

        {/* Slide-Up Visualizer & Queue Drawer Toggle Arrow */}
        <button
          onClick={toggleVisualizer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm border ${
            isVisualizerOpen
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border-outline-variant/30'
          }`}
          title={isVisualizerOpen ? 'Collapse Visualizer & Queue' : 'Expand Visualizer & Queue'}
          aria-label={isVisualizerOpen ? 'Collapse Visualizer & Queue' : 'Expand Visualizer & Queue'}
        >
          <span className="material-symbols-outlined text-base">
            {isVisualizerOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
          </span>
          <span className="hidden lg:inline">
            {isVisualizerOpen ? 'Collapse' : 'Visualizer & Queue'}
          </span>
          {queue.length > 0 && !isVisualizerOpen && (
            <span className="px-1.5 py-0.2 rounded-full bg-secondary text-on-secondary font-mono text-[10px]">
              {queue.length}
            </span>
          )}
        </button>
      </div>
    </footer>
  );
};
