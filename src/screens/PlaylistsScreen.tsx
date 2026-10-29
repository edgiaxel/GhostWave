import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const PlaylistsScreen: React.FC = () => {
  const { playlists, tracks, playTrack, addToast } = useApp();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(playlists[0]?.id || 'pl-1');
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const currentPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];
  const playlistTracks = tracks.filter((t) => currentPlaylist?.trackIds.includes(t.id));
  const totalDurationSeconds = playlistTracks.reduce((acc, t) => acc + t.durationSeconds, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    addToast({
      title: 'Playlist Created',
      message: `Created "${newPlaylistName.trim()}".`,
      type: 'success',
    });
    setNewPlaylistName('');
    setIsCreating(false);
  };

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0].id);
      addToast({
        title: 'Playing Playlist',
        message: `Now playing "${currentPlaylist?.name}".`,
        type: 'info',
      });
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      {/* Streamlined Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            Playlists & Smart Crates
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {playlists.length} playlists available
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>New Playlist</span>
        </button>
      </div>

      {/* Creation Input */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="p-3 rounded-2xl bg-surface-container border border-primary/30 flex items-center gap-3 animate-in fade-in"
        >
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Playlist name..."
            autoFocus
            className="flex-1 bg-surface-container-low text-on-surface text-xs px-3.5 py-2 rounded-xl outline-none border border-transparent focus:border-primary/50"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-3 py-2 text-xs text-outline hover:text-on-surface"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Modern 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Playlists List */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          {playlists.map((pl) => {
            const isSelected = pl.id === currentPlaylist?.id;
            return (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylistId(pl.id)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSelectedPlaylistId(pl.id);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-primary/10 border-primary/40 shadow-sm'
                    : 'bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined text-xl">
                      {pl.icon || 'queue_music'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-on-surface truncate">{pl.name}</span>
                    <span className="text-[11px] text-outline font-mono">
                      {pl.trackIds.length} tracks
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Playlist Details */}
        <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          {currentPlaylist && (
            <>
              <div className="flex items-center justify-between gap-4 border-b border-outline-variant/15 pb-4">
                <div className="flex flex-col">
                  <h2 className="font-headline font-bold text-lg text-on-surface">
                    {currentPlaylist.name}
                  </h2>
                  <span className="text-xs text-outline font-mono mt-0.5">
                    {playlistTracks.length} tracks • {Math.floor(totalDurationSeconds / 60)}m {totalDurationSeconds % 60}s
                  </span>
                </div>

                <button
                  onClick={handlePlayAll}
                  disabled={playlistTracks.length === 0}
                  className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  <span>Play</span>
                </button>
              </div>

              {/* Tracks in Playlist */}
              <div className="flex flex-col divide-y divide-outline-variant/10">
                {playlistTracks.map((trk, idx) => (
                  <div
                    key={trk.id}
                    className="py-3 px-2 flex items-center justify-between hover:bg-surface-container/50 rounded-xl transition-colors cursor-pointer"
                    onClick={() => playTrack(trk.id)}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-mono text-xs text-outline w-4 text-center">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-on-surface truncate">
                          {trk.title}
                        </span>
                        <span className="text-[11px] text-on-surface-variant truncate">
                          {trk.artist}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-outline">
                        {Math.floor(trk.durationSeconds / 60)}:
                        {(trk.durationSeconds % 60).toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack(trk.id);
                        }}
                        className="w-7 h-7 rounded-full hover:bg-surface-container text-outline hover:text-primary flex items-center justify-center transition-colors"
                        aria-label={`Play ${trk.title}`}
                      >
                        <span className="material-symbols-outlined text-base">play_arrow</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
