import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const AddToPlaylistModal: React.FC = () => {
  const {
    playlistModalTrack,
    setPlaylistModalTrack,
    playlists,
    createPlaylist,
    addTrackToPlaylist,
  } = useApp();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  if (!playlistModalTrack) return null;

  const handleAddToExisting = async (playlistId: string) => {
    await addTrackToPlaylist(playlistId, playlistModalTrack.id);
    setPlaylistModalTrack(null);
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;

    const newPl = await createPlaylist(trimmed);
    await addTrackToPlaylist(newPl.id, playlistModalTrack.id);
    setNewPlaylistName('');
    setShowCreateInput(false);
    setPlaylistModalTrack(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="playlist-modal-title"
      onClick={() => setPlaylistModalTrack(null)}
    >
      <div
        className="w-full max-w-md bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 id="playlist-modal-title" className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">playlist_add</span>
              Add to Playlist
            </h2>
            <p className="text-xs text-on-surface-variant truncate max-w-xs mt-0.5">
              {playlistModalTrack.title} &bull; {playlistModalTrack.artist}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPlaylistModalTrack(null)}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Existing Playlists List */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <div className="text-center py-6 text-on-surface-variant text-sm">
              <p>No playlists yet.</p>
              <p className="text-xs text-on-surface-variant/70 mt-1">
                Create your first playlist below to get started.
              </p>
            </div>
          ) : (
            playlists.map((pl) => {
              const alreadyIn = pl.trackIds.includes(playlistModalTrack.id);
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => handleAddToExisting(pl.id)}
                  disabled={alreadyIn}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all ${
                    alreadyIn
                      ? 'border-outline-variant/20 bg-surface-container/50 opacity-60 cursor-not-allowed'
                      : 'border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-primary text-lg shrink-0">
                      {pl.icon || 'queue_music'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{pl.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {pl.trackIds.length} {pl.trackIds.length === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                  </div>
                  {alreadyIn ? (
                    <span className="text-xs text-primary font-medium flex items-center gap-1 shrink-0">
                      <span className="material-symbols-outlined text-sm">check</span>
                      Added
                    </span>
                  ) : (
                    <span className="text-xs text-on-surface-variant group-hover:text-primary">
                      Add
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Create New Playlist Form */}
        {showCreateInput ? (
          <form onSubmit={handleCreateAndAdd} className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
            <label htmlFor="modal-pl-name" className="text-xs font-medium text-on-surface-variant">
              New Playlist Name
            </label>
            <div className="flex gap-2">
              <input
                id="modal-pl-name"
                type="text"
                autoFocus
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name..."
                className="flex-1 bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-3 py-2 bg-primary text-on-primary font-medium text-sm rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                Create & Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateInput(false);
                  setNewPlaylistName('');
                }}
                className="px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreateInput(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-outline-variant/40 hover:border-primary text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create New Playlist
          </button>
        )}
      </div>
    </div>
  );
};
