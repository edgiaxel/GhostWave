import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const LibraryScreen: React.FC = () => {
  const {
    tracks,
    playbackState,
    playTrack,
    searchQuery,
    isScanning,
    scanProgress,
    setActiveModal,
  } = useApp();

  const [activeFilterPill, setActiveFilterPill] = useState<'all' | 'flac' | 'mp3' | 'missing_art'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Featured track for the hero card (defaults to track 3 or first track)
  const featuredTrack = tracks[2] || tracks[0];

  const filteredTracks = tracks.filter((t) => {
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.album.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilterPill === 'flac') return t.format === 'flac';
    if (activeFilterPill === 'mp3') return t.format === 'mp3';
    if (activeFilterPill === 'missing_art') return !t.hasEmbeddedPicture;
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      {/* Hero Featured Card (Inspired by Modern Player Layouts) */}
      <section className="relative rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-outline-variant/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden shadow-sm">
        {/* Ambient Spooky Glow */}
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-3 z-10 max-w-xl text-center md:text-left items-center md:items-start">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-semibold tracking-wide">
              Featured Album
            </span>
            <span className="text-xs text-outline font-mono">
              {tracks.length} local tracks indexed
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
              {featuredTrack ? featuredTrack.title : 'Ghost In The Machine'}
            </h1>
            <p className="text-sm text-on-surface-variant font-medium">
              {featuredTrack ? featuredTrack.artist : 'The Police'}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => featuredTrack && playTrack(featuredTrack.id)}
              className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              <span>Play Now</span>
            </button>
            <button
              onClick={() => setActiveModal('scan-folder')}
              className="px-4 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-medium transition-colors border border-outline-variant/30 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm text-tertiary">folder_open</span>
              <span>Scan Folder</span>
            </button>
          </div>
        </div>

        {/* Featured Artwork Display */}
        <div className="relative z-10 shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center shadow-lg overflow-hidden group">
          <span className="material-symbols-outlined text-6xl text-primary/70 group-hover:scale-110 transition-transform">
            graphic_eq
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-2.5">
            <span className="text-[11px] font-mono text-white/90 truncate">
              {featuredTrack?.album}
            </span>
          </div>
        </div>
      </section>

      {/* Progress banner during active scanning */}
      {isScanning && (
        <div className="p-3.5 rounded-xl bg-surface-container border border-primary/30 flex flex-col gap-1.5 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between text-xs text-on-surface font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
              <span>Scanning audio files...</span>
            </span>
            <span className="font-mono text-primary font-semibold">{scanProgress}%</span>
          </div>
          <div className="w-full h-1 bg-surface-container-lowest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Clean Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilterPill('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilterPill === 'all'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Tracks
          </button>
          <button
            onClick={() => setActiveFilterPill('flac')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilterPill === 'flac'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Lossless FLAC
          </button>
          <button
            onClick={() => setActiveFilterPill('mp3')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilterPill === 'mp3'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            MP3
          </button>
          <button
            onClick={() => setActiveFilterPill('missing_art')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              activeFilterPill === 'missing_art'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'bg-surface-container text-tertiary hover:bg-surface-container-high'
            }`}
          >
            Missing Art
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/20">
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-all ${
              viewMode === 'table'
                ? 'bg-surface-bright text-primary font-semibold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
            aria-label="Table view"
          >
            <span className="material-symbols-outlined text-sm">table_rows</span>
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-all ${
              viewMode === 'grid'
                ? 'bg-surface-bright text-primary font-semibold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
            aria-label="Grid view"
          >
            <span className="material-symbols-outlined text-sm">grid_view</span>
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Main Tracks Display */}
      {filteredTracks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col items-center justify-center text-center gap-3">
          <span className="material-symbols-outlined text-4xl text-outline">music_off</span>
          <h2 className="font-headline font-semibold text-base text-on-surface">No tracks found</h2>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Try adjusting your search query or importing audio files.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs" aria-label="Audio Tracks Table">
            <thead className="bg-surface-container/60 text-outline text-[11px] font-medium border-b border-outline-variant/20">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 hidden md:table-cell">Album</th>
                <th className="py-3 px-4 hidden sm:table-cell">Format</th>
                <th className="py-3 px-4 text-right">Time</th>
                <th className="py-3 px-4 w-16 text-center">Play</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredTracks.map((track, idx) => {
                const isPlaying = playbackState.currentTrackId === track.id && playbackState.isPlaying;
                return (
                  <tr
                    key={track.id}
                    onClick={() => playTrack(track.id)}
                    className={`hover:bg-surface-container/50 transition-colors cursor-pointer ${
                      isPlaying ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-outline">
                      {isPlaying ? (
                        <span className="material-symbols-outlined text-sm text-primary animate-pulse">
                          volume_up
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`font-medium truncate ${
                            isPlaying ? 'text-primary font-semibold' : 'text-on-surface'
                          }`}
                        >
                          {track.title}
                        </span>
                        <span className="text-[11px] text-on-surface-variant truncate">
                          {track.artist}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell text-on-surface-variant truncate max-w-[200px]">
                      {track.album}
                    </td>
                    <td className="py-3.5 px-4 hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono text-[10px] uppercase font-semibold">
                        {track.format}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-outline">
                      {Math.floor(track.durationSeconds / 60)}:
                      {(track.durationSeconds % 60).toString().padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack(track.id);
                        }}
                        className="w-7 h-7 rounded-full hover:bg-surface-container text-outline hover:text-primary flex items-center justify-center transition-colors mx-auto"
                        aria-label={`Play ${track.title}`}
                        title={`Play ${track.title}`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid of Album Cards (Inspired by Reference Images) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              onClick={() => playTrack(track.id)}
              className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 transition-all cursor-pointer flex flex-col gap-2.5 group"
            >
              <div className="w-full aspect-square rounded-xl bg-surface-container flex items-center justify-center relative overflow-hidden shadow-sm">
                <span className="material-symbols-outlined text-4xl text-outline/60 group-hover:scale-110 transition-transform">
                  album
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playTrack(track.id);
                  }}
                  className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  aria-label={`Play ${track.title}`}
                >
                  <span className="material-symbols-outlined text-lg font-bold">play_arrow</span>
                </button>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-on-surface truncate">{track.title}</span>
                <span className="text-[11px] text-on-surface-variant truncate">{track.artist}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
