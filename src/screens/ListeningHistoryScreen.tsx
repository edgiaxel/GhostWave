import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const ListeningHistoryScreen: React.FC = () => {
  const {
    tracks,
    playbackHistory,
    listeningStats,
    recommendations,
    clearPlaybackHistory,
    toggleHistoryTracking,
    playTrack,
    addToQueue,
    generateAiHistorySummary,
    settings,
    aiConnection,
    addToast,
  } = useApp();

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'recent' | 'top'>('recommendations');

  const isTrackingEnabled = settings.history?.enabled !== false;

  const handleClearHistory = async () => {
    if (playbackHistory.length === 0) return;
    const confirmed = window.confirm('Clear all local playback history? This will reset all listening statistics and recommendations.');
    if (confirmed) {
      await clearPlaybackHistory();
      setAiSummary(null);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const summary = await generateAiHistorySummary();
      setAiSummary(summary);
      addToast({
        title: 'Taste Profile Ready',
        message: 'Updated listening personality profile.',
        type: 'info',
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const formatSeconds = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatTimestamp = (ts: number): string => {
    const now = Date.now();
    const diffMs = now - ts;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-8">
      {/* Top Banner & Local Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            Listening History &amp; Trends
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            100% private, offline playback analytics and transparent music discovery
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Tracking toggle */}
          <button
            onClick={() => toggleHistoryTracking(!isTrackingEnabled)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isTrackingEnabled
                ? 'bg-secondary/15 text-secondary border-secondary/30'
                : 'bg-surface-container text-outline border-outline-variant/30 hover:text-on-surface'
            }`}
            title="Toggle offline history logging"
          >
            <span className="material-symbols-outlined text-sm">
              {isTrackingEnabled ? 'history' : 'history_toggle_off'}
            </span>
            <span>{isTrackingEnabled ? 'Tracking Active' : 'Tracking Paused'}</span>
          </button>

          {/* Clear history */}
          <button
            onClick={handleClearHistory}
            disabled={playbackHistory.length === 0}
            className="px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-error/15 text-xs text-outline hover:text-error font-medium transition-colors border border-outline-variant/20 disabled:opacity-40 flex items-center gap-1.5"
            title="Delete all local playback history records"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-outline font-medium">Total Sessions</span>
            <span className="material-symbols-outlined text-primary text-lg">play_circle</span>
          </div>
          <span className="font-headline font-bold text-3xl text-on-surface mt-1">
            {listeningStats.totalPlays}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            {listeningStats.totalCompletedPlays} completed ({listeningStats.totalPlays > 0 ? Math.round((listeningStats.totalCompletedPlays / listeningStats.totalPlays) * 100) : 0}%)
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-outline font-medium">Time Listened</span>
            <span className="material-symbols-outlined text-secondary text-lg">schedule</span>
          </div>
          <span className="font-headline font-bold text-3xl text-secondary mt-1">
            {formatSeconds(listeningStats.totalListenTimeSeconds)}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            Offline lossless playback
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-outline font-medium">Skip Rate</span>
            <span className="material-symbols-outlined text-tertiary text-lg">skip_next</span>
          </div>
          <span className="font-headline font-bold text-3xl text-tertiary mt-1">
            {Math.round(listeningStats.skipRate * 100)}%
          </span>
          <span className="text-[11px] text-on-surface-variant">
            {listeningStats.totalSkips} tracks skipped before 30s
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-outline font-medium">Top Genre</span>
            <span className="material-symbols-outlined text-primary text-lg">graphic_eq</span>
          </div>
          <span className="font-headline font-bold text-2xl text-primary mt-1 truncate">
            {listeningStats.topGenres[0]?.genre || 'None yet'}
          </span>
          <span className="text-[11px] text-on-surface-variant truncate">
            {listeningStats.topArtists[0]?.artist ? `Fav: ${listeningStats.topArtists[0].artist}` : 'Explore more music'}
          </span>
        </div>
      </div>

      {/* Taste Profile & Optional AI Summary */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">psychology</span>
            <h2 className="font-headline font-semibold text-sm text-on-surface">Listening Taste Profile</h2>
          </div>

          <button
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary || playbackHistory.length === 0}
            className="px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-on-surface font-medium transition-colors border border-outline-variant/30 flex items-center gap-1.5 disabled:opacity-40 self-start sm:self-auto"
            title={aiConnection.isAvailable ? 'Generate creative summary with local Gemma model' : 'Generate deterministic summary'}
          >
            <span className={`material-symbols-outlined text-sm text-secondary ${isGeneratingSummary ? 'animate-spin' : ''}`}>
              {aiConnection.isAvailable ? 'smart_toy' : 'summarize'}
            </span>
            <span>{isGeneratingSummary ? 'Analyzing...' : aiConnection.isAvailable ? 'AI Taste Summary' : 'Refresh Summary'}</span>
          </button>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          {aiSummary || (
            listeningStats.totalPlays > 0
              ? `Listened to ${formatSeconds(listeningStats.totalListenTimeSeconds)} across ${listeningStats.totalPlays} sessions. Your top genre is "${listeningStats.topGenres[0]?.genre || 'Eclectic'}" with a ${Math.round(listeningStats.skipRate * 100)}% skip rate.`
              : 'Start playing tracks in your library to unlock deterministic taste insights and offline recommendations.'
          )}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'recommendations'
              ? 'bg-primary/15 text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-base">auto_awesome</span>
          <span>Transparent Recommendations</span>
          <span className="text-[11px] opacity-75">({recommendations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'recent'
              ? 'bg-primary/15 text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-base">history</span>
          <span>Playback Event Log</span>
          <span className="text-[11px] opacity-75">({playbackHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('top')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'top'
              ? 'bg-primary/15 text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-base">leaderboard</span>
          <span>Top Genres &amp; Artists</span>
        </button>
      </div>

      {/* TAB 1: RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              Recommendations are computed locally using your play counts, completion rates, and genre affinity. Zero telemetry is sent outside your device.
            </span>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col items-center justify-center text-center gap-3">
              <span className="material-symbols-outlined text-4xl text-outline">queue_music</span>
              <h2 className="font-headline font-semibold text-base text-on-surface">No Recommendations Yet</h2>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Add audio tracks to your library and start listening to see personalized offline recommendations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((item) => (
                <div
                  key={item.track.id}
                  className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 transition-all flex flex-col justify-between gap-3 shadow-sm group"
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Basis and Score pill */}
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-semibold font-mono uppercase">
                        {item.basis.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-outline">
                        {Math.round(item.score * 100)}% Match
                      </span>
                    </div>

                    {/* Track info */}
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-on-surface truncate">
                        {item.track.title}
                      </span>
                      <span className="text-[11px] text-on-surface-variant truncate mt-0.5">
                        {item.track.artist}
                      </span>
                      <span className="text-[10px] text-outline truncate mt-0.5">
                        {item.track.album}
                      </span>
                    </div>

                    {/* Transparent Rationale Box */}
                    <div className="p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/15 text-[11px] text-on-surface-variant leading-relaxed">
                      <div className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-primary text-xs mt-0.5 shrink-0">info</span>
                        <span>{item.rationale}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-outline font-mono text-[10px] uppercase font-semibold">
                      {item.track.format}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => addToQueue(item.track.id)}
                        className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-colors"
                        title="Add to Queue"
                        aria-label={`Add ${item.track.title} to queue`}
                      >
                        <span className="material-symbols-outlined text-sm">playlist_add</span>
                      </button>
                      <button
                        onClick={() => playTrack(item.track.id)}
                        className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity"
                        title="Play Now"
                        aria-label={`Play ${item.track.title}`}
                      >
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECENT PLAYBACK EVENTS */}
      {activeTab === 'recent' && (
        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/20 overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface">
              Raw Local Playback Events ({playbackHistory.length})
            </span>
            <span className="text-[11px] text-outline font-mono">
              IndexedDB local store
            </span>
          </div>

          {playbackHistory.length === 0 ? (
            <div className="p-12 text-center text-xs text-outline">
              Zero playback events recorded. Play tracks to populate the private event log.
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10 text-xs">
              {playbackHistory.map((ev) => {
                const trk = tracks.find((t) => t.id === ev.trackId);
                const isCompleted = ev.eventType === 'completed';
                const isSkipped = ev.eventType === 'skipped';
                return (
                  <div key={ev.id} className="p-3.5 hover:bg-surface-container/40 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted
                            ? 'bg-secondary/15 text-secondary'
                            : isSkipped
                            ? 'bg-tertiary/15 text-tertiary'
                            : 'bg-surface-container text-outline'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isCompleted ? 'check_circle' : isSkipped ? 'skip_next' : 'play_arrow'}
                        </span>
                      </span>

                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-on-surface truncate">
                          {trk?.title || ev.trackId}
                        </span>
                        <span className="text-[11px] text-on-surface-variant truncate">
                          {trk?.artist || 'Unknown Artist'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono text-[11px] text-outline">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                          isCompleted
                            ? 'bg-secondary/15 text-secondary'
                            : isSkipped
                            ? 'bg-tertiary/15 text-tertiary'
                            : 'bg-surface-container text-outline'
                        }`}
                      >
                        {ev.eventType}
                      </span>
                      <span>{ev.durationPlayedSeconds}s played</span>
                      <span className="hidden sm:inline">{formatTimestamp(ev.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TOP GENRES & ARTISTS */}
      {activeTab === 'top' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Genres */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3 shadow-sm">
            <span className="text-xs font-semibold text-on-surface">Top Genres</span>
            {listeningStats.topGenres.length === 0 ? (
              <p className="text-xs text-outline py-4">No genre statistics available yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {listeningStats.topGenres.map((g, idx) => (
                  <div key={g.genre} className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-container/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-outline w-4 text-center">{idx + 1}</span>
                      <span className="font-medium text-on-surface truncate">{g.genre}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-outline">
                      <span>{g.count} plays</span>
                      <span>{formatSeconds(g.durationSeconds)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Artists */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3 shadow-sm">
            <span className="text-xs font-semibold text-on-surface">Top Artists</span>
            {listeningStats.topArtists.length === 0 ? (
              <p className="text-xs text-outline py-4">No artist statistics available yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {listeningStats.topArtists.map((a, idx) => (
                  <div key={a.artist} className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-container/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-outline w-4 text-center">{idx + 1}</span>
                      <span className="font-medium text-on-surface truncate">{a.artist}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-outline">
                      <span>{a.count} plays</span>
                      <span>{formatSeconds(a.durationSeconds)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
