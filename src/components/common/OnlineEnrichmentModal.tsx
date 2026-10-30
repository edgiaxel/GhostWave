import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Track } from '../../types';
import { OnlineEnrichmentService } from '../../services/enrichment/OnlineEnrichmentService';
import {
  EnrichmentCandidate,
  CoverArtResult,
  LyricsResult,
} from '../../services/enrichment/types';

interface OnlineEnrichmentModalProps {
  track: Track | null;
  onClose: () => void;
}

export const OnlineEnrichmentModal: React.FC<OnlineEnrichmentModalProps> = ({ track, onClose }) => {
  const { addToast, updateTrackMetadata, settings } = useApp();

  const [searchTitle, setSearchTitle] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<EnrichmentCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<EnrichmentCandidate | null>(null);

  // Artwork & Lyrics state
  const [isLoadingArt, setIsLoadingArt] = useState(false);
  const [coverArt, setCoverArt] = useState<CoverArtResult | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
  const [activeTab, setActiveTab] = useState<'metadata' | 'artwork' | 'lyrics'>('metadata');
  const [lyricsMode, setLyricsMode] = useState<'plain' | 'synced'>('plain');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (track) {
      setSearchTitle(track.title || track.fileName.replace(/\.[^/.]+$/, ''));
      setSearchArtist(track.artist === 'Unknown Artist' ? '' : track.artist);
      setCandidates([]);
      setSelectedCandidate(null);
      setCoverArt(null);
      setLyrics(null);
      setErrorMessage(null);
      setActiveTab('metadata');

      // Auto trigger initial search if track has a title
      if (track.title || track.fileName) {
        handleSearch(track.title || track.fileName.replace(/\.[^/.]+$/, ''), track.artist);
      }
    }
  }, [track]);

  if (!track) return null;

  const handleSearch = async (titleQuery?: string, artistQuery?: string) => {
    const qTitle = titleQuery !== undefined ? titleQuery : searchTitle;
    const qArtist = artistQuery !== undefined ? artistQuery : searchArtist;

    if (!qTitle.trim() && !qArtist.trim()) {
      setErrorMessage('Please enter a track title or artist to search.');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setSelectedCandidate(null);
    setCoverArt(null);
    setLyrics(null);

    const service = new OnlineEnrichmentService(settings.onlineEnrichment.provider === 'none' ? undefined : undefined);

    try {
      const results = await service.searchCandidates({
        title: qTitle.trim(),
        artist: qArtist.trim(),
      });

      setCandidates(results);
      if (results.length > 0) {
        setSelectedCandidate(results[0]);
        // Auto-fetch artwork and lyrics for best candidate
        if (results[0].releaseId) {
          fetchArtwork(results[0].releaseId);
        }
        fetchLyrics(results[0].title, results[0].artist);
      } else {
        setErrorMessage('No matching recordings found on MusicBrainz. Try refining query terms.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search failed';
      setErrorMessage(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchArtwork = async (releaseId: string) => {
    setIsLoadingArt(true);
    const service = new OnlineEnrichmentService();
    try {
      const art = await service.fetchCoverArt(releaseId);
      setCoverArt(art);
    } finally {
      setIsLoadingArt(false);
    }
  };

  const fetchLyrics = async (title: string, artist: string) => {
    setIsLoadingLyrics(true);
    const service = new OnlineEnrichmentService();
    try {
      const lyr = await service.fetchLyrics(title, artist, track.album, track.durationSeconds);
      setLyrics(lyr);
      if (lyr?.isSynced) {
        setLyricsMode('synced');
      } else {
        setLyricsMode('plain');
      }
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const handleSelectCandidate = (candidate: EnrichmentCandidate) => {
    setSelectedCandidate(candidate);
    setCoverArt(null);
    setLyrics(null);
    if (candidate.releaseId) {
      fetchArtwork(candidate.releaseId);
    }
    fetchLyrics(candidate.title, candidate.artist);
  };

  const handleApplyCandidate = async () => {
    if (!selectedCandidate) return;

    const updates: Partial<Track> = {
      title: selectedCandidate.title,
      artist: selectedCandidate.artist,
      album: selectedCandidate.album || track.album,
      year: selectedCandidate.year || track.year,
      trackNumber: selectedCandidate.trackNumber || track.trackNumber,
    };

    if (coverArt?.fullUrl) {
      updates.pictureDataUrl = coverArt.fullUrl;
      updates.hasEmbeddedPicture = true;
    }

    const res = await updateTrackMetadata(track.id, updates);
    if (res.success) {
      addToast({
        title: 'Metadata Enriched',
        message: `Applied MusicBrainz tags to "${selectedCandidate.title}".`,
        type: 'success',
      });
      onClose();
    } else {
      addToast({
        title: 'Update Failed',
        message: res.error || 'Unable to update metadata.',
        type: 'error',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="online-enrichment-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-on-surface max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl">travel_explore</span>
            <div>
              <h2 id="online-enrichment-title" className="font-headline font-bold text-base text-on-surface">
                Online MusicBrainz Enrichment
              </h2>
              <p className="text-xs text-on-surface-variant font-mono">
                Safe external candidate lookup &bull; MusicBrainz, Cover Art Archive &amp; LRCLIB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:text-on-surface transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Search Query Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20"
        >
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="Track title..."
              className="flex-1 bg-surface-container text-on-surface text-xs px-3 py-2 rounded-lg border border-outline-variant/20 outline-none focus:border-primary/50"
            />
            <input
              type="text"
              value={searchArtist}
              onChange={(e) => setSearchArtist(e.target.value)}
              placeholder="Artist name..."
              className="flex-1 bg-surface-container text-on-surface text-xs px-3 py-2 rounded-lg border border-outline-variant/20 outline-none focus:border-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 transition-all"
          >
            <span className={`material-symbols-outlined text-sm ${isSearching ? 'animate-spin' : ''}`}>
              {isSearching ? 'sync' : 'search'}
            </span>
            <span>{isSearching ? 'Searching...' : 'Search Online'}</span>
          </button>
        </form>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-tertiary/10 border border-tertiary/30 text-xs text-on-surface flex items-start gap-2">
            <span className="material-symbols-outlined text-tertiary text-base mt-0.5">info</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Candidates List */}
        {candidates.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider">
              Candidate Matches ({candidates.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {candidates.map((cand) => {
                const isSelected = selectedCandidate?.id === cand.id;
                return (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => handleSelectCandidate(cand)}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-outline-variant/20 bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-on-surface truncate">
                        {cand.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          cand.confidence >= 0.85
                            ? 'bg-secondary/15 text-secondary'
                            : 'bg-tertiary/15 text-tertiary'
                        }`}
                      >
                        {Math.round(cand.confidence * 100)}%
                      </span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {cand.artist} &bull; {cand.album || 'Single / Unknown Album'}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-outline font-mono mt-0.5">
                      <span>{cand.year ? cand.year : 'Year n/a'}</span>
                      <span>&bull;</span>
                      <span className="truncate">{cand.source}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Candidate Inspector (Tabs: Metadata Diff / Artwork / Lyrics) */}
        {selectedCandidate && (
          <div className="flex flex-col gap-3.5 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
            {/* Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-outline-variant/15 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('metadata')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'metadata'
                    ? 'bg-primary/15 text-primary'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">difference</span>
                <span>Tag Diff</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('artwork')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'artwork'
                    ? 'bg-primary/15 text-primary'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">image</span>
                <span>Artwork Preview</span>
                {coverArt && <span className="w-1.5 h-1.5 rounded-full bg-secondary" />}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('lyrics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'lyrics'
                    ? 'bg-primary/15 text-primary'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">lyrics</span>
                <span>Lyrics</span>
                {lyrics && <span className="w-1.5 h-1.5 rounded-full bg-secondary" />}
              </button>
            </div>

            {/* TAB 1: TAG DIFF */}
            {activeTab === 'metadata' && (
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-outline-variant/10 text-[11px] text-outline font-medium">
                  <span>Field</span>
                  <span>Current Local Value</span>
                  <span>Proposed Online Value</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  <span className="font-semibold text-primary uppercase font-mono text-[11px]">Title</span>
                  <span className="text-on-surface-variant line-through">{track.title || '(empty)'}</span>
                  <span className="text-secondary font-semibold">{selectedCandidate.title}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  <span className="font-semibold text-primary uppercase font-mono text-[11px]">Artist</span>
                  <span className="text-on-surface-variant line-through">{track.artist || '(empty)'}</span>
                  <span className="text-secondary font-semibold">{selectedCandidate.artist}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  <span className="font-semibold text-primary uppercase font-mono text-[11px]">Album</span>
                  <span className="text-on-surface-variant line-through">{track.album || '(empty)'}</span>
                  <span className="text-secondary font-semibold">{selectedCandidate.album || '(no album)'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  <span className="font-semibold text-primary uppercase font-mono text-[11px]">Year</span>
                  <span className="text-on-surface-variant line-through">{track.year || '(empty)'}</span>
                  <span className="text-secondary font-semibold">{selectedCandidate.year || '(unknown)'}</span>
                </div>
              </div>
            )}

            {/* TAB 2: ARTWORK PREVIEW */}
            {activeTab === 'artwork' && (
              <div className="flex flex-col items-center justify-center p-4 gap-3 text-center">
                {isLoadingArt ? (
                  <div className="flex items-center gap-2 text-xs text-outline font-mono">
                    <span className="material-symbols-outlined text-lg animate-spin text-primary">sync</span>
                    <span>Querying Cover Art Archive...</span>
                  </div>
                ) : coverArt ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={coverArt.thumbnailUrl}
                      alt="Front Album Artwork Preview"
                      className="w-32 h-32 rounded-xl object-cover shadow-md border border-outline-variant/30"
                    />
                    <div className="text-left flex flex-col gap-1 text-xs">
                      <span className="font-semibold text-on-surface">Verified Community Artwork</span>
                      <span className="text-outline text-[11px]">Source: {coverArt.source}</span>
                      <span className="text-[10px] text-outline font-mono">MBID: {coverArt.releaseId}</span>
                      <span className="text-[11px] text-secondary mt-1">
                        Will be cached and embedded with track upon approval.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-outline">
                    Zero community artwork files found for this release in Cover Art Archive.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LYRICS PREVIEW */}
            {activeTab === 'lyrics' && (
              <div className="flex flex-col gap-2.5">
                {isLoadingLyrics ? (
                  <div className="flex items-center gap-2 text-xs text-outline font-mono p-4 justify-center">
                    <span className="material-symbols-outlined text-lg animate-spin text-primary">sync</span>
                    <span>Querying LRCLIB open lyrics database...</span>
                  </div>
                ) : lyrics ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-primary">
                        {lyrics.isSynced ? 'Synchronized Lyrics Available' : 'Plain Text Lyrics'}
                      </span>
                      {lyrics.isSynced && (
                        <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => setLyricsMode('synced')}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                              lyricsMode === 'synced'
                                ? 'bg-primary text-on-primary'
                                : 'text-outline hover:text-on-surface'
                            }`}
                          >
                            LRC Timestamps
                          </button>
                          <button
                            type="button"
                            onClick={() => setLyricsMode('plain')}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                              lyricsMode === 'plain'
                                ? 'bg-primary text-on-primary'
                                : 'text-outline hover:text-on-surface'
                            }`}
                          >
                            Plain
                          </button>
                        </div>
                      )}
                    </div>

                    <pre className="p-3 bg-surface-container rounded-xl text-xs font-mono text-on-surface max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-outline-variant/20">
                      {lyricsMode === 'synced' && lyrics.syncedLyrics
                        ? lyrics.syncedLyrics
                        : lyrics.plainLyrics}
                    </pre>

                    <span className="text-[10px] text-outline italic">
                      {lyrics.disclaimer}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-outline text-center p-4">
                    Zero open lyrics entries found on LRCLIB for this track.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <span className="text-[11px] text-outline font-mono">
            Never silently overwrites without user confirmation.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCandidate}
              disabled={!selectedCandidate}
              className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>Apply Online Metadata</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
