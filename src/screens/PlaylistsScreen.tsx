import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Playlist, Track } from '../types';

const PLAYLIST_ICONS = [
  'queue_music',
  'library_music',
  'album',
  'favorite',
  'electric_bolt',
  'nightlife',
  'dark_mode',
  'graphic_eq',
];

const ACCENT_COLORS = [
  { id: 'witch-violet', name: 'Witch Violet', bg: 'bg-[#9d4edd]', ring: 'ring-[#9d4edd]' },
  { id: 'toxic-slime', name: 'Toxic Slime', bg: 'bg-[#00f59b]', ring: 'ring-[#00f59b]' },
  { id: 'pumpkin-flare', name: 'Pumpkin Flare', bg: 'bg-[#ff7b00]', ring: 'ring-[#ff7b00]' },
  { id: 'blood-crimson', name: 'Blood Crimson', bg: 'bg-[#e63946]', ring: 'ring-[#e63946]' },
  { id: 'phantom-cyan', name: 'Phantom Cyan', bg: 'bg-[#00f0ff]', ring: 'ring-[#00f0ff]' },
];

export const PlaylistsScreen: React.FC = () => {
  const {
    playlists,
    selectedPlaylistId,
    setSelectedPlaylistId,
    tracks,
    playbackState,
    playPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    setRoute,
  } = useApp();

  // Dialog States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);

  // Form Fields for Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'queue_music',
    accentColor: 'witch-violet',
  });

  const activePlaylist =
    playlists.find((p) => p.id === selectedPlaylistId) ||
    playlists[0] ||
    null;

  // Safe track resolution: resolve track objects, preserving references safely
  const resolvedTracks: { track: Track | null; trackId: string }[] = (
    activePlaylist?.trackIds || []
  ).map((id) => ({
    trackId: id,
    track: tracks.find((t) => t.id === id) || null,
  }));

  const validTracks = resolvedTracks
    .map((r) => r.track)
    .filter((t): t is Track => t !== null);

  const totalDurationSeconds = validTracks.reduce((acc, t) => acc + t.durationSeconds, 0);

  // Handlers
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'queue_music',
      accentColor: 'witch-violet',
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = () => {
    if (!activePlaylist) return;
    setFormData({
      name: activePlaylist.name,
      description: activePlaylist.description || '',
      icon: activePlaylist.icon || 'queue_music',
      accentColor: activePlaylist.accentColor || 'witch-violet',
    });
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await createPlaylist(
      formData.name.trim(),
      formData.description.trim(),
      formData.icon,
      formData.accentColor
    );
    setShowCreateModal(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaylist || !formData.name.trim()) return;

    await updatePlaylist(activePlaylist.id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      icon: formData.icon,
      accentColor: formData.accentColor,
    });
    setShowEditModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!playlistToDelete) return;
    await deletePlaylist(playlistToDelete.id);
    setPlaylistToDelete(null);
  };

  const handleMoveUp = async (index: number) => {
    if (!activePlaylist || index <= 0) return;
    await reorderPlaylistTracks(activePlaylist.id, index, index - 1);
  };

  const handleMoveDown = async (index: number) => {
    if (!activePlaylist || index >= activePlaylist.trackIds.length - 1) return;
    await reorderPlaylistTracks(activePlaylist.id, index, index + 1);
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      {/* Screen Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            Playlists & Smart Crates
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {playlists.length} saved playlist{playlists.length === 1 ? '' : 's'} in local storage
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>New Playlist</span>
        </button>
      </div>

      {/* 2-Column Responsive Layout */}
      {playlists.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col items-center justify-center text-center gap-3">
          <span className="material-symbols-outlined text-5xl text-outline">queue_music</span>
          <h2 className="font-headline font-semibold text-lg text-on-surface">No playlists yet</h2>
          <p className="text-xs text-on-surface-variant max-w-md">
            Organize your audio library into custom playlists. Add tracks directly from the library or create a new crate here.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Create Your First Playlist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Playlist Selector */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            <h2 className="text-xs font-semibold text-outline uppercase tracking-wider px-1">
              Your Crates ({playlists.length})
            </h2>
            <div className="flex flex-col gap-2">
              {playlists.map((pl) => {
                const isSelected = activePlaylist?.id === pl.id;
                return (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedPlaylistId(pl.id);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                      isSelected
                        ? 'bg-primary/10 border-primary/50 shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-primary border border-outline-variant/20">
                        <span className="material-symbols-outlined text-xl">
                          {pl.icon || 'queue_music'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                          {pl.name}
                        </span>
                        <span className="text-[11px] text-outline font-mono truncate">
                          {pl.trackIds.length} track{pl.trackIds.length === 1 ? '' : 's'}
                          {pl.description ? ` \u2022 ${pl.description}` : ''}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-base shrink-0">
                        chevron_right
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Playlist Details & Track List */}
          <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-sm">
            {activePlaylist && (
              <>
                {/* Playlist Banner Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/15 pb-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 text-primary border border-outline-variant/30 shadow-md">
                      <span className="material-symbols-outlined text-3xl">
                        {activePlaylist.icon || 'queue_music'}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                          Playlist
                        </span>
                        <span className="text-xs text-outline font-mono">
                          {validTracks.length} tracks &bull; {Math.floor(totalDurationSeconds / 60)}m {totalDurationSeconds % 60}s
                        </span>
                      </div>
                      <h2 className="font-headline font-bold text-xl sm:text-2xl text-on-surface truncate mt-1">
                        {activePlaylist.name}
                      </h2>
                      {activePlaylist.description && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                          {activePlaylist.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      onClick={() => playPlaylist(activePlaylist.id)}
                      disabled={validTracks.length === 0}
                      className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-base">play_arrow</span>
                      <span>Play All</span>
                    </button>
                    <button
                      onClick={handleOpenEdit}
                      className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/20"
                      title="Edit playlist name and details"
                      aria-label="Edit playlist"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => setPlaylistToDelete(activePlaylist)}
                      className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-error transition-colors border border-outline-variant/20"
                      title="Delete playlist"
                      aria-label="Delete playlist"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                {/* Playlist Tracks Table */}
                {activePlaylist.trackIds.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-outline">playlist_add</span>
                    <p className="text-sm font-medium text-on-surface">This playlist is currently empty</p>
                    <p className="text-xs text-on-surface-variant max-w-sm">
                      Go to your library to browse and add audio tracks to &ldquo;{activePlaylist.name}&rdquo;.
                    </p>
                    <button
                      onClick={() => setRoute('library')}
                      className="mt-2 px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-primary/30 transition-colors"
                    >
                      Browse Library
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-outline-variant/10">
                    {resolvedTracks.map((item, idx) => {
                      const trk = item.track;
                      if (!trk) {
                        // Preserved reference to a track removed from library
                        return (
                          <div
                            key={item.trackId}
                            className="py-3 px-2 flex items-center justify-between text-outline text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs w-5 text-center">{idx + 1}</span>
                              <span className="italic">Track reference missing from library index</span>
                            </div>
                            <button
                              onClick={() => removeTrackFromPlaylist(activePlaylist.id, item.trackId)}
                              className="text-error hover:underline text-xs p-1"
                              title="Remove missing entry"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      }

                      const isPlaying = playbackState.currentTrackId === trk.id && playbackState.isPlaying;

                      return (
                        <div
                          key={trk.id}
                          className={`py-3 px-2.5 flex items-center justify-between hover:bg-surface-container/50 rounded-xl transition-colors group ${
                            isPlaying ? 'bg-primary/5' : ''
                          }`}
                        >
                          {/* Track info & play button */}
                          <div
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            onClick={() => playPlaylist(activePlaylist.id, trk.id)}
                          >
                            <span className="font-mono text-xs text-outline w-5 text-center shrink-0">
                              {isPlaying ? (
                                <span className="material-symbols-outlined text-sm text-primary animate-pulse">
                                  volume_up
                                </span>
                              ) : (
                                idx + 1
                              )}
                            </span>

                            {trk.pictureDataUrl ? (
                              <img
                                src={trk.pictureDataUrl}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-outline-variant/20"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-outline">
                                <span className="material-symbols-outlined text-sm">music_note</span>
                              </div>
                            )}

                            <div className="flex flex-col min-w-0">
                              <span className={`text-xs font-semibold truncate ${isPlaying ? 'text-primary' : 'text-on-surface'}`}>
                                {trk.title}
                              </span>
                              <span className="text-[11px] text-on-surface-variant truncate">
                                {trk.artist} &bull; {trk.album}
                              </span>
                            </div>
                          </div>

                          {/* Track controls: Reorder, Play, and Remove */}
                          <div className="flex items-center gap-1.5 shrink-0 ml-3">
                            <span className="font-mono text-xs text-outline mr-2 hidden sm:inline">
                              {Math.floor(trk.durationSeconds / 60)}:
                              {(trk.durationSeconds % 60).toString().padStart(2, '0')}
                            </span>

                            {/* Reorder Up */}
                            <button
                              onClick={() => handleMoveUp(idx)}
                              disabled={idx === 0}
                              className="w-7 h-7 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface disabled:opacity-20 flex items-center justify-center transition-colors"
                              title="Move track up"
                              aria-label="Move track up"
                            >
                              <span className="material-symbols-outlined text-sm">arrow_upward</span>
                            </button>

                            {/* Reorder Down */}
                            <button
                              onClick={() => handleMoveDown(idx)}
                              disabled={idx === activePlaylist.trackIds.length - 1}
                              className="w-7 h-7 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface disabled:opacity-20 flex items-center justify-center transition-colors"
                              title="Move track down"
                              aria-label="Move track down"
                            >
                              <span className="material-symbols-outlined text-sm">arrow_downward</span>
                            </button>

                            {/* Play Item */}
                            <button
                              onClick={() => playPlaylist(activePlaylist.id, trk.id)}
                              className="w-7 h-7 rounded-full hover:bg-surface-container text-outline hover:text-primary flex items-center justify-center transition-colors"
                              aria-label={`Play ${trk.title}`}
                            >
                              <span className="material-symbols-outlined text-base">play_arrow</span>
                            </button>

                            {/* Remove from playlist */}
                            <button
                              onClick={() => removeTrackFromPlaylist(activePlaylist.id, trk.id)}
                              className="w-7 h-7 rounded-full hover:bg-surface-container text-outline hover:text-error flex items-center justify-center transition-colors"
                              title="Remove track from playlist"
                              aria-label={`Remove ${trk.title} from ${activePlaylist.name}`}
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-on-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 id="create-modal-title" className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">playlist_add</span>
                Create New Playlist
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="create-pl-name" className="text-xs font-semibold text-on-surface-variant">
                  Playlist Name <span className="text-primary">*</span>
                </label>
                <input
                  id="create-pl-name"
                  type="text"
                  required
                  autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Midnight Synths"
                  className="bg-surface-container border border-outline-variant/40 rounded-xl px-3.5 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="create-pl-desc" className="text-xs font-semibold text-on-surface-variant">
                  Description <span className="text-outline font-normal">(optional)</span>
                </label>
                <textarea
                  id="create-pl-desc"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Notes about this collection..."
                  className="bg-surface-container border border-outline-variant/40 rounded-xl px-3.5 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Icon Selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant">Playlist Icon</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {PLAYLIST_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        formData.icon === icon
                          ? 'bg-primary text-on-primary shadow-sm scale-105'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                      aria-label={`Select icon ${icon}`}
                    >
                      <span className="material-symbols-outlined text-lg">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant">Accent Color</span>
                <div className="flex items-center gap-3">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, accentColor: c.id }))}
                      className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
                        formData.accentColor === c.id ? `ring-2 ring-offset-2 ring-offset-surface ${c.ring} scale-110` : 'opacity-80 hover:opacity-100'
                      }`}
                      title={c.name}
                      aria-label={`Select color ${c.name}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim()}
                  className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-lg hover:opacity-90 disabled:opacity-40 transition-colors shadow-sm"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Playlist Modal */}
      {showEditModal && activePlaylist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-on-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 id="edit-modal-title" className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">edit</span>
                Edit Playlist Details
              </h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-pl-name" className="text-xs font-semibold text-on-surface-variant">
                  Playlist Name <span className="text-primary">*</span>
                </label>
                <input
                  id="edit-pl-name"
                  type="text"
                  required
                  autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-surface-container border border-outline-variant/40 rounded-xl px-3.5 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-pl-desc" className="text-xs font-semibold text-on-surface-variant">
                  Description <span className="text-outline font-normal">(optional)</span>
                </label>
                <textarea
                  id="edit-pl-desc"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="bg-surface-container border border-outline-variant/40 rounded-xl px-3.5 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Icon Selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant">Playlist Icon</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {PLAYLIST_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        formData.icon === icon
                          ? 'bg-primary text-on-primary shadow-sm scale-105'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                      aria-label={`Select icon ${icon}`}
                    >
                      <span className="material-symbols-outlined text-lg">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant">Accent Color</span>
                <div className="flex items-center gap-3">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, accentColor: c.id }))}
                      className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
                        formData.accentColor === c.id ? `ring-2 ring-offset-2 ring-offset-surface ${c.ring} scale-110` : 'opacity-80 hover:opacity-100'
                      }`}
                      title={c.name}
                      aria-label={`Select color ${c.name}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim()}
                  className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-lg hover:opacity-90 disabled:opacity-40 transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Playlist Confirmation Modal */}
      {playlistToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={() => setPlaylistToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-on-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-error/15 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <div className="flex flex-col gap-1">
              <h2 id="delete-dialog-title" className="text-base font-bold text-on-surface">
                Delete &ldquo;{playlistToDelete.name}&rdquo;?
              </h2>
              <p className="text-xs text-on-surface-variant">
                This will delete the saved playlist crate. Your original audio files in the library will not be deleted or modified.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPlaylistToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-error text-white font-semibold text-xs rounded-lg hover:bg-error/90 transition-colors shadow-sm"
              >
                Delete Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
