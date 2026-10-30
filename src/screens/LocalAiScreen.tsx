import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlaylistProposalResult, AiPlaylistService } from '../services/ai/AiPlaylistService';

export const LocalAiScreen: React.FC = () => {
  const {
    settings,
    tracks,
    addToast,
    aiConnection,
    setRoute,
    generateAiPlaylistProposal,
    saveAiPlaylist,
  } = useApp();

  const [prompt, setPrompt] = useState('Halloween playlist under 45 minutes');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [proposalResult, setProposalResult] = useState<PlaylistProposalResult | null>(null);
  const [editedTitle, setEditedTitle] = useState('');

  const samplePrompts = [
    'Halloween playlist under 45 minutes',
    'Fast electronic workout tracks in FLAC',
    'Dark ambient synth under 30 minutes',
    'Lossless 24-bit FLAC tracks',
    'Acoustic chill evening mix',
  ];

  const handleRunPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      if (aiConnection.isAvailable) {
        const result = await generateAiPlaylistProposal(prompt);
        setProposalResult(result);
        setEditedTitle(result.plan.name);
        addToast({
          title: 'Playlist Proposal Ready',
          message: `Generated "${result.plan.name}" with ${result.resolvedTracks.length} tracks via ${result.modelUsed}.`,
          type: 'success',
        });
      } else {
        const fallbackPlan = {
          name: prompt.length > 30 ? `${prompt.slice(0, 28)}...` : prompt,
          description: `Offline playlist created from query: "${prompt}"`,
          filters: {
            keywords: prompt.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
          },
          constraints: {
            maxDurationMinutes: prompt.includes('45') ? 45 : prompt.includes('30') ? 30 : 60,
          },
          matchedTrackIds: tracks.slice(0, 4).map((t) => t.id),
          explanation: 'Offline fallback: matched local tracks deterministically without remote AI inference.',
        };

        const { resolvedTracks, totalDurationSeconds, hallucinatedTrackIds } =
          AiPlaylistService.resolveTracks(fallbackPlan, tracks);

        const minutes = Math.floor(totalDurationSeconds / 60);
        const seconds = totalDurationSeconds % 60;

        const offlineResult: PlaylistProposalResult = {
          plan: fallbackPlan,
          resolvedTracks,
          totalDurationSeconds,
          formattedDuration: `${minutes}m ${seconds.toString().padStart(2, '0')}s`,
          hallucinatedTrackIds,
          isAiGenerated: false,
          modelUsed: 'offline-deterministic',
          durationMs: 15,
        };

        setProposalResult(offlineResult);
        setEditedTitle(offlineResult.plan.name);
        addToast({
          title: 'Offline Playlist Generated',
          message: 'Structured playlist proposal generated from local library index.',
          type: 'info',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      addToast({
        title: 'Playlist Query Failed',
        message: msg,
        type: 'warning',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCrate = async () => {
    if (!proposalResult || proposalResult.resolvedTracks.length === 0) return;
    try {
      const created = await saveAiPlaylist(proposalResult, editedTitle);
      addToast({
        title: 'Crate Saved',
        message: `Saved "${created.name}" with ${created.trackIds.length} tracks to Crates.`,
        type: 'success',
      });
      setRoute('playlists');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save crate';
      addToast({
        title: 'Save Failed',
        message: msg,
        type: 'error',
      });
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            Local AI Assistant
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Offline structured playlist curation via {settings.localAi.model}
          </p>
        </div>

        {/* Live Ollama Connection Pill */}
        <button
          onClick={() => setRoute('settings-platform')}
          className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/20 hover:border-primary/40 transition-colors self-start sm:self-auto"
          title="Click to configure Local AI runtime"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              aiConnection.isAvailable
                ? 'bg-secondary animate-pulse'
                : aiConnection.state === 'checking'
                ? 'bg-yellow-400'
                : 'bg-outline'
            }`}
          />
          <span className="text-on-surface">
            {aiConnection.isAvailable
              ? `Ollama Connected (${aiConnection.latencyMs ?? 0}ms)`
              : aiConnection.state === 'checking'
              ? 'Checking Ollama...'
              : 'Ollama Offline'}
          </span>
          <span className="material-symbols-outlined text-xs text-outline">tune</span>
        </button>
      </div>

      {/* Offline Notice Banner if Ollama is not connected */}
      {!aiConnection.isAvailable && (
        <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface-variant">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
              offline_bolt
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-on-surface">Local AI runtime is currently offline</span>
              <span className="text-[11px] leading-relaxed">
                GhostWave features deterministic local fallbacks when Ollama is offline. Run <span className="font-mono text-outline">ollama serve</span> to enable offline neural inference.
              </span>
            </div>
          </div>
          <button
            onClick={() => setRoute('settings-platform')}
            className="px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-medium text-xs border border-outline-variant/30 shrink-0 self-start sm:self-auto transition-colors"
          >
            Configure Runtime
          </button>
        </div>
      )}

      {/* Query Bar */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3.5 shadow-sm">
        <form onSubmit={handleRunPrompt} className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
              smart_toy
            </span>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Local AI to create a crate or filter music (e.g. Halloween playlist under 45 minutes)..."
              className="w-full bg-surface-container text-on-surface text-xs pl-10 pr-4 py-2.5 rounded-full outline-none border border-transparent focus:border-primary/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <span className={`material-symbols-outlined text-sm ${isGenerating ? 'animate-spin' : ''}`}>
              {isGenerating ? 'sync' : 'auto_awesome'}
            </span>
            <span>{isGenerating ? 'Curating...' : 'Generate Crate'}</span>
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-outline font-medium">Try:</span>
          {samplePrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPrompt(p);
              }}
              className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Proposal Preview Section */}
      {proposalResult && (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 flex flex-col gap-4 shadow-sm animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/15 pb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="font-headline font-bold text-lg text-on-surface bg-transparent border-b border-outline-variant/30 focus:border-primary outline-none px-0.5 py-0.5"
                  title="Click to rename crate proposal"
                />
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-mono text-outline uppercase font-semibold">
                  {proposalResult.modelUsed}
                </span>
              </div>
              <p className="text-xs text-outline font-mono mt-1">
                {proposalResult.plan.explanation}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowSchema(!showSchema)}
                className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-outline hover:text-on-surface transition-colors"
              >
                {showSchema ? 'Hide Schema' : 'Inspect Schema'}
              </button>
              <button
                type="button"
                onClick={handleSaveCrate}
                disabled={proposalResult.resolvedTracks.length === 0}
                className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">bookmark_add</span>
                <span>Save Crate ({proposalResult.resolvedTracks.length})</span>
              </button>
            </div>
          </div>

          {/* Constraint & Filter Breakdown Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-mono font-medium">
              Duration: {proposalResult.formattedDuration}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-mono font-medium">
              Tracks: {proposalResult.resolvedTracks.length}
            </span>

            {proposalResult.plan.constraints?.maxDurationMinutes && (
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono text-[11px]">
                Limit: &lt;= {proposalResult.plan.constraints.maxDurationMinutes}m
              </span>
            )}

            {proposalResult.plan.filters?.genres && proposalResult.plan.filters.genres.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-secondary/15 text-secondary font-mono text-[11px]">
                Genre: {proposalResult.plan.filters.genres.join(', ')}
              </span>
            )}

            {proposalResult.plan.filters?.formats && proposalResult.plan.filters.formats.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-tertiary/15 text-tertiary font-mono text-[11px]">
                Format: {proposalResult.plan.filters.formats.join(', ')}
              </span>
            )}

            {/* Hallucination Safety Rejection Notice */}
            {proposalResult.hallucinatedTrackIds.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-error/15 text-error font-mono text-[11px] flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified_user</span>
                <span>Filtered {proposalResult.hallucinatedTrackIds.length} hallucinated ID(s)</span>
              </span>
            )}
          </div>

          {/* Schema & Output Debug Inspector */}
          {showSchema && (
            <div className="p-4 rounded-xl bg-surface-container font-mono text-[11px] text-on-surface-variant overflow-x-auto border border-outline-variant/20 flex flex-col gap-2">
              <span className="font-semibold text-primary">Model Structured Plan:</span>
              <pre>{JSON.stringify(proposalResult.plan, null, 2)}</pre>
            </div>
          )}

          {/* Resolved Tracks Preview Table */}
          {proposalResult.resolvedTracks.length > 0 ? (
            <div className="flex flex-col divide-y divide-outline-variant/10">
              {proposalResult.resolvedTracks.map((trk, idx) => (
                <div
                  key={trk.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-surface-container/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-outline w-5 text-center">{idx + 1}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-on-surface truncate">{trk.title}</span>
                      <span className="text-[11px] text-on-surface-variant truncate">
                        {trk.artist} &bull; {trk.album}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] text-outline uppercase px-2 py-0.5 rounded bg-surface-container">
                      {trk.format}
                    </span>
                    <span className="font-mono text-xs text-outline">
                      {Math.floor(trk.durationSeconds / 60)}:
                      {(trk.durationSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-outline">
              No matching tracks found in local library for proposed query filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
