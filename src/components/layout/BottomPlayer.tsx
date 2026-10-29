import React from 'react';
import { useApp } from '../../context/AppContext';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const BottomPlayer: React.FC = () => {
  const {
    tracks,
    playbackState,
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
  } = useApp();

  const currentTrack = tracks.find((t) => t.id === playbackState.currentTrackId) || tracks[0];

  return (
    <footer
      role="region"
      aria-label="Audio Playback Controls"
      className="fixed bottom-0 left-0 right-0 h-[76px] bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 z-50 flex items-center justify-between px-space-md sm:px-space-lg shadow-lg"
    >
      {/* Left: Track Information & Thumbnail */}
      <div className="flex items-center gap-3 min-w-[200px] max-w-[280px] sm:max-w-[340px]">
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
          <span className="material-symbols-outlined text-2xl text-primary group-hover:scale-110 transition-transform">
            graphic_eq
          </span>
          {playbackState.isPlaying && (
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-secondary animate-ping" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate tracking-tight text-on-surface">
              {currentTrack ? currentTrack.title : 'No Track Selected'}
            </span>
            {currentTrack?.format === 'flac' && (
              <span className="px-1 py-0.2 rounded bg-secondary/15 text-secondary font-mono text-[9px] font-bold uppercase shrink-0">
                FLAC
              </span>
            )}
          </div>
          <span className="text-xs text-on-surface-variant truncate">
            {currentTrack ? currentTrack.artist : 'Select a track to start playback'}
          </span>
        </div>
      </div>

      {/* Center: Playback Transport Controls & Seekbar */}
      <div className="flex flex-col items-center gap-1 flex-1 max-w-xl px-2">
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
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Previous track"
            title="Previous track"
          >
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={togglePlayPause}
            className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md"
            aria-label={playbackState.isPlaying ? 'Pause playback' : 'Start playback'}
            title={playbackState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            <span className="material-symbols-outlined text-2xl font-bold">
              {playbackState.isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
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
              max={playbackState.durationSeconds || 100}
              value={playbackState.currentTimeSeconds}
              onChange={(e) => seekTrack(Number(e.target.value))}
              aria-label="Seek position in track"
              className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <span className="w-9">{formatTime(playbackState.durationSeconds)}</span>
        </div>
      </div>

      {/* Right: Audio Levels, Volume & Queue */}
      <div className="hidden md:flex items-center gap-3 min-w-[200px] justify-end">
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
          className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
          title="Open Current Queue"
          aria-label="Open Playback Queue"
        >
          <span className="material-symbols-outlined text-xl">playlist_play</span>
        </button>
      </div>
    </footer>
  );
};
