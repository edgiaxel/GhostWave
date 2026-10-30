import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

type SortField = 'title' | 'artist' | 'album' | 'duration' | 'addedAt' | 'trackNumber';
type SortDirection = 'asc' | 'desc';
type FilterPill = 'all' | 'flac' | 'mp3' | 'wav' | 'missing_art';

export const LibraryScreen: React.FC = () => {
  const {
    tracks,
    playbackState,
    playTrack,
    playFromLibrary,
    togglePlayPause,
    addToQueue,
    setPlaylistModalTrack,
    setEditTrackModal,
    searchQuery,
    setSearchQuery,
    isScanning,
    scanProgress,
    scanProgressPercent,
    rescanLibrary,
    removeTrackFromLibrary,
    setActiveModal,
  } = useApp();

  const [activeFilterPill, setActiveFilterPill] = useState<FilterPill>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Featured track for the hero card (uses currently playing or first track)
  const featuredTrack = tracks.find((t) => t.id === playbackState.currentTrackId) || tracks[0] || null;

  // S4.1: Deterministic offline search and filtering
  const filteredAndSortedTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = tracks.filter((t) => {
      // 1. Search filter across known local metadata fields
      if (q) {
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesArtist = t.artist.toLowerCase().includes(q);
        const matchesAlbum = t.album.toLowerCase().includes(q);
        const matchesAlbumArtist = t.albumArtist?.toLowerCase().includes(q) ?? false;
        const matchesFormat = t.format.toLowerCase().includes(q);
        const matchesFileName = t.fileName.toLowerCase().includes(q);
        const matchesGenre = t.genre?.some((g) => g.toLowerCase().includes(q)) ?? false;

        if (!matchesTitle && !matchesArtist && !matchesAlbum && !matchesAlbumArtist && !matchesFormat && !matchesFileName && !matchesGenre) {
          return false;
        }
      }

      // 2. Format / status filter
      if (activeFilterPill === 'flac') return t.format === 'flac';
      if (activeFilterPill === 'mp3') return t.format === 'mp3';
      if (activeFilterPill === 'wav') return t.format === 'wav';
      if (activeFilterPill === 'missing_art') return !t.hasEmbeddedPicture;

      return true;
    });

    // 3. Deterministic sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
          break;
        case 'artist':
          comparison = a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' });
          break;
        case 'album':
          comparison = a.album.localeCompare(b.album, undefined, { sensitivity: 'base' });
          break;
        case 'duration':
          comparison = a.durationSeconds - b.durationSeconds;
          break;
        case 'addedAt':
          comparison = a.addedAt - b.addedAt;
          break;
        case 'trackNumber':
          comparison = (a.trackNumber || 0) - (b.trackNumber || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tracks, searchQuery, activeFilterPill, sortField, sortDirection]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveFilterPill('all');
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      {/* Hero Featured Card */}
      <section className="relative rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-outline-variant/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden shadow-sm">
        {/* Ambient Spooky Glow */}
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-3 z-10 max-w-xl text-center md:text-left items-center md:items-start">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-semibold tracking-wide">
              {featuredTrack ? 'Featured Album' : 'Local Music Deck'}
            </span>
            <span className="text-xs text-outline font-mono">
              {tracks.length} local track{tracks.length === 1 ? '' : 's'} indexed
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
              {featuredTrack ? featuredTrack.title : 'GhostWave Library'}
            </h1>
            <p className="text-sm text-on-surface-variant font-medium">
              {featuredTrack
                ? `${featuredTrack.artist} \u2022 ${featuredTrack.album}`
                : 'Import your local audio files to start playing and organizing'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 mt-2 flex-wrap justify-center md:justify-start">
            {featuredTrack && (
              <button
                onClick={() => {
                  if (playbackState.currentTrackId === featuredTrack.id) {
                    togglePlayPause();
                  } else {
                    playFromLibrary(featuredTrack.id, tracks);
                  }
                }}
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  {playbackState.currentTrackId === featuredTrack.id && playbackState.isPlaying
                    ? 'pause'
                    : 'play_arrow'}
                </span>
                <span>
                  {playbackState.currentTrackId === featuredTrack.id && playbackState.isPlaying
                    ? 'Pause'
                    : 'Play Now'}
                </span>
              </button>
            )}
            <button
              onClick={() => setActiveModal('add-files')}
              className="px-4 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-medium transition-colors border border-outline-variant/30 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm text-primary">add</span>
              <span>Add Files</span>
            </button>
            <button
              onClick={() => setActiveModal('scan-folder')}
              className="px-4 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-medium transition-colors border border-outline-variant/30 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm text-tertiary">folder_open</span>
              <span>Scan Folder</span>
            </button>
            {tracks.length > 0 && (
              <button
                onClick={() => rescanLibrary()}
                disabled={isScanning}
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface transition-colors border border-outline-variant/30 flex items-center justify-center disabled:opacity-40"
                title="Rescan library files"
                aria-label="Rescan library files"
              >
                <span className={`material-symbols-outlined text-base ${isScanning ? 'animate-spin' : ''}`}>
                  sync
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Featured Artwork Display */}
        <div className="relative z-10 shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center shadow-lg overflow-hidden group">
          {featuredTrack?.pictureDataUrl ? (
            <img
              src={featuredTrack.pictureDataUrl}
              alt={featuredTrack.album || featuredTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <span className="material-symbols-outlined text-6xl text-primary/70 group-hover:scale-110 transition-transform">
              graphic_eq
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
            <span className="text-[11px] font-mono text-white/90 truncate">
              {featuredTrack?.album || 'Local Collection'}
            </span>
          </div>
        </div>
      </section>

      {/* Progress banner during active scanning */}
      {isScanning && (
        <div className="p-4 rounded-2xl bg-surface-container border border-primary/40 flex flex-col gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between text-xs text-on-surface font-medium">
            <span className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping shrink-0" />
              <span className="truncate">
                Scanning: <span className="font-mono text-outline">{scanProgress.currentFile || 'Verifying local index...'}</span>
              </span>
            </span>
            <span className="font-mono text-primary font-semibold ml-2 shrink-0">
              {scanProgressPercent}% ({scanProgress.scanned}/{scanProgress.total})
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${scanProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter Toolbar with Sorting and View Mode Controls */}
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
            All Tracks ({tracks.length})
          </button>
          <button
            onClick={() => setActiveFilterPill('flac')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilterPill === 'flac'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            FLAC
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
            onClick={() => setActiveFilterPill('wav')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilterPill === 'wav'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            WAV
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

        {/* Right Controls: Sort Dropdown & View Mode */}
        <div className="flex items-center gap-3">
          {/* S4.1 Sorting dropdown */}
          <div className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/20 text-xs">
            <span className="text-on-surface-variant font-medium">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent text-on-surface font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Sort library by field"
            >
              <option value="title" className="bg-surface-container text-on-surface">Title</option>
              <option value="artist" className="bg-surface-container text-on-surface">Artist</option>
              <option value="album" className="bg-surface-container text-on-surface">Album</option>
              <option value="duration" className="bg-surface-container text-on-surface">Duration</option>
              <option value="addedAt" className="bg-surface-container text-on-surface">Date Added</option>
              <option value="trackNumber" className="bg-surface-container text-on-surface">Track Number</option>
            </select>
            <button
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1 hover:text-primary transition-colors text-on-surface-variant"
              title={`Sorting ${sortDirection === 'asc' ? 'ascending' : 'descending'}. Click to reverse.`}
              aria-label={`Toggle sort direction, currently ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
            >
              <span className="material-symbols-outlined text-sm">
                {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
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
      </div>

      {/* Active Search & Filter Indicator Bar */}
      {(searchQuery || activeFilterPill !== 'all') && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-surface-container-high/60 border border-outline-variant/30 rounded-xl text-xs text-on-surface-variant">
          <div className="flex items-center gap-2 truncate">
            <span className="material-symbols-outlined text-primary text-base">filter_list</span>
            <span>
              Showing {filteredAndSortedTracks.length} of {tracks.length} tracks
              {searchQuery && (
                <>
                  {' '}matching <span className="font-semibold text-on-surface">&ldquo;{searchQuery}&rdquo;</span>
                </>
              )}
              {activeFilterPill !== 'all' && (
                <>
                  {' '}(filter: <span className="font-semibold text-on-surface">{activeFilterPill}</span>)
                </>
              )}
            </span>
          </div>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-primary hover:underline font-medium shrink-0 ml-3"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Clear filters
          </button>
        </div>
      )}

      {/* Main Tracks Display */}
      {filteredAndSortedTracks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col items-center justify-center text-center gap-3">
          <span className="material-symbols-outlined text-4xl text-outline">music_off</span>
          <h2 className="font-headline font-semibold text-base text-on-surface">No tracks found</h2>
          <p className="text-xs text-on-surface-variant max-w-sm">
            {tracks.length === 0
              ? 'Your library is empty. Select audio files or a local folder to begin.'
              : 'No tracks match your current filter or search criteria.'}
          </p>
          {tracks.length === 0 ? (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setActiveModal('add-files')}
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Select Audio Files</span>
              </button>
              <button
                onClick={() => setActiveModal('scan-folder')}
                className="px-5 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-medium transition-colors border border-outline-variant/30 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base text-tertiary">folder_open</span>
                <span>Scan Music Folder</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleClearFilters}
              className="mt-2 px-4 py-2 rounded-full bg-surface-container text-primary font-medium text-xs hover:bg-surface-container-high transition-colors border border-primary/30"
            >
              Reset Search and Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs" aria-label="Audio Tracks Table">
            <thead className="bg-surface-container/60 text-outline text-[11px] font-medium border-b border-outline-variant/20">
              <tr>
                <th
                  onClick={() => handleSortChange('trackNumber')}
                  className="py-3 px-4 w-12 text-center cursor-pointer hover:text-on-surface"
                  title="Sort by track number"
                >
                  #
                </th>
                <th
                  onClick={() => handleSortChange('title')}
                  className="py-3 px-4 cursor-pointer hover:text-on-surface"
                  title="Sort by title"
                >
                  <span className="inline-flex items-center gap-1">
                    Title
                    {sortField === 'title' && (
                      <span className="material-symbols-outlined text-xs text-primary">
                        {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSortChange('album')}
                  className="py-3 px-4 hidden md:table-cell cursor-pointer hover:text-on-surface"
                  title="Sort by album"
                >
                  <span className="inline-flex items-center gap-1">
                    Album
                    {sortField === 'album' && (
                      <span className="material-symbols-outlined text-xs text-primary">
                        {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </span>
                </th>
                <th className="py-3 px-4 hidden sm:table-cell">Format</th>
                <th
                  onClick={() => handleSortChange('duration')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-on-surface"
                  title="Sort by duration"
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Time
                    {sortField === 'duration' && (
                      <span className="material-symbols-outlined text-xs text-primary">
                        {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </span>
                </th>
                <th className="py-3 px-4 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredAndSortedTracks.map((track, idx) => {
                const isPlaying = playbackState.currentTrackId === track.id && playbackState.isPlaying;
                return (
                  <tr
                    key={track.id}
                    onClick={() => {
                      if (playbackState.currentTrackId === track.id) {
                        togglePlayPause();
                      } else {
                        playFromLibrary(track.id, filteredAndSortedTracks);
                      }
                    }}
                    className={`hover:bg-surface-container/50 transition-colors cursor-pointer group ${
                      isPlaying ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-outline">
                      {isPlaying ? (
                        <span className="material-symbols-outlined text-sm text-primary animate-pulse">
                          volume_up
                        </span>
                      ) : (
                        track.trackNumber || idx + 1
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {track.pictureDataUrl ? (
                          <img
                            src={track.pictureDataUrl}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover shrink-0 border border-outline-variant/20"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-outline">
                            <span className="material-symbols-outlined text-base">music_note</span>
                          </div>
                        )}
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
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (playbackState.currentTrackId === track.id) {
                              togglePlayPause();
                            } else {
                              playFromLibrary(track.id, filteredAndSortedTracks);
                            }
                          }}
                          className="w-7 h-7 rounded-full hover:bg-surface-container text-outline hover:text-primary flex items-center justify-center transition-colors"
                          aria-label={`${isPlaying ? 'Pause' : 'Play'} ${track.title}`}
                          title={`${isPlaying ? 'Pause' : 'Play'} ${track.title}`}
                        >
                          <span className="material-symbols-outlined text-base">
                            {isPlaying ? 'pause' : 'play_arrow'}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(track.id);
                          }}
                          className="w-7 h-7 rounded-full hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center"
                          aria-label={`Add ${track.title} to queue`}
                          title="Add to queue"
                        >
                          <span className="material-symbols-outlined text-sm">playlist_add</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaylistModalTrack(track);
                          }}
                          className="w-7 h-7 rounded-full hover:bg-surface-container text-outline hover:text-primary flex items-center justify-center"
                          aria-label={`Add ${track.title} to playlist`}
                          title="Add to playlist"
                        >
                          <span className="material-symbols-outlined text-sm">queue_music</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTrackModal(track);
                          }}
                          className="w-7 h-7 rounded-full hover:bg-surface-container text-outline hover:text-primary flex items-center justify-center transition-colors"
                          aria-label={`Edit metadata for ${track.title}`}
                          title="Edit metadata"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrackFromLibrary(track.id);
                          }}
                          className="w-7 h-7 rounded-full hover:bg-surface-container text-outline hover:text-error opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          aria-label={`Remove ${track.title} from library index`}
                          title="Remove from GhostWave library index"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid of Album Cards */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAndSortedTracks.map((track) => {
            const isPlaying = playbackState.currentTrackId === track.id && playbackState.isPlaying;
            return (
              <div
                key={track.id}
                onClick={() => {
                  if (playbackState.currentTrackId === track.id) {
                    togglePlayPause();
                  } else {
                    playFromLibrary(track.id, filteredAndSortedTracks);
                  }
                }}
                className={`p-3 rounded-2xl bg-surface-container-low border hover:border-primary/40 transition-all cursor-pointer flex flex-col gap-2.5 group ${
                  isPlaying ? 'border-primary/50 bg-primary/5' : 'border-outline-variant/20'
                }`}
              >
                <div className="w-full aspect-square rounded-xl bg-surface-container flex items-center justify-center relative overflow-hidden shadow-sm">
                  {track.pictureDataUrl ? (
                    <img
                      src={track.pictureDataUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-outline/60 group-hover:scale-110 transition-transform">
                      album
                    </span>
                  )}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTrackModal(track);
                      }}
                      className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface hover:text-primary flex items-center justify-center shadow-lg"
                      title="Edit metadata"
                      aria-label={`Edit metadata for ${track.title}`}
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaylistModalTrack(track);
                      }}
                      className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface hover:text-primary flex items-center justify-center shadow-lg"
                      title="Add to playlist"
                      aria-label="Add to playlist"
                    >
                      <span className="material-symbols-outlined text-base">queue_music</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(track.id);
                      }}
                      className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface hover:text-primary flex items-center justify-center shadow-lg"
                      title="Add to queue"
                      aria-label="Add to queue"
                    >
                      <span className="material-symbols-outlined text-base">playlist_add</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (playbackState.currentTrackId === track.id) {
                          togglePlayPause();
                        } else {
                          playTrack(track.id);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg"
                      aria-label={`${isPlaying ? 'Pause' : 'Play'} ${track.title}`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`font-semibold text-xs truncate ${
                      isPlaying ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {track.title}
                  </span>
                  <span className="text-[11px] text-on-surface-variant truncate mt-0.5">
                    {track.artist}
                  </span>
                  <span className="text-[10px] text-outline font-mono mt-1 flex items-center justify-between">
                    <span className="uppercase">{track.format}</span>
                    <span>
                      {Math.floor(track.durationSeconds / 60)}:
                      {(track.durationSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
